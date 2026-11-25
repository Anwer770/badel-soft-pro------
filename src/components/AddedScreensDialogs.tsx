import React, { useEffect, useRef, useState } from 'react';
import type {
  CompanyRecord,
  ImportedMaterialItem,
  LicenseState,
  MsgConfig,
} from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

/* =========================================================
   1. قائمة الشركات (Company Picker - Screenshot 012053 / 011754)
   ========================================================= */
interface CompanyPickerDialogProps {
  open: boolean;
  zIndex: number;
  companies: CompanyRecord[];
  activeCompany: string;
  activeBranch: string;
  activeYear: number;
  onFocus: () => void;
  onClose: () => void;
  onSelectCompany: (companyName: string, branch: string, year: number) => void;
  onNotify: (msg: string) => void;
}

export const CompanyPickerDialog: React.FC<CompanyPickerDialogProps> = ({
  open,
  zIndex,
  companies,
  activeCompany,
  activeBranch,
  activeYear,
  onFocus,
  onClose,
  onSelectCompany,
  onNotify,
}) => {
  const [branch, setBranch] = useState(activeBranch || '1');
  const [year, setYear] = useState(String(activeYear || 2026));
  const [runCode, setRunCode] = useState('2');
  const [selectedName, setSelectedName] = useState(activeCompany || companies[0]?.name || 'النظام');

  useEffect(() => {
    if (open) {
      setBranch(activeBranch || '1');
      setYear(String(activeYear || 2026));
      setSelectedName(activeCompany || companies[0]?.name || 'النظام');
    }
  }, [open, activeBranch, activeYear, activeCompany, companies]);

  return (
    <DraggableWindow
      open={open}
      title="قائمة الشركات"
      width={540}
      height={590}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#cfdceb] overflow-hidden">
        {/* Header Bar */}
        <div className="p-3 border-b border-[#9cb3ce] flex items-start justify-between gap-4">
          <div className="flex items-center gap-2" dir="ltr">
            <input
              value={runCode}
              onChange={(e) => setRunCode(e.target.value)}
              className="erp-field w-9 text-center font-bold"
            />
            <button
              type="button"
              onClick={() => onNotify(`تم فحص الاتصال بالفرع ${branch} (Run ${runCode})`)}
              className="erp-classic-btn h-[28px] px-5 text-[13px]"
            >
              Run
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="w-[66px] font-bold text-[13px] text-left">رقم الفرع</label>
              <input
                dir="ltr"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="erp-field w-[108px] text-right border-2 border-[#0078d7]"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[66px] font-bold text-[13px] text-left">السنة</label>
              <input
                dir="ltr"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="erp-field w-[108px] text-right"
              />
            </div>
          </div>
        </div>

        {/* Companies Checklist */}
        <div className="flex-1 bg-[#ececec] border-y border-[#999] overflow-y-auto erp-scrollbar">
          {companies.map((c) => {
            const isSel = c.name === selectedName;
            return (
              <div
                key={`${c.num}-${c.name}`}
                onClick={() => setSelectedName(c.name)}
                onDoubleClick={() => {
                  onSelectCompany(c.name, branch || '1', Number(year) || 2026);
                  onClose();
                }}
                className={`flex items-center justify-end gap-2.5 px-3 py-1.5 cursor-pointer select-none ${
                  isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#ddeaf8] text-black'
                }`}
              >
                <span className="font-bold text-[14px]">{c.name}</span>
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => setSelectedName(c.name)}
                  className="w-4 h-4 accent-[#0078d7]"
                />
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 flex items-center justify-center gap-12 bg-[#cfdceb]">
          <button
            type="button"
            onClick={() => {
              onSelectCompany(selectedName, branch || '1', Number(year) || 2026);
              onClose();
            }}
            className="erp-classic-btn focused w-[140px] h-[34px] text-[14px]"
          >
            عرض
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[140px] h-[34px] text-[14px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

/* =========================================================
   2. كلمة المرور (Password Modal - Screenshot 012105)
   ========================================================= */
interface PasswordPromptDialogProps {
  open: boolean;
  zIndex: number;
  expectedPassword: string;
  onFocus: () => void;
  onClose: () => void;
  onSuccess: () => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
}

export const PasswordPromptDialog: React.FC<PasswordPromptDialogProps> = ({
  open,
  zIndex,
  expectedPassword,
  onFocus,
  onClose,
  onSuccess,
  onShowMsg,
}) => {
  const [pass, setPass] = useState('');

  useEffect(() => {
    if (open) setPass('');
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expectedPassword && pass !== expectedPassword) {
      await onShowMsg({
        title: 'كلمة المرور',
        icon: 'warn',
        text: 'كلمة المرور غير صحيحة.',
      });
      return;
    }
    onSuccess();
    onClose();
  };

  return (
    <DraggableWindow
      open={open}
      title="كلمة المرور"
      width={360}
      height={200}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col bg-[#f0f0f0] p-3 justify-between">
        <div className="border border-[#d0d0d0] bg-[#f7f7f7] p-3 flex flex-col gap-2">
          <label className="text-[13px] font-bold text-right">ادخل كلمة المرور</label>
          <input
            type="password"
            autoFocus
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="erp-field border-2 border-[#0078d7]"
          />
        </div>
        <div className="flex justify-center gap-8 pt-2">
          <button type="submit" className="erp-classic-btn focused w-[110px] h-[30px] text-[13px]">
            موافق
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[110px] h-[30px] text-[13px]"
          >
            خروج
          </button>
        </div>
      </form>
    </DraggableWindow>
  );
};

/* =========================================================
   3. تسجيل النظام (System Registration - Screenshot 011643)
   ========================================================= */
interface SystemRegistrationDialogProps {
  open: boolean;
  zIndex: number;
  license: LicenseState;
  onFocus: () => void;
  onClose: () => void;
  onSave: (next: LicenseState) => void;
}

export const SystemRegistrationDialog: React.FC<SystemRegistrationDialogProps> = ({
  open,
  zIndex,
  license,
  onFocus,
  onClose,
  onSave,
}) => {
  const [licenseCode, setLicenseCode] = useState(license.licenseCode);

  useEffect(() => {
    if (open) setLicenseCode(license.licenseCode);
  }, [open, license]);

  return (
    <DraggableWindow
      open={open}
      title="تسجيل النظام"
      width={660}
      height={270}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#e9edf6] p-5 justify-between">
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex items-center gap-3">
            <label className="w-[100px] font-bold text-[14px]">كود المنتج</label>
            <input
              dir="ltr"
              readOnly
              value={license.productCode}
              className="erp-field flex-1 text-left bg-[#ececec] font-mono font-bold"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-[100px] font-bold text-[14px]">كود الترخيص</label>
            <input
              dir="ltr"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              className="erp-field flex-1 text-left font-mono font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-16 pb-1">
          <button
            type="button"
            onClick={() => {
              onSave({ ...license, licenseCode: licenseCode.trim() });
              onClose();
            }}
            className="erp-classic-btn focused w-[130px] h-[34px] text-[14px]"
          >
            موافق
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[130px] h-[34px] text-[14px]"
          >
            إلغاء الأمر
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

/* =========================================================
   4. استيراد من اكسل (Excel Import - Screenshots 011422 & 011440)
   ========================================================= */
interface ExcelImportDialogProps {
  open: boolean;
  zIndex: number;
  importedMaterials: ImportedMaterialItem[];
  onFocus: () => void;
  onClose: () => void;
  onSaveMaterials: (items: ImportedMaterialItem[]) => void;
  onNotify: (msg: string) => void;
}

const EXCEL_MAP_RIGHT: [keyof ImportedMaterialItem, string][] = [
  ['code', 'رمز المادة'],
  ['name', 'اسم المادة'],
  ['foreignName', 'الاسم الاجنبي'],
  ['barcode', 'الباركود'],
  ['qty', 'الكمية'],
  ['purchasePrice', 'سعر الشراء'],
  ['mainUnit', 'الوحدة الرئيسية'],
];

const EXCEL_MAP_LEFT: [keyof ImportedMaterialItem, string][] = [
  ['maxLimit', 'الحد الاعلى'],
  ['minLimit', 'الحد الادنى'],
  ['warehouse', 'المستودع'],
  ['unit1', 'الوحدة الاولى'],
  ['unit2', 'الوحدة الثانية'],
  ['expiryDate', 'تاريخ الصلاحية'],
];

export const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({
  open,
  zIndex,
  importedMaterials,
  onFocus,
  onClose,
  onSaveMaterials,
  onNotify,
}) => {
  const [tab, setTab] = useState<'view' | 'settings'>('view');
  const [fileName, setFileName] = useState('');
  const [firstRowHeaders, setFirstRowHeaders] = useState(true);
  const [sheetName, setSheetName] = useState('Sheet1');
  const [openingStockAcc, setOpeningStockAcc] = useState('12101');
  const [endingStockAcc, setEndingStockAcc] = useState('12102');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [selectedColIdx, setSelectedColIdx] = useState<number>(-1);
  const [mapping, setMapping] = useState<Record<keyof ImportedMaterialItem, string>>({
    code: '0',
    name: '1',
    foreignName: '2',
    barcode: '3',
    qty: '4',
    purchasePrice: '5',
    mainUnit: '6',
    maxLimit: '7',
    minLimit: '8',
    warehouse: '9',
    unit1: '10',
    unit2: '11',
    expiryDate: '12',
    groupCode: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDelimited = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const delim = lines[0].includes('\t') ? '\t' : ',';
    const parsed = lines.map((line) =>
      line.split(delim).map((cell) => cell.replace(/^"|"$/g, '').trim())
    );
    if (firstRowHeaders && parsed.length > 0) {
      setRawHeaders(parsed[0]);
      setRawRows(parsed.slice(1));
    } else {
      const colCount = parsed[0]?.length || 0;
      setRawHeaders(Array.from({ length: colCount }, (_, i) => `عمود ${i}`));
      setRawRows(parsed);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const txt = await file.text();
    parseDelimited(txt);
    setTab('view');
    onNotify(`تم تحميل الملف: ${file.name}`);
  };

  const loadSampleRows = () => {
    setFileName('materials_sample.csv');
    const sample = [
      ['رمز المادة', 'اسم المادة', 'الاسم الاجنبي', 'الباركود', 'الكمية', 'سعر الشراء', 'الوحدة الرئيسية'],
      ['1001', 'شاشة كمبيوتر 24 بوصة', 'Monitor 24 inch', '62910001001', '12', '45000', 'حبة'],
      ['1002', 'طابعة ليزر مكتبية', 'Laser Printer', '62910001002', '6', '82000', 'حبة'],
      ['1003', 'ورق طباعة A4 كرتون', 'A4 Paper Box', '62910001003', '40', '9500', 'كرتون'],
    ];
    setRawHeaders(sample[0]);
    setRawRows(sample.slice(1));
    setTab('view');
    onNotify('تم عرض بيانات نموذج المواد');
  };

  const handleDeleteColumn = () => {
    if (selectedColIdx < 0 || selectedColIdx >= rawHeaders.length) {
      onNotify('اختر عموداً من الجدول أولاً لحذفه');
      return;
    }
    setRawHeaders((prev) => prev.filter((_, idx) => idx !== selectedColIdx));
    setRawRows((prev) => prev.map((row) => row.filter((_, idx) => idx !== selectedColIdx)));
    setSelectedColIdx(-1);
    onNotify('تم حذف العمود المحدد');
  };

  const handleSave = () => {
    const rowsToSave = rawRows.map((r) => {
      const getVal = (k: keyof ImportedMaterialItem) => {
        const idx = Number(mapping[k]);
        return Number.isInteger(idx) && idx >= 0 ? r[idx] || '' : '';
      };
      return {
        code: getVal('code'),
        name: getVal('name'),
        foreignName: getVal('foreignName'),
        barcode: getVal('barcode'),
        qty: getVal('qty'),
        purchasePrice: getVal('purchasePrice'),
        mainUnit: getVal('mainUnit'),
        maxLimit: getVal('maxLimit'),
        minLimit: getVal('minLimit'),
        warehouse: getVal('warehouse'),
        unit1: getVal('unit1'),
        unit2: getVal('unit2'),
        expiryDate: getVal('expiryDate'),
      };
    });
    if (!rowsToSave.length) {
      onNotify('لا توجد صفوف للاستيراد. اختر ملف CSV أو اضغط عرض.');
      return;
    }
    onSaveMaterials([...importedMaterials, ...rowsToSave]);
    onNotify(`تم استيراد وحفظ ${rowsToSave.length} مادة بنجاح`);
    onClose();
  };

  return (
    <DraggableWindow
      open={open}
      title="استيراد من اكسل"
      width={1060}
      height={650}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#e4ebf5] p-3 gap-2.5 overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Top Import Header */}
        <div className="bg-[#dce6f4] border border-[#b7c8de] p-2.5 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="w-[100px] font-bold text-[13px]">اسم الملف</label>
            <input
              dir="ltr"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="اختر ملف CSV أو TSV..."
              className="erp-field w-[240px] text-left"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="erp-classic-btn h-[28px] px-4 text-[13px]"
            >
              استعراض
            </button>
            <label className="flex items-center gap-2 font-bold text-[13px] cursor-pointer mr-4">
              <input
                type="checkbox"
                checked={firstRowHeaders}
                onChange={(e) => setFirstRowHeaders(e.target.checked)}
                className="w-4 h-4 accent-[#0078d7]"
              />
              <span>الصف الاول اسماء الحقول</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="w-[100px] font-bold text-[13px]">اسم ورقة العمل</label>
            <select
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="erp-field w-[240px]"
            >
              <option value="Sheet1">Sheet1</option>
              <option value="المواد">المواد</option>
            </select>
            <button
              type="button"
              onClick={() => (rawRows.length ? setTab('view') : loadSampleRows())}
              className="erp-classic-btn focused h-[28px] px-5 text-[13px]"
            >
              عرض
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="w-[100px] font-bold text-[13px]">بضاعة أول المدة</label>
            <input
              value={openingStockAcc}
              onChange={(e) => setOpeningStockAcc(e.target.value)}
              className="erp-field w-[240px]"
            />
            <button
              type="button"
              onClick={() => onNotify('حساب بضاعة أول المدة: 12101')}
              className="erp-classic-btn h-[28px] px-3 text-[12px]"
            >
              بحث
            </button>

            <label className="font-bold text-[13px] mr-4">بضاعة أخر المدة</label>
            <input
              value={endingStockAcc}
              onChange={(e) => setEndingStockAcc(e.target.value)}
              className="erp-field w-[220px]"
            />
            <button
              type="button"
              onClick={() => onNotify('حساب بضاعة آخر المدة: 12102')}
              className="erp-classic-btn h-[28px] px-3 text-[12px]"
            >
              بحث
            </button>
          </div>
        </div>

        {/* Inner Tabs: العرض | الاعدادات */}
        <div className="flex items-end border-b border-[#8e8e8e]">
          <button
            type="button"
            onClick={() => setTab('view')}
            className={`px-4 py-1 text-[13px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
              tab === 'view' ? 'bg-white relative top-[1px] pb-[5px]' : 'bg-[#dce6f4]'
            }`}
          >
            العرض
          </button>
          <button
            type="button"
            onClick={() => setTab('settings')}
            className={`px-4 py-1 text-[13px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
              tab === 'settings' ? 'bg-white relative top-[1px] pb-[5px]' : 'bg-[#dce6f4]'
            }`}
          >
            الاعدادات
          </button>
        </div>

        {/* Body */}
        {tab === 'view' ? (
          <div className="flex-1 bg-[#9b9b9b] border-2 border-[#333] overflow-auto erp-scrollbar">
            {rawHeaders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white font-bold gap-3">
                <span>اختر ملف CSV عبر «استعراض» أو اضغط «عرض» لتحميل نموذج البيانات</span>
                <span className="text-[12px] font-normal">
                  المواد المستوردة المحفوظة حالياً: {importedMaterials.length}
                </span>
              </div>
            ) : (
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr>
                    {rawHeaders.map((h, idx) => (
                      <th
                        key={`${h}-${idx}`}
                        onClick={() => setSelectedColIdx(idx)}
                        className={`border border-[#666] py-1.5 px-3 text-[13px] font-bold cursor-pointer ${
                          selectedColIdx === idx ? 'bg-[#0078d7] text-white' : 'bg-[#e8edf6]'
                        }`}
                      >
                        {h} ({idx})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-[#ccc] hover:bg-[#f2f7fd]">
                      {rawHeaders.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className={`border border-[#ccc] px-2.5 py-1 text-[13px] ${
                            selectedColIdx === cIdx ? 'bg-[#e5f1fb]' : ''
                          }`}
                        >
                          {row[cIdx] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-[#cfdceb] border border-[#9cb3ce] p-5 overflow-y-auto erp-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-3 max-w-[920px] mx-auto">
              <div className="flex flex-col gap-3">
                {EXCEL_MAP_RIGHT.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <label className="font-bold text-[13px] w-[125px]">{label}</label>
                    <select
                      value={mapping[key]}
                      onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                      className="erp-field w-[150px] text-center"
                    >
                      <option value="-1">غير مرتبط</option>
                      {Array.from({ length: Math.max(13, rawHeaders.length) }, (_, idx) => (
                        <option key={idx} value={String(idx)}>
                          {rawHeaders[idx] ? `${idx} - ${rawHeaders[idx]}` : `${idx}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {EXCEL_MAP_LEFT.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <label className="font-bold text-[13px] w-[125px]">{label}</label>
                    <select
                      value={mapping[key]}
                      onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                      className="erp-field w-[150px] text-center"
                    >
                      <option value="-1">غير مرتبط</option>
                      {Array.from({ length: Math.max(13, rawHeaders.length) }, (_, idx) => (
                        <option key={idx} value={String(idx)}>
                          {rawHeaders[idx] ? `${idx} - ${rawHeaders[idx]}` : `${idx}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="flex items-center justify-end gap-4 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="erp-classic-btn w-[115px] h-[32px] text-[13px]"
          >
            حفظ
          </button>
          <button
            type="button"
            onClick={handleDeleteColumn}
            className="erp-classic-btn w-[115px] h-[32px] text-[13px]"
          >
            حذف عمود
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
