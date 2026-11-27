# قاعدة البيانات الموحّدة — BadelErp (SQL Server)

إعادة بناء مُطبَّعة (Normalized) لنظام `Accounts_Secure` القديم:
**150 جدولاً** بلا مفاتيح أجنبية وأرصدة مخزَّنة داخل الشجرة ⇒ **59 جدولاً** بمفاتيح
أجنبية كاملة، وقيود تحقّق، وأرصدة تُحسب من القيود والحركات.

> المصدر الوحيد للحقيقة هو ملفات `.sql` في هذا المجلد. كيانات EF Core وعقود
> TypeScript **مولَّدة** منها عبر `node tools/gen-ef-model.mjs`.

## ترتيب التشغيل

```powershell
sqlcmd -S localhost -E -i db\00_database.sql
sqlcmd -S localhost -E -i db\10_core.sql
sqlcmd -S localhost -E -i db\20_finance.sql
sqlcmd -S localhost -E -i db\30_inventory.sql
sqlcmd -S localhost -E -i db\40_invoices.sql
sqlcmd -S localhost -E -i db\50_hr.sql
sqlcmd -S localhost -E -i db\60_print_integration.sql
sqlcmd -S localhost -E -i db\65_verticals.sql   # اختياري (حسب النشاط)
sqlcmd -S localhost -E -i db\70_views.sql
sqlcmd -S localhost -E -i db\80_triggers.sql
sqlcmd -S localhost -E -i db\90_seed.sql
```

- `00_database.sql` ينشئ قاعدة `BadelErp` وجدول `dbo.schema_migrations` الذي
  يسجّل كل ملف تم تطبيقه.
- كل ملف محمي بـ `IF OBJECT_ID(...) IS NULL` ⇒ إعادة التشغيل آمنة.
- `99_drop_all.sql` **بيئة التطوير فقط**: يحذف المخطط بالكامل.

## الخرائط السريعة

| الطبقة | الملفات | الجداول |
| --- | --- | --- |
| الأساس | `10_core.sql` | 12: الشركات، الفروع، السنوات، الفترات، المستخدمون، الأدوار، الصلاحيات، التدقيق، الإعدادات، تخصيص المستندات، الترقيم |
| المالية | `20_finance.sql` | 10: العملات وأسعارها، الحسابات، مراكز الكلفة، الضرائب، الأطراف، القيود وسطورها، السندات، الشيكات |
| المخازن | `30_inventory.sql` | 10: الوحدات، المجموعات، المواد، وحداتها، الباركود، الأسعار، المستودعات، الحركات، الجرد وسطوره |
| الفواتير | `40_invoices.sql` | 4: الفواتير، السطور، المصاريف، المدفوعات |
| الموارد البشرية | `50_hr.sql` | 7: الأقسام، الموظفون، أجهزة البصمة، البصمات، الورديات، مسيّرات الرواتب وسطورها |
| الطباعة والتكامل | `60_print_integration.sql` | 6: قوالب الطباعة وأقسامها، التقارير، ZATCA، المرفقات، النسخ الاحتياطي |
| القطاعات (اختياري) | `65_verticals.sql` | 9: طاولات المطعم، غرف الفنادق وحجوزاتها، الأطباء والخدمات، أوامر التصنيع، العدادات والقراءات |

## خريطة الترحيل من النظام القديم

تفاصيل مطابقة كل جدول قديم (`AccTree`, `MatTree`, `BillSale`, `GeneralBillSet`, `SanadIn` …)
بالجداول الجديدة: [`db/mapping/legacy_to_new.md`](mapping/legacy_to_new.md).

## المبادئ المحاسبية المطبَّقة

1. **لا أرصدة مخزَّنة**: `v_account_balances` و`v_trial_balance` تحسب الرصيد من
   `journal_lines` + الأرصدة الافتتاحية في `accounts`.
2. **قيود متوازنة إلزاميًا**: `trg_journal_entries_check_post` يرفض ترحيل قيد
   مدينه ≠ دائنه، أو بأقل من سطرين.
3. **القيد المُرحَّل غير قابل للتعديل**: `trg_journal_lines_locked` (ألغِ الترحيل أولاً).
4. **المخزون لا يصبح سالبًا**: `trg_stock_movements_no_negative`.
5. **عملة مزدوجة**: كل سطر قيد يحمل `Debit/Credit` بالعملة الأصلية و
   `DebitBase/CreditBase` بالعملة الأساسية حسب `ExchangeRate`.
6. **الضريبة**: نسبة ومبلغ على مستوى السطر (`invoice_lines.TaxRate/TaxAmount`) مع مرجع
   في `taxes`، والفوترة الإلكترونية في `zatca_invoices`.

## التحقق

```bash
# فحص صياغة T-SQL (لهجة tsql)
python -m sqlfluff parse --dialect tsql db/20_finance.sql

# بعد التعديل على SQL: أعد توليد طبقة البيانات
node tools/gen-ef-model.mjs
```

## اصطلاحات التسمية

- الجداول `snake_case` جمع، الأعمدة `PascalCase`، المفاتيح `<Table>Id`.
- كل جدول تشغيلي يحمل `CompanyId` (تعدد الشركات) و`BranchId` عند الحاجة.
- الحقول الاختيارية الخاصة بقطاع (طاولة/غرفة/طبيب) تُخزَّن في
  `invoices.MetadataJson` بدل إضافة أعمدة لكل قطاع.
- تخصيص أنواع المستندات (بديل `GeneralBillSet` بـ 490 إعداداً) في
  `document_type_configs.SettingsJson`.
