import type {
  AccountOptionsState,
  ErpState,
  GeneralPropsState,
  PermCategoryKey,
  SectionKey,
} from '../types/erp';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toAr(value: string | number): string {
  return String(value).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

export function toEn(value: string): string {
  return String(value).replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

export const MENU_SECTIONS: {
  title: SectionKey;
  toolbarLabel: string;
  items?: string[];
  panel?: SectionKey;
}[] = [
  { title: 'الملف', toolbarLabel: 'الملف', panel: 'الملف' },
  { title: 'الفواتير', toolbarLabel: 'الفواتير', panel: 'الفواتير' },
  { title: 'الحسابات', toolbarLabel: 'الحسابات', panel: 'الحسابات' },
  { title: 'القيود', toolbarLabel: 'القيود', panel: 'القيود' },
  { title: 'المواد', toolbarLabel: 'المواد', panel: 'المواد' },
  { title: 'شؤون الموظفين', toolbarLabel: 'شؤون\nالموظفين', panel: 'شؤون الموظفين' },
  { title: 'تقارير الحسابات', toolbarLabel: 'تقارير\nالحسابات', panel: 'تقارير الحسابات' },
  { title: 'تقارير المواد', toolbarLabel: 'تقارير المواد', panel: 'تقارير المواد' },
  { title: 'تقارير ختامية', toolbarLabel: 'تقارير ختامية', panel: 'تقارير ختامية' },
  {
    title: 'الاعدادات',
    toolbarLabel: 'الاعدادات',
    panel: 'الاعدادات',
    items: [
      'الاعدادات العامة',
      'صلاحيات المستخدمين',
      'خيارات الحسابات العامة',
      'تنبيهات النظام',
      'بيانات الشركات والسنوات',
    ],
  },
  {
    title: 'ادوات',
    toolbarLabel: 'الأدوات',
    panel: 'ادوات',
    items: [
      'الاستوديو الذكي للصور والمستندات',
      'التقرير العام',
      'قائمة العملات',
      'فحص النظام',
      'إعداد نماذج الطباعة',
    ],
  },
];

export const PERM_TABS: { key: PermCategoryKey; label: string }[] = [
  { key: 'emp', label: 'شؤون الموظفين' },
  { key: 'acc', label: 'المحاسبه' },
  { key: 'mat', label: 'المواد' },
  { key: 'gen', label: 'صلاحيات عامة' },
  { key: 'oth', label: 'صلاحيات اخرى' },
  { key: 'guide', label: 'صلاحيات الدليل' },
];

export const PERMS_DATA: Record<PermCategoryKey, [number, string][]> = {
  emp: [
    [15, 'اضافة جهاز جديد'],
    [16, 'تعديل جهاز'],
    [17, 'حذف جهاز البصمة'],
    [18, 'جدول اجور جديد'],
    [19, 'استعراض جدول الأجور'],
    [20, 'تعديل جدول الأجور'],
    [21, 'حذف جدول الأجور'],
    [22, 'اضافة سلفة نقدية'],
    [23, 'استعراض السلف النقدية'],
    [24, 'تعديل سلفة نقدية'],
    [25, 'حذف سلفة نقدية'],
    [26, 'اضافة عقوبة جديدة'],
    [27, 'استعراض العقوبات'],
    [28, 'تعديل عقوبة'],
    [29, 'حذف عقوبة'],
    [30, 'تقرير تفصيلي للدوام'],
    [31, 'اضافة إجازة جديدة'],
    [32, 'استعراض الإجازات'],
    [33, 'تعديل إجازة'],
    [34, 'حذف إجازة'],
  ],
  acc: [
    [1, 'فتح فترة مالية'],
    [2, 'إغلاق فترة مالية'],
    [3, 'ادخال قيد يومي'],
    [4, 'تعديل قيد يومي'],
    [5, 'حذف قيد يومي'],
    [6, 'استعراض القيود'],
    [7, 'ترحيل القيود'],
    [8, 'ميزان المراجعة'],
    [9, 'تقرير الحسابات العامة'],
    [10, 'سند قبض'],
    [11, 'سند صرف'],
    [12, 'قيد افتتاحي'],
    [13, 'تسوية بنكية'],
    [14, 'اقفال سنوي'],
  ],
  mat: [
    [35, 'تعريف مادة جديدة'],
    [36, 'تعديل مادة'],
    [37, 'حذف مادة'],
    [38, 'استعراض المواد'],
    [39, 'فاتورة شراء'],
    [40, 'تعديل فاتورة شراء'],
    [41, 'حذف فاتورة شراء'],
    [42, 'فاتورة مبيع'],
    [43, 'تعديل فاتورة مبيع'],
    [44, 'حذف فاتورة مبيع'],
    [45, 'جرد المخازن'],
    [46, 'تحويل بين المخازن'],
    [47, 'تقرير حركة مادة'],
    [48, 'تقرير أرصدة المواد'],
    [49, 'تعريف مخزن جديد'],
    [50, 'حذف مخزن'],
  ],
  gen: [
    [51, 'الدخول الى الاعدادات'],
    [52, 'تعديل الصلاحيات'],
    [53, 'اضافة مستخدم'],
    [54, 'حذف مستخدم'],
    [55, 'خيارات الحسابات'],
    [56, 'نسخة احتياطية'],
    [57, 'استعادة نسخة'],
    [58, 'تغيير الفترة المالية'],
    [59, 'الترويسة والشعار'],
    [60, 'اغلاق النظام'],
  ],
  oth: [
    [61, 'تقارير ختامية'],
    [62, 'طباعة تقارير ختامية'],
    [63, 'تقارير المواد'],
    [64, 'طباعة تقارير المواد'],
    [65, 'تقارير الحسابات'],
    [66, 'طباعة تقارير الحسابات'],
    [67, 'تقارير الموظفين'],
    [68, 'طباعة تقارير الموظفين'],
    [69, 'تصدير Excel'],
    [70, 'تصدير PDF'],
  ],
  guide: [
    [71, 'استعراض الدليل'],
    [72, 'اضافة موضوع'],
    [73, 'تعديل موضوع'],
    [74, 'حذف موضوع'],
    [75, 'طباعة الدليل'],
  ],
};

export interface AccountOptionFieldDef {
  key: string;
  label: string;
  defaultCode: string;
  defaultName: string;
}

export const ACCOUNT_OPTION_GROUPS_RIGHT: AccountOptionFieldDef[][] = [
  [
    { key: 'sales', label: 'المبيعات الافتراضي', defaultCode: '411', defaultName: 'المبيعات' },
    { key: 'sret', label: 'مردود المبيعات', defaultCode: '312', defaultName: 'مردودات المبيعات' },
    { key: 'cust', label: 'حساب الزبائن', defaultCode: '122', defaultName: 'الزبائن' },
    { key: 'sup', label: 'حساب الموردين', defaultCode: '221', defaultName: 'الموردون' },
  ],
  [
    { key: 'cash', label: 'حساب النقدية الافتراضي', defaultCode: '12301', defaultName: 'الصندوق' },
    { key: 'chkO', label: 'حساب شيكات الصادرة', defaultCode: '', defaultName: '' },
    { key: 'chkI', label: 'حساب الشيكات الواردة', defaultCode: '', defaultName: '' },
  ],
  [
    { key: 'dscA', label: 'الخصم الممنوح', defaultCode: '313', defaultName: 'الخصم الممنوح به' },
    { key: 'dscE', label: 'الخصم المكتسب', defaultCode: '412', defaultName: 'الخصم المكتسب' },
  ],
  [
    { key: 'prof', label: 'حساب الأرباح', defaultCode: '211021', defaultName: 'ارباح' },
    { key: 'cur', label: 'حساب فروق عملة', defaultCode: '', defaultName: '' },
  ],
];

export const ACCOUNT_OPTION_GROUP_LEFT: AccountOptionFieldDef[] = [
  { key: 'ins', label: 'تبعية حساب شركات التأمين', defaultCode: '', defaultName: '' },
  { key: 'pat', label: 'تبعية حساب المرضى', defaultCode: '', defaultName: '' },
  { key: 'mem', label: 'تبعية حساب الذاكرة', defaultCode: '', defaultName: '' },
  { key: 'emp2', label: 'تبعية حساب الموظفين', defaultCode: '', defaultName: '' },
  { key: 'sal', label: 'تبعية رواتب الموظفين', defaultCode: '', defaultName: '' },
  { key: 'adv', label: 'حساب سلف الموظفين', defaultCode: '', defaultName: '' },
  { key: 'add', label: 'حساب الاضافات', defaultCode: '', defaultName: '' },
  { key: 'pen', label: 'حساب العقوبات', defaultCode: '32201', defaultName: 'عقوبات مالية' },
  { key: 'abs', label: 'حساب الغياب والتأخير', defaultCode: '32202', defaultName: 'غياب وتأخير' },
  { key: 'net', label: 'حساب دفع صافي رواتب الموظفين', defaultCode: '', defaultName: '' },
  { key: 'exp', label: 'حساب مقابل المصاريف', defaultCode: '1210301', defaultName: 'مستودع1' },
];

export const SYSTEM_ALERTS_LIST = [
  'التنبيه عند انخفاض رصيد مادة عن الحد الأدنى',
  'التنبيه عند انتهاء صلاحية المواد',
  'التنبيه عند وجود شيكات مستحقة',
  'التنبيه عند عمل نسخة احتياطية',
  'التنبيه عند دخول مستخدم جديد',
  'تنبيه إغلاق الفترة المالية',
];

export const PRINTERS_LIST = [
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

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

export const BACKUP_FOLDER_TREE: FolderNode = {
  name: 'الكمبيوتر',
  path: '',
  children: [
    {
      name: 'القرص المحلي (C:)',
      path: 'C:',
      children: [
        { name: 'Program Files', path: 'C:\\Program Files', children: [] },
        { name: 'Users', path: 'C:\\Users', children: [] },
        { name: 'Windows', path: 'C:\\Windows', children: [] },
      ],
    },
    {
      name: 'القرص المحلي (D:)',
      path: 'D:',
      children: [
        {
          name: 'Accounts_Secure',
          path: 'D:\\Accounts_Secure',
          children: [
            { name: 'backup', path: 'D:\\Accounts_Secure\\backup', children: [] },
            { name: 'data', path: 'D:\\Accounts_Secure\\data', children: [] },
          ],
        },
        { name: 'Reports', path: 'D:\\Reports', children: [] },
      ],
    },
  ],
};

export const DEFAULT_PROPS: GeneralPropsState = {
  dbType: 'SQL Server',
  serverName: 'DESKTOP-RNJ1CCU',
  pcName: 'DESKTOP-RNJ1CCU',
  dbName: 'dbBillEAccount',
  company: 'النظام',
  admin: 'admin',
  password: '1',
  modules: {
    الحسابات: true,
    'ادارة فندق': false,
    تصنيع: false,
    المطاعم: false,
    المخازن: true,
    'شؤون الموظفين': true,
    'فواتير المياه والكهرباء': false,
    'العيادات والمراكز الطبية': false,
  },
  backupPath: 'D:\\Accounts_Secure\\backup',
  backupForce: false,
  backupNoAlert: false,
  backupOnStart: false,
  backupOnClose: false,
  year: 2026,
  dateFrom: '2026/01/01',
  dateTo: '2026/12/31',
  fiscalRule: 0,
  sharedHeader: false,
  centerHeader: true,
  hdrArName: 'شركة بديل سوفت للأنظمة المحاسبية',
  hdrArAddr: 'صنعاء - شارع الزبيري',
  hdrArTel: '771337032',
  hdrEnName: 'Badel Soft Pro ERP',
  hdrEnAddr: 'Sanaa - Al-Zubairi St.',
  hdrEnTel: '+967 771337032',
  logoData: null,
  logoName: '',
  logoWidth: 300,
  logoHeight: 200,
  taxNumber: '',
  debitTerm: 'المدين',
  creditTerm: 'الدائن',
  showMenus: true,
  showTiles: true,
  withdrawPercent: 100,
  linkWithdrawAttendance: false,
  useEInvoice: false,
  allowNegativeStock: false,
  noFractionalQty: false,
  requireExpiryDate: false,
  blockSaveInsufficientExpiry: false,
  blockSaveExpired: false,
  integratedSecurity: false,
  inventoryMethod: 'periodic',
};

export function createDefaultAccountOptions(): AccountOptionsState {
  const accounts: Record<string, { code: string; name: string }> = {};
  for (const grp of ACCOUNT_OPTION_GROUPS_RIGHT) {
    for (const row of grp) {
      accounts[row.key] = { code: row.defaultCode, name: row.defaultName };
    }
  }
  for (const row of ACCOUNT_OPTION_GROUP_LEFT) {
    accounts[row.key] = { code: row.defaultCode, name: row.defaultName };
  }
  return {
    accounts,
    autoCurrencyDiff: false,
    defaultPrinter: 'بلا',
    inventoryPricing: 'السعر الوسطي (الكلفة)',
    invoiceProfitCost: 'السعر الوسطي (الكلفة)',
  };
}

export const INITIAL_STATE: ErpState = {
  currentUser: 'admin',
  users: [
    {
      name: 'admin',
      pass: '1',
      acct: 'الحسابات',
      box: 'الصندوق الرئيسي',
      perms: {
        emp: PERMS_DATA.emp.map((p) => p[0]),
        acc: PERMS_DATA.acc.map((p) => p[0]),
        mat: PERMS_DATA.mat.map((p) => p[0]),
        gen: PERMS_DATA.gen.map((p) => p[0]),
        oth: PERMS_DATA.oth.map((p) => p[0]),
        guide: PERMS_DATA.guide.map((p) => p[0]),
      },
    },
  ],
  companies: [{ num: 1, name: 'النظام' }],
  years: [{ m: 1, year: '2026', next: '0', notes: 'السنة المالية الحالية' }],
  journal: [],
  props: DEFAULT_PROPS,
  accountOptions: createDefaultAccountOptions(),
  alerts: {
    0: true,
    1: true,
    2: true,
    3: false,
    4: false,
    5: true,
  },
  currencies: [
    { code: 'YER', name: 'ريال يمني', symbol: 'ر.ي', rate: 1, isBase: true },
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', rate: 140 },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$', rate: 530 },
  ],
};

export const STORAGE_KEY = 'badel_soft_pro_state_v1';

export function loadErpState(): ErpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<ErpState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      props: {
        ...DEFAULT_PROPS,
        ...(parsed.props || {}),
        modules: {
          ...DEFAULT_PROPS.modules,
          ...(parsed.props?.modules || {}),
        },
      },
      accountOptions: {
        ...createDefaultAccountOptions(),
        ...(parsed.accountOptions || {}),
        accounts: {
          ...createDefaultAccountOptions().accounts,
          ...(parsed.accountOptions?.accounts || {}),
        },
      },
      alerts: {
        ...INITIAL_STATE.alerts,
        ...(parsed.alerts || {}),
      },
      users: parsed.users?.length ? parsed.users : INITIAL_STATE.users,
      companies: parsed.companies?.length ? parsed.companies : INITIAL_STATE.companies,
      years: parsed.years?.length ? parsed.years : INITIAL_STATE.years,
      journal: Array.isArray(parsed.journal) ? parsed.journal : [],
      currencies: parsed.currencies?.length ? parsed.currencies : INITIAL_STATE.currencies,
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function saveErpState(state: ErpState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
