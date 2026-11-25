import React, { useEffect, useMemo, useState } from 'react';
import { PRINTERS_LIST } from '../data/erpDefaults';
import type { GeneralPropsState, ReportTemplateItem } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';
import {
  HeaderFooterDesignerDialog,
  renderDesignerTokenPreview,
  type DesignerSectionData,
} from './HeaderFooterDesignerDialog';

interface PrintColumnDef {
  id: string;
  name: string;
  alias: string;
  widthMm: number;
}

const DEFAULT_AVAILABLE_COLUMNS: PrintColumnDef[] = [
  { id: 'rec', name: 'مقبوضات', alias: 'مقبوضات', widthMm: 110 },
  { id: 'pay', name: 'مدفوعات', alias: 'مدفوعات', widthMm: 109 },
  { id: 'dhm', name: 'عمليات ذمم', alias: 'عمليات ذمم', widthMm: 110 },
  { id: 'from', name: 'من حساب (مدين)', alias: 'من حساب (مدين)', widthMm: 110 },
  { id: 'to', name: 'إلى حساب (دائن)', alias: 'إلى حساب (دائن)', widthMm: 109 },
  { id: 'cur', name: 'العملة', alias: 'العملة', widthMm: 110 },
  { id: 'stmt', name: 'البيان', alias: 'البيان', widthMm: 110 },
  { id: 'by', name: 'ادخل من قبل', alias: 'ادخل من قبل', widthMm: 110 },
  { id: 'at', name: 'تاريخ الادخال', alias: 'تاريخ الادخال', widthMm: 110 },
];

interface PrintSetupDialogProps {
  open: boolean;
  zIndex: number;
  templates: ReportTemplateItem[];
  onFocus: () => void;
  onClose: () => void;
  onOpenPages: (opts?: { isCreating: boolean; template?: ReportTemplateItem | null }) => void;
  onNotify: (msg: string) => void;
}

