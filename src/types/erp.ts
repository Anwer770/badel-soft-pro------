export type SectionKey =
  | 'الملف'
  | 'الفواتير'
  | 'الحسابات'
  | 'القيود'
  | 'المواد'
  | 'شؤون الموظفين'
  | 'تقارير الحسابات'
  | 'تقارير المواد'
  | 'تقارير ختامية'
  | 'الاعدادات'
  | 'ادوات';

export type PermCategoryKey = 'emp' | 'acc' | 'mat' | 'gen' | 'oth' | 'guide';

export interface ErpUser {
  name: string;
  pass: string;
  acct: string;
  box: string;
  perms: Partial<Record<PermCategoryKey, number[]>>;
}

export interface CompanyRecord {
  num: number;
  name: string;
}

export interface YearRecord {
  m: number;
  year: string;
  next: string;
  notes: string;
}

export interface JournalEntry {
  id: string;
  rec: string;
  pay: string;
  dhm: string;
  from: string;
  to: string;
  cur: string;
  stmt: string;
  doc: string;
  by: string;
  at: string;
  updatedBy?: string;
  updatedAt?: string;
  editCount?: number;
  posted?: boolean;
  postedAt?: string;
  voucherType?: 'opening' | 'entry' | 'receipt' | 'payment' | 'check' | 'commission' | 'cur_diff';
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface CustomAccountRecord {
  code: string;
  name: string;
  parentCode: string;
  kind: 'folder' | 'leaf';
  isAggregate?: boolean;
  phone?: string;
  address?: string;
  notes?: string;
  imageData?: string;
}

export interface CostCenterRecord {
  id: string;
  code: string;
  name: string;
  parentCode: string;
  notes: string;
}

export interface MaterialGroupRecord {
  id: string;
  code: string;
  name: string;
  parentCode: string;
  defaultUnit: string;
  taxRate: number;
  requireExpiry: boolean;
  notes: string;
}

export interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  location: string;
  keeper: string;
  notes: string;
}

export interface MaterialExpenseRecord {
  id: string;
  code: string;
  name: string;
  accountName: string;
  defaultAmount: number;
  notes: string;
}

export interface MaterialHandoverRecord {
  id: string;
  number: string;
  date: string;
  fromEmployee: string;
  toEmployee: string;
  warehouse: string;
  itemName: string;
  qty: number;
  status: 'مستلم' | 'مسلم' | 'قيد المراجعة';
  notes: string;
}

export interface MaterialDisposalRecord {
  id: string;
  number: string;
  date: string;
  warehouse: string;
  itemCode: string;
  itemName: string;
  qty: number;
  cost: number;
  reason: string;
  by: string;
}

export interface JournalOptionsState {
  sticky: {
    dhm: boolean;
    rec: boolean;
    pay: boolean;
    to: boolean;
    from: boolean;
    stmt: boolean;
  };
  columns: {
    showUser: boolean;
    showCreatedAt: boolean;
    showUpdatedBy: boolean;
    showUpdatedAt: boolean;
    showDoc: boolean;
    showEditCount: boolean;
  };
}

export interface ReportTemplateItem {
  id: string;
  name: string;
  reportType: string;
}

export interface AccountOptionPair {
  code: string;
  name: string;
}

export interface AccountOptionsState {
  accounts: Record<string, AccountOptionPair>;
  autoCurrencyDiff: boolean;
  defaultPrinter: string;
  inventoryPricing: string;
  invoiceProfitCost: string;
}

export interface GeneralPropsState {
  dbType: string;
  serverName: string;
  pcName: string;
  dbName: string;
  company: string;
  admin: string;
  password: string;
  modules: Record<string, boolean>;
  backupPath: string;
  backupForce: boolean;
  backupNoAlert: boolean;
  backupOnStart: boolean;
  backupOnClose: boolean;
  year: number;
  dateFrom: string;
  dateTo: string;
  fiscalRule: number;
  sharedHeader: boolean;
  centerHeader: boolean;
  hdrArName: string;
  hdrArAddr: string;
  hdrArTel: string;
  hdrEnName: string;
  hdrEnAddr: string;
  hdrEnTel: string;
  logoData: string | null;
  logoName: string;
  logoWidth: number;
  logoHeight: number;
  taxNumber: string;
  debitTerm: string;
  creditTerm: string;
  showMenus: boolean;
  showTiles: boolean;
  withdrawPercent: number;
  linkWithdrawAttendance: boolean;
  useEInvoice: boolean;
  allowNegativeStock: boolean;
  noFractionalQty: boolean;
  requireExpiryDate: boolean;
  blockSaveInsufficientExpiry: boolean;
  blockSaveExpired: boolean;
  integratedSecurity: boolean;
  inventoryMethod: 'periodic' | 'perpetual';
}

