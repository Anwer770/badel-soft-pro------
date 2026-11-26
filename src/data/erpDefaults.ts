import type {
  AccountOptionsState,
  ErpState,
  GeneralPropsState,
  InvoicePrintPropsConfig,
  InvoiceScalePropsConfig,
  InvoiceTableColumnConfig,
  InvoiceTemplateConfig,
  InvoiceWindowPropsConfig,
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

export type MenuItemDef =
  | string
  | {
      label: string;
      shortcut?: string;
      children?: string[];
    };

export const MENU_SECTIONS: {
  title: SectionKey;
  toolbarLabel: string;
  items?: MenuItemDef[];
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
  {
    title: 'الفواتير',
    toolbarLabel: 'الفواتير',
    panel: 'الفواتير',
    items: [
      {
        label: 'ادخال فواتير جديدة',
        children: [
          'فاتورة مبيعات جديدة',
          'فاتورة مشتريات جديدة',
          'مردود مبيعات جديدة',
          'مردود مشتريات جديدة',
          'مذكرة ادخال جديدة',
          'مذكرة اخراج جديدة',
          'مذكرة نقل جديدة',
          'طلب شراء جديدة',
          'حجز مبيعات جديدة',
          'عرض أسعار',
        ],
      },
      {
        label: 'استعراض وتعديل الفواتير',
        children: [
          'استعراض وتعديل فاتورة مبيعات',
          'استعراض وتعديل فاتورة مشتريات',
          'استعراض وتعديل فاتورة مردود مبيعات',
          'استعراض وتعديل فاتورة مردود مشتريات',
          'استعراض وتعديل مذكرة ادخال',
          'استعراض وتعديل مذكرة اخراج',
          'استعراض وتعديل مذكرة نقل',
          'استعراض وتعديل طلب شراء',
          'استعراض وتعديل حجز مبيعات',
          'استعراض وتعديل عرض أسعار',
        ],
      },
      'مذكرة جرد إفتتاحي',
      'مذكرة جرد - تسوية مخزنية',
      'مذكرة جرد نهاية الفترة',
      'جرد فواتير',
      'تقرير ارباح الفواتير',
      'ارباح فواتير اليوم',
    ],
  },
  {
    title: 'الحسابات',
    toolbarLabel: 'الحسابات',
    panel: 'الحسابات',
    items: [
      'اضافة حساب جديد',
      'استعراض وتعديل الحسابات',
      'اضافة مجموعة حسابات فرعيه',
      'تعديل خصائص مجموعة حسابات فرعية',
      'نقل حساب',
      'شجرة الحسابات',
      'دليل الحسابات',
      'الحسابات التجميعيه',
      '---',
      'مراكز الكلفة',
      'استعراض صور العملاء والموردين',
    ],
  },
  {
    title: 'القيود',
    toolbarLabel: 'القيود',
    panel: 'القيود',
    items: [
      'القيد الإفتتاحي',
      { label: 'إدخال سند قيد جديد', shortcut: 'Alt+D' },
      'إستعراض وتعديل سندات قيد',
      { label: 'إدخال سند قبض جديد', shortcut: 'Alt+R' },
      'إستعراض وتعديل سندات القبض',
      { label: 'إدخال سند صرف جديد', shortcut: 'Alt+W' },
      'إستعراض وتعديل سندات الصرف',
      'عمولات نقدية من الموردين',
      'عمولات نقدية للزبائن',
      '---',
      {
        label: 'التدقيق والمراجعة',
        children: [
          'تحصيل شيك',
          'استعراض القيود المعدله',
          'استعراض القيود المحذوفه',
          'استعراض القيود المحشورة',
        ],
      },
      'استعراض قيود فروق العملة',
    ],
  },
  {
    title: 'المواد',
    toolbarLabel: 'المواد',
    panel: 'المواد',
    items: [
      'اضافة مادة جديدة',
      'استعراض وتعديل المواد',
      'اضافة مجموعة مواد',
      'تعديل المواصفات الأساسية لمجموعة مواد',
      'تعديل خصائص مشتركة لمجموعة مواد',
      'تعديل تسعيرات المواد',
      '---',
      'دليل المواد',
      'المواد الرئيسية',
      'المواد الإجمالية',
      '---',
      'المستودعات',
      '---',
      'المصاريف',
      'شجرة المواد',
      'طباعة لصقات المواد',
      'دورة استلام وتسليم',
      'تقرير الاستلام والتسليم',
    ],
  },
  {
    title: 'شؤون الموظفين',
    toolbarLabel: 'شؤون\nالموظفين',
    panel: 'شؤون الموظفين',
    items: [
      {
        label: 'الموظفين',
        children: ['اضافة موظف جديد', 'استعراض وتعديل الموظفين'],
      },
      'الاقسام',
      'ادارة الحضور',
      {
        label: 'التسجيل اليدوي',
        children: ['تسجيل حضور وانصراف يدوي', 'استعراض الحضور اليدوي'],
      },
      {
        label: 'الإجازات',
        children: ['اضافة إجازة جديدة', 'استعراض الإجازات'],
      },
      {
        label: 'الرواتب',
        children: ['جدول أجور جديد', 'استعراض جدول الأجور'],
      },
      {
        label: 'السلف',
        children: ['اضافة سلفة نقدية', 'استعراض السلف النقدية'],
      },
      {
        label: 'العقوبات',
        children: ['اضافة عقوبة جديدة', 'استعراض العقوبات'],
      },
      {
        label: 'الاضافات',
        children: ['اضافة إضافي / مكافأة', 'استعراض الاضافات'],
      },
      {
        label: 'تقارير تفصيليه',
        children: ['تقرير تفصيلي للدوام', 'تقرير الرواتب والمستحقات'],
      },
    ],
  },
  {
    title: 'تقارير الحسابات',
    toolbarLabel: 'تقارير\nالحسابات',
    panel: 'تقارير الحسابات',
    items: [
      'كشف حساب اجمالي',
      { label: 'كشف حساب تفصيلي', shortcut: 'Ctrl+X' },
      'اليومية العامة',
      'تقرير الحركة اليومية',
      { label: 'التقرير اليومي', shortcut: 'Ctrl+U' },
      'التقرير العام للعمليات',
      'تقرير مراكزالتكلفة',
      'تقارير سندات وشيكات القبض',
      'تقارير سندات وشيكات الصرف',
      'تقرير أعمار الذمم',
      'تقرير مستخدم',
      'تقرير خطة التحصيل/الدفع',
    ],
  },
  {
    title: 'تقارير المواد',
    toolbarLabel: 'تقارير المواد',
    panel: 'تقارير المواد',
    items: [
      'حركة مادة تفصيلي',
      'الحركة التفصيلية للمواد',
      {
        label: 'الحركة الإجمالية للمواد',
        children: ['الحركة الإجمالية للمواد', 'حركة المواد حسب المستودع'],
      },
      'جرد مواد تفصيلي',
      'صلاحية المواد',
      'استعراض المواد',
      'نواقص المواد والمتجاوزه الحد الدنى',
      'المواد المتجاوزه الحد الاعلى',
      'المواد عديمة الحركة',
      'تقرير بالكميات الاساسية',
      'تقرير الكفالات',
    ],
  },
  {
    title: 'تقارير ختامية',
    toolbarLabel: 'تقارير ختامية',
    panel: 'تقارير ختامية',
    items: [
      'ميزان المراجعة الشهرية',
      'ميزان المراجعة العامة',
      'الميزانية الافتتاحية',
      'الميزانية الحالية',
      'حساب التشغيل',
      'حساب المتاجرة',
      'حساب الأرباح والخسائر',
      'تقارير الحسابات الختامية',
      'تنظيم القيود الختامية',
      'استعراض القيود الختامية',
      'الميزانية الختاميه',
      'التهيه لدوره قادمه',
    ],
  },
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
  { id: 'rt-2', name: 'نموذج طباعة ١', reportType: 'فاتورة' },
  { id: 'rt-2b', name: 'نموذج مبيعات - تاريخ و% و خصم', reportType: 'فاتورة' },
  { id: 'rt-2c', name: 'نموذج مبيعات - تاريخ و خصم', reportType: 'فاتورة' },
  { id: 'rt-2d', name: 'نموذج مشتريات مع الملاحظة', reportType: 'فاتورة' },
  { id: 'rt-2e', name: 'نموذج نقل مخزني', reportType: 'فاتورة' },
  { id: 'rt-2f', name: 'نموذج طباعة ٥', reportType: 'فاتورة' },
  { id: 'rt-2g', name: 'نموذج المرتجع - بدون تاريخ', reportType: 'فاتورة' },
  { id: 'rt-2h', name: 'نموذج باقي المخزن العميل - بدون ترويسة', reportType: 'فاتورة' },
  { id: 'rt-2i', name: 'نموذج امر صرف - كامل', reportType: 'فاتورة' },
  { id: 'rt-2j', name: 'نموذج امر صرف - تاريخ و المرجع', reportType: 'فاتورة' },
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

export function createDefaultInvoiceTemplate(
  overrides?: Partial<InvoiceTemplateConfig>
): InvoiceTemplateConfig {
  return {
    id: overrides?.id || 'inv-tpl-1',
    name: overrides?.name || 'نموذج مبيعات ١',
    isDefault: overrides?.isDefault ?? true,
    general: {
      defaultPayType: 'آجل',
      defaultPayCode: '',
      defaultCostCenter: '',
      useDefaultCustomer: false,
      defaultCustomer: '',
      useDefaultCashAccount: true,
      defaultCashAccount: 'الصندوق',
      useDefaultNetworkAccount: false,
      defaultNetworkAccount: '',
      useDefaultDiscountAccount: true,
      defaultDiscountAccount: 'الخصم المسموح به',
      useDefaultWarehouse: false,
      defaultWarehouse: '1',
      useDefaultCurrency: false,
      defaultCurrency: 'ريال يمني',
      creditLimitRule: false,
      creditLimitAmount: '',
      creditLimitAction: 'التنبية فقط',
      warnCustomerMax: false,
      warnItemMin: false,
      cashEqualsNet: false,
      warnNoExpiryStock: false,
      showPrevBalance: true,
      showDuePeriod: false,
      confirmSaveMsg: false,
      showExtraPayType: false,
      showMultiCustomersBtn: false,
      showBalanceWithTotal: false,
      preventSellAboveMax: false,
      showDoc: true,
      showName: true,
      showStatement: true,
      showDistributor: true,
      showSupplierBalance: true,
      showAddress: true,
      showTaxNumber: false,
      ...(overrides?.general || {}),
    },
    columns: {
      showUnit: true,
      showBalance: false,
      showQty2: false,
      showBarcode: false,
      showQtyMainUnit: false,
      showQtyFirstUnit: false,
      showQtySecondUnit: false,
      showFactor: false,
      showLocation: false,
      showShortages: false,
      showLineWarehouse: false,
      useMainUnitsOnly: false,
      showTotalRight: false,
      showBonus: false,
      showRowNotes: false,
      showExpiry: false,
      showItemSupplier: false,
      showItemType: false,
      showNetAmount: false,
      showRemainingBalance: false,
      showLength: false,
      showWidth: false,
      showHeight: false,
      showGross: false,
      showTestGrade: false,
      showLabName: false,
      showSerial1: false,
      showSerial2: false,
      showPoNumber: false,
      showPoBookNumber: false,
      showPriceAfterTax: false,
      showTotalAfterTax: false,
      showLocalTotal: false,
      showQtyWords: false,
      showCount: false,
      hideTotal: false,
      hideQty: false,
      extraSelect: '',
      ...(overrides?.columns || {}),
    },
    salesAndExpenses: {
      salesAccountMode: 'single',
      defaultSalesAccount: 'المبيعات',
      showSalesAccount: true,
      expensesMode: 'disabled',
      chargeSupplier: false,
      specificPayAccount: false,
      defaultExpenseAccount: '',
      offsetExpenseAccount: '',
      expenseCurrency: 'ريال يمني',
      ...(overrides?.salesAndExpenses || {}),
    },
    discountsAndCommissions: {
      discountMode: 'disabled',
      defaultDiscountAccount: 'الخصم المسموح به',
      showDiscountAccount: false,
      showDiscountPercent: true,
      showDiscountAmount: true,
      maxDiscountPercentEnabled: false,
      maxDiscountPercent: 0,
      includeItemDiscount: false,
      includeCustomerDiscount: false,
      bonusDiscountModel: false,
      commissionMode: 'disabled',
      defaultCommissionAccount: '',
      defaultSalesRep: '',
      showSalesRepAccount: false,
      showCommissionsAccount: false,
      chargeTotalAsCommission: false,
      ...(overrides?.discountsAndCommissions || {}),
    },
    additional: {
      showCostCenters: false,
      lockDate: false,
      lockInvoiceNumber: false,
      lockBonus: false,
      lockWarehouse: false,
      lockPrice: false,
      allowEditTotal: false,
      warnDuplicateItem: false,
      requireRef: false,
      allowZeroInOutNote: false,
      showPriceForEdit: false,
      priceEditMode: 'سعر البيع الافتراضي',
      updateCostOnMove: false,
      newRowOnEnter: true,
      noCashInCredit: false,
      showReturnBeforeOpening: false,
      appendEnterBarcode: false,
      linkLengthWidthUnit: false,
      linkQtyLengthWidthCount: false,
      multiplyTotalByDueDays: false,
      useInvoicePriceOnUnitSwitch: false,
      ...(overrides?.additional || {}),
    },
    extraTabs: {
      priceTier: 'سعر البيع',
      pricePercentOffset: 0,
      belowPriceAction: 'none',
      belowPriceRef: 'سعر البيع',
      belowPricePercentOffset: 0,
      useUnitPriceOnSale: false,
      useWholesaleForCredit: false,
      autoSavePrice: false,
      searchMatchMode: 'contains',
      searchByBarcode: true,
      searchByCode: true,
      searchByName: true,
      searchByForeignName: false,
      searchByCardNo: false,
      useExtendedItemSearch: false,
      skipSubBarcodes: false,
      searchBarcodeSubstring: false,
      hideItemCode: true,
      showItemForeignName: false,
      propGroup: false,
      propAgent: false,
      propScientific: false,
      propForm: false,
      propCol: false,
      propRow: false,
      taxMode: 'disabled',
      defaultTaxAccount: '',
      showTaxAccount: false,
      showTaxPercent: false,
      showTaxAmount: false,
      includeItemTaxRate: false,
      skipTaxEntry: false,
      enableTax: false,
      taxPercent: 0,
      taxInclusive: false,
      allowedUsers: 'الجميع',
      selectedUsers: [],
      medicalBatchMode: false,
      medicalTemplate: false,
      medicalShowCount: false,
      medicalAllowEditAfterTest: false,
      scalePrefix: '21',
      scaleWeightDigits: 5,
      autoPrintOnSave: false,
      printCopies: 1,
      rowHeight: 26,
      zebraRows: true,
      ...(overrides?.extraTabs || {}),
    },
    printProps: {
      ...DEFAULT_INVOICE_PRINT_PROPS,
      ...(overrides?.printProps || {}),
    },
    tableColumns: overrides?.tableColumns?.length
      ? overrides.tableColumns
      : DEFAULT_INVOICE_TABLE_COLUMNS.map((c) => ({ ...c })),
    scaleProps: {
      ...DEFAULT_INVOICE_SCALE_PROPS,
      ...(overrides?.scaleProps || {}),
    },
    windowProps: {
      ...DEFAULT_INVOICE_WINDOW_PROPS,
      ...(overrides?.windowProps || {}),
      tableFont: {
        ...DEFAULT_INVOICE_WINDOW_PROPS.tableFont,
        ...(overrides?.windowProps?.tableFont || {}),
      },
    },
  };
}

export function createBlankInvoiceTemplate(id: string): InvoiceTemplateConfig {
  const base = createDefaultInvoiceTemplate({ id, name: '', isDefault: false });
  return {
    ...base,
    name: '',
    isDefault: false,
    general: {
      ...base.general,
      defaultPayType: '',
      defaultPayCode: '',
      defaultCostCenter: '',
      useDefaultCustomer: false,
      defaultCustomer: '',
      useDefaultCashAccount: false,
      defaultCashAccount: 'الصندوق',
      useDefaultNetworkAccount: false,
      defaultNetworkAccount: '',
      useDefaultDiscountAccount: false,
      defaultDiscountAccount: '',
      useDefaultWarehouse: false,
      defaultWarehouse: '',
      useDefaultCurrency: false,
      defaultCurrency: 'ريال يمني',
      creditLimitRule: false,
      creditLimitAmount: '',
      creditLimitAction: '',
      showDoc: false,
      showName: false,
      showStatement: false,
      showDistributor: false,
      showSupplierBalance: false,
      showAddress: false,
      showTaxNumber: false,
    },
    columns: {
      ...base.columns,
      showUnit: false,
      extraSelect: '',
    },
    salesAndExpenses: {
      ...base.salesAndExpenses,
      defaultSalesAccount: '',
      showSalesAccount: false,
    },
    discountsAndCommissions: {
      ...base.discountsAndCommissions,
      defaultDiscountAccount: '',
    },
    printProps: {
      ...DEFAULT_INVOICE_PRINT_PROPS,
      defaultPrinter: '',
      printer2: '',
      printTemplate: '',
      customerPrintTemplate: '',
      printOnSaveMode: '',
      groupTitle: 'فاتورة تجميع خاص بالمباشر',
    },
  };
}

export const DEFAULT_INVOICE_SCALE_PROPS: InvoiceScalePropsConfig = {
  isScaleItem: false,
  scaleItemPrefix: '',
  itemCodeDigits: '',
  priceOrQtyDigits: '',
  priceDecimalDigits: '',
  valueMode: 'price',
  scalePriceIncludesTax: false,
  fixQtyToOne: false,
};

export const DEFAULT_INVOICE_WINDOW_PROPS: InvoiceWindowPropsConfig = {
  maximizeWindow: false,
  windowCaptionText: '',
  defaultGroup: 'الكل',
  showDefaultSectionOnly: false,
  tableFont: {
    fontFamily: 'Tahoma',
    fontStyle: 'Bold',
    fontSize: 8,
    strikeout: false,
    underline: false,
    color: 'Black',
    script: 'Western',
  },
  windowBgColor: '#f0f0f0',
  savePanelColor: '#b8c4ff',
  itemsPanelCols: '',
  itemsPanelRows: '',
  dontFitAllColumns: false,
  useTemplateNameAsTitle: false,
  hideTopPanel: false,
  hideBottomPanel: false,
  hideAccountsPanel: false,
  showItemsPanelTiles: false,
  showNumbersPadTiles: false,
  showSaveButtonTiles: false,
  invoiceRowHeight: '',
  accountsRowHeight: '',
  saveButtonRowHeight: '',
};

export const DEFAULT_INVOICE_PRINT_PROPS: InvoicePrintPropsConfig = {
  defaultPrinter: '',
  printer2: '',
  printTemplate: 'نموذج طباعة ١',
  customerPrintTemplate: '',
  printOnSaveMode: 'none',
  singlePageOnly: false,
  noPrintDirectGroupInvoice: false,
  noPrintDepartmentInvoice: false,
  noPrintCustomerInvoice: false,
  showItemsInCustomerInvoice: false,
  groupTitle: 'فاتورة تجميع خاص بالمباشر',
  lockAccountInCash: false,
  printSeparatePerDepartment: false,
};

export const DEFAULT_SEARCH_ACCOUNTS: { code: string; name: string }[] = [
  { code: '1210301', name: 'مستودع ١' },
  { code: '1220001', name: 'زبون١' },
  { code: '123', name: 'الصناديق' },
  { code: '12301', name: 'الصندوق' },
  { code: '124', name: 'البنوك' },
  { code: '1501', name: '.بضاعة أخر المدة' },
  { code: '21101001', name: '. رأس المال المقدم' },
  { code: '211021', name: 'ارباح' },
  { code: '21201001', name: 'مجمع اهلاك الاثاث والتجهيزات' },
  { code: '221001', name: 'مورد١' },
  { code: '311', name: 'مشتريات' },
  { code: '312', name: 'مردودات المبيعات' },
  { code: '313', name: 'الخصم المسموح به' },
  { code: '314', name: 'ادخال' },
  { code: '32001', name: '. بضاعة أول المده' },
  { code: '32101001', name: 'مرتبات وأجور' },
  { code: '32101002', name: 'مواصلات وتنقلات' },
  { code: '32101003', name: 'قرطاسية ومطبوعات' },
  { code: '32101004', name: 'تسهيلات' },
  { code: '41', name: 'ايرادات النشاط الجاري' },
  { code: '411', name: 'المبيعات' },
];

export const DEFAULT_INVOICE_TABLE_COLUMNS: InvoiceTableColumnConfig[] = [
  { id: 'del', name: 'حذف', defaultWidth: 26, altName: '', foreignName: '', width: '' },
  { id: 'code', name: 'الرمز', defaultWidth: 81, altName: 'الرمز', foreignName: '', width: '79' },
  { id: 'item', name: 'المادة', defaultWidth: 566, altName: 'المادة', foreignName: '', width: '547' },
  { id: 'warehouse', name: 'المستودع', defaultWidth: 53, altName: '', foreignName: '', width: '' },
  { id: 'itemType', name: 'نوع المادة', defaultWidth: 62, altName: '', foreignName: '', width: '' },
  { id: 'barcode', name: 'الباركود', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'location', name: 'الموقع', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'balance', name: 'الرصيد', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'length', name: 'الطول', defaultWidth: 38, altName: '', foreignName: '', width: '' },
  { id: 'width', name: 'العرض', defaultWidth: 38, altName: '', foreignName: '', width: '' },
  { id: 'count', name: 'العدد', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'qty', name: 'الكمية', defaultWidth: 102, altName: 'الكمية', foreignName: '', width: '99' },
  { id: 'qtyWords', name: 'الكمية كتابة', defaultWidth: 142, altName: '', foreignName: '', width: '' },
  { id: 'unit', name: 'الوحدة', defaultWidth: 117, altName: 'الوحدة', foreignName: '', width: '114' },
  { id: 'factor', name: 'عامل التحويل', defaultWidth: 38, altName: '', foreignName: '', width: '' },
  { id: 'bonus', name: 'البونص', defaultWidth: 107, altName: 'البونص', foreignName: '', width: '105' },
  { id: 'price', name: 'السعر', defaultWidth: 121, altName: 'السعر', foreignName: '', width: '117' },
  { id: 'total', name: 'الإجمالي', defaultWidth: 155, altName: 'الإجمالي', foreignName: '', width: '150' },
  { id: 'foreignItemName', name: 'الاسم الاجنبي', defaultWidth: 38, altName: '', foreignName: '', width: '' },
  { id: 'group', name: 'المجموعة', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'agent', name: 'الوكيل', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'scientificName', name: 'الاسم العلمي', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'form', name: 'الهيئة', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'column', name: 'العمود', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'row', name: 'الصف', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'accSal', name: 'accSal', defaultWidth: 5, altName: '', foreignName: '', width: '' },
  { id: 'taxPct', name: 'ن الضريبة', defaultWidth: 53, altName: '', foreignName: '', width: '' },
  { id: 'taxVal', name: 'قيمة الضريبة', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'shortages', name: 'النواقص', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'priceAfterTax', name: 'السعر بعد الضريبة', defaultWidth: 161, altName: '', foreignName: '', width: '' },
  { id: 'qtyMainUnit', name: 'الكمية بالوحدة الرئيسية', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'qtyFirstUnit', name: 'الكمية بالوحدة الأولى', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'qtySecondUnit', name: 'الكمية بالوحدة الثانية', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'totalAfterTax', name: 'الإجمالي بعد الضريبة', defaultWidth: 161, altName: '', foreignName: '', width: '' },
  { id: 'localTotal', name: 'الإجمالي المحلي', defaultWidth: 161, altName: '', foreignName: '', width: '' },
  { id: 'discPct', name: 'ن الخصم', defaultWidth: 53, altName: 'ن الخصم', foreignName: '', width: '62' },
  { id: 'discount', name: 'الخصم', defaultWidth: 107, altName: 'الخصم', foreignName: '', width: '74' },
  { id: 'net', name: 'الصافي', defaultWidth: 161, altName: '', foreignName: '', width: '' },
  { id: 'commission', name: 'العمولة', defaultWidth: 38, altName: '', foreignName: '', width: '' },
  { id: 'qty2', name: 'كمية ثانية', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'expiryDate', name: 'تاريخ الصلاحية', defaultWidth: 161, altName: '', foreignName: '', width: '' },
  { id: 'supplier', name: 'المورد', defaultWidth: 84, altName: '', foreignName: '', width: '' },
  { id: 'discountAccount', name: 'حساب الخصم', defaultWidth: 84, altName: '', foreignName: '', width: '' },
  { id: 'commissionAccount', name: 'حساب العمولة', defaultWidth: 84, altName: '', foreignName: '', width: '' },
  { id: 'account', name: 'حساب', defaultWidth: 84, altName: '', foreignName: '', width: '' },
  { id: 'notes', name: 'الملاحظات', defaultWidth: 215, altName: '', foreignName: '', width: '' },
  { id: 'purchaseOrder', name: 'طلب الشراء', defaultWidth: 107, altName: '', foreignName: '', width: '' },
  { id: 'bookNumber', name: 'رقم الدفتر', defaultWidth: 53, altName: '', foreignName: '', width: '' },
  { id: 'reference', name: 'المرجع', defaultWidth: 38, altName: '', foreignName: '', width: '' },
];

export const DEFAULT_INVOICE_TEMPLATES: InvoiceTemplateConfig[] = [
  createDefaultInvoiceTemplate({
    id: 'inv-tpl-1',
    name: 'نموذج مبيعات ١',
    isDefault: true,
  }),
];

export const DEFAULT_PRINT_SETUP = {
  copies: 1,
  marginTop: 2,
  marginLeft: 2,
  marginBottom: 2,
  marginRight: 2,
  pageFrame: 'none' as const,
  tblHdrStyle: 'colors' as const,
  cellMarginTop: 2,
  cellMarginRight: 0.5,
  titleFont: 'Tahoma, 12pt',
  titleHeightRatio: 8,
  tableFont: 'Tahoma, 10pt',
  tableHeightRatio: 8,
  totalFont: 'Tahoma, 10pt, Bold',
  totalHeightRatio: 8,
  printDir: '',
  ltrTable: false,
  footerAfterTable: false,
  printTableColors: false,
  printer: '',
  specialTemplateName: 'نموذج التقرير العام',
  centerSpecialHeader: false,
  centerSpecialFooter: false,
  sharedTemplateName: 'نموذج ترويسة وتذيل مشترك',
  centerSharedHeader: false,
  centerSharedFooter: false,
  orderBySelected: false,
  showSerial: false,
  wrapItemName: false,
  selectedModel: 'form1',
};

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
  invoiceTemplates: DEFAULT_INVOICE_TEMPLATES,
  invoices: [],
  importedMaterials: [],
  customAccounts: [],
  costCenters: [
    { id: 'cc-1', code: 'CC-01', name: 'المركز الرئيسي', parentCode: '', notes: 'الإدارة العامة' },
    { id: 'cc-2', code: 'CC-02', name: 'قسم المبيعات والتوزيع', parentCode: 'CC-01', notes: '' },
  ],
  materialGroups: [
    {
      id: 'mg-1',
      code: '01',
      name: 'المواد الرئيسية',
      parentCode: '',
      defaultUnit: 'حبة',
      taxRate: 0,
      requireExpiry: false,
      notes: 'مجموعة افتراضية للمواد',
    },
    {
      id: 'mg-2',
      code: '02',
      name: 'مواد غذائية واستهلاكية',
      parentCode: '01',
      defaultUnit: 'كرتون',
      taxRate: 5,
      requireExpiry: true,
      notes: '',
    },
  ],
  warehouses: [
    {
      id: 'wh-1',
      code: '1',
      name: 'مستودع1',
      location: 'المقر الرئيسي',
      keeper: 'أمين المخزن',
      notes: 'المستودع الافتراضي',
    },
  ],
  materialExpenses: [
    {
      id: 'me-1',
      code: 'EXP-01',
      name: 'مصاريف نقل وشحن',
      accountName: 'مواصلات وتنقلات',
      defaultAmount: 0,
      notes: '',
    },
  ],
  handovers: [],
  disposals: [],
  employees: [
    {
      id: 'emp-1',
      code: '1001',
      name: 'أحمد محمد علي',
      department: 'الإدارة المالية',
      jobTitle: 'محاسب عام',
      baseSalary: 180000,
      phone: '771000111',
      hireDate: '2025-01-01',
      active: true,
    },
  ],
  departments: [
    { id: 'dep-1', code: 'D-01', name: 'الإدارة المالية', manager: 'أحمد محمد علي', notes: '' },
    { id: 'dep-2', code: 'D-02', name: 'المبيعات والمخازن', manager: 'admin', notes: '' },
  ],
  attendance: [],
  leaves: [],
  hrAdjustments: [],
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
  inventorySheets: [],
  printSetup: DEFAULT_PRINT_SETUP,
  designerSections: {
    headerFirst: { rows: [], font: 'Tahoma, 10pt' },
    headerRest: { rows: [], font: 'Tahoma, 10pt' },
    footerRest: { rows: [], font: 'Tahoma, 10pt' },
    footerLast: { rows: [], font: 'Tahoma, 10pt' },
  },
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
export const STORAGE_VERSION = 3;
const STORAGE_VERSION_KEY = 'badel_soft_pro_state_version';

export function loadErpState(): ErpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<ErpState>;
    const storedVersion = Number(localStorage.getItem(STORAGE_VERSION_KEY) || '1');
    let invoiceTemplates = parsed.invoiceTemplates?.length
      ? parsed.invoiceTemplates
      : DEFAULT_INVOICE_TEMPLATES;
    if (storedVersion < 3) {
      // ترقية: مطابقة أعمدة شاشة الفاتورة الافتراضية للنموذج الأصلي
      // (الرمز والوحدة والسعر والإجمالي فقط) دون المساس بالنماذج المخصصة.
      invoiceTemplates = invoiceTemplates.map((t) => {
        if (!t.isDefault) return t;
        const cols = t.columns || ({} as InvoiceTemplateConfig['columns']);
        const disc =
          t.discountsAndCommissions || ({} as InvoiceTemplateConfig['discountsAndCommissions']);
        const extra = t.extraTabs || ({} as InvoiceTemplateConfig['extraTabs']);
        const general = t.general || ({} as InvoiceTemplateConfig['general']);
        return {
          ...t,
          general: {
            ...general,
            showPrevBalance: general.showPrevBalance === false ? true : general.showPrevBalance,
            showAddress: general.showAddress === false ? true : general.showAddress,
          },
          columns: {
            ...cols,
            showUnit: true,
            showBarcode: false,
            showBonus: false,
            showExpiry: false,
            showLineWarehouse: false,
          },
          discountsAndCommissions: {
            ...disc,
            showDiscountPercent: false,
            showDiscountAmount: false,
          },
          extraTabs: {
            ...extra,
            hideItemCode: false,
          },
        };
      });
    }
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
      invoiceTemplates,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      importedMaterials: Array.isArray(parsed.importedMaterials) ? parsed.importedMaterials : [],
      customAccounts: Array.isArray(parsed.customAccounts) ? parsed.customAccounts : [],
      costCenters: Array.isArray(parsed.costCenters) && parsed.costCenters.length
        ? parsed.costCenters
        : INITIAL_STATE.costCenters,
      materialGroups: Array.isArray(parsed.materialGroups) && parsed.materialGroups.length
        ? parsed.materialGroups
        : INITIAL_STATE.materialGroups,
      warehouses: Array.isArray(parsed.warehouses) && parsed.warehouses.length
        ? parsed.warehouses
        : INITIAL_STATE.warehouses,
      materialExpenses: Array.isArray(parsed.materialExpenses) && parsed.materialExpenses.length
        ? parsed.materialExpenses
        : INITIAL_STATE.materialExpenses,
      handovers: Array.isArray(parsed.handovers) ? parsed.handovers : [],
      disposals: Array.isArray(parsed.disposals) ? parsed.disposals : [],
      employees: Array.isArray(parsed.employees) && parsed.employees.length
        ? parsed.employees
        : INITIAL_STATE.employees,
      departments: Array.isArray(parsed.departments) && parsed.departments.length
        ? parsed.departments
        : INITIAL_STATE.departments,
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      leaves: Array.isArray(parsed.leaves) ? parsed.leaves : [],
      hrAdjustments: Array.isArray(parsed.hrAdjustments) ? parsed.hrAdjustments : [],
      currencies: parsed.currencies?.length ? parsed.currencies : INITIAL_STATE.currencies,
      appointments: Array.isArray(parsed.appointments)
        ? parsed.appointments
        : INITIAL_STATE.appointments,
      inventorySheets: Array.isArray(parsed.inventorySheets) ? parsed.inventorySheets : [],
      printSetup: { ...DEFAULT_PRINT_SETUP, ...(parsed.printSetup || {}) },
      designerSections: {
        headerFirst:
          parsed.designerSections?.headerFirst || INITIAL_STATE.designerSections.headerFirst,
        headerRest:
          parsed.designerSections?.headerRest || INITIAL_STATE.designerSections.headerRest,
        footerRest:
          parsed.designerSections?.footerRest || INITIAL_STATE.designerSections.footerRest,
        footerLast:
          parsed.designerSections?.footerLast || INITIAL_STATE.designerSections.footerLast,
      },
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function saveErpState(state: ErpState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
