import React, { useEffect, useRef } from 'react';
import type { SectionKey } from '../types/erp';

interface DesktopWorkspaceProps {
  activeSection: SectionKey;
  panelOpen: boolean;
  activeButtonKey: string | null;
  journalOpen: boolean;
  onAction: (actionKey: string) => void;
  onDismissPanel: () => void;
}

interface PanelButtonDef {
  key: string;
  label: string;
  textBlue?: boolean;
}

const SETTINGS_BUTTONS: PanelButtonDef[] = [
  { key: 'props', label: 'الاعدادات العامة' },
  { key: 'users', label: 'صلاحيات المستخدمين' },
  { key: 'accountOptions', label: 'خيارات الحسابات العامة' },
  { key: 'alerts', label: 'تنبيهات النظام' },
];

const FILE_BUTTONS: (PanelButtonDef | null)[] = [
  { key: 'journal', label: 'اليومية العامة' },
  { key: 'addCompany', label: 'إضافة شركة جديدة' },
  { key: 'switchUser', label: 'تغير المستخدم' },
  { key: 'backupNow', label: 'عمل نسخة احتياطية' },
  { key: 'restoreBackup', label: 'استرجاع نسخة احتياطية' },
  { key: 'pagesSetup', label: 'تعريف ترويسة / تذييل' },
  { key: 'contact', label: 'اتصال' },
  { key: 'companiesPicker', label: 'قائمة الشركات' },
  { key: 'excelImport', label: 'استيراد من اكسل' },
  null,
  { key: 'shutdown', label: 'انهاء البرنامج' },
];

const TOOLS_BUTTONS: (PanelButtonDef | null)[] = [
  { key: 'generalReport', label: 'التقرير العام' },
  { key: 'reviewMovements', label: 'مراجعة الحركات' },
  { key: 'postDailyMovement', label: 'ترحيل الحركة اليومية' },
  { key: 'currencies', label: 'قائمة العملات' },
  { key: 'systemRegistration', label: 'تسجيل النظام' },
  { key: 'systemCheck', label: 'فحص النظام' },
  { key: 'appointments', label: 'مستعرض مواعيد اليوم' },
  { key: 'printSetup', label: 'إعداد نماذج الطباعة' },
  { key: 'aiStudioGenerate', label: 'إنشاء وتعديل الصور بالذكاء الاصطناعي' },
  { key: 'aiStudioAnalyze', label: 'تحليل الصور والفواتير بالذكاء الاصطناعي' },
];

const INVOICES_BUTTONS: PanelButtonDef[] = [
  { key: 'inv:new_sales', label: 'فاتورة مبيعات جديدة\nCtrl+F2' },
  { key: 'inv:browse_sales', label: 'استعراض وتعديل فاتورة مبيعات\nShift+F2' },
  { key: 'inv:new_purchase', label: 'فاتورة مشتريات جديدة\nCtrl+F1' },
  { key: 'inv:browse_purchase', label: 'استعراض وتعديل فاتورة مشتريات\nShift+F1' },
  { key: 'inv:new_sales_return', label: 'مردود مبيعات جديدة' },
  { key: 'inv:browse_sales_return', label: 'استعراض وتعديل فاتورة مردود مبيعات' },
  { key: 'inv:new_purchase_return', label: 'مردود مشتريات جديدة' },
  { key: 'inv:browse_purchase_return', label: 'استعراض وتعديل فاتورة مردود مشتريات' },
  { key: 'inv:new_in_note', label: 'مذكرة ادخال جديدة' },
  { key: 'inv:browse_in_note', label: 'استعراض وتعديل مذكرة ادخال' },
  { key: 'inv:new_out_note', label: 'مذكرة اخراج جديدة' },
  { key: 'inv:browse_out_note', label: 'استعراض وتعديل مذكرة اخراج' },
  { key: 'inv:new_transfer', label: 'مذكرة نقل جديدة\nCtrl+Shift+F12' },
  { key: 'inv:browse_transfer', label: 'استعراض وتعديل مذكرة نقل\nShift+F12' },
  { key: 'inv:new_po', label: 'طلب شراء جديدة' },
  { key: 'inv:browse_po', label: 'استعراض وتعديل طلب شراء' },
  { key: 'inv:new_reserve', label: 'حجز مبيعات جديدة' },
  { key: 'inv:browse_reserve', label: 'استعراض وتعديل حجز مبيعات' },
  { key: 'inv:new_quote', label: 'عرض أسعار' },
  { key: 'inv:browse_quote', label: 'استعراض وتعديل عرض أسعار' },
  { key: 'inv:opening_inv', label: 'مذكرة جرد إفتتاحي' },
  { key: 'inv:adjust_inv', label: 'مذكرة جرد - تسوية مخزنية' },
  { key: 'inv:count_invoices', label: 'جرد فواتير' },
  { key: 'inv:profit_report', label: 'تقرير ارباح الفواتير' },
  { key: 'inv:today_profit', label: 'ارباح فواتير اليوم' },
];

