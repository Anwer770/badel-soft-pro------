# خريطة الترحيل: `Accounts_Secure` (150 جدولاً) → `BadelErp` (59 جدولاً)

المرجع: تحليل `Accounts.exe` و`remoteClassLibrarySecond.dll` وقاعدة `dbBillEAccount`.

## 1) الأساس والصلاحيات

| الجدول القديم | الجدول الجديد | ملاحظات |
| --- | --- | --- |
| `Genral` | `app_settings` + `companies` | إعدادات مفتاح/قيمة + بيانات الشركة |
| `filecompany` | `companies` | مع `TaxNumber` للفوترة الإلكترونية |
| `fileyear` | `fiscal_years` + `fiscal_periods` | إقفال شهري في `fiscal_periods.IsClosed` |
| `accMoveLock`, `monthClose` | `fiscal_periods` | لا جداول منفصلة للإقفال |
| `users` | `app_users` + `user_roles` | كلمات المرور PBKDF2 في `PasswordHash` |
| `UserACC`, `UserPerAcc`, `DetaleUserList` | `permissions` + `role_permissions` | RBAC موحّد بدل 3 جداول صلاحيات |
| `MoveEdit`, `MoveDelete` | `audit_log` | JSON للقيم قبل/بعد |
| `GeneralBillSet` (490 إعداداً) | `document_type_configs.SettingsJson` | مخطّط JSON واحد لكل نوع مستند |

## 2) المحاسبة

| الجدول القديم | الجدول الجديد | ملاحظات |
| --- | --- | --- |
| `AccTree` (129 عموداً) | `accounts` + `parties` | الأعلام (زبون/مورد/مندوب/نقدية/بنك/مخزون) أعمدة منطقية؛ بيانات الاتصال في `parties` |
| `Currancy`, `AccCurrancy` | `currencies`, `currency_rates` | سعر صرف بتاريخ |
| `CostPoint1`, `CostPoint2`, `AccCost`, `CostDestr` | `cost_centers` | شجرة `ParentId` بدل مستويين ثابتين |
| `AccMove` | `journal_entries` + `journal_lines` | قيد + سطور موحّدة |
| `AccEntryRec`, `ComplexEntry`, `ComplexEntry2` | `journal_entries.SourceType/SourceId` | لا حاجة لجداول قيود منفصلة |
| `BillEntry` | `journal_entries` (ترحيل آلي) | القيد يُنشأ من خدمة الترحيل |
| `SanadIn`, `SanadOut` | `receipt_vouchers` | `DocType` = receipt/payment |
| `SanadDetal` | `invoice_payments` (للدفعات) | تفاصيل السند في `receipt_vouchers` |
| `SanadInColect`, `SanadOutColect`, `Jero` | `cheques` | حالات: تحت التحصيل/محصّل/مرتجع/مظهَّر |
| `Depreciation` | `journal_entries` + `items`/`accounts` | الإهلاك قيد دوري (المرحلة 5) |

## 3) المخازن والمواد

| الجدول القديم | الجدول الجديد | ملاحظات |
| --- | --- | --- |
| `MatTree` (172 عموداً), `service` | `items` + `item_units` + `item_prices` + `item_barcodes` | `ItemType` = product/service/raw_material |
| `matUnitBarPrice`, `MatAltCode` | `item_barcodes`, `item_prices` | باركود متعدد + 5 مستويات سعر |
| `Stock`, `StockMat` | `stock_movements` + `v_item_stock` | الرصيد محسوب لا مخزَّن |
| `MatExpDate`, `BillMatExpDate` | `stock_movements.ExpiryDate/BatchNo` | تتبّع الصلاحية على الحركة |
| `BonasCPay`, `BonasCSal` | `invoice_lines.BonusQty` | البونص على السطر/السند |
| جداول الجرد | `inventory_sheets` + `inventory_sheet_lines` | `CountMethod` + متوسط التكلفة المرجّح |

## 4) الفواتير (12 جدولاً → جدولان)

