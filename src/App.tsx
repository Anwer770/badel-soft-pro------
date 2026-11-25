import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccountOptionsDialog } from './components/AccountOptionsDialog';
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
import { InvoicesDialog, type InvoicesModalLaunch } from './components/InvoicesDialog';
import { JournalDialog } from './components/JournalDialog';
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
  | 'postDailyMovement';

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
  'inv:count_invoices': { mode: 'browse', kindTitle: 'جرد فواتير' },
  'inv:profit_report': { mode: 'profit', kindTitle: 'تقرير ارباح الفواتير' },
  'inv:today_profit': { mode: 'profit', kindTitle: 'ارباح فواتير اليوم' },
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
  });
  const topZRef = useRef(72);

  const [propsInitialTab, setPropsInitialTab] = useState(0);
  const [editingUserIdx, setEditingUserIdx] = useState<number>(-1);
  const [aiInitialTab, setAiInitialTab] = useState<'generate' | 'analyze'>('generate');
  const [aiInitialMode, setAiInitialMode] = useState<'general' | 'invoice' | 'logo'>('general');
  const [aiInitialImage, setAiInitialImage] = useState<string | null>(null);
  const [journalPrefill, setJournalPrefill] = useState<ExtractedInvoiceData | null>(null);
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
        zIndex={zOrder.journal}
        currentUser={state.currentUser}
        entries={state.journal}
        journalOptions={state.journalOptions}
        accountOptions={state.accountOptions}
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
            journal: prev.journal.filter((e) => e.id !== id),
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
        onFocus={() => focusWindow('accTree')}
        onClose={() => closeWindow('accTree')}
        onNotify={notify}
      />

      <DetailedAccountStatementDialog
        open={openWindows.detailedStatement}
        zIndex={zOrder.detailedStatement}
        initialAccountName="الصندوق"
        entries={state.journal}
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
        invoices={state.invoices}
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

      <MessageBox config={msgConfig} onResolve={handleMsgResolve} />
    </div>
  );
}
