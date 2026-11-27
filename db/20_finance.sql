/* =====================================================================
   20_finance.sql — المحاسبة العامة: العملات، دليل الحسابات، مراكز الكلفة،
                    الضرائب، الأطراف، القيود، السندات والشيكات
   يعادل: Currancy, AccCurrancy, AccTree, CostPoint1/2, AccCost,
          TVAAcc, AccMove, AccEntryRec, ComplexEntry, SanadIn, SanadOut,
          SanadDetal, Jero
   ===================================================================== */
USE BadelErp;
GO

/* ------------------------------- العملات ------------------------------- */
IF OBJECT_ID(N'dbo.currencies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.currencies
    (
        CurrencyId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_currencies PRIMARY KEY,
        Code          NVARCHAR(10)      NOT NULL,
        NameAr        NVARCHAR(80)      NOT NULL,
        Symbol        NVARCHAR(10)      NULL,
        DecimalPlaces TINYINT           NOT NULL CONSTRAINT DF_currencies_Decimals DEFAULT (2),
        IsBase        BIT               NOT NULL CONSTRAINT DF_currencies_IsBase DEFAULT (0),
        IsActive      BIT               NOT NULL CONSTRAINT DF_currencies_IsActive DEFAULT (1),
        CONSTRAINT UQ_currencies_Code UNIQUE (Code),
        CONSTRAINT CK_currencies_Decimals CHECK (DecimalPlaces BETWEEN 0 AND 6)
    );
END;
GO

IF OBJECT_ID(N'dbo.currency_rates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.currency_rates
    (
        RateId     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_currency_rates PRIMARY KEY,
        CurrencyId INT               NOT NULL,
        RateDate   DATE              NOT NULL,
        Rate       DECIMAL(18,8)     NOT NULL,
        CONSTRAINT UQ_currency_rates UNIQUE (CurrencyId, RateDate),
        CONSTRAINT CK_currency_rates_Rate CHECK (Rate > 0),
        CONSTRAINT FK_currency_rates_currencies FOREIGN KEY (CurrencyId) REFERENCES dbo.currencies (CurrencyId)
    );
END;
GO

/* ---------------------------- دليل الحسابات ---------------------------- */
IF OBJECT_ID(N'dbo.accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.accounts
    (
        AccountId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_accounts PRIMARY KEY,
        CompanyId        INT               NOT NULL,
        Code             NVARCHAR(30)      NOT NULL,
        NameAr           NVARCHAR(200)     NOT NULL,
        NameEn           NVARCHAR(200)     NULL,
        ParentId         INT               NULL,
        Level            TINYINT           NOT NULL CONSTRAINT DF_accounts_Level DEFAULT (1),
        AccountType      NVARCHAR(20)      NOT NULL CONSTRAINT DF_accounts_Type DEFAULT (N'header'),
        Nature           NCHAR(1)          NOT NULL CONSTRAINT DF_accounts_Nature DEFAULT (N'D'),
        IsLeaf           BIT               NOT NULL CONSTRAINT DF_accounts_IsLeaf DEFAULT (0),
        CurrencyId       INT               NULL,
        UsesCostCenter   BIT               NOT NULL CONSTRAINT DF_accounts_UsesCostCenter DEFAULT (0),
        IsCustomer       BIT               NOT NULL CONSTRAINT DF_accounts_IsCustomer DEFAULT (0),
        IsSupplier       BIT               NOT NULL CONSTRAINT DF_accounts_IsSupplier DEFAULT (0),
        IsAgent          BIT               NOT NULL CONSTRAINT DF_accounts_IsAgent DEFAULT (0),
        IsCash           BIT               NOT NULL CONSTRAINT DF_accounts_IsCash DEFAULT (0),
        IsBank           BIT               NOT NULL CONSTRAINT DF_accounts_IsBank DEFAULT (0),
        IsInventory      BIT               NOT NULL CONSTRAINT DF_accounts_IsInventory DEFAULT (0),
        IsRevenue        BIT               NOT NULL CONSTRAINT DF_accounts_IsRevenue DEFAULT (0),
        IsExpense        BIT               NOT NULL CONSTRAINT DF_accounts_IsExpense DEFAULT (0),
        AllowDiscount    BIT               NOT NULL CONSTRAINT DF_accounts_AllowDiscount DEFAULT (0),
        ShowInGeneralReport BIT            NOT NULL CONSTRAINT DF_accounts_ShowGeneral DEFAULT (1),
        OpeningDebit     DECIMAL(18,4)     NOT NULL CONSTRAINT DF_accounts_OpenDebit DEFAULT (0),
        OpeningCredit    DECIMAL(18,4)     NOT NULL CONSTRAINT DF_accounts_OpenCredit DEFAULT (0),
        Notes            NVARCHAR(400)     NULL,
        IsActive         BIT               NOT NULL CONSTRAINT DF_accounts_IsActive DEFAULT (1),
        CreatedAt        DATETIME2(0)      NOT NULL CONSTRAINT DF_accounts_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_accounts_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_accounts_Type CHECK (AccountType IN (N'header', N'ledger')),
        CONSTRAINT CK_accounts_Nature CHECK (Nature IN (N'D', N'C')),
        CONSTRAINT CK_accounts_Level CHECK (Level BETWEEN 1 AND 8),
        CONSTRAINT CK_accounts_Opening CHECK (OpeningDebit >= 0 AND OpeningCredit >= 0),
        CONSTRAINT FK_accounts_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_accounts_parent FOREIGN KEY (ParentId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_accounts_currencies FOREIGN KEY (CurrencyId) REFERENCES dbo.currencies (CurrencyId)
    );

    CREATE INDEX IX_accounts_Parent ON dbo.accounts (CompanyId, ParentId);
    CREATE INDEX IX_accounts_Leaf ON dbo.accounts (CompanyId, IsLeaf) INCLUDE (Code, NameAr, Nature);
END;
GO

/* ---------------------------- مراكز الكلفة ----------------------------- */
IF OBJECT_ID(N'dbo.cost_centers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cost_centers
    (
        CostCenterId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_cost_centers PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        Code         NVARCHAR(20)      NOT NULL,
        NameAr       NVARCHAR(150)     NOT NULL,
        ParentId     INT               NULL,
        Level        TINYINT           NOT NULL CONSTRAINT DF_cost_centers_Level DEFAULT (1),
        IsActive     BIT               NOT NULL CONSTRAINT DF_cost_centers_IsActive DEFAULT (1),
        Notes        NVARCHAR(300)     NULL,
        CONSTRAINT UQ_cost_centers_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_cost_centers_Level CHECK (Level BETWEEN 1 AND 4),
        CONSTRAINT FK_cost_centers_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_cost_centers_parent FOREIGN KEY (ParentId) REFERENCES dbo.cost_centers (CostCenterId)
    );
END;
GO

/* ------------------------------- الضرائب ------------------------------- */
IF OBJECT_ID(N'dbo.taxes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.taxes
    (
        TaxId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_taxes PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        Code         NVARCHAR(20)      NOT NULL,
        NameAr       NVARCHAR(100)     NOT NULL,
        Rate         DECIMAL(9,4)      NOT NULL CONSTRAINT DF_taxes_Rate DEFAULT (0),
        TaxAccountId INT               NULL,
        IsInclusive  BIT               NOT NULL CONSTRAINT DF_taxes_IsInclusive DEFAULT (0),
        IsActive     BIT               NOT NULL CONSTRAINT DF_taxes_IsActive DEFAULT (1),
        CONSTRAINT UQ_taxes_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_taxes_Rate CHECK (Rate >= 0 AND Rate <= 100),
        CONSTRAINT FK_taxes_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_taxes_accounts FOREIGN KEY (TaxAccountId) REFERENCES dbo.accounts (AccountId)
    );
END;
GO

/* --------------------- الأطراف (زبائن/موردون/مندوبون) ----------------- */
IF OBJECT_ID(N'dbo.parties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.parties
    (
        PartyId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_parties PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        Code         NVARCHAR(30)      NOT NULL,
        NameAr       NVARCHAR(200)     NOT NULL,
        PartyType    NVARCHAR(20)      NOT NULL CONSTRAINT DF_parties_Type DEFAULT (N'customer'),
        AccountId    INT               NULL,
        Phone        NVARCHAR(50)      NULL,
        Mobile       NVARCHAR(50)      NULL,
        Address      NVARCHAR(300)     NULL,
        Email        NVARCHAR(150)     NULL,
        TaxNumber    NVARCHAR(50)      NULL,
        CreditLimit  DECIMAL(18,4)     NOT NULL CONSTRAINT DF_parties_CreditLimit DEFAULT (0),
        PhotoPath    NVARCHAR(400)     NULL,
        Notes        NVARCHAR(500)     NULL,
        IsActive     BIT               NOT NULL CONSTRAINT DF_parties_IsActive DEFAULT (1),
        CreatedAt    DATETIME2(0)      NOT NULL CONSTRAINT DF_parties_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_parties_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_parties_Type CHECK (PartyType IN (N'customer', N'supplier', N'agent', N'employee', N'other')),
        CONSTRAINT CK_parties_CreditLimit CHECK (CreditLimit >= 0),
        CONSTRAINT FK_parties_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_parties_accounts FOREIGN KEY (AccountId) REFERENCES dbo.accounts (AccountId)
    );

    CREATE INDEX IX_parties_Type ON dbo.parties (CompanyId, PartyType, IsActive);
END;
GO

/* --------------------------- القيود المحاسبية -------------------------- */
IF OBJECT_ID(N'dbo.journal_entries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.journal_entries
    (
        EntryId       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_journal_entries PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        BranchId      INT               NULL,
        FiscalYearId  INT               NOT NULL,
        EntryNo       NVARCHAR(30)      NOT NULL,
        EntryDate     DATE              NOT NULL,
        SourceType    NVARCHAR(30)      NOT NULL CONSTRAINT DF_journal_entries_Source DEFAULT (N'manual'),
        SourceId      NVARCHAR(60)      NULL,
        CurrencyId    INT               NOT NULL,
        ExchangeRate  DECIMAL(18,8)     NOT NULL CONSTRAINT DF_journal_entries_Rate DEFAULT (1),
        Description   NVARCHAR(400)     NULL,
        Status        NVARCHAR(20)      NOT NULL CONSTRAINT DF_journal_entries_Status DEFAULT (N'draft'),
        CreatedByUserId INT             NULL,
        CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_journal_entries_CreatedAt DEFAULT (SYSUTCDATETIME()),
        PostedAt      DATETIME2(0)      NULL,
        VoidReason    NVARCHAR(300)     NULL,
        CONSTRAINT UQ_journal_entries_Number UNIQUE (CompanyId, FiscalYearId, EntryNo),
        CONSTRAINT CK_journal_entries_Status CHECK (Status IN (N'draft', N'posted', N'void')),
        CONSTRAINT CK_journal_entries_Source CHECK (SourceType IN (N'manual', N'invoice', N'voucher', N'inventory', N'payroll', N'opening', N'adjustment')),
        CONSTRAINT CK_journal_entries_Rate CHECK (ExchangeRate > 0),
        CONSTRAINT FK_journal_entries_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_journal_entries_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId),
        CONSTRAINT FK_journal_entries_years FOREIGN KEY (FiscalYearId) REFERENCES dbo.fiscal_years (FiscalYearId),
        CONSTRAINT FK_journal_entries_currencies FOREIGN KEY (CurrencyId) REFERENCES dbo.currencies (CurrencyId),
        CONSTRAINT FK_journal_entries_users FOREIGN KEY (CreatedByUserId) REFERENCES dbo.app_users (UserId)
    );

    CREATE INDEX IX_journal_entries_Date ON dbo.journal_entries (CompanyId, EntryDate) INCLUDE (Status, FiscalYearId);
    CREATE INDEX IX_journal_entries_Source ON dbo.journal_entries (SourceType, SourceId);
END;
GO

IF OBJECT_ID(N'dbo.journal_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.journal_lines
    (
        LineId      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_journal_lines PRIMARY KEY,
        EntryId     BIGINT            NOT NULL,
        LineNumber      INT               NOT NULL,
        AccountId   INT               NOT NULL,
        CostCenterId INT              NULL,
        PartyId     INT               NULL,
        Debit       DECIMAL(18,4)     NOT NULL CONSTRAINT DF_journal_lines_Debit DEFAULT (0),
        Credit      DECIMAL(18,4)     NOT NULL CONSTRAINT DF_journal_lines_Credit DEFAULT (0),
        DebitBase   DECIMAL(18,4)     NOT NULL CONSTRAINT DF_journal_lines_DebitBase DEFAULT (0),
        CreditBase  DECIMAL(18,4)     NOT NULL CONSTRAINT DF_journal_lines_CreditBase DEFAULT (0),
        Description NVARCHAR(400)     NULL,
        CONSTRAINT CK_journal_lines_Values CHECK (Debit >= 0 AND Credit >= 0 AND (Debit > 0 OR Credit > 0)),
        CONSTRAINT CK_journal_lines_NotBoth CHECK (NOT (Debit > 0 AND Credit > 0)),
        CONSTRAINT FK_journal_lines_entries FOREIGN KEY (EntryId) REFERENCES dbo.journal_entries (EntryId),
        CONSTRAINT FK_journal_lines_accounts FOREIGN KEY (AccountId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_journal_lines_costcenters FOREIGN KEY (CostCenterId) REFERENCES dbo.cost_centers (CostCenterId),
        CONSTRAINT FK_journal_lines_parties FOREIGN KEY (PartyId) REFERENCES dbo.parties (PartyId)
    );

    CREATE INDEX IX_journal_lines_Entry ON dbo.journal_lines (EntryId, LineNumber);
    CREATE INDEX IX_journal_lines_Account ON dbo.journal_lines (AccountId) INCLUDE (Debit, Credit, DebitBase, CreditBase);
    CREATE INDEX IX_journal_lines_CostCenter ON dbo.journal_lines (CostCenterId) WHERE CostCenterId IS NOT NULL;
END;
GO

/* ------------------------ السندات (قبض/صرف) ---------------------------- */
IF OBJECT_ID(N'dbo.receipt_vouchers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.receipt_vouchers
    (
        VoucherId     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_receipt_vouchers PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        BranchId      INT               NULL,
        FiscalYearId  INT               NOT NULL,
        DocType       NVARCHAR(20)      NOT NULL,
        VoucherNo     NVARCHAR(30)      NOT NULL,
        VoucherDate   DATE              NOT NULL,
        PartyId       INT               NULL,
        CashAccountId INT               NOT NULL,
        Amount        DECIMAL(18,4)     NOT NULL,
        CurrencyId    INT               NOT NULL,
        ExchangeRate  DECIMAL(18,8)     NOT NULL CONSTRAINT DF_receipt_vouchers_Rate DEFAULT (1),
        PaymentMethod NVARCHAR(20)      NOT NULL CONSTRAINT DF_receipt_vouchers_Method DEFAULT (N'cash'),
        ChequeNo      NVARCHAR(40)      NULL,
        BankName      NVARCHAR(120)     NULL,
        Description   NVARCHAR(400)     NULL,
        JournalEntryId BIGINT           NULL,
        Status        NVARCHAR(20)      NOT NULL CONSTRAINT DF_receipt_vouchers_Status DEFAULT (N'draft'),
        CreatedByUserId INT             NULL,
        CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_receipt_vouchers_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_receipt_vouchers_Number UNIQUE (CompanyId, FiscalYearId, DocType, VoucherNo),
        CONSTRAINT CK_receipt_vouchers_Type CHECK (DocType IN (N'receipt', N'payment')),
        CONSTRAINT CK_receipt_vouchers_Method CHECK (PaymentMethod IN (N'cash', N'cheque', N'network', N'transfer')),
        CONSTRAINT CK_receipt_vouchers_Amount CHECK (Amount > 0),
        CONSTRAINT CK_receipt_vouchers_Status CHECK (Status IN (N'draft', N'posted', N'void')),
        CONSTRAINT FK_receipt_vouchers_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_receipt_vouchers_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId),
        CONSTRAINT FK_receipt_vouchers_years FOREIGN KEY (FiscalYearId) REFERENCES dbo.fiscal_years (FiscalYearId),
        CONSTRAINT FK_receipt_vouchers_parties FOREIGN KEY (PartyId) REFERENCES dbo.parties (PartyId),
        CONSTRAINT FK_receipt_vouchers_accounts FOREIGN KEY (CashAccountId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_receipt_vouchers_currencies FOREIGN KEY (CurrencyId) REFERENCES dbo.currencies (CurrencyId),
        CONSTRAINT FK_receipt_vouchers_entries FOREIGN KEY (JournalEntryId) REFERENCES dbo.journal_entries (EntryId),
        CONSTRAINT FK_receipt_vouchers_users FOREIGN KEY (CreatedByUserId) REFERENCES dbo.app_users (UserId)
    );

    CREATE INDEX IX_receipt_vouchers_Date ON dbo.receipt_vouchers (CompanyId, VoucherDate);
END;
GO

IF OBJECT_ID(N'dbo.cheques', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cheques
    (
        ChequeId       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_cheques PRIMARY KEY,
        VoucherId      BIGINT            NOT NULL,
        ChequeNo       NVARCHAR(40)      NOT NULL,
        BankName       NVARCHAR(120)     NOT NULL,
        DueDate        DATE              NOT NULL,
        Amount         DECIMAL(18,4)     NOT NULL,
        Status         NVARCHAR(30)      NOT NULL CONSTRAINT DF_cheques_Status DEFAULT (N'under_collection'),
        EndorsedToPartyId INT            NULL,
        CollectedAt    DATE              NULL,
        Notes          NVARCHAR(300)     NULL,
        CONSTRAINT CK_cheques_Status CHECK (Status IN (N'under_collection', N'collected', N'bounced', N'endorsed', N'cancelled')),
        CONSTRAINT CK_cheques_Amount CHECK (Amount > 0),
        CONSTRAINT FK_cheques_vouchers FOREIGN KEY (VoucherId) REFERENCES dbo.receipt_vouchers (VoucherId),
        CONSTRAINT FK_cheques_parties FOREIGN KEY (EndorsedToPartyId) REFERENCES dbo.parties (PartyId)
    );
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'20_finance', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'20_finance');
GO
