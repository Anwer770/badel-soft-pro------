import React, { useEffect, useRef, useState } from 'react';
import { toAr, toEn } from '../data/erpDefaults';
import type { GeneralPropsState, MsgConfig } from '../types/erp';
import { CalendarPopup } from './CalendarPopup';
import { DraggableWindow } from './DraggableWindow';
import { FolderBrowseDialog } from './FolderBrowseDialog';

interface PropsDialogProps {
  open: boolean;
  initialTab?: number;
  zIndex: number;
  value: GeneralPropsState;
  onFocus: () => void;
  onClose: () => void;
  onSave: (next: GeneralPropsState) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onOpenAiGenerateLogo: () => void;
  onOpenAiAnalyzeLogo: (logoData: string) => void;
}

const TABS = [
  'خصائص عامة',
  'النسخ الاحتياطية',
  'الفترة المالية',
  'بيانات الترويسة والشعار',
  'خصائص اخرى',
];

const MODULES_ROW_1 = ['الحسابات', 'ادارة فندق', 'تصنيع', 'المطاعم'];
const MODULES_ROW_2 = ['المخازن', 'شؤون الموظفين', 'فواتير المياه والكهرباء', 'العيادات والمراكز الطبية'];

export const PropsDialog: React.FC<PropsDialogProps> = ({
  open,
  initialTab = 0,
  zIndex,
  value,
  onFocus,
  onClose,
  onSave,
  onShowMsg,
  onOpenAiGenerateLogo,
  onOpenAiAnalyzeLogo,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [draft, setDraft] = useState<GeneralPropsState>(value);
  const [confirmPass, setConfirmPass] = useState(value.password);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [calField, setCalField] = useState<'dateFrom' | 'dateTo' | null>(null);
  const [previewScaled, setPreviewScaled] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setConfirmPass(value.password);
      setActiveTab(initialTab);
      setPreviewScaled(!!value.logoData);
    }
  }, [open, value, initialTab]);

  const handleOk = async () => {
    if (draft.password !== confirmPass) {
      await onShowMsg({
        title: 'خصائص الملف',
        icon: 'warn',
        text: 'كلمة المرور وتأكيدها غير متطابقين.',
      });
      return;
    }
    onSave(draft);
    onClose();
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setDraft((prev) => ({
        ...prev,
        logoData: result,
        logoName: file.name,
      }));
      setPreviewScaled(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSysDate = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    void onShowMsg({
      title: 'ضبط تاريخ النظام',
      icon: 'info',
      text: `تاريخ النظام الحالي:\n${formatted}`,
    });
  };

  return (
    <>
      <DraggableWindow
        open={open}
        title="خصائص الملف"
        width={900}
        height={600}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div className="flex-1 flex flex-col bg-[#f0f0f0] p-2.5 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-end px-1 border-b border-[#8e8e8e]">
            {TABS.map((t, idx) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-3 py-1 text-[13px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
                  activeTab === idx
                    ? 'bg-white text-black relative top-[1px] pb-[6px] z-10'
                    : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e5f1fb]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* White Tab Pane */}
          <div className="flex-1 bg-white border border-[#8e8e8e] border-t-0 p-4 overflow-y-auto erp-scrollbar">
            {activeTab === 0 && (
              <div className="flex flex-col gap-2.5 max-w-[780px] mx-auto">
                <div className="flex items-center gap-3">
                  <label className="w-[140px] font-bold text-[13px]">نوع قاعدة البيانات</label>
                  <select
                    value={draft.dbType}
                    disabled
                    dir="rtl"
                    className="erp-field flex-1 bg-[#f0f0f0] text-left"
                  >
                    <option>SQL Server</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[140px] font-bold text-[13px]">اسم السيرفر</label>
                  <input
                    dir="ltr"
                    value={draft.serverName}
                    onChange={(e) => setDraft({ ...draft, serverName: e.target.value })}
                    className="erp-field flex-1 text-right bg-[#f4f4f4]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, serverName: draft.pcName || 'DESKTOP-RNJ1CCU' })
                    }
                    className="erp-classic-btn h-[28px] px-3 text-[13px] shrink-0"
                  >
                    اسم الكمبيوتر الحالي
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[140px] font-bold text-[13px]">قاعدة البيانات</label>
                  <select
                    value={draft.dbName}
                    disabled
                    dir="rtl"
                    className="erp-field flex-1 bg-[#f0f0f0] text-left"
                  >
                    <option>{draft.dbName}</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[155px] font-bold text-[14px]">اسم الشركة</label>
                  <input
                    value={draft.company}
                    onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                    className="erp-field flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[155px] font-bold text-[14px]">مدير النظام</label>
                  <input
                    dir="ltr"
                    value={draft.admin}
                    onChange={(e) => setDraft({ ...draft, admin: e.target.value })}
                    className="erp-field flex-1 text-right"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                    <label className="w-[155px] font-bold text-[14px]">كلمة المرور</label>
                    <input
                      type="password"
                      value={draft.password}
                      onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                      className="erp-field flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                    <label className="w-[130px] font-bold text-[14px]">تأكيد كلمة المرور</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className="erp-field flex-1"
                    />
                  </div>
                </div>

                <fieldset className="border border-[#dcdcdc] p-4 mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {MODULES_ROW_1.map((mod) => (
                      <label key={mod} className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!draft.modules[mod]}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              modules: { ...draft.modules, [mod]: e.target.checked },
                            })
                          }
                          className="w-4 h-4 accent-[#0078d7]"
                        />
                        <span>{mod}</span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MODULES_ROW_2.map((mod) => (
                      <label key={mod} className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!draft.modules[mod]}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              modules: { ...draft.modules, [mod]: e.target.checked },
                            })
                          }
                          className="w-4 h-4 accent-[#0078d7]"
                        />
                        <span>{mod}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {activeTab === 1 && (
              <div className="flex flex-col gap-4 pt-1 max-w-[780px] mx-auto">
                <div className="flex items-center gap-3">
                  <label className="w-[165px] font-bold text-[13px]">موقع النسخة الاحتياطية</label>
                  <input
                    dir="ltr"
                    value={draft.backupPath}
                    onChange={(e) => setDraft({ ...draft, backupPath: e.target.value })}
                    className="erp-field flex-1 text-right font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setBrowseOpen(true)}
                    className="erp-classic-btn h-[28px] px-4 text-[13px] shrink-0"
                  >
                    استعراض...
                  </button>
                </div>

                <div className="flex justify-start pr-[145px]">
                  <label className="flex items-center gap-2 font-bold text-[13px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.backupForce}
                      onChange={(e) => setDraft({ ...draft, backupForce: e.target.checked })}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>الحفظ إجباري في موقع النسخة الاحتياطية المحدد</span>
                  </label>
                </div>

                <div className="flex flex-col gap-3 md:pr-[240px] pt-2">
                  <label className="flex items-center gap-2.5 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.backupNoAlert}
                      onChange={(e) => setDraft({ ...draft, backupNoAlert: e.target.checked })}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>عدم التنبيه عند عمل نسخة احتياطية الية</span>
                  </label>
                  <label className="flex items-center gap-2.5 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.backupOnStart}
                      onChange={(e) => setDraft({ ...draft, backupOnStart: e.target.checked })}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>عمل نسخة احتياطية عند تشغيل النظام</span>
                  </label>
                  <label className="flex items-center gap-2.5 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.backupOnClose}
                      onChange={(e) => setDraft({ ...draft, backupOnClose: e.target.checked })}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>عمل نسخة احتياطية عند غلق النظام</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="flex flex-col gap-4 pt-2 max-w-[660px] mx-auto">
                <div className="flex items-center gap-3">
                  <label className="w-[130px] font-bold text-[13px]">العام الافتراضي</label>
                  <input
                    value={toAr(draft.year)}
                    onChange={(e) => {
                      const val = parseInt(toEn(e.target.value), 10);
                      if (!Number.isNaN(val)) setDraft({ ...draft, year: val });
                    }}
                    className="erp-field w-[125px] text-left font-bold"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[130px] font-bold text-[13px]">من تاريخ</label>
                  <div
                    dir="ltr"
                    className="flex items-center border border-[#7a7a7a] bg-white h-[28px] w-[265px]"
                  >
                    <input
                      dir="ltr"
                      readOnly
                      value={draft.dateFrom}
                      className="flex-1 h-full px-2 text-left text-[13px] font-bold outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setCalField('dateFrom')}
                      className="px-2 h-full border-l border-[#ccc] bg-[#f4f4f4] hover:bg-[#e5f1fb] flex items-center gap-1 cursor-pointer"
                    >
                      <span>📅</span>
                      <span className="text-[10px]">▾</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[130px] font-bold text-[13px]">الى تاريخ</label>
                  <div
                    dir="ltr"
                    className="flex items-center border border-[#7a7a7a] bg-white h-[28px] w-[265px]"
                  >
                    <input
                      dir="ltr"
                      readOnly
                      value={draft.dateTo}
                      className="flex-1 h-full px-2 text-left text-[13px] font-bold outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setCalField('dateTo')}
                      className="px-2 h-full border-l border-[#ccc] bg-[#f4f4f4] hover:bg-[#e5f1fb] flex items-center gap-1 cursor-pointer"
                    >
                      <span>📅</span>
                      <span className="text-[10px]">▾</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pr-4 pt-3">
                  {[
                    'تجاهل الفترة المحددة والسماح بإدخال تاريخ من خارجها',
                    'التنبيه عند كتابة تاريخ خارج الفترة المحددة',
                    'عدم السماح بكتابة تاريخ خارج الفترة المحددة',
                  ].map((label, idx) => (
                    <label key={label} className="flex items-center gap-2.5 font-bold text-[13px] cursor-pointer">
                      <input
                        type="radio"
                        name="fiscalRule"
                        checked={draft.fiscalRule === idx}
                        onChange={() => setDraft({ ...draft, fiscalRule: idx })}
                        className="w-4 h-4 accent-[#0078d7]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.sharedHeader}
                      onChange={(e) => setDraft({ ...draft, sharedHeader: e.target.checked })}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>استخدام نموذج الترويسة المشتركة بدلا من بيانات الترويسة أدناه</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.centerHeader}
                      onChange={(e) => setDraft({ ...draft, centerHeader: e.target.checked })}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>توسيط الترويسة لكافة التقارير</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <fieldset className="border border-[#dcdcdc] p-3">
                    <legend className="px-2 font-bold text-[13px]">ترويسة يمنى عربي</legend>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <label className="w-[64px] font-bold text-[13px]">الأسم</label>
                        <input
                          disabled={draft.sharedHeader}
                          value={draft.hdrArName}
                          onChange={(e) => setDraft({ ...draft, hdrArName: e.target.value })}
                          className="erp-field flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="w-[64px] font-bold text-[13px]">العنوان</label>
                        <input
                          disabled={draft.sharedHeader}
                          value={draft.hdrArAddr}
                          onChange={(e) => setDraft({ ...draft, hdrArAddr: e.target.value })}
                          className="erp-field flex-1"
                        />
                      </div>
                      <div className="flex items-start gap-2">
                        <label className="w-[64px] font-bold text-[13px] pt-1">التلفون</label>
                        <textarea
                          rows={2}
                          disabled={draft.sharedHeader}
                          value={draft.hdrArTel}
                          onChange={(e) => setDraft({ ...draft, hdrArTel: e.target.value })}
                          className="w-full border border-[#7a7a7a] bg-white disabled:bg-[#f3f3f3] disabled:text-[#333] p-1.5 text-[13px] outline-none flex-1"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset dir="ltr" className="border border-[#dcdcdc] p-3">
                    <legend className="px-2 font-bold text-[13px]">ترويسة يسرى أجنبي</legend>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <label className="w-[64px] font-bold text-[13px]">Name</label>
                        <input
                          disabled={draft.sharedHeader}
                          value={draft.hdrEnName}
                          onChange={(e) => setDraft({ ...draft, hdrEnName: e.target.value })}
                          className="erp-field flex-1 text-left"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="w-[64px] font-bold text-[13px]">Address</label>
                        <input
                          disabled={draft.sharedHeader}
                          value={draft.hdrEnAddr}
                          onChange={(e) => setDraft({ ...draft, hdrEnAddr: e.target.value })}
                          className="erp-field flex-1 text-left"
                        />
                      </div>
                      <div className="flex items-start gap-2">
                        <label className="w-[64px] font-bold text-[13px] pt-1">Tel</label>
                        <textarea
                          rows={2}
                          disabled={draft.sharedHeader}
                          value={draft.hdrEnTel}
                          onChange={(e) => setDraft({ ...draft, hdrEnTel: e.target.value })}
                          className="w-full border border-[#7a7a7a] bg-white disabled:bg-[#f3f3f3] disabled:text-[#333] p-1.5 text-[13px] text-left outline-none flex-1"
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* Logo Zone */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_1fr] gap-3 items-stretch mt-1">
                  <div className="h-[195px] border border-[#b8b8b8] bg-white flex items-center justify-center p-2 overflow-hidden">
                    {draft.logoData ? (
                      <img
                        src={draft.logoData}
                        alt="شعار الشركة"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[#999] text-[12px]">لا توجد صورة شعار محددة</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 justify-start pt-0.5">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFile}
                      className="hidden"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="erp-classic-btn h-[26px] px-4 text-[13px] w-[105px]"
                      >
                        استعرض...
                      </button>
                    </div>
                    <input
                      readOnly
                      value={draft.logoName}
                      className="h-[24px] border border-[#9a9a9a] bg-[#e5e5e5] px-1.5 text-[12px] outline-none w-full"
                    />
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <label className="text-[12px] font-bold">الارتفاع</label>
                      <input
                        type="number"
                        min={20}
                        max={600}
                        value={draft.logoHeight}
                        onChange={(e) =>
                          setDraft({ ...draft, logoHeight: Number(e.target.value) || 200 })
                        }
                        className="erp-field w-[78px] h-[24px] text-center font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[12px] font-bold">العرض</label>
                      <input
                        type="number"
                        min={20}
                        max={600}
                        value={draft.logoWidth}
                        onChange={(e) =>
                          setDraft({ ...draft, logoWidth: Number(e.target.value) || 200 })
                        }
                        className="erp-field w-[78px] h-[24px] text-center font-bold"
                      />
                    </div>
                    <div className="flex flex-col items-end gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!draft.logoData) {
                            void onShowMsg({
                              title: 'معاينة',
                              icon: 'info',
                              text: 'لم يتم اختيار صورة للشعار بعد.',
                            });
                            return;
                          }
                          setPreviewScaled(true);
                        }}
                        className="erp-classic-btn h-[26px] text-[13px] w-[105px]"
                      >
                        معاينة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft({ ...draft, logoData: null, logoName: '' });
                          setPreviewScaled(false);
                        }}
                        className="erp-classic-btn h-[26px] text-[13px] w-[130px]"
                      >
                        حذف الصورة
                      </button>
                      <div className="flex gap-1 w-full">
                        <button
                          type="button"
                          onClick={onOpenAiGenerateLogo}
                          className="erp-classic-btn focused h-[24px] text-[11px] flex-1"
                        >
                          تصميم شعار AI
                        </button>
                        {draft.logoData && (
                          <button
                            type="button"
                            onClick={() => onOpenAiAnalyzeLogo(draft.logoData!)}
                            className="erp-classic-btn h-[24px] text-[11px] px-2"
                          >
                            تحليل
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-[195px] border border-[#b8b8b8] bg-white flex items-center justify-center p-2 overflow-hidden">
                    {previewScaled && draft.logoData ? (
                      <img
                        src={draft.logoData}
                        alt="معاينة الشعار بالأبعاد"
                        referrerPolicy="no-referrer"
                        style={{
                          width: Math.min(draft.logoWidth, 310),
                          height: Math.min(draft.logoHeight, 180),
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <span className="text-[#999] text-[12px]">معاينة أبعاد الطباعة</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <label className="w-[130px] font-bold">الرقم الضريبي</label>
                    <input
                      value={draft.taxNumber}
                      onChange={(e) => setDraft({ ...draft, taxNumber: e.target.value })}
                      className="erp-field flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-[130px] font-bold">مصطلح المدين</label>
                    <input
                      value={draft.debitTerm}
                      onChange={(e) => setDraft({ ...draft, debitTerm: e.target.value })}
                      className="erp-field flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-[130px] font-bold">مصطلح الدائن</label>
                    <input
                      value={draft.creditTerm}
                      onChange={(e) => setDraft({ ...draft, creditTerm: e.target.value })}
                      className="erp-field flex-1"
                    />
                  </div>

                  <fieldset className="border border-[#dcdcdc] p-3 mt-1">
                    <legend className="px-2 font-bold text-[13px]">طريقة العرض أوامر النظام</legend>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.showMenus}
                          onChange={(e) => setDraft({ ...draft, showMenus: e.target.checked })}
                          className="w-4 h-4 accent-[#0078d7]"
                        />
                        <span>قوائم</span>
                      </label>
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.showTiles}
                          onChange={(e) => setDraft({ ...draft, showTiles: e.target.checked })}
                          className="w-4 h-4 accent-[#0078d7]"
                        />
                        <span>مربعات</span>
                      </label>
                    </div>
                  </fieldset>

                  <fieldset
                    disabled={!draft.linkWithdrawAttendance}
                    className={`border border-[#dcdcdc] p-3 ${
                      !draft.linkWithdrawAttendance ? 'opacity-60' : ''
                    }`}
                  >
                    <legend className="px-2 font-bold text-[13px]">
                      نسبة المسحوبات المسموح بها من الراتب
                    </legend>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={!draft.linkWithdrawAttendance}
                      value={draft.withdrawPercent}
                      onChange={(e) =>
                        setDraft({ ...draft, withdrawPercent: Number(e.target.value) || 0 })
                      }
                      className="erp-field w-[120px] text-center font-bold"
                    />
                  </fieldset>

                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.linkWithdrawAttendance}
                      onChange={(e) =>
                        setDraft({ ...draft, linkWithdrawAttendance: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>ربط مسحوبات الموظفين بالدوام</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.useEInvoice}
                      onChange={(e) => setDraft({ ...draft, useEInvoice: e.target.checked })}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>استخدام الفاتورة الإلكترونية</span>
                  </label>
                </div>

                <div className="flex flex-col gap-2.5">
                  {[
                    ['allowNegativeStock', 'السماح بإخراج المواد ذات الرصيد السالب'],
                    ['noFractionalQty', 'عدم التعامل بالكميات الكسرية'],
                    ['requireExpiryDate', 'اجباري ادخال تاريخ الصلاحية'],
                    ['blockSaveInsufficientExpiry', 'امتناع الحفظ عند عدم وجود رصيد كافي لتاريخ صلاحية'],
                    ['blockSaveExpired', 'امتناع الحفظ عند انتهاء تاريخ صلاحية'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(draft[key as keyof GeneralPropsState])}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                        className="w-4 h-4 accent-[#0078d7]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}

                  <div className="flex flex-col items-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleSysDate}
                      className="erp-classic-btn h-[28px] w-[165px] text-[13px]"
                    >
                      ضبط تاريخ النظام
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void onShowMsg({
                          title: 'تأمين قاعدة البيانات',
                          icon: 'info',
                          text: 'تم فحص إعدادات التأمين وتشفير الاتصال بنجاح.',
                        })
                      }
                      className="erp-classic-btn h-[28px] w-[165px] text-[13px] text-[#555]"
                    >
                      تأمين
                    </button>
                  </div>

                  <div className="flex justify-end mt-1">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.integratedSecurity}
                        onChange={(e) =>
                          setDraft({ ...draft, integratedSecurity: e.target.checked })
                        }
                        className="w-4 h-4 accent-[#0078d7]"
                      />
                      <span dir="ltr">Integrated Security</span>
                    </label>
                  </div>

                  <fieldset className="border border-[#dcdcdc] p-3 mt-1">
                    <legend className="px-2 font-bold text-[13px]">طريقة الجرد</legend>
                    <div className="flex gap-6 justify-center">
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="invMethod"
                          checked={draft.inventoryMethod === 'periodic'}
                          onChange={() => setDraft({ ...draft, inventoryMethod: 'periodic' })}
                          className="w-4 h-4 accent-[#0078d7]"
                        />
                        <span>دوري</span>
                      </label>
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="invMethod"
                          checked={draft.inventoryMethod === 'perpetual'}
                          onChange={() => setDraft({ ...draft, inventoryMethod: 'perpetual' })}
                          className="w-4 h-4 accent-[#0078d7]"
                        />
                        <span>مستمر</span>
                      </label>
                    </div>
                  </fieldset>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Buttons */}
          <div className="mt-2 py-2 border border-[#dcdcdc] bg-[#f0f0f0] flex items-center justify-center gap-28">
            <button
              type="button"
              onClick={handleOk}
              className="erp-classic-btn w-[125px] h-[30px] text-[13px] font-bold"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={onClose}
              className="erp-classic-btn focused w-[125px] h-[30px] text-[13px] font-bold"
            >
              الغاء الأمر
            </button>
          </div>
        </div>
      </DraggableWindow>

      <FolderBrowseDialog
        open={browseOpen}
        initialPath={draft.backupPath}
        onConfirm={(p) => {
          setDraft((prev) => ({ ...prev, backupPath: p }));
          setBrowseOpen(false);
        }}
        onCancel={() => setBrowseOpen(false)}
      />

      <CalendarPopup
        open={calField !== null}
        value={calField ? draft[calField] : '2026/01/01'}
        onSelect={(dateStr) => {
          if (calField) setDraft((prev) => ({ ...prev, [calField]: dateStr }));
        }}
        onClose={() => setCalField(null)}
      />
    </>
  );
};
