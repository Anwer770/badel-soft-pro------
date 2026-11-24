import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccountOptionsDialog } from './components/AccountOptionsDialog';
import { AiStudioDialog } from './components/AiStudioDialog';
import { AlertsDialog } from './components/AlertsDialog';
import { CompaniesYearsDialog } from './components/CompaniesYearsDialog';
import { DesktopWorkspace } from './components/DesktopWorkspace';
import { JournalDialog } from './components/JournalDialog';
import { MenuAndToolbar } from './components/MenuAndToolbar';
import { MessageBox } from './components/MessageBox';
import { PermissionsDialog } from './components/PermissionsDialog';
import { PrintSetupDialog, SettingPagesDialog } from './components/PrintDialogs';
import { PropsDialog } from './components/PropsDialog';
import { StatusBar } from './components/StatusBar';
import { TitleBar } from './components/TitleBar';
import {
  CurrenciesDialog,
  GeneralReportDialog,
  SwitchUserDialog,
} from './components/ToolsDialogs';
import { UsersDialog } from './components/UsersDialog';
import { loadErpState, saveErpState } from './data/erpDefaults';
import type {
  ErpState,
  ErpUser,
  ExtractedInvoiceData,
  MsgConfig,
  SectionKey,
} from './types/erp';

type WindowId =
  | 'props'
  | 'users'
  | 'perms'
  | 'accountOptions'
  | 'alerts'
  | 'companies'
  | 'journal'
  | 'printSetup'
  | 'pagesSetup'
  | 'aiStudio'
  | 'currencies'
  | 'generalReport'
  | 'switchUser';

