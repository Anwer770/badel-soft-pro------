/* =====================================================================
   90_seed.sql — بيانات تأسيسية: شركة/فرع/سنة مالية، عملات، وحدات،
                دليل حسابات أساسي، مستودع، مراكز كلفة، ضرائب،
                أنواع المستندات، سلاسل الأرقام، أدوار وصلاحيات، مستخدم admin
   قابل لإعادة التشغيل: كل كتلة محمية بـ IF NOT EXISTS.
   ===================================================================== */
USE BadelErp;
GO

/* ------------------------------ الشركة -------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.companies)
BEGIN
    INSERT INTO dbo.companies (Code, NameAr, NameEn, TaxNumber, Address, Phone)
    VALUES (N'001', N'بديل سوفت برو', N'Badel Soft Pro', N'770201607', N'صنعاء - اليمن', N'01-000000');
END;
GO

DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);

/* ------------------------------- الفرع -------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.branches WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.branches (CompanyId, Code, NameAr, IsMain)
    VALUES (@CompanyId, N'1', N'الفرع الرئيسي', 1);
END;
GO

DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);
DECLARE @BranchId  INT = (SELECT TOP (1) BranchId FROM dbo.branches WHERE CompanyId = @CompanyId ORDER BY BranchId);

/* --------------------------- السنة المالية ---------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.fiscal_years WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.fiscal_years (CompanyId, Code, StartDate, EndDate, Status)
    VALUES (@CompanyId, N'2026', '2026-01-01', '2026-12-31', N'open');

    DECLARE @FyId INT = (SELECT TOP (1) FiscalYearId FROM dbo.fiscal_years WHERE CompanyId = @CompanyId ORDER BY FiscalYearId);

    ;WITH Months AS
    (
        SELECT 1 AS M
        UNION ALL SELECT M + 1 FROM Months WHERE M < 12
    )
    INSERT INTO dbo.fiscal_periods (FiscalYearId, MonthNo, StartDate, EndDate)
    SELECT
        @FyId,
        M,
        DATEFROMPARTS(2026, M, 1),
        EOMONTH(DATEFROMPARTS(2026, M, 1))
    FROM Months;
END;
GO

DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);

/* ------------------------------ العملات -------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.currencies)
BEGIN
    INSERT INTO dbo.currencies (Code, NameAr, Symbol, DecimalPlaces, IsBase)
    VALUES
        (N'YER', N'ريال يمني', N'ر.ي', 2, 1),
        (N'USD', N'دولار أمريكي', N'$', 2, 0),
        (N'SAR', N'ريال سعودي', N'ر.س', 2, 0);
END;
GO

DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);
DECLARE @Yer INT = (SELECT CurrencyId FROM dbo.currencies WHERE Code = N'YER');
DECLARE @Usd INT = (SELECT CurrencyId FROM dbo.currencies WHERE Code = N'USD');

IF NOT EXISTS (SELECT 1 FROM dbo.currency_rates)
BEGIN
    INSERT INTO dbo.currency_rates (CurrencyId, RateDate, Rate)
    VALUES (@Usd, '2026-01-01', 250.00000000);
END;
GO

/* -------------------------- دليل الحسابات -------------------------------
   رمز الحساب | الاسم | الحساب الأب | المستوى | النوع | الطبيعة | الأوراق
   ---------------------------------------------------------------------- */
DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);
DECLARE @Yer INT = (SELECT CurrencyId FROM dbo.currencies WHERE Code = N'YER');

/* المستوى 1 */
IF NOT EXISTS (SELECT 1 FROM dbo.accounts WHERE CompanyId = @CompanyId AND Code = N'1')
BEGIN
    INSERT INTO dbo.accounts (CompanyId, Code, NameAr, ParentId, Level, AccountType, Nature, IsLeaf, CurrencyId)
    VALUES
        (@CompanyId, N'1', N'الأصول', NULL, 1, N'header', N'D', 0, @Yer),
        (@CompanyId, N'2', N'الخصوم', NULL, 1, N'header', N'C', 0, @Yer),
        (@CompanyId, N'3', N'حقوق الملكية', NULL, 1, N'header', N'C', 0, @Yer),
        (@CompanyId, N'4', N'الإيرادات', NULL, 1, N'header', N'C', 0, @Yer),
        (@CompanyId, N'5', N'المصاريف', NULL, 1, N'header', N'D', 0, @Yer);
