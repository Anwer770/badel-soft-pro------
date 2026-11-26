import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccountOptionsDialog } from './components/AccountOptionsDialog';
import {
  AccountsOpsDialog,
  MaterialsOpsDialog,
  type AccountsOpsMode,
  type MaterialsOpsMode,
} from './components/AccountsAndMaterialsOpsDialogs';
import {
  AccTreeDialog,
  DetailedAccountStatementDialog,
} from './components/AccountsAndStatementDialogs';
import {
  CompanyPickerDialog,
  ExcelImportDialog,
  PasswordPromptDialog,
  SystemRegistrationDialog,
} from './components/AddedScreensDialogs';
import { AiStudioDialog } from './components/AiStudioDialog';
import { AlertsDialog } from './components/AlertsDialog';
import { BackupRestoreDialog, ReportsListDialog } from './components/BackupAndReportsDialogs';
import { CompaniesYearsDialog } from './components/CompaniesYearsDialog';
import { DesktopWorkspace } from './components/DesktopWorkspace';
import {
  HrOpsDialog,
  ReportsSuiteDialog,
  type HrOpsMode,
  type ReportSuiteMode,
} from './components/HrAndReportsOpsDialogs';
import { InvoicesDialog, type InvoicesModalLaunch } from './components/InvoicesDialog';
import { JournalDialog, type JournalModalLaunch } from './components/JournalDialog';
import { MenuAndToolbar } from './components/MenuAndToolbar';
import { MessageBox } from './components/MessageBox';
import { PermissionsDialog } from './components/PermissionsDialog';
import { PrintSetupDialog, SettingPagesDialog } from './components/PrintDialogs';
import { PropsDialog } from './components/PropsDialog';
import { StatusBar } from './components/StatusBar';
import {
  AppointmentsDialog,
  ChangePasswordDialog,
  SystemCheckDialog,
} from './components/SystemAndAppointmentsDialogs';
import { TitleBar } from './components/TitleBar';
import {
  CurrenciesDialog,
  GeneralReportDialog,
  PostDailyMovementDialog,
  SwitchUserDialog,
} from './components/ToolsDialogs';
import { UsersDialog } from './components/UsersDialog';
import { loadErpState, saveErpState } from './data/erpDefaults';
import type {
  ErpState,
  ErpUser,
  ExtractedInvoiceData,
  MsgConfig,
  ReportTemplateItem,
  SectionKey,
} from './types/erp';

type WindowId =
  | 'props'
  | 'users'
  | 'perms'
  | 'accountOptions'
  | 'alerts'
  | 'companies'
  | 'companiesPicker'
  | 'passwordPrompt'
  | 'systemRegistration'
  | 'excelImport'
  | 'invoices'
  | 'journal'
  | 'printSetup'
  | 'pagesSetup'
  | 'reportsList'
  | 'backupRestore'
  | 'accTree'
  | 'detailedStatement'
  | 'aiStudio'
  | 'currencies'
  | 'generalReport'
  | 'switchUser'
  | 'systemCheck'
  | 'appointments'
  | 'changePassword'
  | 'postDailyMovement'
  | 'accountsOps'
  | 'materialsOps'
  | 'hrOps'
  | 'reportsSuite';

const INVOICE_ACTION_META: Record<string, InvoicesModalLaunch> = {
  'inv:new_sales': { mode: 'editor', kindTitle: 'فاتورة مبيعات جديدة' },
  'inv:browse_sales': { mode: 'browse', kindTitle: 'استعراض وتعديل فاتورة مبيعات' },
  'inv:new_purchase': { mode: 'editor', kindTitle: 'فاتورة مشتريات جديدة' },
  'inv:browse_purchase': { mode: 'browse', kindTitle: 'استعراض وتعديل فاتورة مشتريات' },
  'inv:new_sales_return': { mode: 'editor', kindTitle: 'مردود مبيعات جديدة' },
  'inv:browse_sales_return': { mode: 'browse', kindTitle: 'استعراض وتعديل فاتورة مردود مبيعات' },
  'inv:new_purchase_return': { mode: 'editor', kindTitle: 'مردود مشتريات جديدة' },
  'inv:browse_purchase_return': { mode: 'browse', kindTitle: 'استعراض وتعديل فاتورة مردود مشتريات' },
  'inv:new_in_note': { mode: 'editor', kindTitle: 'مذكرة ادخال جديدة' },
  'inv:browse_in_note': { mode: 'browse', kindTitle: 'استعراض وتعديل مذكرة ادخال' },
  'inv:new_out_note': { mode: 'editor', kindTitle: 'مذكرة اخراج جديدة' },
  'inv:browse_out_note': { mode: 'browse', kindTitle: 'استعراض وتعديل مذكرة اخراج' },
  'inv:new_transfer': { mode: 'editor', kindTitle: 'مذكرة نقل جديدة' },
  'inv:browse_transfer': { mode: 'browse', kindTitle: 'استعراض وتعديل مذكرة نقل' },
  'inv:new_po': { mode: 'editor', kindTitle: 'طلب شراء جديدة' },
  'inv:browse_po': { mode: 'browse', kindTitle: 'استعراض وتعديل طلب شراء' },
  'inv:new_reserve': { mode: 'editor', kindTitle: 'حجز مبيعات جديدة' },
  'inv:browse_reserve': { mode: 'browse', kindTitle: 'استعراض وتعديل حجز مبيعات' },
  'inv:new_quote': { mode: 'editor', kindTitle: 'عرض أسعار' },
  'inv:browse_quote': { mode: 'browse', kindTitle: 'استعراض وتعديل عرض أسعار' },
  'inv:opening_inv': { mode: 'editor', kindTitle: 'مذكرة جرد إفتتاحي' },
  'inv:adjust_inv': { mode: 'editor', kindTitle: 'مذكرة جرد - تسوية مخزنية' },
  'inv:end_period_inv': { mode: 'editor', kindTitle: 'مذكرة جرد نهاية الفترة' },
  'inv:count_invoices': { mode: 'browse', kindTitle: 'جرد فواتير' },
  'inv:profit_report': { mode: 'profit', kindTitle: 'تقرير ارباح الفواتير' },
  'inv:today_profit': { mode: 'profit', kindTitle: 'ارباح فواتير اليوم' },
};

