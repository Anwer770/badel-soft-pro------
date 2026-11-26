import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createDefaultInvoiceTemplate } from '../data/erpDefaults';
import type {
  CostCenterRecord,
  CurrencyItem,
  DesignerSectionData,
  DesignerSectionsState,
  CustomAccountRecord,
  EmployeeRecord,
  ErpUser,
  GeneralPropsState,
  ImportedMaterialItem,
  InvoiceLineItem,
  InvoiceRecord,
  InvoiceTemplateConfig,
  MaterialGroupRecord,
  MsgConfig,
  ReportTemplateItem,
  WarehouseRecord,
} from '../types/erp';
import { DraggableWindow } from './DraggableWindow';
import { InvoiceTemplatesPickerDialog } from './InvoiceTemplateDialogs';
import { renderDesignerTokenPreview } from './HeaderFooterDesignerDialog';
import { amountToArabicWords } from '../utils/arabicNumberToWords';

const designerFontStyle = (font?: string): React.CSSProperties => {
  if (!font) return {};
  const family = (font.split(',')[0] || 'Tahoma').trim();
  const sizeMatch = font.match(/(\d+(?:\.\d+)?)\s*pt/);
  const size = sizeMatch ? `${(parseFloat(sizeMatch[1]) * 1.333).toFixed(1)}px` : '11px';
  return { fontFamily: `${family}, Tahoma, sans-serif`, fontSize: size };
};

export interface InvoicesModalLaunch {
  mode: 'editor' | 'browse' | 'profit';
  kindTitle: string;
}