END;

/* المستوى 2 */
INSERT INTO dbo.accounts (CompanyId, Code, NameAr, ParentId, Level, AccountType, Nature, IsLeaf, CurrencyId)
SELECT @CompanyId, v.Code, v.NameAr, p.AccountId, 2, N'header', p.Nature, 0, @Yer
FROM (VALUES
        (N'11', N'النقدية وما يعادلها', N'1'),
        (N'12', N'المدينون وأوراق القبض', N'1'),
        (N'13', N'المخزون', N'1'),
        (N'14', N'الأصول الثابتة', N'1'),
        (N'21', N'الدائنون وأوراق الدفع', N'2'),
        (N'22', N'الضرائب', N'2'),
        (N'41', N'المبيعات', N'4'),
        (N'42', N'الخصم المكتسب', N'4'),
        (N'52', N'مصاريف تشغيلية', N'5'),
        (N'55', N'حسابات الجرد', N'5')
     ) AS v (Code, NameAr, ParentCode)
INNER JOIN dbo.accounts AS p ON p.CompanyId = @CompanyId AND p.Code = v.ParentCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.accounts AS a WHERE a.CompanyId = @CompanyId AND a.Code = v.Code);

/* المستوى 3 — الحسابات الفرعية القابلة للترحيل */
INSERT INTO dbo.accounts
(
    CompanyId, Code, NameAr, ParentId, Level, AccountType, Nature, IsLeaf, CurrencyId,
    IsCash, IsBank, IsCustomer, IsSupplier, IsAgent, IsInventory, IsRevenue, IsExpense,
    AllowDiscount, ShowInGeneralReport
)
SELECT
    @CompanyId, v.Code, v.NameAr, p.AccountId, 3, N'ledger', v.Nature, 1, @Yer,
    v.IsCash, v.IsBank, v.IsCustomer, v.IsSupplier, 0, v.IsInventory, v.IsRevenue, v.IsExpense,
    v.AllowDiscount, 1
FROM (VALUES
        (N'1101', N'الصندوق الرئيسي',        N'11', N'D', 1, 0, 0, 0, 0, 0, 0, 1),
        (N'1102', N'الصندوق الفرعي',         N'11', N'D', 1, 0, 0, 0, 0, 0, 0, 1),
        (N'1103', N'البنك التجاري',          N'11', N'D', 0, 1, 0, 0, 0, 0, 0, 1),
        (N'1201', N'حساب العملاء',           N'12', N'D', 0, 0, 1, 0, 0, 0, 0, 1),
        (N'1202', N'أوراق القبض',            N'12', N'D', 0, 0, 0, 0, 0, 0, 0, 0),
        (N'1301', N'مخزون البضاعة',          N'13', N'D', 0, 0, 0, 0, 0, 1, 0, 1),
        (N'1401', N'الأثاث والمعدات',        N'14', N'D', 0, 0, 0, 0, 0, 0, 0, 0),
        (N'1402', N'مجمع الإهلاك',           N'14', N'C', 0, 0, 0, 0, 0, 0, 0, 0),
        (N'2101', N'حساب الموردون',          N'21', N'C', 0, 0, 0, 1, 0, 0, 0, 1),
        (N'2102', N'أوراق الدفع',            N'21', N'C', 0, 0, 0, 0, 0, 0, 0, 0),
        (N'2201', N'ضريبة القيمة المضافة',   N'22', N'C', 0, 0, 0, 0, 0, 0, 0, 1),
        (N'3101', N'رأس المال',              N'3',  N'C', 0, 0, 0, 0, 0, 0, 0, 1),
        (N'3201', N'الأرباح المحتجزة',       N'3',  N'C', 0, 0, 0, 0, 0, 0, 0, 1),
        (N'4101', N'المبيعات',               N'41', N'C', 0, 0, 0, 0, 0, 0, 1, 1),
        (N'4102', N'مردودات المبيعات',       N'41', N'D', 0, 0, 0, 0, 0, 0, 0, 1),
        (N'4201', N'الخصم المكتسب',          N'42', N'C', 0, 0, 0, 0, 0, 0, 0, 1),
        (N'5101', N'تكلفة البضاعة المباعة',  N'5',  N'D', 0, 0, 0, 0, 0, 1, 0, 1),
        (N'5201', N'مصاريف عمومية وإدارية',  N'52', N'D', 0, 0, 0, 0, 0, 0, 1, 1),
        (N'5202', N'مصاريف نقل وشحن',        N'52', N'D', 0, 0, 0, 0, 0, 0, 1, 1),
        (N'5301', N'الخصم المسموح به',       N'5',  N'D', 0, 0, 0, 0, 0, 0, 1, 1),
        (N'5401', N'فروق العملة',            N'5',  N'D', 0, 0, 0, 0, 0, 0, 0, 0),
        (N'5501', N'فائض الجرد',             N'55', N'C', 0, 0, 0, 0, 0, 0, 0, 1),
        (N'5502', N'عجز الجرد',              N'55', N'D', 0, 0, 0, 0, 0, 0, 0, 1)
     ) AS v (Code, NameAr, ParentCode, Nature, IsCash, IsBank, IsCustomer, IsSupplier,
             IsInventory, IsRevenue, IsExpense, AllowDiscount)
