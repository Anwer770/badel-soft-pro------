#!/usr/bin/env node
/**
 * gen-ef-model.mjs
 * ------------------------------------------------------------------
 * يقرأ مخطط T-SQL في مجلد db/ ويولّد:
 *   1) كيانات EF Core 8  → backend/BadelErp.Data/Entities/*.cs
 *   2) سياق قاعدة البيانات → backend/BadelErp.Data/ErpDbContext.cs
 *   3) عقود TypeScript    → src/types/database.ts
 *
 * المصدر الوحيد للحقيقة هو ملفات SQL (Database-First)، لذا لا تُعدَّل
 * الملفات المولّدة يدويًا — عدّل SQL ثم أعد التشغيل:
 *      node tools/gen-ef-model.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SQL_DIR = path.join(ROOT, 'db');
const EF_DIR = path.join(ROOT, 'backend', 'BadelErp.Data');
const ENTITIES_DIR = path.join(EF_DIR, 'Entities');
const TS_OUT = path.join(ROOT, 'src', 'types', 'database.ts');

const sqlFiles = [
  '10_core.sql',
  '20_finance.sql',
  '30_inventory.sql',
  '40_invoices.sql',
  '50_hr.sql',
  '60_print_integration.sql',
  '65_verticals.sql',
];

/* ----------------------------- أدوات مساعدة ----------------------------- */
const toPascal = (s) =>
  s
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
const singular = (t) => {
  const map = {
    companies: 'Company',
    branches: 'Branch',
    fiscal_years: 'FiscalYear',
    fiscal_periods: 'FiscalPeriod',
    app_users: 'AppUser',
    roles: 'Role',
    permissions: 'Permission',
    role_permissions: 'RolePermission',
    user_roles: 'UserRole',
    audit_log: 'AuditLog',
    app_settings: 'AppSetting',
    document_type_configs: 'DocumentTypeConfig',
    number_sequences: 'NumberSequence',
    currencies: 'Currency',
    currency_rates: 'CurrencyRate',
    accounts: 'Account',
    cost_centers: 'CostCenter',
    taxes: 'Tax',
    parties: 'Party',
    journal_entries: 'JournalEntry',
    journal_lines: 'JournalLine',
    receipt_vouchers: 'ReceiptVoucher',
    cheques: 'Cheque',
    units: 'Unit',
    item_groups: 'ItemGroup',
    items: 'Item',
    item_units: 'ItemUnit',
    item_barcodes: 'ItemBarcode',
    item_prices: 'ItemPrice',
    warehouses: 'Warehouse',
    stock_movements: 'StockMovement',
    inventory_sheets: 'InventorySheet',
    inventory_sheet_lines: 'InventorySheetLine',
    invoices: 'Invoice',
    invoice_lines: 'InvoiceLine',
    invoice_expenses: 'InvoiceExpense',
    invoice_payments: 'InvoicePayment',
    departments: 'Department',
    employees: 'Employee',
    attendance_machines: 'AttendanceMachine',
    attendance_punches: 'AttendancePunch',
    shift_periods: 'ShiftPeriod',
    payroll_runs: 'PayrollRun',
    payroll_lines: 'PayrollLine',
    print_templates: 'PrintTemplate',
    print_template_sections: 'PrintTemplateSection',
    report_templates: 'ReportTemplate',
    zatca_invoices: 'ZatcaInvoice',
    attachments: 'Attachment',
    backup_log: 'BackupLog',
    restaurant_tables: 'RestaurantTable',
    hotel_rooms: 'HotelRoom',
    hotel_reservations: 'HotelReservation',
    doctors: 'Doctor',
    medical_services: 'MedicalService',
    manufacturing_orders: 'ManufacturingOrder',
    manufacturing_order_lines: 'ManufacturingOrderLine',
    meters: 'Meter',
    meter_readings: 'MeterReading',
    schema_migrations: 'SchemaMigration',
  };
  return map[t] || toPascal(t.replace(/s$/, ''));
};

const csType = (sqlType) => {
  const t = sqlType.toUpperCase();
  if (t.startsWith('BIGINT')) return 'long';
  if (t.startsWith('SMALLINT')) return 'short';
  if (t.startsWith('TINYINT')) return 'byte';
  if (t.startsWith('INT')) return 'int';
  if (t.startsWith('BIT')) return 'bool';
  if (t.startsWith('DECIMAL') || t.startsWith('NUMERIC') || t.startsWith('MONEY')) return 'decimal';
  if (t.startsWith('DATETIME2') || t.startsWith('DATETIME') || t.startsWith('SMALLDATETIME')) return 'DateTime';
  if (t.startsWith('DATE')) return 'DateOnly';
  if (t.startsWith('TIME')) return 'TimeOnly';
  if (t.startsWith('UNIQUEIDENTIFIER')) return 'Guid';
  if (t.startsWith('VARBINARY') || t.startsWith('BINARY') || t.startsWith('IMAGE')) return 'byte[]';
  return 'string';
};

