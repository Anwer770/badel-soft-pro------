import React, { useState } from 'react';
import { PRINTERS_LIST } from '../data/erpDefaults';
import type { GeneralPropsState } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface PrintSetupDialogProps {
  open: boolean;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  onOpenPages: () => void;
  onNotify: (msg: string) => void;
}

export const PrintSetupDialog: React.FC<PrintSetupDialogProps> = ({
  open,
  zIndex,
  onFocus,
  onClose,
  onOpenPages,
  onNotify,
}) => {
  const [tab, setTab] = useState<0 | 1>(0);
  const [printer, setPrinter] = useState(PRINTERS_LIST[0]);
  const [dir, setDir] = useState('طولي');

  return (
    <DraggableWindow
      open={open}
      title="إعداد نماذج الطباعة"
      width={1020}
      height={680}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-[13px]">النموذج</label>
          <select className="erp-field flex-1 max-w-[460px]">
            <option>form1</option>
          </select>
          <button
            type="button"
            onClick={() => onNotify('تم إنشاء نموذج طباعة جديد')}
            className="erp-classic-btn h-[28px] px-3 text-[12px]"
          >
            جديد
          </button>
          <button
            type="button"
            onClick={() => onNotify('تم حفظ إعدادات النموذج')}
            className="erp-classic-btn h-[28px] px-3 text-[12px]"
          >
            حفظ
          </button>
          <button
            type="button"
            onClick={() => onNotify('لا يمكن حذف النموذج الافتراضي')}
            className="erp-classic-btn h-[28px] px-3 text-[12px]"
          >
            حذف
          </button>
        </div>

        <div className="flex border-b border-[#8e8e8e]">
          {(['خصائص عامة', 'خصائص الجدول'] as const).map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setTab(idx as 0 | 1)}
              className={`px-3.5 py-1.5 text-[13px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
                tab === idx ? 'bg-white relative top-[1px] pb-[7px]' : 'bg-[#e8eaf0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white border border-[#8e8e8e] border-t-0 p-3 overflow-y-auto erp-scrollbar">
          {tab === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-bold">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0078d7]" />
                    <span>النموذج الإفتراضي</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-[13px]">عدد النسخ</label>
                    <input type="number" defaultValue={1} className="erp-field w-16 text-center" />
                  </div>
                </div>

                <fieldset className="border border-[#bbc] p-2.5 bg-[#fbfcfe]">
                  <legend className="px-1.5 font-bold text-[13px]">هوامش الصفحة</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['هامش أعلى', 5],
                      ['هامش أيسر', 5],
                      ['هامش أسفل', 10],
                      ['هامش أيمن', 5],
                    ].map(([lbl, def]) => (
                      <div key={String(lbl)} className="flex items-center gap-2">
                        <label className="w-20 text-[12px] font-bold">{lbl}</label>
                        <input
                          type="number"
                          defaultValue={Number(def)}
                          className="erp-field w-16 text-center"
                        />
                        <span className="text-[12px]">ملم</span>
                      </div>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="border border-[#bbc] p-2.5 bg-[#fbfcfe]">
                  <legend className="px-1.5 font-bold text-[13px]">ترويسة الجدول</legend>
                  <div className="flex gap-4">
                    {['ألوان الجدول', 'خلفية بيضاء', 'خلفية سوداء'].map((opt, idx) => (
                      <label key={opt} className="flex items-center gap-1.5 text-[13px] font-semibold">
                        <input
                          type="radio"
                          name="tblHdrStyle"
                          defaultChecked={idx === 0}
                          className="accent-[#0078d7]"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="border border-[#bbc] p-2.5 bg-[#fbfcfe]">
                  <legend className="px-1.5 font-bold text-[13px]">الخطوط</legend>
                  <div className="flex flex-col gap-2">
                    {['نسبة إرتفاع العنوان', 'نسبة إرتفاع الجدول', 'نسبة إرتفاع المجموع'].map((lbl) => (
                      <div key={lbl} className="flex items-center gap-2">
                        <label className="w-36 text-[12px] font-bold">{lbl}</label>
                        <input defaultValue="Tahoma, 10pt" className="erp-field flex-1" />
                        <input type="number" defaultValue={8} className="erp-field w-14 text-center" />
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="flex flex-col gap-3">
                <fieldset className="border border-[#bbc] p-2.5 bg-[#fbfcfe] flex flex-col gap-2">
                  <legend className="px-1.5 font-bold text-[13px]">اتجاه الطباعة</legend>
                  <select
                    value={dir}
                    onChange={(e) => setDir(e.target.value)}
                    className="erp-field"
                  >
                    <option>طولي</option>
                    <option>عرضي</option>
                  </select>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" className="accent-[#0078d7]" />
                    <span>طباعة الجدول من اليسار إلى اليمين</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" className="accent-[#0078d7]" />
                    <span>طباعة التذيل نهاية الجدول مباشرة</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" defaultChecked className="accent-[#0078d7]" />
                    <span>طباعة ألوان الجدول</span>
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[12px] font-bold shrink-0">الطابعة الافتراضية</label>
                    <select
                      value={printer}
                      onChange={(e) => setPrinter(e.target.value)}
                      className="erp-field flex-1"
                    >
                      {PRINTERS_LIST.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                <fieldset className="border border-[#bbc] p-2.5 bg-[#fbfcfe] flex flex-col gap-2">
                  <div>
                    <span className="bg-[#aaff00] px-2 py-0.5 font-extrabold text-[12px]">
                      نموذج ترويسة وتذيل خاص
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="erp-field flex-1">
                      <option>نموذج التقرير العام</option>
                    </select>
                    <button
                      type="button"
                      onClick={onOpenPages}
                      className="erp-classic-btn h-[28px] px-3 text-[12px]"
                    >
                      اضافة
                    </button>
                    <button
                      type="button"
                      onClick={onOpenPages}
                      className="erp-classic-btn h-[28px] px-3 text-[12px]"
                    >
                      تعديل
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" className="accent-[#0078d7]" />
                    <span>توسيط الترويسة الخاص</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" className="accent-[#0078d7]" />
                    <span>توسيط التذيل الخاص</span>
                  </label>
                </fieldset>

                <fieldset className="border border-[#bbc] p-2.5 bg-[#fbfcfe] flex flex-col gap-2">
                  <div>
                    <span className="bg-[#ff3333] text-black px-2 py-0.5 font-extrabold text-[12px]">
                      نموذج ترويسة وتذيل عام مشترك
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="erp-field flex-1">
                      <option>نموذج ترويسة وتذيل مشترك</option>
                    </select>
                    <button
                      type="button"
                      onClick={onOpenPages}
                      className="erp-classic-btn h-[28px] px-3 text-[12px]"
                    >
                      اضافة
                    </button>
                    <button
                      type="button"
                      onClick={onOpenPages}
                      className="erp-classic-btn h-[28px] px-3 text-[12px]"
                    >
                      تعديل
                    </button>
                  </div>
                </fieldset>
              </div>
            </div>
          ) : (
            <div className="border border-[#bbc] p-4 bg-[#fbfcfe] flex flex-col gap-3">
              <div className="font-bold text-[14px]">خصائص الجدول</div>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="accent-[#0078d7]" />
                <span>طباعة ألوان الجدول</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#0078d7]" />
                <span>طباعة التذيل نهاية الجدول مباشرة</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="font-bold text-[13px]">عدد الأعمدة الثابتة</label>
                <input type="number" defaultValue={0} className="erp-field w-20 text-center" />
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 flex items-center justify-center gap-16">
          <button
            type="button"
            onClick={() => {
              onNotify('جارٍ إرسال المستند إلى الطابعة...');
              window.print();
            }}
            className="erp-classic-btn focused w-[130px] h-[32px]"
          >
            طباعة
          </button>
          <button
            type="button"
            onClick={() => onNotify('تم تجهيز معاينة الطباعة')}
            className="erp-classic-btn w-[130px] h-[32px]"
          >
            معاينة
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[130px] h-[32px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

interface SettingPagesDialogProps {
  open: boolean;
  zIndex: number;
  propsState: GeneralPropsState;
  onFocus: () => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const SettingPagesDialog: React.FC<SettingPagesDialogProps> = ({
  open,
  zIndex,
  propsState,
  onFocus,
  onClose,
  onNotify,
}) => {
  const [sectionTab, setSectionTab] = useState<'header' | 'footer'>('header');
  const [pageTab, setPageTab] = useState<'first' | 'rest' | 'last'>('first');
  const [templateName, setTemplateName] = useState('نموذج الترويسة الرسمي');
  const [borderStyle, setBorderStyle] = useState<'none' | 'single' | 'double'>('single');

  const labelText = sectionTab === 'header' ? 'الترويسة' : 'التذيل';

  return (
    <DraggableWindow
      open={open}
      title="frmSettingPages - تعريف ترويسة / تذيل"
      width={1020}
      height={620}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col md:flex-row gap-3 bg-[#f0f0f0] p-3 overflow-hidden">
        <div className="w-full md:w-[360px] flex flex-col gap-2 shrink-0">
          <label className="font-bold text-[13px]">اسم النموذج</label>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="erp-field border-2 border-[#0078d7]"
          />
          <label className="font-bold text-[13px]">نوع التقرير</label>
          <select disabled className="erp-field bg-[#e4e4e4]">
            <option>تقرير عام</option>
          </select>
          <label className="flex items-center gap-2 font-semibold my-1">
            <input type="checkbox" defaultChecked className="accent-[#0078d7]" />
            <span>النموذج الافتراضي</span>
          </label>

          <div className="flex border-b border-[#8e8e8e]">
            <button
              type="button"
              onClick={() => setSectionTab('header')}
              className={`px-3 py-1 text-[13px] font-bold border border-[#adadad] border-b-0 cursor-pointer ${
                sectionTab === 'header' ? 'bg-white' : 'bg-[#e8eaf0]'
              }`}
            >
              الترويسة
            </button>
            <button
              type="button"
              onClick={() => setSectionTab('footer')}
              className={`px-3 py-1 text-[13px] font-bold border border-[#adadad] border-b-0 cursor-pointer ${
                sectionTab === 'footer' ? 'bg-white' : 'bg-[#e8eaf0]'
              }`}
            >
              التذيل
            </button>
          </div>

          <div className="bg-white border border-[#8e8e8e] p-3 flex flex-col gap-2.5 flex-1">
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" defaultChecked className="accent-[#0078d7]" />
              <span>{labelText} مكررة</span>
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" className="accent-[#0078d7]" />
              <span>استخدام {labelText} المشتركة</span>
            </label>
            <fieldset className="border border-[#ccc] p-2">
              <legend className="px-1 text-[12px] font-bold">إطار {labelText}</legend>
              <div className="flex flex-col gap-1">
                {[
                  ['none', 'بدون اطار'],
                  ['single', 'اطار مفرد'],
                  ['double', 'اطار مزدوج'],
                ].map(([val, lbl]) => (
                  <label key={val} className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="radio"
                      name="frameStyle"
                      checked={borderStyle === val}
                      onChange={() => setBorderStyle(val as 'none' | 'single' | 'double')}
                      className="accent-[#0078d7]"
                    />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onNotify(`تم حفظ نموذج الترويسة «${templateName}»`);
                onClose();
              }}
              className="erp-classic-btn focused flex-1 h-[32px]"
            >
              حفظ
            </button>
            <button type="button" onClick={onClose} className="erp-classic-btn flex-1 h-[32px]">
              خروج
            </button>
          </div>
        </div>

        {/* Live Preview Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-[#8e8e8e]">
            {[
              ['first', 'الصفحة الأولى'],
              ['rest', 'بقية الصفحات'],
              ['last', 'الصفحة الأخيرة'],
            ].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPageTab(k as 'first' | 'rest' | 'last')}
                className={`px-3 py-1 text-[13px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
                  pageTab === k ? 'bg-white' : 'bg-[#e8eaf0]'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-white border border-[#8e8e8e] border-t-0 p-6 overflow-auto">
            <div
              className={`p-4 flex items-center justify-between gap-4 ${
                borderStyle === 'single'
                  ? 'border border-black'
                  : borderStyle === 'double'
                  ? 'border-4 border-double border-black'
                  : ''
              }`}
            >
              <div className="text-right text-[13px] space-y-1">
                <div className="font-extrabold text-[16px]">
                  {propsState.hdrArName || propsState.company}
                </div>
                <div>{propsState.hdrArAddr}</div>
                <div>{propsState.hdrArTel}</div>
              </div>
              {propsState.logoData ? (
                <img
                  src={propsState.logoData}
                  alt="شعار الترويسة"
                  referrerPolicy="no-referrer"
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div className="w-20 h-16 border border-dashed border-[#aaa] flex items-center justify-center text-[11px] text-[#888]">
                  الشعار
                </div>
              )}
              <div dir="ltr" className="text-left text-[13px] space-y-1">
                <div className="font-extrabold text-[15px]">{propsState.hdrEnName}</div>
                <div>{propsState.hdrEnAddr}</div>
                <div>{propsState.hdrEnTel}</div>
              </div>
            </div>
            <div className="mt-10 text-center text-[#999] text-[13px] border-t border-dashed border-[#ddd] pt-8">
              معاينة منطقة محتوى التقرير ({pageTab === 'first' ? 'الصفحة الأولى' : pageTab === 'rest' ? 'بقية الصفحات' : 'الصفحة الأخيرة'})
            </div>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