INNER JOIN dbo.accounts AS p ON p.CompanyId = @CompanyId AND p.Code = v.ParentCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.accounts AS a WHERE a.CompanyId = @CompanyId AND a.Code = v.Code);

/* علم «الخصم المسموح به» على حساب 5301 ليتوافق مع خصائص النموذج */
UPDATE dbo.accounts
   SET AllowDiscount = 1
WHERE CompanyId = @CompanyId AND Code = N'5301';
GO

/* ------------------- مراكز الكلفة والوحدات والمستودع ------------------ */
DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);
DECLARE @BranchId  INT = (SELECT TOP (1) BranchId FROM dbo.branches WHERE CompanyId = @CompanyId ORDER BY BranchId);
DECLARE @Yer INT = (SELECT CurrencyId FROM dbo.currencies WHERE Code = N'YER');

IF NOT EXISTS (SELECT 1 FROM dbo.cost_centers WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.cost_centers (CompanyId, Code, NameAr, Level)
    VALUES (@CompanyId, N'CC-01', N'المركز الرئيسي', 1),
           (@CompanyId, N'CC-02', N'قسم المبيعات والتوزيع', 1);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.units WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.units (CompanyId, Code, NameAr)
    VALUES (@CompanyId, N'U1', N'حبة'),
           (@CompanyId, N'U2', N'علبة'),
           (@CompanyId, N'U3', N'كرتون'),
           (@CompanyId, N'U4', N'كيلوجرام');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.warehouses WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.warehouses (CompanyId, BranchId, Code, NameAr, Location, Keeper)
    VALUES (@CompanyId, @BranchId, N'1', N'المستودع الرئيسي', N'صنعاء', N'أمين المخزن');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.item_groups WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.item_groups (CompanyId, Code, NameAr, Level, DefaultUnitId, TaxRate, RequireExpiry)
    SELECT @CompanyId, N'01', N'المواد الرئيسية', 1,
           (SELECT TOP (1) UnitId FROM dbo.units WHERE CompanyId = @CompanyId ORDER BY UnitId), 0, 0;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.taxes WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.taxes (CompanyId, Code, NameAr, Rate, TaxAccountId)
    SELECT @CompanyId, N'VAT15', N'ضريبة القيمة المضافة 15%', 15,
           (SELECT AccountId FROM dbo.accounts WHERE CompanyId = @CompanyId AND Code = N'2201');

    INSERT INTO dbo.taxes (CompanyId, Code, NameAr, Rate, TaxAccountId)
    SELECT @CompanyId, N'VAT5', N'ضريبة القيمة المضافة 5%', 5,
           (SELECT AccountId FROM dbo.accounts WHERE CompanyId = @CompanyId AND Code = N'2201');
END;
GO

/* ------------------- أنواع المستندات وخصائصها ------------------------- */
DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);

