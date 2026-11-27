/* =====================================================================
   10_core.sql — الأساس: الشركات، الفروع، السنوات المالية، المستخدمون،
                 الصلاحيات، سجل التدقيق، الإعدادات، تخصيص المستندات، الترقيم
   يعادل في النظام القديم: filecompany, fileyear, accMoveLock, monthClose,
                 users, UserACC, UserPerAcc, DetaleUserList, MoveEdit,
                 MoveDelete, Genral, GeneralBillSet
   ===================================================================== */
USE BadelErp;
GO

/* ------------------------------- الشركات ------------------------------- */
IF OBJECT_ID(N'dbo.companies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.companies
    (
        CompanyId   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_companies PRIMARY KEY,
        Code        NVARCHAR(20)      NOT NULL,
        NameAr      NVARCHAR(200)     NOT NULL,
        NameEn      NVARCHAR(200)     NULL,
        TaxNumber   NVARCHAR(50)      NULL,
        Address     NVARCHAR(300)     NULL,
        Phone       NVARCHAR(50)      NULL,
        LogoPath    NVARCHAR(400)     NULL,
        IsActive    BIT               NOT NULL CONSTRAINT DF_companies_IsActive DEFAULT (1),
        CreatedAt   DATETIME2(0)      NOT NULL CONSTRAINT DF_companies_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_companies_Code UNIQUE (Code)
    );
END;
GO

/* ------------------------------- الفروع ------------------------------- */
IF OBJECT_ID(N'dbo.branches', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.branches
    (
        BranchId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_branches PRIMARY KEY,
        CompanyId   INT               NOT NULL,
        Code        NVARCHAR(20)      NOT NULL,
        NameAr      NVARCHAR(200)     NOT NULL,
        Address     NVARCHAR(300)     NULL,
        Phone       NVARCHAR(50)      NULL,
        IsMain      BIT               NOT NULL CONSTRAINT DF_branches_IsMain DEFAULT (0),
        IsActive    BIT               NOT NULL CONSTRAINT DF_branches_IsActive DEFAULT (1),
        CONSTRAINT UQ_branches_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT FK_branches_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

/* --------------------------- السنوات المالية --------------------------- */
IF OBJECT_ID(N'dbo.fiscal_years', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.fiscal_years
    (
        FiscalYearId  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_fiscal_years PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        Code          NVARCHAR(20)      NOT NULL,
        StartDate     DATE              NOT NULL,
        EndDate       DATE              NOT NULL,
        Status        NVARCHAR(20)      NOT NULL CONSTRAINT DF_fiscal_years_Status DEFAULT (N'open'),
        IsActive      BIT               NOT NULL CONSTRAINT DF_fiscal_years_IsActive DEFAULT (1),
        CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_fiscal_years_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_fiscal_years_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_fiscal_years_Dates CHECK (EndDate > StartDate),
        CONSTRAINT CK_fiscal_years_Status CHECK (Status IN (N'open', N'closed')),
        CONSTRAINT FK_fiscal_years_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

/* ----------------------- الفترات (إقفال شهري) -------------------------- */
IF OBJECT_ID(N'dbo.fiscal_periods', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.fiscal_periods
    (
        PeriodId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_fiscal_periods PRIMARY KEY,
        FiscalYearId  INT               NOT NULL,
        MonthNo       TINYINT           NOT NULL,
        StartDate     DATE              NOT NULL,
        EndDate       DATE              NOT NULL,
        IsClosed      BIT               NOT NULL CONSTRAINT DF_fiscal_periods_IsClosed DEFAULT (0),
        ClosedAt      DATETIME2(0)      NULL,
        ClosedByUserId INT              NULL,
        CONSTRAINT UQ_fiscal_periods_Year_Month UNIQUE (FiscalYearId, MonthNo),
        CONSTRAINT CK_fiscal_periods_Month CHECK (MonthNo BETWEEN 1 AND 12),
        CONSTRAINT FK_fiscal_periods_years FOREIGN KEY (FiscalYearId) REFERENCES dbo.fiscal_years (FiscalYearId)
    );
END;
GO

/* ------------------------------ المستخدمون ----------------------------- */
IF OBJECT_ID(N'dbo.app_users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.app_users
    (
        UserId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_app_users PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        Username      NVARCHAR(60)      NOT NULL,
        FullName      NVARCHAR(150)     NOT NULL,
        PasswordHash  NVARCHAR(400)     NOT NULL,
        PasswordSalt  NVARCHAR(100)     NULL,
        Phone         NVARCHAR(30)      NULL,
        Email         NVARCHAR(150)     NULL,
        IsActive      BIT               NOT NULL CONSTRAINT DF_app_users_IsActive DEFAULT (1),
        MustChangePassword BIT          NOT NULL CONSTRAINT DF_app_users_MustChange DEFAULT (0),
        LastLoginAt   DATETIME2(0)      NULL,
        CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_app_users_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_app_users_Company_Username UNIQUE (CompanyId, Username),
        CONSTRAINT FK_app_users_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

/* ------------------------------- الأدوار ------------------------------- */
IF OBJECT_ID(N'dbo.roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.roles
    (
        RoleId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_roles PRIMARY KEY,
        CompanyId   INT               NULL,
        Code        NVARCHAR(40)      NOT NULL,
        NameAr      NVARCHAR(120)     NOT NULL,
        IsSystem    BIT               NOT NULL CONSTRAINT DF_roles_IsSystem DEFAULT (0),
        CONSTRAINT UQ_roles_Code UNIQUE (Code),
        CONSTRAINT FK_roles_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

/* ------------------------------ الصلاحيات ------------------------------ */
IF OBJECT_ID(N'dbo.permissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.permissions
    (
        PermissionId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_permissions PRIMARY KEY,
        Code         NVARCHAR(80)      NOT NULL,
        ModuleCode   NVARCHAR(40)      NOT NULL,
        NameAr       NVARCHAR(150)     NOT NULL,
        CONSTRAINT UQ_permissions_Code UNIQUE (Code)
    );
END;
GO

IF OBJECT_ID(N'dbo.role_permissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.role_permissions
    (
        RoleId       INT NOT NULL,
        PermissionId INT NOT NULL,
        CONSTRAINT PK_role_permissions PRIMARY KEY (RoleId, PermissionId),
        CONSTRAINT FK_role_permissions_roles FOREIGN KEY (RoleId) REFERENCES dbo.roles (RoleId),
        CONSTRAINT FK_role_permissions_permissions FOREIGN KEY (PermissionId) REFERENCES dbo.permissions (PermissionId)
    );
END;
GO

IF OBJECT_ID(N'dbo.user_roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_roles
    (
        UserId INT NOT NULL,
        RoleId INT NOT NULL,
        CONSTRAINT PK_user_roles PRIMARY KEY (UserId, RoleId),
        CONSTRAINT FK_user_roles_users FOREIGN KEY (UserId) REFERENCES dbo.app_users (UserId),
        CONSTRAINT FK_user_roles_roles FOREIGN KEY (RoleId) REFERENCES dbo.roles (RoleId)
    );
END;
GO

/* ----------------------------- سجل التدقيق ----------------------------- */
IF OBJECT_ID(N'dbo.audit_log', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.audit_log
    (
        AuditId     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_audit_log PRIMARY KEY,
        CompanyId   INT               NOT NULL,
        UserId      INT               NULL,
        EntityName  NVARCHAR(80)      NOT NULL,
        EntityId    NVARCHAR(60)      NULL,
        ActionCode  NVARCHAR(20)      NOT NULL,
        OldValues   NVARCHAR(MAX)     NULL,
        NewValues   NVARCHAR(MAX)     NULL,
        PerformedAt DATETIME2(0)      NOT NULL CONSTRAINT DF_audit_log_PerformedAt DEFAULT (SYSUTCDATETIME()),
        IpAddress   NVARCHAR(60)      NULL,
        CONSTRAINT CK_audit_log_Action CHECK (ActionCode IN (N'insert', N'update', N'delete', N'post', N'void', N'login', N'logout')),
        CONSTRAINT FK_audit_log_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_audit_log_users FOREIGN KEY (UserId) REFERENCES dbo.app_users (UserId)
    );

    CREATE INDEX IX_audit_log_Entity ON dbo.audit_log (EntityName, EntityId, PerformedAt DESC);
    CREATE INDEX IX_audit_log_Company ON dbo.audit_log (CompanyId, PerformedAt DESC);
END;
GO

/* --------------------- إعدادات النظام (بديل Genral) -------------------- */
IF OBJECT_ID(N'dbo.app_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.app_settings
    (
        SettingId     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_app_settings PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        SettingKey    NVARCHAR(120)     NOT NULL,
        SettingValue  NVARCHAR(MAX)     NULL,
        ValueType     NVARCHAR(20)      NOT NULL CONSTRAINT DF_app_settings_ValueType DEFAULT (N'string'),
        UpdatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_app_settings_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedByUserId INT             NULL,
        CONSTRAINT UQ_app_settings_Company_Key UNIQUE (CompanyId, SettingKey),
        CONSTRAINT CK_app_settings_ValueType CHECK (ValueType IN (N'string', N'int', N'decimal', N'bool', N'json', N'date')),
        CONSTRAINT FK_app_settings_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

/* ----- تخصيص أنواع المستندات (بديل GeneralBillSet بـ 490 إعداداً) ----- */
IF OBJECT_ID(N'dbo.document_type_configs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.document_type_configs
    (
        ConfigId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_document_type_configs PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        DocTypeCode   NVARCHAR(40)      NOT NULL,
        DisplayNameAr NVARCHAR(120)     NOT NULL,
        SettingsJson  NVARCHAR(MAX)     NOT NULL CONSTRAINT DF_document_type_configs_Settings DEFAULT (N'{}'),
        IsActive      BIT               NOT NULL CONSTRAINT DF_document_type_configs_IsActive DEFAULT (1),
        UpdatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_document_type_configs_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_document_type_configs UNIQUE (CompanyId, DocTypeCode),
        CONSTRAINT FK_document_type_configs_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

/* ------------------------- تسلسل أرقام المستندات ----------------------- */
IF OBJECT_ID(N'dbo.number_sequences', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.number_sequences
    (
        SequenceId  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_number_sequences PRIMARY KEY,
        CompanyId   INT               NOT NULL,
        BranchId    INT               NULL,
        DocTypeCode NVARCHAR(40)      NOT NULL,
        Prefix      NVARCHAR(20)      NULL,
        NextNumber  INT               NOT NULL CONSTRAINT DF_number_sequences_Next DEFAULT (1),
        PadWidth    TINYINT           NOT NULL CONSTRAINT DF_number_sequences_Pad DEFAULT (6),
        CONSTRAINT CK_number_sequences_Next CHECK (NextNumber > 0),
        CONSTRAINT FK_number_sequences_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_number_sequences_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId)
    );

    CREATE UNIQUE INDEX UX_number_sequences_NoBranch
        ON dbo.number_sequences (CompanyId, DocTypeCode)
        WHERE BranchId IS NULL;

    CREATE UNIQUE INDEX UX_number_sequences_Branch
        ON dbo.number_sequences (CompanyId, BranchId, DocTypeCode)
        WHERE BranchId IS NOT NULL;
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'10_core', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'10_core');
GO