export interface CurrencyItem {
  code: string;
  name: string;
  foreignName?: string;
  symbol: string;
  subUnit?: string;
  rate: number;
  decimals?: number;
  minRate?: string;
  maxRate?: string;
  dualName?: string;
  pluralName?: string;
  gender?: 'ذكر' | 'انثى' | '';
  isBase?: boolean;
}

export interface InvoiceLineItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  cost: number;
  barcode?: string;
  bonus?: number;
  discPct?: number;
  discount?: number;
  expiryDate?: string;
}

export interface InvoiceRecord {
  id: string;
  kind: string;
  number: string;
  date: string;
  party: string;
  accountCode?: string;
  payType?: 'نقدي' | 'آجل' | 'شيك' | 'شبكة';
  docNumber?: string;
  address?: string;
  warehouse?: string;
  distributor?: string;
  costCenter?: string;
  discount?: number;
  tax?: number;
  expenses?: number;
  netTotal?: number;
  cashPaid?: number;
  networkPaid?: number;
  printTemplateName?: string;
  editCount?: number;
  printCount?: number;
  templateId?: string;
  currency: string;
  notes: string;
  items: InvoiceLineItem[];
  total: number;
  profit: number;
  by: string;
  posted?: boolean;
  postedAt?: string;
}

export interface InvoiceTemplateConfig {
  id: string;
  name: string;
  isDefault: boolean;
  general: {
    defaultPayType: '' | 'نقدي' | 'آجل';
    defaultPayCode: string;
    defaultCostCenter: string;
    useDefaultCustomer: boolean;
    defaultCustomer: string;
    useDefaultCashAccount: boolean;
    defaultCashAccount: string;
    useDefaultNetworkAccount: boolean;
    defaultNetworkAccount: string;
    useDefaultDiscountAccount: boolean;
    defaultDiscountAccount: string;
    useDefaultWarehouse: boolean;
    defaultWarehouse: string;
    useDefaultCurrency: boolean;
    defaultCurrency: string;
    creditLimitRule: boolean;
    creditLimitAmount: string;
    creditLimitAction: string;
    warnCustomerMax: boolean;
    warnItemMin: boolean;
    cashEqualsNet: boolean;
    warnNoExpiryStock: boolean;
    showPrevBalance: boolean;
    showDuePeriod: boolean;
    confirmSaveMsg: boolean;
    showExtraPayType: boolean;
    showMultiCustomersBtn: boolean;
    showBalanceWithTotal: boolean;
    preventSellAboveMax: boolean;
    showDoc: boolean;
    showName: boolean;
    showStatement: boolean;
    showDistributor: boolean;
    showSupplierBalance: boolean;
    showAddress: boolean;
    showTaxNumber: boolean;
  };
  columns: {
    showUnit: boolean;
    showBalance: boolean;
    showQty2: boolean;
    showBarcode: boolean;
    showQtyMainUnit: boolean;
    showQtyFirstUnit: boolean;
    showQtySecondUnit: boolean;
    showFactor: boolean;
    showLocation: boolean;
    showShortages: boolean;
    useMainUnitsOnly: boolean;
    showTotalRight: boolean;
    showBonus: boolean;
    showRowNotes: boolean;
    showExpiry: boolean;
    showItemSupplier: boolean;
    showItemType: boolean;
    showNetAmount: boolean;
    showRemainingBalance: boolean;
    showLength: boolean;
    showWidth: boolean;
    showHeight: boolean;
    showGross: boolean;
    showTestGrade: boolean;
    showLabName: boolean;
    showSerial1: boolean;
    showSerial2: boolean;
    showPoNumber: boolean;
    showPoBookNumber: boolean;
    showPriceAfterTax: boolean;
    showTotalAfterTax: boolean;
    showLocalTotal: boolean;
    showQtyWords: boolean;
    showCount: boolean;
    hideTotal: boolean;
    hideQty: boolean;
    extraSelect: string;
  };
  salesAndExpenses: {
    salesAccountMode: 'single' | 'perItem';
    defaultSalesAccount: string;
    showSalesAccount: boolean;
    expensesMode:
      | 'salesItems'
      | 'expenseAccounts'
      | 'singleExpense'
      | 'perLineExpense'
      | 'disabled';
    chargeSupplier: boolean;
    specificPayAccount: boolean;
    defaultExpenseAccount: string;
    offsetExpenseAccount: string;
    expenseCurrency: string;
  };
  discountsAndCommissions: {
    discountMode: 'disabled' | 'perItemSingle' | 'totalSingle';
    defaultDiscountAccount: string;
    showDiscountAccount: boolean;
    showDiscountPercent: boolean;
    showDiscountAmount: boolean;
    maxDiscountPercentEnabled: boolean;
    maxDiscountPercent: number;
    includeItemDiscount: boolean;
    includeCustomerDiscount: boolean;
    bonusDiscountModel: boolean;
    commissionMode: 'disabled' | 'perItemAccount' | 'perItemSingle' | 'totalSingle';
    defaultCommissionAccount: string;
    defaultSalesRep: string;
    showSalesRepAccount: boolean;
    showCommissionsAccount: boolean;
    chargeTotalAsCommission: boolean;
  };
  additional: {
    showCostCenters: boolean;
    lockDate: boolean;
    lockInvoiceNumber: boolean;
    lockBonus: boolean;
    lockWarehouse: boolean;
    lockPrice: boolean;
    allowEditTotal: boolean;
    warnDuplicateItem: boolean;
    requireRef: boolean;
    allowZeroInOutNote: boolean;
    showPriceForEdit: boolean;
    priceEditMode: string;
    updateCostOnMove: boolean;
    newRowOnEnter: boolean;
    noCashInCredit: boolean;
    showReturnBeforeOpening: boolean;
    appendEnterBarcode: boolean;
    linkLengthWidthUnit: boolean;
    linkQtyLengthWidthCount: boolean;
    multiplyTotalByDueDays: boolean;
    useInvoicePriceOnUnitSwitch: boolean;
  };
  extraTabs: {
    priceTier: string;
    pricePercentOffset?: number;
    belowPriceAction?: 'none' | 'warn' | 'block';
    belowPriceRef?: string;
    belowPricePercentOffset?: number;
    useUnitPriceOnSale?: boolean;
    useWholesaleForCredit?: boolean;
    autoSavePrice: boolean;
    searchMatchMode?: 'startsWith' | 'contains' | 'equals';
    searchByBarcode: boolean;
    searchByCode: boolean;
    searchByName: boolean;
    searchByForeignName?: boolean;
    searchByCardNo?: boolean;
    useExtendedItemSearch?: boolean;
    skipSubBarcodes?: boolean;
    searchBarcodeSubstring?: boolean;
    hideItemCode?: boolean;
    showItemForeignName?: boolean;
    propGroup?: boolean;
    propAgent?: boolean;
    propScientific?: boolean;
    propForm?: boolean;
    propCol?: boolean;
    propRow?: boolean;
    taxMode?: 'disabled' | 'perItemIndependent' | 'perItemSingle' | 'totalSingle';
    defaultTaxAccount?: string;
    showTaxAccount?: boolean;
    showTaxPercent?: boolean;
    showTaxAmount?: boolean;
    includeItemTaxRate?: boolean;
    skipTaxEntry?: boolean;
    enableTax: boolean;
    taxPercent: number;
    taxInclusive: boolean;
    allowedUsers: string;
    selectedUsers?: string[];
    medicalBatchMode: boolean;
    medicalTemplate?: boolean;
    medicalShowCount?: boolean;
    medicalAllowEditAfterTest?: boolean;
    scalePrefix: string;
    scaleWeightDigits: number;
    autoPrintOnSave: boolean;
    printCopies: number;
    rowHeight: number;
    zebraRows: boolean;
  };
  printProps?: InvoicePrintPropsConfig;
  tableColumns?: InvoiceTableColumnConfig[];
  scaleProps?: InvoiceScalePropsConfig;
  windowProps?: InvoiceWindowPropsConfig;
}

