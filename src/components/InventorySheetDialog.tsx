import React, { useEffect, useMemo, useState } from 'react';
import type {
  ImportedMaterialItem,
  InventorySheetRecord,
  WarehouseRecord,
} from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

export interface InventorySheetDialogProps {
  open: boolean;
  zIndex: number;
  title: string;
  /** opening = مذكرة جرد إفتتاحي، adjust = مذكرة جرد - تسوية مخزنية */
  kind: 'opening' | 'adjust';
  warehouses: WarehouseRecord[];
  sheets?: InventorySheetRecord[];
  materials?: ImportedMaterialItem[];
  currentUser?: string;
  onSaveSheet?: (sheet: InventorySheetRecord) => void;
  onDeleteSheet?: (id: string) => void;
  onApproveSheet?: (sheet: InventorySheetRecord) => void;
  onFocus: () => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

interface InvRow {
  id: string;
  code: string;
  name: string;
  qty: number;
  countQty: number;
  unit: string;
  price: number;
  balance: number;
  location: string;
  rowNo: string;
  colNo: string;
  expiry: string;
}

const makeRow = (i: number): InvRow => ({
  id: `inv-row-${i}-${Math.random().toString(36).slice(2, 6)}`,
  code: '',
  name: '',
  qty: 0,
  countQty: 0,
  unit: '',
  price: 0,
  balance: 0,
  location: '',
  rowNo: '',
  colNo: '',
  expiry: '',
});

const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '0.00');

const SPEC_ROWS = [
  'المجموعة',
  'الوكيل',
  'الاسم العلمي',
  'الهيئة',
  'العمود',
  'الصف',
  'الصنف الرئيسي',
  'المورد',
];

