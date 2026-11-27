/* =====================================================================
   50_hr.sql — الموارد البشرية والرواتب والبصمة
   يعادل: machines, attLog, period, DetailLogON, DetailLogOff, Vacation,
          CashAdvance, addtions, Sanction, SalTable, DetailSalTable
   ===================================================================== */
USE BadelErp;
GO

IF OBJECT_ID(N'dbo.departments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.departments
    (
        DepartmentId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_departments PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        Code         NVARCHAR(20)      NOT NULL,
        NameAr       NVARCHAR(150)     NOT NULL,
        ManagerName  NVARCHAR(150)     NULL,
        Notes        NVARCHAR(300)     NULL,
        IsActive     BIT               NOT NULL CONSTRAINT DF_departments_IsActive DEFAULT (1),
        CONSTRAINT UQ_departments_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT FK_departments_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

IF OBJECT_ID(N'dbo.employees', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.employees
    (
        EmployeeId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_employees PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        Code          NVARCHAR(30)      NOT NULL,
        NameAr        NVARCHAR(200)     NOT NULL,
        DepartmentId  INT               NULL,
        JobTitle      NVARCHAR(120)     NULL,
        BaseSalary    DECIMAL(18,4)     NOT NULL CONSTRAINT DF_employees_Base DEFAULT (0),
        Phone         NVARCHAR(40)      NULL,
        NationalId    NVARCHAR(40)      NULL,
        HireDate      DATE              NULL,
        TerminationDate DATE            NULL,
        BankAccount   NVARCHAR(60)      NULL,
        DeviceUserId  NVARCHAR(40)      NULL,
        IsActive      BIT               NOT NULL CONSTRAINT DF_employees_IsActive DEFAULT (1),
        CONSTRAINT UQ_employees_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_employees_Base CHECK (BaseSalary >= 0),
        CONSTRAINT FK_employees_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_employees_departments FOREIGN KEY (DepartmentId) REFERENCES dbo.departments (DepartmentId)
    );
END;
GO

IF OBJECT_ID(N'dbo.attendance_machines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.attendance_machines
    (
        MachineId  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_attendance_machines PRIMARY KEY,
        CompanyId  INT               NOT NULL,
        Code       NVARCHAR(30)      NOT NULL,
        NameAr     NVARCHAR(120)     NOT NULL,
        Model      NVARCHAR(60)      NULL,
        IpAddress  NVARCHAR(60)      NULL,
        PortNo     INT               NULL,
        IsActive   BIT               NOT NULL CONSTRAINT DF_attendance_machines_IsActive DEFAULT (1),
        LastSyncAt DATETIME2(0)      NULL,
        CONSTRAINT UQ_attendance_machines_Code UNIQUE (CompanyId, Code),
        CONSTRAINT FK_attendance_machines_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

IF OBJECT_ID(N'dbo.attendance_punches', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.attendance_punches
    (
        PunchId    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_attendance_punches PRIMARY KEY,
        MachineId  INT               NOT NULL,
        EmployeeId INT               NULL,
        DeviceUserId NVARCHAR(40)    NULL,
        PunchAt    DATETIME2(0)      NOT NULL,
        Direction  NVARCHAR(10)      NOT NULL CONSTRAINT DF_attendance_punches_Dir DEFAULT (N'in'),
        RawJson    NVARCHAR(MAX)     NULL,
        CONSTRAINT CK_attendance_punches_Dir CHECK (Direction IN (N'in', N'out', N'unknown')),
        CONSTRAINT FK_attendance_punches_machines FOREIGN KEY (MachineId) REFERENCES dbo.attendance_machines (MachineId),
        CONSTRAINT FK_attendance_punches_employees FOREIGN KEY (EmployeeId) REFERENCES dbo.employees (EmployeeId)
    );

    CREATE INDEX IX_attendance_punches_Emp ON dbo.attendance_punches (EmployeeId, PunchAt);
END;
GO

IF OBJECT_ID(N'dbo.shift_periods', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.shift_periods
    (
        ShiftId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_shift_periods PRIMARY KEY,
        CompanyId    INT               NOT NULL,
        NameAr       NVARCHAR(80)      NOT NULL,
        StartTime    TIME(0)           NOT NULL,
        EndTime      TIME(0)           NOT NULL,
        GraceMinutes INT               NOT NULL CONSTRAINT DF_shift_periods_Grace DEFAULT (0),
        IsOvernight  BIT               NOT NULL CONSTRAINT DF_shift_periods_Overnight DEFAULT (0),
        CONSTRAINT FK_shift_periods_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId)
    );
END;
GO

IF OBJECT_ID(N'dbo.payroll_runs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.payroll_runs
    (
        RunId         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payroll_runs PRIMARY KEY,
        CompanyId     INT               NOT NULL,
        PeriodYear    SMALLINT          NOT NULL,
        PeriodMonth   TINYINT           NOT NULL,
        Status        NVARCHAR(20)      NOT NULL CONSTRAINT DF_payroll_runs_Status DEFAULT (N'draft'),
        JournalEntryId BIGINT           NULL,
        CreatedByUserId INT             NULL,
        CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_payroll_runs_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_payroll_runs UNIQUE (CompanyId, PeriodYear, PeriodMonth),
        CONSTRAINT CK_payroll_runs_Month CHECK (PeriodMonth BETWEEN 1 AND 12),
        CONSTRAINT CK_payroll_runs_Status CHECK (Status IN (N'draft', N'posted', N'void')),
        CONSTRAINT FK_payroll_runs_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_payroll_runs_entries FOREIGN KEY (JournalEntryId) REFERENCES dbo.journal_entries (EntryId),
        CONSTRAINT FK_payroll_runs_users FOREIGN KEY (CreatedByUserId) REFERENCES dbo.app_users (UserId)
    );
END;
GO

IF OBJECT_ID(N'dbo.payroll_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.payroll_lines
    (
        RunLineId    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payroll_lines PRIMARY KEY,
        RunId        BIGINT            NOT NULL,
        EmployeeId   INT               NOT NULL,
        BaseSalary   DECIMAL(18,4)     NOT NULL CONSTRAINT DF_payroll_lines_Base DEFAULT (0),
        Allowances   DECIMAL(18,4)     NOT NULL CONSTRAINT DF_payroll_lines_Allow DEFAULT (0),
        Overtime     DECIMAL(18,4)     NOT NULL CONSTRAINT DF_payroll_lines_Overtime DEFAULT (0),
        Deductions   DECIMAL(18,4)     NOT NULL CONSTRAINT DF_payroll_lines_Deduct DEFAULT (0),
        Advances     DECIMAL(18,4)     NOT NULL CONSTRAINT DF_payroll_lines_Advances DEFAULT (0),
        Penalties    DECIMAL(18,4)     NOT NULL CONSTRAINT DF_payroll_lines_Penalties DEFAULT (0),
        NetSalary    AS (CAST(((BaseSalary + Allowances + Overtime) - Deductions - Advances - Penalties) AS DECIMAL(18,4))) PERSISTED,
        Notes        NVARCHAR(300)     NULL,
        CONSTRAINT UQ_payroll_lines UNIQUE (RunId, EmployeeId),
        CONSTRAINT FK_payroll_lines_runs FOREIGN KEY (RunId) REFERENCES dbo.payroll_runs (RunId),
        CONSTRAINT FK_payroll_lines_employees FOREIGN KEY (EmployeeId) REFERENCES dbo.employees (EmployeeId)
    );
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'50_hr', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'50_hr');
GO
