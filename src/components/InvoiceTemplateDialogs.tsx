import React, { useEffect, useState } from 'react';
import {
  createBlankInvoiceTemplate,
  createDefaultInvoiceTemplate,
  DEFAULT_INVOICE_PRINT_PROPS,
  DEFAULT_INVOICE_SCALE_PROPS,
  DEFAULT_INVOICE_TABLE_COLUMNS,
  DEFAULT_INVOICE_WINDOW_PROPS,
  DEFAULT_SEARCH_ACCOUNTS,
} from '../data/erpDefaults';
import type {
  CostCenterRecord,
  CurrencyItem,
  CustomAccountRecord,
  EmployeeRecord,
  ErpUser,
  InvoicePrintPropsConfig,
  InvoiceScalePropsConfig,
  InvoiceTableColumnConfig,
  InvoiceTableFontConfig,
  InvoiceTemplateConfig,
  InvoiceWindowPropsConfig,
  MaterialGroupRecord,
  MsgConfig,
  ReportTemplateItem,
  WarehouseRecord,
} from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

const BASIC_WIN_COLORS = [
  '#ff8080', '#ffff80', '#80ff80', '#00ff80', '#80ffff', '#0080ff', '#ff80c0', '#ff80ff',
  '#ff0000', '#ffff00', '#80ff00', '#00ff40', '#00ffff', '#0080c0', '#8080c0', '#ff00ff',
  '#804040', '#ff8040', '#00ff00', '#008080', '#004080', '#8080ff', '#800040', '#ff0080',
  '#800000', '#ff8000', '#008000', '#008040', '#0000ff', '#0000a0', '#800080', '#8000ff',
  '#400000', '#804000', '#004000', '#004040', '#000080', '#000040', '#400040', '#400080',
  '#000000', '#808000', '#808040', '#808080', '#408080', '#c0c0c0', '#400040', '#ffffff',
];

const FONT_FAMILIES = [
  'Tahoma',
  'Times New Roman',
  'Traditional Arabic',
  'Trebuchet MS',
  'Urdu Typesetting',
  'Arial',
  'Cairo',
  'Segoe UI',
  'Courier New',
  'Verdana',
];

const FONT_STYLES: InvoiceTableFontConfig['fontStyle'][] = [
  'Regular',
  'Bold',
  'Oblique',
  'Bold Oblique',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24];

const FONT_COLOR_OPTIONS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'Blue', hex: '#0000ff' },
  { name: 'Red', hex: '#ff0000' },
  { name: 'Green', hex: '#008000' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Gray', hex: '#808080' },
];

const PRINTER_LIST = [
  'بلا',
  'OneNote for Windows 10',
  'OneNote (Desktop)',
  'Microsoft XPS Document Writer',
  'Microsoft Print to PDF',
  'L3160 Series(Network)',
  'Foxit Reader PDF Printer',
  'Fax',
  'EPSON L3160 Series',
];

const PRICE_TIERS = [
  'سعر جديد',
  'سعر البيع',
  'سعر الجملة',
  'نصف الجملة',
  'سعر المفرق',
  'سعر المستهلك',
  'أخر سعر بيع',
  'السعر الوسطي (الكلفة)',
  'أقل سعر بيع',
  'أعلى سعر بيع',
  'سعر اخر توريد بحسب المستودع',
];

type TabId =
  | 'price'
  | 'searchConds'
  | 'salesTax'
  | 'users'
  | 'medical'
  | 'scale'
  | 'window'
  | 'general'
  | 'showFields'
  | 'salesExpenses'
  | 'discountsCommissions'
  | 'additional'
  | 'printProps'
  | 'tableProps';

const TOP_TABS: { id: TabId; label: string }[] = [
  { id: 'price', label: 'السعر' },
  { id: 'searchConds', label: 'شروط بحث المواد' },
  { id: 'salesTax', label: 'ضريبة المبيعات' },
  { id: 'users', label: 'المستخدمين' },
  { id: 'medical', label: 'خيارات النظام الطبي' },
  { id: 'scale', label: 'خصائص الميزان' },
  { id: 'window', label: 'خصائص النافذة' },
];

const BOTTOM_TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'خصائص عامة' },
  { id: 'showFields', label: 'إظهار الحقول' },
  { id: 'salesExpenses', label: 'مبيعات والمصاريف' },
  { id: 'discountsCommissions', label: 'الخصميات والعمولات' },
  { id: 'additional', label: 'خصائص إضافية' },
  { id: 'printProps', label: 'خصائص الطباعة' },
  { id: 'tableProps', label: 'خصائص الجدول' },
];

interface LookupRow {
  code: string;
  name: string;
  extraCol?: string;
  pickValue?: string;
}

interface PickerModalState {
  title: string;
  items: LookupRow[];
  secondHeader?: string;
  thirdHeader?: string;
  showSearchOptions?: boolean;
  showSearchInput?: boolean;
  onPick: (val: string) => void;
}

interface InvoiceTemplateEditorProps {
  open: boolean;
  title: string;
  initialTemplate: InvoiceTemplateConfig;
  isNew: boolean;
  zIndex: number;
  customAccounts: CustomAccountRecord[];
  costCenters: CostCenterRecord[];
  warehouses: WarehouseRecord[];
  currencies: CurrencyItem[];
  reportTemplates?: ReportTemplateItem[];
  users?: ErpUser[];
  materialGroups?: MaterialGroupRecord[];
  employees?: EmployeeRecord[];
  onFocus: () => void;
  onClose: () => void;
  onSave: (tpl: InvoiceTemplateConfig, saveAsNew: boolean) => void;
  onNotify: (msg: string) => void;
}