const tsType = (sqlType, nullable, computed) => {
  const t = sqlType.toUpperCase();
  let base;
  if (t.startsWith('BIGINT') || t.startsWith('INT') || t.startsWith('SMALLINT') || t.startsWith('TINYINT')) base = 'number';
  else if (t.startsWith('DECIMAL') || t.startsWith('NUMERIC') || t.startsWith('MONEY')) base = 'number';
  else if (t.startsWith('BIT')) base = 'boolean';
  else if (t.startsWith('UNIQUEIDENTIFIER')) base = 'string';
  else if (t.startsWith('VARBINARY')) base = 'string'; // base64
  else if (t.startsWith('DATETIME') || t.startsWith('DATE') || t.startsWith('TIME')) base = 'string'; // ISO
  else base = 'string';
  if (computed) return base;
  return nullable ? `${base} | null` : base;
};

/* ------------------------------ قراءة DDL ------------------------------- */
const tables = [];

for (const fileName of sqlFiles) {
  const full = path.join(SQL_DIR, fileName);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/CREATE TABLE dbo\.(\w+)/);
    if (!m) continue;

    const tableName = m[1];
    const columns = [];
    const fks = [];
    let pkColumns = [];
    let j = i + 1;
    // تخطّي سطر القوس
    if (lines[j] && lines[j].trim() === '(') j++;

    for (; j < lines.length; j++) {
      const raw = lines[j].trim();
      if (raw.startsWith(');')) break;
      if (!raw || raw.startsWith('--') || raw.startsWith('/*')) continue;

      const compositePk = raw.match(/CONSTRAINT\s+(\w+)\s+PRIMARY KEY\s*\(([^)]+)\)/i);
      if (compositePk) {
        pkColumns = compositePk[2].split(',').map((c) => c.trim());
        continue;
      }

      const fk = raw.match(/CONSTRAINT\s+(\w+)\s+FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+dbo\.(\w+)\s*\(([^)]+)\)/i);
      if (fk) {
        fks.push({
          name: fk[1],
          columns: fk[2].split(',').map((c) => c.trim()),
          refTable: fk[3],
          refColumns: fk[4].split(',').map((c) => c.trim()),
        });
        continue;
      }

      if (/^CONSTRAINT\s+/i.test(raw)) continue; // CHECK / UNIQUE

      // عمود محسوب: Name AS (expr) PERSISTED
      const computed = raw.match(/^(\w+)\s+AS\s*\((.+?)\)\s*(PERSISTED)?,?$/i);
      if (computed) {
        columns.push({
          name: computed[1],
          sqlType: 'DECIMAL(18,4)',
          nullable: true,
          identity: false,
          isPk: false,
          computedExpr: computed[2],
        });
        continue;
      }

      const col = raw.match(/^(\w+)\s+([A-Za-z]+(?:\([^)]*\))?)\s*(.*)$/);
      if (!col) continue;

      const rest = col[3] || '';
      const isPk = /PRIMARY KEY/i.test(rest);
      const identity = /IDENTITY/i.test(rest);
      const nullable = /\bNULL\b/i.test(rest) && !/\bNOT\s+NULL\b/i.test(rest);

      columns.push({
        name: col[1],
        sqlType: col[2],
        nullable,
        identity,
        isPk,
      });

      if (isPk) pkColumns.push(col[1]);
    }

    tables.push({ name: tableName, entity: singular(tableName), columns, fks, pkColumns, file: fileName });
    i = j;
  }
}

/* ------------------------- توليد كيانات EF Core ------------------------- */
fs.mkdirSync(ENTITIES_DIR, { recursive: true });

const usingLines = new Set();
for (const t of tables) {
  const props = t.columns.map((c) => {
    const type = csType(c.sqlType);
    const isNullable = c.nullable;
    const decl = isNullable ? `${type}?` : type;
    const init = !isNullable && type === 'string' ? ' = null!;' : '';
    return `    public ${decl} ${c.name} { get; set; }${init}`;
  });

  const code = `// <auto-generated>
//   مصدر التوليد: db/*.sql — لا تُعدّل هذا الملف يدويًا.
//   أعد التوليد بالأمر: node tools/gen-ef-model.mjs
// </auto-generated>
namespace BadelErp.Data.Entities;

/// <summary>الجدول: dbo.${t.name}</summary>
public class ${t.entity}
{
${props.join('\n')}
}
`;
  fs.writeFileSync(path.join(ENTITIES_DIR, `${t.entity}.cs`), code);
  usingLines.add(t.entity);
}