interface InvoicesDialogProps {
  open: boolean;
  launch: InvoicesModalLaunch;
  zIndex: number;
  currentUser: string;
  users?: ErpUser[];
  materialGroups?: MaterialGroupRecord[];
  employees?: EmployeeRecord[];
  invoices: InvoiceRecord[];
  invoiceTemplates: InvoiceTemplateConfig[];
  importedMaterials: ImportedMaterialItem[];
  customAccounts: CustomAccountRecord[];
  costCenters: CostCenterRecord[];
  warehouses: WarehouseRecord[];
  currencies: CurrencyItem[];
  reportTemplates?: ReportTemplateItem[];
  designerSections?: DesignerSectionsState;
  companyProps?: GeneralPropsState;
  onFocus: () => void;
  onClose: () => void;
  onSaveInvoice: (inv: InvoiceRecord) => void;
  onDeleteInvoice: (id: string) => void;
  onSaveInvoiceTemplates: (next: InvoiceTemplateConfig[]) => void;
  onOpenAiInvoiceScan: () => void;
  onOpenPrint: () => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

function makeEmptyLine(idx: number): InvoiceLineItem {
  return {
    id: `line-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    code: '',
    name: '',
    unit: '',
    qty: 0,
    price: 0,
    cost: 0,
    barcode: '',
    bonus: 0,
    discPct: 0,
    discount: 0,
    expiryDate: '',
    warehouse: '',
  };
}

function makeInitialLines(): InvoiceLineItem[] {
  return Array.from({ length: 9 }, (_, i) => makeEmptyLine(i));
}

function shortWindowTitle(kindTitle: string): string {
  if (kindTitle.includes('مبيعات') && !kindTitle.includes('مردود') && !kindTitle.includes('حجز')) {
    return 'مبيعات';
  }
  if (kindTitle.includes('مشتريات') && !kindTitle.includes('مردود')) return 'مشتريات';
  if (kindTitle.includes('مردود مبيعات')) return 'مردود مبيعات';
  if (kindTitle.includes('مردود مشتريات')) return 'مردود مشتريات';
  if (kindTitle.includes('ادخال')) return 'مذكرة ادخال';
  if (kindTitle.includes('اخراج')) return 'مذكرة اخراج';
  if (kindTitle.includes('نقل')) return 'مذكرة نقل';
  if (kindTitle.includes('طلب شراء')) return 'طلب شراء';
  if (kindTitle.includes('حجز')) return 'حجز مبيعات';
  if (kindTitle.includes('عرض أسعار')) return 'عرض أسعار';
  return kindTitle;
}

const fmtAmt = (v: number): string =>
  Number.isFinite(v) ? v.toFixed(2).replace(/\.?0+$/, '') || '0' : '0';

const BAR_BTN =
  'border border-[#666] bg-[#e9edf4] hover:brightness-95 h-[28px] font-bold cursor-pointer';
const BAR_BTN_SALES =
  'border border-[#666] bg-[#dfe4f7] hover:bg-[#c9d5f3] h-[30px] font-bold cursor-pointer';

const KIND_MENU_ITEMS: { label: string; kind?: string }[] = [
  { label: 'فاتورة مشتريات', kind: 'مشتريات جديدة' },
  { label: 'فاتورة مردود مشتريات', kind: 'مردود مشتريات جديدة' },
  { label: 'فاتورة مبيعات', kind: 'مبيعات جديدة' },
  { label: 'فاتورة مردود مبيعات', kind: 'مردود مبيعات جديدة' },
  { label: 'مذكرة ادخال', kind: 'مذكرة ادخال جديدة' },
  { label: 'مذكرة اخراج', kind: 'مذكرة اخراج جديدة' },
  { label: 'طلب شراء', kind: 'طلب شراء جديد' },
  { label: 'عرض أسعار', kind: 'عرض أسعار جديد' },
  { label: 'حجز مبيعات', kind: 'حجز مبيعات جديد' },
  { label: 'نموذج مكونات مادة' },
  { label: 'المجموعة' },
  { label: 'الوكيل' },
  { label: 'الدولة' },
  { label: 'الاسم العلمي' },
  { label: 'الهيئة' },
  { label: 'القوة' },
  { label: 'النوع' },
  { label: 'العمود' },
  { label: 'الصف' },
  { label: 'العبوة' },
];

const DEFAULT_ACCOUNT_LIST = [
  'الصندوق',
  'الصندوق الرئيسي',
  'البنك الأهلي',
  'المبيعات',
  'مردودات المبيعات',
  'المشتريات',
  'مردودات المشتريات',
  'الخصم المسموح به',
  'الخصم المكتسب',
  'مصاريف النقل والشحن',
  'العملاء',
  'الموردين',
];

export const InvoicesDialog: React.FC<InvoicesDialogProps> = ({
  open,
  launch,
  zIndex,
  currentUser,
  users = [],
  materialGroups = [],
  employees = [],
  invoices,
  invoiceTemplates,
  importedMaterials,
  customAccounts,
  costCenters,
  warehouses,
  currencies,
  reportTemplates = [],
  designerSections,
  companyProps,
  onFocus,
  onClose,
  onSaveInvoice,
  onDeleteInvoice,
  onSaveInvoiceTemplates,
  onOpenAiInvoiceScan,
  onOpenPrint,
  onShowMsg,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'browse' | 'profit'>(launch.mode);
  const [kindTitle, setKindTitle] = useState(launch.kindTitle);
  const [selectedTplId, setSelectedTplId] = useState<string>(
    () =>
      invoiceTemplates.find((t) => t.isDefault)?.id ||
      invoiceTemplates[0]?.id ||
      'inv-tpl-1'
  );
  const [tplPickerOpen, setTplPickerOpen] = useState(false);
  const [kindMenuOpen, setKindMenuOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [includeBonusInCost, setIncludeBonusInCost] = useState(true);

  // Header fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invNumber, setInvNumber] = useState('1');
  const [invDate, setInvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [party, setParty] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [address, setAddress] = useState('');
  const [payType, setPayType] = useState<'نقدي' | 'آجل' | 'شيك' | 'شبكة'>('آجل');
  const [warehouse, setWarehouse] = useState(() => warehouses[0]?.name || 'مستودع 1');
  const [currency, setCurrency] = useState('ريال يمني');
  const [costCenter, setCostCenter] = useState('');

  // Grid & accounting lines
  const [items, setItems] = useState<InvoiceLineItem[]>(makeInitialLines);
  const [salesAccount, setSalesAccount] = useState('المبيعات');
  const [cashAccount, setCashAccount] = useState('الصندوق');
  const [discountAccount, setDiscountAccount] = useState('الخصم المسموح به');
  const [cashPaid, setCashPaid] = useState<string>('');
  const [networkPaid, setNetworkPaid] = useState<string>('0.00');
  const [discountVal, setDiscountVal] = useState<string>('');
  const [taxVal, setTaxVal] = useState<string>('0');
  const [expensesVal, setExpensesVal] = useState<string>('');
  const [editCount, setEditCount] = useState<number>(0);
  const [printCount, setPrintCount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [distributor, setDistributor] = useState('');

  // Sub-modals inside invoice editor
  const [lookupModal, setLookupModal] = useState<{
    title: string;
    items: { label: string; code?: string }[];
    onSelect: (label: string, code?: string) => void;
  } | null>(null);
  const [lookupFilter, setLookupFilter] = useState('');
  const [materialRowPicker, setMaterialRowPicker] = useState<number | null>(null);
  const [materialQuery, setMaterialQuery] = useState('');
  const [inlineSuggestRow, setInlineSuggestRow] = useState<number | null>(null);
  const [shortagesOpen, setShortagesOpen] = useState(false);
  const [fetchOpen, setFetchOpen] = useState(false);
  const [fetchSelectedId, setFetchSelectedId] = useState<string | null>(null);
  const [fetchAccount, setFetchAccount] = useState('');
  const [fetchNumber, setFetchNumber] = useState('');
  const [fetchName, setFetchName] = useState('');
  const [fetchPrevYear, setFetchPrevYear] = useState(false);
  const [fetchFrom, setFetchFrom] = useState(
    () => `${new Date().getFullYear()}-01-01`
  );
  const [fetchTo, setFetchTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [previewMode, setPreviewMode] = useState<'none' | 'invoice' | 'loadingOrder'>('none');
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmPrintTemplate, setConfirmPrintTemplate] = useState('نموذج طباعة ١');
  const [confirmCashPaid, setConfirmCashPaid] = useState('0.00');
  const [confirmNetworkPaid, setConfirmNetworkPaid] = useState('0.00');

  const activeTpl = useMemo(
    () =>
      invoiceTemplates.find((t) => t.id === selectedTplId) ||
      invoiceTemplates[0] ||
      createDefaultInvoiceTemplate(),
    [invoiceTemplates, selectedTplId]
  );

  const resetFormForLaunch = useCallback(
    (nextLaunch: InvoicesModalLaunch, tpl: InvoiceTemplateConfig) => {
      setEditingId(null);
      setInvNumber(String(invoices.length + 1));
      setInvDate(new Date().toISOString().slice(0, 10));
      setPayType(tpl.general.defaultPayType || 'آجل');
      setParty(tpl.general.useDefaultCustomer ? tpl.general.defaultCustomer : '');
      setPartyCode('');
      setContactName('');
      setDocNumber('');
      setAddress('');
      setWarehouse(
        tpl.general.useDefaultWarehouse
          ? warehouses.find((w) => w.code === tpl.general.defaultWarehouse)?.name ||
              tpl.general.defaultWarehouse
          : warehouses[0]?.name || 'مستودع 1'
      );
      setCurrency(tpl.general.useDefaultCurrency ? tpl.general.defaultCurrency : 'ريال يمني');
      setCostCenter(tpl.general.defaultCostCenter || '');
      setItems(makeInitialLines());
      const isPurchase = nextLaunch.kindTitle.includes('مشتريات') || nextLaunch.kindTitle.includes('شراء');
      setSalesAccount(
        isPurchase
          ? 'المشتريات'
          : tpl.salesAndExpenses.defaultSalesAccount || 'المبيعات'
      );
      setCashAccount(tpl.general.defaultCashAccount || 'الصندوق');
      setDiscountAccount(tpl.general.defaultDiscountAccount || 'الخصم المسموح به');
      setCashPaid('');
      setNetworkPaid('0.00');
      setDiscountVal('');
      setTaxVal('0');
      setExpensesVal('');
      setEditCount(0);
      setPrintCount(0);
      setNotes('');
      setDistributor('');
      setConfirmSaveOpen(false);
    },
    [invoices.length, warehouses]
  );

  useEffect(() => {
    const cls = 'print-preview-open';
    if (open && previewMode !== 'none') {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [open, previewMode]);

  useEffect(() => {
    if (open) {
      setViewMode(launch.mode);
      setKindTitle(launch.kindTitle);
      const def =
        invoiceTemplates.find((t) => t.isDefault) ||
        invoiceTemplates[0] ||
        createDefaultInvoiceTemplate();
      setSelectedTplId(def.id);
      resetFormForLaunch(launch, def);
    }
  }, [open, launch]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyTemplate = (tplId: string, tplObj?: InvoiceTemplateConfig) => {
    setSelectedTplId(tplId);
    const t = tplObj || invoiceTemplates.find((x) => x.id === tplId);
    if (!t) return;
    setPayType(t.general.defaultPayType || 'آجل');
    if (t.general.useDefaultCustomer) setParty(t.general.defaultCustomer);
    if (t.general.useDefaultCashAccount) setCashAccount(t.general.defaultCashAccount);
    if (t.general.useDefaultDiscountAccount) setDiscountAccount(t.general.defaultDiscountAccount);
    if (t.salesAndExpenses.defaultSalesAccount) {
      setSalesAccount(t.salesAndExpenses.defaultSalesAccount);
    }
    if (t.general.useDefaultCurrency) setCurrency(t.general.defaultCurrency);
    if (t.general.defaultCostCenter) setCostCenter(t.general.defaultCostCenter);
    onNotify(`تم تطبيق النموذج: ${t.name}`);
  };

  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  const subTotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const lineDiscountTotal = items.reduce((s, it) => s + (Number(it.discount) || 0), 0);
  const discountNum = (Number(discountVal) || 0) + lineDiscountTotal;
  const taxableBase = Math.max(0, subTotal - discountNum);
  const taxActive =
    activeTpl.extraTabs.taxMode !== undefined
      ? activeTpl.extraTabs.taxMode !== 'disabled'
      : activeTpl.extraTabs.enableTax;
  const computedTax = taxActive
    ? activeTpl.extraTabs.taxInclusive
      ? Number(
          (
            (taxableBase * activeTpl.extraTabs.taxPercent) /
            (100 + (activeTpl.extraTabs.taxPercent || 0))
          ).toFixed(2)
        )
      : Number(((taxableBase * activeTpl.extraTabs.taxPercent) / 100).toFixed(2))
    : Number(taxVal) || 0;
  const expensesNum = Number(expensesVal) || 0;
  const netTotal = Math.max(
    0,
    taxActive && activeTpl.extraTabs.taxInclusive
      ? taxableBase + expensesNum
      : taxableBase + computedTax + expensesNum
  );
  const designerHeader: DesignerSectionData | undefined = designerSections?.headerFirst;
  const designerFooter: DesignerSectionData | undefined = designerSections?.footerLast;
  const hasDesignerHeader = (designerHeader?.rows.length ?? 0) > 0;
  const hasDesignerFooter = (designerFooter?.rows.length ?? 0) > 0;
  const designerTokens: Record<string, string> = {
    '[اسم العميل]': party.trim() || 'عميل نقدي',
    '[الاسم]': party.trim() || 'عميل نقدي',
    '[المستودع]': warehouse || '',
    '[رقم الفاتورة]': invNumber,
    '[نوع الفاتورة]': shortWindowTitle(kindTitle),
    '[نوع الدفع]': payType,
    '[التاريخ]': invDate,
    '[العملة]': currency,
    '[الإجمالي]': Math.max(0, subTotal - lineDiscountTotal).toFixed(0),
    '[المجموع]': subTotal.toFixed(0),
    '[الصافي]': netTotal.toFixed(2),
    '[الصافي رقما وكتابة]': `${netTotal.toFixed(2)} ${amountToArabicWords(netTotal, currency)}`,
    '[إجمالي الكمية]': totalQty.toFixed(0),
    '[البيان]':
      notes?.trim() || `فاتورة ${shortWindowTitle(kindTitle)} برقم ${invNumber}`,
    '[إسم الشركة]': companyProps?.hdrArName || companyProps?.company || 'بديل سوفت',
  };
  const isSalesDoc = shortWindowTitle(kindTitle).includes('مبيعات');
  const showBarcodeCol = activeTpl.columns.showBarcode && isSalesDoc;
  const showCodeCol = !activeTpl.extraTabs.hideItemCode && !isSalesDoc;
  const showLineWarehouseCol = isSalesDoc;
  const stampText = (() => {
    const d = new Date();
    const p2 = (n: number) => String(n).padStart(2, '0');
    return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(
      d.getHours()
    )}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  })();
  const effectiveCashPaid =
    payType === 'نقدي' || activeTpl.general.cashEqualsNet
      ? cashPaid !== ''
        ? Number(cashPaid) || 0
        : netTotal
      : Number(cashPaid) || 0;
  const totalProfit = items.reduce(
    (s, it) => s + (Number(it.qty) || 0) * ((Number(it.price) || 0) - (Number(it.cost) || 0)),
    0
  );
  const customerPrevBalance = useMemo(() => {
    if (!party.trim()) return 0;
    return invoices
      .filter((inv) => inv.party === party.trim() && inv.id !== editingId)
      .reduce((s, inv) => s + ((inv.netTotal ?? inv.total) - (inv.cashPaid || 0) - (inv.networkPaid || 0)), 0);
  }, [invoices, party, editingId]);
  const currencyRate =
    currencies.find((c) => c.name === currency)?.rate ?? 1;
  const invoicePrintTemplateChoices = useMemo(() => {
    const invReports = reportTemplates
      .filter((r) => !r.reportType || r.reportType === 'فاتورة')
      .map((r) => r.name);
    const baseList = [
      activeTpl.printProps?.printTemplate || '',
      ...invReports,
      'نموذج طباعة ١',
    ].filter(Boolean);
    return Array.from(new Set(baseList));
  }, [reportTemplates, activeTpl.printProps?.printTemplate]);

  const allAccountChoices = useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_ACCOUNT_LIST.forEach((n, idx) => map.set(n, String(100 + idx)));
    customAccounts
      .filter((a) => a.kind === 'leaf')
      .forEach((a) => map.set(a.name, a.code));
    return Array.from(map.entries()).map(([label, code]) => ({ label, code }));
  }, [customAccounts]);

  const shortagesList = useMemo(
    () =>
      importedMaterials.filter((m) => {
        const q = Number(m.qty || '0');
        const min = Number(m.minLimit || '0');
        return q <= min;
      }),
    [importedMaterials]
  );

  const fetchInvoices = useMemo(() => {
    const year = new Date().getFullYear();
    const from = fetchPrevYear ? `${year - 1}-01-01` : fetchFrom;
    const returnsSales = kindTitle.includes('مردود مبيعات');
    const returnsPurchase = kindTitle.includes('مردود مشتريات');
    const salesOnly = !returnsSales && !returnsPurchase && kindTitle.includes('مبيعات');
    const purchaseOnly = !returnsSales && !returnsPurchase && kindTitle.includes('مشتريات');
    return invoices
      .filter((inv) => {
        if (returnsSales && !(inv.kind.includes('مردود') && inv.kind.includes('مبيعات'))) {
          return false;
        }
        if (returnsPurchase && !(inv.kind.includes('مردود') && inv.kind.includes('مشتريات'))) {
          return false;
        }
        if (salesOnly && (!inv.kind.includes('مبيعات') || inv.kind.includes('مردود'))) {
          return false;
        }
        if (purchaseOnly && (!inv.kind.includes('مشتريات') || inv.kind.includes('مردود'))) {
          return false;
        }
        if (from && inv.date < from) return false;
        if (fetchTo && inv.date > fetchTo) return false;
        if (
          fetchAccount.trim() &&
          !inv.party.toLowerCase().includes(fetchAccount.trim().toLowerCase())
        ) {
          return false;
        }
        if (fetchNumber.trim() && !inv.number.includes(fetchNumber.trim())) return false;
        if (fetchName.trim()) {
          const hay = `${inv.contactName || ''} ${inv.distributor || ''} ${inv.party}`.toLowerCase();
          if (!hay.includes(fetchName.trim().toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [
    invoices,
    kindTitle,
    fetchPrevYear,
    fetchFrom,
    fetchTo,
    fetchAccount,
    fetchNumber,
    fetchName,
  ]);

  useEffect(() => {
    if (!fetchOpen) return;
    if (!fetchInvoices.some((inv) => inv.id === fetchSelectedId)) {
      setFetchSelectedId(fetchInvoices[0]?.id ?? null);
    }
  }, [fetchOpen, fetchInvoices, fetchSelectedId]);

  const updateLine = (idx: number, field: keyof InvoiceLineItem, val: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[idx], [field]: val };
      if (field === 'discPct') {
        const gross = (Number(current.qty) || 0) * (Number(current.price) || 0);
        current.discount = Number(((gross * (Number(val) || 0)) / 100).toFixed(2));
      } else if (field === 'discount') {
        const gross = (Number(current.qty) || 0) * (Number(current.price) || 0);
        current.discPct = gross > 0 ? Number((((Number(val) || 0) / gross) * 100).toFixed(2)) : 0;
      } else if ((field === 'qty' || field === 'price') && (Number(current.discPct) || 0) > 0) {
        const gross = (Number(current.qty) || 0) * (Number(current.price) || 0);
        current.discount = Number(((gross * (Number(current.discPct) || 0)) / 100).toFixed(2));
      }
      if ((field === 'code' || field === 'barcode') && typeof val === 'string' && val.trim()) {
        const trimmed = val.trim();
        const sp = activeTpl.scaleProps;
        if (
          sp?.isScaleItem &&
          sp.scaleItemPrefix &&
          trimmed.startsWith(sp.scaleItemPrefix)
        ) {
          const codeLen = Number(sp.itemCodeDigits) || 5;
          const valLen = Number(sp.priceOrQtyDigits) || 5;
          const decLen = Number(sp.priceDecimalDigits) || 2;
          const pLen = sp.scaleItemPrefix.length;
          const itemCodePart = trimmed.slice(pLen, pLen + codeLen);
          const rawNumStr = trimmed.slice(pLen + codeLen, pLen + codeLen + valLen);
          const scaleMatch = importedMaterials.find(
            (m) => m.code === itemCodePart || m.barcode === itemCodePart
          );
          if (scaleMatch) {
            const parsedNum = (Number(rawNumStr) || 0) / Math.pow(10, decLen);
            current.code = scaleMatch.code;
            current.barcode = scaleMatch.barcode || trimmed;
            current.name = scaleMatch.name;
            current.unit = scaleMatch.mainUnit || 'كغ';
            current.expiryDate = scaleMatch.expiryDate || '';
            current.cost = Number(scaleMatch.purchasePrice || '0');
            if (sp.valueMode === 'price') {
              current.price = parsedNum || current.cost;
              current.qty = sp.fixQtyToOne ? 1 : current.qty || 1;
            } else {
              current.qty = sp.fixQtyToOne ? 1 : parsedNum || 1;
              current.price = current.cost || current.price;
            }
          }
        } else {
          const match = importedMaterials.find(
            (m) => m.code === trimmed || m.barcode === trimmed
          );
          if (match) {
            current.code = match.code;
            current.barcode = match.barcode || '';
            current.name = match.name;
            current.unit = match.mainUnit || 'حبة';
            current.expiryDate = match.expiryDate || '';
            current.qty = current.qty || 1;
            current.cost = Number(match.purchasePrice || '0');
            current.price = Number(match.purchasePrice || '0') || current.price;
          }
        }
        if (!current.warehouse) current.warehouse = warehouse;
      }
      next[idx] = current;
      return next;
    });
  };

  const matchesMaterialQuery = useCallback(
    (m: ImportedMaterialItem, rawQ: string): boolean => {
      const q = rawQ.trim().toLowerCase();
      if (!q) return true;
      const mode = activeTpl.extraTabs.searchMatchMode || 'contains';
      const checkField = (val: string | undefined) => {
        if (!val) return false;
        const v = val.toLowerCase();
        if (mode === 'startsWith') return v.startsWith(q);
        if (mode === 'equals') return v === q;
        return v.includes(q);
      };
      const byCode = activeTpl.extraTabs.searchByCode && checkField(m.code);
      const byName = activeTpl.extraTabs.searchByName && checkField(m.name);
      const byForeign =
        Boolean(activeTpl.extraTabs.searchByForeignName) && checkField(m.foreignName);
      const byBarcode = activeTpl.extraTabs.searchByBarcode && checkField(m.barcode);
      return byCode || byName || byForeign || byBarcode;
    },
    [activeTpl.extraTabs]
  );

  const assignMaterialToRow = (idx: number, m: ImportedMaterialItem) => {
    if (
      activeTpl.additional.warnDuplicateItem &&
      items.some((it, i) => i !== idx && it.name === m.name && m.name)
    ) {
      onNotify(`تنبيه: المادة «${m.name}» مكررة في الفاتورة`);
    }
    const basePrice = Number(m.purchasePrice || '0');
    const offsetPct = Number(activeTpl.extraTabs.pricePercentOffset || 0);
    const adjustedPrice = offsetPct
      ? Number((basePrice * (1 + offsetPct / 100)).toFixed(2))
      : basePrice;
    setItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        code: m.code,
        barcode: m.barcode || '',
        expiryDate: m.expiryDate || '',
        name: m.name,
        unit: m.mainUnit || 'حبة',
        qty: next[idx].qty > 0 ? next[idx].qty : 1,
        cost: basePrice,
        price: adjustedPrice,
        warehouse: next[idx].warehouse || m.warehouse || warehouse,
      };
      return next;
    });
    setMaterialRowPicker(null);
  };

  const confirmAndPersistSave = useCallback(
    async (forcePrint: boolean, cashOverride?: string, netOverride?: string, printTplOverride?: string) => {
      const validItems = items.filter((it) => it.name.trim() || it.code.trim() || it.price > 0);
      if (!validItems.length) {
        onNotify('أضف مادة واحدة على الأقل قبل الحفظ');
        return;
      }
      const cashFinal = cashOverride !== undefined ? Number(cashOverride) || 0 : effectiveCashPaid;
      const netFinal = netOverride !== undefined ? Number(netOverride) || 0 : Number(networkPaid) || 0;
      const chosenPrintTpl =
        printTplOverride || confirmPrintTemplate || activeTpl.printProps?.printTemplate || 'نموذج طباعة ١';

      const record: InvoiceRecord = {
        id: editingId || `inv-${Date.now()}`,
        kind: kindTitle,
        number: invNumber || String(invoices.length + 1),
        date: invDate,
        party: party.trim() || (payType === 'نقدي' ? 'عميل نقدي' : 'عميل آجل'),
        accountCode: partyCode,
        contactName,
        payType,
        docNumber,
        address,
        warehouse,
        distributor,
        costCenter,
        discount: discountNum,
        tax: computedTax,
        expenses: expensesNum,
        netTotal,
        cashPaid: cashFinal,
        networkPaid: netFinal,
        printTemplateName: chosenPrintTpl,
        editCount: editingId ? editCount + 1 : editCount,
        printCount: forcePrint ? printCount + 1 : printCount,
        templateId: activeTpl.id,
        currency,
        notes,
        items: validItems.map((it) => ({
          ...it,
          warehouse: it.warehouse || warehouse,
        })),
        total: netTotal,
        profit: totalProfit - discountNum,
        by: currentUser,
      };
      onSaveInvoice(record);
      setConfirmSaveOpen(false);
      onNotify(`تم حفظ ${shortWindowTitle(kindTitle)} رقم ${record.number}`);
      const printMode = activeTpl.printProps?.printOnSaveMode || 'none';
      if (forcePrint || printMode === 'auto' || activeTpl.extraTabs.autoPrintOnSave) {
        window.print();
      } else if (printMode === 'prompt') {
        const wantPrint = await onShowMsg({
          title: 'طباعة الفاتورة',
          icon: 'question',
          text: `تم حفظ الفاتورة رقم ${record.number}. هل تريد طباعتها الآن؟`,
          buttons: [
            { label: 'نعم', value: 'yes', focus: true },
            { label: 'لا', value: 'no' },
          ],
        });
        if (wantPrint === 'yes') {
          window.print();
        }
      }
      resetFormForLaunch(launch, activeTpl);
    },
    [
      items,
      activeTpl,
      kindTitle,
      invNumber,
      editingId,
      invoices.length,
      invDate,
      party,
      payType,
      partyCode,
      docNumber,
      address,
      warehouse,
      distributor,
      costCenter,
      discountNum,
      computedTax,
      expensesNum,
      netTotal,
      effectiveCashPaid,
      networkPaid,
      confirmPrintTemplate,
      editCount,
      printCount,
      currency,
      notes,
      totalProfit,
      currentUser,
      onSaveInvoice,
      onNotify,
      onShowMsg,
      resetFormForLaunch,
      launch,
    ]
  );

  const handleSave = useCallback(async () => {
    const validItems = items.filter((it) => it.name.trim() || it.code.trim() || it.price > 0);
    if (!validItems.length) {
      onNotify('أضف مادة واحدة على الأقل قبل الحفظ');
      return;
    }
    if (activeTpl.additional.requireRef && !docNumber.trim()) {
      onNotify('يرجى إدخال رقم المستند / المرجع');
      return;
    }
    setConfirmPrintTemplate(
      activeTpl.printProps?.printTemplate || invoicePrintTemplateChoices[0] || 'نموذج طباعة ١'
    );
    setConfirmCashPaid(effectiveCashPaid.toFixed(2));
    setConfirmNetworkPaid(Number(networkPaid || 0).toFixed(2));
    setConfirmSaveOpen(true);
  }, [
    items,
    activeTpl,
    docNumber,
    invoicePrintTemplateChoices,
    effectiveCashPaid,
    networkPaid,
    onNotify,
  ]);

  // F2 / F3 shortcuts inside invoice editor & Confirm Save modal
  useEffect(() => {
    if (!open || viewMode !== 'editor' || tplPickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (confirmSaveOpen) {
        if (e.key === 'F2' || e.key === 'Enter') {
          e.preventDefault();
          void confirmAndPersistSave(false, confirmCashPaid, confirmNetworkPaid, confirmPrintTemplate);
        } else if (e.key === 'F3') {
          e.preventDefault();
          void confirmAndPersistSave(true, confirmCashPaid, confirmNetworkPaid, confirmPrintTemplate);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setConfirmSaveOpen(false);
        }
        return;
      }
      if (e.key === 'F2' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    open,
    viewMode,
    tplPickerOpen,
    confirmSaveOpen,
    confirmCashPaid,
    confirmNetworkPaid,
    confirmPrintTemplate,
    handleSave,
    confirmAndPersistSave,
  ]);

  const openFetchDialog = () => {
    setFetchAccount('');
    setFetchNumber('');
    setFetchName('');
    setFetchPrevYear(false);
    setFetchFrom(`${new Date().getFullYear()}-01-01`);
    setFetchTo(new Date().toISOString().slice(0, 10));
    setFetchSelectedId(null);
    setFetchOpen(true);
  };

  const requestDelete = async () => {
    if (editingId) {
      const res = await onShowMsg({
        title: 'حذف الفاتورة',
        icon: 'question',
        text: `هل تريد حذف الفاتورة رقم ${invNumber}؟`,
        buttons: [
          { label: 'نعم', value: 'yes' },
          { label: 'لا', value: 'no', focus: true },
        ],
      });
      if (res === 'yes') {
        onDeleteInvoice(editingId);
        resetFormForLaunch(launch, activeTpl);
        onNotify('تم حذف الفاتورة');
      }
    } else {
      resetFormForLaunch(launch, activeTpl);
      onNotify('تم تفريغ الحقول');
    }
  };

  const loadFromFetch = (inv: InvoiceRecord) => {
    const cloned = inv.items.map((x, idx) => ({ ...x, id: `fetch-${Date.now()}-${idx}` }));
    while (cloned.length < 9) cloned.push(makeEmptyLine(cloned.length));
    setItems(cloned);
    setParty(inv.party);
    setPartyCode(inv.accountCode || '');
    setContactName(inv.contactName || '');
    setPayType(inv.payType || 'آجل');
    setWarehouse(inv.warehouse || warehouses[0]?.name || 'مستودع 1');
    setCurrency(inv.currency || currency);
    setDocNumber(inv.docNumber || '');
    setAddress(inv.address || '');
    setDistributor(inv.distributor || '');
    setNotes(inv.notes || '');
    setFetchOpen(false);
    onNotify(`تم جلب أصناف ${inv.kind} رقم ${inv.number}`);
  };

  const loadForEdit = (inv: InvoiceRecord) => {
    setEditingId(inv.id);
    setKindTitle(inv.kind);
    setInvNumber(inv.number);
    setInvDate(inv.date);
    setParty(inv.party);
    setPartyCode(inv.accountCode || '');
    setContactName(inv.contactName || '');
    setPayType(inv.payType || 'آجل');
    setDocNumber(inv.docNumber || '');
    setAddress(inv.address || '');
    setWarehouse(inv.warehouse || warehouses[0]?.name || 'مستودع 1');
    setDistributor(inv.distributor || '');
    setCostCenter(inv.costCenter || '');
    setDiscountVal(inv.discount ? String(inv.discount) : '');
    setTaxVal(inv.tax !== undefined ? String(inv.tax) : '0');
    setExpensesVal(inv.expenses ? String(inv.expenses) : '');
    setCashPaid(inv.cashPaid ? String(inv.cashPaid) : '');
    setNetworkPaid(inv.networkPaid ? String(inv.networkPaid) : '0.00');
    setEditCount(inv.editCount || 0);
    setPrintCount(inv.printCount || 0);
    setCurrency(inv.currency);
    setNotes(inv.notes);
    const padded = [...inv.items];
    while (padded.length < 9) padded.push(makeEmptyLine(padded.length));
    setItems(padded);
    setViewMode('editor');
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const profitSource = kindTitle.includes('اليوم')
    ? invoices.filter((i) => i.date === todayStr)
    : invoices;

  const wp = activeTpl.windowProps;
  const baseTitle = wp?.useTemplateNameAsTitle
    ? activeTpl.name
    : viewMode === 'editor'
      ? shortWindowTitle(kindTitle)
      : kindTitle;
  const winTitle = wp?.windowCaptionText?.trim()
    ? `${baseTitle} - ${wp.windowCaptionText.trim()}`
    : baseTitle;

  const labelTypeAccount =
    kindTitle.includes('مشتريات') || kindTitle.includes('شراء') ? 'ح/مشتريات' : `ح/${shortWindowTitle(kindTitle)}`;
  const fetchWindowTitle = kindTitle.includes('مردود مبيعات')
    ? 'فواتير مردود المبيعات'
    : kindTitle.includes('مردود مشتريات')
      ? 'فواتير مردود المشتريات'
      : kindTitle.includes('مشتريات')
        ? 'فواتير المشتريات'
        : kindTitle.includes('مبيعات')
          ? 'فواتير المبيعات'
          : `فواتير ${shortWindowTitle(kindTitle)}`;

  return (
    <>
      <DraggableWindow
        open={open}
        title={winTitle}
        width={wp?.maximizeWindow ? 1280 : 1180}
        height={wp?.maximizeWindow ? 730 : 670}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div
          style={{ backgroundColor: wp?.windowBgColor || '#efefef' }}
          className="flex-1 flex flex-col overflow-hidden select-none text-[12px]"
        >
          {/* Subtle Switcher Bar only when not purely viewing or for fast switching */}
          <div className="flex items-center justify-between px-2 py-1 bg-[#e5e9f0] border-b border-[#c5ccd8]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-0.5 text-[11px] font-bold border border-[#9aa7b8] cursor-pointer ${
                  viewMode === 'editor' ? 'bg-white text-[#005499]' : 'bg-[#eceff5]'
                }`}
              >
                {shortWindowTitle(kindTitle)}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('browse')}
                className={`px-2.5 py-0.5 text-[11px] font-bold border border-[#9aa7b8] cursor-pointer ${
                  viewMode === 'browse' ? 'bg-white text-[#005499]' : 'bg-[#eceff5]'
                }`}
              >
                استعراض وتعديل ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('profit')}
                className={`px-2.5 py-0.5 text-[11px] font-bold border border-[#9aa7b8] cursor-pointer ${
                  viewMode === 'profit' ? 'bg-white text-[#005499]' : 'bg-[#eceff5]'
                }`}
              >
                تقرير الأرباح
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#445]">
              <span>النموذج: <b>{activeTpl.name}</b></span>
              {activeTpl.general.useDefaultCurrency && <span>العملة: <b>{currency}</b></span>}
            </div>
          </div>

          {viewMode === 'editor' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top WinForms Header Band matching Screenshots 041758 / 042024 */}
              {!wp?.hideTopPanel && (
              <div className="bg-[#f0f0f0] border-b border-[#b9c4d4] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[660px]">
                  {/* Row 1: الحساب + بحث + الرصيد/الكود + نوع الفاتورة + العملة */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold w-[46px] text-right">الحساب</span>
                    <input
                      value={party}
                      readOnly={Boolean(activeTpl.printProps?.lockAccountInCash && payType === 'نقدي')}
                      onChange={(e) => setParty(e.target.value)}
                      className="erp-field w-[220px] bg-white border-[#3b91e0]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLookupFilter('');
                        setLookupModal({
                          title: 'اختيار الحساب / العميل',
                          items: allAccountChoices,
                          onSelect: (label, code) => {
                            setParty(label);
                            setPartyCode(code || '');
                          },
                        });
                      }}
                      className="erp-classic-btn px-2.5 h-[24px]"
                    >
                      بحث
                    </button>
                    <input
                      value={
                        activeTpl.general.showPrevBalance && customerPrevBalance !== 0
                          ? `مدين ${customerPrevBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : partyCode
                      }
                      onChange={(e) => setPartyCode(e.target.value)}
                      className="erp-field w-[135px] bg-[#eaeaea] text-center font-bold"
                    />
                    {isSalesDoc && (
                      <label className="flex items-center gap-1 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payType === 'شبكة'}
                          onChange={(e) => setPayType(e.target.checked ? 'شبكة' : 'آجل')}
                        />
                        <span>شبكة</span>
                      </label>
                    )}
                    <fieldset className="border border-[#c5ccd8] px-2 pb-1 pt-0.5 flex items-center gap-1">
                      <legend className="text-[11px] font-bold px-1">نوع الفاتورة</legend>
                      <select
                        value={payType}
                        onChange={(e) =>
                          setPayType(e.target.value as 'نقدي' | 'آجل' | 'شيك' | 'شبكة')
                        }
                        className="erp-field w-[84px] bg-white font-bold text-center"
                      >
                        <option value="آجل">آجل</option>
                        <option value="نقدي">نقدي</option>
                        {activeTpl.general.showExtraPayType && <option value="شيك">شيك</option>}
                        <option value="شبكة">شبكة</option>
                      </select>
                    </fieldset>
                    <span className="font-bold">العملة</span>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="erp-field w-[92px] bg-white font-bold text-center"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      readOnly
                      value={currencyRate}
                      className="erp-field w-[46px] bg-[#eaeaea] text-center font-bold"
                    />
                  </div>

                  {/* Row 2: الرقم + التاريخ + الاسم + بحث + لمستند + العنوان */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold w-[46px] text-right">الرقم</span>
                    <input
                      value={invNumber}
                      readOnly={activeTpl.additional.lockInvoiceNumber}
                      onChange={(e) => setInvNumber(e.target.value)}
                      className="erp-field w-[78px] bg-[#eaeaea] text-center font-bold"
                    />
                    <span className="font-bold">التاريخ</span>
                    <input
                      type="date"
                      value={invDate}
                      readOnly={activeTpl.additional.lockDate}
                      onChange={(e) => setInvDate(e.target.value)}
                      className="erp-field w-[124px] bg-white text-center"
                      dir="ltr"
                    />
                    {activeTpl.general.showName && (
                      <>
                        <span className="font-bold">الاسم</span>
                        <input
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="erp-field w-[135px] bg-white"
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setLookupFilter('');
                        setLookupModal({
                          title: 'بحث الاسم / المندوب',
                          items: allAccountChoices,
                          onSelect: (label) => setContactName(label),
                        });
                      }}
                      className="erp-classic-btn px-2.5 h-[24px]"
                    >
                      بحث
                    </button>
                    {activeTpl.general.showDoc && (
                      <>
                        <span className="font-bold">لمستند</span>
                        <input
                          value={docNumber}
                          onChange={(e) => setDocNumber(e.target.value)}
                          className="erp-field w-[78px] bg-white text-center"
                        />
                      </>
                    )}
                    {activeTpl.general.showAddress && (
                      <>
                        <span className="font-bold">العنوان</span>
                        <input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="erp-field flex-1 min-w-[140px] bg-white"
                        />
                      </>
                    )}
                  </div>

                  {/* Row 3: المستودع + الرصيد السابق + مركز الكلفة */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">المستودع</span>
                      <select
                        disabled={activeTpl.additional.lockWarehouse}
                        value={warehouse}
                        onChange={(e) => setWarehouse(e.target.value)}
                        className="erp-field w-[160px] bg-white text-center"
                      >
                        <option value="مستودع 1">مستودع ١</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.name}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {activeTpl.general.showPrevBalance && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">الرصيد السابق</span>
                        <input
                          readOnly
                          value={
                            customerPrevBalance
                              ? customerPrevBalance.toFixed(2)
                              : ''
                          }
                          className="erp-field w-[125px] bg-[#eaeaea] text-center font-bold"
                        />
                      </div>
                    )}
                    {activeTpl.additional.showCostCenters && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">مركز الكلفة</span>
                        <select
                          value={costCenter}
                          onChange={(e) => setCostCenter(e.target.value)}
                          className="erp-field w-[140px] bg-white"
                        >
                          <option value="">--</option>
                          {costCenters.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {!isSalesDoc && (
                      <>
                        <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeBonusInCost}
                            onChange={(e) => setIncludeBonusInCost(e.target.checked)}
                          />
                          <span>احتساب البونص في سعر التكلفة</span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            onNotify(
                              `ربط المواد بالمورد: ${
                                party.trim() || 'لم يتم اختيار مورد بعد'
                              }`
                            )
                          }
                          className="erp-classic-btn px-3 h-[24px] text-[11px]"
                        >
                          ربط المواد بالمورد
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Left side of Header: نواقص المواد */}
                <div className="flex items-center justify-end pl-4">
                  <button
                    type="button"
                    onClick={() => setShortagesOpen(true)}
                    className="erp-classic-btn w-[140px] h-[42px] text-[13px] font-extrabold tracking-wide"
                  >
                    نواقص المـــــواد
                  </button>
                </div>
              </div>
              )}

              {/* Main Items Grid (Exact RTL column sequence from Screenshot 024310) */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white border-b border-[#8e8e8e]">
                <div className="flex-1 overflow-auto erp-scrollbar">
                  <table
                    style={
                      wp?.tableFont
                        ? {
                            fontFamily: wp.tableFont.fontFamily,
                            fontSize: `${Math.max(11, wp.tableFont.fontSize + 2)}px`,
                            fontWeight: wp.tableFont.fontStyle.includes('Bold') ? 'bold' : 'normal',
                            fontStyle: wp.tableFont.fontStyle.includes('Oblique')
                              ? 'italic'
                              : 'normal',
                          }
                        : undefined
                    }
                    className="w-full border-collapse text-[12px]"
                  >
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#b6b8f2] border-b border-[#444]">
                        {(() => {
                          const colLabel = (id: string, fallback: string) => {
                            const found = activeTpl.tableColumns?.find((c) => c.id === id);
                            return (found?.altName || '').trim() || fallback;
                          };
                          return (
                            <>
                              <th className="py-1 px-1.5 border-l border-[#666] w-[36px]">
                                {colLabel('del', 'حذف')}
                              </th>
                              {showBarcodeCol && (
                                <th className="py-1 px-2 border-l border-[#666] w-[92px]">
                                  {colLabel('barcode', 'الباركود')}
                                </th>
                              )}
                              {showCodeCol && (
                                <th className="py-1 px-2 border-l border-[#666] w-[75px]">
                                  {colLabel('code', 'الرمز')}
                                </th>
                              )}
                              <th className="py-1 px-2 border-l border-[#666]">
                                {colLabel('item', 'المادة')}
                              </th>
                              {showLineWarehouseCol && (
                                <th className="py-1 px-2 border-l border-[#666] w-[82px]">
                                  {colLabel('warehouse', 'مستود')}
                                </th>
                              )}
                              {!activeTpl.columns.hideQty && (
                                <th className="py-1 px-2 border-l border-[#666] w-[78px]">
                                  {colLabel('qty', 'الكمية')}
                                </th>
                              )}
                              {activeTpl.columns.showUnit && (
                                <th className="py-1 px-2 border-l border-[#666] w-[78px]">
                                  {colLabel('unit', 'الوحدة')}
                                </th>
                              )}
                              {activeTpl.columns.showBonus && (
                                <th className="py-1 px-2 border-l border-[#666] w-[66px]">
                                  {colLabel('bonus', 'البونص')}
                                </th>
                              )}
                              <th className="py-1 px-2 border-l border-[#666] w-[88px]">
                                {colLabel('price', 'السعر')}
                              </th>
                              {!activeTpl.columns.hideTotal && (
                                <th className="py-1 px-2 border-l border-[#666] w-[110px]">
                                  {colLabel('total', 'الإجمالي')}
                                </th>
                              )}
                              {activeTpl.discountsAndCommissions.showDiscountPercent && (
                                <th className="py-1 px-1.5 border-l border-[#666] w-[62px]">
                                  {colLabel('discPct', 'ن الخصم')}
                                </th>
                              )}
                              {activeTpl.discountsAndCommissions.showDiscountAmount && (
                                <th className="py-1 px-2 border-l border-[#666] w-[72px]">
                                  {colLabel('discount', 'الخصم')}
                                </th>
                              )}
                              {activeTpl.columns.showExpiry && (
                                <th className="py-1 px-2 border-l border-[#666] w-[95px]">
                                  {colLabel('expiryDate', 'تاريخ الصلاحية')}
                                </th>
                              )}
                              <th className="py-1 px-1.5 w-[52px] bg-[#eceef4] border-r border-[#888]">
                                م
                              </th>
                            </>
                          );
                        })()}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const isEven = idx % 2 === 1;
                        const rowBg =
                          activeTpl.extraTabs.zebraRows && isEven ? 'bg-[#f8f9ca]' : 'bg-white';
                        const rowTotal = Math.max(
                          0,
                          (Number(it.qty) || 0) * (Number(it.price) || 0) - (Number(it.discount) || 0)
                        );
                        const inlineMatches =
                          inlineSuggestRow === idx && it.name.trim().length > 0
                            ? importedMaterials.filter((m) => matchesMaterialQuery(m, it.name))
                            : [];
                        return (
                          <tr key={it.id} className={`${rowBg} border-b border-[#bbb] h-[25px]`}>
                            <td className="p-0 border-l border-[#bbb] text-center bg-[#dfe2e8]">
                              <button
                                type="button"
                                title="حذف السطر"
                                onClick={() =>
                                  setItems((prev) => {
                                    const next = prev.filter((_, i) => i !== idx);
                                    while (next.length < 9) next.push(makeEmptyLine(next.length));
                                    return next;
                                  })
                                }
                                className="w-5 h-5 border border-[#888] bg-[#e6e8ec] text-[#700] font-bold text-[11px] leading-none cursor-pointer"
                              >
                                ×
                              </button>
                            </td>
                            {showBarcodeCol && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  value={it.barcode || ''}
                                  onChange={(e) => updateLine(idx, 'barcode', e.target.value)}
                                  className="w-full h-[24px] px-1 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            {showCodeCol && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  value={it.code}
                                  onChange={(e) => updateLine(idx, 'code', e.target.value)}
                                  className="w-full h-[24px] px-1.5 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            <td className="p-0 border-l border-[#bbb] relative">
                              <div className="flex items-center">
                                <input
                                  value={it.name}
                                  onFocus={() => setInlineSuggestRow(idx)}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setInlineSuggestRow((cur) => (cur === idx ? null : cur));
                                    }, 160);
                                  }}
                                  onChange={(e) => {
                                    updateLine(idx, 'name', e.target.value);
                                    setInlineSuggestRow(idx);
                                  }}
                                  onDoubleClick={() => {
                                    setMaterialQuery('');
                                    setMaterialRowPicker(idx);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'F4') {
                                      e.preventDefault();
                                      setMaterialQuery('');
                                      setMaterialRowPicker(idx);
                                    } else if (e.key === 'Escape') {
                                      setInlineSuggestRow(null);
                                    } else if (e.key === 'Enter' && inlineMatches.length > 0) {
                                      e.preventDefault();
                                      assignMaterialToRow(idx, inlineMatches[0]);
                                      setInlineSuggestRow(null);
                                    }
                                  }}
                                  placeholder=""
                                  className="w-full h-[24px] px-2 bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMaterialQuery('');
                                    setMaterialRowPicker(idx);
                                  }}
                                  title="اختيار مادة"
                                  className="px-1.5 text-[10px] text-[#335] hover:bg-[#dce6f4] h-[22px] cursor-pointer"
                                >
                                  ▾
                                </button>
                              </div>

                              {/* Inline Multi-Column Material Dropdown matching Screenshot 024610 */}
                              {inlineSuggestRow === idx && it.name.trim().length > 0 && (
                                <div className="absolute right-0 top-[25px] z-30 w-[620px] max-h-[210px] bg-[#efefef] border border-[#666] shadow-lg overflow-auto erp-scrollbar">
                                  <table className="w-full border-collapse text-[11px]">
                                    <thead className="sticky top-0 bg-[#f6f6f6] border-b border-[#bbb]">
                                      <tr>
                                        <th className="py-1 px-2 border-l border-[#ccc] w-[70px]">الرمز</th>
                                        <th className="py-1 px-2 border-l border-[#ccc]">اسم المادة</th>
                                        <th className="py-1 px-2 border-l border-[#ccc] w-[75px]">سعر البيع</th>
                                        <th className="py-1 px-2 border-l border-[#ccc] w-[65px]">الوحدة</th>
                                        <th className="py-1 px-2 border-l border-[#ccc] w-[90px]">اسم المستودع</th>
                                        <th className="py-1 px-2 w-[75px]">الكمية المتاحة</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {inlineMatches.length === 0 ? (
                                        <tr>
                                          <td colSpan={6} className="p-3 text-center text-[#666]">
                                            لا توجد مادة مطابقة في الدليل
                                          </td>
                                        </tr>
                                      ) : (
                                        inlineMatches.slice(0, 12).map((m) => (
                                          <tr
                                            key={`${m.code}-${m.name}`}
                                            onMouseDown={(ev) => {
                                              ev.preventDefault();
                                              assignMaterialToRow(idx, m);
                                              setInlineSuggestRow(null);
                                            }}
                                            className="bg-white hover:bg-[#0078d7] hover:text-white cursor-pointer border-b border-[#e5e8ee]"
                                          >
                                            <td className="px-2 py-1 text-center border-l border-[#eee]">
                                              {m.code}
                                            </td>
                                            <td className="px-2 py-1 font-bold border-l border-[#eee]">
                                              {m.name}
                                            </td>
                                            <td className="px-2 py-1 text-center border-l border-[#eee]">
                                              {m.purchasePrice || '0'}
                                            </td>
                                            <td className="px-2 py-1 text-center border-l border-[#eee]">
                                              {m.mainUnit || 'حبة'}
                                            </td>
                                            <td className="px-2 py-1 text-center border-l border-[#eee]">
                                              {m.warehouse || 'مستودع 1'}
                                            </td>
                                            <td className="px-2 py-1 text-center font-bold">
                                              {m.qty || '0'}
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                            {showLineWarehouseCol && (
                            <td className="p-0 border-l border-[#bbb]">
                              <select
                                value={it.warehouse || warehouse}
                                onChange={(e) => updateLine(idx, 'warehouse', e.target.value)}
                                className="w-full h-[24px] px-1 bg-transparent text-center font-bold outline-none focus:bg-[#e5f1fb]"
                              >
                                {warehouse && !warehouses.some((w) => w.name === warehouse) && (
                                  <option value={warehouse}>{warehouse}</option>
                                )}
                                {warehouses.map((w) => (
                                  <option key={`row-wh-${w.id}`} value={w.name}>
                                    {w.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            )}
                            {!activeTpl.columns.hideQty && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  type="number"
                                  min={0}
                                  value={it.qty || ''}
                                  onChange={(e) =>
                                    updateLine(idx, 'qty', Number(e.target.value) || 0)
                                  }
                                  className="w-full h-[24px] px-1.5 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            {activeTpl.columns.showUnit && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  value={it.unit}
                                  onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                                  className="w-full h-[24px] px-1.5 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            {activeTpl.columns.showBonus && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  type="number"
                                  min={0}
                                  readOnly={activeTpl.additional.lockBonus}
                                  value={it.bonus || ''}
                                  onChange={(e) =>
                                    updateLine(idx, 'bonus', Number(e.target.value) || 0)
                                  }
                                  className="w-full h-[24px] px-1 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            <td className="p-0 border-l border-[#bbb]">
                              <input
                                type="number"
                                min={0}
                                readOnly={activeTpl.additional.lockPrice}
                                value={it.price || ''}
                                onChange={(e) =>
                                  updateLine(idx, 'price', Number(e.target.value) || 0)
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === 'Enter' &&
                                    activeTpl.additional.newRowOnEnter &&
                                    idx === items.length - 1
                                  ) {
                                    setItems((prev) => [...prev, makeEmptyLine(prev.length)]);
                                  }
                                }}
                                className="w-full h-[24px] px-1.5 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                              />
                            </td>
                            {!activeTpl.columns.hideTotal && (
                              <td className="px-2 text-left font-bold border-l border-[#bbb]">
                                {rowTotal > 0 ? rowTotal.toFixed(2) : ''}
                              </td>
                            )}
                            {activeTpl.discountsAndCommissions.showDiscountPercent && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  type="number"
                                  min={0}
                                  value={it.discPct || ''}
                                  onChange={(e) =>
                                    updateLine(idx, 'discPct', Number(e.target.value) || 0)
                                  }
                                  className="w-full h-[24px] px-1 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            {activeTpl.discountsAndCommissions.showDiscountAmount && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  type="number"
                                  min={0}
                                  value={it.discount || ''}
                                  onChange={(e) =>
                                    updateLine(idx, 'discount', Number(e.target.value) || 0)
                                  }
                                  className="w-full h-[24px] px-1 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            {activeTpl.columns.showExpiry && (
                              <td className="p-0 border-l border-[#bbb]">
                                <input
                                  value={it.expiryDate || ''}
                                  placeholder="YYYY/MM/DD"
                                  onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                                  className="w-full h-[24px] px-1 text-center bg-transparent outline-none focus:bg-[#e5f1fb]"
                                />
                              </td>
                            )}
                            <td className="px-1.5 text-center font-bold bg-[#eceef4] border-r border-[#888]">
                              {idx === 0 ? '◀ ' : ''}
                              {idx + 1}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Peach Summary Bar directly beneath Items Grid */}
                <div className="bg-[#f9dfc6] border-t-2 border-[#333] border-b-2 border-b-[#333] flex items-center justify-between px-4 font-extrabold text-[12px] h-[26px]">
                  <span>المجموع</span>
                  <div className="flex items-center gap-12">
                    <span>{totalQty.toFixed(2)}</span>
                    {(activeTpl.discountsAndCommissions.showDiscountAmount ||
                      lineDiscountTotal > 0) && <span>{lineDiscountTotal.toFixed(2)}</span>}
                    <span>{Math.max(0, subTotal - lineDiscountTotal).toFixed(2)}</span>
                  </div>
                </div>

                {/* Accounting Split Grid right below (matching 024310) */}
                {!wp?.hideAccountsPanel && (
                <div className="bg-white overflow-auto h-[96px]">
                  <table className="w-full border-collapse text-[12px]">
                    <thead className="sticky top-0">
                      <tr className="bg-[#b6b8f2] border-b border-[#444]">
                        <th className="py-1 px-1.5 border-l border-[#666] w-[52px] bg-[#eceef4]">م</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[30%]">الحساب</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[52px]" />
                        <th className="py-1 px-2 border-l border-[#666] w-[22%]">المبلغ</th>
                        <th className="py-1 px-2">البيان</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white border-b border-[#ccc] h-[24px]">
                        <td className="px-1.5 text-center font-bold bg-[#eceef4] border-l border-[#ccc]">
                          ◀ 1
                        </td>
                        <td className="px-2 font-bold border-l border-[#ccc]">{salesAccount}</td>
                        <td className="p-0.5 text-center border-l border-[#ccc]">
                          <button
                            type="button"
                            onClick={() => {
                              setLookupFilter('');
                              setLookupModal({
                                title: 'تحديد حساب المبيعات / المشتريات',
                                items: allAccountChoices,
                                onSelect: (label) => setSalesAccount(label),
                              });
                            }}
                            className="erp-classic-btn px-2 h-[20px] text-[11px]"
                          >
                            بحث
                          </button>
                        </td>
                        <td className="px-2 text-left font-bold border-l border-[#ccc]">
                          {netTotal.toFixed(2)}
                        </td>
                        <td className="px-2 font-bold">{labelTypeAccount}</td>
                      </tr>
                      <tr className="bg-[#f8f9ca] border-b border-[#ccc] h-[24px]">
                        <td className="px-1.5 text-center font-bold bg-[#eceef4] border-l border-[#ccc]">
                          2
                        </td>
                        <td className="px-2 font-bold border-l border-[#ccc]">{cashAccount}</td>
                        <td className="p-0.5 text-center border-l border-[#ccc]">
                          <button
                            type="button"
                            onClick={() => {
                              setLookupFilter('');
                              setLookupModal({
                                title: 'تحديد حساب النقدية',
                                items: allAccountChoices,
                                onSelect: (label) => setCashAccount(label),
                              });
                            }}
                            className="erp-classic-btn px-2 h-[20px] text-[11px]"
                          >
                            بحث
                          </button>
                        </td>
                        <td className="p-0 border-l border-[#ccc]">
                          <input
                            type="number"
                            min={0}
                            value={
                              payType === 'نقدي' && cashPaid === ''
                                ? netTotal || ''
                                : cashPaid
                            }
                            onChange={(e) => setCashPaid(e.target.value)}
                            className="w-full h-[22px] px-2 text-left bg-transparent outline-none font-bold"
                          />
                        </td>
                        <td className="px-2 font-bold">الدفعة النقدية</td>
                      </tr>
                      <tr className="bg-white border-b border-[#ccc] h-[24px]">
                        <td className="px-1.5 text-center font-bold bg-[#eceef4] border-l border-[#ccc]">
                          3
                        </td>
                        <td className="px-2 font-bold border-l border-[#ccc]">{discountAccount}</td>
                        <td className="p-0.5 text-center border-l border-[#ccc]">
                          <button
                            type="button"
                            onClick={() => {
                              setLookupFilter('');
                              setLookupModal({
                                title: 'تحديد حساب الخصم',
                                items: allAccountChoices,
                                onSelect: (label) => setDiscountAccount(label),
                              });
                            }}
                            className="erp-classic-btn px-2 h-[20px] text-[11px]"
                          >
                            بحث
                          </button>
                        </td>
                        <td className="px-2 text-left font-bold border-l border-[#ccc]">
                          {discountNum > 0 ? discountNum.toFixed(2) : ''}
                        </td>
                        <td className="px-2 font-bold">خصم ممنوح</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                )}
              </div>

              {/* Optional POS Tiles Strip when enabled via خصائص النافذة */}
              {(wp?.showItemsPanelTiles || wp?.showSaveButtonTiles) && (
                <div className="bg-[#e8edf5] border-b border-[#b9c4d4] px-3 py-1.5 flex items-center justify-between gap-2">
                  {wp?.showItemsPanelTiles && (
                    <div className="flex flex-wrap gap-1 flex-1">
                      {importedMaterials.slice(0, 8).map((m) => (
                        <button
                          key={`tile-${m.code}-${m.name}`}
                          type="button"
                          onClick={() => {
                            const emptyIdx = items.findIndex((it) => !it.name.trim());
                            assignMaterialToRow(emptyIdx >= 0 ? emptyIdx : 0, m);
                          }}
                          className="erp-classic-btn px-2.5 py-1 text-[11px] bg-white"
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {wp?.showSaveButtonTiles && (
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      style={{
                        backgroundColor: wp.savePanelColor || '#b8c4ff',
                        height: `${Math.max(32, Number(wp.saveButtonRowHeight) || 40)}px`,
                      }}
                      className="border border-[#556] px-6 font-extrabold cursor-pointer"
                    >
                      حفظ الفاتورة (F2)
                    </button>
                  )}
                </div>
              )}

              {/* Bottom Totals & Metadata Band (matching Screenshot 024310) */}
              {!wp?.hideBottomPanel && (
              <div className="bg-[#f0f0f0] border-b border-[#c5ccd8] px-3 py-1.5 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="font-bold">المجموع</span>
                    <input
                      readOnly
                      value={fmtAmt(subTotal)}
                      className="erp-field w-[105px] bg-[#eaeaea] text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">الخصم</span>
                    <input
                      type="number"
                      min={0}
                      value={discountVal}
                      onChange={(e) => setDiscountVal(e.target.value)}
                      className="erp-field w-[75px] bg-white text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">الصافي</span>
                    <input
                      readOnly
                      value={fmtAmt(netTotal)}
                      className="erp-field w-[95px] bg-[#eaeaea] text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">الضريبة</span>
                    <input
                      type="number"
                      min={0}
                      value={taxActive ? fmtAmt(computedTax) : taxVal}
                      readOnly={taxActive}
                      onChange={(e) => setTaxVal(e.target.value)}
                      className="erp-field w-[78px] bg-[#eaeaea] text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">المصاريف</span>
                    <input
                      type="number"
                      min={0}
                      value={expensesVal}
                      onChange={(e) => setExpensesVal(e.target.value)}
                      className="erp-field w-[105px] bg-[#eaeaea] text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">مرات التعديل</span>
                    <input
                      readOnly
                      value={editCount || ''}
                      className="erp-field w-[38px] bg-[#eaeaea] text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">مرات الطباعه</span>
                    <input
                      readOnly
                      value={printCount || ''}
                      className="erp-field w-[38px] bg-[#eaeaea] text-center"
                    />
                  </div>
                  <input
                    readOnly
                    value={stampText}
                    title="تاريخ ووقت الطباعة"
                    className="erp-field w-[150px] bg-white text-center text-[11px]"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  {activeTpl.general.showStatement && (
                    <div className="flex items-center gap-1.5 flex-1 min-w-[260px]">
                      <span className="font-bold">البيان</span>
                      <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="erp-field flex-1 bg-white"
                      />
                    </div>
                  )}
                  {activeTpl.general.showDistributor && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">الموزع</span>
                      <input
                        value={distributor}
                        onChange={(e) => setDistributor(e.target.value)}
                        className="erp-field w-[150px] bg-white"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">مدخل الفاتورة</span>
                    <input
                      readOnly
                      value={currentUser}
                      className="erp-field w-[115px] bg-[#eaeaea] text-center font-bold"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Bottom Command Bar — flat 8-button layout for sales, grouped for purchases */}
              <div
                className={`bg-[#f0f0f0] px-2 py-1.5 relative ${
                  isSalesDoc
                    ? 'grid grid-cols-8 gap-1'
                    : 'flex flex-wrap items-center justify-between gap-2'
                }`}
              >
                {isSalesDoc ? (
                  <>
                    <button type="button" onClick={onOpenPrint} className={BAR_BTN_SALES}>
                      اعدادات الطباعة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintCount((c) => c + 1);
                        setPreviewMode('invoice');
                      }}
                      className={BAR_BTN_SALES}
                    >
                      معاينة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintCount((c) => c + 1);
                        setPreviewMode('invoice');
                        window.setTimeout(() => window.print(), 450);
                      }}
                      className={BAR_BTN_SALES}
                    >
                      طباعة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKindMenuOpen(false);
                        openFetchDialog();
                      }}
                      className={BAR_BTN_SALES}
                    >
                      جلب
                    </button>
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => {
                          setKindMenuOpen(false);
                          setTplPickerOpen(true);
                        }}
                        className={`${BAR_BTN_SALES} flex-1`}
                      >
                        نموذج فاتورة
                      </button>
                      <button
                        type="button"
                        title="قائمة أنواع الفواتير"
                        onClick={() => setKindMenuOpen((v) => !v)}
                        className={`border border-r-0 border-[#666] h-[30px] w-[22px] font-bold cursor-pointer ${
                          kindMenuOpen ? 'bg-[#cfe4fb]' : 'bg-[#dfe4f7] hover:bg-[#c9d5f3]'
                        }`}
                      >
                        ▾
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      className="border border-[#333] bg-[#c9d5f3] hover:brightness-95 h-[30px] font-extrabold cursor-pointer"
                    >
                      حفظ F2
                    </button>
                    <button type="button" onClick={() => void requestDelete()} className={BAR_BTN_SALES}>
                      حذف
                    </button>
                    <button type="button" onClick={onClose} className={BAR_BTN_SALES}>
                      خروج
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={onClose} className={`${BAR_BTN} w-[76px]`}>
                        خروج
                      </button>
                      <button
                        type="button"
                        onClick={() => void requestDelete()}
                        className={`${BAR_BTN} w-[76px]`}
                      >
                        حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        className="border border-[#333] bg-[#b8c4f4] hover:brightness-95 h-[28px] w-[96px] font-extrabold cursor-pointer shadow-inner"
                      >
                        موافق F2
                      </button>
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => {
                            setKindMenuOpen(false);
                            setTplPickerOpen(true);
                          }}
                          className={`border border-r-0 border-[#666] bg-[#e9edf4] hover:brightness-95 h-[28px] w-[96px] font-bold cursor-pointer`}
                        >
                          نموذج فاتورة
                        </button>
                        <button
                          type="button"
                          title="قائمة أنواع الفواتير"
                          onClick={() => setKindMenuOpen((v) => !v)}
                          className={`border border-[#666] h-[28px] w-[24px] font-bold cursor-pointer ${
                            kindMenuOpen
                              ? 'bg-[#cfe4fb] border-[#0078d7]'
                              : 'bg-[#e9edf4] hover:brightness-95'
                          }`}
                        >
                          ▾
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setKindMenuOpen(false);
                          openFetchDialog();
                        }}
                        className={`${BAR_BTN} w-[76px]`}
                      >
                        جلب
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpensesOpen(true)}
                        className={`${BAR_BTN} w-[84px]`}
                      >
                        المصاريف
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={onOpenPrint}
                        className={`${BAR_BTN} w-[118px]`}
                      >
                        اعدادات الطباعة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintCount((c) => c + 1);
                          setPreviewMode('invoice');
                        }}
                        className={`${BAR_BTN} w-[86px]`}
                      >
                        معاينة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintCount((c) => c + 1);
                          setPreviewMode('loadingOrder');
                        }}
                        className={`${BAR_BTN} w-[96px]`}
                      >
                        أمر تحميل
                      </button>
                    </div>
                  </>
                )}

                {/* نموذج فاتورة menu — list of document types (screenshot 3) */}
                {kindMenuOpen && (
                  <div
                    className={`absolute bottom-[34px] z-[60] w-[230px] bg-white border border-[#7a8699] shadow-xl py-0.5 text-[12px] max-h-[430px] overflow-auto erp-scrollbar ${
                      isSalesDoc ? 'right-[318px]' : 'right-[214px]'
                    }`}
                    onMouseLeave={() => setKindMenuOpen(false)}
                  >
                    {KIND_MENU_ITEMS.map((item, i) => (
                      <React.Fragment key={item.label}>
                        {i === 10 && <div className="h-px bg-[#d5d5d5] my-1" />}
                        <button
                          type="button"
                          onClick={() => {
                            setKindMenuOpen(false);
                            if (!item.kind) {
                              onNotify(`شاشة «${item.label}» تُفتح من القائمة الرئيسية`);
                              return;
                            }
                            setKindTitle(item.kind);
                            setViewMode('editor');
                            resetFormForLaunch(
                              { mode: 'editor', kindTitle: item.kind },
                              activeTpl
                            );
                            onNotify(`تم فتح ${item.label}`);
                          }}
                          className="w-full text-right px-3 py-[3px] hover:bg-[#0078d7] hover:text-white cursor-pointer"
                        >
                          {item.label}
                        </button>
                      </React.Fragment>
                    ))}
                    <div className="h-px bg-[#d5d5d5] my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setKindMenuOpen(false);
                        setTplPickerOpen(true);
                      }}
                      className="w-full text-right px-3 py-[3px] font-bold text-[#005499] hover:bg-[#0078d7] hover:text-white cursor-pointer"
                    >
                      قوالب الفواتير (نماذج)…
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'browse' && (
            <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden">
              <div className="flex-1 bg-white border border-[#8e8e8e] overflow-auto erp-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#e8eaf0] border-b border-[#999]">
                      <th className="py-2 px-2 border-l border-[#ccc]">رقم</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">النوع</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">الدفع</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">التاريخ</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">العميل / المورد</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">العملة</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">الإجمالي</th>
                      <th className="py-2 px-2">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[#666]">
                          لا توجد فواتير مسجلة حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-[#ddd] hover:bg-[#f2f7fd]">
                          <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                            {inv.number}
                          </td>
                          <td className="py-1.5 px-2 border-l border-[#eee]">{inv.kind}</td>
                          <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                            {inv.payType || 'آجل'}
                          </td>
                          <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                            {inv.date}
                          </td>
                          <td className="py-1.5 px-2 border-l border-[#eee]">{inv.party}</td>
                          <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                            {inv.currency}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold border-l border-[#eee]">
                            {inv.total.toLocaleString()}
                          </td>
                          <td className="py-1 px-2 text-center flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => loadForEdit(inv)}
                              className="erp-classic-btn px-2.5 py-0.5 text-[12px]"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const r = await onShowMsg({
                                  title: 'حذف فاتورة',
                                  icon: 'question',
                                  text: `هل تريد حذف الفاتورة رقم ${inv.number}؟`,
                                  buttons: [
                                    { label: 'نعم', value: 'yes' },
                                    { label: 'لا', value: 'no', focus: true },
                                  ],
                                });
                                if (r === 'yes') onDeleteInvoice(inv.id);
                              }}
                              className="erp-classic-btn px-2.5 py-0.5 text-[12px]"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'profit' && (
            <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#999] p-3 text-center">
                  <div className="text-[13px] text-[#555] font-bold">عدد الفواتير</div>
                  <div className="text-[22px] font-black text-[#005499]">
                    {profitSource.length}
                  </div>
                </div>
                <div className="bg-white border border-[#999] p-3 text-center">
                  <div className="text-[13px] text-[#555] font-bold">إجمالي المبيعات / القيمة</div>
                  <div className="text-[22px] font-black text-[#111]">
                    {profitSource.reduce((s, i) => s + i.total, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-[#999] p-3 text-center">
                  <div className="text-[13px] text-[#555] font-bold">صافي الربح التقديري</div>
                  <div className="text-[22px] font-black text-[#0b6b3a]">
                    {profitSource.reduce((s, i) => s + i.profit, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white border border-[#8e8e8e] overflow-auto erp-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#e8eaf0] border-b border-[#999]">
                      <th className="py-2 px-2 border-l border-[#ccc]">رقم</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">النوع</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">التاريخ</th>
                      <th className="py-2 px-2 border-l border-[#ccc]">الإجمالي</th>
                      <th className="py-2 px-2">الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitSource.map((inv) => (
                      <tr key={inv.id} className="border-b border-[#ddd]">
                        <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                          {inv.number}
                        </td>
                        <td className="py-1.5 px-2 border-l border-[#eee]">{inv.kind}</td>
                        <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                          {inv.date}
                        </td>
                        <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                          {inv.total.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-[#0b6b3a]">
                          {inv.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DraggableWindow>

      {/* Account / Party Picker Modal */}
      {lookupModal && (
        <div className="fixed inset-0 z-[9998] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-[#f0f0f0] border-2 border-[#333] w-[400px] max-h-[420px] flex flex-col shadow-xl">
            <div className="bg-[#dfe6f0] border-b border-[#9aa7b8] px-3 py-1.5 font-bold flex justify-between items-center">
              <span>{lookupModal.title}</span>
              <button
                type="button"
                onClick={() => setLookupModal(null)}
                className="px-2 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-2 flex flex-col gap-2 overflow-hidden flex-1">
              <input
                value={lookupFilter}
                onChange={(e) => setLookupFilter(e.target.value)}
                placeholder="بحث بالاسم أو الرمز..."
                className="erp-field bg-white"
                autoFocus
              />
              <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
                {lookupModal.items
                  .filter(
                    (it) =>
                      !lookupFilter.trim() ||
                      it.label.includes(lookupFilter.trim()) ||
                      (it.code && it.code.includes(lookupFilter.trim()))
                  )
                  .map((it) => (
                    <button
                      key={it.label}
                      type="button"
                      onClick={() => {
                        lookupModal.onSelect(it.label, it.code);
                        setLookupModal(null);
                      }}
                      className="w-full text-right px-3 py-1.5 hover:bg-[#0078d7] hover:text-white border-b border-[#eee] cursor-pointer flex justify-between"
                    >
                      <span className="font-bold">{it.label}</span>
                      {it.code && <span className="text-[11px] opacity-75">{it.code}</span>}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Row Picker Modal */}
      {materialRowPicker !== null && (
        <div className="fixed inset-0 z-[9998] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-[#f0f0f0] border-2 border-[#333] w-[520px] max-h-[440px] flex flex-col shadow-xl">
            <div className="bg-[#dfe6f0] border-b border-[#9aa7b8] px-3 py-1.5 font-bold flex justify-between items-center">
              <span>اختيار مادة للفاتورة</span>
              <button
                type="button"
                onClick={() => setMaterialRowPicker(null)}
                className="px-2 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-2 flex flex-col gap-2 overflow-hidden flex-1">
              <input
                value={materialQuery}
                onChange={(e) => setMaterialQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الرمز أو الباركود..."
                className="erp-field bg-white"
                autoFocus
              />
              <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
                {importedMaterials.length === 0 ? (
                  <div className="p-6 text-center text-[#666]">
                    لا توجد مواد مسجلة في الدليل بعد. يمكنك كتابة المادة مباشرة في الجدول أو استيرادها.
                  </div>
                ) : (
                  importedMaterials
                    .filter((m) => matchesMaterialQuery(m, materialQuery))
                    .map((m) => (
                      <button
                        key={`${m.code}-${m.name}`}
                        type="button"
                        onClick={() => assignMaterialToRow(materialRowPicker, m)}
                        className="w-full text-right px-3 py-1.5 hover:bg-[#0078d7] hover:text-white border-b border-[#eee] cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-bold">
                          {m.code} — {m.name}
                        </span>
                        <span className="text-[11px] opacity-80">
                          الرصيد: {m.qty || '0'} | السعر: {m.purchasePrice || '0'}
                        </span>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نواقص المواد Modal */}
      {shortagesOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-[#f0f0f0] border-2 border-[#333] w-[540px] max-h-[420px] flex flex-col shadow-xl">
            <div className="bg-[#dfe6f0] border-b border-[#9aa7b8] px-3 py-1.5 font-bold flex justify-between items-center">
              <span>نواقص المواد ({shortagesList.length})</span>
              <button
                type="button"
                onClick={() => setShortagesOpen(false)}
                className="px-2 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-3 flex-1 overflow-auto bg-white erp-scrollbar">
              {shortagesList.length === 0 ? (
                <div className="p-6 text-center text-[#666]">
                  لا توجد مواد ناقصة تحت الحد الأدنى حالياً.
                </div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#cfdce8]">
                      <th className="border border-[#9aa7b8] p-1.5">الرمز</th>
                      <th className="border border-[#9aa7b8] p-1.5">المادة</th>
                      <th className="border border-[#9aa7b8] p-1.5">الرصيد</th>
                      <th className="border border-[#9aa7b8] p-1.5">الحد الأدنى</th>
                      <th className="border border-[#9aa7b8] p-1.5">إدراج</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortagesList.map((m) => (
                      <tr key={`${m.code}-${m.name}`}>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{m.code}</td>
                        <td className="border border-[#d5dce6] p-1.5 font-bold">{m.name}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center text-rose-700 font-bold">
                          {m.qty || '0'}
                        </td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">
                          {m.minLimit || '0'}
                        </td>
                        <td className="border border-[#d5dce6] p-1 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const emptyIdx = items.findIndex(
                                (it) => !it.name.trim() && !it.code.trim()
                              );
                              if (emptyIdx >= 0) {
                                assignMaterialToRow(emptyIdx, m);
                              } else {
                                setItems((prev) => [
                                  ...prev,
                                  {
                                    id: `line-${Date.now()}`,
                                    code: m.code,
                                    name: m.name,
                                    unit: m.mainUnit || 'حبة',
                                    qty: 1,
                                    price: Number(m.purchasePrice || '0'),
                                    cost: Number(m.purchasePrice || '0'),
                                  },
                                ]);
                              }
                              setShortagesOpen(false);
                              onNotify(`تم إدراج ${m.name} في الفاتورة`);
                            }}
                            className="erp-classic-btn px-2 py-0.5 text-[11px]"
                          >
                            إضافة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* جلب / استعراض فواتير سابقة (matching فواتير المبيعات window) */}
      {fetchOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-[#f0f0f0] border-2 border-[#3a3a3a] w-[900px] max-h-[580px] flex flex-col shadow-2xl text-[12px] select-none">
            {/* Title bar */}
            <div className="bg-gradient-to-b from-[#ffffff] to-[#e6ebf5] border-b border-[#9aa7b8] px-2 py-1 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <span className="inline-block w-4 h-4 bg-[conic-gradient(#e33_0_25%,#fc0_0_50%,#3a7_0_75%,#38e_0)] border border-[#888]" />
                <span>{fetchWindowTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setFetchOpen(false)}
                className="w-7 h-6 border border-[#b9c4d4] bg-[#eef2fa] font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-2.5 flex flex-col gap-2 flex-1 overflow-hidden">
              {/* Filters */}
              <div className="bg-[#e8edf5] border border-[#b9c4d4] p-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold w-[70px] text-right">اسم الحساب</span>
                  <input
                    value={fetchAccount}
                    onChange={(e) => setFetchAccount(e.target.value)}
                    className="erp-field w-[300px] bg-white"
                  />
                  <span className="font-bold">الرقم</span>
                  <input
                    value={fetchNumber}
                    onChange={(e) => setFetchNumber(e.target.value)}
                    className="erp-field w-[90px] bg-white text-center"
                  />
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer mr-3">
                    <input
                      type="checkbox"
                      checked={fetchPrevYear}
                      onChange={(e) => setFetchPrevYear(e.target.checked)}
                    />
                    <span>السنة السابقة</span>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">من تاريخ</span>
                  <input
                    type="date"
                    value={fetchFrom}
                    onChange={(e) => setFetchFrom(e.target.value)}
                    className="erp-field w-[130px] bg-white text-center"
                    dir="ltr"
                  />
                  <span className="font-bold">الى تاريخ</span>
                  <input
                    type="date"
                    value={fetchTo}
                    onChange={(e) => setFetchTo(e.target.value)}
                    className="erp-field w-[130px] bg-white text-center"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onNotify(`تم عرض ${fetchInvoices.length} فاتورة`)
                    }
                    className="erp-classic-btn w-[72px] h-[26px]"
                  >
                    عرض
                  </button>
                  <span className="font-bold mr-4">الاسم</span>
                  <input
                    value={fetchName}
                    onChange={(e) => setFetchName(e.target.value)}
                    className="erp-field flex-1 min-w-[160px] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => onNotify(`تم تصفية القائمة: ${fetchInvoices.length} فاتورة`)}
                    className="erp-classic-btn w-[62px] h-[26px]"
                  >
                    بحث
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 bg-white border border-[#8e8e8e] overflow-auto erp-scrollbar min-h-[200px]">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#b6b8f2] border-b border-[#444]">
                      <th className="py-1 px-2 border-l border-[#666] w-[80px]">الرقم</th>
                      <th className="py-1 px-2 border-l border-[#666]">الحساب</th>
                      <th className="py-1 px-2 border-l border-[#666] w-[180px]">الاسم</th>
                      <th className="py-1 px-2 border-l border-[#666] w-[115px]">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetchInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-[#666] font-bold">
                          لا توجد فواتير مطابقة للبحث.
                        </td>
                      </tr>
                    ) : (
                      fetchInvoices.map((inv, idx) => {
                        const isSel = fetchSelectedId === inv.id;
                        return (
                          <tr
                            key={inv.id}
                            onClick={() => setFetchSelectedId(inv.id)}
                            onDoubleClick={() => loadFromFetch(inv)}
                            className={`border-b border-[#d5dce6] h-[24px] cursor-pointer ${
                              isSel
                                ? 'bg-[#0078d7] text-white'
                                : idx % 2 === 1
                                  ? 'bg-[#f8f9ca] hover:bg-[#e5f1fb]'
                                  : 'bg-white hover:bg-[#e5f1fb]'
                            }`}
                          >
                            <td className="px-2 text-center font-bold border-l border-[#ccc]">
                              {inv.number || idx + 1}
                            </td>
                            <td className="px-2 font-bold border-l border-[#ccc]">{inv.party}</td>
                            <td className="px-2 border-l border-[#ccc]">
                              {inv.contactName || inv.distributor || '—'}
                            </td>
                            <td className="px-2 text-center border-l border-[#ccc]" dir="ltr">
                              {inv.date}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFetchOpen(false);
                    onOpenAiInvoiceScan();
                  }}
                  className="erp-classic-btn h-[28px] px-3"
                >
                  قراءة فاتورة بالذكاء الاصطناعي
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!fetchInvoices.some((i) => i.id === fetchSelectedId)}
                    onClick={() => {
                      const inv = fetchInvoices.find((i) => i.id === fetchSelectedId);
                      if (inv) loadFromFetch(inv);
                    }}
                    className="erp-classic-btn focused w-[120px] h-[30px] font-bold"
                  >
                    موافق
                  </button>
                  <button
                    type="button"
                    onClick={() => setFetchOpen(false)}
                    className="erp-classic-btn w-[120px] h-[30px] font-bold"
                  >
                    خروج
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview / Loading Order Modal */}
      {previewMode !== 'none' && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-3">
          <div className="bg-white border-2 border-[#333] w-[1000px] max-h-[94vh] flex flex-col shadow-2xl">
            {/* Print toolbar */}
            <div className="no-print bg-[#f0f0f0] border-b border-[#9aa7b8] px-2 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[12px]">
                <span className="inline-block w-4 h-4 bg-[conic-gradient(#e33_0_25%,#fc0_0_50%,#3a7_0_75%,#38e_0)] border border-[#888]" />
                <span>معاينة الطباعة</span>
                <span className="text-[#555] font-normal">
                  — {previewMode === 'loadingOrder' ? 'أمر تحميل' : shortWindowTitle(kindTitle)} #{invNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={confirmPrintTemplate}
                  onChange={(e) => setConfirmPrintTemplate(e.target.value)}
                  className="erp-field h-[26px] w-[220px] bg-white text-[12px]"
                >
                  {invoicePrintTemplateChoices.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setPrintCount((c) => c + 1);
                    window.print();
                  }}
                  className="erp-classic-btn focused px-4 h-[26px] text-[12px] font-bold"
                >
                  طباعة
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('none')}
                  className="erp-classic-btn px-3 h-[26px] text-[12px]"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Paper */}
            <div className="flex-1 overflow-auto bg-[#9a9a9a] p-4 flex justify-center">
              <div
                data-print-preview
                dir="rtl"
                className="bg-white w-[794px] min-h-[1040px] p-[18px] text-[11px] text-black shadow-xl border border-[#555] flex flex-col"
              >
                {/* Company header — designed header when configured, otherwise the built-in one */}
                {hasDesignerHeader && designerHeader ? (
                  <div
                    className="border-2 border-black px-3 py-2 flex flex-col gap-1"
                    style={designerFontStyle(designerHeader.font)}
                  >
                    {designerHeader.rows.map((r) => (
                      <div key={r.id} className="grid grid-cols-3 items-center gap-2">
                        <div className="text-right font-bold">
                          {renderDesignerTokenPreview(
                            r.right,
                            companyProps,
                            shortWindowTitle(kindTitle),
                            r.attachBeforeR,
                            r.attachAfterR,
                            designerTokens
                          )}
                        </div>
                        <div className="text-center font-bold">
                          {renderDesignerTokenPreview(
                            r.center,
                            companyProps,
                            shortWindowTitle(kindTitle),
                            '',
                            '',
                            designerTokens
                          )}
                        </div>
                        <div className="text-left font-bold">
                          {renderDesignerTokenPreview(
                            r.left,
                            companyProps,
                            shortWindowTitle(kindTitle),
                            r.attachBeforeL,
                            r.attachAfterL,
                            designerTokens
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="border-2 border-black px-3 py-2 flex items-center justify-between gap-3">
                  <div className="w-[170px] text-left leading-tight">
                    {companyProps?.hdrEnName && (
                      <div className="font-bold text-[11px]" dir="ltr">
                        {companyProps.hdrEnName}
                      </div>
                    )}
                    {companyProps?.hdrEnAddr && (
                      <div className="text-[9px] text-[#333]" dir="ltr">
                        {companyProps.hdrEnAddr}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {companyProps?.logoData ? (
                      <img
                        src={companyProps.logoData}
                        alt="شعار الشركة"
                        referrerPolicy="no-referrer"
                        className="max-h-[70px] max-w-[170px] object-contain"
                      />
                    ) : (
                      <div className="text-[22px] font-extrabold text-[#005499]">
                        {companyProps?.company || 'النظام'}
                      </div>
                    )}
                  </div>
                  <div className="w-[220px] text-right leading-tight">
                    <div className="text-[19px] font-extrabold">
                      {companyProps?.company || 'النظام'}
                    </div>
                    {companyProps?.hdrArAddr && (
                      <div className="text-[9px]">{companyProps.hdrArAddr}</div>
                    )}
                    {companyProps?.hdrArTel && (
                      <div className="text-[9px]">تلفون: {companyProps.hdrArTel}</div>
                    )}
                    {companyProps?.taxNumber && (
                      <div className="text-[9px]">الرقم الضريبي: {companyProps.taxNumber}</div>
                    )}
                  </div>
                </div>

                )}

                {/* Document title */}
                <div className="border-2 border-black rounded-full text-center font-extrabold text-[15px] py-1 my-2">
                  {previewMode === 'loadingOrder'
                    ? 'أمر تحميل بضاعة'
                    : `فاتورة ${shortWindowTitle(kindTitle)} ${payType === 'آجل' ? 'أجل' : payType}`}
                </div>

                {/* Invoice info */}
                <div className="border-2 border-black">
                  <div className="flex items-center justify-between border-b border-black px-2 py-1">
                    <div>
                      رقم الفاتورة: <b>{invNumber}</b>
                    </div>
                    <div>
                      التاريخ: <b>{invDate}</b>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <div>
                      اسم العميل: <b>{party || 'عميل نقدي'}</b>
                    </div>
                    <div>
                      العملة: <b>{currency}</b>
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <table className="w-full border-collapse mt-1 text-[10px]">
                  <thead>
                    <tr className="bg-[#d9d9d9]">
                      {previewMode === 'invoice' && (
                        <th className="border border-black px-1 py-0.5 w-[78px]">الباركود</th>
                      )}
                      <th className="border border-black px-1 py-0.5">المادة</th>
                      {previewMode === 'invoice' && (
                        <th className="border border-black px-1 py-0.5 w-[62px]">الانتهاء</th>
                      )}
                      <th className="border border-black px-1 py-0.5 w-[52px]">الكمية</th>
                      {previewMode === 'invoice' && (
                        <>
                          <th className="border border-black px-1 py-0.5 w-[48px]">البونص</th>
                          <th className="border border-black px-1 py-0.5 w-[46px]">ن الخصم</th>
                          <th className="border border-black px-1 py-0.5 w-[52px]">الخصم</th>
                          <th className="border border-black px-1 py-0.5 w-[62px]">السعر</th>
                          <th className="border border-black px-1 py-0.5 w-[74px]">الإجمالي</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .filter((it) => it.name.trim() || it.qty > 0)
                      .map((it) => {
                        const lineTotal = Math.max(
                          0,
                          (Number(it.qty) || 0) * (Number(it.price) || 0) -
                            (Number(it.discount) || 0)
                        );
                        return (
                          <tr key={it.id} className="h-[20px]">
                            {previewMode === 'invoice' && (
                              <td className="border border-black px-1 text-center">
                                {it.barcode || ''}
                              </td>
                            )}
                            <td className="border border-black px-1 font-bold">{it.name}</td>
                            {previewMode === 'invoice' && (
                              <td className="border border-black px-1 text-center" dir="ltr">
                                {it.expiryDate || ''}
                              </td>
                            )}
                            <td className="border border-black px-1 text-center">{it.qty}</td>
                            {previewMode === 'invoice' && (
                              <>
                                <td className="border border-black px-1 text-center">
                                  {it.bonus || ''}
                                </td>
                                <td className="border border-black px-1 text-center">
                                  {it.discPct || ''}
                                </td>
                                <td className="border border-black px-1 text-center">
                                  {it.discount ? it.discount.toFixed(2) : ''}
                                </td>
                                <td className="border border-black px-1 text-center">
                                  {it.price || ''}
                                </td>
                                <td className="border border-black px-1 text-center font-bold">
                                  {lineTotal > 0 ? lineTotal.toFixed(2) : ''}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    <tr className="bg-[#f2f2f2] h-[20px]">
                      <td
                        colSpan={previewMode === 'invoice' ? 2 : 1}
                        className="border border-black px-2 text-left font-extrabold text-[#b00020]"
                      >
                        المجموع
                      </td>
                      {previewMode === 'invoice' && (
                        <td className="border border-black px-1" />
                      )}
                      <td className="border border-black px-1 text-center font-extrabold text-[#b00020]">
                        {totalQty.toFixed(0)}
                      </td>
                      {previewMode === 'invoice' && (
                        <>
                          <td className="border border-black px-1" />
                          <td className="border border-black px-1" />
                          <td className="border border-black px-1" />
                          <td className="border border-black px-1" />
                          <td className="border border-black px-1 text-center font-extrabold">
                            {Math.max(0, subTotal - lineDiscountTotal).toFixed(2)}
                          </td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>

                {/* Totals in words */}
                {previewMode === 'invoice' && (
                  <div className="border-2 border-black border-t-0 px-2 py-1 text-[10px] leading-relaxed">
                    <div className="text-left font-bold">
                      الإجمالي : {Math.max(0, subTotal - lineDiscountTotal).toFixed(0)}
                    </div>
                    <div className="text-left font-bold">
                      الصافي : {netTotal.toFixed(2)} {amountToArabicWords(netTotal, currency)}
                    </div>
                  </div>
                )}

                {/* Statement */}
                <div className="border-2 border-black mt-1 min-h-[58px] px-2 py-1">
                  <span className="font-bold">البيان: </span>
                  <span>
                    {notes?.trim() ||
                      `فاتورة ${shortWindowTitle(kindTitle)} ${
                        payType === 'آجل' ? 'آجلة' : payType
                      } برقم ${invNumber}`}
                  </span>
                </div>
                <div className="text-[9px] font-bold mt-1.5">
                  استلمت البضاعة كامل وبحالة جيدة واتعهد بدفع الثمن عند الطلب
                </div>

                {/* Signatures */}
                <div className="mt-auto pt-10 grid grid-cols-3 gap-6 text-center font-bold text-[10px]">
                  <div>
                    <div>اسم المستلم</div>
                    <div className="mt-1">توقيع ..............................</div>
                  </div>
                  <div>
                    <div>ادارة المبيعات</div>
                    <div className="mt-1">..............................</div>
                  </div>
                  <div>
                    <div>ادارة المخزن</div>
                    <div className="mt-1">..............................</div>
                  </div>
                </div>

                {/* Designed footer (last page) */}
                {hasDesignerFooter && designerFooter && (
                  <div
                    className="mt-3 border-t border-black pt-1.5 flex flex-col gap-1"
                    style={designerFontStyle(designerFooter.font)}
                  >
                    {designerFooter.rows.map((r) => (
                      <div key={r.id} className="grid grid-cols-3 items-center gap-2">
                        <div className="text-right">
                          {renderDesignerTokenPreview(
                            r.right,
                            companyProps,
                            shortWindowTitle(kindTitle),
                            r.attachBeforeR,
                            r.attachAfterR,
                            designerTokens
                          )}
                        </div>
                        <div className="text-center">
                          {renderDesignerTokenPreview(
                            r.center,
                            companyProps,
                            shortWindowTitle(kindTitle),
                            '',
                            '',
                            designerTokens
                          )}
                        </div>
                        <div className="text-left">
                          {renderDesignerTokenPreview(
                            r.left,
                            companyProps,
                            shortWindowTitle(kindTitle),
                            r.attachBeforeL,
                            r.attachAfterL,
                            designerTokens
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses / discount / tax window (المصاريف) */}
      {expensesOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/35 flex items-center justify-center p-4">
          <div className="bg-[#f0f0f0] border-2 border-[#555] w-[430px] shadow-2xl select-none text-[12px]">
            <div className="bg-white border-b border-[#ccc] px-3 py-1.5 flex justify-between items-center">
              <span className="font-bold text-[#222]">المصاريف والخصومات</span>
              <button
                type="button"
                onClick={() => setExpensesOpen(false)}
                className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-3 flex flex-col gap-2">
              {[
                ['الخصم', discountVal, setDiscountVal, false],
                ['الضريبة', taxActive ? computedTax.toFixed(2) : taxVal, setTaxVal, taxActive],
                ['المصاريف', expensesVal, setExpensesVal, false],
              ].map(([label, val, setter, ro]) => (
                <div key={String(label)} className="flex items-center gap-2">
                  <span className="font-bold w-[80px] text-right">{label as string}</span>
                  <input
                    type="number"
                    min={0}
                    value={val as string}
                    readOnly={Boolean(ro)}
                    onChange={(e) =>
                      (
                        setter as React.Dispatch<React.SetStateAction<string>>
                      )(e.target.value)
                    }
                    className={`erp-field flex-1 text-center font-bold ${
                      ro ? 'bg-[#eaeaea]' : 'bg-white'
                    }`}
                  />
                </div>
              ))}

              <div className="flex items-center gap-2 border-t border-[#ccc] pt-2">
                <span className="font-bold w-[80px] text-right">الصافي</span>
                <input
                  readOnly
                  value={netTotal.toFixed(2)}
                  className="erp-field flex-1 bg-[#eaeaea] text-center font-extrabold text-[#b00020]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 flex-1">
                  <span className="font-bold">مرات التعديل</span>
                  <input
                    readOnly
                    value={editCount || ''}
                    className="erp-field w-[44px] bg-[#eaeaea] text-center"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <span className="font-bold">مرات الطباعه</span>
                  <input
                    readOnly
                    value={printCount || ''}
                    className="erp-field w-[44px] bg-[#eaeaea] text-center"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#e9edf4] border-t border-[#c5ccd8] px-3 py-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExpensesOpen(false)}
                className="erp-classic-btn w-[92px] h-[26px] font-bold focused"
              >
                موافق
              </button>
              <button
                type="button"
                onClick={() => setExpensesOpen(false)}
                className="erp-classic-btn w-[92px] h-[26px]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Save Modal (تأكيد الحفظ) matching Screenshots 042024 & 042129 */}
      {confirmSaveOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/35 flex items-center justify-center p-4">
          <div className="bg-[#f0f0f0] border-2 border-[#555] w-[465px] shadow-2xl select-none text-[13px]">
            {/* Title bar */}
            <div className="bg-white border-b border-[#ccc] px-3 py-1.5 flex justify-between items-center">
              <span className="font-bold text-[#222]">تأكيد الحفظ</span>
              <button
                type="button"
                onClick={() => setConfirmSaveOpen(false)}
                className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Invoice Template & Print Template selectors */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold w-[105px] shrink-0 text-right">نموذج الفاتورة</span>
                  <select
                    value={selectedTplId}
                    onChange={(e) => {
                      applyTemplate(e.target.value);
                      const nextTpl = invoiceTemplates.find((x) => x.id === e.target.value);
                      if (nextTpl?.printProps?.printTemplate) {
                        setConfirmPrintTemplate(nextTpl.printProps.printTemplate);
                      }
                    }}
                    className="erp-field flex-1 bg-white font-bold text-center h-[26px]"
                  >
                    {invoiceTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold w-[105px] shrink-0 text-right">نموذج الطباعة</span>
                  <select
                    value={confirmPrintTemplate}
                    onChange={(e) => setConfirmPrintTemplate(e.target.value)}
                    className="erp-field flex-1 bg-white font-bold text-center h-[26px]"
                  >
                    {invoicePrintTemplateChoices.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Large Totals Box */}
              <div className="border border-[#ccc] bg-[#efefef] p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-center gap-4">
                  <span className="font-extrabold text-[17px] w-[75px] text-center">المجموع</span>
                  <div className="w-[155px] h-[34px] bg-[#eaeaea] border border-[#b5bcc7] flex items-center justify-center text-[20px] font-extrabold">
                    {subTotal.toFixed(0)}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <span className="font-extrabold text-[17px] w-[75px] text-center">الخصم</span>
                  <div className="w-[155px] h-[34px] bg-[#eaeaea] border border-[#b5bcc7] flex items-center justify-center text-[20px] font-extrabold">
                    {discountNum.toFixed(0)}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <span className="font-extrabold text-[17px] w-[75px] text-center">الصافي</span>
                  <div className="w-[155px] h-[34px] bg-[#eaeaea] border border-[#b5bcc7] flex items-center justify-center text-[20px] font-extrabold">
                    {netTotal.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Cash & Network Split Row */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">المدفوع نقداً</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={confirmCashPaid}
                    onChange={(e) => setConfirmCashPaid(e.target.value)}
                    className="erp-field w-[100px] h-[28px] bg-white text-center font-extrabold text-[14px]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">المدفوع شبكة</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={confirmNetworkPaid}
                    onChange={(e) => setConfirmNetworkPaid(e.target.value)}
                    className="erp-field w-[100px] h-[28px] bg-white text-center font-extrabold text-[14px]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    void confirmAndPersistSave(
                      false,
                      confirmCashPaid,
                      confirmNetworkPaid,
                      confirmPrintTemplate
                    )
                  }
                  className="erp-classic-btn focused w-[115px] h-[32px] font-extrabold"
                >
                  حفظ F2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void confirmAndPersistSave(
                      true,
                      confirmCashPaid,
                      confirmNetworkPaid,
                      confirmPrintTemplate
                    )
                  }
                  className="erp-classic-btn w-[115px] h-[32px] font-bold"
                >
                  حفظ وطباعة F3
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSaveOpen(false)}
                  className="erp-classic-btn w-[125px] h-[32px] font-bold"
                >
                  الرجوع الى الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نموذج فاتورة (Template Picker + 14-Tab Template Editor) */}
      <InvoiceTemplatesPickerDialog
        open={tplPickerOpen}
        title={`نموذج ${shortWindowTitle(kindTitle)}`}
        zIndex={zIndex + 5}
        templates={invoiceTemplates}
        selectedId={selectedTplId}
        customAccounts={customAccounts}
        costCenters={costCenters}
        warehouses={warehouses}
        currencies={currencies}
        reportTemplates={reportTemplates}
        users={users}
        materialGroups={materialGroups}
        employees={employees}
        onFocus={onFocus}
        onClose={() => setTplPickerOpen(false)}
        onSelectTemplate={applyTemplate}
        onSaveTemplates={onSaveInvoiceTemplates}
        onShowMsg={onShowMsg}
        onNotify={onNotify}
      />
    </>
  );
};
