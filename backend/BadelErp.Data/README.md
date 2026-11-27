# BadelErp.Data — طبقة البيانات (.NET 8 + EF Core 8 + SQL Server)

> ملفات `Entities/*.cs` و`ErpDbContext.cs` **مولَّدة آليًا** من مخطط SQL.
> لا تعدّلها يدويًا؛ عدّل `db/*.sql` ثم:

```bash
node tools/gen-ef-model.mjs
```

## المتطلبات

- .NET SDK 8.0
- SQL Server 2019+ مع قاعدة `BadelErp` مُنشأة من `db/` (راجع `db/README.md`)

## التهيئة

```bash
cd backend/BadelErp.Data
dotnet restore
dotnet build
```

سلسلة الاتصال تُقرأ من متغيّر البيئة `BADEL_DB` أو من الافتراضي في
`ErpDbContextFactory`:

```
Server=localhost;Database=BadelErp;Trusted_Connection=True;TrustServerCertificate=True;
```

## الاستخدام في تطبيق ASP.NET Core

```csharp
builder.Services.AddDbContext<ErpDbContext>(options =>
    options.UseSqlServer(
        ErpDbContextFactory.ResolveConnectionString(builder.Configuration.GetConnectionString("BadelErp")),
        sql => sql.EnableRetryOnFailure(3)));

builder.Services.AddScoped<JournalPostingService>();
```

## ترحيل قيد متوازن

```csharp
var result = await journalService.PostAsync(new JournalEntryDraft(
    CompanyId: 1,
    FiscalYearId: 1,
    EntryDate: DateOnly.FromDateTime(DateTime.Today),
    CurrencyId: 1,
    Description: "فاتورة مبيعات S000001",
    SourceType: "invoice",
    SourceId: "123",
    Lines: new[]
    {
        new JournalLineDraft(AccountId: 9,  Debit: 11500m, Credit: 0m, PartyId: 1),
        new JournalLineDraft(AccountId: 14, Debit: 0m,   Credit: 10000m),
        new JournalLineDraft(AccountId: 11, Debit: 0m,   Credit: 1500m),
    }));
```

الخدمة تتحقّق من: سطرين على الأقل، عدم الجمع بين مدين ودائن في سطر، تطابق
المدين مع الدائن، ثم تُرحّل داخل معاملة وتحفظ رقم القيد من `number_sequences`.
قواعد الحماية مكرَّرة في قاعدة البيانات (Triggers) لضمان السلامة حتى لو تم
التعديل خارج التطبيق.

## ملاحظات معمارية

- **Database-First**: المخطط مملوك لملفات `db/*.sql`، لذا **لا تستخدم
  `dotnet ef migrations`** لإنشائها (تجنّب الانحراف). إن رغبت لاحقًا في
  Migrations، استخدم `dotnet ef dbcontext scaffold` بعد إنشاء القاعدة.
- الأرصدة تُحسب من العروض: `v_account_balances`, `v_trial_balance`,
  `v_item_stock`, `v_party_balances`, `v_invoice_profit`.
- `DateOnly`/`TimeOnly` مدعومة في EF Core 8 مع SQL Server.
- الحقول المحسوبة (`LineTotal`, `DiffQty`, `NetSalary`, `Consumption`) مسجّلة
  كـ `HasComputedColumnSql(stored: true)` فلا تُكتب من التطبيق.
