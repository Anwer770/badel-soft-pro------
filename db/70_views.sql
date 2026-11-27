/* =====================================================================
   70_views.sql — العروض المحسوبة (بديل تخزين الأرصدة داخل AccTree/MatTree)
   الأرصدة تُحسب دائمًا من القيود والحركات ⇒ لا تعارض ولا أرصدة قديمة.
   ===================================================================== */
USE BadelErp;
GO

/* ---------------------- أرصدة الحسابات (حركة تراكمية) ------------------ */
CREATE OR ALTER VIEW dbo.v_account_balances
AS
SELECT
    a.CompanyId,
    a.AccountId,
    a.Code,
    a.NameAr,
    a.Nature,
    a.IsLeaf,
    OpeningDebit  = a.OpeningDebit,
    OpeningCredit = a.OpeningCredit,
    Debit         = ISNULL(m.Debit, 0),
    Credit        = ISNULL(m.Credit, 0),
    Balance       = CAST((a.OpeningDebit - a.OpeningCredit) + (ISNULL(m.Debit, 0) - ISNULL(m.Credit, 0)) AS DECIMAL(18,4))
FROM dbo.accounts AS a
LEFT JOIN
(
    SELECT
        l.AccountId,
        Debit  = SUM(l.DebitBase),
        Credit = SUM(l.CreditBase)
    FROM dbo.journal_lines AS l
    INNER JOIN dbo.journal_entries AS e ON e.EntryId = l.EntryId
    WHERE e.Status = N'posted'
    GROUP BY l.AccountId
) AS m ON m.AccountId = a.AccountId;
GO

/* ----------------------------- ميزان المراجعة -------------------------- */
CREATE OR ALTER VIEW dbo.v_trial_balance
AS
SELECT
    b.CompanyId,
    b.AccountId,
    b.Code,
    b.NameAr,
    b.Nature,
    b.OpeningDebit,
    b.OpeningCredit,
    b.Debit,
    b.Credit,
    TotalDebit  = CAST(b.OpeningDebit + b.Debit AS DECIMAL(18,4)),
    TotalCredit = CAST(b.OpeningCredit + b.Credit AS DECIMAL(18,4)),
    b.Balance
FROM dbo.v_account_balances AS b
WHERE b.IsLeaf = 1;
GO

/* --------------------------- أرصدة الأطراف ----------------------------- */
CREATE OR ALTER VIEW dbo.v_party_balances
AS
SELECT
    p.CompanyId,
    p.PartyId,
    p.Code,
    p.NameAr,
    p.PartyType,
    p.CreditLimit,
    Balance = CAST(ISNULL(SUM(l.DebitBase - l.CreditBase), 0) AS DECIMAL(18,4))
FROM dbo.parties AS p
LEFT JOIN dbo.journal_lines AS l ON l.PartyId = p.PartyId
LEFT JOIN dbo.journal_entries AS e ON e.EntryId = l.EntryId AND e.Status = N'posted'
GROUP BY p.CompanyId, p.PartyId, p.Code, p.NameAr, p.PartyType, p.CreditLimit;
GO

/* ---------------------- مخزون المادة حسب المستودع ---------------------- */
CREATE OR ALTER VIEW dbo.v_item_stock
AS
SELECT
    w.CompanyId,
    s.WarehouseId,
    w.NameAr AS WarehouseName,
    s.ItemId,
    i.Code   AS ItemCode,
    i.NameAr AS ItemName,
    Qty          = CAST(SUM(CASE WHEN s.Direction = N'I' THEN s.QtyBase ELSE -s.QtyBase END) AS DECIMAL(18,4)),
    StockValue   = CAST(SUM(CASE WHEN s.Direction = N'I' THEN s.TotalCost ELSE -s.TotalCost END) AS DECIMAL(18,4)),
    AvgUnitCost  = CAST(
                        CASE
                            WHEN SUM(CASE WHEN s.Direction = N'I' THEN s.QtyBase ELSE -s.QtyBase END) = 0 THEN 0
                            ELSE SUM(CASE WHEN s.Direction = N'I' THEN s.TotalCost ELSE -s.TotalCost END)
                                 / SUM(CASE WHEN s.Direction = N'I' THEN s.QtyBase ELSE -s.QtyBase END)
                        END AS DECIMAL(18,6)),
    LastMovement = MAX(s.MovementDate)
FROM dbo.stock_movements AS s
INNER JOIN dbo.warehouses AS w ON w.WarehouseId = s.WarehouseId
INNER JOIN dbo.items AS i ON i.ItemId = s.ItemId
GROUP BY w.CompanyId, s.WarehouseId, w.NameAr, s.ItemId, i.Code, i.NameAr;
GO

/* --------------------------- المواد تحت الحد --------------------------- */
CREATE OR ALTER VIEW dbo.v_item_shortages
AS
SELECT
    st.CompanyId,
    st.ItemId,
    st.ItemCode,
    st.ItemName,
    st.WarehouseId,
    st.WarehouseName,
    st.Qty,
    i.MinQty,
    i.ReorderQty,
    ShortageQty = CAST(CASE WHEN st.Qty < i.MinQty THEN i.MinQty - st.Qty ELSE 0 END AS DECIMAL(18,4))
FROM dbo.v_item_stock AS st
INNER JOIN dbo.items AS i ON i.ItemId = st.ItemId
WHERE st.Qty < i.MinQty OR st.Qty <= i.ReorderQty;
GO

/* ------------------------ أرباح الفواتير (هامش) ------------------------ */
CREATE OR ALTER VIEW dbo.v_invoice_profit
AS
SELECT
    inv.CompanyId,
    inv.InvoiceId,
    inv.DocTypeCode,
    inv.InvoiceNo,
    inv.InvoiceDate,
    inv.PartyId,
    inv.NetTotal,
    CostTotal = CAST(ISNULL(SUM(ln.UnitCost * ln.Qty), 0) AS DECIMAL(18,4)),
    Profit    = CAST(inv.NetTotal - ISNULL(SUM(ln.UnitCost * ln.Qty), 0) AS DECIMAL(18,4))
FROM dbo.invoices AS inv
LEFT JOIN dbo.invoice_lines AS ln ON ln.InvoiceId = inv.InvoiceId
WHERE inv.Status = N'posted'
GROUP BY inv.CompanyId, inv.InvoiceId, inv.DocTypeCode, inv.InvoiceNo, inv.InvoiceDate, inv.PartyId, inv.NetTotal;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'70_views', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'70_views');
GO
