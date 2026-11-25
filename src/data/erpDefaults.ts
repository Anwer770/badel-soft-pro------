import type {
  AccountOptionsState,
  ErpState,
  GeneralPropsState,
  JournalOptionsState,
  PermCategoryKey,
  ReportTemplateItem,
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
  {
    title: 'الملف',
    toolbarLabel: 'الملف',
    panel: 'الملف',
    items: [
      'اليومية العامة',
      'إضافة شركة جديدة',
      'تغير المستخدم',
      'تغير كلمة السر',
      '---',
      'عمل نسخة احتياطية',
      'استرجاع نسخة احتياطية',
      '---',
      'تعريف ترويسة / تذييل',
      '---',
      'اتصال',
      'قائمة الشركات',
      'استيراد من اكسل',
      'انهاء البرنامج',
    ],
  },
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
      'التقرير العام',
      'مراجعة الحركات',
      'ترحيل الحركة اليومية',
      'قائمة العملات',
      'تسجيل النظام',
      'فحص النظام',
      'مستعرض مواعيد اليوم',
      '---',
      'إعداد نماذج الطباعة',
      'الاستوديو الذكي للصور والمستندات',
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
    [0, 'اضافة موظف جديد'],
    [1, 'استعراض الموظفين'],
    [2, 'تعديل موظف'],
    [3, 'حذف موظف'],
    [4, 'اضافة قسم جديد'],
    [5, 'استعراض الاقسام'],
    [6, 'تعديل قسم'],
    [7, 'حذف قسم'],
    [8, 'فترات الدوام'],
    [9, 'تحديث بحسب الفترات الجديدة'],
    [10, 'تسجيل حضور وانصراف موظف يدوياً'],
    [11, 'اتصال'],
    [12, 'قراءة بيانات البصمة'],
    [13, 'مسح بيانات البصمة'],
    [14, 'اعدادت ادارة الحضور'],
    [15, 'اضافة جهاز جديد'],
    [16, 'تعديل جهاز البصمة'],
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
    { key: 'sup', label: 'حساب الموردين', defaultCode: '221', defaultName: 'الموردين' },
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
  { key: 'mem', label: 'تبعية حساب الدكاترة', defaultCode: '', defaultName: '' },
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
  'تنبه انتهاء تاريخ الصلاحية للمادة قبل',
  'تنبية بالشيكات المستحقة قبل',
  'تنبية عند البيع باقل من التكلفة',
  'التنبية عند حفظ الفاتورة',
  'التنبية عند حذف فاتورة',
  'التنبية عند حفظ القيد في اليومية العامة',
  'التنبية عند حذف القيد في اليومية العامة',
  'التنبية عند الخروج من البرنامج',
  'طلب كلمة المرور عند العودة من التصغير',
  'التنبيه بمواعيد الاستحقاق من العملاء',
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

export const DEFAULT_JOURNAL_OPTIONS: JournalOptionsState = {
  sticky: {
    dhm: false,
    rec: false,
    pay: true,
    to: false,
    from: false,
    stmt: true,
  },
  columns: {
    showUser: true,
    showCreatedAt: true,
    showUpdatedBy: false,
    showUpdatedAt: false,
    showDoc: false,
    showEditCount: false,
  },
};

export const DEFAULT_REPORT_TEMPLATES: ReportTemplateItem[] = [
  { id: 'rt-1', name: 'نموذج ترويسة وتذيل مشترك', reportType: 'ترويسة وتذيل مشترك' },
  { id: 'rt-2', name: 'نموذج ١', reportType: 'فاتورة' },
  { id: 'rt-3', name: 'نموذج حساب إجمالي', reportType: 'كشف حساب إجمالي' },
  { id: 'rt-4', name: 'نموذج الحسابات الختامية', reportType: 'حسابات ختامية' },
  { id: 'rt-5', name: 'نموذج قبض١', reportType: 'سند قبض' },
  { id: 'rt-6', name: 'كشف حساب تفصيلي', reportType: 'كشف حساب تفصيلي' },
  { id: 'rt-7', name: 'نموذج التقرير العام', reportType: 'تقرير عام' },
  { id: 'rt-8', name: 'نموذج كشف بالمواد الرئيسية', reportType: 'كشف مواد إجمالي' },
  { id: 'rt-9', name: 'نموذج صرف', reportType: 'سند صرف' },
  { id: 'rt-10', name: 'نموذج مواد تفصيلي', reportType: 'كشف مواد تفصيلي' },
  { id: 'rt-11', name: 'نموذج١', reportType: 'أمر تحميل' },
  { id: 'rt-12', name: 'نموذج قيد', reportType: 'قيد' },
  { id: 'rt-13', name: 'حسابات ختامية', reportType: 'حسابات ختامية' },
];

export const INITIAL_STATE: ErpState = {
  currentUser: 'admin',
  activeBranch: '1',
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
  companies: [
    { num: 1, name: 'النظام' },
    { num: 2, name: 'القيصر الذهبي - thalia' },
    { num: 3, name: 'القيصر' },
    { num: 4, name: 'العامري' },
  ],
  years: [{ m: 1, year: '2026', next: '0', notes: 'السنة المالية الحالية' }],
  journal: [],
  journalOptions: DEFAULT_JOURNAL_OPTIONS,
  reportTemplates: DEFAULT_REPORT_TEMPLATES,
  invoices: [],
  importedMaterials: [],
  license: {
    productCode: 'S1BCNSAG901734',
    licenseCode: 'qIOSfWU4V5nDqkmfRwj3V3G8pQzBHRduww==',
  },
  props: DEFAULT_PROPS,
  accountOptions: createDefaultAccountOptions(),
  alerts: {
    0: false,
    1: false,
    2: true,
    3: true,
    4: true,
    5: false,
    6: true,
    7: true,
    8: false,
    9: false,
  },
  alertDays: {
    expiry: 0,
    checks: 0,
  },
  currencies: [
    {
      code: 'YER',
      name: 'ريال يمني',
      foreignName: 'Yemeni Rial',
      symbol: 'ر ي',
      subUnit: 'فلس',
      rate: 1,
      decimals: 2,
      dualName: 'ريالان',
      pluralName: 'ريالات',
      gender: 'انثى',
      isBase: true,
    },
    {
      code: 'SAR',
      name: 'ريال سعودي',
      foreignName: 'Saudi Riyal',
      symbol: 'ر س',
      subUnit: 'فلس',
      rate: 120,
      decimals: 4,
      dualName: 'ريالان',
      pluralName: 'ريالات',
      gender: 'ذكر',
    },
    {
      code: 'USD',
      name: 'دولار',
      foreignName: 'US Dollar',
      symbol: '$',
      subUnit: 'سينت',
      rate: 491,
      decimals: 2,
      dualName: 'دولاران',
      pluralName: 'دولارات',
      gender: 'ذكر',
    },
  ],
  appointments: [
    {
      id: 'apt-1',
      date: '2026/11/24',
      time: '11:42:11 ص',
      text: 'مراجعة أرصدة الصناديق والبنوك',
      location: 'الإدارة المالية',
      notes: 'متابعة يومية',
      repeat: 'daily',
      soundFile: 'SaveOk.Wav',
    },
    {
      id: 'apt-2',
      date: '2026/11/28',
      time: '09:30:00 ص',
      text: 'سداد دفعة الموردين الشهرية',
      location: 'المكتب الرئيسي',
      notes: 'شيك مستحق',
      repeat: 'monthly30',
      soundFile: 'Attention.Wav',
    },
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
      activeBranch: parsed.activeBranch || INITIAL_STATE.activeBranch,
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
      alertDays: {
        expiry: parsed.alertDays?.expiry ?? 0,
        checks: parsed.alertDays?.checks ?? 0,
      },
      license: {
        ...INITIAL_STATE.license,
        ...(parsed.license || {}),
      },
      users: parsed.users?.length ? parsed.users : INITIAL_STATE.users,
      companies: parsed.companies?.length ? parsed.companies : INITIAL_STATE.companies,
      years: parsed.years?.length ? parsed.years : INITIAL_STATE.years,
      journal: Array.isArray(parsed.journal) ? parsed.journal : [],
      journalOptions: {
        sticky: {
          ...DEFAULT_JOURNAL_OPTIONS.sticky,
          ...(parsed.journalOptions?.sticky || {}),
        },
        columns: {
          ...DEFAULT_JOURNAL_OPTIONS.columns,
          ...(parsed.journalOptions?.columns || {}),
        },
      },
      reportTemplates: parsed.reportTemplates?.length
        ? parsed.reportTemplates
        : DEFAULT_REPORT_TEMPLATES,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      importedMaterials: Array.isArray(parsed.importedMaterials) ? parsed.importedMaterials : [],
      currencies: parsed.currencies?.length ? parsed.currencies : INITIAL_STATE.currencies,
      appointments: Array.isArray(parsed.appointments)
        ? parsed.appointments
        : INITIAL_STATE.appointments,
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
