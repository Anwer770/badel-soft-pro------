/* =====================================================================
   60_print_integration.sql — قوالب الطباعة والترويسات والتقارير،
                            الفوترة الإلكترونية (ZATCA)، المرفقات، النسخ الاحتياطي
   يعادل: Heder, Font, PrnCols, Report, chkBillElectrony (جدول Genral),
          frmDBBackup, frmDynamicBackupCopy
   ===================================================================== */
USE BadelErp;
GO

IF OBJECT_ID(N'dbo.print_templates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.print_templates
    (
        TemplateId   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_print_templates PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        NameAr       NVARCHAR(150)     NOT NULL,
        DocTypeCode  NVARCHAR(40)      NULL,
        IsDefault    BIT               NOT NULL CONSTRAINT DF_print_templates_IsDefault DEFAULT (0),
        PageSetupJson NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_print_templates_Page DEFAULT (N'{}'),
        FontJson     NVARCHAR(MAX)     NOT NULL CONSTRAINT DF_print_templates_Font DEFAULT (N'{}'),
        TableColumnsJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_print_templates_Columns DEFAULT (N'[]'),
        IsActive     BIT               NOT NULL CONSTRAINT DF_print_templates_IsActive DEFAULT (1),
        CreatedAt    DATETIME2(0)      NOT NULL CONSTRAINT DF_print_templates_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(0)      NULL,
        CONSTRAINT UQ_print_templates_Company_Name UNIQUE (CompanyId, NameAr),
        CONSTRAINT FK_print_templates_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

IF OBJECT_ID(N'dbo.print_template_sections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.print_template_sections
    (
        SectionId   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_print_template_sections PRIMARY KEY,
        TemplateId  INT               NOT NULL,
        SectionType NVARCHAR(30)      NOT NULL,
        RowsJson    NVARCHAR(MAX)     NOT NULL CONSTRAINT DF_print_template_sections_Rows DEFAULT (N'[]'),
        FontFamily  NVARCHAR(80)      NOT NULL CONSTRAINT DF_print_template_sections_Font DEFAULT (N'Tahoma'),
        FontSizePt  DECIMAL(5,1)      NOT NULL CONSTRAINT DF_print_template_sections_Size DEFAULT (10),
        FrameType   NVARCHAR(20)      NOT NULL CONSTRAINT DF_print_template_sections_Frame DEFAULT (N'none'),
        CONSTRAINT UQ_print_template_sections UNIQUE (TemplateId, SectionType),
        CONSTRAINT CK_print_template_sections_Type CHECK (SectionType IN (N'header_first', N'header_rest', N'footer_last')),
        CONSTRAINT CK_print_template_sections_Frame CHECK (FrameType IN (N'none', N'single', N'double')),
        CONSTRAINT FK_print_template_sections_templates FOREIGN KEY (TemplateId) REFERENCES dbo.print_templates (TemplateId)
    );
END;
GO

IF OBJECT_ID(N'dbo.report_templates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.report_templates
    (
        ReportTemplateId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_report_templates PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        NameAr       NVARCHAR(150)     NOT NULL,
        ReportType   NVARCHAR(60)      NOT NULL,
        DefinitionJson NVARCHAR(MAX)   NOT NULL CONSTRAINT DF_report_templates_Def DEFAULT (N'{}'),
        IsDefault    BIT               NOT NULL CONSTRAINT DF_report_templates_IsDefault DEFAULT (0),
        IsActive     BIT               NOT NULL CONSTRAINT DF_report_templates_IsActive DEFAULT (1),
        CONSTRAINT UQ_report_templates_Company_Name UNIQUE (CompanyId, NameAr),
        CONSTRAINT FK_report_templates_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

IF OBJECT_ID(N'dbo.zatca_invoices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.zatca_invoices
    (
        ZatcaId      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_zatca_invoices PRIMARY KEY,
        InvoiceId    BIGINT            NOT NULL,
        Uuid         UNIQUEIDENTIFIER  NOT NULL CONSTRAINT DF_zatca_invoices_Uuid DEFAULT (NEWSEQUENTIALID()),
        InvoiceHash  NVARCHAR(200)     NULL,
        QrCodeBase64 NVARCHAR(MAX)     NULL,
        SignedXml    NVARCHAR(MAX)     NULL,
        SubmissionStatus NVARCHAR(30)  NOT NULL CONSTRAINT DF_zatca_invoices_Status DEFAULT (N'pending'),
        SubmittedAt  DATETIME2(0)      NULL,
        ResponseJson NVARCHAR(MAX)     NULL,
        CONSTRAINT UQ_zatca_invoices_Invoice UNIQUE (InvoiceId),
        CONSTRAINT UQ_zatca_invoices_Uuid UNIQUE (Uuid),
        CONSTRAINT CK_zatca_invoices_Status CHECK (SubmissionStatus IN (N'pending', N'submitted', N'accepted', N'rejected', N'cancelled')),
        CONSTRAINT FK_zatca_invoices_invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.invoices (InvoiceId)
    );
END;
GO

IF OBJECT_ID(N'dbo.attachments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.attachments
    (
        AttachmentId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_attachments PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        EntityName   NVARCHAR(60)      NOT NULL,
        EntityId     NVARCHAR(60)      NOT NULL,
        FileName     NVARCHAR(200)     NOT NULL,
        MimeType     NVARCHAR(100)     NULL,
        FileSizeBytes BIGINT           NOT NULL CONSTRAINT DF_attachments_Size DEFAULT (0),
        Content      VARBINARY(MAX)    NULL,
        UploadedByUserId INT           NULL,
        UploadedAt   DATETIME2(0)      NOT NULL CONSTRAINT DF_attachments_UploadedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_attachments_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_attachments_users FOREIGN KEY (UploadedByUserId) REFERENCES dbo.app_users (UserId)
    );

    CREATE INDEX IX_attachments_Entity ON dbo.attachments (EntityName, EntityId);
END;
GO

IF OBJECT_ID(N'dbo.backup_log', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.backup_log
    (
        BackupId   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_backup_log PRIMARY KEY,
        CompanyId  INT               NULL,
        FilePath   NVARCHAR(500)     NOT NULL,
        FileSizeBytes BIGINT         NOT NULL CONSTRAINT DF_backup_log_Size DEFAULT (0),
        BackupType NVARCHAR(20)      NOT NULL CONSTRAINT DF_backup_log_Type DEFAULT (N'full'),
        Status     NVARCHAR(20)      NOT NULL CONSTRAINT DF_backup_log_Status DEFAULT (N'success'),
        Message    NVARCHAR(400)     NULL,
        CreatedAt  DATETIME2(0)      NOT NULL CONSTRAINT DF_backup_log_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_backup_log_Type CHECK (BackupType IN (N'full', N'differential', N'log', N'export')),
        CONSTRAINT CK_backup_log_Status CHECK (Status IN (N'success', N'failed')),
        CONSTRAINT FK_backup_log_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'60_print_integration', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'60_print_integration');
GO
