/* =====================================================================
   30_inventory.sql — المواد والوحدات والباركود والأسعار والمستودعات
                     وحركات المخزون وشاشات الجرد
   يعادل: MatTree (172 عموداً), service, matUnitBarPrice, MatAltCode,
          Stock, StockMat, MatExpDate, BillMatExpDate, BonasCPay, BonasCSal
   ===================================================================== */
USE BadelErp;
GO

/* ------------------------------ الوحدات ------------------------------- */
IF OBJECT_ID(N'dbo.units', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.units
    (
        UnitId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_units PRIMARY KEY,
        CompanyId INT               NOT NULL,
        Code      NVARCHAR(20)      NOT NULL,
        NameAr    NVARCHAR(80)      NOT NULL,
        IsActive  BIT               NOT NULL CONSTRAINT DF_units_IsActive DEFAULT (1),
        CONSTRAINT UQ_units_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT FK_units_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

/* --------------------------- مجموعات المواد ---------------------------- */
IF OBJECT_ID(N'dbo.item_groups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.item_groups
    (
        GroupId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_item_groups PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        Code         NVARCHAR(20)      NOT NULL,
        NameAr       NVARCHAR(150)     NOT NULL,
        ParentId     INT               NULL,
        Level        TINYINT           NOT NULL CONSTRAINT DF_item_groups_Level DEFAULT (1),
        DefaultUnitId INT              NULL,
        TaxRate      DECIMAL(9,4)      NOT NULL CONSTRAINT DF_item_groups_TaxRate DEFAULT (0),
        RequireExpiry BIT              NOT NULL CONSTRAINT DF_item_groups_RequireExpiry DEFAULT (0),
        IsActive     BIT               NOT NULL CONSTRAINT DF_item_groups_IsActive DEFAULT (1),
        Notes        NVARCHAR(300)     NULL,
        CONSTRAINT UQ_item_groups_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT FK_item_groups_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_item_groups_parent FOREIGN KEY (ParentId) REFERENCES dbo.item_groups (GroupId),
        CONSTRAINT FK_item_groups_units FOREIGN KEY (DefaultUnitId) REFERENCES dbo.units (UnitId)
    );
END;
GO

/* ------------------------------- المواد -------------------------------- */
IF OBJECT_ID(N'dbo.items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.items
    (
        ItemId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_items PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        Code          NVARCHAR(40)      NOT NULL,
        NameAr        NVARCHAR(250)     NOT NULL,
        NameEn        NVARCHAR(250)     NULL,
        GroupId       INT               NULL,
        ItemType      NVARCHAR(20)      NOT NULL CONSTRAINT DF_items_Type DEFAULT (N'product'),
        MainUnitId    INT               NULL,
        TaxId         INT               NULL,
        IsScaleItem   BIT               NOT NULL CONSTRAINT DF_items_IsScaleItem DEFAULT (0),
        IsMeasured    BIT               NOT NULL CONSTRAINT DF_items_IsMeasured DEFAULT (0),
        LengthCm      DECIMAL(10,2)     NULL,
        WidthCm       DECIMAL(10,2)     NULL,
        HeightCm      DECIMAL(10,2)     NULL,
        MinQty        DECIMAL(18,4)     NOT NULL CONSTRAINT DF_items_MinQty DEFAULT (0),
        MaxQty        DECIMAL(18,4)     NOT NULL CONSTRAINT DF_items_MaxQty DEFAULT (0),
        ReorderQty    DECIMAL(18,4)     NOT NULL CONSTRAINT DF_items_ReorderQty DEFAULT (0),
        ScientificName NVARCHAR(200)    NULL,
        OriginCountry NVARCHAR(80)      NULL,
        Notes         NVARCHAR(500)     NULL,
        IsActive      BIT               NOT NULL CONSTRAINT DF_items_IsActive DEFAULT (1),
        CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_items_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_items_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_items_Type CHECK (ItemType IN (N'product', N'service', N'raw_material')),
        CONSTRAINT CK_items_Qty CHECK (MinQty >= 0 AND MaxQty >= 0 AND ReorderQty >= 0),
        CONSTRAINT FK_items_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_items_groups FOREIGN KEY (GroupId) REFERENCES dbo.item_groups (GroupId),
        CONSTRAINT FK_items_units FOREIGN KEY (MainUnitId) REFERENCES dbo.units (UnitId),
        CONSTRAINT FK_items_taxes FOREIGN KEY (TaxId) REFERENCES dbo.taxes (TaxId)
    );

    CREATE INDEX IX_items_Name ON dbo.items (CompanyId, NameAr);
    CREATE INDEX IX_items_Group ON dbo.items (GroupId) WHERE GroupId IS NOT NULL;
END;
GO

/* --------------------------- وحدات المادة ------------------------------ */
IF OBJECT_ID(N'dbo.item_units', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.item_units
    (
        ItemUnitId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_item_units PRIMARY KEY,
        ItemId     INT               NOT NULL,
        UnitId     INT               NOT NULL,
        Factor     DECIMAL(18,6)     NOT NULL CONSTRAINT DF_item_units_Factor DEFAULT (1),
        IsMain     BIT               NOT NULL CONSTRAINT DF_item_units_IsMain DEFAULT (0),
        SalePrice  DECIMAL(18,4)     NULL,
        CONSTRAINT UQ_item_units_Item_Unit UNIQUE (ItemId, UnitId),
        CONSTRAINT CK_item_units_Factor CHECK (Factor > 0),
        CONSTRAINT FK_item_units_items FOREIGN KEY (ItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_item_units_units FOREIGN KEY (UnitId) REFERENCES dbo.units (UnitId)
    );
END;
GO

/* ------------------------------ الباركود ------------------------------- */
IF OBJECT_ID(N'dbo.item_barcodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.item_barcodes
    (
        BarcodeId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_item_barcodes PRIMARY KEY,
        ItemId    INT               NOT NULL,
        UnitId    INT               NULL,
        Barcode   NVARCHAR(60)      NOT NULL,
        BonusQty  DECIMAL(18,4)     NOT NULL CONSTRAINT DF_item_barcodes_Bonus DEFAULT (0),
        Notes     NVARCHAR(200)     NULL,
        CONSTRAINT UQ_item_barcodes UNIQUE (ItemId, Barcode),
        CONSTRAINT FK_item_barcodes_items FOREIGN KEY (ItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_item_barcodes_units FOREIGN KEY (UnitId) REFERENCES dbo.units (UnitId)
    );

    CREATE INDEX IX_item_barcodes_Code ON dbo.item_barcodes (Barcode);
END;
GO

/* ---------------------------- مستويات السعر ---------------------------- */
IF OBJECT_ID(N'dbo.item_prices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.item_prices
    (
        PriceId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_item_prices PRIMARY KEY,
        ItemId       INT               NOT NULL,
        UnitId       INT               NULL,
        PriceLevel   TINYINT           NOT NULL CONSTRAINT DF_item_prices_Level DEFAULT (1),
        Price        DECIMAL(18,4)     NOT NULL CONSTRAINT DF_item_prices_Price DEFAULT (0),
        CurrencyId   INT               NOT NULL,
        EffectiveFrom DATE             NOT NULL CONSTRAINT DF_item_prices_From DEFAULT (CAST(SYSDATETIME() AS DATE)),
        CONSTRAINT UQ_item_prices UNIQUE (ItemId, UnitId, PriceLevel, EffectiveFrom),
        CONSTRAINT CK_item_prices_Level CHECK (PriceLevel BETWEEN 1 AND 5),
        CONSTRAINT CK_item_prices_Price CHECK (Price >= 0),
        CONSTRAINT FK_item_prices_items FOREIGN KEY (ItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_item_prices_units FOREIGN KEY (UnitId) REFERENCES dbo.units (UnitId),
        CONSTRAINT FK_item_prices_currencies FOREIGN KEY (CurrencyId) REFERENCES dbo.currencies (CurrencyId)
    );
END;
GO

/* ----------------------------- المستودعات ------------------------------ */
IF OBJECT_ID(N'dbo.warehouses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.warehouses
    (
        WarehouseId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_warehouses PRIMARY KEY,
        CompanyId   INT               NOT NULL,
        BranchId    INT               NULL,
        Code        NVARCHAR(20)      NOT NULL,
        NameAr      NVARCHAR(150)     NOT NULL,
        Location    NVARCHAR(200)     NULL,
        Keeper      NVARCHAR(150)     NULL,
        IsActive    BIT               NOT NULL CONSTRAINT DF_warehouses_IsActive DEFAULT (1),
        Notes       NVARCHAR(300)     NULL,
        CONSTRAINT UQ_warehouses_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT FK_warehouses_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_warehouses_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId)
    );
END;
GO

/* --------------------------- حركات المخزون ----------------------------- */
IF OBJECT_ID(N'dbo.stock_movements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stock_movements
    (
        MovementId   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_stock_movements PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        WarehouseId  INT               NOT NULL,
        ItemId       INT               NOT NULL,
        UnitId       INT               NULL,
        MovementDate DATE              NOT NULL,
        Direction    NCHAR(1)          NOT NULL,
        Qty          DECIMAL(18,4)     NOT NULL,
        QtyBase      DECIMAL(18,4)     NOT NULL,
        UnitCost     DECIMAL(18,6)     NOT NULL CONSTRAINT DF_stock_movements_Cost DEFAULT (0),
        TotalCost    DECIMAL(18,4)     NOT NULL CONSTRAINT DF_stock_movements_Total DEFAULT (0),
        SourceType   NVARCHAR(30)      NOT NULL,
        SourceId     NVARCHAR(60)      NULL,
        SourceLineId NVARCHAR(60)      NULL,
        BatchNo      NVARCHAR(60)      NULL,
        ExpiryDate   DATE              NULL,
        Notes        NVARCHAR(300)     NULL,
        CreatedAt    DATETIME2(0)      NOT NULL CONSTRAINT DF_stock_movements_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_stock_movements_Dir CHECK (Direction IN (N'I', N'O')),
        CONSTRAINT CK_stock_movements_Qty CHECK (Qty > 0 AND QtyBase > 0),
        CONSTRAINT CK_stock_movements_Source CHECK (SourceType IN (N'invoice', N'return', N'transfer', N'inventory', N'opening', N'adjustment', N'manufacturing')),
        CONSTRAINT FK_stock_movements_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_stock_movements_warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.warehouses (WarehouseId),
        CONSTRAINT FK_stock_movements_items FOREIGN KEY (ItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_stock_movements_units FOREIGN KEY (UnitId) REFERENCES dbo.units (UnitId)
    );

    CREATE INDEX IX_stock_movements_Item ON dbo.stock_movements (ItemId, WarehouseId, MovementDate);
    CREATE INDEX IX_stock_movements_Source ON dbo.stock_movements (SourceType, SourceId);
END;
GO

/* ------------------------------ الجرد ----------------------------------- */
IF OBJECT_ID(N'dbo.inventory_sheets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_sheets
    (
        SheetId        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_inventory_sheets PRIMARY KEY,
        CompanyId      INT               NOT NULL,
        BranchId       INT               NULL,
        WarehouseId    INT               NOT NULL,
        SheetNo        NVARCHAR(30)      NOT NULL,
        SheetDate      DATE              NOT NULL,
        SheetType      NVARCHAR(20)      NOT NULL CONSTRAINT DF_inventory_sheets_Type DEFAULT (N'full'),
        Status         NVARCHAR(20)      NOT NULL CONSTRAINT DF_inventory_sheets_Status DEFAULT (N'draft'),
        CountMethod    NVARCHAR(30)      NOT NULL CONSTRAINT DF_inventory_sheets_Method DEFAULT (N'manual'),
        ProfitAccountId   INT            NULL,
        OutAccountId      INT            NULL,
        ShortageAccountId INT            NULL,
        SurplusAccountId  INT            NULL,
        JournalEntryId BIGINT            NULL,
        ApprovedByUserId INT             NULL,
        ApprovedAt     DATETIME2(0)      NULL,
        Notes          NVARCHAR(400)     NULL,
        CreatedAt      DATETIME2(0)      NOT NULL CONSTRAINT DF_inventory_sheets_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_inventory_sheets_No UNIQUE (CompanyId, SheetNo),
        CONSTRAINT CK_inventory_sheets_Type CHECK (SheetType IN (N'full', N'partial', N'cycle')),
        CONSTRAINT CK_inventory_sheets_Status CHECK (Status IN (N'draft', N'counting', N'approved', N'void')),
        CONSTRAINT CK_inventory_sheets_Method CHECK (CountMethod IN (N'manual', N'barcode', N'weighted_average', N'fifo')),
        CONSTRAINT FK_inventory_sheets_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_inventory_sheets_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId),
        CONSTRAINT FK_inventory_sheets_warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.warehouses (WarehouseId),
        CONSTRAINT FK_inventory_sheets_entries FOREIGN KEY (JournalEntryId) REFERENCES dbo.journal_entries (EntryId),
        CONSTRAINT FK_inventory_sheets_profit FOREIGN KEY (ProfitAccountId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_inventory_sheets_out FOREIGN KEY (OutAccountId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_inventory_sheets_shortage FOREIGN KEY (ShortageAccountId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_inventory_sheets_surplus FOREIGN KEY (SurplusAccountId) REFERENCES dbo.accounts (AccountId),
        CONSTRAINT FK_inventory_sheets_users FOREIGN KEY (ApprovedByUserId) REFERENCES dbo.app_users (UserId)
    );
END;
GO

IF OBJECT_ID(N'dbo.inventory_sheet_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_sheet_lines
    (
        SheetLineId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_inventory_sheet_lines PRIMARY KEY,
        SheetId     BIGINT            NOT NULL,
        LineNumber      INT               NOT NULL,
        ItemId      INT               NOT NULL,
        UnitId      INT               NULL,
        ShownQty    DECIMAL(18,4)     NOT NULL CONSTRAINT DF_inventory_sheet_lines_Shown DEFAULT (0),
        CountedQty  DECIMAL(18,4)     NOT NULL CONSTRAINT DF_inventory_sheet_lines_Counted DEFAULT (0),
        DiffQty     AS (CountedQty - ShownQty) PERSISTED,
        UnitCost    DECIMAL(18,6)     NOT NULL CONSTRAINT DF_inventory_sheet_lines_Cost DEFAULT (0),
        DiffValue   AS ((CountedQty - ShownQty) * UnitCost) PERSISTED,
        BatchNo     NVARCHAR(60)      NULL,
        ExpiryDate  DATE              NULL,
        Notes       NVARCHAR(300)     NULL,
        CONSTRAINT UQ_inventory_sheet_lines UNIQUE (SheetId, LineNumber),
        CONSTRAINT FK_inventory_sheet_lines_sheets FOREIGN KEY (SheetId) REFERENCES dbo.inventory_sheets (SheetId),
        CONSTRAINT FK_inventory_sheet_lines_items FOREIGN KEY (ItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_inventory_sheet_lines_units FOREIGN KEY (UnitId) REFERENCES dbo.units (UnitId)
    );

    CREATE INDEX IX_inventory_sheet_lines_Item ON dbo.inventory_sheet_lines (ItemId);
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'30_inventory', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'30_inventory');
GO
