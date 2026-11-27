/* =====================================================================
   Badel ERP — قاعدة البيانات الموحّدة (Unified Schema)
   الهدف: إعادة بناء نظام Accounts_Secure (150 جدولاً قديماً) في مخطط
          نظيف مُطبَّع (~45 جدولاً أساسياً + جداول اختيارية للقطاعات).
   السيرفر: SQL Server 2019+  |  الملف: 00_database.sql
   التشغيل: sqlcmd -S <server> -E -i db/00_database.sql
   ===================================================================== */

IF DB_ID(N'BadelErp') IS NULL
BEGIN
    CREATE DATABASE BadelErp;
END;
GO

ALTER DATABASE BadelErp SET RECOVERY SIMPLE;
GO

USE BadelErp;
GO

IF SCHEMA_ID(N'dbo') IS NULL
    EXEC (N'CREATE SCHEMA dbo AUTHORIZATION dbo');
GO

IF OBJECT_ID(N'dbo.schema_migrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.schema_migrations
    (
        MigrationId   NVARCHAR(100) NOT NULL CONSTRAINT PK_schema_migrations PRIMARY KEY,
        AppliedAt     DATETIME2(0)  NOT NULL CONSTRAINT DF_schema_migrations_AppliedAt DEFAULT (SYSUTCDATETIME()),
        AppliedBy     NVARCHAR(100) NULL,
        ScriptHash    NVARCHAR(64)  NULL
    );
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'00_database', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'00_database');
GO