export interface InvoiceScalePropsConfig {
  isScaleItem: boolean;
  scaleItemPrefix: string;
  itemCodeDigits: string;
  priceOrQtyDigits: string;
  priceDecimalDigits: string;
  valueMode: 'price' | 'qty';
  scalePriceIncludesTax: boolean;
  fixQtyToOne: boolean;
}

export interface InvoiceTableFontConfig {
  fontFamily: string;
  fontStyle: 'Regular' | 'Bold' | 'Oblique' | 'Bold Oblique';
  fontSize: number;
  strikeout: boolean;
  underline: boolean;
  color: string;
  script: 'Western' | 'Arabic';
}

export interface InvoiceWindowPropsConfig {
  maximizeWindow: boolean;
  windowCaptionText: string;
  defaultGroup: string;
  showDefaultSectionOnly: boolean;
  tableFont: InvoiceTableFontConfig;
  windowBgColor: string;
  savePanelColor: string;
  itemsPanelCols: string;
  itemsPanelRows: string;
  dontFitAllColumns: boolean;
  useTemplateNameAsTitle: boolean;
  hideTopPanel: boolean;
  hideBottomPanel: boolean;
  hideAccountsPanel: boolean;
  showItemsPanelTiles: boolean;
  showNumbersPadTiles: boolean;
  showSaveButtonTiles: boolean;
  invoiceRowHeight: string;
  accountsRowHeight: string;
  saveButtonRowHeight: string;
}