export default function App() {
  const [state, setState] = useState<ErpState>(() => loadErpState());
  const [activeSection, setActiveSection] = useState<SectionKey>('الاعدادات');
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
    journal: false,
    printSetup: false,
    pagesSetup: false,
    aiStudio: false,
    currencies: false,
    generalReport: false,
    switchUser: false,
  });

  const [zOrder, setZOrder] = useState<Record<WindowId, number>>({
    props: 60,
    users: 60,
    perms: 62,
    accountOptions: 60,
    alerts: 60,
    companies: 60,
    journal: 55,
    printSetup: 64,
    pagesSetup: 66,
    aiStudio: 65,
    currencies: 60,
    generalReport: 60,
    switchUser: 62,
  });
  const topZRef = useRef(70);

  const [propsInitialTab, setPropsInitialTab] = useState(0);
  const [editingUserIdx, setEditingUserIdx] = useState<number>(-1);
  const [aiInitialTab, setAiInitialTab] = useState<'generate' | 'analyze'>('generate');
  const [aiInitialMode, setAiInitialMode] = useState<'general' | 'invoice' | 'logo'>('general');
  const [aiInitialImage, setAiInitialImage] = useState<string | null>(null);
  const [journalPrefill, setJournalPrefill] = useState<ExtractedInvoiceData | null>(null);

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

  const runBackupDownload = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`تم حفظ نسخة احتياطية (${state.props.backupPath})`);
  };

  const handleAction = useCallback(
    (actionKey: string) => {
      setActiveButtonKey(actionKey);
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
        case 'addCompany':
          openWindow('companies');
          break;
        case 'journal':
          openWindow('journal');
          break;
        case 'printSetup':
          openWindow('printSetup');
          break;
        case 'pagesSetup':
          openWindow('pagesSetup');
          break;
        case 'currencies':
          openWindow('currencies');
          break;
        case 'generalReport':
          openWindow('generalReport');
          break;
        case 'switchUser':
          openWindow('switchUser');
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
          runBackupDownload();
          break;
        case 'restoreBackup': {
          const inp = document.createElement('input');
          inp.type = 'file';
          inp.accept = '.json';
          inp.onchange = async () => {
            const file = inp.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const parsed = JSON.parse(text) as ErpState;
              if (!parsed.props || !Array.isArray(parsed.users)) {
                throw new Error('ملف نسخة احتياطية غير صالح');
              }
              setState(parsed);
              notify('تم استرجاع النسخة الاحتياطية بنجاح');
            } catch {
              await showMsg({
                title: 'استرجاع نسخة احتياطية',
                icon: 'warn',
                text: 'تعذر قراءة ملف النسخة الاحتياطية المحدد.',
              });
            }
          };
          inp.click();
          break;
        }
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
          void fetch('/api/health')
            .then((r) => r.json())
            .then((info) => {
              void showMsg({
                title: 'فحص النظام',
                icon: 'info',
                text: `حالة الخادم: يعمل بشكل سليم\nالشركة النشطة: ${state.props.company}\nعدد المستخدمين: ${state.users.length}\nعدد قيود اليومية: ${state.journal.length}\nجاهزية مفتاح الذكاء الاصطناعي: ${
                  info?.geminiConfigured ? 'متوفر' : 'غير مضبوط في Settings > Secrets'
                }`,
              });
            })
            .catch(() => {
              void showMsg({
                title: 'فحص النظام',
                icon: 'warn',
                text: 'تعذر الوصول إلى خادم النظام المحلي.',
              });
            });
          break;
        case 'shutdown':
          void showMsg({
            title: 'إنهاء النظام',
            icon: 'question',
            text: 'هل تريد إغلاق النظام؟',
            buttons: [
              { label: 'نعم', value: 'yes' },
              { label: 'لا', value: 'no', focus: true },
            ],
          }).then((res) => {
            if (res === 'yes') setIsShutdown(true);
          });
          break;
        default:
          break;
      }
    },
    [openWindow, showMsg, notify, state]
  );

  const handleDropdownAction = (section: SectionKey, item: string) => {
    setActiveSection(section);
    const map: Record<string, string> = {
      'الاعدادات العامة': 'props',
      'صلاحيات المستخدمين': 'users',
      'خيارات الحسابات العامة': 'accountOptions',
      'تنبيهات النظام': 'alerts',
      'بيانات الشركات والسنوات': 'companies',
      'الاستوديو الذكي للصور والمستندات': 'aiStudioGenerate',
      'التقرير العام': 'generalReport',
      'قائمة العملات': 'currencies',
      'فحص النظام': 'systemCheck',
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
            onClick={() => setMinimizedShell(false)}
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
            showMenus={state.props.showMenus}
            showTiles={state.props.showTiles}
            onSelectSection={(sec) => setActiveSection(sec)}
            onDropdownAction={handleDropdownAction}
          />

          <DesktopWorkspace
            activeSection={activeSection}
            activeButtonKey={activeButtonKey}
            journalOpen={openWindows.journal}
            onAction={handleAction}
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
        onFocus={() => focusWindow('alerts')}
        onClose={() => closeWindow('alerts')}
        onSave={(next) => {
          setState((prev) => ({ ...prev, alerts: next }));
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
        prefillData={journalPrefill}
        onConsumePrefill={() => setJournalPrefill(null)}
        onFocus={() => focusWindow('journal')}
        onClose={() => closeWindow('journal')}
        onAddEntry={(entry) =>
          setState((prev) => ({ ...prev, journal: [entry, ...prev.journal] }))
        }
        onDeleteEntry={(id) =>
          setState((prev) => ({
            ...prev,
            journal: prev.journal.filter((e) => e.id !== id),
          }))
        }
        onOpenPrint={() => openWindow('printSetup')}
        onOpenAiInvoiceScan={() => {
          setAiInitialTab('analyze');
          setAiInitialMode('invoice');
          setAiInitialImage(null);
          openWindow('aiStudio');
        }}
        onOpenGeneralReport={() => openWindow('generalReport')}
        onShowMsg={showMsg}
        onNotify={notify}
      />

      <PrintSetupDialog
        open={openWindows.printSetup}
        zIndex={zOrder.printSetup}
        onFocus={() => focusWindow('printSetup')}
        onClose={() => closeWindow('printSetup')}
        onOpenPages={() => openWindow('pagesSetup')}
        onNotify={notify}
      />

      <SettingPagesDialog
        open={openWindows.pagesSetup}
        zIndex={zOrder.pagesSetup}
        propsState={state.props}
        onFocus={() => focusWindow('pagesSetup')}
        onClose={() => closeWindow('pagesSetup')}
        onNotify={notify}
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
      />

      <GeneralReportDialog
        open={openWindows.generalReport}
        zIndex={zOrder.generalReport}
        state={state}
        onFocus={() => focusWindow('generalReport')}
        onClose={() => closeWindow('generalReport')}
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

      <MessageBox config={msgConfig} onResolve={handleMsgResolve} />
    </div>
  );
}