INSERT INTO dbo.document_type_configs (CompanyId, DocTypeCode, DisplayNameAr, SettingsJson)
SELECT @CompanyId, v.Code, v.NameAr, v.Json
FROM (VALUES
    (N'sale',            N'فاتورة مبيعات',            N'{"payType":"credit","showBonus":true,"printTemplate":"نموذج مبيعات 1"}'),
    (N'sale_return',     N'فاتورة مردود مبيعات',      N'{"payType":"credit"}'),
    (N'purchase',        N'فاتورة مشتريات',           N'{"payType":"credit","showRowNotes":true,"calcBonusInCost":false}'),
    (N'purchase_return', N'فاتورة مردود مشتريات',     N'{"payType":"credit","showRowNotes":true}'),
    (N'in',              N'مذكرة إدخال مخزني',        N'{"payType":null}'),
    (N'out',             N'مذكرة إخراج مخزني',        N'{"payType":null}'),
    (N'transfer',        N'تحويل بين مستودعات',       N'{"payType":null}'),
    (N'sale_order',      N'طلب بيع',                  N'{"affectsStock":false}'),
    (N'purchase_order',  N'طلب شراء',                 N'{"affectsStock":false}'),
    (N'quote',           N'عرض أسعار',                N'{"affectsStock":false}'),
    (N'reserve',         N'حجز مبيعات',               N'{"affectsStock":false}'),
    (N'assembly',        N'نموذج مكونات مادة',        N'{"payType":null}'),
    (N'service',         N'فاتورة خدمات',             N'{"payType":"cash"}'),
    (N'maintenance',     N'فاتورة صيانة',             N'{"payType":"cash"}')
     ) AS v (Code, NameAr, Json)
WHERE NOT EXISTS
(
    SELECT 1 FROM dbo.document_type_configs AS c
    WHERE c.CompanyId = @CompanyId AND c.DocTypeCode = v.Code
);

/* ------------------------- سلاسل أرقام المستندات ---------------------- */
INSERT INTO dbo.number_sequences (CompanyId, BranchId, DocTypeCode, Prefix, NextNumber, PadWidth)
SELECT @CompanyId, NULL, v.Code, v.Prefix, 1, 6
FROM (VALUES
    (N'sale', N'S'),
    (N'sale_return', N'SR'),
    (N'purchase', N'P'),
    (N'purchase_return', N'PR'),
    (N'in', N'IN'),
    (N'out', N'OUT'),
    (N'transfer', N'TR'),
    (N'sale_order', N'SO'),
    (N'purchase_order', N'PO'),
    (N'quote', N'QT'),
    (N'reserve', N'RS'),
    (N'receipt', N'RV'),
    (N'payment', N'PV'),
    (N'journal', N'JV'),
    (N'inventory', N'ST')
     ) AS v (Code, Prefix)
WHERE NOT EXISTS
(
    SELECT 1 FROM dbo.number_sequences AS s
    WHERE s.CompanyId = @CompanyId AND s.BranchId IS NULL AND s.DocTypeCode = v.Code
);
GO

/* ------------------- الأدوار والصلاحيات والمستخدم admin --------------- */
DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);

IF NOT EXISTS (SELECT 1 FROM dbo.permissions)
BEGIN
    INSERT INTO dbo.permissions (Code, ModuleCode, NameAr)
    VALUES
        (N'accounts.view',   N'accounts',  N'عرض دليل الحسابات'),
        (N'accounts.edit',   N'accounts',  N'إضافة/تعديل الحسابات'),
        (N'journal.post',    N'accounts',  N'ترحيل القيود'),
        (N'vouchers.create', N'accounts',  N'إنشاء سندات القبض والصرف'),
        (N'sales.create',    N'sales',     N'إنشاء فواتير المبيعات'),
        (N'sales.void',      N'sales',     N'إلغاء فواتير المبيعات'),
        (N'purchase.create', N'purchase',  N'إنشاء فواتير المشتريات'),
        (N'items.edit',      N'inventory', N'إدارة المواد والمستودعات'),
        (N'stock.count',     N'inventory', N'الجرد واعتماده'),
        (N'reports.view',    N'reports',   N'عرض التقارير'),
        (N'print.templates', N'reports',   N'تعديل قوالب الطباعة'),
        (N'settings.edit',   N'settings',  N'تعديل إعدادات النظام'),
        (N'users.manage',    N'settings',  N'إدارة المستخدمين والصلاحيات'),
        (N'audit.view',      N'settings',  N'عرض سجل التدقيق');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.roles)