export interface InvoicePrintPropsConfig {
  defaultPrinter: string;
  printer2: string;
  printTemplate: string;
  customerPrintTemplate: string;
  printOnSaveMode: '' | 'none' | 'prompt' | 'auto';
  singlePageOnly: boolean;
  noPrintDirectGroupInvoice: boolean;
  noPrintDepartmentInvoice: boolean;
  noPrintCustomerInvoice: boolean;
  showItemsInCustomerInvoice: boolean;
  groupTitle: string;
  lockAccountInCash: boolean;
  printSeparatePerDepartment: boolean;
}

export interface InvoiceTableColumnConfig {
  id: string;
  name: string;
  defaultWidth: number;
  altName: string;
  foreignName: string;
  width: string;
}

export interface ImportedMaterialItem {
  code: string;
  name: string;
  foreignName: string;
  barcode: string;
  qty: string;
  purchasePrice: string;
  mainUnit: string;
  maxLimit: string;
  minLimit: string;
  warehouse: string;
  unit1: string;
  unit2: string;
  expiryDate: string;
  groupCode?: string;
}

export interface LicenseState {
  productCode: string;
  licenseCode: string;
}

export type AppointmentRepeat = 'none' | 'daily' | 'weekly' | 'monthly30' | 'yearly';

export interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  text: string;
  location: string;
  notes: string;
  repeat: AppointmentRepeat;
  soundFile: string;
}

export interface EmployeeRecord {
  id: string;
  code: string;
  name: string;
  department: string;
  jobTitle: string;
  baseSalary: number;
  phone: string;
  hireDate: string;
  active: boolean;
}

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  manager: string;
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  status: 'حاضر' | 'متأخر' | 'غائب' | 'إجازة';
  notes: string;
}

export interface LeaveRecord {
  id: string;
  employeeName: string;
  leaveType: 'سنوية' | 'مرضية' | 'اضطرارية' | 'بدون راتب';
  fromDate: string;
  toDate: string;
  days: number;
  notes: string;
}

export interface HrAdjustmentRecord {
  id: string;
  kind: 'advance' | 'penalty' | 'bonus';
  date: string;
  employeeName: string;
  amount: number;
  reason: string;
}

export interface ErpState {
  currentUser: string;
  activeBranch: string;
  users: ErpUser[];
  companies: CompanyRecord[];
  years: YearRecord[];
  journal: JournalEntry[];
  journalOptions: JournalOptionsState;
  reportTemplates: ReportTemplateItem[];
  invoiceTemplates: InvoiceTemplateConfig[];
  invoices: InvoiceRecord[];
  importedMaterials: ImportedMaterialItem[];
  customAccounts: CustomAccountRecord[];
  costCenters: CostCenterRecord[];
  materialGroups: MaterialGroupRecord[];
  warehouses: WarehouseRecord[];
  materialExpenses: MaterialExpenseRecord[];
  handovers: MaterialHandoverRecord[];
  disposals: MaterialDisposalRecord[];
  employees: EmployeeRecord[];
  departments: DepartmentRecord[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  hrAdjustments: HrAdjustmentRecord[];
  license: LicenseState;
  props: GeneralPropsState;
  accountOptions: AccountOptionsState;
  alerts: Record<number, boolean>;
  alertDays?: { expiry: number; checks: number };
  currencies: CurrencyItem[];
  appointments: AppointmentItem[];
}

export interface ExtractedInvoiceData {
  vendorOrParty?: string;
  date?: string;
  documentNumber?: string;
  currency?: string;
  totalAmount?: string;
  entryType?: 'مقبوضات' | 'مدفوعات' | 'ذمم';
  suggestedDebitAccount?: string;
  suggestedCreditAccount?: string;
  statement?: string;
  itemsSummary?: string[];
}

export interface MsgButton {
  label: string;
  value: string;
  focus?: boolean;
}

export interface MsgConfig {
  title: string;
  text: string;
  icon?: 'info' | 'warn' | 'question';
  buttons?: MsgButton[];
}
