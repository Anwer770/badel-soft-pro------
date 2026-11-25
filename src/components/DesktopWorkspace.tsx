import React, { useEffect, useRef } from 'react';
import type { SectionKey } from '../types/erp';

interface DesktopWorkspaceProps {
  activeSection: SectionKey;
  activeButtonKey: string | null;
  journalOpen: boolean;
  onAction: (actionKey: string) => void;
}

interface PanelButtonDef {
  key: string;
  label: string;
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
  { key: 'pagesSetup', label: 'تعريف ترويسة / تذيل' },
  { key: 'contact', label: 'اتصال' },
  { key: 'companiesPicker', label: 'قائمة الشركات' },
  { key: 'excelImport', label: 'استيراد من اكسل' },
  null,
  { key: 'shutdown', label: 'انهاء البرنامج' },
  { key: 'aiStudioGenerate', label: 'الاستوديو الذكي للصور' },
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
    { key: 'journal', label: 'اليومية العامة' },
    { key: 'accTree', label: 'شجرة الحسابات' },
    { key: 'detailedStatement', label: 'كشف حساب تفصيلي' },
    { key: 'accountOptions', label: 'خيارات الحسابات العامة' },
    { key: 'currencies', label: 'قائمة العملات' },
  ],
  القيود: [
    { key: 'journal', label: 'اليومية العامة' },
    { key: 'aiStudioAnalyze', label: 'استخراج قيد من صورة مستند' },
    { key: 'generalReport', label: 'مراجعة القيود اليومية' },
  ],
  المواد: [
    { key: 'propsOther', label: 'خيارات الجرد وصلاحية المواد' },
    { key: 'accountOptions', label: 'طريقة تسعير الجرد' },
    { key: 'alerts', label: 'تنبيهات انخفاض وصلاحية المواد' },
  ],
  'شؤون الموظفين': [
    { key: 'users', label: 'قائمة المستخدمين والصلاحيات' },
    { key: 'propsOther', label: 'ضبط نسبة مسحوبات الموظفين' },
    { key: 'aiStudioGenerate', label: 'تصميم بطاقات وشعارات الموظفين' },
  ],
  'تقارير الحسابات': [
    { key: 'detailedStatement', label: 'كشف حساب تفصيلي' },
    { key: 'generalReport', label: 'التقرير العام للحسابات' },
    { key: 'printSetup', label: 'إعداد نماذج الطباعة' },
    { key: 'pagesSetup', label: 'تصميم الترويسة والتذيل' },
  ],
  'تقارير المواد': [
    { key: 'generalReport', label: 'التقرير العام' },
    { key: 'printSetup', label: 'إعداد نماذج الطباعة' },
  ],
  'تقارير ختامية': [
    { key: 'generalReport', label: 'ملخص الأرصدة الختامي' },
    { key: 'propsFiscal', label: 'إعدادات الفترة المالية' },
    { key: 'printSetup', label: 'إعداد نماذج الطباعة' },
  ],
};

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  activeSection,
  activeButtonKey,
  journalOpen,
  onAction,
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
      className="flex-1 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #c5dff4 0%, #79a6d8 55%, #5b8cc4 100%)',
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
            <g fill="none" stroke="#5E86B8" strokeOpacity="0.22" strokeWidth="2">
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
            'linear-gradient(90deg, rgba(220,238,252,0.92) 0%, rgba(190,222,246,0.78) 65%, rgba(155,198,236,0) 100%)',
        }}
      >
        <div className="pt-4 pl-10">
          <div className="text-[46px] xl:text-[54px] font-black italic text-[#E11818] leading-none tracking-tight drop-shadow-xs">
            Badel
          </div>
          <div className="flex items-end -mt-1">
            <span className="text-[42px] xl:text-[50px] font-black italic text-[#005B6E] leading-none">
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
            <span className="text-[12px] font-bold text-[#004466] ml-0.5 mb-1">Pro</span>
          </div>
          <div className="text-[30px] xl:text-[34px] font-bold mt-1">
            <span className="text-[#E11818]">بديل </span>
            <span className="text-[#006680]">سوفت</span>
          </div>
        </div>

        {/* Live Analog Clock */}
        <div className="ml-6 mt-5 w-[156px] h-[156px] rounded-full bg-white p-1 shadow-[0_6px_18px_rgba(30,60,100,0.22)] flex items-center justify-center">
          <svg width="148" height="148" viewBox="0 0 164 164">
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

      {/* Right ERP Branding & Bubble Network */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none select-none z-[1]">
        <svg className="absolute right-0 top-[76px] w-[420px] h-[55px]" viewBox="0 0 440 60">
          <path
            d="M0 44 C 140 18, 300 10, 440 22"
            fill="none"
            stroke="#E01B24"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
        <div className="absolute right-[78px] top-[76px] text-[96px] font-black text-[#0F4987] leading-none">
          بديل<span className="inline-block w-3 h-3 rounded-full bg-[#E01B24] ml-2" />
        </div>
        <div className="absolute right-[24px] top-[196px] text-[34px] font-extrabold text-[#111]">
          النظام المحاسبي المتكامل
        </div>
        <div
          className="absolute right-[130px] top-[280px] text-[56px] font-black tracking-[6px] text-[#CC2020]"
          style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 3px rgba(0,0,0,0.35)' }}
        >
          ERP
        </div>

        <svg
          className="absolute inset-0 w-full h-full opacity-90"
          preserveAspectRatio="none"
          viewBox="0 0 1920 800"
        >
          <g stroke="#FFFFFF" strokeWidth="2.6" strokeDasharray="9 8" fill="none">
            <path d="M1560 405 L1648 411" />
            <path d="M1690 440 L1760 470" />
            <path d="M1786 512 L1776 545" />
            <path d="M1740 605 L1680 635" />
            <path d="M1560 668 L1500 678" />
            <path d="M1330 680 L1268 668" />
            <path d="M1100 655 L1040 640" />
          </g>
        </svg>

        <div
          className="absolute right-[160px] top-[340px] w-[180px] h-[64px] rounded-full flex items-center justify-center text-center text-[17px] font-extrabold text-[#005B7F] shadow-md"
          style={{
            background: 'radial-gradient(ellipse at 35% 30%, #FFFFFF 0%, #F4F9FD 75%, #DFECF7 100%)',
          }}
        >
          الصيدليات
        </div>
        <div
          className="absolute right-[32px] top-[410px] w-[180px] h-[64px] rounded-full flex items-center justify-center text-center text-[17px] font-extrabold text-[#005B7F] shadow-md"
          style={{
            background: 'radial-gradient(ellipse at 35% 30%, #FFFFFF 0%, #F4F9FD 75%, #DFECF7 100%)',
          }}
        >
          السوبرات
        </div>
        <div
          className="absolute right-[48px] top-[494px] w-[176px] h-[62px] rounded-full flex items-center justify-center text-center text-[17px] font-extrabold text-[#005B7F] shadow-md"
          style={{
            background: 'radial-gradient(ellipse at 35% 30%, #FFFFFF 0%, #F4F9FD 75%, #DFECF7 100%)',
          }}
        >
          الفنادق
        </div>
        <div
          className="absolute right-[164px] top-[572px] w-[186px] h-[72px] rounded-full flex items-center justify-center text-center text-[16px] font-extrabold text-[#005B7F] leading-tight shadow-md"
          style={{
            background: 'radial-gradient(ellipse at 35% 30%, #FFFFFF 0%, #F4F9FD 75%, #DFECF7 100%)',
          }}
        >
          نظام إدارة
          <br />
          المخازن
        </div>
        <div
          className="absolute right-[380px] top-[590px] w-[186px] h-[72px] rounded-full flex items-center justify-center text-center text-[16px] font-extrabold text-[#005B7F] leading-tight shadow-md"
          style={{
            background: 'radial-gradient(ellipse at 35% 30%, #FFFFFF 0%, #F4F9FD 75%, #DFECF7 100%)',
          }}
        >
          نظام إدارة
          <br />
          الحسابات
        </div>
        <div
          className="absolute right-[600px] top-[574px] w-[178px] h-[72px] rounded-full flex items-center justify-center text-center text-[16px] font-extrabold text-[#005B7F] leading-tight shadow-md"
          style={{
            background: 'radial-gradient(ellipse at 35% 30%, #FFFFFF 0%, #F4F9FD 75%, #DFECF7 100%)',
          }}
        >
          نظام نقاط
          <br />
          البيع
        </div>
      </div>

      {/* Central Section Command Panel */}
      <div className="relative z-[10] mx-auto w-[96%] max-w-[1100px] bg-[#fff0f5] border-2 border-[#7f8391] shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
        <div className="h-[46px] bg-gradient-to-b from-[#fbfbfb] to-[#e6e8f2] border-b border-[#7f8391] flex items-center justify-center text-[20px] font-bold text-[#111]">
          {activeSection}
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
                className={`h-[74px] sm:h-[82px] border-2 border-black px-2 text-[14px] sm:text-[15px] font-bold text-black flex items-center justify-center text-center leading-snug whitespace-pre-line cursor-pointer transition-colors ${
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
    </div>
  );
};