export const InvoiceTemplateEditorDialog: React.FC<InvoiceTemplateEditorProps> = ({
  open,
  title,
  initialTemplate,
  isNew,
  zIndex,
  customAccounts,
  costCenters,
  warehouses,
  currencies,
  reportTemplates = [],
  users = [],
  materialGroups = [],
  employees = [],
  onFocus,
  onClose,
  onSave,
  onNotify,
}) => {
  const [tpl, setTpl] = useState<InvoiceTemplateConfig>(initialTemplate);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [lookup, setLookup] = useState<PickerModalState | null>(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupMatchMode, setLookupMatchMode] = useState<'startsWith' | 'contains' | 'endsWith'>(
    'contains'
  );
  const [lookupSelectedIdx, setLookupSelectedIdx] = useState<number>(0);
  const [selectedColId, setSelectedColId] = useState<string>('del');

  // WinForms Color & Font Dialog state
  const [colorDialogTarget, setColorDialogTarget] = useState<
    null | 'savePanelColor' | 'windowBgColor'
  >(null);
  const [tempColor, setTempColor] = useState('#ff8080');
  const [customPaletteColors, setCustomPaletteColors] = useState<string[]>(
    Array.from({ length: 16 }, () => '#ffffff')
  );
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [fontDialogOpen, setFontDialogOpen] = useState(false);
  const [tempFont, setTempFont] = useState<InvoiceTableFontConfig>(
    DEFAULT_INVOICE_WINDOW_PROPS.tableFont
  );

  useEffect(() => {
    if (open) {
      const defaults = createDefaultInvoiceTemplate();
      const cloned = JSON.parse(JSON.stringify(initialTemplate)) as InvoiceTemplateConfig;
      cloned.extraTabs = { ...defaults.extraTabs, ...(cloned.extraTabs || {}) };
      if (!cloned.printProps) cloned.printProps = { ...DEFAULT_INVOICE_PRINT_PROPS };
      cloned.scaleProps = {
        ...DEFAULT_INVOICE_SCALE_PROPS,
        ...(cloned.scaleProps || {}),
      };
      cloned.windowProps = {
        ...DEFAULT_INVOICE_WINDOW_PROPS,
        ...(cloned.windowProps || {}),
        tableFont: {
          ...DEFAULT_INVOICE_WINDOW_PROPS.tableFont,
          ...(cloned.windowProps?.tableFont || {}),
        },
      };
      const existingCols = cloned.tableColumns || [];
      const existingIds = new Set(existingCols.map((c) => c.id));
      cloned.tableColumns = existingCols.length
        ? [
            ...existingCols,
            ...DEFAULT_INVOICE_TABLE_COLUMNS.filter((c) => !existingIds.has(c.id)).map((c) => ({
              ...c,
            })),
          ]
        : DEFAULT_INVOICE_TABLE_COLUMNS.map((c) => ({ ...c }));
      setTpl(cloned);
      setSaveAsNew(false);
      setActiveTab('general');
      setLookup(null);
      setColorDialogTarget(null);
      setFontDialogOpen(false);
      setSelectedColId(cloned.tableColumns[0]?.id || 'del');
    }
  }, [open, initialTemplate, isNew]);

  const allAccountRows: LookupRow[] = (() => {
    const rows: LookupRow[] = [...DEFAULT_SEARCH_ACCOUNTS];
    const seen = new Set(rows.map((r) => `${r.code}:${r.name}`));
    customAccounts
      .filter((a) => a.kind === 'leaf')
      .forEach((a) => {
        const key = `${a.code}:${a.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          rows.push({ code: a.code, name: a.name });
        }
      });
    return rows;
  })();

  const openAccountLookup = (
    _titleText: string,
    onPick: (val: string) => void,
    initialFilter?: string
  ) => {
    const trimmed = initialFilter?.trim() || '';
    setLookupQuery(trimmed);
    setLookupMatchMode('contains');
    setLookupSelectedIdx(0);
    setLookup({
      title: 'لائحة نتيجة البحث',
      items: allAccountRows,
      secondHeader: 'اسم الحساب',
      showSearchOptions: !trimmed,
      showSearchInput: true,
      onPick,
    });
  };

  const openSalesAccountLookup = (onPick: (val: string) => void) => {
    const salesRows = allAccountRows.filter(
      (a) => a.code.startsWith('41') || a.name.includes('مبيعات') || a.name.includes('ايرادات')
    );
    setLookupQuery('');
    setLookupMatchMode('contains');
    setLookupSelectedIdx(0);
    setLookup({
      title: 'لائحة نتيجة البحث',
      items: salesRows.length ? salesRows : allAccountRows,
      secondHeader: 'اسم الحساب',
      showSearchOptions: false,
      showSearchInput: true,
      onPick,
    });
  };

  const openCashBankLookup = (onPick: (val: string) => void) => {
    const cashRows = allAccountRows.filter(
      (a) =>
        a.code.startsWith('123') ||
        a.code.startsWith('124') ||
        a.name.includes('صندوق') ||
        a.name.includes('صناديق') ||
        a.name.includes('بنك') ||
        a.name.includes('بنوك')
    );
    setLookupQuery('');
    setLookupMatchMode('contains');
    setLookupSelectedIdx(0);
    setLookup({
      title: 'لائحة نتيجة البحث',
      items: cashRows.length ? cashRows : allAccountRows,
      secondHeader: 'اسم الحساب',
      showSearchOptions: false,
      showSearchInput: true,
      onPick,
    });
  };

  const openSalesRepLookup = (onPick: (val: string) => void, initialFilter?: string) => {
    const trimmed = initialFilter?.trim() || '';
    setLookupQuery(trimmed);
    setLookupMatchMode('contains');
    setLookupSelectedIdx(0);
    setLookup({
      title: 'لائحة نتيجة البحث',
      items: employees.map((e) => ({ code: e.code, name: e.name })),
      secondHeader: 'اسم الحساب',
      showSearchOptions: !trimmed,
      showSearchInput: true,
      onPick,
    });
  };

  const openWarehouseLookup = (onPick: (val: string) => void) => {
    setLookupQuery('');
    setLookupMatchMode('contains');
    setLookupSelectedIdx(0);
    setLookup({
      title: 'قائمة المستودعات',
      items: warehouses.map((w) => ({
        code: w.code,
        name: w.name,
        extraCol: w.location || '',
        pickValue: w.code || w.name,
      })),
      secondHeader: 'اسم المستودع',
      thirdHeader: 'العنوان',
      showSearchOptions: false,
      showSearchInput: false,
      onPick,
    });
  };

  const openCostCenterLookup = (onPick: (val: string) => void) => {
    setLookupQuery('');
    setLookupMatchMode('contains');
    setLookupSelectedIdx(0);
    setLookup({
      title: 'لائحة البحث',
      items: costCenters.map((c) => ({ code: c.code, name: c.name })),
      secondHeader: 'الاسم',
      showSearchOptions: false,
      showSearchInput: false,
      onPick,
    });
  };

  const setGeneral = <K extends keyof InvoiceTemplateConfig['general']>(
    key: K,
    val: InvoiceTemplateConfig['general'][K]
  ) => {
    setTpl((prev) => ({ ...prev, general: { ...prev.general, [key]: val } }));
  };

  const setCol = <K extends keyof InvoiceTemplateConfig['columns']>(
    key: K,
    val: InvoiceTemplateConfig['columns'][K]
  ) => {
    setTpl((prev) => ({ ...prev, columns: { ...prev.columns, [key]: val } }));
  };

  const setSalesExp = <K extends keyof InvoiceTemplateConfig['salesAndExpenses']>(
    key: K,
    val: InvoiceTemplateConfig['salesAndExpenses'][K]
  ) => {
    setTpl((prev) => ({ ...prev, salesAndExpenses: { ...prev.salesAndExpenses, [key]: val } }));
  };

  const setDiscComm = <K extends keyof InvoiceTemplateConfig['discountsAndCommissions']>(
    key: K,
    val: InvoiceTemplateConfig['discountsAndCommissions'][K]
  ) => {
    setTpl((prev) => ({
      ...prev,
      discountsAndCommissions: { ...prev.discountsAndCommissions, [key]: val },
    }));
  };

  const setAdd = <K extends keyof InvoiceTemplateConfig['additional']>(
    key: K,
    val: InvoiceTemplateConfig['additional'][K]
  ) => {
    setTpl((prev) => ({ ...prev, additional: { ...prev.additional, [key]: val } }));
  };

  const setExtra = <K extends keyof InvoiceTemplateConfig['extraTabs']>(
    key: K,
    val: InvoiceTemplateConfig['extraTabs'][K]
  ) => {
    setTpl((prev) => ({ ...prev, extraTabs: { ...prev.extraTabs, [key]: val } }));
  };

  const setPrintProp = <K extends keyof InvoicePrintPropsConfig>(
    key: K,
    val: InvoicePrintPropsConfig[K]
  ) => {
    setTpl((prev) => ({
      ...prev,
      printProps: { ...(prev.printProps || DEFAULT_INVOICE_PRINT_PROPS), [key]: val },
    }));
  };

  const setScaleProp = <K extends keyof InvoiceScalePropsConfig>(
    key: K,
    val: InvoiceScalePropsConfig[K]
  ) => {
    setTpl((prev) => ({
      ...prev,
      scaleProps: { ...(prev.scaleProps || DEFAULT_INVOICE_SCALE_PROPS), [key]: val },
    }));
  };

  const setWindowProp = <K extends keyof InvoiceWindowPropsConfig>(
    key: K,
    val: InvoiceWindowPropsConfig[K]
  ) => {
    setTpl((prev) => ({
      ...prev,
      windowProps: { ...(prev.windowProps || DEFAULT_INVOICE_WINDOW_PROPS), [key]: val },
    }));
  };

  const updateTableCol = (
    colId: string,
    field: keyof InvoiceTableColumnConfig,
    val: string
  ) => {
    setTpl((prev) => ({
      ...prev,
      tableColumns: (prev.tableColumns || DEFAULT_INVOICE_TABLE_COLUMNS).map((c) =>
        c.id === colId ? { ...c, [field]: val } : c
      ),
    }));
  };

  const handleConfirm = () => {
    if (!tpl.name.trim()) {
      onNotify('يرجى إدخال إسم النموذج');
      return;
    }
    const shouldCreateNew = isNew || saveAsNew;
    onSave(
      {
        ...tpl,
        id: shouldCreateNew ? `inv-tpl-${Date.now()}` : tpl.id,
        name: tpl.name.trim(),
      },
      shouldCreateNew
    );
    onClose();
  };

  const fieldChecksCol1: { key: keyof InvoiceTemplateConfig['columns']; label: string }[] = [
    { key: 'showUnit', label: 'إظهار حقل الوحدة' },
    { key: 'showBalance', label: 'إظهار حقل الرصيد' },
    { key: 'showQty2', label: 'إظهار حقل كمية ثانية' },
    { key: 'showBarcode', label: 'إظهار حقل الباركود' },
    { key: 'showQtyMainUnit', label: 'إظهار حقل الكمية بالوحد الرئيسية' },
    { key: 'showQtyFirstUnit', label: 'إظهار حقل الكمية بالوحد الأولى' },
    { key: 'showQtySecondUnit', label: 'إظهار حقل الكمية بالوحد الثانية' },
    { key: 'showFactor', label: 'إظهار حقل عامل التحويل' },
    { key: 'showLocation', label: 'إظهار موقع المادة' },
    { key: 'showShortages', label: 'إظهار النواقص' },
  ];

  const fieldChecksCol2: { key: keyof InvoiceTemplateConfig['columns']; label: string }[] = [
    { key: 'useMainUnitsOnly', label: 'إستخدام الوحد الرئيسية فقط' },
    { key: 'showTotalRight', label: 'إظهار الإجمالي إلى اليمين' },
    { key: 'showBonus', label: 'إظهار حقل البونص' },
    { key: 'showRowNotes', label: 'إظهار حقل البيان' },
    { key: 'showExpiry', label: 'إظهار تاريخ الصلاحية' },
    { key: 'showItemSupplier', label: 'إظهار مورد الصنف' },
    { key: 'showItemType', label: 'نوع المادة' },
    { key: 'showNetAmount', label: 'إظهار المبلغ الصافي' },
    { key: 'showRemainingBalance', label: 'إظهار الرصيد المتبقي' },
  ];

  const fieldChecksCol3: { key: keyof InvoiceTemplateConfig['columns']; label: string }[] = [
    { key: 'showLength', label: 'إظهار الطول' },
    { key: 'showWidth', label: 'إظهار العرض' },
    { key: 'showHeight', label: 'إظهار الإرتفاع' },
    { key: 'showGross', label: 'إظهار القائم' },
    { key: 'showTestGrade', label: 'درجة الأختبار' },
    { key: 'showLabName', label: 'إسم المختبر' },
    { key: 'showSerial1', label: 'إظهار الرقم التسلسلي' },
    { key: 'showSerial2', label: 'إظهار الرقم التسلسلي ٢' },
    { key: 'showPoNumber', label: 'إظهار رقم طلب الشراء' },
    { key: 'showPoBookNumber', label: 'إظهار رقم الدفتر لطلب الشراء' },
  ];

  const fieldChecksCol4: { key: keyof InvoiceTemplateConfig['columns']; label: string }[] = [
    { key: 'showPriceAfterTax', label: 'إظهار السعر بعد الضريبة' },
    { key: 'showTotalAfterTax', label: 'إظهار الإجمالي بعد الضريبة' },
    { key: 'showLocalTotal', label: 'إظهار الإجمالي المحلي' },
    { key: 'showQtyWords', label: 'إظهار حقل الكمية كتابة' },
    { key: 'showCount', label: 'إظهار حقل للعدد' },
    { key: 'hideTotal', label: 'إخفاء حقل الإجمالي' },
    { key: 'hideQty', label: 'إخفاء حقل الكمية' },
  ];

  return (
    <DraggableWindow
      open={open}
      title={title}
      width={930}
      height={540}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#e9edf5] p-3 gap-2 overflow-hidden select-none text-[12px]">
        {/* Top Template Name Row */}
        <div className="flex items-center justify-start gap-4 px-1">
          <label className="font-bold text-[13px] shrink-0">إسم النموذج</label>
          <input
            value={tpl.name}
            onChange={(e) => setTpl((prev) => ({ ...prev, name: e.target.value }))}
            className="erp-field flex-1 max-w-[630px] bg-white font-bold text-[13px]"
          />
          <label className="flex items-center gap-1.5 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsNew}
              onChange={(e) => setSaveAsNew(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span>حفظ كنموذج جديد</span>
          </label>
        </div>

        {/* 2-Row WinForms Tab Control Header */}
        <div className="flex flex-col mt-1">
          <div className="flex flex-wrap items-end gap-0.5 px-1">
            {TOP_TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 py-1 text-[12px] font-bold border border-[#b4bcc8] cursor-pointer ${
                    active
                      ? 'bg-[#f4f6fa] border-b-[#f4f6fa] text-[#111] -mb-px z-10'
                      : 'bg-[#e6e9ef] text-[#333] hover:bg-[#eff2f8]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end gap-0.5 px-1 mt-0.5">
            {BOTTOM_TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 py-1 text-[12px] font-bold border border-[#b4bcc8] cursor-pointer ${
                    active
                      ? 'bg-[#f4f6fa] border-b-[#f4f6fa] text-[#111] -mb-px z-10'
                      : 'bg-[#e6e9ef] text-[#333] hover:bg-[#eff2f8]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Body */}
          <div className="bg-[#f4f6fa] border border-[#9aa7b8] p-3 h-[340px] overflow-y-auto erp-scrollbar">
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-[12px]">
                {/* Right Column: Default Accounts & Pay Type */}
                <div className="md:col-span-5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold w-[125px] shrink-0">نوع الفاتورة الافتراضي</span>
                    <input
                      value={tpl.general.defaultPayCode}
                      onChange={(e) => setGeneral('defaultPayCode', e.target.value)}
                      className="erp-field w-[80px] bg-white text-center"
                    />
                    <select
                      value={tpl.general.defaultPayType}
                      onChange={(e) =>
                        setGeneral('defaultPayType', e.target.value as '' | 'نقدي' | 'آجل')
                      }
                      className="erp-field flex-1 bg-white"
                    >
                      <option value=""></option>
                      <option value="آجل">آجل</option>
                      <option value="نقدي">نقدي</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold w-[125px] shrink-0">مركز الكلفة افتراضي</span>
                    <input
                      value={tpl.general.defaultCostCenter}
                      onChange={(e) => setGeneral('defaultCostCenter', e.target.value)}
                      className="erp-field flex-1 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openCostCenterLookup((v) => setGeneral('defaultCostCenter', v))
                      }
                      className="erp-classic-btn px-2.5 h-[24px]"
                    >
                      بحث
                    </button>
                  </div>

                  {(
                    [
                      {
                        chk: 'useDefaultCustomer',
                        val: 'defaultCustomer',
                        label: 'حساب الزبون الإفتراضي',
                        onSearch: () =>
                          openAccountLookup('اختيار حساب الزبون', (v) =>
                            setGeneral('defaultCustomer', v)
                          ),
                      },
                      {
                        chk: 'useDefaultCashAccount',
                        val: 'defaultCashAccount',
                        label: 'حساب النقدية الإفتراضي',
                        onSearch: () =>
                          openCashBankLookup((v) => setGeneral('defaultCashAccount', v)),
                      },
                      {
                        chk: 'useDefaultNetworkAccount',
                        val: 'defaultNetworkAccount',
                        label: 'حساب الشبكة الإفتراضي',
                        onSearch: () =>
                          openCashBankLookup((v) => setGeneral('defaultNetworkAccount', v)),
                      },
                      {
                        chk: 'useDefaultDiscountAccount',
                        val: 'defaultDiscountAccount',
                        label: 'حساب الخصم الإفتراضي',
                        onSearch: () =>
                          openAccountLookup(
                            'اختيار حساب الخصم',
                            (v) => setGeneral('defaultDiscountAccount', v),
                            tpl.general.defaultDiscountAccount
                          ),
                      },
                      {
                        chk: 'useDefaultWarehouse',
                        val: 'defaultWarehouse',
                        label: 'مستودع افتراضي',
                        onSearch: () =>
                          openWarehouseLookup((v) => setGeneral('defaultWarehouse', v)),
                      },
                    ] as const
                  ).map((row) => (
                    <div key={row.chk} className="flex items-center gap-1.5">
                      <label className="flex items-center gap-1.5 w-[150px] shrink-0 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.general[row.chk]}
                          onChange={(e) => setGeneral(row.chk, e.target.checked)}
                        />
                        <span>{row.label}</span>
                      </label>
                      <input
                        value={tpl.general[row.val]}
                        onChange={(e) => setGeneral(row.val, e.target.value)}
                        className="erp-field flex-1 bg-white text-center"
                      />
                      <button
                        type="button"
                        onClick={row.onSearch}
                        className="erp-classic-btn px-2.5 h-[24px]"
                      >
                        بحث
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1.5 w-[150px] shrink-0 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tpl.general.useDefaultCurrency}
                        onChange={(e) => setGeneral('useDefaultCurrency', e.target.checked)}
                      />
                      <span>عملة افتراضية</span>
                    </label>
                    <select
                      disabled={!tpl.general.useDefaultCurrency}
                      value={tpl.general.defaultCurrency}
                      onChange={(e) => setGeneral('defaultCurrency', e.target.value)}
                      className={`erp-field flex-1 ${
                        tpl.general.useDefaultCurrency ? 'bg-white' : 'bg-[#e6e9ef] text-[#555]'
                      }`}
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Middle Column: Behavior Checkboxes */}
                <div className="md:col-span-4 flex flex-col gap-1">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tpl.isDefault}
                      onChange={(e) => setTpl((p) => ({ ...p, isDefault: e.target.checked }))}
                    />
                    <span>النموذج الإفتراضي</span>
                  </label>
                  {(
                    [
                      ['warnCustomerMax', 'عند تجاوز الحد الأعلى للزبون'],
                      ['warnItemMin', 'التنبية عند تجاوز الحد الأدنى للمادة'],
                      ['cashEqualsNet', 'الدفعة النقدية تساوي صافي الفاتورة'],
                      ['warnNoExpiryStock', 'التنبيه عند عدم وجود رصيد لتاريخ صلاحية'],
                      ['showPrevBalance', 'إظهار الرصيد السابق للحساب'],
                      ['showDuePeriod', 'إظهار فترة الاستحقاق'],
                      ['confirmSaveMsg', 'إظهار رسالة تأكيد الحفظ'],
                      ['showExtraPayType', 'إظهار خيار إضافي لنوع الفاتورة'],
                      ['showMultiCustomersBtn', 'إظهار زر مذكورين لحسابات الزبائن'],
                      ['showBalanceWithTotal', 'إظهار الرصيد مع إجمالي الفاتورة'],
                      ['preventSellAboveMax', 'عدم تجاوز كمية الحد الأعلى للبيع'],
                    ] as [keyof InvoiceTemplateConfig['general'], string][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.general[key])}
                        onChange={(e) => setGeneral(key, e.target.checked)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Left Column: Credit Ceiling + Header Visibility Flags */}
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <fieldset className="border border-[#c5cedb] p-2 bg-[#f8f9fc]">
                    <legend className="px-1 font-bold text-[11px]">سقف محدد للرصيد</legend>
                    <div className="flex items-center gap-1">
                      <select
                        disabled={!tpl.general.creditLimitAmount.trim()}
                        value={
                          tpl.general.creditLimitAction === 'منع الحفظ'
                            ? 'الإمتناع'
                            : tpl.general.creditLimitAction === 'تحذير فقط'
                              ? 'التنبية فقط'
                              : tpl.general.creditLimitAction
                        }
                        onChange={(e) => setGeneral('creditLimitAction', e.target.value)}
                        className={`erp-field flex-1 text-[11px] ${
                          tpl.general.creditLimitAmount.trim()
                            ? 'bg-white'
                            : 'bg-[#e6e9ef] text-[#666]'
                        }`}
                      >
                        <option value=""></option>
                        <option value="التنبية فقط">التنبية فقط</option>
                        <option value="الإمتناع">الإمتناع</option>
                      </select>
                      <input
                        value={tpl.general.creditLimitAmount}
                        onChange={(e) => setGeneral('creditLimitAmount', e.target.value)}
                        className="erp-field w-[75px] bg-white text-center"
                      />
                    </div>
                  </fieldset>

                  <div className="flex flex-col gap-1 pr-2 pt-1">
                    {(
                      [
                        ['showDoc', 'إظهار المستند'],
                        ['showName', 'إظهار الأسم'],
                        ['showStatement', 'البيان'],
                        ['showDistributor', 'إظهار الموزع'],
                        ['showSupplierBalance', 'إظهار رصيد المورد'],
                        ['showAddress', 'إظهار العنوان'],
                        ['showTaxNumber', 'الرقم الضريبي'],
                      ] as [keyof InvoiceTemplateConfig['general'], string][]
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(tpl.general[key])}
                          onChange={(e) => setGeneral(key, e.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'showFields' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                {[fieldChecksCol1, fieldChecksCol2, fieldChecksCol3, fieldChecksCol4].map(
                  (col, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      {col.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-1.5 font-bold cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(tpl.columns[item.key])}
                            onChange={(e) => setCol(item.key, e.target.checked)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                      {idx === 1 && (
                        <select
                          disabled={!tpl.columns.showUnit}
                          value={tpl.columns.extraSelect}
                          onChange={(e) => setCol('extraSelect', e.target.value)}
                          className={`erp-field mt-1 ${
                            tpl.columns.showUnit ? 'bg-white' : 'bg-[#e6e9ef] text-[#666]'
                          }`}
                        >
                          <option value=""></option>
                          <option value="الوحدة الرئيسية">الوحدة الرئيسية</option>
                          <option value="الوحدة الأولى">الوحدة الأولى</option>
                          <option value="الوحدة الثانية">الوحدة الثانية</option>
                        </select>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'salesExpenses' && (
              <div className="flex flex-col gap-3">
                <fieldset className="border border-[#c5cedb] p-3">
                  <legend className="px-1 font-bold">مبيعات</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="salesAccMode"
                          checked={tpl.salesAndExpenses.salesAccountMode === 'single'}
                          onChange={() => setSalesExp('salesAccountMode', 'single')}
                        />
                        <span>حساب مبيعات واحد للفاتورة</span>
                      </label>
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="salesAccMode"
                          checked={tpl.salesAndExpenses.salesAccountMode === 'perItem'}
                          onChange={() => setSalesExp('salesAccountMode', 'perItem')}
                        />
                        <span>حساب مبيعات محدد لكل مادة</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">حساب مبيعات إفتراضي</span>
                        <input
                          value={tpl.salesAndExpenses.defaultSalesAccount}
                          onChange={(e) => setSalesExp('defaultSalesAccount', e.target.value)}
                          className="erp-field flex-1 bg-white text-center font-bold"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openSalesAccountLookup((v) => setSalesExp('defaultSalesAccount', v))
                          }
                          className="erp-classic-btn px-3 h-[24px]"
                        >
                          بحث
                        </button>
                      </div>
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.salesAndExpenses.showSalesAccount}
                          onChange={(e) => setSalesExp('showSalesAccount', e.target.checked)}
                        />
                        <span>إظهار حساب المبيعات</span>
                      </label>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-[#c5cedb] p-3">
                  <legend className="px-1 font-bold">المصاريف</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      {(
                        [
                          ['salesItems', 'تحميل المصاريف على حسابات مبيعات المواد'],
                          ['expenseAccounts', 'تحميل المصاريف على حسابات المصاريف'],
                          ['singleExpense', 'تحميل المصاريف على حساب مصاريف واحد'],
                          ['perLineExpense', 'لكل بند مصروف مستقل'],
                          ['disabled', 'إلغاء المصاريف من الفاتورة'],
                        ] as const
                      ).map(([val, label]) => (
                        <label
                          key={val}
                          className="flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="expMode"
                            checked={tpl.salesAndExpenses.expensesMode === val}
                            onChange={() => setSalesExp('expensesMode', val)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>

                    <div
                      className={`flex flex-col gap-1.5 ${
                        tpl.salesAndExpenses.expensesMode === 'disabled' ? 'opacity-55' : ''
                      }`}
                    >
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={tpl.salesAndExpenses.expensesMode === 'disabled'}
                          checked={tpl.salesAndExpenses.chargeSupplier}
                          onChange={(e) => setSalesExp('chargeSupplier', e.target.checked)}
                        />
                        <span>تحميل المصاريف على حساب المورد</span>
                      </label>
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={tpl.salesAndExpenses.expensesMode === 'disabled'}
                          checked={tpl.salesAndExpenses.specificPayAccount}
                          onChange={(e) => setSalesExp('specificPayAccount', e.target.checked)}
                        />
                        <span>حساب دفع مصاريف محدد</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-[130px]">حساب مصاريف افتراضي</span>
                        <input
                          disabled={tpl.salesAndExpenses.expensesMode === 'disabled'}
                          value={tpl.salesAndExpenses.defaultExpenseAccount}
                          onChange={(e) => setSalesExp('defaultExpenseAccount', e.target.value)}
                          className="erp-field flex-1 bg-white"
                        />
                        <button
                          type="button"
                          disabled={tpl.salesAndExpenses.expensesMode === 'disabled'}
                          onClick={() =>
                            openAccountLookup('حساب مصاريف افتراضي', (v) =>
                              setSalesExp('defaultExpenseAccount', v)
                            )
                          }
                          className="erp-classic-btn px-2.5 h-[24px]"
                        >
                          بحث
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-[130px]">حساب مقابل للمصاريف</span>
                        <input
                          disabled={tpl.salesAndExpenses.expensesMode === 'disabled'}
                          value={tpl.salesAndExpenses.offsetExpenseAccount}
                          onChange={(e) => setSalesExp('offsetExpenseAccount', e.target.value)}
                          className="erp-field flex-1 bg-white"
                        />
                        <button
                          type="button"
                          disabled={tpl.salesAndExpenses.expensesMode === 'disabled'}
                          onClick={() =>
                            openAccountLookup('حساب مقابل للمصاريف', (v) =>
                              setSalesExp('offsetExpenseAccount', v)
                            )
                          }
                          className="erp-classic-btn px-2.5 h-[24px]"
                        >
                          بحث
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-[130px]">عملة المصاريف</span>
                        <select
                          disabled={tpl.salesAndExpenses.expensesMode === 'disabled'}
                          value={tpl.salesAndExpenses.expenseCurrency}
                          onChange={(e) => setSalesExp('expenseCurrency', e.target.value)}
                          className="erp-field flex-1 bg-white"
                        >
                          {currencies.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activeTab === 'discountsCommissions' && (
              <div className="flex flex-col gap-3">
                <fieldset className="border border-[#c5cedb] p-2.5">
                  <legend className="px-1 font-bold">الخصميات</legend>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-5 flex flex-col gap-2">
                      {(
                        [
                          ['disabled', 'إلغاء الخصميات من الفاتورة'],
                          ['perItemSingle', 'تحميل مبلغ خصم المادة على حساب خصم واحد'],
                          ['totalSingle', 'تحميل مبلغ إجمالي للخصم على حساب خصم واحد'],
                        ] as const
                      ).map(([val, label]) => (
                        <label
                          key={val}
                          className="flex items-center gap-1.5 font-bold cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="discMode"
                            checked={tpl.discountsAndCommissions.discountMode === val}
                            onChange={() => setDiscComm('discountMode', val)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="md:col-span-4 flex flex-col gap-1.5">
                      <div className="text-center font-bold">حساب خصم صنف افتراضي</div>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.discountsAndCommissions.showDiscountAccount}
                          onChange={(e) => setDiscComm('showDiscountAccount', e.target.checked)}
                        />
                        <span>إظهار حساب الخصميات</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.discountsAndCommissions.showDiscountPercent}
                          onChange={(e) => setDiscComm('showDiscountPercent', e.target.checked)}
                        />
                        <span>إظهار الخصم كنسبة</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.discountsAndCommissions.showDiscountAmount}
                          onChange={(e) => setDiscComm('showDiscountAmount', e.target.checked)}
                        />
                        <span>إظهار الخصم كمبلغ</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.discountsAndCommissions.maxDiscountPercentEnabled}
                          onChange={(e) =>
                            setDiscComm('maxDiscountPercentEnabled', e.target.checked)
                          }
                        />
                        <span>الحد الأعلى لنسبة الخصم</span>
                      </label>
                    </div>
                    <div className="md:col-span-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          value={tpl.discountsAndCommissions.defaultDiscountAccount}
                          onChange={(e) =>
                            setDiscComm('defaultDiscountAccount', e.target.value)
                          }
                          className="erp-field flex-1 bg-white text-center"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openAccountLookup(
                              'حساب الخصم الافتراضي',
                              (v) => setDiscComm('defaultDiscountAccount', v),
                              tpl.discountsAndCommissions.defaultDiscountAccount
                            )
                          }
                          className="erp-classic-btn px-2 h-[24px]"
                        >
                          بحث
                        </button>
                      </div>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.discountsAndCommissions.includeItemDiscount}
                          onChange={(e) => setDiscComm('includeItemDiscount', e.target.checked)}
                        />
                        <span>ادراج خصم المادة</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.discountsAndCommissions.includeCustomerDiscount}
                          onChange={(e) =>
                            setDiscComm('includeCustomerDiscount', e.target.checked)
                          }
                        />
                        <span>ادراج خصم الزبون</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.discountsAndCommissions.bonusDiscountModel}
                          onChange={(e) => setDiscComm('bonusDiscountModel', e.target.checked)}
                        />
                        <span>نموذج خصم بونص</span>
                      </label>
                      <input
                        type="number"
                        value={tpl.discountsAndCommissions.maxDiscountPercent}
                        onChange={(e) =>
                          setDiscComm('maxDiscountPercent', Number(e.target.value) || 0)
                        }
                        className="erp-field w-[80px] bg-white text-center"
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="border border-[#c5cedb] p-2.5">
                  <legend className="px-1 font-bold">العمولات</legend>
                  {(() => {
                    const commDisabled = tpl.discountsAndCommissions.commissionMode === 'disabled';
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-6 flex flex-col gap-1.5">
                          {(
                            [
                              ['disabled', 'إلغاء العمولات من الفاتورة'],
                              ['perItemAccount', 'تحميل مبلغ عمولة المادة على حساب عمولة المادة'],
                              ['perItemSingle', 'تحميل مبلغ عمولة المادة على حساب عمولة واحد'],
                              ['totalSingle', 'تحميل مبلغ إجمالي للعمولات على حساب عمولة واحد'],
                            ] as const
                          ).map(([val, label]) => (
                            <label
                              key={val}
                              className="flex items-center gap-1.5 font-bold cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="commMode"
                                checked={tpl.discountsAndCommissions.commissionMode === val}
                                onChange={() => setDiscComm('commissionMode', val)}
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="md:col-span-6 flex flex-col gap-1.5">
                          <div
                            className={`flex items-center gap-1.5 ${
                              commDisabled ? 'opacity-50' : ''
                            }`}
                          >
                            <span className="font-bold w-[130px]">حساب عمولات افتراضي</span>
                            <input
                              disabled={commDisabled}
                              value={tpl.discountsAndCommissions.defaultCommissionAccount}
                              onChange={(e) =>
                                setDiscComm('defaultCommissionAccount', e.target.value)
                              }
                              className="erp-field flex-1 bg-white"
                            />
                            <button
                              type="button"
                              disabled={commDisabled}
                              onClick={() =>
                                openAccountLookup(
                                  'حساب عمولات افتراضي',
                                  (v) => setDiscComm('defaultCommissionAccount', v),
                                  tpl.discountsAndCommissions.defaultCommissionAccount
                                )
                              }
                              className="erp-classic-btn px-2 h-[24px]"
                            >
                              بحث
                            </button>
                          </div>
                          <div
                            className={`flex items-center gap-1.5 ${
                              commDisabled ? 'opacity-50' : ''
                            }`}
                          >
                            <span className="font-bold w-[130px]">مندوب بيع افتراضي</span>
                            <input
                              disabled={commDisabled}
                              value={tpl.discountsAndCommissions.defaultSalesRep}
                              onChange={(e) => setDiscComm('defaultSalesRep', e.target.value)}
                              className="erp-field flex-1 bg-white"
                            />
                            <button
                              type="button"
                              disabled={commDisabled}
                              onClick={() =>
                                openSalesRepLookup(
                                  (v) => setDiscComm('defaultSalesRep', v),
                                  tpl.discountsAndCommissions.defaultSalesRep
                                )
                              }
                              className="erp-classic-btn px-2 h-[24px]"
                            >
                              بحث
                            </button>
                          </div>
                          <label
                            className={`flex items-center gap-1.5 font-bold cursor-pointer ${
                              commDisabled ? 'opacity-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={commDisabled}
                              checked={tpl.discountsAndCommissions.showSalesRepAccount}
                              onChange={(e) =>
                                setDiscComm('showSalesRepAccount', e.target.checked)
                              }
                            />
                            <span>إظهار حساب مندوب البيع</span>
                          </label>
                          <label
                            className={`flex items-center gap-1.5 font-bold cursor-pointer ${
                              commDisabled ? 'opacity-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={commDisabled}
                              checked={tpl.discountsAndCommissions.showCommissionsAccount}
                              onChange={(e) =>
                                setDiscComm('showCommissionsAccount', e.target.checked)
                              }
                            />
                            <span>إظهار حساب العمولات</span>
                          </label>
                          <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tpl.discountsAndCommissions.chargeTotalAsCommission}
                              onChange={(e) =>
                                setDiscComm('chargeTotalAsCommission', e.target.checked)
                              }
                            />
                            <span>تحميل إجمالي الفاتورة كعمولات</span>
                          </label>
                        </div>
                      </div>
                    );
                  })()}
                </fieldset>
              </div>
            )}

            {activeTab === 'additional' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                <div className="flex flex-col gap-1.5">
                  {(
                    [
                      ['showCostCenters', 'اظهار مراكز الكلفة'],
                      ['lockDate', 'اغلاق حقل التاريخ'],
                      ['lockInvoiceNumber', 'اغلاق حقل رقم الفاتورة'],
                      ['lockBonus', 'اغلاق حقل البونص'],
                      ['lockWarehouse', 'اغلاق حقل المستودع'],
                      ['lockPrice', 'اغلاق حقل السعر'],
                      ['allowEditTotal', 'السماح بتعديل حقل الإجمالي'],
                      ['warnDuplicateItem', 'التنبيه عند تكرار المادة'],
                      ['requireRef', 'اظهار المرجع وإدخاله إجباري'],
                      [
                        'allowZeroInOutNote',
                        'السماح بحفظ السعر صفر في مذكرة الإدخال والإخراج',
                      ],
                    ] as [keyof InvoiceTemplateConfig['additional'], string][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.additional[key])}
                        onChange={(e) => setAdd(key, e.target.checked)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tpl.additional.showPriceForEdit}
                        onChange={(e) => setAdd('showPriceForEdit', e.target.checked)}
                      />
                      <span>عرض السعر للتعديل</span>
                    </label>
                    <select
                      value={tpl.additional.priceEditMode}
                      onChange={(e) => setAdd('priceEditMode', e.target.value)}
                      className="erp-field flex-1 bg-white"
                    >
                      <option value="سعر البيع الافتراضي">سعر البيع الافتراضي</option>
                      <option value="آخر سعر للعميل">آخر سعر للعميل</option>
                      <option value="سعر الجملة">سعر الجملة</option>
                    </select>
                  </div>
                  {(
                    [
                      ['updateCostOnMove', 'تحديث سعر الكلفة عند كل حركة'],
                      ['newRowOnEnter', 'صف جديد عند الضغط على مفتاح Enter'],
                      ['noCashInCredit', 'عدم التعامل بالدفعة النقدية في الفواتير الآجلة'],
                      ['showReturnBeforeOpening', 'إضهار خيار مردود قبل الأرصدة الإفتتاحية'],
                      ['appendEnterBarcode', 'إضافة Enter لقارئ الباركود الذي لا يدعم'],
                      ['linkLengthWidthUnit', 'ربط الطول والعرض بالوحدات'],
                      ['linkQtyLengthWidthCount', 'ربط الكمية بالطول والعرض والعدد'],
                      ['multiplyTotalByDueDays', 'ضرب إجمالي الفاتورة بعدد أيام الإستحقاق'],
                      [
                        'useInvoicePriceOnUnitSwitch',
                        'عند التبديل بين الوحدات استخدم السعر المحدد داخل الفاتورة',
                      ],
                    ] as [keyof InvoiceTemplateConfig['additional'], string][]
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.additional[key])}
                        onChange={(e) => setAdd(key, e.target.checked)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'price' && (
              <div className="flex flex-col gap-4 px-4 py-3 text-[12px]">
                {/* Top Default Price Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold w-[110px]">السعر الإفتراضي</span>
                  <select
                    value={tpl.extraTabs.priceTier}
                    onChange={(e) => setExtra('priceTier', e.target.value)}
                    className="erp-field w-[260px] bg-white font-bold text-center"
                  >
                    {PRICE_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                  <span className="font-bold text-[14px] px-1">+</span>
                  <input
                    type="number"
                    value={tpl.extraTabs.pricePercentOffset ?? 0}
                    onChange={(e) => setExtra('pricePercentOffset', Number(e.target.value) || 0)}
                    className="erp-field w-[75px] bg-white text-center font-bold"
                  />
                  <span className="font-bold text-[14px]">%</span>
                </div>

                {/* Fieldset: عند البيع بأقل من السعر */}
                <fieldset className="border border-[#c5cedb] px-4 py-3 mr-[115px]">
                  <legend className="px-1.5 font-bold">عند البيع بأقل من السعر</legend>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-5 flex flex-col gap-2">
                      {(
                        [
                          ['none', 'إلغاء مراقبة الأسعار'],
                          ['warn', 'التنبيه عند البيع بأقل من السعر'],
                          ['block', 'الأمتناع عند البيع بأقل من السعر'],
                        ] as const
                      ).map(([val, lbl]) => (
                        <label
                          key={val}
                          className="flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="belowPriceAction"
                            checked={(tpl.extraTabs.belowPriceAction || 'none') === val}
                            onChange={() => setExtra('belowPriceAction', val)}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </div>
                    <div className="md:col-span-7 flex items-center gap-2">
                      <select
                        value={tpl.extraTabs.belowPriceRef || 'سعر البيع'}
                        onChange={(e) => setExtra('belowPriceRef', e.target.value)}
                        className="erp-field w-[240px] bg-white font-bold text-center"
                      >
                        {PRICE_TIERS.map((tier) => (
                          <option key={`ref-${tier}`} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                      <span className="font-bold text-[14px]">+</span>
                      <input
                        type="number"
                        value={tpl.extraTabs.belowPricePercentOffset ?? 0}
                        onChange={(e) =>
                          setExtra('belowPricePercentOffset', Number(e.target.value) || 0)
                        }
                        className="erp-field w-[75px] bg-white text-center font-bold"
                      />
                      <span className="font-bold text-[14px]">%</span>
                    </div>
                  </div>
                </fieldset>

                {/* Bottom Checkboxes */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(tpl.extraTabs.useUnitPriceOnSale)}
                      onChange={(e) => setExtra('useUnitPriceOnSale', e.target.checked)}
                    />
                    <span>ادراج السعر بحسب سعر الوحدات عند البيع</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(tpl.extraTabs.useWholesaleForCredit)}
                      onChange={(e) => setExtra('useWholesaleForCredit', e.target.checked)}
                    />
                    <span>استخدم سعر الجملة لبيع الفواتير الأجل</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'searchConds' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-2 py-2 text-[12px] h-full">
                {/* Right + Middle Area (8 cols) */}
                <div className="md:col-span-8 flex flex-col gap-4">
                  {/* طريقة البحث fieldset */}
                  <fieldset className="border border-[#c5cedb] px-4 py-2.5 flex items-center justify-around">
                    <legend className="px-1.5 font-bold">طريقة البحث</legend>
                    {(
                      [
                        ['startsWith', 'بداية الكلمة'],
                        ['contains', 'ضمن الكلمة'],
                        ['equals', 'يطابق الكلمة'],
                      ] as const
                    ).map(([modeVal, lbl]) => (
                      <label
                        key={modeVal}
                        className="flex items-center gap-2 font-bold cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="searchMatchMode"
                          checked={(tpl.extraTabs.searchMatchMode || 'contains') === modeVal}
                          onChange={() => setExtra('searchMatchMode', modeVal)}
                        />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </fieldset>

                  {/* Checkboxes Split into 2 Columns */}
                  <div className="grid grid-cols-2 gap-4 pr-2">
                    <div className="flex flex-col gap-3">
                      {(
                        [
                          ['searchByCode', 'الرمز'],
                          ['searchByName', 'الاسم'],
                          ['searchByForeignName', 'الاسم الأجنبي'],
                          ['searchByBarcode', 'الباركود'],
                          ['searchByCardNo', 'رقم البطاقة'],
                        ] as [keyof InvoiceTemplateConfig['extraTabs'], string][]
                      ).map(([k, lbl]) => (
                        <label
                          key={k}
                          className="flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(tpl.extraTabs[k])}
                            onChange={(e) => setExtra(k, e.target.checked)}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3">
                      {(
                        [
                          ['useExtendedItemSearch', 'إستخدام البحث الموسع في المواد'],
                          ['skipSubBarcodes', 'عدم البحث في الباركودات الفرعية'],
                          ['searchBarcodeSubstring', 'البحث في جزء من الباركود'],
                          ['hideItemCode', 'عدم إظهار رمز المادة'],
                          ['showItemForeignName', 'إظهار الاسم الاجنبي للمادة'],
                        ] as [keyof InvoiceTemplateConfig['extraTabs'], string][]
                      ).map(([k, lbl]) => (
                        <label
                          key={k}
                          className="flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(tpl.extraTabs[k])}
                            onChange={(e) => setExtra(k, e.target.checked)}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Left Side: خصائص المواد Fieldset (4 cols) */}
                <fieldset className="md:col-span-4 border border-[#c5cedb] px-4 py-3 flex flex-col justify-between">
                  <legend className="px-1.5 font-bold">خصائص المواد</legend>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.extraTabs.propGroup)}
                        onChange={(e) => setExtra('propGroup', e.target.checked)}
                      />
                      <span>المجموعة</span>
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.extraTabs.propAgent)}
                        onChange={(e) => setExtra('propAgent', e.target.checked)}
                      />
                      <span>الوكيل</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.extraTabs.propScientific)}
                        onChange={(e) => setExtra('propScientific', e.target.checked)}
                      />
                      <span>الاسم العلمي</span>
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.extraTabs.propForm)}
                        onChange={(e) => setExtra('propForm', e.target.checked)}
                      />
                      <span>الهيئة</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.extraTabs.propCol)}
                        onChange={(e) => setExtra('propCol', e.target.checked)}
                      />
                      <span>العمود</span>
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tpl.extraTabs.propRow)}
                        onChange={(e) => setExtra('propRow', e.target.checked)}
                      />
                      <span>الصف</span>
                    </label>
                  </div>
                </fieldset>
              </div>
            )}

            {activeTab === 'salesTax' && (() => {
              const currentTaxMode =
                tpl.extraTabs.taxMode || (tpl.extraTabs.enableTax ? 'totalSingle' : 'disabled');
              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 text-[12px]">
                  {/* Right Side: Tax Mode Radios + Bottom 2 Checkboxes */}
                  <div className="md:col-span-6 flex flex-col justify-between gap-6">
                    <div className="flex flex-col gap-3">
                      {(
                        [
                          ['disabled', 'إلغاء الضريبة من الفاتورة'],
                          ['perItemIndependent', 'تحميل مبلغ ضريبة المادة على حساب ضريبة مستقل'],
                          ['perItemSingle', 'تحميل مبلغ ضريبة المادة على حساب ضريبة واحد'],
                          ['totalSingle', 'تحميل مبلغ إجمالي للضريبة على حساب ضريبة واحد'],
                        ] as const
                      ).map(([modeVal, lbl]) => (
                        <label
                          key={modeVal}
                          className="flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="taxMode"
                            checked={currentTaxMode === modeVal}
                            onChange={() => {
                              setTpl((prev) => ({
                                ...prev,
                                extraTabs: {
                                  ...prev.extraTabs,
                                  taxMode: modeVal,
                                  enableTax: modeVal !== 'disabled',
                                },
                              }));
                            }}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2.5 pt-2">
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.extraTabs.taxInclusive}
                          onChange={(e) => setExtra('taxInclusive', e.target.checked)}
                        />
                        <span>السعر شامل للضريبة</span>
                      </label>
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(tpl.extraTabs.skipTaxEntry)}
                          onChange={(e) => setExtra('skipTaxEntry', e.target.checked)}
                        />
                        <span>عدم كتابة قيد الضريبة</span>
                      </label>
                    </div>
                  </div>

                  {/* Left Side: Default Tax Account + Checkboxes + Default Rate */}
                  <div className="md:col-span-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-[135px] shrink-0">حساب ضريبة افتراضي</span>
                      <input
                        value={tpl.extraTabs.defaultTaxAccount || ''}
                        onChange={(e) => setExtra('defaultTaxAccount', e.target.value)}
                        className="erp-field w-[150px] bg-white text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openAccountLookup('لائحة نتيجة البحث', (v) =>
                            setExtra('defaultTaxAccount', v)
                          )
                        }
                        className="erp-classic-btn px-3 h-[24px]"
                      >
                        بحث
                      </button>
                    </div>

                    <div className="flex flex-col gap-2.5 pr-1">
                      {(
                        [
                          ['showTaxAccount', 'إظهار حساب الضريبة'],
                          ['showTaxPercent', 'إظهار الضريبة كنسبة'],
                          ['showTaxAmount', 'إظهار الضريبة كمبلغ'],
                          ['includeItemTaxRate', 'ادراج نسبة الضريبة المعرفة في المادة'],
                        ] as [keyof InvoiceTemplateConfig['extraTabs'], string][]
                      ).map(([k, lbl]) => (
                        <label
                          key={k}
                          className="flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(tpl.extraTabs[k])}
                            onChange={(e) => setExtra(k, e.target.checked)}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="font-bold w-[135px] shrink-0">نسبة الضريبة الإفتراضي</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={tpl.extraTabs.taxPercent}
                        onChange={(e) => setExtra('taxPercent', Number(e.target.value) || 0)}
                        className="erp-field w-[78px] bg-white text-center font-bold"
                      />
                      <span className="font-bold text-[14px]">%</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'users' && (() => {
              const listUsers =
                users.length > 0 ? users.map((u) => u.name) : ['admin'];
              const selected = tpl.extraTabs.selectedUsers || [];
              const toggleUser = (uname: string) => {
                const next = selected.includes(uname)
                  ? selected.filter((x) => x !== uname)
                  : [...selected, uname];
                setTpl((prev) => ({
                  ...prev,
                  extraTabs: {
                    ...prev.extraTabs,
                    selectedUsers: next,
                    allowedUsers: next.length ? next.join(', ') : 'الجميع',
                  },
                }));
              };
              return (
                <div className="h-full bg-white border border-[#9aa7b8] overflow-y-scroll erp-scrollbar p-2">
                  <div className="flex flex-col gap-1">
                    {listUsers.map((uname) => (
                      <label
                        key={uname}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-[#eaf3fc] cursor-pointer font-bold"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(uname)}
                          onChange={() => toggleUser(uname)}
                        />
                        <span>{uname}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}

            {activeTab === 'medical' && (
              <div className="flex flex-col gap-4 px-4 py-3 text-[12px]">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(tpl.extraTabs.medicalTemplate)}
                    onChange={(e) => setExtra('medicalTemplate', e.target.checked)}
                  />
                  <span>نموذج طبي</span>
                </label>
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(tpl.extraTabs.medicalShowCount)}
                    onChange={(e) => setExtra('medicalShowCount', e.target.checked)}
                  />
                  <span>إظهار حقل العدد</span>
                </label>
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(tpl.extraTabs.medicalAllowEditAfterTest)}
                    onChange={(e) => setExtra('medicalAllowEditAfterTest', e.target.checked)}
                  />
                  <span>السماح بتعديل الفاتورة بعد ادخال نتيجة الفحص</span>
                </label>
              </div>
            )}

            {activeTab === 'scale' && (() => {
              const sp = tpl.scaleProps || DEFAULT_INVOICE_SCALE_PROPS;
              return (
                <div className="px-4 py-2 text-[12px] flex justify-start">
                  <div className="border border-[#c5cedb] px-6 py-4 w-[360px] relative mt-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer bg-[#f4f6fa] px-2 absolute -top-2.5 right-4">
                      <input
                        type="checkbox"
                        checked={sp.isScaleItem}
                        onChange={(e) => setScaleProp('isScaleItem', e.target.checked)}
                      />
                      <span>مادة ميزان</span>
                    </label>

                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">رمز مادة ميزان</span>
                        <input
                          value={sp.scaleItemPrefix}
                          onChange={(e) => {
                            setScaleProp('scaleItemPrefix', e.target.value);
                            setExtra('scalePrefix', e.target.value);
                          }}
                          className="erp-field w-[54px] h-[25px] bg-white text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">عدد خانات رمز المادة</span>
                        <input
                          value={sp.itemCodeDigits}
                          onChange={(e) => setScaleProp('itemCodeDigits', e.target.value)}
                          className="erp-field w-[54px] h-[25px] bg-white text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">عدد خانات السعر أو الكمية</span>
                        <input
                          value={sp.priceOrQtyDigits}
                          onChange={(e) => {
                            setScaleProp('priceOrQtyDigits', e.target.value);
                            if (Number(e.target.value) > 0) {
                              setExtra('scaleWeightDigits', Number(e.target.value));
                            }
                          }}
                          className="erp-field w-[54px] h-[25px] bg-white text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">عدد الخانات العشرية للسعر</span>
                        <input
                          value={sp.priceDecimalDigits}
                          onChange={(e) => setScaleProp('priceDecimalDigits', e.target.value)}
                          className="erp-field w-[54px] h-[25px] bg-white text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-6 py-2 pr-4">
                        <label className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="scaleValueMode"
                            checked={sp.valueMode === 'price'}
                            onChange={() => setScaleProp('valueMode', 'price')}
                          />
                          <span>السعر</span>
                        </label>
                        <label className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="scaleValueMode"
                            checked={sp.valueMode === 'qty'}
                            onChange={() => setScaleProp('valueMode', 'qty')}
                          />
                          <span>الكمية</span>
                        </label>
                      </div>

                      <div className="flex flex-col gap-2.5 pt-1">
                        <label className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sp.scalePriceIncludesTax}
                            onChange={(e) =>
                              setScaleProp('scalePriceIncludesTax', e.target.checked)
                            }
                          />
                          <span>سعر الميزان شامل للضريبة</span>
                        </label>
                        <label className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sp.fixQtyToOne}
                            onChange={(e) => setScaleProp('fixQtyToOne', e.target.checked)}
                          />
                          <span>تثبيت الكمية بواحد</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'printProps' && (() => {
              const pp = tpl.printProps || DEFAULT_INVOICE_PRINT_PROPS;
              const printTplChoices = Array.from(
                new Set([
                  '',
                  'نموذج طباعة ١',
                  ...reportTemplates.map((r) => r.name),
                ])
              );
              return (
                <div className="flex flex-col gap-3 text-[12px]">
                  {/* Top Printer & Print Template Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <div className="md:col-span-6 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-[135px] shrink-0">الطابعة الافتراضية</span>
                        <select
                          value={pp.defaultPrinter}
                          onChange={(e) => setPrintProp('defaultPrinter', e.target.value)}
                          className="erp-field flex-1 bg-white text-center font-bold"
                        >
                          <option value="" />
                          {PRINTER_LIST.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-[135px] shrink-0">نموذج الطباعة</span>
                        <select
                          value={pp.printTemplate}
                          onChange={(e) => setPrintProp('printTemplate', e.target.value)}
                          className="erp-field flex-1 bg-white text-center font-bold"
                        >
                          {printTplChoices.map((pt) => (
                            <option key={pt || 'empty'} value={pt}>
                              {pt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-[135px] shrink-0">نموذج الطباعة للزبون</span>
                        <select
                          value={pp.customerPrintTemplate}
                          onChange={(e) => setPrintProp('customerPrintTemplate', e.target.value)}
                          className="erp-field flex-1 bg-white text-center font-bold"
                        >
                          {printTplChoices.map((pt) => (
                            <option key={pt || 'empty-c'} value={pt}>
                              {pt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-6 flex items-center gap-2">
                      <span className="font-bold w-[75px] shrink-0">الطابعة ٢</span>
                      <select
                        value={pp.printer2}
                        onChange={(e) => setPrintProp('printer2', e.target.value)}
                        className="erp-field flex-1 bg-white text-center font-bold"
                      >
                        <option value="" />
                        {PRINTER_LIST.map((p) => (
                          <option key={`p2-${p}`} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bottom Split: Save/Print Radio + خاص بالمطاعم */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start mt-1">
                    <div className="md:col-span-5 flex flex-col gap-3">
                      <fieldset className="border border-[#c5cedb] p-3 flex flex-col gap-2">
                        <label className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="printOnSaveMode"
                            checked={pp.printOnSaveMode === 'none'}
                            onChange={() => setPrintProp('printOnSaveMode', 'none')}
                          />
                          <span>حفظ بدون طباعة</span>
                        </label>
                        <label className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="printOnSaveMode"
                            checked={pp.printOnSaveMode === 'prompt'}
                            onChange={() => setPrintProp('printOnSaveMode', 'prompt')}
                          />
                          <span>طباعة عند الحفظ مع التنبيه</span>
                        </label>
                        <label className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="printOnSaveMode"
                            checked={pp.printOnSaveMode === 'auto'}
                            onChange={() => setPrintProp('printOnSaveMode', 'auto')}
                          />
                          <span>طباعة عند الحفظ بدون تنبيه</span>
                        </label>
                      </fieldset>

                      <label className="flex items-center gap-2 font-bold cursor-pointer pr-2">
                        <input
                          type="checkbox"
                          checked={pp.singlePageOnly}
                          onChange={(e) => setPrintProp('singlePageOnly', e.target.checked)}
                        />
                        <span>الفاتورة ورقة واحدة فقط</span>
                      </label>
                    </div>

                    <fieldset className="md:col-span-7 border border-[#c5cedb] p-3 flex flex-col gap-1.5">
                      <legend className="px-1 font-bold">خاص بالمطاعم</legend>
                      {(
                        [
                          ['noPrintDirectGroupInvoice', 'عدم طباعة فاتورة تجميع المباشر'],
                          ['noPrintDepartmentInvoice', 'عدم طباعة فاتورة القسم'],
                          ['noPrintCustomerInvoice', 'عدم طباعة الفاتورة الخاص بالزبون'],
                          ['showItemsInCustomerInvoice', 'اظهار الاصناف بفاتورة الزبون'],
                        ] as [keyof InvoicePrintPropsConfig, string][]
                      ).map(([k, lbl]) => (
                        <label key={k} className="flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(pp[k])}
                            onChange={(e) => setPrintProp(k, e.target.checked)}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}

                      <div className="flex items-center gap-2 my-1">
                        <span className="font-bold shrink-0">عنوان التجميع</span>
                        <input
                          value={pp.groupTitle}
                          onChange={(e) => setPrintProp('groupTitle', e.target.value)}
                          className="erp-field flex-1 bg-white text-center font-bold"
                        />
                      </div>

                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pp.lockAccountInCash}
                          onChange={(e) => setPrintProp('lockAccountInCash', e.target.checked)}
                        />
                        <span>إغلاق حقل الحساب في الفواتير النقدية</span>
                      </label>
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pp.printSeparatePerDepartment}
                          onChange={(e) =>
                            setPrintProp('printSeparatePerDepartment', e.target.checked)
                          }
                        />
                        <span>طباعة مستند مستقل لكل قسم</span>
                      </label>
                    </fieldset>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'tableProps' && (() => {
              const cols = tpl.tableColumns || DEFAULT_INVOICE_TABLE_COLUMNS;
              return (
                <div className="h-full flex bg-[#a3a3a3] border border-[#666] overflow-hidden">
                  <div className="flex-1 bg-white overflow-auto erp-scrollbar">
                    <table className="w-full border-collapse text-[12px]">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#f0f0f0] border-b border-[#b9c4d4]">
                          <th className="w-6 border-l border-[#ccc]" />
                          <th className="py-1 px-2 font-bold text-center border-l border-[#ccc] w-[170px]">
                            اسم العمود
                          </th>
                          <th className="py-1 px-2 font-bold text-center border-l border-[#ccc] w-[72px]">
                            ملم افتراضي
                          </th>
                          <th className="py-1 px-2 font-bold text-center border-l border-[#ccc] w-[180px]">
                            الإسم البديل
                          </th>
                          <th className="py-1 px-2 font-bold text-center border-l border-[#ccc] w-[160px]">
                            الاسم الأجنبي
                          </th>
                          <th className="py-1 px-2 font-bold text-center w-[68px]">ملم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cols.map((col) => {
                          const isSel = selectedColId === col.id;
                          return (
                            <tr
                              key={col.id}
                              onClick={() => setSelectedColId(col.id)}
                              className="border-b border-[#d5dce6] h-[24px]"
                            >
                              <td className="text-center bg-[#f0f0f0] border-l border-[#ccc] text-[10px]">
                                {isSel ? '◀' : ''}
                              </td>
                              <td
                                className={`px-2 font-bold border-l border-[#ccc] ${
                                  isSel ? 'bg-[#0078d7] text-white' : 'bg-white'
                                }`}
                              >
                                {col.name}
                              </td>
                              <td className="px-2 text-center font-bold border-l border-[#ccc]">
                                {col.defaultWidth}
                              </td>
                              <td className="p-0 border-l border-[#ccc]">
                                <input
                                  value={col.altName}
                                  onFocus={() => setSelectedColId(col.id)}
                                  onChange={(e) =>
                                    updateTableCol(col.id, 'altName', e.target.value)
                                  }
                                  className="w-full h-[23px] px-2 text-left bg-transparent outline-none focus:bg-[#e5f1fb] font-bold"
                                />
                              </td>
                              <td className="p-0 border-l border-[#ccc]">
                                <input
                                  value={col.foreignName}
                                  onFocus={() => setSelectedColId(col.id)}
                                  onChange={(e) =>
                                    updateTableCol(col.id, 'foreignName', e.target.value)
                                  }
                                  className="w-full h-[23px] px-2 text-left bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                              <td className="p-0">
                                <input
                                  value={col.width}
                                  onFocus={() => setSelectedColId(col.id)}
                                  onChange={(e) =>
                                    updateTableCol(col.id, 'width', e.target.value)
                                  }
                                  className="w-full h-[23px] px-1 text-center bg-transparent outline-none focus:bg-[#e5f1fb] font-bold"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'window' && (() => {
              const wp = tpl.windowProps || DEFAULT_INVOICE_WINDOW_PROPS;
              const groupChoices = Array.from(
                new Set(['الكل', ...materialGroups.map((g) => g.name)])
              );
              return (
                <div className="flex flex-col gap-2.5 text-[12px]">
                  {/* Top Header Row matching Screenshot 030336 & 030405 */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wp.maximizeWindow}
                        onChange={(e) => setWindowProp('maximizeWindow', e.target.checked)}
                      />
                      <span>تكبير النافذة</span>
                    </label>
                    <span className="font-bold pr-1">النص الظاهر للفاتورة</span>
                    <input
                      value={wp.windowCaptionText}
                      onChange={(e) => setWindowProp('windowCaptionText', e.target.value)}
                      className="erp-field w-[210px] bg-white"
                    />
                    <span className="font-bold pr-1">مجموعة افتراضية</span>
                    <select
                      value={wp.defaultGroup}
                      onChange={(e) => setWindowProp('defaultGroup', e.target.value)}
                      className="erp-field flex-1 min-w-[140px] bg-white font-bold text-center"
                    >
                      {groupChoices.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Main 3-Column Body */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Right Column: الخطوط واللون + لوحة المواد - أزرار (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-2">
                      <fieldset className="border border-[#c5cedb] p-2 flex flex-col gap-2">
                        <legend className="px-1 font-bold">الخطوط واللون</legend>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTempFont({ ...wp.tableFont });
                              setFontDialogOpen(true);
                            }}
                            className="erp-classic-btn flex-1 h-[28px]"
                          >
                            خط الجدول
                          </button>
                          <div
                            className="erp-field w-[105px] h-[28px] bg-white flex items-center justify-center text-[10px] truncate px-1"
                            title={`${wp.tableFont.fontFamily} ${wp.tableFont.fontSize}`}
                          >
                            {wp.tableFont.fontFamily} ({wp.tableFont.fontSize})
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTempColor(wp.savePanelColor || '#b8c4ff');
                              setShowCustomColorInput(false);
                              setColorDialogTarget('savePanelColor');
                            }}
                            style={{ backgroundColor: wp.savePanelColor || '#b8c4ff' }}
                            className="border border-[#8e8e8e] flex-1 h-[28px] font-bold cursor-pointer hover:brightness-95"
                          >
                            لون لوحة زر الحفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTempColor(wp.windowBgColor || '#f0f0f0');
                              setShowCustomColorInput(false);
                              setColorDialogTarget('windowBgColor');
                            }}
                            style={{ backgroundColor: wp.windowBgColor || '#f0f0f0' }}
                            className="border border-[#8e8e8e] w-[105px] h-[28px] font-bold cursor-pointer hover:brightness-95"
                          >
                            لون النافذة
                          </button>
                        </div>
                      </fieldset>

                      <fieldset className="border border-[#c5cedb] p-2 flex flex-col gap-2">
                        <legend className="px-1 font-bold">لوحة المواد - أزرار</legend>
                        <div className="flex items-center justify-between gap-2 px-4">
                          <span className="font-bold">عدد الأعمدة</span>
                          <input
                            value={wp.itemsPanelCols}
                            onChange={(e) => setWindowProp('itemsPanelCols', e.target.value)}
                            className="erp-field w-[75px] h-[25px] bg-white text-center"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 px-4">
                          <span className="font-bold">عدد الصفوف</span>
                          <input
                            value={wp.itemsPanelRows}
                            onChange={(e) => setWindowProp('itemsPanelRows', e.target.value)}
                            className="erp-field w-[75px] h-[25px] bg-white text-center"
                          />
                        </div>
                      </fieldset>

                      <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={wp.dontFitAllColumns}
                          onChange={(e) => setWindowProp('dontFitAllColumns', e.target.checked)}
                        />
                        <span>عدم احتوى النافذة لكافة أعمدة الفاتورة</span>
                      </label>
                    </div>

                    {/* Middle Column: 7 Checkboxes (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-2.5 pt-1 pr-2">
                      {(
                        [
                          ['useTemplateNameAsTitle', 'استخدام اسم النموذج كعنوان للنافذة'],
                          ['hideTopPanel', 'عدم إظهار لوحة بيانات أعلى النافذة'],
                          ['hideBottomPanel', 'عدم إظهار لوحة بيانات أسفل النافذة'],
                          ['hideAccountsPanel', 'عدم إظهار لوحة الحسابات'],
                          ['showItemsPanelTiles', 'إظهار لوحة المواد - مربعات'],
                          ['showNumbersPadTiles', 'إظهار لوحة الأرقام - مربعات'],
                          ['showSaveButtonTiles', 'إظهار لوحة زر الحفظ - مربعات'],
                        ] as [keyof InvoiceWindowPropsConfig, string][]
                      ).map(([k, lbl]) => (
                        <label
                          key={k}
                          className="flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(wp[k])}
                            onChange={(e) => setWindowProp(k, e.target.checked)}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </div>

                    {/* Left Column: Section Filter & Row Heights (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-3 pt-1">
                      <label className="flex items-center gap-2 font-bold cursor-pointer justify-end pl-4">
                        <input
                          type="checkbox"
                          checked={wp.showDefaultSectionOnly}
                          onChange={(e) =>
                            setWindowProp('showDefaultSectionOnly', e.target.checked)
                          }
                        />
                        <span>عرض القسم الافتراضي فقط</span>
                      </label>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">ارتفاع الصف داخل الفاتورة ٢٩</span>
                        <input
                          value={wp.invoiceRowHeight}
                          onChange={(e) => setWindowProp('invoiceRowHeight', e.target.value)}
                          className="erp-field w-[65px] h-[25px] bg-white text-center"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">ارتفاع الصف في لوحة الحسابات ٢٢</span>
                        <input
                          value={wp.accountsRowHeight}
                          onChange={(e) => setWindowProp('accountsRowHeight', e.target.value)}
                          className="erp-field w-[65px] h-[25px] bg-white text-center"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">ارتفاع الصف في لوحة زر الحفظ ٦٠</span>
                        <input
                          value={wp.saveButtonRowHeight}
                          onChange={(e) => setWindowProp('saveButtonRowHeight', e.target.value)}
                          className="erp-field w-[65px] h-[25px] bg-white text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Bottom OK / Exit Buttons */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            className="erp-classic-btn focused w-[240px] h-[30px]"
          >
            موفق
          </button>
          <button type="button" onClick={onClose} className="erp-classic-btn w-[240px] h-[30px]">
            خروج
          </button>
        </div>

        {/* لائحة نتيجة البحث Modal matching Screenshot 030242 */}
        {lookup && (() => {
          const q = lookupQuery.trim().toLowerCase();
          const filteredRows = lookup.items.filter((row) => {
            if (!q) return true;
            const c = row.code.toLowerCase();
            const n = row.name.toLowerCase();
            if (lookupMatchMode === 'startsWith') return c.startsWith(q) || n.startsWith(q);
            if (lookupMatchMode === 'endsWith') return c.endsWith(q) || n.endsWith(q);
            return c.includes(q) || n.includes(q);
          });
          const pickedRow = filteredRows[lookupSelectedIdx] || filteredRows[0];
          const confirmLookupPick = (row?: LookupRow) => {
            const target = row || pickedRow;
            if (!target) {
              setLookup(null);
              return;
            }
            lookup.onPick(target.pickValue ?? target.name);
            setLookup(null);
          };
          return (
            <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center p-4">
              <div className="bg-[#f0f0f0] border border-[#666] w-[540px] h-[510px] flex flex-col shadow-2xl select-none text-[12px]">
                {/* Classic Title Bar */}
                <div className="bg-white border-b border-[#ccc] px-2.5 py-1 flex justify-between items-center h-[28px]">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 bg-gradient-to-br from-[#2b77d0] to-[#d9534f] border border-[#333]" />
                    <span className="font-bold text-[#111]">{lookup.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLookup(null)}
                    className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                  >
                    ×
                  </button>
                </div>

                {/* Top Search Options Fieldset (shown in full account lookup) */}
                {lookup.showSearchOptions !== false && (
                  <div className="px-2 pt-1.5 pb-1 bg-[#f0f0f0]">
                    <fieldset className="border border-[#c5cedb] px-4 py-1 flex items-center justify-end gap-8">
                      <legend className="px-1 font-bold text-[11px]">خيارات البحث</legend>
                      {(
                        [
                          ['startsWith', 'يبدا'],
                          ['contains', 'يحتوي'],
                          ['endsWith', 'ينتهي'],
                        ] as const
                      ).map(([mVal, lbl]) => (
                        <label
                          key={mVal}
                          className="flex items-center gap-1.5 font-bold cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="lookupSearchOpt"
                            checked={lookupMatchMode === mVal}
                            onChange={() => {
                              setLookupMatchMode(mVal);
                              setLookupSelectedIdx(0);
                            }}
                          />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>
                )}

                {/* Results Table */}
                <div className="flex-1 mx-1.5 mt-1 bg-white border border-[#8e8e8e] overflow-y-auto erp-scrollbar">
                  <table className="w-full border-collapse text-[12px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#f0f0f0] border-b border-[#bbb]">
                        <th className="w-6 border-l border-[#ccc]" />
                        <th className="py-1 px-2 border-l border-[#ccc] text-center font-bold w-[125px]">
                          الرمز
                        </th>
                        <th className="py-1 px-2 border-l border-[#ccc] text-center font-bold">
                          {lookup.secondHeader || 'اسم الحساب'}
                        </th>
                        {lookup.thirdHeader && (
                          <th className="py-1 px-2 text-center font-bold w-[135px]">
                            {lookup.thirdHeader}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={lookup.thirdHeader ? 4 : 3}
                            className="p-6 text-center text-[#666]"
                          >
                            لا توجد نتائج مطابقة
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => {
                          const isSel = idx === lookupSelectedIdx;
                          return (
                            <tr
                              key={`${row.code}-${row.name}-${idx}`}
                              onClick={() => setLookupSelectedIdx(idx)}
                              onDoubleClick={() => confirmLookupPick(row)}
                              className={`cursor-pointer border-b border-[#d9e0ea] h-[23px] ${
                                isSel ? 'bg-[#0078d7] text-white' : 'bg-white hover:bg-[#eaf3fc]'
                              }`}
                            >
                              <td className="text-center bg-[#f0f0f0] text-[#222] border-l border-[#ccc] text-[10px]">
                                {isSel ? '◀' : ''}
                              </td>
                              <td className="px-2 text-center font-bold border-l border-[#ccc]">
                                {row.code}
                              </td>
                              <td className="px-2 text-center font-bold border-l border-[#ccc]">
                                {row.name}
                              </td>
                              {lookup.thirdHeader && (
                                <td className="px-2 text-center">{row.extraCol || ''}</td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Search Box + OK / Exit */}
                <div className="p-1.5 flex items-center gap-1.5 bg-[#f0f0f0]">
                  {lookup.showSearchInput !== false && (
                    <input
                      value={lookupQuery}
                      onChange={(e) => {
                        setLookupQuery(e.target.value);
                        setLookupSelectedIdx(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          confirmLookupPick();
                        } else if (e.key === 'Escape') {
                          setLookup(null);
                        }
                      }}
                      className="erp-field w-[180px] bg-white border-[#3b91e0] text-center font-bold"
                      autoFocus
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => confirmLookupPick()}
                    className="erp-classic-btn flex-1 h-[26px]"
                  >
                    موافق
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookup(null)}
                    className="erp-classic-btn flex-1 h-[26px]"
                  >
                    خروج
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        {/* Classic Windows Color Picker Modal (Screenshots 030420 & 030435) */}
        {colorDialogTarget && (
          <div dir="ltr" className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center p-4">
            <div className="bg-[#f0f0f0] border border-[#666] w-[260px] shadow-2xl select-none text-[12px]">
              <div className="bg-white border-b border-[#ccc] px-2.5 py-1 flex justify-between items-center h-[26px]">
                <span className="font-sans text-[#111]">Color</span>
                <button
                  type="button"
                  onClick={() => setColorDialogTarget(null)}
                  className="px-1.5 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-2.5 flex flex-col gap-2">
                <div className="text-[11px] font-sans text-[#111]">Basic colors:</div>
                <div className="grid grid-cols-8 gap-1.5">
                  {BASIC_WIN_COLORS.map((hex, i) => {
                    const active = tempColor.toLowerCase() === hex.toLowerCase();
                    return (
                      <button
                        key={`${hex}-${i}`}
                        type="button"
                        onClick={() => setTempColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-[22px] h-[18px] border border-[#777] cursor-pointer ${
                          active ? 'outline outline-1 outline-dotted outline-black outline-offset-1' : ''
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="text-[11px] font-sans text-[#111] pt-1">Custom colors:</div>
                <div className="grid grid-cols-8 gap-1.5">
                  {customPaletteColors.map((hex, i) => {
                    const active = tempColor.toLowerCase() === hex.toLowerCase() && hex !== '#ffffff';
                    return (
                      <button
                        key={`cust-${i}`}
                        type="button"
                        onClick={() => setTempColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-[22px] h-[18px] border border-[#777] cursor-pointer ${
                          active ? 'outline outline-1 outline-dotted outline-black outline-offset-1' : ''
                        }`}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomColorInput((v) => !v)}
                  className="erp-classic-btn h-[23px] text-[11px] font-sans mt-1"
                >
                  Define Custom Colors &gt;&gt;
                </button>

                {showCustomColorInput && (
                  <div className="flex items-center justify-between gap-2 bg-white p-1.5 border border-[#b9c4d4]">
                    <input
                      type="color"
                      value={tempColor}
                      onChange={(e) => setTempColor(e.target.value)}
                      className="w-8 h-6 p-0 border-0 cursor-pointer"
                    />
                    <input
                      value={tempColor}
                      onChange={(e) => setTempColor(e.target.value)}
                      className="erp-field w-[85px] text-center text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCustomPaletteColors((prev) => {
                          const next = [...prev];
                          const emptyIdx = next.findIndex((c) => c === '#ffffff');
                          next[emptyIdx >= 0 ? emptyIdx : 0] = tempColor;
                          return next;
                        })
                      }
                      className="erp-classic-btn px-2 h-[22px] text-[10px]"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setWindowProp(colorDialogTarget, tempColor);
                      setColorDialogTarget(null);
                    }}
                    className="erp-classic-btn focused w-[72px] h-[23px] font-sans"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorDialogTarget(null)}
                    className="erp-classic-btn w-[72px] h-[23px] font-sans"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classic Windows Font Picker Modal (Screenshot 030453) */}
        {fontDialogOpen && (
          <div dir="ltr" className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center p-4">
            <div className="bg-[#f0f0f0] border border-[#666] w-[460px] shadow-2xl select-none text-[12px] font-sans">
              <div className="bg-white border-b border-[#ccc] px-2.5 py-1 flex justify-between items-center h-[26px]">
                <span className="text-[#111]">Font</span>
                <button
                  type="button"
                  onClick={() => setFontDialogOpen(false)}
                  className="px-1.5 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-3 flex flex-col gap-3">
                <div className="grid grid-cols-12 gap-2.5 items-start">
                  {/* Font Family */}
                  <div className="col-span-5 flex flex-col gap-1">
                    <span className="text-[11px]">Font:</span>
                    <input
                      value={tempFont.fontFamily}
                      onChange={(e) =>
                        setTempFont((f) => ({ ...f, fontFamily: e.target.value }))
                      }
                      className="erp-field bg-white text-[12px] h-[22px]"
                    />
                    <div className="bg-white border border-[#8e8e8e] h-[110px] overflow-y-scroll erp-scrollbar">
                      {FONT_FAMILIES.map((ff) => (
                        <div
                          key={ff}
                          onClick={() => setTempFont((f) => ({ ...f, fontFamily: ff }))}
                          style={{ fontFamily: ff }}
                          className={`px-1.5 py-0.5 cursor-pointer text-[12px] ${
                            tempFont.fontFamily === ff
                              ? 'bg-[#0078d7] text-white'
                              : 'hover:bg-[#eaf3fc]'
                          }`}
                        >
                          {ff}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Font Style */}
                  <div className="col-span-3 flex flex-col gap-1">
                    <span className="text-[11px]">Font style:</span>
                    <input
                      value={tempFont.fontStyle}
                      onChange={(e) =>
                        setTempFont((f) => ({
                          ...f,
                          fontStyle: e.target.value as InvoiceTableFontConfig['fontStyle'],
                        }))
                      }
                      className="erp-field bg-white text-[12px] h-[22px]"
                    />
                    <div className="bg-white border border-[#8e8e8e] h-[110px] overflow-y-auto erp-scrollbar">
                      {FONT_STYLES.map((st) => (
                        <div
                          key={st}
                          onClick={() => setTempFont((f) => ({ ...f, fontStyle: st }))}
                          className={`px-1.5 py-0.5 cursor-pointer text-[12px] ${
                            st.includes('Bold') ? 'font-bold' : ''
                          } ${st.includes('Oblique') ? 'italic' : ''} ${
                            tempFont.fontStyle === st
                              ? 'bg-[#0078d7] text-white'
                              : 'hover:bg-[#eaf3fc]'
                          }`}
                        >
                          {st}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="text-[11px]">Size:</span>
                    <input
                      type="number"
                      value={tempFont.fontSize}
                      onChange={(e) =>
                        setTempFont((f) => ({ ...f, fontSize: Number(e.target.value) || 8 }))
                      }
                      className="erp-field bg-white text-[12px] h-[22px]"
                    />
                    <div className="bg-white border border-[#8e8e8e] h-[110px] overflow-y-scroll erp-scrollbar">
                      {FONT_SIZES.map((sz) => (
                        <div
                          key={sz}
                          onClick={() => setTempFont((f) => ({ ...f, fontSize: sz }))}
                          className={`px-1.5 py-0.5 cursor-pointer text-[12px] ${
                            tempFont.fontSize === sz
                              ? 'bg-[#0078d7] text-white'
                              : 'hover:bg-[#eaf3fc]'
                          }`}
                        >
                          {sz}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OK / Cancel Buttons */}
                  <div className="col-span-2 flex flex-col gap-1.5 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setWindowProp('tableFont', tempFont);
                        setFontDialogOpen(false);
                      }}
                      className="erp-classic-btn focused h-[24px] text-[11px]"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontDialogOpen(false)}
                      className="erp-classic-btn h-[24px] text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Effects + Sample Row */}
                <div className="grid grid-cols-12 gap-2.5 items-start">
                  <fieldset className="col-span-5 border border-[#c5cedb] p-2 flex flex-col gap-1.5">
                    <legend className="px-1 text-[11px]">Effects</legend>
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFont.strikeout}
                        onChange={(e) =>
                          setTempFont((f) => ({ ...f, strikeout: e.target.checked }))
                        }
                      />
                      <span>Strikeout</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFont.underline}
                        onChange={(e) =>
                          setTempFont((f) => ({ ...f, underline: e.target.checked }))
                        }
                      />
                      <span>Underline</span>
                    </label>
                    <span className="text-[11px] pt-1">Color:</span>
                    <select
                      value={tempFont.color}
                      onChange={(e) => setTempFont((f) => ({ ...f, color: e.target.value }))}
                      className="erp-field bg-white text-[11px] h-[22px]"
                    >
                      {FONT_COLOR_OPTIONS.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </fieldset>

                  <div className="col-span-5 flex flex-col gap-2">
                    <fieldset className="border border-[#c5cedb] p-2 h-[78px] flex items-center justify-center">
                      <legend className="px-1 text-[11px]">Sample</legend>
                      <span
                        style={{
                          fontFamily: tempFont.fontFamily,
                          fontSize: `${Math.max(10, tempFont.fontSize + 3)}px`,
                          fontWeight: tempFont.fontStyle.includes('Bold') ? 'bold' : 'normal',
                          fontStyle: tempFont.fontStyle.includes('Oblique') ? 'italic' : 'normal',
                          textDecoration: [
                            tempFont.underline ? 'underline' : '',
                            tempFont.strikeout ? 'line-through' : '',
                          ]
                            .filter(Boolean)
                            .join(' '),
                          color:
                            FONT_COLOR_OPTIONS.find((c) => c.name === tempFont.color)?.hex ||
                            '#000000',
                        }}
                      >
                        AaBbYyZz
                      </span>
                    </fieldset>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px]">Script:</span>
                      <select
                        value={tempFont.script}
                        onChange={(e) =>
                          setTempFont((f) => ({
                            ...f,
                            script: e.target.value as 'Western' | 'Arabic',
                          }))
                        }
                        className="erp-field bg-white text-[11px] h-[22px]"
                      >
                        <option value="Western">Western</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};

interface InvoiceTemplatesPickerProps {
  open: boolean;
  title: string;
  zIndex: number;
  templates: InvoiceTemplateConfig[];
  selectedId: string;
  customAccounts: CustomAccountRecord[];
  costCenters: CostCenterRecord[];
  warehouses: WarehouseRecord[];
  currencies: CurrencyItem[];
  reportTemplates?: ReportTemplateItem[];
  users?: ErpUser[];
  materialGroups?: MaterialGroupRecord[];
  employees?: EmployeeRecord[];
  onFocus: () => void;
  onClose: () => void;
  onSelectTemplate: (id: string, tpl?: InvoiceTemplateConfig) => void;
  onSaveTemplates: (next: InvoiceTemplateConfig[]) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const InvoiceTemplatesPickerDialog: React.FC<InvoiceTemplatesPickerProps> = ({
  open,
  title,
  zIndex,
  templates,
  selectedId,
  customAccounts,
  costCenters,
  warehouses,
  currencies,
  reportTemplates = [],
  users = [],
  materialGroups = [],
  employees = [],
  onFocus,
  onClose,
  onSelectTemplate,
  onSaveTemplates,
  onShowMsg,
  onNotify,
}) => {
  const [pickedId, setPickedId] = useState(selectedId);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<InvoiceTemplateConfig>(
    templates[0] || createDefaultInvoiceTemplate()
  );
  const [editorIsNew, setEditorIsNew] = useState(false);

  useEffect(() => {
    if (open) {
      setPickedId(selectedId || templates[0]?.id || '');
    }
  }, [open, selectedId, templates]);

  const currentTpl = templates.find((t) => t.id === pickedId) || templates[0];

  return (
    <>
      <DraggableWindow
        open={open}
        title={title}
        width={680}
        height={400}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div className="flex-1 flex flex-col bg-[#e9edf5] p-2 gap-2 overflow-hidden select-none">
          <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f0f0f0] border-b border-[#b9c4d4]">
                  <th className="py-1.5 px-3 font-bold text-center border-l border-[#ccc]">
                    إسم النموذج
                  </th>
                  <th className="w-7 bg-[#f0f0f0]" />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const selected = t.id === pickedId;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setPickedId(t.id)}
                      onDoubleClick={() => {
                        onSelectTemplate(t.id);
                        onClose();
                      }}
                      className={`cursor-pointer border-b border-[#e5e8ee] ${
                        selected ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                      }`}
                    >
                      <td className="py-1.5 px-3 text-center font-bold border-l border-[#d5dce6]">
                        {t.name}
                      </td>
                      <td className="w-7 text-center bg-[#dfe5ee] text-[#222] text-[10px]">
                        {selected ? '◀' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                if (currentTpl) onSelectTemplate(currentTpl.id);
                onClose();
              }}
              className="erp-classic-btn focused w-[115px] h-[28px]"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTpl(createBlankInvoiceTemplate(`inv-tpl-${Date.now()}`));
                setEditorIsNew(true);
                setEditorOpen(true);
              }}
              className="erp-classic-btn w-[115px] h-[28px]"
            >
              اضافه
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentTpl) return;
                setEditingTpl(currentTpl);
                setEditorIsNew(false);
                setEditorOpen(true);
              }}
              className="erp-classic-btn w-[115px] h-[28px]"
            >
              تعديل
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!currentTpl) return;
                if (templates.length <= 1) {
                  onNotify('لا يمكن حذف النموذج الوحيد');
                  return;
                }
                const res = await onShowMsg({
                  title: 'تأكيد الحذف',
                  icon: 'question',
                  text: `هل تريد حذف النموذج «${currentTpl.name}»؟`,
                  buttons: [
                    { label: 'نعم', value: 'yes' },
                    { label: 'لا', value: 'no', focus: true },
                  ],
                });
                if (res === 'yes') {
                  const next = templates.filter((x) => x.id !== currentTpl.id);
                  onSaveTemplates(next);
                  setPickedId(next[0]?.id || '');
                  onNotify('تم حذف النموذج');
                }
              }}
              className="erp-classic-btn w-[115px] h-[28px]"
            >
              حذف
            </button>
            <button type="button" onClick={onClose} className="erp-classic-btn w-[115px] h-[28px]">
              خروج
            </button>
          </div>
        </div>
      </DraggableWindow>

      <InvoiceTemplateEditorDialog
        open={editorOpen}
        title={title}
        initialTemplate={editingTpl}
        isNew={editorIsNew}
        zIndex={zIndex + 4}
        customAccounts={customAccounts}
        costCenters={costCenters}
        warehouses={warehouses}
        currencies={currencies}
        reportTemplates={reportTemplates}
        users={users}
        materialGroups={materialGroups}
        employees={employees}
        onFocus={onFocus}
        onClose={() => setEditorOpen(false)}
        onSave={(saved, saveAsNew) => {
          let next: InvoiceTemplateConfig[];
          if (saveAsNew || !templates.some((x) => x.id === saved.id)) {
            next = [...templates, saved];
          } else {
            next = templates.map((x) => (x.id === saved.id ? saved : x));
          }
          if (saved.isDefault) {
            next = next.map((x) => ({ ...x, isDefault: x.id === saved.id }));
          }
          onSaveTemplates(next);
          setPickedId(saved.id);
          onSelectTemplate(saved.id, saved);
          onNotify(`تم حفظ النموذج: ${saved.name}`);
        }}
        onNotify={onNotify}
      />
    </>
  );
};