export const PrintSetupDialog: React.FC<PrintSetupDialogProps> = ({
  open,
  zIndex,
  templates,
  onFocus,
  onClose,
  onOpenPages,
  onNotify,
}) => {
  const [tab, setTab] = useState<0 | 1>(0);
  const [models, setModels] = useState<string[]>(['form1']);
  const [selectedModel, setSelectedModel] = useState('form1');
  const [isDefaultModel, setIsDefaultModel] = useState(true);
  const [copies, setCopies] = useState(1);

  const [marginTop, setMarginTop] = useState(5);
  const [marginLeft, setMarginLeft] = useState(5);
  const [marginBottom, setMarginBottom] = useState(10);
  const [marginRight, setMarginRight] = useState(5);
  const [pageFrame, setPageFrame] = useState<'none' | 'double' | 'single'>('double');

  const [tblHdrStyle, setTblHdrStyle] = useState<'colors' | 'white' | 'black'>('colors');
  const [cellMarginTop, setCellMarginTop] = useState(2);
  const [cellMarginRight, setCellMarginRight] = useState(0.5);

  const [titleFont, setTitleFont] = useState('Tahoma, 12pt');
  const [titleHeightRatio, setTitleHeightRatio] = useState(8);
  const [tableFont, setTableFont] = useState('Tahoma, 10pt');
  const [tableHeightRatio, setTableHeightRatio] = useState(8);
  const [totalFont, setTotalFont] = useState('Tahoma, 10pt, Bold');
  const [totalHeightRatio, setTotalHeightRatio] = useState(8);

  const [printDir, setPrintDir] = useState('');
  const [ltrTable, setLtrTable] = useState(false);
  const [footerAfterTable, setFooterAfterTable] = useState(false);
  const [printTableColors, setPrintTableColors] = useState(false);
  const [printer, setPrinter] = useState('');

  const [specialTemplateName, setSpecialTemplateName] = useState('نموذج التقرير العام');
  const [centerSpecialHeader, setCenterSpecialHeader] = useState(false);
  const [centerSpecialFooter, setCenterSpecialFooter] = useState(false);

  const [sharedTemplateName, setSharedTemplateName] = useState('نموذج ترويسة وتذيل مشترك');
  const [centerSharedHeader, setCenterSharedHeader] = useState(false);
  const [centerSharedFooter, setCenterSharedFooter] = useState(false);

  // Font Picker sub-modal
  const [fontModalTarget, setFontModalTarget] = useState<'title' | 'table' | 'total' | null>(null);

  // Tab 2: خصائص الجدول
  const [orderBySelected, setOrderBySelected] = useState(false);
  const [showSerial, setShowSerial] = useState(false);
  const [availableCols, setAvailableCols] = useState<PrintColumnDef[]>(DEFAULT_AVAILABLE_COLUMNS);
  const [chosenCols, setChosenCols] = useState<PrintColumnDef[]>([]);
  const [selectedAvailId, setSelectedAvailId] = useState<string>('rec');
  const [selectedChosenId, setSelectedChosenId] = useState<string>('');

  const specialOptions = useMemo(
    () =>
      templates.filter((t) => t.reportType !== 'ترويسة وتذيل مشترك').length > 0
        ? templates.filter((t) => t.reportType !== 'ترويسة وتذيل مشترك')
        : templates,
    [templates]
  );

  const sharedOptions = useMemo(
    () =>
      templates.filter((t) => t.reportType === 'ترويسة وتذيل مشترك').length > 0
        ? templates.filter((t) => t.reportType === 'ترويسة وتذيل مشترك')
        : templates,
    [templates]
  );

  const moveSelectedToChosen = () => {
    const item = availableCols.find((c) => c.id === selectedAvailId);
    if (!item) return;
    setAvailableCols((prev) => prev.filter((c) => c.id !== item.id));
    setChosenCols((prev) => [...prev, item]);
    setSelectedChosenId(item.id);
    const nextAvail = availableCols.find((c) => c.id !== item.id);
    setSelectedAvailId(nextAvail?.id || '');
  };

  const moveAllToChosen = () => {
    if (availableCols.length === 0) return;
    setChosenCols((prev) => [...prev, ...availableCols]);
    setSelectedChosenId(availableCols[0].id);
    setAvailableCols([]);
    setSelectedAvailId('');
  };

  const moveSelectedToAvailable = () => {
    const item = chosenCols.find((c) => c.id === selectedChosenId);
    if (!item) return;
    setChosenCols((prev) => prev.filter((c) => c.id !== item.id));
    setAvailableCols((prev) => [...prev, item]);
    setSelectedAvailId(item.id);
    const nextChosen = chosenCols.find((c) => c.id !== item.id);
    setSelectedChosenId(nextChosen?.id || '');
  };

  const moveAllToAvailable = () => {
    if (chosenCols.length === 0) return;
    setAvailableCols((prev) => [...prev, ...chosenCols]);
    setSelectedAvailId(chosenCols[0].id);
    setChosenCols([]);
    setSelectedChosenId('');
  };

  const moveChosenOrder = (delta: -1 | 1) => {
    const idx = chosenCols.findIndex((c) => c.id === selectedChosenId);
    if (idx < 0) return;
    const target = idx + delta;
    if (target < 0 || target >= chosenCols.length) return;
    setChosenCols((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const addSerialColumn = () => {
    if (chosenCols.some((c) => c.id === 'serial') || availableCols.some((c) => c.id === 'serial')) {
      onNotify('الرقم التسلسلي مضاف مسبقاً');
      return;
    }
    const serialCol: PrintColumnDef = {
      id: 'serial',
      name: 'الرقم التسلسلي',
      alias: 'م',
      widthMm: 18,
    };
    setChosenCols((prev) => [serialCol, ...prev]);
    setSelectedChosenId('serial');
    setShowSerial(true);
    onNotify('تمت إضافة الرقم التسلسلي إلى حقول الطباعة');
  };

  return (
    <DraggableWindow
      open={open}
      title="إعداد نماذج الطباعة"
      width={940}
      height={640}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#e2e8f0] p-3 overflow-hidden relative">
        {/* Top Bar: النموذج + جديد / حفظ / حذف */}
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-[13px]">النموذج</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="erp-field flex-1 max-w-[440px] bg-white font-bold"
            dir="ltr"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              const nextName = `form${models.length + 1}`;
              setModels((prev) => [...prev, nextName]);
              setSelectedModel(nextName);
              onNotify(`تم إنشاء نموذج طباعة جديد (${nextName})`);
            }}
            className="erp-classic-btn h-[28px] w-[90px] text-[12px]"
          >
            جديد
          </button>
          <button
            type="button"
            onClick={() => onNotify(`تم حفظ إعدادات النموذج (${selectedModel})`)}
            className="erp-classic-btn h-[28px] w-[90px] text-[12px]"
          >
            حفظ
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedModel === 'form1') {
                onNotify('لا يمكن حذف النموذج الافتراضي form1');
                return;
              }
              setModels((prev) => prev.filter((m) => m !== selectedModel));
              setSelectedModel('form1');
              onNotify('تم حذف النموذج');
            }}
            className="erp-classic-btn h-[28px] w-[90px] text-[12px]"
          >
            حذف
          </button>
        </div>

        {/* Main 2 Tabs */}
        <div className="flex border-b border-[#b0b8c4]">
          {(['خصائص عامة', 'خصائص الجدول'] as const).map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setTab(idx as 0 | 1)}
              className={`px-3.5 py-1.5 text-[13px] font-bold border border-[#b0b8c4] border-b-0 -ml-px cursor-pointer ${
                tab === idx ? 'bg-[#dce4ee] relative top-[1px] pb-[7px]' : 'bg-[#eceff4]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#dce4ee] border border-[#b0b8c4] border-t-0 p-3 overflow-y-auto erp-scrollbar">
          {tab === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
              {/* Right Side in RTL */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 px-1">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefaultModel}
                      onChange={(e) => setIsDefaultModel(e.target.checked)}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>النموذج الإفتراضي</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-[13px]">عدد النسخ</label>
                    <input
                      type="number"
                      min={1}
                      value={copies}
                      onChange={(e) => setCopies(Number(e.target.value) || 1)}
                      className="erp-field w-16 text-center bg-white"
                    />
                  </div>
                </div>

                {/* هوامش الصفحة + إطار الصفحة */}
                <div className="grid grid-cols-2 gap-2.5">
                  <fieldset className="border border-[#c0c8d4] p-2 bg-[#dce4ee]">
                    <legend className="px-1 font-bold text-[12px]">هوامش الصفحة</legend>
                    <div className="flex flex-col gap-1.5">
                      {[
                        ['هامش أعلى', marginTop, setMarginTop],
                        ['هامش أيسر', marginLeft, setMarginLeft],
                        ['هامش أسفل', marginBottom, setMarginBottom],
                        ['هامش أيمن', marginRight, setMarginRight],
                      ].map(([lbl, val, setter]) => (
                        <div key={String(lbl)} className="flex items-center gap-1.5">
                          <label className="w-[74px] text-[12px] font-bold">{lbl as string}</label>
                          <input
                            type="number"
                            value={Number(val)}
                            onChange={(e) =>
                              (setter as React.Dispatch<React.SetStateAction<number>>)(
                                Number(e.target.value) || 0
                              )
                            }
                            className="erp-field w-14 text-center bg-white"
                          />
                          <span className="text-[12px]">ملم</span>
                        </div>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="border border-[#c0c8d4] p-2 bg-[#dce4ee]">
                    <legend className="px-1 font-bold text-[12px]">إطار الصفحة</legend>
                    <div className="flex flex-col gap-2 pt-1">
                      {[
                        ['none', 'بدون إطار'],
                        ['double', 'إطار مزدوج'],
                        ['single', 'إطار مفرد'],
                      ].map(([val, lbl]) => (
                        <label
                          key={val}
                          className="flex items-center justify-between gap-2 text-[13px] font-semibold cursor-pointer px-2"
                        >
                          <span>{lbl}</span>
                          <input
                            type="radio"
                            name="pageFrameStyle"
                            checked={pageFrame === val}
                            onChange={() => setPageFrame(val as 'none' | 'double' | 'single')}
                            className="accent-[#0078d7]"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* ترويسة الجدول + خصائص الخلية */}
                <div className="grid grid-cols-2 gap-2.5">
                  <fieldset className="border border-[#c0c8d4] p-2 bg-[#dce4ee]">
                    <legend className="px-1 font-bold text-[12px]">ترويسة الجدول</legend>
                    <div className="flex flex-col gap-1.5 pt-1">
                      {[
                        ['colors', 'ألوان الجدول'],
                        ['white', 'خلفية بيضاء'],
                        ['black', 'خلفية سوداء'],
                      ].map(([val, lbl]) => (
                        <label
                          key={val}
                          className="flex items-center justify-between gap-2 text-[13px] font-semibold cursor-pointer px-2"
                        >
                          <span>{lbl}</span>
                          <input
                            type="radio"
                            name="tblHdrStyle"
                            checked={tblHdrStyle === val}
                            onChange={() => setTblHdrStyle(val as 'colors' | 'white' | 'black')}
                            className="accent-[#0078d7]"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="border border-[#c0c8d4] p-2 bg-[#dce4ee]">
                    <legend className="px-1 font-bold text-[12px]">خصائص الخلية</legend>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <label className="w-[74px] text-[12px] font-bold">هامش أعلى</label>
                        <input
                          type="number"
                          value={cellMarginTop}
                          onChange={(e) => setCellMarginTop(Number(e.target.value) || 0)}
                          className="erp-field w-14 text-center bg-white"
                        />
                        <span className="text-[12px]">ملم</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="w-[74px] text-[12px] font-bold">هامش أيمن</label>
                        <input
                          type="number"
                          step="0.5"
                          value={cellMarginRight}
                          onChange={(e) => setCellMarginRight(Number(e.target.value) || 0)}
                          className="erp-field w-14 text-center bg-white"
                        />
                        <span className="text-[12px]">ملم</span>
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* الخطوط */}
                <fieldset className="border border-[#c0c8d4] p-2 bg-[#dce4ee]">
                  <legend className="px-1 font-bold text-[12px]">الخطوط</legend>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFontModalTarget('title')}
                        className="erp-classic-btn w-[88px] h-[25px] text-[12px]"
                      >
                        خط العنوان
                      </button>
                      <input
                        value={titleFont}
                        onChange={(e) => setTitleFont(e.target.value)}
                        className="erp-field flex-1 bg-white text-[11px]"
                        dir="ltr"
                      />
                      <label className="text-[12px] font-bold shrink-0">نسبة إرتفاع العنوان</label>
                      <input
                        type="number"
                        value={titleHeightRatio}
                        onChange={(e) => setTitleHeightRatio(Number(e.target.value) || 8)}
                        className="erp-field w-14 text-center bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFontModalTarget('table')}
                        className="erp-classic-btn w-[88px] h-[25px] text-[12px]"
                      >
                        خط الجدول
                      </button>
                      <input
                        value={tableFont}
                        onChange={(e) => setTableFont(e.target.value)}
                        className="erp-field flex-1 bg-white text-[11px]"
                        dir="ltr"
                      />
                      <label className="text-[12px] font-bold shrink-0">نسبة إرتفاع الجدول</label>
                      <input
                        type="number"
                        value={tableHeightRatio}
                        onChange={(e) => setTableHeightRatio(Number(e.target.value) || 8)}
                        className="erp-field w-14 text-center bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFontModalTarget('total')}
                        className="erp-classic-btn w-[88px] h-[25px] text-[12px]"
                      >
                        خط المجموع
                      </button>
                      <input
                        value={totalFont}
                        onChange={(e) => setTotalFont(e.target.value)}
                        className="erp-field flex-1 bg-white text-[11px]"
                        dir="ltr"
                      />
                      <label className="text-[12px] font-bold shrink-0">نسبة إرتفاع المجموع</label>
                      <input
                        type="number"
                        value={totalHeightRatio}
                        onChange={(e) => setTotalHeightRatio(Number(e.target.value) || 8)}
                        className="erp-field w-14 text-center bg-white"
                      />
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Left Side in RTL */}
              <div className="flex flex-col gap-2.5">
                <fieldset className="border border-[#c0c8d4] p-2.5 bg-[#dce4ee] flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-[12px] w-[120px] shrink-0">اتجاه الطباعة</label>
                    <select
                      value={printDir}
                      onChange={(e) => setPrintDir(e.target.value)}
                      className="erp-field flex-1 bg-white"
                    >
                      <option value="" />
                      <option value="طولي">طولي</option>
                      <option value="عرضي">عرضي</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-end gap-2 text-[13px] font-semibold cursor-pointer">
                    <span>طباعة الجدول من اليسار إلى اليمين</span>
                    <input
                      type="checkbox"
                      checked={ltrTable}
                      onChange={(e) => setLtrTable(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                  <label className="flex items-center justify-end gap-2 text-[13px] font-semibold cursor-pointer">
                    <span>طباعة التذيل نهاية الجدول مباشرة</span>
                    <input
                      type="checkbox"
                      checked={footerAfterTable}
                      onChange={(e) => setFooterAfterTable(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                  <label className="flex items-center justify-end gap-2 text-[13px] font-semibold cursor-pointer">
                    <span>طباعة ألوان الجدول</span>
                    <input
                      type="checkbox"
                      checked={printTableColors}
                      onChange={(e) => setPrintTableColors(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[12px] font-bold w-[120px] shrink-0">الطابعة الافتراضية</label>
                    <select
                      value={printer}
                      onChange={(e) => setPrinter(e.target.value)}
                      className="erp-field flex-1 bg-white"
                    >
                      <option value="" />
                      {PRINTERS_LIST.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                {/* نموذج ترويسة وتذيل خاص */}
                <fieldset className="border border-[#c0c8d4] p-2.5 bg-[#dce4ee] flex flex-col gap-2">
                  <div className="flex justify-start">
                    <span className="bg-[#aaff00] text-black px-2 py-0.5 font-extrabold text-[12px]">
                      نموذج ترويسة وتذيل خاص
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={specialTemplateName}
                      onChange={(e) => setSpecialTemplateName(e.target.value)}
                      className="erp-field flex-1 bg-white"
                    >
                      {specialOptions.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onOpenPages({ isCreating: true, template: null })}
                      className="erp-classic-btn h-[26px] px-3 text-[12px]"
                    >
                      اضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const found =
                          templates.find((t) => t.name === specialTemplateName) || null;
                        onOpenPages({ isCreating: false, template: found });
                      }}
                      className="erp-classic-btn focused h-[26px] px-3 text-[12px]"
                    >
                      تعديل
                    </button>
                  </div>
                  <label className="flex items-center justify-end gap-2 text-[13px] font-semibold cursor-pointer">
                    <span>توسيط الترويسة الخاص</span>
                    <input
                      type="checkbox"
                      checked={centerSpecialHeader}
                      onChange={(e) => setCenterSpecialHeader(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                  <label className="flex items-center justify-end gap-2 text-[13px] font-semibold cursor-pointer">
                    <span>توسيط التذيل الخاص</span>
                    <input
                      type="checkbox"
                      checked={centerSpecialFooter}
                      onChange={(e) => setCenterSpecialFooter(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                </fieldset>

                {/* نموذج ترويسة وتذيل عام مشترك */}
                <fieldset className="border border-[#c0c8d4] p-2.5 bg-[#dce4ee] flex flex-col gap-2">
                  <div className="flex justify-start">
                    <span className="bg-[#ff2222] text-black px-2 py-0.5 font-extrabold text-[12px]">
                      نموذج ترويسة وتذيل عام مشترك
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sharedTemplateName}
                      onChange={(e) => setSharedTemplateName(e.target.value)}
                      className="erp-field flex-1 bg-white"
                    >
                      {sharedOptions.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onOpenPages({ isCreating: true, template: null })}
                      className="erp-classic-btn h-[26px] px-3 text-[12px]"
                    >
                      اضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const found =
                          templates.find((t) => t.name === sharedTemplateName) || null;
                        onOpenPages({ isCreating: false, template: found });
                      }}
                      className="erp-classic-btn h-[26px] px-3 text-[12px]"
                    >
                      تعديل
                    </button>
                  </div>
                  <label className="flex items-center justify-end gap-2 text-[13px] font-semibold cursor-pointer">
                    <span>توسيط الترويسة المشتركة</span>
                    <input
                      type="checkbox"
                      checked={centerSharedHeader}
                      onChange={(e) => setCenterSharedHeader(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                  <label className="flex items-center justify-end gap-2 text-[13px] font-semibold cursor-pointer">
                    <span>توسيط التذيل المشترك</span>
                    <input
                      type="checkbox"
                      checked={centerSharedFooter}
                      onChange={(e) => setCenterSharedFooter(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                </fieldset>
              </div>
            </div>
          ) : (
            /* Tab 2: خصائص الجدول matching Screenshot_2026-11-24_010857_38897ce8.png */
            <div className="flex flex-col gap-3 h-full overflow-hidden">
              <fieldset className="border border-[#c0c8d4] p-2.5 bg-[#dce4ee] flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orderBySelected}
                    onChange={(e) => setOrderBySelected(e.target.checked)}
                    className="w-4 h-4 accent-[#0078d7]"
                  />
                  <span>طباعة حقول الجدول بحسب الترتيب في الحقول المختارة أسفل</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSerial}
                      onChange={(e) => setShowSerial(e.target.checked)}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                    <span>إظهار الرقم التسلسلي</span>
                  </label>
                  <button
                    type="button"
                    onClick={addSerialColumn}
                    className="erp-classic-btn px-3 h-[26px] text-[12px]"
                  >
                    إضافة الرقم التسلسلي إلى حقول الطباعة
                  </button>
                </div>
              </fieldset>

              <div className="flex-1 grid grid-cols-[260px_54px_1fr_56px] gap-2 items-stretch overflow-hidden">
                {/* الحقول المتاحة */}
                <div className="flex flex-col overflow-hidden">
                  <div className="text-center font-bold text-[13px] mb-1">الحقول المتاحة</div>
                  <div className="flex-1 bg-white border border-[#555] overflow-y-auto erp-scrollbar">
                    <table className="w-full border-collapse text-[13px]">
                      <tbody>
                        {availableCols.map((col) => {
                          const isSel = col.id === selectedAvailId;
                          return (
                            <tr
                              key={col.id}
                              onClick={() => setSelectedAvailId(col.id)}
                              onDoubleClick={moveSelectedToChosen}
                              className={`cursor-pointer ${
                                isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                              }`}
                            >
                              <td className="border-b border-l border-[#ccc] px-2 py-1 font-bold">
                                {col.name}
                              </td>
                              <td className="border-b border-[#ccc] px-2 py-1 w-14 text-center">
                                {col.widthMm}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transfer Buttons */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={moveSelectedToChosen}
                    className="erp-classic-btn w-11 h-8 text-[14px]"
                    title="إضافة الحقل المحدد"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    onClick={moveAllToChosen}
                    className="erp-classic-btn w-11 h-8 text-[14px]"
                    title="إضافة كافة الحقول"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    type="button"
                    onClick={moveSelectedToAvailable}
                    className="erp-classic-btn w-11 h-8 text-[14px]"
                    title="إزالة الحقل المحدد"
                  >
                    &gt;
                  </button>
                  <button
                    type="button"
                    onClick={moveAllToAvailable}
                    className="erp-classic-btn w-11 h-8 text-[14px]"
                    title="إزالة كافة الحقول"
                  >
                    &gt;&gt;
                  </button>
                </div>

                {/* الحقول المختارة للطباعة */}
                <div className="flex flex-col overflow-hidden">
                  <div className="text-center font-bold text-[13px] mb-1">الحقول المختارة للطباعة</div>
                  <div className="flex-1 bg-white border border-[#555] overflow-y-auto erp-scrollbar">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr className="bg-[#f3f3f3]">
                          <th className="border-b border-l border-[#bbb] py-1 px-2">اسم العمود</th>
                          <th className="border-b border-l border-[#bbb] py-1 px-2">الإسم البديل</th>
                          <th className="border-b border-[#bbb] py-1 px-2 w-16">ملم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chosenCols.map((col) => {
                          const isSel = col.id === selectedChosenId;
                          return (
                            <tr
                              key={col.id}
                              onClick={() => setSelectedChosenId(col.id)}
                              className={`cursor-pointer ${
                                isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                              }`}
                            >
                              <td className="border-b border-l border-[#ddd] px-2 py-1 font-bold">
                                {col.name}
                              </td>
                              <td className="border-b border-l border-[#ddd] p-0.5">
                                <input
                                  value={col.alias}
                                  onChange={(e) =>
                                    setChosenCols((prev) =>
                                      prev.map((c) =>
                                        c.id === col.id ? { ...c, alias: e.target.value } : c
                                      )
                                    )
                                  }
                                  className="w-full px-1.5 py-0.5 text-black bg-white/95 border border-transparent focus:border-[#0078d7] outline-none"
                                />
                              </td>
                              <td className="border-b border-[#ddd] p-0.5">
                                <input
                                  type="number"
                                  value={col.widthMm}
                                  onChange={(e) =>
                                    setChosenCols((prev) =>
                                      prev.map((c) =>
                                        c.id === col.id
                                          ? { ...c, widthMm: Number(e.target.value) || 0 }
                                          : c
                                      )
                                    )
                                  }
                                  className="w-full px-1 py-0.5 text-center text-black bg-white/95 border border-transparent focus:border-[#0078d7] outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* أعلى / أسفل */}
                <div className="flex flex-col items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={() => moveChosenOrder(-1)}
                    className="erp-classic-btn w-12 h-8 text-[13px]"
                  >
                    أعلى
                  </button>
                  <button
                    type="button"
                    onClick={() => moveChosenOrder(1)}
                    className="erp-classic-btn w-12 h-8 text-[13px]"
                  >
                    أسفل
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="pt-3 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => {
              onNotify('جارٍ إرسال المستند إلى الطابعة...');
              window.print();
            }}
            className="erp-classic-btn focused w-[130px] h-[30px]"
          >
            طباعة
          </button>
          <button
            type="button"
            onClick={() => onNotify('تم تجهيز معاينة الطباعة')}
            className="erp-classic-btn w-[130px] h-[30px]"
          >
            معاينة
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[130px] h-[30px]"
          >
            خروج
          </button>
        </div>

        {/* Font Picker Sub-Modal */}
        {fontModalTarget && (
          <div className="absolute inset-0 bg-black/25 z-30 flex items-center justify-center p-4">
            <div className="w-[340px] bg-[#f0f0f0] border border-[#666] shadow-xl p-3 flex flex-col gap-3">
              <div className="font-bold text-[13px] border-b border-[#ccc] pb-1">
                اختيار الخط والحجم
              </div>
              <select
                value={
                  fontModalTarget === 'title'
                    ? titleFont
                    : fontModalTarget === 'table'
                    ? tableFont
                    : totalFont
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (fontModalTarget === 'title') setTitleFont(val);
                  else if (fontModalTarget === 'table') setTableFont(val);
                  else setTotalFont(val);
                }}
                className="erp-field bg-white"
                dir="ltr"
              >
                <option>Tahoma, 9pt</option>
                <option>Tahoma, 10pt</option>
                <option>Tahoma, 10pt, Bold</option>
                <option>Tahoma, 12pt</option>
                <option>Tahoma, 14pt, Bold</option>
                <option>Arial, 11pt</option>
                <option>Cairo, 11pt</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFontModalTarget(null)}
                  className="erp-classic-btn focused px-4 h-[26px] text-[12px]"
                >
                  موافق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};

interface SettingPagesDialogProps {
  open: boolean;
  zIndex: number;
  propsState: GeneralPropsState;
  editingTemplate?: ReportTemplateItem | null;
  isCreating?: boolean;
  onFocus: () => void;
  onClose: () => void;
  onOpenFetchList?: (onPicked: (tpl: ReportTemplateItem) => void) => void;
  onSaveTemplate?: (tpl: ReportTemplateItem) => void;
  onNotify: (msg: string) => void;
}

const REPORT_TYPES = [
  'ترويسة وتذيل مشترك',
  'فاتورة',
  'كشف حساب إجمالي',
  'حسابات ختامية',
  'سند قبض',
  'كشف حساب تفصيلي',
  'تقرير عام',
  'كشف مواد إجمالي',
  'سند صرف',
  'كشف مواد تفصيلي',
  'أمر تحميل',
  'قيد',
];

export const SettingPagesDialog: React.FC<SettingPagesDialogProps> = ({
  open,
  zIndex,
  propsState,
  editingTemplate,
  isCreating,
  onFocus,
  onClose,
  onOpenFetchList,
  onSaveTemplate,
  onNotify,
}) => {
  const [sectionTab, setSectionTab] = useState<'header' | 'footer'>('header');
  const [pageTab, setPageTab] = useState<'first' | 'rest' | 'last'>('first');
  const [templateName, setTemplateName] = useState('نموذج التقرير العام');
  const [reportType, setReportType] = useState('تقرير عام');
  const [isDefaultTpl, setIsDefaultTpl] = useState(true);

  const [headerRepeated, setHeaderRepeated] = useState(true);
  const [useSharedHeader, setUseSharedHeader] = useState(false);
  const [headerFrameFirst, setHeaderFrameFirst] = useState<'none' | 'single' | 'double'>('single');
  const [headerFrameRest, setHeaderFrameRest] = useState<'none' | 'single' | 'double'>('none');

  const [footerRepeated, setFooterRepeated] = useState(false);
  const [useSharedFooter, setUseSharedFooter] = useState(false);
  const [footerFrameRest, setFooterFrameRest] = useState<'none' | 'single' | 'double'>('none');
  const [footerFrameLast, setFooterFrameLast] = useState<'none' | 'single' | 'double'>('none');

  const [designerTarget, setDesignerTarget] = useState<{
    key: 'headerFirst' | 'headerRest' | 'footerRest' | 'footerLast';
    title: string;
    isFooter: boolean;
  } | null>(null);

  const [sectionDesigns, setSectionDesigns] = useState<
    Record<'headerFirst' | 'headerRest' | 'footerRest' | 'footerLast', DesignerSectionData>
  >({
    headerFirst: { rows: [], font: 'Tahoma, 10pt' },
    headerRest: { rows: [], font: 'Tahoma, 10pt' },
    footerRest: { rows: [], font: 'Tahoma, 10pt' },
    footerLast: { rows: [], font: 'Tahoma, 10pt' },
  });

  useEffect(() => {
    if (open) {
      setDesignerTarget(null);
      if (isCreating) {
        setTemplateName('');
        setReportType('تقرير عام');
        setIsDefaultTpl(false);
        setHeaderRepeated(false);
        setSectionDesigns({
          headerFirst: { rows: [], font: 'Tahoma, 10pt' },
          headerRest: { rows: [], font: 'Tahoma, 10pt' },
          footerRest: { rows: [], font: 'Tahoma, 10pt' },
          footerLast: { rows: [], font: 'Tahoma, 10pt' },
        });
      } else if (editingTemplate) {
        setTemplateName(editingTemplate.name);
        setReportType(editingTemplate.reportType);
        setIsDefaultTpl(true);
        setHeaderRepeated(true);
      } else {
        setTemplateName('نموذج التقرير العام');
        setReportType('تقرير عام');
        setIsDefaultTpl(true);
        setHeaderRepeated(true);
      }
    }
  }, [open, editingTemplate, isCreating]);

  const activeHeaderFrame = pageTab === 'rest' ? headerFrameRest : headerFrameFirst;
  const activeFooterFrame = pageTab === 'last' ? footerFrameLast : footerFrameRest;

  return (
    <DraggableWindow
      open={open}
      title="frmSettingPages"
      width={1020}
      height={620}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col md:flex-row gap-3 bg-[#dce4ee] p-3 overflow-hidden relative">
        {/* Right Controls Panel (First in RTL DOM) */}
        <div className="w-full md:w-[340px] flex flex-col gap-2 shrink-0">
          <div className="text-right font-bold text-[13px]">اسم النموذج</div>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="erp-field border-2 border-[#0078d7] bg-white font-bold"
          />

          <div className="text-right font-bold text-[13px]">نوع التقرير</div>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            disabled={!isCreating && editingTemplate?.reportType !== 'ترويسة وتذيل مشترك'}
            className={`erp-field ${
              !isCreating && editingTemplate?.reportType !== 'ترويسة وتذيل مشترك'
                ? 'bg-[#d8dce2] text-[#555]'
                : 'bg-white'
            }`}
          >
            {REPORT_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>

          <label className="flex items-center justify-end gap-2 font-bold my-0.5 cursor-pointer text-[13px]">
            <span>النموذج الإفتراضي</span>
            <input
              type="checkbox"
              checked={isDefaultTpl}
              onChange={(e) => setIsDefaultTpl(e.target.checked)}
              className="w-4 h-4 accent-[#0078d7]"
            />
          </label>

          {/* Header / Footer Inner Tabs */}
          <div className="flex border-b border-[#b0b8c4]">
            <button
              type="button"
              onClick={() => setSectionTab('header')}
              className={`px-3 py-1 text-[13px] font-bold border border-[#b0b8c4] border-b-0 -ml-px cursor-pointer ${
                sectionTab === 'header' ? 'bg-white relative top-[1px] pb-[5px]' : 'bg-[#e8edf5]'
              }`}
            >
              الترويسة
            </button>
            <button
              type="button"
              onClick={() => setSectionTab('footer')}
              className={`px-3 py-1 text-[13px] font-bold border border-[#b0b8c4] border-b-0 -ml-px cursor-pointer ${
                sectionTab === 'footer' ? 'bg-white relative top-[1px] pb-[5px]' : 'bg-[#e8edf5]'
              }`}
            >
              التذيل
            </button>
          </div>

          {sectionTab === 'header' ? (
            <div className="bg-white border border-[#b0b8c4] border-t-0 p-3 flex flex-col gap-2.5 flex-1">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenFetchList) {
                      onOpenFetchList((tpl) => {
                        setTemplateName(tpl.name);
                        setReportType(tpl.reportType);
                        onNotify(`تم جلب ترويسة النموذج «${tpl.name}»`);
                      });
                    }
                  }}
                  className="erp-classic-btn focused w-[96px] h-[26px] text-[12px]"
                >
                  جلب
                </button>
                <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
                  <span>ترويسة مكررة</span>
                  <input
                    type="checkbox"
                    checked={headerRepeated}
                    onChange={(e) => setHeaderRepeated(e.target.checked)}
                    className="accent-[#0078d7]"
                  />
                </label>
              </div>

              <label className="flex items-center justify-end gap-2 text-[13px] font-bold cursor-pointer">
                <span>استخدام الترويسة المشتركة</span>
                <input
                  type="checkbox"
                  checked={useSharedHeader}
                  onChange={(e) => setUseSharedHeader(e.target.checked)}
                  className="accent-[#0078d7]"
                />
              </label>

              <button
                type="button"
                disabled={useSharedHeader}
                onClick={() =>
                  setDesignerTarget({
                    key: 'headerFirst',
                    title: `${
                      headerRepeated ? 'تصميم الترويسة' : 'تصميم ترويسة الصفحة الاولى'
                    } - ${reportType}`,
                    isFooter: false,
                  })
                }
                className="erp-classic-btn focused h-[28px] text-[12px] disabled:opacity-50"
              >
                {headerRepeated ? 'تصميم الترويسة' : 'تصميم ترويسة الصفحة الاولى'}
              </button>

              <fieldset
                disabled={useSharedHeader}
                className={`border border-[#ccc] p-2 ${useSharedHeader ? 'opacity-50' : ''}`}
              >
                <legend className="px-1 text-[12px] font-bold">اطار الترويسة</legend>
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  {[
                    ['none', 'بدون إطار'],
                    ['single', 'إطار مفرد'],
                    ['double', 'إطار مزدوج'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="flex items-center justify-end gap-1.5 cursor-pointer">
                      <span>{lbl}</span>
                      <input
                        type="radio"
                        name="hdrFrame1"
                        checked={headerFrameFirst === val}
                        onChange={() => setHeaderFrameFirst(val as 'none' | 'single' | 'double')}
                        className="accent-[#0078d7]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                disabled={headerRepeated || useSharedHeader}
                onClick={() =>
                  setDesignerTarget({
                    key: 'headerRest',
                    title: `تصميم ترويسة بقية الصفحات - ${reportType}`,
                    isFooter: false,
                  })
                }
                className="erp-classic-btn h-[28px] text-[12px] disabled:opacity-50"
              >
                تصميم ترويسة بقية الصفحات
              </button>

              <fieldset
                disabled={headerRepeated || useSharedHeader}
                className={`border border-[#ccc] p-2 ${
                  headerRepeated || useSharedHeader ? 'opacity-50' : ''
                }`}
              >
                <legend className="px-1 text-[12px] font-bold">اطار الترويسة</legend>
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  {[
                    ['none', 'بدون إطار'],
                    ['single', 'إطار مفرد'],
                    ['double', 'إطار مزدوج'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="flex items-center justify-end gap-1.5 cursor-pointer">
                      <span>{lbl}</span>
                      <input
                        type="radio"
                        name="hdrFrame2"
                        checked={headerFrameRest === val}
                        onChange={() => setHeaderFrameRest(val as 'none' | 'single' | 'double')}
                        className="accent-[#0078d7]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : (
            <div className="bg-white border border-[#b0b8c4] border-t-0 p-3 flex flex-col gap-2.5 flex-1">
              <label className="flex items-center justify-end gap-2 text-[13px] font-bold cursor-pointer">
                <span>تذيل مكرر</span>
                <input
                  type="checkbox"
                  checked={footerRepeated}
                  onChange={(e) => setFooterRepeated(e.target.checked)}
                  className="accent-[#0078d7]"
                />
              </label>

              <label className="flex items-center justify-end gap-2 text-[13px] font-bold cursor-pointer">
                <span>استخدام التذيل المشترك</span>
                <input
                  type="checkbox"
                  checked={useSharedFooter}
                  onChange={(e) => setUseSharedFooter(e.target.checked)}
                  className="accent-[#0078d7]"
                />
              </label>

              <button
                type="button"
                disabled={footerRepeated || useSharedFooter}
                onClick={() =>
                  setDesignerTarget({
                    key: 'footerRest',
                    title: `تصميم تذيل بقية الصفحات - ${reportType}`,
                    isFooter: true,
                  })
                }
                className="erp-classic-btn h-[28px] text-[12px] disabled:opacity-50"
              >
                تصميم تذيل بقية الصفحات
              </button>

              <fieldset
                disabled={footerRepeated || useSharedFooter}
                className={`border border-[#ccc] p-2 ${
                  footerRepeated || useSharedFooter ? 'opacity-50' : ''
                }`}
              >
                <legend className="px-1 text-[12px] font-bold">اطار التذيل</legend>
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  {[
                    ['none', 'بدون اطار'],
                    ['single', 'اطار مفرد'],
                    ['double', 'اطار مزدوج'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="flex items-center justify-end gap-1.5 cursor-pointer">
                      <span>{lbl}</span>
                      <input
                        type="radio"
                        name="ftrFrame1"
                        checked={footerFrameRest === val}
                        onChange={() => setFooterFrameRest(val as 'none' | 'single' | 'double')}
                        className="accent-[#0078d7]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                disabled={useSharedFooter}
                onClick={() =>
                  setDesignerTarget({
                    key: 'footerLast',
                    title: `تصميم تذيل الصفحة الاخيرة - ${reportType}`,
                    isFooter: true,
                  })
                }
                className="erp-classic-btn focused h-[28px] text-[12px] disabled:opacity-50"
              >
                تصميم تذيل الصفحة الاخيرة
              </button>

              <fieldset
                disabled={useSharedFooter}
                className={`border border-[#ccc] p-2 ${useSharedFooter ? 'opacity-50' : ''}`}
              >
                <legend className="px-1 text-[12px] font-bold">اطار التذيل</legend>
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  {[
                    ['none', 'بدون إطار'],
                    ['single', 'إطار مفرد'],
                    ['double', 'إطار مزدوج'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="flex items-center justify-end gap-1.5 cursor-pointer">
                      <span>{lbl}</span>
                      <input
                        type="radio"
                        name="ftrFrame2"
                        checked={footerFrameLast === val}
                        onChange={() => setFooterFrameLast(val as 'none' | 'single' | 'double')}
                        className="accent-[#0078d7]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          <div className="flex justify-between gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                const trimmed = templateName.trim() || 'نموذج جديد';
                if (onSaveTemplate) {
                  onSaveTemplate({
                    id: editingTemplate && !isCreating ? editingTemplate.id : `rt-${Date.now()}`,
                    name: trimmed,
                    reportType,
                  });
                }
                onNotify(`تم حفظ نموذج الترويسة «${trimmed}»`);
                onClose();
              }}
              className="erp-classic-btn focused flex-1 h-[30px]"
            >
              حفظ
            </button>
            <button type="button" onClick={onClose} className="erp-classic-btn flex-1 h-[30px]">
              خروج
            </button>
          </div>
        </div>

        {/* Left Live Preview Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-[#b0b8c4]">
            {[
              ['first', 'الصفحة الأولى'],
              ['rest', 'بقية الصفحات'],
              ['last', 'الصفحة الأخيرة'],
            ].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPageTab(k as 'first' | 'rest' | 'last')}
                className={`px-3 py-1 text-[13px] font-bold border border-[#b0b8c4] border-b-0 -ml-px cursor-pointer ${
                  pageTab === k ? 'bg-white relative top-[1px] pb-[5px]' : 'bg-[#e8edf5]'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-white border border-[#b0b8c4] border-t-0 p-6 flex flex-col justify-between overflow-auto">
            {/* Header Preview */}
            {(() => {
              const activeHdrKey =
                pageTab === 'rest' && !headerRepeated ? 'headerRest' : 'headerFirst';
              const activeHdrData = sectionDesigns[activeHdrKey];
              if (activeHdrData.rows.length > 0) {
                return (
                  <div
                    className={`p-3 flex flex-col gap-1.5 ${
                      activeHeaderFrame === 'single'
                        ? 'border border-black'
                        : activeHeaderFrame === 'double'
                        ? 'border-4 border-double border-black'
                        : ''
                    }`}
                  >
                    {activeHdrData.rows.map((r) => (
                      <div key={r.id} className="grid grid-cols-3 items-center gap-2 text-[13px]">
                        <div className="text-right font-bold">
                          {renderDesignerTokenPreview(
                            r.right,
                            propsState,
                            reportType,
                            r.attachBeforeR,
                            r.attachAfterR
                          )}
                        </div>
                        <div className="text-center font-bold">
                          {renderDesignerTokenPreview(r.center, propsState, reportType)}
                        </div>
                        <div className="text-left font-bold">
                          {renderDesignerTokenPreview(
                            r.left,
                            propsState,
                            reportType,
                            r.attachBeforeL,
                            r.attachAfterL
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div
                  className={`p-4 flex items-center justify-between gap-4 ${
                    activeHeaderFrame === 'single'
                      ? 'border border-black'
                      : activeHeaderFrame === 'double'
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
              );
            })()}

            <div className="my-8 text-center text-[#999] text-[13px]">
              معاينة منطقة محتوى التقرير (
              {pageTab === 'first'
                ? 'الصفحة الأولى'
                : pageTab === 'rest'
                ? 'بقية الصفحات'
                : 'الصفحة الأخيرة'}
              )
            </div>

            {/* Footer Preview */}
            {(() => {
              const activeFtrKey =
                pageTab === 'last' || footerRepeated ? 'footerLast' : 'footerRest';
              const activeFtrData = sectionDesigns[activeFtrKey];
              if (activeFtrData.rows.length > 0) {
                return (
                  <div
                    className={`p-2.5 flex flex-col gap-1 ${
                      activeFooterFrame === 'single'
                        ? 'border border-black'
                        : activeFooterFrame === 'double'
                        ? 'border-4 border-double border-black'
                        : 'border-t border-dashed border-[#ccc]'
                    }`}
                  >
                    {activeFtrData.rows.map((r) => (
                      <div key={r.id} className="grid grid-cols-3 items-center gap-2 text-[12px]">
                        <div className="text-right">
                          {renderDesignerTokenPreview(
                            r.right,
                            propsState,
                            reportType,
                            r.attachBeforeR,
                            r.attachAfterR
                          )}
                        </div>
                        <div className="text-center">
                          {renderDesignerTokenPreview(r.center, propsState, reportType)}
                        </div>
                        <div className="text-left">
                          {renderDesignerTokenPreview(
                            r.left,
                            propsState,
                            reportType,
                            r.attachBeforeL,
                            r.attachAfterL
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div
                  className={`p-2.5 text-center text-[12px] text-[#333] ${
                    activeFooterFrame === 'single'
                      ? 'border border-black'
                      : activeFooterFrame === 'double'
                      ? 'border-4 border-double border-black'
                      : 'border-t border-dashed border-[#ccc]'
                  }`}
                >
                  شكراً لتعاملكم معنا - بديل سوفت
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Full Header / Footer Designer Sub-Window */}
      {designerTarget && (
        <HeaderFooterDesignerDialog
          open={Boolean(designerTarget)}
          zIndex={zIndex + 30}
          title={designerTarget.title}
          isFooter={designerTarget.isFooter}
          initialData={sectionDesigns[designerTarget.key]}
          onFocus={onFocus}
          onClose={() => setDesignerTarget(null)}
          onSave={(data) => {
            setSectionDesigns((prev) => ({
              ...prev,
              [designerTarget.key]: data,
            }));
            onNotify(`تم حفظ ${designerTarget.title}`);
          }}
        />
      )}
    </DraggableWindow>
  );
};