| الجدول القديم | `DocTypeCode` الجديد |
| --- | --- |
| `BillSale` | `sale` |
| `BillReSale` | `sale_return` |
| `BillPay` | `purchase` |
| `BillRePAy` | `purchase_return` |
| `BillIn` | `in` |
| `BillOut` | `out` |
| `BillTrans` | `transfer` |
| `BillSaleOrder` | `sale_order` |
| `BillPayOrder` | `purchase_order` |
| `BillPriceList` | `quote` |
| `BillSaleHotel`, `BillRest`, `billDoctor`, `BillSyana` | `hotel`, `restaurant`, `clinic`, `maintenance` + `MetadataJson` |
| `Detail` | `invoice_lines` |
| `ExpBill` | `invoice_expenses` |
| `TVARate`, `TVAAmount`, `TVAAcc` | `invoice_lines.TaxRate/TaxAmount` + `taxes` |
| `chkBillElectrony` | `zatca_invoices` |

## 5) القطاعات (اختيارية)

| القديم | الجديد |
| --- | --- |
| `SalTable`, `Garsone`, `parts` | `restaurant_tables` + `invoices.MetadataJson` |
| `hotel`, `room` | `hotel_rooms` |
| `roomReserves`, `personalData`, `roomCheck` | `hotel_reservations` |
| `doctor`, `nurse`, `rateDoctor`, `classAge`, `rateservice` | `doctors`, `medical_services` |
| `FacModal`, `FacMat`, `Fmat`, `stages`, `stageQ`, `matstage`, `matstageday`, `FacDest`, `FacExpDest` | `manufacturing_orders` + `manufacturing_order_lines` |
| `counters`, `reading` | `meters`, `meter_readings` |

## 6) الموارد البشرية

| القديم | الجديد |
| --- | --- |
| `machines` | `attendance_machines` |
| `attLog` | `attendance_punches` |
| `period`, `DetailLogON`, `DetailLogOff` | `shift_periods` + `attendance_punches` |
| `Vacation`, `CashAdvance`, `addtions`, `Sanction` | `payroll_lines` (Allowances/Deductions/Advances/Penalties) |
| `SalTable`, `DetailSalTable` | `payroll_runs`, `payroll_lines` |

## 7) الطباعة والتكامل

| القديم | الجديد |
| --- | --- |
| `Heder` | `print_template_sections` (`header_first`/`header_rest`/`footer_last`) |
| `Font`, `PrnCols` | `print_templates.FontJson` / `TableColumnsJson` |
| `Report` | `report_templates` |
| `frmDBBackup`, `frmDynamicBackupCopy` | `backup_log` |
| المرفقات/الصور | `attachments` (VARBINARY) |

## 8) قواعد الترحيل العملية

1. **الأرصدة الافتتاحية**: من `AccTree` (رصيد كل حساب) ⇒ `accounts.OpeningDebit/OpeningCredit`،
   ثم قيد افتتاحي واحد (`journal_entries.SourceType = 'opening'`).
2. **الحركات**: كل سطر من `Detail` ⇒ `invoice_lines`، وكل فاتورة ⇒ `invoices` مع
   `DocTypeCode` حسب جدولها الأصلي.
3. **المخزون**: الرصيد المخزَّن القديم لا يُنقل كرصيد، بل حركة افتتاحية
   (`stock_movements.SourceType = 'opening'`) لكل (مادة/مستودع).
4. **العملات**: أسعار الصرف القديمة ⇒ `currency_rates`، وأي حركة تُرحَّل مع
   `ExchangeRate` الخاص بتاريخها.
5. **الصلاحيات**: `UserPerAcc` ⇒ `permissions` + `role_permissions` بعد تجميع
   الصلاحيات المتشابهة في أدوار.
6. **التحقق بعد الترحيل**: قارن `v_trial_balance` مع ميزان المراجعة القديم لكل سنة،
   و`v_item_stock` مع أرصدة المستودعات القديمة قبل فتح النظام للإنتاج.
