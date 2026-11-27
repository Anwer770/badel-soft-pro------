/* =====================================================================
   99_drop_all.sql — حذف كامل لمخطط BadelErp (بيئة التطوير فقط!)
   تحذير: يمسح كل البيانات. لا تستخدمه على قاعدة إنتاج.
   ===================================================================== */
USE BadelErp;
GO

IF OBJECT_ID(N'dbo.trg_journal_entries_check_post', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_journal_entries_check_post;
IF OBJECT_ID(N'dbo.trg_journal_lines_locked', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_journal_lines_locked;
IF OBJECT_ID(N'dbo.trg_invoices_touch', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_invoices_touch;
IF OBJECT_ID(N'dbo.trg_stock_movements_no_negative', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_stock_movements_no_negative;
GO

IF OBJECT_ID(N'dbo.v_invoice_profit', N'V') IS NOT NULL DROP VIEW dbo.v_invoice_profit;
IF OBJECT_ID(N'dbo.v_item_shortages', N'V') IS NOT NULL DROP VIEW dbo.v_item_shortages;
IF OBJECT_ID(N'dbo.v_item_stock', N'V') IS NOT NULL DROP VIEW dbo.v_item_stock;
IF OBJECT_ID(N'dbo.v_party_balances', N'V') IS NOT NULL DROP VIEW dbo.v_party_balances;
IF OBJECT_ID(N'dbo.v_trial_balance', N'V') IS NOT NULL DROP VIEW dbo.v_trial_balance;
IF OBJECT_ID(N'dbo.v_account_balances', N'V') IS NOT NULL DROP VIEW dbo.v_account_balances;
GO

/* الأبناء قبل الآباء */
IF OBJECT_ID(N'dbo.meter_readings', N'U') IS NOT NULL DROP TABLE dbo.meter_readings;
IF OBJECT_ID(N'dbo.meters', N'U') IS NOT NULL DROP TABLE dbo.meters;
IF OBJECT_ID(N'dbo.manufacturing_order_lines', N'U') IS NOT NULL DROP TABLE dbo.manufacturing_order_lines;
IF OBJECT_ID(N'dbo.manufacturing_orders', N'U') IS NOT NULL DROP TABLE dbo.manufacturing_orders;
IF OBJECT_ID(N'dbo.medical_services', N'U') IS NOT NULL DROP TABLE dbo.medical_services;
IF OBJECT_ID(N'dbo.doctors', N'U') IS NOT NULL DROP TABLE dbo.doctors;
IF OBJECT_ID(N'dbo.hotel_reservations', N'U') IS NOT NULL DROP TABLE dbo.hotel_reservations;
IF OBJECT_ID(N'dbo.hotel_rooms', N'U') IS NOT NULL DROP TABLE dbo.hotel_rooms;
IF OBJECT_ID(N'dbo.restaurant_tables', N'U') IS NOT NULL DROP TABLE dbo.restaurant_tables;

IF OBJECT_ID(N'dbo.attachments', N'U') IS NOT NULL DROP TABLE dbo.attachments;
IF OBJECT_ID(N'dbo.backup_log', N'U') IS NOT NULL DROP TABLE dbo.backup_log;
IF OBJECT_ID(N'dbo.zatca_invoices', N'U') IS NOT NULL DROP TABLE dbo.zatca_invoices;
IF OBJECT_ID(N'dbo.report_templates', N'U') IS NOT NULL DROP TABLE dbo.report_templates;
IF OBJECT_ID(N'dbo.print_template_sections', N'U') IS NOT NULL DROP TABLE dbo.print_template_sections;
IF OBJECT_ID(N'dbo.print_templates', N'U') IS NOT NULL DROP TABLE dbo.print_templates;

IF OBJECT_ID(N'dbo.payroll_lines', N'U') IS NOT NULL DROP TABLE dbo.payroll_lines;
IF OBJECT_ID(N'dbo.payroll_runs', N'U') IS NOT NULL DROP TABLE dbo.payroll_runs;
IF OBJECT_ID(N'dbo.shift_periods', N'U') IS NOT NULL DROP TABLE dbo.shift_periods;
IF OBJECT_ID(N'dbo.attendance_punches', N'U') IS NOT NULL DROP TABLE dbo.attendance_punches;
IF OBJECT_ID(N'dbo.attendance_machines', N'U') IS NOT NULL DROP TABLE dbo.attendance_machines;
IF OBJECT_ID(N'dbo.employees', N'U') IS NOT NULL DROP TABLE dbo.employees;
IF OBJECT_ID(N'dbo.departments', N'U') IS NOT NULL DROP TABLE dbo.departments;

IF OBJECT_ID(N'dbo.invoice_payments', N'U') IS NOT NULL DROP TABLE dbo.invoice_payments;
IF OBJECT_ID(N'dbo.invoice_expenses', N'U') IS NOT NULL DROP TABLE dbo.invoice_expenses;
IF OBJECT_ID(N'dbo.invoice_lines', N'U') IS NOT NULL DROP TABLE dbo.invoice_lines;
IF OBJECT_ID(N'dbo.invoices', N'U') IS NOT NULL DROP TABLE dbo.invoices;

IF OBJECT_ID(N'dbo.inventory_sheet_lines', N'U') IS NOT NULL DROP TABLE dbo.inventory_sheet_lines;
IF OBJECT_ID(N'dbo.inventory_sheets', N'U') IS NOT NULL DROP TABLE dbo.inventory_sheets;
IF OBJECT_ID(N'dbo.stock_movements', N'U') IS NOT NULL DROP TABLE dbo.stock_movements;
IF OBJECT_ID(N'dbo.warehouses', N'U') IS NOT NULL DROP TABLE dbo.warehouses;
IF OBJECT_ID(N'dbo.item_prices', N'U') IS NOT NULL DROP TABLE dbo.item_prices;
IF OBJECT_ID(N'dbo.item_barcodes', N'U') IS NOT NULL DROP TABLE dbo.item_barcodes;
IF OBJECT_ID(N'dbo.item_units', N'U') IS NOT NULL DROP TABLE dbo.item_units;
IF OBJECT_ID(N'dbo.items', N'U') IS NOT NULL DROP TABLE dbo.items;
IF OBJECT_ID(N'dbo.item_groups', N'U') IS NOT NULL DROP TABLE dbo.item_groups;
IF OBJECT_ID(N'dbo.units', N'U') IS NOT NULL DROP TABLE dbo.units;

IF OBJECT_ID(N'dbo.cheques', N'U') IS NOT NULL DROP TABLE dbo.cheques;
IF OBJECT_ID(N'dbo.receipt_vouchers', N'U') IS NOT NULL DROP TABLE dbo.receipt_vouchers;
IF OBJECT_ID(N'dbo.journal_lines', N'U') IS NOT NULL DROP TABLE dbo.journal_lines;
IF OBJECT_ID(N'dbo.journal_entries', N'U') IS NOT NULL DROP TABLE dbo.journal_entries;
IF OBJECT_ID(N'dbo.parties', N'U') IS NOT NULL DROP TABLE dbo.parties;
IF OBJECT_ID(N'dbo.taxes', N'U') IS NOT NULL DROP TABLE dbo.taxes;
IF OBJECT_ID(N'dbo.cost_centers', N'U') IS NOT NULL DROP TABLE dbo.cost_centers;
IF OBJECT_ID(N'dbo.accounts', N'U') IS NOT NULL DROP TABLE dbo.accounts;
IF OBJECT_ID(N'dbo.currency_rates', N'U') IS NOT NULL DROP TABLE dbo.currency_rates;
IF OBJECT_ID(N'dbo.currencies', N'U') IS NOT NULL DROP TABLE dbo.currencies;

IF OBJECT_ID(N'dbo.number_sequences', N'U') IS NOT NULL DROP TABLE dbo.number_sequences;
IF OBJECT_ID(N'dbo.document_type_configs', N'U') IS NOT NULL DROP TABLE dbo.document_type_configs;
IF OBJECT_ID(N'dbo.app_settings', N'U') IS NOT NULL DROP TABLE dbo.app_settings;
IF OBJECT_ID(N'dbo.audit_log', N'U') IS NOT NULL DROP TABLE dbo.audit_log;
IF OBJECT_ID(N'dbo.user_roles', N'U') IS NOT NULL DROP TABLE dbo.user_roles;
IF OBJECT_ID(N'dbo.role_permissions', N'U') IS NOT NULL DROP TABLE dbo.role_permissions;
IF OBJECT_ID(N'dbo.permissions', N'U') IS NOT NULL DROP TABLE dbo.permissions;
IF OBJECT_ID(N'dbo.roles', N'U') IS NOT NULL DROP TABLE dbo.roles;
IF OBJECT_ID(N'dbo.app_users', N'U') IS NOT NULL DROP TABLE dbo.app_users;
IF OBJECT_ID(N'dbo.fiscal_periods', N'U') IS NOT NULL DROP TABLE dbo.fiscal_periods;
IF OBJECT_ID(N'dbo.fiscal_years', N'U') IS NOT NULL DROP TABLE dbo.fiscal_years;
IF OBJECT_ID(N'dbo.branches', N'U') IS NOT NULL DROP TABLE dbo.branches;
IF OBJECT_ID(N'dbo.companies', N'U') IS NOT NULL DROP TABLE dbo.companies;
IF OBJECT_ID(N'dbo.schema_migrations', N'U') IS NOT NULL DROP TABLE dbo.schema_migrations;
GO