/* --------------------------- توليد DbContext ---------------------------- */
const entityList = tables.map((t) => t.entity);

const configBlocks = tables
  .map((t) => {
    const lines = [];
    lines.push(`        modelBuilder.Entity<${t.entity}>(e =>`);
    lines.push('        {');
    lines.push(`            e.ToTable("${t.name}", "dbo");`);
    if (t.pkColumns.length > 0) {
      lines.push(
        `            e.HasKey(x => new { ${t.pkColumns.map((c) => `x.${c}`).join(', ')} });`
      );
    }
    for (const c of t.columns) {
      if (c.identity) {
        lines.push(`            e.Property(x => x.${c.name}).ValueGeneratedOnAdd();`);
      }
      if (c.computedExpr) {
        const expr = c.computedExpr.replace(/"/g, '\\"');
        lines.push(`            e.Property(x => x.${c.name}).HasComputedColumnSql("${expr}", stored: true);`);
      }
      const typeName = c.sqlType.toUpperCase();
      if (typeName.startsWith('DECIMAL') || typeName.startsWith('NVARCHAR(MAX)') || typeName.startsWith('VARBINARY(MAX)')) {
        lines.push(`            e.Property(x => x.${c.name}).HasColumnType("${typeName.toLowerCase()}");`);
      }
    }
    for (const fk of t.fks) {
      const refEntity = singular(fk.refTable);
      const withMany = fk.columns.join('_') === 'ParentId' ? '.WithMany()' : '.WithMany()';
      lines.push(
        `            e.HasOne<${refParent(refEntity)}>()${withMany}.HasForeignKey(x => ${fk.columns.length === 1 ? `x.${fk.columns[0]}` : `new { ${fk.columns.map((c) => `x.${c}`).join(', ')} }`}).OnDelete(DeleteBehavior.Restrict);`
      );
    }
    lines.push('        });');
    return lines.join('\n');
  })
  .join('\n\n');

function refParent(entity) {
  return entity;
}

const uniqueEntities = [...new Set(entityList)];

const dbContext = `// <auto-generated>
//   مصدر التوليد: db/*.sql — لا تُعدّل هذا الملف يدويًا.
//   إعادة التوليد: node tools/gen-ef-model.mjs
// </auto-generated>
using BadelErp.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BadelErp.Data;

/// <summary>
/// سياق قاعدة البيانات الموحّدة. المخطط مملوك لملفات SQL في مجلد db/
/// (Database-First)، ولا تُستخدم Migrations لإنشائه.
/// </summary>
public class ErpDbContext : DbContext
{
    public ErpDbContext(DbContextOptions<ErpDbContext> options) : base(options)
    {
    }

${tables.map((t) => `    public DbSet<${t.entity}> ${toPascal(t.name)} => Set<${t.entity}>();`).join('\n')}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

${configBlocks}
    }
}
`;

fs.writeFileSync(path.join(EF_DIR, 'ErpDbContext.cs'), dbContext);

/* ------------------------- توليد عقود TypeScript ------------------------ */
const tsLines = [
  '// <auto-generated>',
  '//   مصدر التوليد: db/*.sql — لا تُعدّل هذا الملف يدويًا.',
  '//   إعادة التوليد: node tools/gen-ef-model.mjs',
  '//   عقود صفوف قاعدة البيانات (تُستهلك من طبقة الـ API).',
  '// </auto-generated>',
  '',
  'export namespace Db {',
];

for (const t of tables) {
  tsLines.push(`  /** dbo.${t.name} */`);
  tsLines.push(`  export interface ${t.entity} {`);
  for (const c of t.columns) {
    tsLines.push(`    ${c.name}: ${tsType(c.sqlType, c.nullable, Boolean(c.computedExpr))};`);
  }
  tsLines.push('  }');
  tsLines.push('');
}
tsLines.push('}');
tsLines.push('');

fs.mkdirSync(path.dirname(TS_OUT), { recursive: true });
fs.writeFileSync(TS_OUT, tsLines.join('\n'));

console.log(`✓ ${tables.length} جدولاً`);
console.log(`✓ ${tables.length} كيان EF Core في ${path.relative(ROOT, ENTITIES_DIR)}`);
console.log('✓ ErpDbContext.cs');
console.log(`✓ ${path.relative(ROOT, TS_OUT)}`);