BEGIN
    INSERT INTO dbo.roles (CompanyId, Code, NameAr, IsSystem)
    VALUES (@CompanyId, N'admin', N'مدير النظام', 1),
           (@CompanyId, N'accountant', N'محاسب', 1),
           (@CompanyId, N'cashier', N'كاشير', 1);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.role_permissions)
BEGIN
    INSERT INTO dbo.role_permissions (RoleId, PermissionId)
    SELECT r.RoleId, p.PermissionId
    FROM dbo.roles AS r
    CROSS JOIN dbo.permissions AS p
    WHERE r.Code = N'admin';
END;

IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE Username = N'admin')
BEGIN
    INSERT INTO dbo.app_users (CompanyId, Username, FullName, PasswordHash)
    VALUES (@CompanyId, N'admin', N'مدير النظام', N'CHANGE_ME_PBKDF2_HASH');
END;

INSERT INTO dbo.user_roles (UserId, RoleId)
SELECT u.UserId, r.RoleId
FROM dbo.app_users AS u
CROSS JOIN dbo.roles AS r
WHERE u.Username = N'admin'
  AND r.Code = N'admin'
  AND NOT EXISTS (SELECT 1 FROM dbo.user_roles AS x WHERE x.UserId = u.UserId AND x.RoleId = r.RoleId);
GO

/* --------------------- إعدادات عامة وقالب طباعة ----------------------- */
DECLARE @CompanyId INT = (SELECT TOP (1) CompanyId FROM dbo.companies ORDER BY CompanyId);

INSERT INTO dbo.app_settings (CompanyId, SettingKey, SettingValue, ValueType)
SELECT @CompanyId, v.K, v.V, v.T
FROM (VALUES
    (N'company.name',            N'بديل سوفت برو',        N'string'),
    (N'company.address',         N'صنعاء - اليمن',         N'string'),
    (N'company.phone',           N'01-000000',             N'string'),
    (N'invoice.defaultPayType',  N'credit',                N'string'),
    (N'invoice.printTemplate',   N'نموذج مبيعات 1',        N'string'),
    (N'inventory.pricing',       N'weighted_average',      N'string'),
    (N'ui.direction',            N'rtl',                   N'string'),
    (N'ui.digits',               N'arabic',                N'string')
     ) AS v (K, V, T)
WHERE NOT EXISTS (SELECT 1 FROM dbo.app_settings AS s WHERE s.CompanyId = @CompanyId AND s.SettingKey = v.K);

IF NOT EXISTS (SELECT 1 FROM dbo.print_templates WHERE CompanyId = @CompanyId)
BEGIN
    INSERT INTO dbo.print_templates (CompanyId, NameAr, DocTypeCode, IsDefault, PageSetupJson, FontJson, TableColumnsJson)
    VALUES
    (
        @CompanyId,
        N'نموذج مبيعات 1',
        N'sale',
        1,
        N'{"copies":1,"margins":{"top":2,"right":2,"bottom":2,"left":2},"pageFrame":"none","direction":"rtl"}',
        N'{"title":"Tahoma, 12pt","table":"Tahoma, 10pt","totals":"Tahoma, 10pt Bold"}',
        N'[{"id":"barcode","width":"90","visible":true},{"id":"name","width":"260","visible":true},{"id":"qty","width":"70","visible":true},{"id":"price","width":"80","visible":true},{"id":"total","width":"95","visible":true}]'
    );

    INSERT INTO dbo.print_template_sections (TemplateId, SectionType, RowsJson, FrameType)
    SELECT TemplateId, N'header_first',
           N'[{"right":"[اسم الشركة]","center":"","left":"","mm":20}]',
           N'none'
    FROM dbo.print_templates
    WHERE CompanyId = @CompanyId AND NameAr = N'نموذج مبيعات 1';
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'90_seed', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'90_seed');
GO