export const InventorySheetDialog: React.FC<InventorySheetDialogProps> = ({
  open,
  zIndex,
  title,
  kind,
  warehouses,
  sheets = [],
  materials = [],
  currentUser = 'admin',
  onSaveSheet,
  onDeleteSheet,
  onApproveSheet,
  onFocus,
  onClose,
  onNotify,
}) => {
  const isOpening = kind === 'opening';

  const [sheetNo, setSheetNo] = useState('1');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [docNumber, setDocNumber] = useState('');
  const [note, setNote] = useState('');
  const [warehouse, setWarehouse] = useState(warehouses[0]?.name || 'مستودع ١ - برايمو');
  const [defaultCol, setDefaultCol] = useState('1');
  const [defaultRow, setDefaultRow] = useState('1');
  const [currency, setCurrency] = useState('ريال يمني');
  const [approveCount, setApproveCount] = useState(false);
  const [rows, setRows] = useState<InvRow[]>(() =>
    Array.from({ length: 17 }, (_, i) => makeRow(i))
  );

  // مواقeع الجرد
  const [positionsOpen, setPositionsOpen] = useState(false);
  // بحث عن طريق مواصفات المادة
  const [specsOpen, setSpecsOpen] = useState(false);
  const [specSearchMode, setSpecSearchMode] = useState<'start' | 'class' | 'card'>('class');
  const [specOrdered, setSpecOrdered] = useState(false);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  // خيارات حسابات الجرد
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [extendedSearch, setExtendedSearch] = useState(false);
  const [profitAccount, setProfitAccount] = useState('');
  const [outAccount, setOutAccount] = useState('');
  const [shortageAccount, setShortageAccount] = useState('');
  const [surplusAccount, setSurplusAccount] = useState('');
  const [countMethod, setCountMethod] = useState('كميات فقط');
  const [printModel, setPrintModel] = useState('');
  // استعراض / جلب المواد
  const [browseOpen, setBrowseOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialsQuery, setMaterialsQuery] = useState('');
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const updateRow = (idx: number, key: keyof InvRow, value: string | number) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const unitPrice = (r: InvRow) =>
    isOpening ? Number(r.price) || 0 : Number(r.price) || 0;
  const rowTotal = (r: InvRow) => (Number(r.countQty) || 0) * unitPrice(r);
  const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0);

  useEffect(() => {
    const cls = 'print-preview-open';
    if (open && previewOpen) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [open, previewOpen]);

  const buildRecord = (): InventorySheetRecord => ({
    id: currentSheetId || `inv-sheet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    sheetNo,
    date,
    docNumber,
    note,
    warehouse,
    defaultCol,
    defaultRow,
    currency,
    approved: approveCount,
    total: grandTotal,
    lines: rows.map((r) => ({ ...r })),
    createdBy: currentUser,
    profitAccount,
    outAccount,
    shortageAccount,
    surplusAccount,
    countMethod,
  });

  const saveSheet = () => {
    const rec = buildRecord();
    setCurrentSheetId(rec.id);
    onSaveSheet?.(rec);
    if (rec.approved && onApproveSheet) onApproveSheet(rec);
    onNotify(
      approveCount
        ? `تم حفظ واعتماد ورقة الجرد رقم ${sheetNo}`
        : `تم حفظ ورقة الجرد رقم ${sheetNo}`
    );
  };

  const loadSheet = (rec: InventorySheetRecord) => {
    setCurrentSheetId(rec.id);
    setSheetNo(rec.sheetNo);
    setDate(rec.date);
    setDocNumber(rec.docNumber);
    setNote(rec.note);
    setWarehouse(rec.warehouse);
    setDefaultCol(rec.defaultCol);
    setDefaultRow(rec.defaultRow);
    setCurrency(rec.currency);
    setApproveCount(rec.approved);
    setRows(rec.lines.length ? rec.lines.map((l) => ({ ...l })) : [makeRow(0)]);
    setBrowseOpen(false);
    onNotify(`تم جلب ورقة الجرد رقم ${rec.sheetNo}`);
  };

  const clearSheet = (nextNo?: string) => {
    setCurrentSheetId(null);
    if (nextNo) setSheetNo(nextNo);
    setRows(Array.from({ length: 17 }, (_, i) => makeRow(i)));
    setDocNumber('');
    setNote('');
    setApproveCount(false);
  };

  const sheetList = useMemo(
    () => sheets.filter((sh) => sh.kind === kind).slice().sort((a, b) => b.date.localeCompare(a.date)),
    [sheets, kind]
  );

  const materialMatches = useMemo(() => {
    const q = materialsQuery.trim();
    return materials
      .filter(
        (m) =>
          !q ||
          m.name.includes(q) ||
          m.code.includes(q) ||
          (m.barcode || '').includes(q)
      )
      .slice(0, 40);
  }, [materials, materialsQuery]);

  const addMaterialToSheet = (m: ImportedMaterialItem) => {
    setRows((prev) => {
      const emptyIdx = prev.findIndex((r) => !r.name.trim());
      const line = {
        code: m.code || '',
        name: m.name || '',
        unit: m.mainUnit || 'حبة',
        price: Number(m.purchasePrice) || 0,
        balance: Number(m.qty) || 0,
        colNo: defaultCol,
        rowNo: defaultRow,
        location: m.warehouse || warehouse,
      };
      if (emptyIdx >= 0) {
        return prev.map((r, i) => (i === emptyIdx ? { ...r, ...line } : r));
      }
      return [...prev, { ...makeRow(prev.length), ...line }];
    });
  };

  const inputCls =
    'w-full h-[24px] px-1 text-center bg-transparent outline-none focus:bg-[#e5f1fb]';

  return (
    <DraggableWindow
      open={open}
      title={title}
      width={1120}
      height={640}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] overflow-hidden relative text-[12px]">
        {/* Header band */}
        <div className="border-b border-[#b9c4d4] px-3 py-2 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-bold w-[80px] text-right">رقم ورقة الجرد</span>
              <input
                value={sheetNo}
                onChange={(e) => setSheetNo(e.target.value)}
                className="erp-field w-[70px] bg-[#eaeaea] text-center font-bold"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">التاريخ</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="erp-field w-[124px] bg-white text-center"
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">المستند</span>
              <input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="erp-field w-[110px] bg-white text-center"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-[320px]">
              <span className="font-bold">البيان</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="erp-field flex-1 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">المستودع</span>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="erp-field w-[190px] bg-white text-center"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            {!isOpening && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold">العملة</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="erp-field w-[110px] bg-white text-center"
                >
                  <option value="ريال يمني">ريال يمني</option>
                  <option value="دولار">دولار</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">العمود الافتراضي</span>
              <input
                value={defaultCol}
                onChange={(e) => setDefaultCol(e.target.value)}
                className="erp-field w-[60px] bg-white text-center"
              />
              <button
                type="button"
                onClick={() => setPositionsOpen(true)}
                className="erp-classic-btn px-2.5 h-[24px] text-[11px]"
              >
                تعديل
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">الصف الافتراضي</span>
              <input
                value={defaultRow}
                onChange={(e) => setDefaultRow(e.target.value)}
                className="erp-field w-[90px] bg-white text-center"
              />
            </div>
            {isOpening && (
              <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={approveCount}
                  onChange={(e) => setApproveCount(e.target.checked)}
                />
                <span>اعتماد الجرد</span>
              </label>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-b-2 border-[#333]">
          <div className="flex-1 overflow-auto erp-scrollbar">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#b6b8f2] border-b border-[#444]">
                  <th className="py-1 px-1.5 border-l border-[#666] w-[36px]">حدف</th>
                  <th className="py-1 px-2 border-l border-[#666] w-[95px]">الرمز</th>
                  <th className="py-1 px-2 border-l border-[#666]">المادة</th>
                  {!isOpening && (
                    <th className="py-1 px-1 border-l border-[#666] w-[70px]">الكمية</th>
                  )}
                  <th className="py-1 px-1 border-l border-[#666] w-[88px]">كمية الجرد</th>
                  {!isOpening && (
                    <th className="py-1 px-1 border-l border-[#666] w-[78px]">الفارق</th>
                  )}
                  <th className="py-1 px-1 border-l border-[#666] w-[70px]">الوحدة</th>
                  <th className="py-1 px-1 border-l border-[#666] w-[80px]">
                    {isOpening ? 'سعر البيع' : 'السعر'}
                  </th>
                  <th className="py-1 px-1 border-l border-[#666] w-[88px]">الإجمالي</th>
                  <th className="py-1 px-1 border-l border-[#666] w-[80px]">الرصيد</th>
                  <th className="py-1 px-1 border-l border-[#666] w-[82px]">الموقع</th>
                  <th className="py-1 px-1 border-l border-[#666] w-[62px]">الصف</th>
                  <th className="py-1 px-1 border-l border-[#666] w-[62px]">العمود</th>
                  <th className="py-1 px-1 border-l border-[#666] w-[104px]">تاريخ الصلاحية</th>
                  <th className="py-1 px-1 w-[40px]">م</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const diff = (Number(r.countQty) || 0) - (Number(r.qty) || 0);
                  return (
                    <tr
                      key={r.id}
                      className={`h-[26px] border-b border-[#d7dde8] ${
                        idx % 2 === 1 ? 'bg-[#fbfbdc]' : 'bg-white'
                      }`}
                    >
                      <td className="p-0 text-center border-l border-[#bbb]">
                        <button
                          type="button"
                          onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                          className="w-5 h-5 border border-[#888] bg-[#e6e8ec] text-[#700] font-bold text-[11px] leading-none cursor-pointer"
                        >
                          ×
                        </button>
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          value={r.code}
                          onChange={(e) => updateRow(idx, 'code', e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          value={r.name}
                          onChange={(e) => updateRow(idx, 'name', e.target.value)}
                          className="w-full h-[24px] px-2 bg-transparent outline-none focus:bg-[#e5f1fb]"
                        />
                      </td>
                      {!isOpening && (
                        <td className="p-0 border-l border-[#bbb]">
                          <input
                            type="number"
                            value={r.qty || ''}
                            onChange={(e) => updateRow(idx, 'qty', Number(e.target.value) || 0)}
                            className={inputCls}
                          />
                        </td>
                      )}
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          type="number"
                          value={r.countQty || ''}
                          onChange={(e) =>
                            updateRow(idx, 'countQty', Number(e.target.value) || 0)
                          }
                          className={inputCls}
                        />
                      </td>
                      {!isOpening && (
                        <td className="px-1 text-center font-bold border-l border-[#bbb]">
                          {diff ? diff.toFixed(2) : ''}
                        </td>
                      )}
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          value={r.unit}
                          onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          type="number"
                          value={r.price || ''}
                          onChange={(e) => updateRow(idx, 'price', Number(e.target.value) || 0)}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-1 text-left font-bold border-l border-[#bbb]">
                        {rowTotal(r) > 0 ? rowTotal(r).toFixed(2) : ''}
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          type="number"
                          value={r.balance || ''}
                          onChange={(e) =>
                            updateRow(idx, 'balance', Number(e.target.value) || 0)
                          }
                          className={inputCls}
                        />
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          value={r.location}
                          onChange={(e) => updateRow(idx, 'location', e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          value={r.rowNo}
                          onChange={(e) => updateRow(idx, 'rowNo', e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          value={r.colNo}
                          onChange={(e) => updateRow(idx, 'colNo', e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-0 border-l border-[#bbb]">
                        <input
                          value={r.expiry}
                          placeholder="YYYY/MM/DD"
                          onChange={(e) => updateRow(idx, 'expiry', e.target.value)}
                          className={inputCls}
                        />
                      </td>
                      <td className="px-1 text-center font-bold bg-[#eceef4] border-r border-[#888]">
                        {idx === 0 ? '◀ ' : ''}
                        {idx + 1}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Peach totals bar */}
          <div className="bg-[#f9dfc6] border-t-2 border-[#333] flex items-center justify-between px-4 font-extrabold text-[12px] h-[26px]">
            <span>المجموع</span>
            <div className="flex items-center gap-16">
              <span>{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Command bar */}
        <div className="bg-[#f0f0f0] px-2 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button type="button" onClick={onClose} className="erp-classic-btn w-[86px] h-[28px] font-bold">
              خروج
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentSheetId && onDeleteSheet) {
                  onDeleteSheet(currentSheetId);
                  onNotify('تم حذف ورقة الجرد');
                } else {
                  onNotify('تم تفريغ ورقة الجرد');
                }
                clearSheet();
              }}
              className="erp-classic-btn w-[86px] h-[28px] font-bold"
            >
              حذف
            </button>
            <button
              type="button"
              onClick={() => setBrowseOpen(true)}
              className="erp-classic-btn w-[100px] h-[28px] font-bold"
            >
              استعراض
            </button>
            <button
              type="button"
              onClick={saveSheet}
              className="erp-classic-btn focused w-[110px] h-[28px] font-bold"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={() => {
                const nextNo = String(Number(sheetNo) + 1 || 2);
                clearSheet(nextNo);
                onNotify('ورقة جرد جديدة');
              }}
              className="erp-classic-btn w-[90px] h-[28px] font-bold"
            >
              جديد
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNotify('اعدادات الطباعة')}
              className="erp-classic-btn w-[130px] h-[28px] font-bold"
            >
              اعدادات الطباعة
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="erp-classic-btn w-[90px] h-[28px] font-bold"
            >
              معاينة
            </button>
            <button
              type="button"
              onClick={() => setPositionsOpen(true)}
              className="erp-classic-btn w-[110px] h-[28px] font-bold"
            >
              مواقع الجرد
            </button>
            <button
              type="button"
              onClick={() => {
                setRows((prev) => [...prev, makeRow(prev.length)]);
                onNotify('تمت إضافة صف جديد');
              }}
              className="erp-classic-btn w-[120px] h-[28px] font-bold"
            >
              إضافة صف جديد
            </button>
            <button
              type="button"
              onClick={() => setAccountsOpen(true)}
              className="erp-classic-btn w-[90px] h-[28px] font-bold"
            >
              اعدادات
            </button>
            <button
              type="button"
              onClick={() => {
                setMaterialsQuery('');
                setMaterialsOpen(true);
              }}
              className="erp-classic-btn focused w-[110px] h-[28px] font-bold"
            >
              جلب المواد
            </button>
          </div>
        </div>

        {/* استعراض أوراق الجرد المحفوظة */}
        {browseOpen && (
          <div className="absolute inset-0 z-40 bg-black/20 flex items-center justify-center p-4">
            <div className="bg-[#e9edf5] border-2 border-[#555] w-[780px] shadow-2xl flex flex-col">
              <div className="bg-white border-b border-[#ccc] px-3 py-1 flex justify-between items-center">
                <span className="font-bold">استعراض أوراق الجرد</span>
                <button
                  type="button"
                  onClick={() => setBrowseOpen(false)}
                  className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-2">
                <div className="bg-white border border-[#8e8e8e] max-h-[300px] overflow-auto">
                  <table className="w-full border-collapse text-[12px]">
                    <thead className="sticky top-0">
                      <tr className="bg-[#b6b8f2] border-b border-[#444]">
                        <th className="py-1 px-2 border-l border-[#666] w-[80px]">رقم الورقة</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[110px]">التاريخ</th>
                        <th className="py-1 px-2 border-l border-[#666]">المستودع</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[120px]">البيان</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[80px]">المواد</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[100px]">الإجمالي</th>
                        <th className="py-1 px-2 w-[80px]">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-5 text-center font-bold text-[#666]">
                            لا توجد أوراق جرد محفوظة.
                          </td>
                        </tr>
                      ) : (
                        sheetList.map((sh) => (
                          <tr
                            key={sh.id}
                            onDoubleClick={() => loadSheet(sh)}
                            className="border-b border-[#eee] h-[24px] hover:bg-[#eaf3fc] cursor-pointer"
                          >
                            <td className="px-2 text-center font-bold border-l border-[#ddd]">
                              {sh.sheetNo}
                            </td>
                            <td className="px-2 text-center border-l border-[#ddd]" dir="ltr">
                              {sh.date}
                            </td>
                            <td className="px-2 font-bold border-l border-[#ddd]">{sh.warehouse}</td>
                            <td className="px-2 border-l border-[#ddd]">{sh.note}</td>
                            <td className="px-2 text-center border-l border-[#ddd]">
                              {sh.lines.filter((l) => l.name.trim()).length}
                            </td>
                            <td className="px-2 text-center font-bold border-l border-[#ddd]">
                              {fmt(sh.total)}
                            </td>
                            <td className="px-2 text-center border-l border-[#ddd]">
                              {sh.approved ? 'معتمدة' : 'غير معتمدة'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-[#c5ccd8] bg-[#e9edf4] px-4 py-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setBrowseOpen(false)}
                  className="erp-classic-btn w-[110px] h-[28px] font-bold"
                >
                  خروج
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const first = sheetList[0];
                    if (first) loadSheet(first);
                    else onNotify('لا توجد ورقة جرد لجلبها');
                  }}
                  className="erp-classic-btn focused w-[110px] h-[28px] font-bold"
                >
                  موافق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* جلب المواد */}
        {materialsOpen && (
          <div className="absolute inset-0 z-40 bg-black/20 flex items-center justify-center p-4">
            <div className="bg-[#e9edf5] border-2 border-[#555] w-[720px] shadow-2xl flex flex-col">
              <div className="bg-white border-b border-[#ccc] px-3 py-1 flex justify-between items-center">
                <span className="font-bold">جلب المواد</span>
                <button
                  type="button"
                  onClick={() => setMaterialsOpen(false)}
                  className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    value={materialsQuery}
                    onChange={(e) => setMaterialsQuery(e.target.value)}
                    placeholder="بحث بالاسم أو الرمز أو الباركود..."
                    className="erp-field flex-1 bg-white"
                    autoFocus
                  />
                  <span className="font-bold">{materialMatches.length} مادة</span>
                </div>

                <div className="bg-white border border-[#8e8e8e] max-h-[300px] overflow-auto">
                  <table className="w-full border-collapse text-[12px]">
                    <thead className="sticky top-0">
                      <tr className="bg-[#b6b8f2] border-b border-[#444]">
                        <th className="py-1 px-2 border-l border-[#666] w-[90px]">الرمز</th>
                        <th className="py-1 px-2 border-l border-[#666]">اسم المادة</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[70px]">الوحدة</th>
                        <th className="py-1 px-2 border-l border-[#666] w-[90px]">سعر الكلفة</th>
                        <th className="py-1 px-2 w-[80px]">الرصيد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialMatches.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-5 text-center font-bold text-[#666]">
                            لا توجد مواد مطابقة.
                          </td>
                        </tr>
                      ) : (
                        materialMatches.map((m) => (
                          <tr
                            key={`${m.code}-${m.name}`}
                            onClick={() => addMaterialToSheet(m)}
                            className="border-b border-[#eee] h-[24px] hover:bg-[#0078d7] hover:text-white cursor-pointer"
                          >
                            <td className="px-2 text-center border-l border-[#ddd]">{m.code}</td>
                            <td className="px-2 font-bold border-l border-[#ddd]">{m.name}</td>
                            <td className="px-2 text-center border-l border-[#ddd]">
                              {m.mainUnit || 'حبة'}
                            </td>
                            <td className="px-2 text-center border-l border-[#ddd]">
                              {m.purchasePrice || '0'}
                            </td>
                            <td className="px-2 text-center">{m.qty || '0'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-[#c5ccd8] bg-[#e9edf4] px-4 py-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMaterialsOpen(false)}
                  className="erp-classic-btn w-[110px] h-[28px] font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* مواقع الجرد */}
        {positionsOpen && (
          <div className="absolute inset-0 z-40 bg-black/20 flex items-center justify-center p-4">
            <div className="bg-[#e9edf5] border-2 border-[#555] w-[740px] shadow-2xl flex flex-col">
              <div className="bg-white border-b border-[#ccc] px-3 py-1 flex justify-between items-center">
                <span className="font-bold">مواقع الجرد</span>
                <button
                  type="button"
                  onClick={() => setPositionsOpen(false)}
                  className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-2 flex flex-col gap-2">
                <div className="text-right font-bold">قائمة المستودعات</div>
                <div className="bg-white border border-[#8e8e8e] max-h-[140px] overflow-auto">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-[#e8eaf0] border-b border-[#999]">
                        <th className="py-1 px-2 border-l border-[#ccc] w-[60px]" />
                        <th className="py-1 px-2 border-l border-[#ccc] w-[70px]">الرمز</th>
                        <th className="py-1 px-2">اسم المستودع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouses.map((w, i) => (
                        <tr key={w.id} className="border-b border-[#eee]">
                          <td className="text-center">
                            <input type="checkbox" />
                          </td>
                          <td className="px-2 text-center font-bold">{w.code || i + 1}</td>
                          <td className="px-2 font-bold">{w.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-right font-bold">قائمة الأعمدة</div>
                    <div className="bg-white border border-[#8e8e8e] h-[120px] overflow-auto">
                      <table className="w-full border-collapse text-[12px]">
                        <thead>
                          <tr className="bg-[#e8eaf0] border-b border-[#999]">
                            <th className="py-1 px-2">رمز العمود</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 10 }, (_, i) => (
                            <tr key={`col-${i}`} className="border-b border-[#eee]">
                              <td className="px-2 text-center font-bold">{i + 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <div className="text-right font-bold">قائمة الصفوف</div>
                    <div className="bg-white border border-[#8e8e8e] h-[120px] overflow-auto">
                      <table className="w-full border-collapse text-[12px]">
                        <thead>
                          <tr className="bg-[#e8eaf0] border-b border-[#999]">
                            <th className="py-1 px-2 border-l border-[#ccc]">رمز العمود</th>
                            <th className="py-1 px-2">رمز الصف</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 10 }, (_, i) => (
                            <tr key={`row-${i}`} className="border-b border-[#eee]">
                              <td className="px-2 text-center font-bold">{i + 1}</td>
                              <td className="px-2 text-center font-bold">{i + 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#c5ccd8] bg-[#e9edf4] px-4 py-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setPositionsOpen(false)}
                  className="erp-classic-btn w-[110px] h-[26px] font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* بحث عن طريق مواصفات المادة */}
        {specsOpen && (
          <div className="absolute inset-0 z-40 bg-black/20 flex items-center justify-center p-4">
            <div className="bg-[#e9edf5] border-2 border-[#555] w-[720px] shadow-2xl flex flex-col">
              <div className="bg-white border-b border-[#ccc] px-3 py-1 flex justify-between items-center">
                <span className="font-bold">بحث عن طريق مواصفات المادة</span>
                <button
                  type="button"
                  onClick={() => setSpecsOpen(false)}
                  className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-3 flex flex-col gap-3">
                <div className="flex items-center gap-4 justify-end font-bold">
                  {[
                    ['start', 'بداية'],
                    ['class', 'صن'],
                    ['card', 'بطاق'],
                  ].map(([val, lbl]) => (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="specSearchMode"
                        checked={specSearchMode === val}
                        onChange={() => setSpecSearchMode(val as 'start' | 'class' | 'card')}
                      />
                      <span>{lbl}</span>
                    </label>
                  ))}
                  <span>المواصفات طريقة البحث</span>
                </div>

                <div className="bg-white border border-[#8e8e8e]">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-[#e8eaf0] border-b border-[#999]">
                        <th className="py-1 px-2 border-l border-[#ccc] w-[80px]">الخاية</th>
                        <th className="py-1 px-2">القيمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SPEC_ROWS.map((spec) => (
                        <tr key={spec} className="border-b border-[#eee]">
                          <td className="px-2 text-center">
                            <button
                              type="button"
                              onClick={() => onNotify(`بحث المواصفة: ${spec}`)}
                              className="erp-classic-btn w-[62px] h-[22px] text-[11px]"
                            >
                              بحث
                            </button>
                          </td>
                          <td className="px-2 py-1">
                            <input
                              value={specValues[spec] || ''}
                              onChange={(e) =>
                                setSpecValues((prev) => ({ ...prev, [spec]: e.target.value }))
                              }
                              className="erp-field w-full bg-[#fbfbdc] text-center"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <label className="flex items-center justify-end gap-2 font-bold cursor-pointer">
                  <span>ترتيب المواد بحسب</span>
                  <input
                    type="checkbox"
                    checked={specOrdered}
                    onChange={(e) => setSpecOrdered(e.target.checked)}
                  />
                </label>
                <select
                  disabled={!specOrdered}
                  className="erp-field w-full bg-white text-center"
                >
                  <option value="السعر الوسيط (الكلفة)">السعر الوسيط (الكلفة)</option>
                  <option value="الاسم">الاسم</option>
                  <option value="الرمز">الرمز</option>
                </select>
              </div>

              <div className="border-t border-[#c5ccd8] bg-[#e9edf4] px-4 py-2 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setSpecsOpen(false)}
                  className="erp-classic-btn w-[150px] h-[28px] font-bold"
                >
                  خروج
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpecsOpen(false);
                    onNotify('تم تطبيق مواصفات البحث');
                  }}
                  className="erp-classic-btn focused w-[150px] h-[28px] font-bold"
                >
                  موافق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* خيارات حسابات الجرد */}
        {accountsOpen && (
          <div className="absolute inset-0 z-40 bg-black/20 flex items-center justify-center p-4">
            <div className="bg-[#e9edf5] border-2 border-[#555] w-[620px] shadow-2xl flex flex-col">
              <div className="bg-white border-b border-[#ccc] px-3 py-1 flex justify-between items-center">
                <span className="font-bold">خيارات حسابات الجرد</span>
                <button
                  type="button"
                  onClick={() => setAccountsOpen(false)}
                  className="px-2 font-bold cursor-pointer hover:bg-[#e81123] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-3 flex flex-col gap-2.5 text-[12px]">
                <div className="flex items-center gap-2 justify-end">
                  <select
                    value={printModel}
                    onChange={(e) => setPrintModel(e.target.value)}
                    className="erp-field w-[300px] bg-white text-center"
                  >
                    <option value="">—</option>
                    <option value="نموذج ١">نموذج ١</option>
                    <option value="نموذج ٢">نموذج ٢</option>
                  </select>
                  <span className="font-bold w-[90px]">نموذج الطباعة</span>
                </div>

                <label className="flex items-center gap-2 justify-end font-bold cursor-pointer">
                  <span>استخدام البحث الموسع في المواد</span>
                  <input
                    type="checkbox"
                    checked={extendedSearch}
                    onChange={(e) => setExtendedSearch(e.target.checked)}
                  />
                </label>

                {[
                  ['حساب الأرباح', profitAccount, setProfitAccount],
                  ['حساب الإخراج', outAccount, setOutAccount],
                  ['حساب العجز', shortageAccount, setShortageAccount],
                  ['حساب الفائض', surplusAccount, setSurplusAccount],
                ].map(([lbl, val, setter]) => (
                  <div key={String(lbl)} className="flex items-center gap-2 justify-end">
                    <input
                      value={val as string}
                      onChange={(e) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)
                      }
                      className="erp-field w-[190px] bg-white text-center"
                    />
                    <button
                      type="button"
                      onClick={() => onNotify(`اختيار ${lbl}`)}
                      className="erp-classic-btn w-[62px] h-[22px] text-[11px]"
                    >
                      بحث
                    </button>
                    <span className="font-bold w-[90px] text-right">{lbl as string}</span>
                  </div>
                ))}

                <div className="flex items-center gap-2 justify-end">
                  <select
                    value={countMethod}
                    onChange={(e) => setCountMethod(e.target.value)}
                    className="erp-field w-[190px] bg-white text-center"
                  >
                    <option value="كميات فقط">كميات فقط</option>
                    <option value="كميات وأسعار">كميات وأسعار</option>
                  </select>
                  <span className="font-bold w-[90px] text-right">طريقة الجرد</span>
                </div>
              </div>

              <div className="border-t border-[#c5ccd8] bg-[#e9edf4] px-4 py-2 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setAccountsOpen(false)}
                  className="erp-classic-btn w-[140px] h-[28px] font-bold"
                >
                  خروج
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountsOpen(false);
                    onNotify('تم حفظ خيارات حسابات الجرد');
                  }}
                  className="erp-classic-btn focused w-[140px] h-[28px] font-bold"
                >
                  موافق
                </button>
              </div>
            </div>
          </div>
        )}

      {/* A4 preview / print for the inventory sheet */}
      {previewOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-3">
          <div className="bg-white border-2 border-[#333] w-[1000px] max-h-[94vh] flex flex-col shadow-2xl">
            <div className="no-print bg-[#f0f0f0] border-b border-[#9aa7b8] px-2 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[12px]">
                <span className="inline-block w-4 h-4 bg-[conic-gradient(#e33_0_25%,#fc0_0_50%,#3a7_0_75%,#38e_0)] border border-[#888]" />
                <span>معاينة طباعة ورقة الجرد</span>
                <span className="text-[#555] font-normal">
                  — {title} #{sheetNo}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="erp-classic-btn focused px-4 h-[26px] text-[12px] font-bold"
                >
                  طباعة
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="erp-classic-btn px-3 h-[26px] text-[12px]"
                >
                  إغلاق
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#9a9a9a] p-4 flex justify-center">
              <div
                data-print-preview
                dir="rtl"
                className="bg-white w-[794px] min-h-[1040px] p-[18px] text-[11px] text-black shadow-xl border border-[#555] flex flex-col"
              >
                <div className="border-2 border-black px-3 py-2 text-center">
                  <div className="text-[16px] font-extrabold">
                    {kind === 'opening' ? 'مذكرة جرد إفتتاحي' : 'مذكرة جرد - تسوية مخزنية'}
                  </div>
                  <div className="text-[10px] mt-0.5">
                    ورقة رقم: <b>{sheetNo}</b> — التاريخ: <b>{date}</b> — المستودع:{' '}
                    <b>{warehouse}</b>
                    {docNumber ? ` — المستند: ${docNumber}` : ''}
                  </div>
                </div>

                {note.trim() && (
                  <div className="border border-t-0 border-black px-2 py-1 text-[10px]">
                    <b>البيان: </b>
                    {note}
                  </div>
                )}

                <table className="w-full border-collapse mt-1 text-[9px]">
                  <thead>
                    <tr className="bg-[#d9d9d9]">
                      <th className="border border-black px-1 py-0.5 w-[28px]">م</th>
                      <th className="border border-black px-1 py-0.5 w-[70px]">الرمز</th>
                      <th className="border border-black px-1 py-0.5">المادة</th>
                      <th className="border border-black px-1 py-0.5 w-[50px]">الوحدة</th>
                      <th className="border border-black px-1 py-0.5 w-[55px]">الكمية</th>
                      <th className="border border-black px-1 py-0.5 w-[62px]">كمية الجرد</th>
                      <th className="border border-black px-1 py-0.5 w-[52px]">الفارق</th>
                      <th className="border border-black px-1 py-0.5 w-[60px]">السعر</th>
                      <th className="border border-black px-1 py-0.5 w-[70px]">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .filter((r) => r.name.trim())
                      .map((r, idx) => (
                        <tr key={r.id} className="h-[18px]">
                          <td className="border border-black px-1 text-center">{idx + 1}</td>
                          <td className="border border-black px-1 text-center">{r.code}</td>
                          <td className="border border-black px-1 font-bold">{r.name}</td>
                          <td className="border border-black px-1 text-center">{r.unit}</td>
                          <td className="border border-black px-1 text-center">
                            {r.qty ? fmt(r.qty) : ''}
                          </td>
                          <td className="border border-black px-1 text-center">
                            {r.countQty ? fmt(r.countQty) : ''}
                          </td>
                          <td className="border border-black px-1 text-center">
                            {r.qty || r.countQty
                              ? fmt((Number(r.countQty) || 0) - (Number(r.qty) || 0))
                              : ''}
                          </td>
                          <td className="border border-black px-1 text-center">
                            {r.price ? fmt(r.price) : ''}
                          </td>
                          <td className="border border-black px-1 text-center font-bold">
                            {rowTotal(r) ? fmt(rowTotal(r)) : ''}
                          </td>
                        </tr>
                      ))}
                    <tr className="bg-[#f2f2f2]">
                      <td className="border border-black px-1 text-center font-extrabold" colSpan={8}>
                        المجموع
                      </td>
                      <td className="border border-black px-1 text-center font-extrabold">
                        {fmt(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-2 border-black border-t-0 px-2 py-1 text-[10px] font-bold text-left">
                  الإجمالي : {fmt(grandTotal)}
                  {approveCount ? ' — ورقة معتمدة' : ''}
                </div>

                <div className="mt-auto pt-12 grid grid-cols-3 gap-6 text-center font-bold text-[10px]">
                  <div>
                    <div>أمين المستودع</div>
                    <div className="mt-1">توقيع ..............................</div>
                  </div>
                  <div>
                    <div>لجنة الجرد</div>
                    <div className="mt-1">..............................</div>
                  </div>
                  <div>
                    <div>ادارة المخازن</div>
                    <div className="mt-1">..............................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DraggableWindow>
  );
};