const JOURNAL_ACTION_META: Record<string, JournalModalLaunch> = {
  'jrn:opening': { mode: 'opening', title: 'القيد الإفتتاحي' },
  'jrn:new_entry': { mode: 'new_entry', title: 'إدخال سند قيد جديد' },
  'jrn:browse_entry': { mode: 'browse_entry', title: 'إستعراض وتعديل سندات قيد' },
  'jrn:new_receipt': { mode: 'new_receipt', title: 'إدخال سند قبض جديد' },
  'jrn:browse_receipt': { mode: 'browse_receipt', title: 'إستعراض وتعديل سندات القبض' },
  'jrn:new_payment': { mode: 'new_payment', title: 'إدخال سند صرف جديد' },
  'jrn:browse_payment': { mode: 'browse_payment', title: 'إستعراض وتعديل سندات الصرف' },
  'jrn:check_collect': { mode: 'check_collect', title: 'تحصيل شيك' },
  'jrn:comm_supplier': { mode: 'comm_supplier', title: 'عمولات نقدية من الموردين' },
  'jrn:comm_customer': { mode: 'comm_customer', title: 'عمولات نقدية للزبائن' },
  'jrn:edited': { mode: 'edited', title: 'استعراض القيود المعدله' },
  'jrn:deleted': { mode: 'deleted', title: 'استعراض القيود المحذوفه' },
  'jrn:gapped': { mode: 'gapped', title: 'استعراض القيود المحشورة' },
  'jrn:cur_diff': { mode: 'cur_diff', title: 'استعراض قيود فروق العملة' },
};