const SECTION_SHORTCUTS: Partial<Record<SectionKey, PanelButtonDef[]>> = {
  الفواتير: INVOICES_BUTTONS,
  الحسابات: [
    { key: 'acc:add', label: 'اضافة حساب جديد' },
    { key: 'acc:browse', label: 'استعراض وتعديل الحسابات' },
    { key: 'acc:addGroup', label: 'اضافة مجموعة حسابات فرعيه' },
    { key: 'acc:editGroup', label: 'تعديل خصائص مجموعة حسابات فرعية' },
    { key: 'acc:move', label: 'نقل حساب' },
    { key: 'accTree', label: 'شجرة الحسابات' },
    { key: 'acc:guide', label: 'دليل الحسابات' },
    { key: 'acc:aggregate', label: 'الحسابات التجميعيه' },
    { key: 'acc:costCenters', label: 'مراكز الكلفة' },
    { key: 'acc:partyImages', label: 'استعراض صور العملاء والموردين' },
  ],
  القيود: [
    { key: 'jrn:opening', label: 'القيد الإفتتاحي' },
    { key: 'jrn:new_entry', label: 'إدخال سند قيد جديد\nAlt+D' },
    { key: 'jrn:browse_entry', label: 'إستعراض وتعديل سندات قيد' },
    { key: 'jrn:new_receipt', label: 'إدخال سند قبض جديد\nAlt+R' },
    { key: 'jrn:browse_receipt', label: 'إستعراض وتعديل سندات القبض' },
    { key: 'jrn:new_payment', label: 'إدخال سند صرف جديد\nAlt+W' },
    { key: 'jrn:browse_payment', label: 'إستعراض وتعديل سندات الصرف' },
    { key: 'jrn:check_collect', label: 'تحصيل شيك', textBlue: true },
    { key: 'jrn:comm_supplier', label: 'عمولات نقدية من الموردين' },
    { key: 'jrn:comm_customer', label: 'عمولات نقدية للزبائن' },
    { key: 'jrn:edited', label: 'استعراض القيود المعدله' },
    { key: 'jrn:deleted', label: 'استعراض القيود المحذوفه' },
    { key: 'jrn:gapped', label: 'استعراض القيود المحشورة' },
  ],
  المواد: [
    { key: 'mat:add', label: 'اضافة مادة جديدة' },
    { key: 'mat:browse', label: 'استعراض وتعديل المواد' },
    { key: 'mat:addGroup', label: 'اضافة مجموعة مواد' },
    { key: 'mat:editSpecs', label: 'تعديل المواصفات الأساسية لمجموعة مواد' },
    { key: 'mat:mainMaterials', label: 'المواد الرئيسية' },
    { key: 'mat:totalMaterials', label: 'المواد الإجمالية' },
    { key: 'mat:warehouses', label: 'المستودعات' },
    { key: 'mat:expenses', label: 'المصاريف' },
    { key: 'mat:tree', label: 'شجرة المواد' },
    { key: 'mat:labels', label: 'طباعة لصقات المواد' },
    { key: 'mat:handoverCycle', label: 'دورة استلام وتسليم' },
    { key: 'mat:handoverReport', label: 'تقرير الاستلام والتسليم' },
    { key: 'mat:dispose', label: 'اتلاف مواد', textBlue: true },
  ],
  'شؤون الموظفين': [
    { key: 'hr:employees', label: 'اضافة موظف جديد' },
    { key: 'hr:browseEmployees', label: 'استعراض وتعديل الموظفين' },
    { key: 'hr:departments', label: 'الاقسام' },
    { key: 'hr:attendance', label: 'ادارة الحضور' },
    { key: 'hr:manualAttendance', label: 'التسجيل اليدوي' },
    { key: 'hr:leaves', label: 'الإجازات' },
    { key: 'hr:payroll', label: 'الرواتب' },
    { key: 'hr:advances', label: 'السلف' },
    { key: 'hr:penalties', label: 'العقوبات' },
    { key: 'hr:bonuses', label: 'الاضافات' },
    { key: 'hr:reports', label: 'تقارير تفصيليه' },
  ],
  'تقارير الحسابات': [
    { key: 'rep:accSummary', label: 'كشف حساب اجمالي' },
    { key: 'detailedStatement', label: 'كشف حساب تفصيلي' },
    { key: 'rep:dailyCashbook', label: 'كشف حساب يومي' },
    { key: 'rep:dailyMovement', label: 'تقرير الحركة اليومية' },
    { key: 'rep:dailyReport', label: 'التقرير اليومي' },
    { key: 'rep:generalOps', label: 'التقرير العام للعمليات' },
    { key: 'rep:costCenterReport', label: 'تقرير مراكزالتكلفة' },
    { key: 'rep:receiptsReport', label: 'تقارير سندات وشيكات القبض' },
    { key: 'rep:paymentsReport', label: 'تقارير سندات وشيكات الصرف' },
    { key: 'rep:agingReport', label: 'تقرير أعمار الذمم' },
    { key: 'rep:userReport', label: 'تقرير مستخدم' },
  ],
  'تقارير المواد': [
    { key: 'rep:matDetailMove', label: 'حركة مادة تفصيلي' },
    { key: 'rep:matExpiry', label: 'صلاحية المواد' },
    { key: 'rep:matDetailInv', label: 'جرد مواد تفصيلي' },
    { key: 'rep:matBrowse', label: 'استعراض المواد' },
    { key: 'rep:matMinAlerts', label: 'نواقص المواد والمتجاوزه الحد الدنى' },
    { key: 'rep:matMaxAlerts', label: 'المواد المتجاوزه الحد الاعلى' },
    { key: 'rep:matStagnant', label: 'المواد عديمة الحركة' },
    { key: 'rep:matWarranties', label: 'تقرير الكفالات' },
  ],
  'تقارير ختامية': [
    { key: 'rep:monthlyTrialBalance', label: 'ميزان المراجعة الشهرية' },
    { key: 'rep:generalTrialBalance', label: 'ميزان المراجعة العامة' },
    { key: 'rep:openingBalanceSheet', label: 'الميزانية الافتتاحية' },
    { key: 'rep:currentBalanceSheet', label: 'الميزانية الحالية' },
    { key: 'rep:operatingAccount', label: 'حساب التشغيل' },
    { key: 'rep:tradingAccount', label: 'حساب المتاجرة' },
    { key: 'rep:profitAndLoss', label: 'حساب الأرباح والخسائر' },
    { key: 'rep:organizeClosingEntries', label: 'تنضيم القيود' },
    { key: 'rep:browseClosingEntries', label: 'استعراض القيود الختامية' },
    { key: 'rep:finalBalanceSheet', label: 'الميزانية الختاميه' },
    { key: 'rep:nextPeriodPrep', label: 'التهيه لدوره قادمه' },
  ],
};

