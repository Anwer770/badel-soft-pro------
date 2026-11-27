/* =====================================================================
   80_triggers.sql — قواعد السلامة المحاسبية والمخزنية (ACID)
   1) لا ترحيل لقيد غير متوازن أو بأقل من سطرين.
   2) لا تعديل على سطور قيد مُرحَّل (يجب إلغاء الترحيل أولاً).
   3) تحديث UpdatedAt/EditCount آليًا للفواتير.
   4) منع الرصيد السالب للمخزون.
   ===================================================================== */
USE BadelErp;
GO

/* ------------------- (1) التحقق من توازن القيد عند الترحيل ------------- */
CREATE OR ALTER TRIGGER dbo.trg_journal_entries_check_post
ON dbo.journal_entries
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        LEFT JOIN
        (
            SELECT
                l.EntryId,
                LinesCount = COUNT(*),
                DebitSum   = SUM(l.Debit),
                CreditSum  = SUM(l.Credit)
            FROM dbo.journal_lines AS l
            GROUP BY l.EntryId
        ) AS t ON t.EntryId = i.EntryId
        WHERE i.Status = N'posted'
          AND (ISNULL(t.LinesCount, 0) < 2 OR ISNULL(t.DebitSum, 0) <> ISNULL(t.CreditSum, 0))
    )
    BEGIN
        THROW 51000, N'لا يمكن ترحيل قيد غير متوازن (المدين ≠ الدائن) أو بأقل من سطرين.', 1;
    END;
END;
GO

/* ------------------ (2) منع تعديل سطور قيد مُرحَّل --------------------- */
CREATE OR ALTER TRIGGER dbo.trg_journal_lines_locked
ON dbo.journal_lines
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM
        (
            SELECT EntryId FROM inserted
            UNION ALL
            SELECT EntryId FROM deleted
        ) AS x
        INNER JOIN dbo.journal_entries AS e ON e.EntryId = x.EntryId
        WHERE e.Status = N'posted'
    )
    BEGIN
        THROW 51001, N'القيد مُرحَّل — لا يمكن تعديل سطوره. ألغِ الترحيل أولاً.', 1;
    END;
END;
GO

/* -------------------- (3) بصمة التعديل على الفواتير -------------------- */
CREATE OR ALTER TRIGGER dbo.trg_invoices_touch
ON dbo.invoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF TRIGGER_NESTLEVEL() > 1
        RETURN;

    UPDATE inv
       SET inv.UpdatedAt = SYSUTCDATETIME(),
           inv.EditCount = inv.EditCount + 1
    FROM dbo.invoices AS inv
    INNER JOIN inserted AS i ON i.InvoiceId = inv.InvoiceId
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM deleted AS d
        WHERE d.InvoiceId = i.InvoiceId
          AND d.Status <> i.Status
    );
END;
GO

/* --------------------- (4) منع الرصيد السالب للمخزون ------------------ */
CREATE OR ALTER TRIGGER dbo.trg_stock_movements_no_negative
ON dbo.stock_movements
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.v_item_stock AS st
        INNER JOIN inserted AS i
                ON i.ItemId = st.ItemId
               AND i.WarehouseId = st.WarehouseId
        WHERE st.Qty < 0
    )
    BEGIN
        THROW 51002, N'حركة المخزون تُنتج رصيدًا سالبًا — تحقق من الكمية المتاحة.', 1;
    END;
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'80_triggers', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'80_triggers');
GO