export default function App() {
  const [state, setState] = useState<ErpState>(() => loadErpState());
  const [activeSection, setActiveSection] = useState<SectionKey>('الاعدادات');
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeButtonKey, setActiveButtonKey] = useState<string | null>(null);
  const [minimizedShell, setMinimizedShell] = useState(false);
  const [isShutdown, setIsShutdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Window manager state
  const [openWindows, setOpenWindows] = useState<Record<WindowId, boolean>>({
    props: false,
    users: false,
    perms: false,
    accountOptions: false,
    alerts: false,
    companies: false,
    companiesPicker: false,
    passwordPrompt: false,
    systemRegistration: false,
    excelImport: false,
    invoices: false,
    journal: false,
    printSetup: false,
    pagesSetup: false,
    reportsList: false,
    backupRestore: false,
    accTree: false,
    detailedStatement: false,
    aiStudio: false,
    currencies: false,
    generalReport: false,
    switchUser: false,
    systemCheck: false,
    appointments: false,
    changePassword: false,
    postDailyMovement: false,
    accountsOps: false,
    materialsOps: false,
    hrOps: false,
    reportsSuite: false,
  });

  const [zOrder, setZOrder] = useState<Record<WindowId, number>>({
    props: 60,
    users: 60,
    perms: 62,
    accountOptions: 60,
    alerts: 60,
    companies: 60,
    companiesPicker: 64,
    passwordPrompt: 70,
    systemRegistration: 64,
    excelImport: 64,
    invoices: 62,
    journal: 55,
    printSetup: 64,
    pagesSetup: 68,
    reportsList: 65,
    backupRestore: 65,
    accTree: 64,
    detailedStatement: 64,
    aiStudio: 65,
    currencies: 60,
    generalReport: 60,
    switchUser: 62,
    systemCheck: 66,
    appointments: 66,
    changePassword: 68,
    postDailyMovement: 66,
    accountsOps: 64,
    materialsOps: 64,
    hrOps: 64,
    reportsSuite: 64,
  });
  const topZRef = useRef(72);

  const [propsInitialTab, setPropsInitialTab] = useState(0);
  const [editingUserIdx, setEditingUserIdx] = useState<number>(-1);
  const [aiInitialTab, setAiInitialTab] = useState<'generate' | 'analyze'>('generate');
  const [aiInitialMode, setAiInitialMode] = useState<'general' | 'invoice' | 'logo'>('general');
  const [aiInitialImage, setAiInitialImage] = useState<string | null>(null);
  const [journalPrefill, setJournalPrefill] = useState<ExtractedInvoiceData | null>(null);
  const [journalLaunch, setJournalLaunch] = useState<JournalModalLaunch>({
    mode: 'all',
    title: 'اليومية العامة',
  });
  const [accountsOpsMode, setAccountsOpsMode] = useState<AccountsOpsMode>('add');
  const [materialsOpsMode, setMaterialsOpsMode] = useState<MaterialsOpsMode>('add');
  const [hrOpsMode, setHrOpsMode] = useState<HrOpsMode>('employees');
  const [reportSuiteMode, setReportSuiteMode] = useState<ReportSuiteMode>('accSummary');
  const [backupMode, setBackupMode] = useState<'backup' | 'restore'>('backup');
  const [editingReportTpl, setEditingReportTpl] = useState<ReportTemplateItem | null>(null);
  const [creatingReportTpl, setCreatingReportTpl] = useState(false);
  const [reportPickerCallback, setReportPickerCallback] = useState<
    ((tpl: ReportTemplateItem) => void) | null
  >(null);
  const [invoiceLaunch, setInvoiceLaunch] = useState<InvoicesModalLaunch>({
    mode: 'editor',
    kindTitle: 'فاتورة مبيعات جديدة',
  });
  const pendingProtectedActionRef = useRef<(() => void) | null>(null);

  // MessageBox queue
  const [msgConfig, setMsgConfig] = useState<MsgConfig | null>(null);
  const msgResolverRef = useRef<((val: string) => void) | null>(null);

  const showMsg = useCallback((cfg: MsgConfig): Promise<string> => {
    return new Promise((resolve) => {
      msgResolverRef.current = resolve;
      setMsgConfig(cfg);
    });
  }, []);

  const handleMsgResolve = (value: string) => {
    setMsgConfig(null);
    msgResolverRef.current?.(value);
    msgResolverRef.current = null;
  };

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3200);
  }, []);

  useEffect(() => {
    saveErpState(state);
    document.title = `${state.props.company || 'النظام'} - Badel Soft Pro`;
  }, [state]);

  const focusWindow = useCallback((id: WindowId) => {
    topZRef.current += 1;
    setZOrder((prev) => ({ ...prev, [id]: topZRef.current }));
  }, []);

  const openWindow = useCallback(
    (id: WindowId) => {
      topZRef.current += 1;
      setZOrder((prev) => ({ ...prev, [id]: topZRef.current }));
      setOpenWindows((prev) => ({ ...prev, [id]: true }));
    },
    []
  );

  const closeWindow = useCallback((id: WindowId) => {
    setOpenWindows((prev) => ({ ...prev, [id]: false }));
  }, []);

  const runBackupDownload = (customPath?: string) => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`تم حفظ نسخة احتياطية (${customPath || state.props.backupPath})`);
  };

  const handleAction = useCallback(
    (actionKey: string) => {
      setActiveButtonKey(actionKey);
      if (actionKey.startsWith('inv:') && INVOICE_ACTION_META[actionKey]) {
        setInvoiceLaunch(INVOICE_ACTION_META[actionKey]);
        openWindow('invoices');
        return;
      }
      if (actionKey.startsWith('jrn:') && JOURNAL_ACTION_META[actionKey]) {
        setJournalLaunch(JOURNAL_ACTION_META[actionKey]);
        openWindow('journal');
        return;
      }
      if (actionKey.startsWith('acc:')) {
        setAccountsOpsMode(actionKey.slice(4) as AccountsOpsMode);
        openWindow('accountsOps');
        return;
      }
      if (actionKey.startsWith('mat:')) {
        setMaterialsOpsMode(actionKey.slice(4) as MaterialsOpsMode);
        openWindow('materialsOps');
        return;
      }
      if (actionKey.startsWith('hr:')) {
        setHrOpsMode(actionKey.slice(3) as HrOpsMode);
        openWindow('hrOps');
        return;
      }
      if (actionKey.startsWith('rep:')) {
        setReportSuiteMode(actionKey.slice(4) as ReportSuiteMode);
        openWindow('reportsSuite');
        return;
      }
      switch (actionKey) {
        case 'props':
          setPropsInitialTab(0);
          openWindow('props');
          break;
        case 'propsFiscal':
          setPropsInitialTab(2);
          openWindow('props');
          break;
        case 'propsOther':
          setPropsInitialTab(4);
          openWindow('props');
          break;
        case 'users':
          openWindow('users');
          break;
        case 'accountOptions':
          openWindow('accountOptions');
          break;
        case 'alerts':
          openWindow('alerts');
          break;
        case 'companies':
          openWindow('companies');
          break;
        case 'addCompany':
          void showMsg({
            title: 'تحذير',
            icon: 'warn',
            text: 'سيتم إغلاق الشركة الحالية هل تريد المتابعة ؟',
            buttons: [
              { label: 'OK', value: 'yes', focus: true },
              { label: 'Cancel', value: 'no' },
            ],
          }).then((res) => {
            if (res === 'yes') openWindow('companies');
          });
          break;
        case 'companiesPicker':
          void showMsg({
            title: 'تحذير',
            icon: 'warn',
            text: 'سيتم إغلاق الشركة الحالية هل تريد المتابعة ؟',
            buttons: [
              { label: 'OK', value: 'yes', focus: true },
              { label: 'Cancel', value: 'no' },
            ],
          }).then((res) => {
            if (res === 'yes') openWindow('companiesPicker');
          });
          break;
        case 'systemRegistration':
          openWindow('systemRegistration');
          break;
        case 'excelImport':
          openWindow('excelImport');
          break;
        case 'journal':
          setJournalLaunch({ mode: 'all', title: 'اليومية العامة' });
          openWindow('journal');
          break;
        case 'printSetup':
          openWindow('printSetup');
          break;
        case 'pagesSetup':
          setReportPickerCallback(null);
          openWindow('reportsList');
          break;
        case 'currencies':
          openWindow('currencies');
          break;
        case 'generalReport':
          openWindow('generalReport');
          break;
        case 'accTree':
          openWindow('accTree');
          break;
        case 'detailedStatement':
          openWindow('detailedStatement');
          break;
        case 'switchUser':
          void showMsg({
            title: 'تحذير',
            icon: 'warn',
            text: 'سيتم الخروج من المستخدم الحالي هل تريد المتابعة ؟',
            buttons: [
              { label: 'OK', value: 'yes', focus: true },
              { label: 'Cancel', value: 'no' },
            ],
          }).then((res) => {
            if (res === 'yes') openWindow('switchUser');
          });
          break;
        case 'aiStudioGenerate':
          setAiInitialTab('generate');
          setAiInitialMode('general');
          setAiInitialImage(null);
          openWindow('aiStudio');
          break;
        case 'aiStudioAnalyze':
          setAiInitialTab('analyze');
          setAiInitialMode('invoice');
          setAiInitialImage(null);
          openWindow('aiStudio');
          break;
        case 'backupNow':
          setBackupMode('backup');
          openWindow('backupRestore');
          break;
        case 'restoreBackup':
          setBackupMode('restore');
          openWindow('backupRestore');
          break;
        case 'exportJournalCsv':
          openWindow('journal');
          notify('افتح اليومية العامة واضغط «تصدير الى اكسل»');
          break;
        case 'contact':
          void showMsg({
            title: 'معلومات الاتصال - Badel Soft Pro',
            icon: 'info',
            text: 'اليمن: 771337032\nالسعودية: 0562998713\nالبريد الإلكتروني: info@badelsoft.com\nالموقع: www.badelsoft.com',
          });
          break;
        case 'systemCheck':
          openWindow('systemCheck');
          break;
        case 'appointments':
          openWindow('appointments');
          break;
        case 'changePassword':
          openWindow('changePassword');
          break;
        case 'reviewMovements':
          openWindow('generalReport');
          notify('مراجعة الحركات');
          break;
        case 'postDailyMovement':
          openWindow('postDailyMovement');
          break;
        case 'shutdown':
          if (state.alerts[7] === false) {
            setIsShutdown(true);
          } else {
            void showMsg({
              title: 'تنبية',
              icon: 'question',
              text: 'هل تريد الخروج من البرنامج',
              buttons: [
                { label: 'OK', value: 'yes', focus: true },
                { label: 'Cancel', value: 'no' },
              ],
            }).then((res) => {
              if (res === 'yes') setIsShutdown(true);
            });
          }
          break;
        default:
          break;
      }
    },
    [openWindow, showMsg, notify, state]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'F2' && !e.shiftKey) {
        e.preventDefault();
        handleAction('inv:new_sales');
      } else if (e.shiftKey && e.key === 'F2' && !e.ctrlKey) {
        e.preventDefault();
        handleAction('inv:browse_sales');
      } else if (e.ctrlKey && e.key === 'F1' && !e.shiftKey) {
        e.preventDefault();
        handleAction('inv:new_purchase');
      } else if (e.shiftKey && e.key === 'F1' && !e.ctrlKey) {
        e.preventDefault();
        handleAction('inv:browse_purchase');
      } else if (e.ctrlKey && e.shiftKey && e.key === 'F12') {
        e.preventDefault();
        handleAction('inv:new_transfer');
      } else if (e.shiftKey && e.key === 'F12' && !e.ctrlKey) {
        e.preventDefault();
        handleAction('inv:browse_transfer');
      } else if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        const lower = e.key.toLowerCase();
        if (lower === 'x') {
          e.preventDefault();
          handleAction('detailedStatement');
        } else if (lower === 'u') {
          e.preventDefault();
          handleAction('rep:dailyReport');
        }
      } else if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const lower = e.key.toLowerCase();
        if (lower === 'd') {
          e.preventDefault();
          handleAction('jrn:new_entry');
        } else if (lower === 'r') {
          e.preventDefault();
          handleAction('jrn:new_receipt');
        } else if (lower === 'w') {
          e.preventDefault();
          handleAction('jrn:new_payment');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAction]);

  const handleDropdownAction = (section: SectionKey, item: string) => {
    setActiveSection(section);
    const map: Record<string, string> = {
      'اليومية العامة': 'journal',
      'إضافة شركة جديدة': 'addCompany',
      'تغير المستخدم': 'switchUser',
      'تغير كلمة السر': 'changePassword',
      'عمل نسخة احتياطية': 'backupNow',
      'استرجاع نسخة احتياطية': 'restoreBackup',
      'تعريف ترويسة / تذييل': 'pagesSetup',
      اتصال: 'contact',
      'قائمة الشركات': 'companiesPicker',
      'استيراد من اكسل': 'excelImport',
      'انهاء البرنامج': 'shutdown',
      // الفواتير
      'فاتورة مبيعات جديدة': 'inv:new_sales',
      'فاتورة مشتريات جديدة': 'inv:new_purchase',
      'مردود مبيعات جديدة': 'inv:new_sales_return',
      'مردود مشتريات جديدة': 'inv:new_purchase_return',
      'مذكرة ادخال جديدة': 'inv:new_in_note',
      'مذكرة اخراج جديدة': 'inv:new_out_note',
      'مذكرة نقل جديدة': 'inv:new_transfer',
      'طلب شراء جديدة': 'inv:new_po',
      'حجز مبيعات جديدة': 'inv:new_reserve',
      'عرض أسعار': 'inv:new_quote',
      'استعراض وتعديل فاتورة مبيعات': 'inv:browse_sales',
      'استعراض وتعديل فاتورة مشتريات': 'inv:browse_purchase',
      'استعراض وتعديل فاتورة مردود مبيعات': 'inv:browse_sales_return',
      'استعراض وتعديل فاتورة مردود مشتريات': 'inv:browse_purchase_return',
      'استعراض وتعديل مذكرة ادخال': 'inv:browse_in_note',
      'استعراض وتعديل مذكرة اخراج': 'inv:browse_out_note',
      'استعراض وتعديل مذكرة نقل': 'inv:browse_transfer',
      'استعراض وتعديل طلب شراء': 'inv:browse_po',
      'استعراض وتعديل حجز مبيعات': 'inv:browse_reserve',
      'استعراض وتعديل عرض أسعار': 'inv:browse_quote',
      'مذكرة جرد إفتتاحي': 'inv:opening_inv',
      'مذكرة جرد - تسوية مخزنية': 'inv:adjust_inv',
      'مذكرة جرد نهاية الفترة': 'inv:end_period_inv',
      'جرد فواتير': 'inv:count_invoices',
      'تقرير ارباح الفواتير': 'inv:profit_report',
      'ارباح فواتير اليوم': 'inv:today_profit',
      // الحسابات
      'اضافة حساب جديد': 'acc:add',
      'استعراض وتعديل الحسابات': 'acc:browse',
      'اضافة مجموعة حسابات فرعيه': 'acc:addGroup',
      'تعديل خصائص مجموعة حسابات فرعية': 'acc:editGroup',
      'نقل حساب': 'acc:move',
      'شجرة الحسابات': 'accTree',
      'دليل الحسابات': 'acc:guide',
      'الحسابات التجميعيه': 'acc:aggregate',
      'مراكز الكلفة': 'acc:costCenters',
      'استعراض صور العملاء والموردين': 'acc:partyImages',
      // القيود
      'القيد الإفتتاحي': 'jrn:opening',
      'إدخال سند قيد جديد': 'jrn:new_entry',
      'إستعراض وتعديل سندات قيد': 'jrn:browse_entry',
      'إدخال سند قبض جديد': 'jrn:new_receipt',
      'إستعراض وتعديل سندات القبض': 'jrn:browse_receipt',
      'إدخال سند صرف جديد': 'jrn:new_payment',
      'إستعراض وتعديل سندات الصرف': 'jrn:browse_payment',
      'عمولات نقدية من الموردين': 'jrn:comm_supplier',
      'عمولات نقدية للزبائن': 'jrn:comm_customer',
      'تحصيل شيك': 'jrn:check_collect',
      'استعراض القيود المعدله': 'jrn:edited',
      'استعراض القيود المحذوفه': 'jrn:deleted',
      'استعراض القيود المحشورة': 'jrn:gapped',
      'استعراض قيود فروق العملة': 'jrn:cur_diff',
      // المواد
      'اضافة مادة جديدة': 'mat:add',
      'استعراض وتعديل المواد': 'mat:browse',
      'اضافة مجموعة مواد': 'mat:addGroup',
      'تعديل المواصفات الأساسية لمجموعة مواد': 'mat:editSpecs',
      'تعديل خصائص مشتركة لمجموعة مواد': 'mat:editProps',
      'تعديل تسعيرات المواد': 'mat:editPrices',
      'دليل المواد': 'mat:guide',
      'المواد الرئيسية': 'mat:mainMaterials',
      'المواد الإجمالية': 'mat:totalMaterials',
      المستودعات: 'mat:warehouses',
      المصاريف: 'mat:expenses',
      'شجرة المواد': 'mat:tree',
      'طباعة لصقات المواد': 'mat:labels',
      'دورة استلام وتسليم': 'mat:handoverCycle',
      'تقرير الاستلام والتسليم': 'mat:handoverReport',
      'اتلاف مواد': 'mat:dispose',
      // شؤون الموظفين
      'اضافة موظف جديد': 'hr:employees',
      'استعراض وتعديل الموظفين': 'hr:browseEmployees',
      الاقسام: 'hr:departments',
      'ادارة الحضور': 'hr:attendance',
      'تسجيل حضور وانصراف يدوي': 'hr:manualAttendance',
      'استعراض الحضور اليدوي': 'hr:manualAttendance',
      'اضافة إجازة جديدة': 'hr:leaves',
      'استعراض الإجازات': 'hr:leaves',
      'جدول أجور جديد': 'hr:payroll',
      'استعراض جدول الأجور': 'hr:payroll',
      'اضافة سلفة نقدية': 'hr:advances',
      'استعراض السلف النقدية': 'hr:advances',
      'اضافة عقوبة جديدة': 'hr:penalties',
      'استعراض العقوبات': 'hr:penalties',
      'اضافة إضافي / مكافأة': 'hr:bonuses',
      'استعراض الاضافات': 'hr:bonuses',
      'تقرير تفصيلي للدوام': 'hr:reports',
      'تقرير الرواتب والمستحقات': 'hr:payroll',
      // تقارير الحسابات
      'كشف حساب اجمالي': 'rep:accSummary',
      'كشف حساب تفصيلي': 'detailedStatement',
      'كشف حساب يومي': 'rep:dailyCashbook',
      'تقرير الحركة اليومية': 'rep:dailyMovement',
      'التقرير اليومي': 'rep:dailyReport',
      'التقرير العام للعمليات': 'rep:generalOps',
      'تقرير مراكزالتكلفة': 'rep:costCenterReport',
      'تقارير سندات وشيكات القبض': 'rep:receiptsReport',
      'تقارير سندات وشيكات الصرف': 'rep:paymentsReport',
      'تقرير أعمار الذمم': 'rep:agingReport',
      'تقرير مستخدم': 'rep:userReport',
      'تقرير خطة التحصيل/الدفع': 'rep:collectionPlan',
      // تقارير المواد
      'حركة مادة تفصيلي': 'rep:matDetailMove',
      'الحركة التفصيلية للمواد': 'rep:matAllDetailMove',
      'الحركة الإجمالية للمواد': 'rep:matSummaryMove',
      'حركة المواد حسب المستودع': 'rep:matWarehouseSummary',
      'جرد مواد تفصيلي': 'rep:matDetailInv',
      'صلاحية المواد': 'rep:matExpiry',
      'استعراض المواد': 'rep:matBrowse',
      'نواقص المواد والمتجاوزه الحد الدنى': 'rep:matMinAlerts',
      'المواد المتجاوزه الحد الاعلى': 'rep:matMaxAlerts',
      'المواد عديمة الحركة': 'rep:matStagnant',
      'تقرير بالكميات الاساسية': 'rep:matBaseQty',
      'تقرير الكفالات': 'rep:matWarranties',
      // تقارير ختامية
      'ميزان المراجعة الشهرية': 'rep:monthlyTrialBalance',
      'ميزان المراجعة العامة': 'rep:generalTrialBalance',
      'الميزانية الافتتاحية': 'rep:openingBalanceSheet',
      'الميزانية الحالية': 'rep:currentBalanceSheet',
      'حساب التشغيل': 'rep:operatingAccount',
      'حساب المتاجرة': 'rep:tradingAccount',
      'حساب الأرباح والخسائر': 'rep:profitAndLoss',
      'تقارير الحسابات الختامية': 'rep:closingReports',
      'تنظيم القيود الختامية': 'rep:organizeClosingEntries',
      'استعراض القيود الختامية': 'rep:browseClosingEntries',
      'الميزانية الختاميه': 'rep:finalBalanceSheet',
      'التهيه لدوره قادمه': 'rep:nextPeriodPrep',
      // الاعدادات و الأدوات
      'الاعدادات العامة': 'props',
      'صلاحيات المستخدمين': 'users',
      'خيارات الحسابات العامة': 'accountOptions',
      'تنبيهات النظام': 'alerts',
      'بيانات الشركات والسنوات': 'companies',
      'الاستوديو الذكي للصور والمستندات': 'aiStudioGenerate',
      'التقرير العام': 'generalReport',
      'مراجعة الحركات': 'reviewMovements',
      'ترحيل الحركة اليومية': 'postDailyMovement',
      'قائمة العملات': 'currencies',
      'تسجيل النظام': 'systemRegistration',
      'فحص النظام': 'systemCheck',
      'مستعرض مواعيد اليوم': 'appointments',
      'إعداد نماذج الطباعة': 'printSetup',
    };
    const key = map[item];
    if (key) handleAction(key);
  };

  const handleSaveUser = (user: ErpUser) => {
    setState((prev) => {
      const nextUsers = [...prev.users];
      if (editingUserIdx >= 0 && nextUsers[editingUserIdx]) {
        nextUsers[editingUserIdx] = user;
      } else {
        nextUsers.push(user);
      }
      return { ...prev, users: nextUsers };
    });
    notify(`تم حفظ بيانات المستخدم ${user.name}`);
  };

  if (isShutdown) {
    return (
      <div
        dir="rtl"
        className="w-screen h-screen bg-[#0c1828] text-white flex flex-col items-center justify-center gap-6 p-6"
      >
        <div className="text-[48px] font-black">
          <span className="text-[#E11818]">بديل </span>
          <span className="text-[#45b6d6]">سوفت</span>{' '}
          <span className="text-[22px] text-[#9ec7e8]">Pro</span>
        </div>
        <div className="text-[22px] font-bold">تم إغلاق النظام بنجاح</div>
        <button
          type="button"
          onClick={() => setIsShutdown(false)}
          className="erp-classic-btn focused px-8 h-[38px] text-[15px]"
        >
          إعادة تشغيل النظام
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-screen h-screen flex flex-col overflow-hidden bg-[#1a2636]">
      {minimizedShell ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white">
          <div className="text-[24px] font-bold">تم تصغير نافذة النظام</div>
          <button
            type="button"
            onClick={() => {
              if (state.alerts[8]) {
                pendingProtectedActionRef.current = () => setMinimizedShell(false);
                openWindow('passwordPrompt');
              } else {
                setMinimizedShell(false);
              }
            }}
            className="erp-classic-btn focused px-6 h-[36px] text-[14px]"
          >
            استعادة النظام ({state.props.company})
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-[#dce4f0] border border-[#3a3a3a] overflow-hidden">
          <TitleBar
            isMain
            title={state.props.company || 'النظام'}
            onMinimize={() => setMinimizedShell(true)}
            onMaximize={() => notify('النظام يعمل بملء الشاشة')}
            onClose={() => handleAction('shutdown')}
          />

          <MenuAndToolbar
            activeSection={activeSection}
            panelOpen={panelOpen}
            showMenus={state.props.showMenus}
            showTiles={state.props.showTiles}
            onSelectSection={(sec) => {
              if (panelOpen && activeSection === sec) {
                setPanelOpen(false);
              } else {
                setActiveSection(sec);
                setPanelOpen(true);
              }
            }}
            onDropdownAction={handleDropdownAction}
          />

          <DesktopWorkspace
            activeSection={activeSection}
            panelOpen={panelOpen}
            activeButtonKey={activeButtonKey}
            journalOpen={openWindows.journal}
            onAction={handleAction}
            onDismissPanel={() => setPanelOpen(false)}
          />

          <StatusBar
            username={state.currentUser}
            year={state.props.year}
            toastMessage={toastMessage}
          />
        </div>
      )}

      {/* Windows */}
      <PropsDialog
        open={openWindows.props}
        initialTab={propsInitialTab}
        zIndex={zOrder.props}
        value={state.props}
        onFocus={() => focusWindow('props')}
        onClose={() => closeWindow('props')}
        onSave={(nextProps) => {
          setState((prev) => ({
            ...prev,
            currentUser: nextProps.admin || prev.currentUser,
            props: nextProps,
          }));
          notify('تم حفظ خصائص الملف والإعدادات العامة');
        }}
        onShowMsg={showMsg}
        onOpenAiGenerateLogo={() => {
          setAiInitialTab('generate');
          setAiInitialMode('logo');
          setAiInitialImage(null);
          openWindow('aiStudio');
        }}
        onOpenAiAnalyzeLogo={(logoData) => {
          setAiInitialTab('analyze');
          setAiInitialMode('logo');
          setAiInitialImage(logoData);
          openWindow('aiStudio');
        }}
      />

      <UsersDialog
        open={openWindows.users}
        zIndex={zOrder.users}
        users={state.users}
        onFocus={() => focusWindow('users')}
        onClose={() => closeWindow('users')}
        onAddUser={() => {
          setEditingUserIdx(-1);
          openWindow('perms');
        }}
        onEditUser={(idx) => {
          setEditingUserIdx(idx);
          openWindow('perms');
        }}
        onDeleteUser={(idx) => {
          setState((prev) => ({
            ...prev,
            users: prev.users.filter((_, i) => i !== idx),
          }));
          notify('تم حذف المستخدم');
        }}
        onShowMsg={showMsg}
      />

      <PermissionsDialog
        open={openWindows.perms}
        zIndex={zOrder.perms}
        user={editingUserIdx >= 0 ? state.users[editingUserIdx] || null : null}
        onFocus={() => focusWindow('perms')}
        onClose={() => closeWindow('perms')}
        onSave={handleSaveUser}
        onShowMsg={showMsg}
      />

      <AccountOptionsDialog
        open={openWindows.accountOptions}
        zIndex={zOrder.accountOptions}
        value={state.accountOptions}
        onFocus={() => focusWindow('accountOptions')}
        onClose={() => closeWindow('accountOptions')}
        onSave={(next) => {
          setState((prev) => ({ ...prev, accountOptions: next }));
          notify('تم حفظ خيارات الحسابات العامة');
        }}
        onNotify={notify}
      />

      <AlertsDialog
        open={openWindows.alerts}
        zIndex={zOrder.alerts}
        value={state.alerts}
        days={state.alertDays}
        onFocus={() => focusWindow('alerts')}
        onClose={() => closeWindow('alerts')}
        onSave={(next, nextDays) => {
          setState((prev) => ({ ...prev, alerts: next, alertDays: nextDays }));
          notify('تم حفظ تنبيهات النظام');
        }}
      />

      <CompaniesYearsDialog
        open={openWindows.companies}
        zIndex={zOrder.companies}
        companies={state.companies}
        years={state.years}
        onFocus={() => focusWindow('companies')}
        onClose={() => closeWindow('companies')}
        onSave={(companies, years) => {
          setState((prev) => ({ ...prev, companies, years }));
        }}
        onShowMsg={showMsg}
      />

      <JournalDialog
        open={openWindows.journal}
        launch={journalLaunch}
        zIndex={zOrder.journal}
        currentUser={state.currentUser}
        entries={state.journal}
        journalOptions={state.journalOptions}
        accountOptions={state.accountOptions}
        customAccounts={state.customAccounts}
        prefillData={journalPrefill}
        onConsumePrefill={() => setJournalPrefill(null)}
        onFocus={() => focusWindow('journal')}
        onClose={() => closeWindow('journal')}
        onAddEntry={(entry) =>
          setState((prev) => ({ ...prev, journal: [entry, ...prev.journal] }))
        }
        onUpdateEntry={(updated) =>
          setState((prev) => ({
            ...prev,
            journal: prev.journal.map((e) => (e.id === updated.id ? updated : e)),
          }))
        }
        onDeleteEntry={(id) =>
          setState((prev) => ({
            ...prev,
            journal: prev.journal.map((e) =>
              e.id === id
                ? {
                    ...e,
                    deleted: true,
                    deletedAt: new Date().toISOString().slice(0, 10),
                    deletedBy: state.currentUser,
                  }
                : e
            ),
          }))
        }
        onSaveJournalOptions={(journalOptions) =>
          setState((prev) => ({ ...prev, journalOptions }))
        }
        onOpenPrint={() => openWindow('printSetup')}
        onOpenAiInvoiceScan={() => {
          setAiInitialTab('analyze');
          setAiInitialMode('invoice');
          setAiInitialImage(null);
          openWindow('aiStudio');
        }}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <PrintSetupDialog
        open={openWindows.printSetup}
        zIndex={zOrder.printSetup}
        templates={state.reportTemplates}
        onFocus={() => focusWindow('printSetup')}
        onClose={() => closeWindow('printSetup')}
        onOpenPages={(opts) => {
          setCreatingReportTpl(Boolean(opts?.isCreating));
          setEditingReportTpl(opts?.template || null);
          openWindow('pagesSetup');
        }}
        onNotify={notify}
      />

      <ReportsListDialog
        open={openWindows.reportsList}
        zIndex={zOrder.reportsList}
        templates={state.reportTemplates}
        onFocus={() => focusWindow('reportsList')}
        onClose={() => {
          setReportPickerCallback(null);
          closeWindow('reportsList');
        }}
        onAddTemplate={() => {
          setEditingReportTpl(null);
          setCreatingReportTpl(true);
          openWindow('pagesSetup');
        }}
        onEditTemplate={(tpl) => {
          setEditingReportTpl(tpl);
          setCreatingReportTpl(false);
          openWindow('pagesSetup');
        }}
        onDeleteTemplate={(id) =>
          setState((prev) => ({
            ...prev,
            reportTemplates: prev.reportTemplates.filter((t) => t.id !== id),
          }))
        }
        onPickTemplate={reportPickerCallback || undefined}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <SettingPagesDialog
        open={openWindows.pagesSetup}
        zIndex={zOrder.pagesSetup}
        propsState={state.props}
        editingTemplate={editingReportTpl}
        isCreating={creatingReportTpl}
        designerSections={state.designerSections}
        onFocus={() => focusWindow('pagesSetup')}
        onClose={() => closeWindow('pagesSetup')}
        onOpenFetchList={(cb) => {
          setReportPickerCallback(() => cb);
          openWindow('reportsList');
        }}
        onSaveTemplate={(tpl) =>
          setState((prev) => {
            const exists = prev.reportTemplates.some((t) => t.id === tpl.id);
            return {
              ...prev,
              reportTemplates: exists
                ? prev.reportTemplates.map((t) => (t.id === tpl.id ? tpl : t))
                : [...prev.reportTemplates, tpl],
            };
          })
        }
        onSaveDesignerSections={(sections) =>
          setState((prev) => ({ ...prev, designerSections: sections }))
        }
        onNotify={notify}
      />

      <BackupRestoreDialog
        open={openWindows.backupRestore}
        mode={backupMode}
        zIndex={zOrder.backupRestore}
        propsState={state.props}
        currentState={state}
        onFocus={() => focusWindow('backupRestore')}
        onClose={() => closeWindow('backupRestore')}
        onExecuteBackup={({ serverName, dbName, backupPath, integratedSecurity }) => {
          setState((prev) => ({
            ...prev,
            props: {
              ...prev.props,
              serverName,
              dbName,
              backupPath,
              integratedSecurity,
            },
          }));
          runBackupDownload(backupPath);
        }}
        onExecuteRestore={(restored) => {
          setState((prev) => ({
            ...prev,
            ...restored,
            props: { ...prev.props, ...(restored.props || {}) },
            journalOptions: restored.journalOptions || prev.journalOptions,
            reportTemplates: restored.reportTemplates?.length
              ? restored.reportTemplates
              : prev.reportTemplates,
          }));
          notify('تم استرجاع النسخة الاحتياطية بنجاح');
        }}
        onShowMsg={showMsg}
      />

      <AiStudioDialog
        open={openWindows.aiStudio}
        initialTab={aiInitialTab}
        initialMode={aiInitialMode}
        initialAnalyzeImage={aiInitialImage}
        currentLogo={state.props.logoData}
        zIndex={zOrder.aiStudio}
        onFocus={() => focusWindow('aiStudio')}
        onClose={() => closeWindow('aiStudio')}
        onApplyAsCompanyLogo={(dataUrl, fileName) => {
          setState((prev) => ({
            ...prev,
            props: {
              ...prev.props,
              logoData: dataUrl,
              logoName: fileName || 'ai-logo.png',
            },
          }));
        }}
        onTransferInvoiceToJournal={(extracted) => {
          setJournalPrefill(extracted);
          closeWindow('aiStudio');
          openWindow('journal');
          notify('تم ترحيل بيانات الفاتورة إلى نموذج اليومية العامة');
        }}
        onNotify={notify}
      />

      <CurrenciesDialog
        open={openWindows.currencies}
        zIndex={zOrder.currencies}
        currencies={state.currencies}
        onFocus={() => focusWindow('currencies')}
        onClose={() => closeWindow('currencies')}
        onSave={(currencies) => {
          setState((prev) => ({ ...prev, currencies }));
          notify('تم تحديث قائمة العملات');
        }}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <PostDailyMovementDialog
        open={openWindows.postDailyMovement}
        zIndex={zOrder.postDailyMovement}
        state={state}
        onFocus={() => focusWindow('postDailyMovement')}
        onClose={() => closeWindow('postDailyMovement')}
        onSavePosted={({ journalUpdates, invoiceUpdates }) => {
          setState((prev) => ({
            ...prev,
            journal: prev.journal.map((j) =>
              journalUpdates[j.id] ? { ...j, ...journalUpdates[j.id] } : j
            ),
            invoices: prev.invoices.map((inv) =>
              invoiceUpdates[inv.id] ? { ...inv, ...invoiceUpdates[inv.id] } : inv
            ),
          }));
        }}
        onNotify={notify}
      />

      <GeneralReportDialog
        open={openWindows.generalReport}
        zIndex={zOrder.generalReport}
        state={state}
        onFocus={() => focusWindow('generalReport')}
        onClose={() => closeWindow('generalReport')}
      />

      <AccTreeDialog
        open={openWindows.accTree}
        zIndex={zOrder.accTree}
        customAccounts={state.customAccounts}
        onFocus={() => focusWindow('accTree')}
        onClose={() => closeWindow('accTree')}
        onNotify={notify}
      />

      <AccountsOpsDialog
        open={openWindows.accountsOps}
        mode={accountsOpsMode}
        zIndex={zOrder.accountsOps}
        customAccounts={state.customAccounts}
        costCenters={state.costCenters}
        journal={state.journal}
        onFocus={() => focusWindow('accountsOps')}
        onClose={() => closeWindow('accountsOps')}
        onSaveCustomAccounts={(customAccounts) =>
          setState((prev) => ({ ...prev, customAccounts }))
        }
        onSaveCostCenters={(costCenters) => setState((prev) => ({ ...prev, costCenters }))}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <MaterialsOpsDialog
        open={openWindows.materialsOps}
        mode={materialsOpsMode}
        zIndex={zOrder.materialsOps}
        currentUser={state.currentUser}
        materials={state.importedMaterials}
        groups={state.materialGroups}
        warehouses={state.warehouses}
        expenses={state.materialExpenses}
        handovers={state.handovers}
        disposals={state.disposals}
        onFocus={() => focusWindow('materialsOps')}
        onClose={() => closeWindow('materialsOps')}
        onSaveMaterials={(importedMaterials) =>
          setState((prev) => ({ ...prev, importedMaterials }))
        }
        onSaveGroups={(materialGroups) =>
          setState((prev) => ({ ...prev, materialGroups }))
        }
        onSaveWarehouses={(warehouses) => setState((prev) => ({ ...prev, warehouses }))}
        onSaveExpenses={(materialExpenses) =>
          setState((prev) => ({ ...prev, materialExpenses }))
        }
        onSaveHandovers={(handovers) => setState((prev) => ({ ...prev, handovers }))}
        onSaveDisposals={(disposals) => setState((prev) => ({ ...prev, disposals }))}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <DetailedAccountStatementDialog
        open={openWindows.detailedStatement}
        zIndex={zOrder.detailedStatement}
        initialAccountName="الصندوق"
        entries={state.journal.filter((j) => !j.deleted)}
        onFocus={() => focusWindow('detailedStatement')}
        onClose={() => closeWindow('detailedStatement')}
        onOpenPrint={() => openWindow('printSetup')}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <SwitchUserDialog
        open={openWindows.switchUser}
        zIndex={zOrder.switchUser}
        users={state.users}
        currentUser={state.currentUser}
        onFocus={() => focusWindow('switchUser')}
        onClose={() => closeWindow('switchUser')}
        onSwitch={(username) => {
          setState((prev) => ({ ...prev, currentUser: username }));
          notify(`تم تسجيل الدخول بالمستخدم: ${username}`);
        }}
      />

      <CompanyPickerDialog
        open={openWindows.companiesPicker}
        zIndex={zOrder.companiesPicker}
        companies={state.companies}
        activeCompany={state.props.company}
        activeBranch={state.activeBranch}
        activeYear={state.props.year}
        onFocus={() => focusWindow('companiesPicker')}
        onClose={() => closeWindow('companiesPicker')}
        onSelectCompany={(companyName, branch, year) => {
          pendingProtectedActionRef.current = () => {
            setState((prev) => ({
              ...prev,
              activeBranch: branch,
              props: { ...prev.props, company: companyName, year },
            }));
            notify(`تم فتح الشركة: ${companyName} - الفرع ${branch} (${year})`);
          };
          openWindow('passwordPrompt');
        }}
        onNotify={notify}
      />

      <PasswordPromptDialog
        open={openWindows.passwordPrompt}
        zIndex={zOrder.passwordPrompt}
        expectedPassword={state.props.password}
        onFocus={() => focusWindow('passwordPrompt')}
        onClose={() => closeWindow('passwordPrompt')}
        onSuccess={() => {
          pendingProtectedActionRef.current?.();
          pendingProtectedActionRef.current = null;
        }}
        onShowMsg={showMsg}
      />

      <SystemRegistrationDialog
        open={openWindows.systemRegistration}
        zIndex={zOrder.systemRegistration}
        license={state.license}
        onFocus={() => focusWindow('systemRegistration')}
        onClose={() => closeWindow('systemRegistration')}
        onSave={(license) => {
          setState((prev) => ({ ...prev, license }));
          notify('تم حفظ كود الترخيص بنجاح');
        }}
      />

      <ExcelImportDialog
        open={openWindows.excelImport}
        zIndex={zOrder.excelImport}
        importedMaterials={state.importedMaterials}
        onFocus={() => focusWindow('excelImport')}
        onClose={() => closeWindow('excelImport')}
        onSaveMaterials={(importedMaterials) =>
          setState((prev) => ({ ...prev, importedMaterials }))
        }
        onNotify={notify}
      />

      <InvoicesDialog
        open={openWindows.invoices}
        launch={invoiceLaunch}
        zIndex={zOrder.invoices}
        currentUser={state.currentUser}
        users={state.users}
        materialGroups={state.materialGroups}
        employees={state.employees}
        invoices={state.invoices}
        invoiceTemplates={state.invoiceTemplates}
        importedMaterials={state.importedMaterials}
        customAccounts={state.customAccounts}
        costCenters={state.costCenters}
        warehouses={state.warehouses}
        currencies={state.currencies}
        reportTemplates={state.reportTemplates}
        designerSections={state.designerSections}
        companyProps={state.props}
        onFocus={() => focusWindow('invoices')}
        onClose={() => closeWindow('invoices')}
        onSaveInvoice={(inv) =>
          setState((prev) => {
            const exists = prev.invoices.some((x) => x.id === inv.id);
            return {
              ...prev,
              invoices: exists
                ? prev.invoices.map((x) => (x.id === inv.id ? inv : x))
                : [inv, ...prev.invoices],
            };
          })
        }
        onDeleteInvoice={(id) =>
          setState((prev) => ({
            ...prev,
            invoices: prev.invoices.filter((x) => x.id !== id),
          }))
        }
        onSaveInvoiceTemplates={(invoiceTemplates) =>
          setState((prev) => ({ ...prev, invoiceTemplates }))
        }
        onOpenAiInvoiceScan={() => {
          setAiInitialTab('analyze');
          setAiInitialMode('invoice');
          setAiInitialImage(null);
          openWindow('aiStudio');
        }}
        onOpenPrint={() => openWindow('printSetup')}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <SystemCheckDialog
        open={openWindows.systemCheck}
        zIndex={zOrder.systemCheck}
        state={state}
        onFocus={() => focusWindow('systemCheck')}
        onClose={() => closeWindow('systemCheck')}
        onCleanZeroExpired={() => {
          const today = new Date().toISOString().slice(0, 10);
          let removedCount = 0;
          setState((prev) => {
            const kept = prev.importedMaterials.filter((m) => {
              const isZero = Number(m.qty || '0') <= 0;
              const isExpired = Boolean(m.expiryDate && m.expiryDate < today);
              if (isZero && isExpired) {
                removedCount += 1;
                return false;
              }
              return true;
            });
            return { ...prev, importedMaterials: kept };
          });
          return removedCount;
        }}
        onShowMsg={showMsg}
      />

      <AppointmentsDialog
        open={openWindows.appointments}
        zIndex={zOrder.appointments}
        appointments={state.appointments}
        onFocus={() => focusWindow('appointments')}
        onClose={() => closeWindow('appointments')}
        onSaveAppointment={(item, isEdit) =>
          setState((prev) => ({
            ...prev,
            appointments: isEdit
              ? prev.appointments.map((a) => (a.id === item.id ? item : a))
              : [item, ...prev.appointments],
          }))
        }
        onDeleteAppointment={(id) =>
          setState((prev) => ({
            ...prev,
            appointments: prev.appointments.filter((a) => a.id !== id),
          }))
        }
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <ChangePasswordDialog
        open={openWindows.changePassword}
        zIndex={zOrder.changePassword}
        currentUser={state.currentUser}
        currentPassword={state.props.password}
        onFocus={() => focusWindow('changePassword')}
        onClose={() => closeWindow('changePassword')}
        onSavePassword={(nextPassword) => {
          setState((prev) => ({
            ...prev,
            props: { ...prev.props, password: nextPassword },
          }));
          notify('تم تحديث كلمة السر بنجاح');
        }}
        onShowMsg={showMsg}
      />

      <HrOpsDialog
        open={openWindows.hrOps}
        mode={hrOpsMode}
        zIndex={zOrder.hrOps}
        employees={state.employees}
        departments={state.departments}
        attendance={state.attendance}
        leaves={state.leaves}
        hrAdjustments={state.hrAdjustments}
        onFocus={() => focusWindow('hrOps')}
        onClose={() => closeWindow('hrOps')}
        onSaveEmployees={(employees) => setState((prev) => ({ ...prev, employees }))}
        onSaveDepartments={(departments) => setState((prev) => ({ ...prev, departments }))}
        onSaveAttendance={(attendance) => setState((prev) => ({ ...prev, attendance }))}
        onSaveLeaves={(leaves) => setState((prev) => ({ ...prev, leaves }))}
        onSaveAdjustments={(hrAdjustments) =>
          setState((prev) => ({ ...prev, hrAdjustments }))
        }
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <ReportsSuiteDialog
        open={openWindows.reportsSuite}
        mode={reportSuiteMode}
        zIndex={zOrder.reportsSuite}
        state={state}
        onFocus={() => focusWindow('reportsSuite')}
        onClose={() => closeWindow('reportsSuite')}
        onAddClosingEntries={(entries) =>
          setState((prev) => ({
            ...prev,
            journal: [...entries, ...prev.journal],
          }))
        }
        onAdvanceNextYear={(nextYear) =>
          setState((prev) => {
            const yearStr = String(nextYear);
            const hasYear = prev.years.some((y) => y.year === yearStr);
            return {
              ...prev,
              props: {
                ...prev.props,
                year: nextYear,
                dateFrom: `${nextYear}-01-01`,
                dateTo: `${nextYear}-12-31`,
              },
              years: hasYear
                ? prev.years
                : [
                    ...prev.years,
                    {
                      m: prev.years.length + 1,
                      year: yearStr,
                      next: String(nextYear + 1),
                      notes: 'دورة مالية جديدة',
                    },
                  ],
            };
          })
        }
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <MessageBox config={msgConfig} onResolve={handleMsgResolve} />
    </div>
  );
}