const OVAL_BUBBLES: { lines: string[]; xPct: number; yPct: number; w: number; h: number }[] = [
  { lines: ['إدارة', 'المستشفيات'], xPct: 73.5, yPct: 43, w: 148, h: 64 },
  { lines: ['الصيدليات'], xPct: 86.2, yPct: 46, w: 142, h: 52 },
  { lines: ['السوبرات'], xPct: 92.8, yPct: 58, w: 138, h: 52 },
  { lines: ['الفنادق'], xPct: 91.5, yPct: 72, w: 138, h: 52 },
  { lines: ['نظام إدارة', 'المخازن'], xPct: 84.5, yPct: 86, w: 148, h: 64 },
  { lines: ['نظام إدارة', 'الحسابات'], xPct: 73.2, yPct: 89, w: 148, h: 64 },
  { lines: ['نظام نقاط', 'البيع'], xPct: 60.5, yPct: 86, w: 140, h: 64 },
  { lines: ['المطاعم'], xPct: 53.5, yPct: 73, w: 132, h: 52 },
  { lines: ['المصانع'], xPct: 52.8, yPct: 58, w: 132, h: 52 },
  { lines: ['شؤون', 'الموظفين'], xPct: 60.5, yPct: 45, w: 140, h: 64 },
];

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  activeSection,
  panelOpen,
  activeButtonKey,
  journalOpen,
  onAction,
  onDismissPanel,
}) => {
  const hourRef = useRef<SVGLineElement>(null);
  const minRef = useRef<SVGLineElement>(null);
  const secRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      hourRef.current?.setAttribute('transform', `rotate(${h * 30} 82 82)`);
      minRef.current?.setAttribute('transform', `rotate(${m * 6} 82 82)`);
      secRef.current?.setAttribute('transform', `rotate(${s * 6} 82 82)`);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, []);

  const getPanelButtons = (): (PanelButtonDef | null)[] => {
    if (activeSection === 'الملف') return FILE_BUTTONS;
    if (activeSection === 'الاعدادات') return SETTINGS_BUTTONS;
    if (activeSection === 'ادوات') return TOOLS_BUTTONS;
    return SECTION_SHORTCUTS[activeSection] || SETTINGS_BUTTONS;
  };

  const buttons = getPanelButtons();
  const totalSlots = 30; // 6 rows x 5 columns
  const paddedSlots: (PanelButtonDef | null)[] = Array.from({ length: totalSlots }, (_, idx) => {
    return buttons[idx] || null;
  });

  return (
    <div
      dir="rtl"
      onClick={() => {
        if (panelOpen) onDismissPanel();
      }}
      className="flex-1 relative overflow-hidden"
      style={{
        background: 'linear-gradient(155deg, #c9e2f6 0%, #83aedc 55%, #5b8bc2 100%)',
      }}
    >
      {/* Subtle Hexagonal Lattice Wallpaper */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-65"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1920 800"
        aria-hidden="true"
      >
        <defs>
          <pattern id="badel-hex-pattern" width="300" height="260" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="2.5">
              <path d="M75 0 L150 43 L150 130 L75 173 L0 130 L0 43 Z" />
              <path d="M75 173 L75 260 M150 130 L225 173 M0 130 L-75 173" />
              <path d="M225 173 L300 130 L300 43 L225 0 L150 43" />
              <path d="M225 173 L225 260 M150 217 L75 260 M150 217 L225 260" />
            </g>
            <g fill="none" stroke="#5E86B8" strokeOpacity="0.2" strokeWidth="2">
              <path d="M75 8 L143 47 L143 126 L75 165 L7 126 L7 47 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="1920" height="800" fill="url(#badel-hex-pattern)" />
      </svg>

      {/* Ambient Glows */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 130,
          height: 130,
          right: 120,
          top: 30,
          background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 160,
          height: 160,
          right: 24,
          top: 360,
          opacity: 0.5,
          background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Left Branding & Analog Clock */}
      <div
        dir="ltr"
        className="hidden md:flex flex-col absolute left-0 top-0 bottom-0 w-[290px] xl:w-[340px] z-[2] pointer-events-none select-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(220,238,252,0.88) 0%, rgba(190,222,246,0.72) 65%, rgba(155,198,236,0) 100%)',
        }}
      >
        <div className="pt-4 pl-10">
          <div className="text-[44px] xl:text-[52px] font-black italic text-[#E11818] leading-none tracking-tight drop-shadow-xs">
            Badel
          </div>
          <div className="flex items-end -mt-1">
            <span className="text-[40px] xl:text-[48px] font-black italic text-[#005B6E] leading-none">
              Soft
            </span>
            <svg className="w-[74px] h-[24px] -ml-1 mb-0.5" viewBox="0 0 90 30">
              <path
                d="M2 18 C 20 4, 34 26, 52 14 S 80 8, 88 16"
                fill="none"
                stroke="#006B6B"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[11px] font-bold text-[#004466] -ml-9 mb-2.5">Pro</span>
          </div>
          <div className="text-[28px] xl:text-[32px] font-bold mt-1">
            <span className="text-[#E11818]">بديل </span>
            <span className="text-[#006680]">سوفت</span>
          </div>
        </div>

        {/* Live Analog Clock */}
        <div className="ml-3 mt-4 w-[166px] h-[166px] bg-[#f4f7fa] border border-[#dce4ef] p-1 shadow-sm flex items-center justify-center">
          <svg width="152" height="152" viewBox="0 0 164 164">
            <defs>
              <radialGradient id="clockRim" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#BFE0F8" />
                <stop offset="55%" stopColor="#7FB2E8" />
                <stop offset="100%" stopColor="#4A86C8" />
              </radialGradient>
              <radialGradient id="clockFace" cx="42%" cy="36%" r="80%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#F0F0F0" />
                <stop offset="100%" stopColor="#D2D2D2" />
              </radialGradient>
            </defs>
            <circle cx="82" cy="82" r="80" fill="url(#clockRim)" />
            <circle cx="82" cy="82" r="66" fill="url(#clockFace)" stroke="#9A9A9A" strokeWidth="1" />
            <g fill="#222">
              <circle cx="82" cy="26" r="3.4" />
              <circle cx="138" cy="82" r="3.4" />
              <circle cx="82" cy="138" r="3.4" />
              <circle cx="26" cy="82" r="3.4" />
            </g>
            <g stroke="#555" strokeWidth="1.4">
              <line x1="82" y1="18" x2="82" y2="24" />
              <line x1="146" y1="82" x2="140" y2="82" />
              <line x1="82" y1="146" x2="82" y2="140" />
              <line x1="18" y1="82" x2="24" y2="82" />
            </g>
            <line
              ref={hourRef}
              x1="82"
              y1="82"
              x2="82"
              y2="48"
              stroke="#1A1A1A"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <line
              ref={minRef}
              x1="82"
              y1="82"
              x2="82"
              y2="32"
              stroke="#1A1A1A"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <g ref={secRef}>
              <line x1="82" y1="94" x2="82" y2="28" stroke="#2244CC" strokeWidth="1.8" />
              <line x1="82" y1="94" x2="82" y2="104" stroke="#CC2222" strokeWidth="2.4" />
            </g>
            <circle cx="82" cy="82" r="4.6" fill="#111" />
          </svg>
        </div>

        {/* Contact Info */}
        <div className="mt-auto mb-5 pl-6 flex flex-col gap-1.5 text-[#005B7F] text-[18px] font-bold">
          <div>📞 Yem:771337032</div>
          <div>📞 ksa: 0562998713</div>
          <div>✉ info@badelsoft.com</div>
          <div>🌐 www.badelsoft.com</div>
        </div>
      </div>

      {/* 3 Overlapping Circular Financial Graphics (Lower Left-Center) */}
      <div
        dir="ltr"
        className="hidden lg:block absolute left-[18%] bottom-[13%] w-[340px] h-[230px] pointer-events-none select-none z-[1]"
      >
        {/* Top circle: coins & analytics chart */}
        <div className="absolute left-[75px] top-0 w-[132px] h-[132px] rounded-full border-2 border-white/80 shadow-lg overflow-hidden bg-gradient-to-br from-[#dcebf7] to-[#9cb8d4]">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <rect x="0" y="0" width="120" height="120" fill="#e6f0f8" />
            <g stroke="#b6cde3" strokeWidth="1">
              <line x1="0" y1="30" x2="120" y2="30" />
              <line x1="0" y1="60" x2="120" y2="60" />
              <line x1="0" y1="90" x2="120" y2="90" />
              <line x1="30" y1="0" x2="30" y2="120" />
              <line x1="60" y1="0" x2="60" y2="120" />
              <line x1="90" y1="0" x2="90" y2="120" />
            </g>
            <polyline
              points="10,95 35,76 58,82 86,44 112,28"
              fill="none"
              stroke="#1b5c9e"
              strokeWidth="3.5"
            />
            <g fill="#c2cad4" stroke="#6d7c8e" strokeWidth="1.5">
              <ellipse cx="64" cy="48" rx="18" ry="11" />
              <ellipse cx="76" cy="58" rx="18" ry="11" />
              <ellipse cx="88" cy="68" rx="18" ry="11" />
              <ellipse cx="98" cy="78" rx="16" ry="10" />
            </g>
          </svg>
        </div>

        {/* Bottom-left circle: hand with pen & calculator */}
        <div className="absolute left-0 bottom-[6px] w-[132px] h-[132px] rounded-full border-2 border-white/80 shadow-lg overflow-hidden bg-[#f5efe6]">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <rect width="120" height="120" fill="#f7f4ee" />
            <rect x="6" y="54" width="66" height="58" rx="4" fill="#d9dfe6" stroke="#7d8998" />
            <rect x="12" y="60" width="54" height="14" fill="#9fb8a8" />
            <g fill="#5b6675">
              <rect x="13" y="80" width="11" height="8" rx="1" />
              <rect x="28" y="80" width="11" height="8" rx="1" />
              <rect x="43" y="80" width="11" height="8" rx="1" />
              <rect x="13" y="93" width="11" height="8" rx="1" />
              <rect x="28" y="93" width="11" height="8" rx="1" />
              <rect x="43" y="93" width="11" height="18" rx="1" fill="#2e6ea6" />
            </g>
            {/* Pen & hand */}
            <path d="M52 84 L96 36 L106 46 L62 94 Z" fill="#2b4c7e" />
            <polygon points="52,84 62,94 46,98" fill="#e5b887" />
            <path d="M74 28 C86 24, 114 38, 120 56 L112 88 L76 66 Z" fill="#f1c59d" />
          </svg>
        </div>

        {/* Bottom-right circle: banknotes & coins */}
        <div className="absolute right-[18px] bottom-0 w-[136px] h-[136px] rounded-full border-2 border-white/80 shadow-lg overflow-hidden bg-[#ebe7db]">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <rect width="120" height="120" fill="#eae5d9" />
            <g transform="rotate(-14 60 45)">
              <rect x="14" y="18" width="96" height="48" rx="4" fill="#d7e2cf" stroke="#6c8c64" strokeWidth="1.5" />
              <rect x="22" y="24" width="80" height="36" fill="none" stroke="#85a47d" strokeDasharray="3 2" />
              <text x="62" y="48" textAnchor="middle" fill="#3f5d39" fontSize="14" fontWeight="bold">
                ٥٠٠
              </text>
            </g>
            <g stroke="#8e7427" strokeWidth="1.5">
              <circle cx="38" cy="88" r="18" fill="#e6c45c" />
              <circle cx="38" cy="88" r="13" fill="#d4af37" />
              <circle cx="72" cy="84" r="16" fill="#d0d4da" stroke="#7d8490" />
              <circle cx="88" cy="94" r="15" fill="#e6c45c" />
            </g>
          </svg>
        </div>
      </div>

      {/* Right ERP Branding & Full 10-Bubble Oval Network */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none select-none z-[1]">
        {/* Top-Right Stylized Logo: بديل سوفت + النظام المحاسبي الشامل */}
        <div className="absolute right-[40px] top-[34px] w-[520px] h-[160px]">
          <svg viewBox="0 0 540 165" className="w-full h-full overflow-visible">
            {/* Horizontal sweeping red lines */}
            <path d="M10 38 L525 32" stroke="#E31E24" strokeWidth="2.8" fill="none" opacity="0.88" />
            <path d="M5 55 L185 55" stroke="#E31E24" strokeWidth="2" fill="none" opacity="0.7" />
            {/* سوفت */}
            <text
              x="110"
              y="34"
              fill="#153B7E"
              fontSize="28"
              fontWeight="900"
              fontFamily="Tahoma, Arial, sans-serif"
            >
              سوفت
            </text>
            {/* بديل (two-tone blue + red calligraphic wordmark) */}
            <text
              x="315"
              y="100"
              textAnchor="middle"
              fontSize="94"
              fontWeight="900"
              fontFamily="Tahoma, Arial, sans-serif"
            >
              <tspan fill="#E31E24">ديل</tspan>
              <tspan fill="#153B7E">بـ</tspan>
            </text>
            <circle cx="448" cy="116" r="5" fill="#153B7E" />
            <text
              x="295"
              y="148"
              textAnchor="middle"
              fill="#111111"
              fontSize="31"
              fontWeight="900"
              fontFamily="Segoe UI, Tahoma, Arial, sans-serif"
            >
              النظام المحاسبي الشامل
            </text>
          </svg>
        </div>

        {/* Dashed Oval Connector + Center Watermark */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1000 500"
        >
          <ellipse
            cx="730"
            cy="332"
            rx="212"
            ry="118"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="6 6"
            opacity="0.9"
          />
        </svg>

        {/* Semi-transparent ERP + بديل سوفت Watermark inside oval */}
        <div
          dir="ltr"
          className="absolute pointer-events-none flex items-center gap-3 opacity-45"
          style={{ left: '63%', top: '60%', transform: 'translate(-20%, -15%)' }}
        >
          <span
            className="text-[48px] font-black tracking-[3px] text-[#CC2020]"
            style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 3px rgba(0,0,0,0.3)' }}
          >
            ERP
          </span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[18px] font-extrabold text-[#153B7E] ml-1">سوفت</span>
            <span className="text-[46px] font-black text-[#CC2020] -mt-2">
              <span className="text-[#CC2020]">ديل</span>
              <span className="text-[#153B7E]">بـ</span>
            </span>
          </div>
        </div>

        {/* All 10 White Module Bubbles */}
        {OVAL_BUBBLES.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full flex flex-col items-center justify-center text-center font-extrabold text-[#005B7F] leading-tight shadow-[0_3px_10px_rgba(20,55,95,0.22)] border border-white/80"
            style={{
              left: `${b.xPct}%`,
              top: `${b.yPct}%`,
              width: b.w,
              height: b.h,
              transform: 'translate(-50%, -50%)',
              fontSize: b.lines.length > 1 ? 15 : 16,
              background:
                'radial-gradient(ellipse at 35% 30%, #FFFFFF 0%, #F4F9FD 75%, #DFECF7 100%)',
            }}
          >
            {b.lines.map((ln, li) => (
              <span key={li}>{ln}</span>
            ))}
          </div>
        ))}
      </div>

      {/* Central Section Command Panel */}
      {panelOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-[10] mx-auto w-[96%] max-w-[1100px] bg-[#fff0f5] border-2 border-[#7f8391] shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
        >
          <div className="h-[46px] bg-gradient-to-b from-[#fbfbfb] to-[#e6e8f2] border-b border-[#7f8391] flex items-center justify-center text-[20px] font-bold text-[#111] relative">
            <span>{activeSection}</span>
            <button
              type="button"
              title="إخفاء اللوحة"
              onClick={onDismissPanel}
              className="absolute left-3 px-2 py-0.5 text-[14px] text-[#555] hover:bg-[#dfe4f0] hover:text-black cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 bg-[#fff0f5]">
            {paddedSlots.map((slot, idx) => {
              if (!slot) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-[74px] sm:h-[82px] bg-[#fff0f5] border border-[#e3d2d8]"
                  />
                );
              }
              const isSelected =
                activeButtonKey === slot.key || (slot.key === 'journal' && journalOpen);
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => onAction(slot.key)}
                  className={`h-[74px] sm:h-[82px] border-2 border-black px-2 text-[14px] sm:text-[15px] font-bold flex items-center justify-center text-center leading-snug whitespace-pre-line cursor-pointer transition-colors ${
                    slot.textBlue ? 'text-[#0000cc]' : 'text-black'
                  } ${
                    isSelected
                      ? 'bg-[#a3a5d8] shadow-[inset_0_0_0_1px_#000]'
                      : 'bg-[#c0c0ff] hover:bg-[#b0b0ff] active:bg-[#9c9cf5]'
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
