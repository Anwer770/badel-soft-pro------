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
}

export interface InvoiceRecord {
  id: string;
  kind: string;
  number: string;
  date: string;
  party: string;
  currency: string;
  notes: string;
  items: InvoiceLineItem[];
  total: number;
  profit: number;
  by: string;
  posted?: boolean;
  postedAt?: string;
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

export interface ErpState {
  currentUser: string;
  activeBranch: string;
  users: ErpUser[];
  companies: CompanyRecord[];
  years: YearRecord[];
  journal: JournalEntry[];
  journalOptions: JournalOptionsState;
  reportTemplates: ReportTemplateItem[];
  invoices: InvoiceRecord[];
  importedMaterials: ImportedMaterialItem[];
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
