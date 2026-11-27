/* =====================================================================
   40_invoices.sql — الفواتير الموحّدة: مبيعات، مشتريات، مرتجعات،
                    إدخال/إخراج، تحويل، طلبات، عروض أسعار، حجز
                    + سطور الفاتورة + المصاريف + المدفوعات
   يعادل: BillSale, BillReSale, BillPay, BillRePAy, BillIn, BillOut,
          BillTrans, BillSaleOrder, BillPayOrder, BillPriceList, Detail,
          ExpBill, BillRest, BillSaleHotel, billDoctor, BillSyana
   ===================================================================== */
USE BadelErp;
GO

IF OBJECT_ID(N'dbo.invoices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.invoices
    (
        InvoiceId     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_invoices PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        BranchId      INT               NULL,
        FiscalYearId  INT               NOT NULL,
        DocTypeCode   NVARCHAR(40)      NOT NULL,
        InvoiceNo     NVARCHAR(40)      NOT NULL,
        InvoiceDate   DATE              NOT NULL,
        PartyId       INT               NULL,
        PayType       NVARCHAR(20)      NULL,
        CurrencyId    INT               NOT NULL,
        ExchangeRate  DECIMAL(18,8)     NOT NULL CONSTRAINT DF_invoices_Rate DEFAULT (1),
        WarehouseId   INT               NULL,
        SalesRepId    INT               NULL,
        ContactName   NVARCHAR(200)     NULL,
        RefNo         NVARCHAR(60)      NULL,
        Description   NVARCHAR(400)     NULL,
        SubTotal      DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_SubTotal DEFAULT (0),
        DiscountTotal DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_Discount DEFAULT (0),
        TaxTotal      DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_Tax DEFAULT (0),
        ExpensesTotal DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_Expenses DEFAULT (0),
        NetTotal      DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_Net DEFAULT (0),
        PaidCash      DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_PaidCash DEFAULT (0),
        PaidNetwork   DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_PaidNetwork DEFAULT (0),
        Remaining     DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoices_Remaining DEFAULT (0),
        Status        NVARCHAR(20)      NOT NULL CONSTRAINT DF_invoices_Status DEFAULT (N'draft'),
        Notes         NVARCHAR(MAX)     NULL,
        MetadataJson  NVARCHAR(MAX)     NOT NULL CONSTRAINT DF_invoices_Metadata DEFAULT (N'{}'),
        JournalEntryId BIGINT           NULL,
        CreatedByUserId INT             NULL,
        CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_invoices_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt     DATETIME2(0)      NULL,
        EditCount     INT               NOT NULL CONSTRAINT DF_invoices_EditCount DEFAULT (0),
        PrintCount    INT               NOT NULL CONSTRAINT DF_invoices_PrintCount DEFAULT (0),
        CONSTRAINT UQ_invoices_Number UNIQUE (CompanyId, FiscalYearId, DocTypeCode, InvoiceNo),
        CONSTRAINT CK_invoices_DocType CHECK (DocTypeCode IN
            (N'sale', N'sale_return', N'purchase', N'purchase_return', N'in', N'out', N'transfer',
             N'sale_order', N'purchase_order', N'quote', N'reserve', N'assembly', N'service',
             N'maintenance', N'restaurant', N'hotel', N'clinic')),
        CONSTRAINT CK_invoices_PayType CHECK (PayType IS NULL OR PayType IN (N'cash', N'credit', N'cheque', N'network')),
        CONSTRAINT CK_invoices_Status CHECK (Status IN (N'draft', N'posted', N'void')),
        CONSTRAINT CK_invoices_Amounts CHECK (SubTotal >= 0 AND DiscountTotal >= 0 AND TaxTotal >= 0 AND ExpensesTotal >= 0 AND NetTotal >= 0),
        CONSTRAINT CK_invoices_Rate CHECK (ExchangeRate > 0),
        CONSTRAINT FK_invoices_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_invoices_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId),
        CONSTRAINT FK_invoices_years FOREIGN KEY (FiscalYearId) REFERENCES dbo.fiscal_years (FiscalYearId),
        CONSTRAINT FK_invoices_parties FOREIGN KEY (PartyId) REFERENCES dbo.parties (PartyId),
        CONSTRAINT FK_invoices_currencies FOREIGN KEY (CurrencyId) REFERENCES dbo.currencies (CurrencyId),
        CONSTRAINT FK_invoices_warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.warehouses (WarehouseId),
        CONSTRAINT FK_invoices_salesrep FOREIGN KEY (SalesRepId) REFERENCES dbo.parties (PartyId),
        CONSTRAINT FK_invoices_entries FOREIGN KEY (JournalEntryId) REFERENCES dbo.journal_entries (EntryId),
        CONSTRAINT FK_invoices_users FOREIGN KEY (CreatedByUserId) REFERENCES dbo.app_users (UserId)
    );

    CREATE INDEX IX_invoices_Date ON dbo.invoices (CompanyId, DocTypeCode, InvoiceDate) INCLUDE (NetTotal, Status);
    CREATE INDEX IX_invoices_Party ON dbo.invoices (PartyId, InvoiceDate);
    CREATE INDEX IX_invoices_Warehouse ON dbo.invoices (WarehouseId) WHERE WarehouseId IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.invoice_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.invoice_lines
    (
        LineId        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_invoice_lines PRIMARY KEY,
        InvoiceId     BIGINT            NOT NULL,
        LineNumber        INT               NOT NULL,
        ItemId        INT               NULL,
        UnitId        INT               NULL,
        Qty           DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoice_lines_Qty DEFAULT (0),
        BonusQty      DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoice_lines_Bonus DEFAULT (0),
        Factor        DECIMAL(18,6)     NOT NULL CONSTRAINT DF_invoice_lines_Factor DEFAULT (1),
        Price         DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoice_lines_Price DEFAULT (0),
        DiscountPct   DECIMAL(9,4)      NOT NULL CONSTRAINT DF_invoice_lines_DiscPct DEFAULT (0),
        DiscountAmount DECIMAL(18,4)    NOT NULL CONSTRAINT DF_invoice_lines_Discount DEFAULT (0),
        TaxRate       DECIMAL(9,4)      NOT NULL CONSTRAINT DF_invoice_lines_TaxRate DEFAULT (0),
        TaxAmount     DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoice_lines_Tax DEFAULT (0),
        LineTotal     AS (CAST(((Qty * Price) - DiscountAmount) AS DECIMAL(18,4))) PERSISTED,
        UnitCost      DECIMAL(18,6)     NOT NULL CONSTRAINT DF_invoice_lines_Cost DEFAULT (0),
        WarehouseId   INT               NULL,
        ExpiryDate    DATE              NULL,
        BatchNo       NVARCHAR(60)      NULL,
        LineNote      NVARCHAR(300)     NULL,
        MetadataJson  NVARCHAR(MAX)     NOT NULL CONSTRAINT DF_invoice_lines_Metadata DEFAULT (N'{}'),
        CONSTRAINT UQ_invoice_lines_No UNIQUE (InvoiceId, LineNumber),
        CONSTRAINT CK_invoice_lines_Qty CHECK (Qty >= 0 AND BonusQty >= 0),
        CONSTRAINT CK_invoice_lines_Price CHECK (Price >= 0),
        CONSTRAINT CK_invoice_lines_Disc CHECK (DiscountPct BETWEEN 0 AND 100 AND DiscountAmount >= 0),
        CONSTRAINT CK_invoice_lines_Tax CHECK (TaxRate BETWEEN 0 AND 100 AND TaxAmount >= 0),
        CONSTRAINT FK_invoice_lines_invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.invoices (InvoiceId),
        CONSTRAINT FK_invoice_lines_items FOREIGN KEY (ItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_invoice_lines_units FOREIGN KEY (UnitId) REFERENCES dbo.units (UnitId),
        CONSTRAINT FK_invoice_lines_warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.warehouses (WarehouseId)
    );

    CREATE INDEX IX_invoice_lines_Invoice ON dbo.invoice_lines (InvoiceId);
    CREATE INDEX IX_invoice_lines_Item ON dbo.invoice_lines (ItemId, InvoiceId);
END;
GO

IF OBJECT_ID(N'dbo.invoice_expenses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.invoice_expenses
    (
        InvoiceExpenseId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_invoice_expenses PRIMARY KEY,
        InvoiceId     BIGINT            NOT NULL,
        ExpenseAccountId INT            NOT NULL,
        CostCenterId  INT               NULL,
        Amount        DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoice_expenses_Amount DEFAULT (0),
        TaxAmount     DECIMAL(18,4)     NOT NULL CONSTRAINT DF_invoice_expenses_Tax DEFAULT (0),
        DistributeOnCost BIT            NOT NULL CONSTRAINT DF_invoice_expenses_Distribute DEFAULT (0),
        Notes         NVARCHAR(300)     NULL,
        CONSTRAINT CK_invoice_expenses_Amount CHECK (Amount >= 0),
        CONSTRAINT FK_invoice_expenses_invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.invoices (InvoiceId),
        CONSTRAINT FK_invoice_expenses_accounts FOREIGN KEY (ExpenseAccountId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_invoice_expenses_costcenters FOREIGN KEY (CostCenterId) REFERENCES dbo.cost_centers (CostCenterId)
    );
END;
GO

IF OBJECT_ID(N'dbo.invoice_payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.invoice_payments
    (
        PaymentId     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_invoice_payments PRIMARY KEY,
        InvoiceId     BIGINT            NOT NULL,
        PaymentMethod NVARCHAR(20)      NOT NULL CONSTRAINT DF_invoice_payments_Method DEFAULT (N'cash'),
        AccountId     INT               NOT NULL,
        Amount        DECIMAL(18,4)     NOT NULL,
        ChequeNo      NVARCHAR(40)      NULL,
        DueDate       DATE              NULL,
        Notes         NVARCHAR(300)     NULL,
        CONSTRAINT CK_invoice_payments_Method CHECK (PaymentMethod IN (N'cash', N'network', N'cheque', N'transfer')),
        CONSTRAINT CK_invoice_payments_Amount CHECK (Amount > 0),
        CONSTRAINT FK_invoice_payments_invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.invoices (InvoiceId),
        CONSTRAINT FK_invoice_payments_accounts FOREIGN KEY (AccountId) REFERENCES dbo.accounts (AccountId)
    );
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'40_invoices', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'40_invoices');
GO
