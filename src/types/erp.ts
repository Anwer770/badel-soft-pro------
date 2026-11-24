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
  symbol: string;
  rate: number;
  isBase?: boolean;
}

export interface ErpState {
  currentUser: string;
  users: ErpUser[];
  companies: CompanyRecord[];
  years: YearRecord[];
  journal: JournalEntry[];
  props: GeneralPropsState;
  accountOptions: AccountOptionsState;
  alerts: Record<number, boolean>;
  currencies: CurrencyItem[];
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
