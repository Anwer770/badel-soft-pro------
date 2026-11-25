import React, { useEffect, useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import type { GeneralPropsState } from '../types/erp';

export type DesignerColKey =
  | 'attachBeforeR'
  | 'attachAfterR'
  | 'mmR'
  | 'right'
  | 'center'
  | 'left'
  | 'mmL'
  | 'attachBeforeL'
  | 'attachAfterL';

export interface DesignerRow {
  id: string;
  attachBeforeR: string;
  attachAfterR: string;
  mmR: string;
  right: string;
  center: string;
  left: string;
  mmL: string;
  attachBeforeL: string;
  attachAfterL: string;
}

export interface DesignerSectionData {
  rows: DesignerRow[];
  font: string;
}

const DEFAULT_ROW_COUNT = 12;

export const createEmptyDesignerRow = (seed = ''): DesignerRow => ({
  id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${seed}`,
  attachBeforeR: '',
  attachAfterR: '',
  mmR: '',
  right: '',
  center: '',
  left: '',
  mmL: '',
  attachBeforeL: '',
  attachAfterL: '',
});

export const padDesignerRows = (rows: DesignerRow[], minCount = DEFAULT_ROW_COUNT): DesignerRow[] => {
  const copy = rows.map((r) => ({ ...r }));
  while (copy.length < minCount) {
    copy.push(createEmptyDesignerRow(String(copy.length)));
  }
  return copy;
};

export const isDesignerRowEmpty = (r: DesignerRow): boolean =>
  !r.attachBeforeR &&
  !r.attachAfterR &&
  !r.mmR &&
  !r.right &&
  !r.center &&
  !r.left &&
  !r.mmL &&
  !r.attachBeforeL &&
  !r.attachAfterL;

// 6-row token palette matching Screenshot_2026-11-24_010426_843d73c8.png & 010447_07680e8a.png (RTL, 11 grid columns)
const TOKEN_ROW_1 = [
  'عدد الأيام',
  'العنوان عربي',
  'إسم الشركة',
  'بداية المربع',
  'من تاريخ',
  'رقم الصفحة',
  'نص ثابت',
  'رمز الحساب',
  'الصندوق',
  'الضريبة',
  'الصافي رقما وكتابة',
];

const TOKEN_ROWS_2_TO_6: string[][] = [
  [
    'التلفون عربي',
    'الشعار',
    'نهاية المربع',
    'إلى تاريخ',
    'عنوان النافذة',
    'رمز مكرر ثلث',
    'اسم الحساب',
    'الباقي',
    'الصافي',
    'المصاريف رقما',
  ],
  [
    'العنوان أجنبي',
    'المستودع',
    'الاسم',
    'التاريخ',
    'تاريخ العملية',
    'رمز مكرر سطر',
    'رمز واسم الحساب',
    'العملة',
    'المصاريف',
    'المجموع رقما وكتابة',
  ],
  [
    'التلفون أجنبي',
    'المستودع المستلم',
    'العمر',
    'الوقت',
    'الرقم',
    'البيان',
    'رصيد الحساب',
    'الدفعة شبكة',
    'المجموع',
    'الدفعة النقدية رقما',
  ],
  [
    'بيانات إضافية',
    'الرقم الضريبي',
    'الجنس',
    'التاريخ والوقت',
    'الرقم ٢',
    'المستند',
    'رصيد الحساب السابق',
    'نسبة الخصم',
    'الدفعة النقدية',
    'الخصم رقما وكتابة',
  ],
  [
    'الرقم الضريبي',
    'QR Code',
    'الطبيب',
    'عنوان العميل',
    'صورة',
    'اسم المستخدم',
    'الرصيد مع الفاتورة الحالية',
    'مركز الكلفة',
    'الخصم',
    'المجموع قبل',
  ],
];

const FONT_OPTIONS = [
  'Tahoma, 9pt',
  'Tahoma, 10pt',
  'Tahoma, 10pt, Bold',
  'Tahoma, 11pt',
  'Tahoma, 12pt, Bold',
  'Tahoma, 14pt, Bold',
  'Arial, 10pt',
  'Arial, 12pt, Bold',
  'Cairo, 11pt',
];

interface HeaderFooterDesignerDialogProps {
  open: boolean;
  zIndex: number;
  title: string;
  isFooter?: boolean;
  initialData: DesignerSectionData;
  onFocus: () => void;
  onClose: () => void;
  onSave: (data: DesignerSectionData) => void;
}

export const HeaderFooterDesignerDialog: React.FC<HeaderFooterDesignerDialogProps> = ({
  open,
  zIndex,
  title,
  isFooter = false,
  initialData,
  onFocus,
  onClose,
  onSave,
}) => {
  const [rows, setRows] = useState<DesignerRow[]>(() => padDesignerRows(initialData.rows));
  const [font, setFont] = useState(initialData.font || 'Tahoma, 10pt');
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colKey: DesignerColKey }>({
    rowIdx: 0,
    colKey: 'attachBeforeR',
  });
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: DesignerColKey } | null>(null);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [showFixedTextModal, setShowFixedTextModal] = useState(false);
  const [fixedTextDraft, setFixedTextDraft] = useState('');

  useEffect(() => {
    if (open) {
      setRows(padDesignerRows(initialData.rows));
      setFont(initialData.font || 'Tahoma, 10pt');
      setActiveCell({ rowIdx: 0, colKey: 'attachBeforeR' });
      setEditingCell(null);
      setShowFontModal(false);
      setShowFixedTextModal(false);
      setFixedTextDraft('');
    }
  }, [open, initialData]);

  const columns: { key: DesignerColKey; label: string; widthClass: string; align?: string }[] = [
    { key: 'attachBeforeR', label: 'مرفق قبل', widthClass: 'w-[86px]' },
    { key: 'attachAfterR', label: 'مرفق بعد', widthClass: 'w-[86px]' },
    { key: 'mmR', label: 'ملم', widthClass: 'w-[46px]', align: 'text-center' },
    { key: 'right', label: isFooter ? 'تذيل أيمن' : 'ترويسة يمنى', widthClass: 'w-[170px]' },
    { key: 'center', label: isFooter ? 'تذيل أوسط' : 'ترويسة وسطى', widthClass: 'w-[175px]' },
    { key: 'left', label: isFooter ? 'تذيل أيسر' : 'ترويسة يسرى', widthClass: 'w-[175px]' },
    { key: 'mmL', label: 'ملم', widthClass: 'w-[46px]', align: 'text-center' },
    { key: 'attachBeforeL', label: 'مرفق قبل', widthClass: 'w-[86px]' },
    { key: 'attachAfterL', label: 'مرفق بعد', widthClass: 'w-[86px]' },
  ];

  const applyValueToActiveCell = (value: string) => {
    setRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== activeCell.rowIdx) return row;
        const current = row[activeCell.colKey] || '';
        const nextVal = allowMultiple && current ? `${current} ${value}` : value;
        return { ...row, [activeCell.colKey]: nextVal };
      })
    );
  };

  const handleTokenClick = (token: string) => {
    if (token === 'نص ثابت') {
      setFixedTextDraft('');
      setShowFixedTextModal(true);
      return;
    }
    applyValueToActiveCell(`[${token}]`);
  };

  const handleAddRow = () => {
    setRows((prev) => {
      const next = [...prev, createEmptyDesignerRow(String(prev.length))];
      setActiveCell({ rowIdx: next.length - 1, colKey: activeCell.colKey });
      return next;
    });
  };

  const handleDeleteRow = () => {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [createEmptyDesignerRow('0')];
      }
      const filtered = prev.filter((_, idx) => idx !== activeCell.rowIdx);
      const padded = padDesignerRows(filtered);
      const nextIdx = Math.min(activeCell.rowIdx, padded.length - 1);
      setActiveCell({ rowIdx: nextIdx, colKey: activeCell.colKey });
      return padded;
    });
  };

  const handleClearCell = () => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === activeCell.rowIdx ? { ...row, [activeCell.colKey]: '' } : row
      )
    );
  };

  const handleClearAll = () => {
    setRows(padDesignerRows([]));
    setActiveCell({ rowIdx: 0, colKey: 'attachBeforeR' });
  };

  const handleSave = () => {
    onSave({
      rows: rows.filter((r) => !isDesignerRowEmpty(r)),
      font,
    });
    onClose();
  };

  return (
    <DraggableWindow
      open={open}
      title={title}
      width={1060}
      height={580}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-2.5 gap-2.5 overflow-hidden relative select-none">
        {/* Top 6-row Token Palette */}
        <div className="grid grid-cols-11 gap-[3px] shrink-0">
          {TOKEN_ROW_1.map((token) => (
            <button
              key={`r1-${token}`}
              type="button"
              onClick={() => handleTokenClick(token)}
              className="h-[25px] bg-[#efefef] hover:bg-[#e3eefb] active:bg-[#cce4f7] border border-[#707070] text-[#111] text-[11px] font-bold px-1 truncate cursor-pointer text-center"
              title={token}
            >
              {token}
            </button>
          ))}

          {TOKEN_ROWS_2_TO_6.map((rowTokens, rIdx) => (
            <React.Fragment key={`tr-${rIdx}`}>
              <div aria-hidden="true" />
              {rowTokens.map((token, cIdx) => (
                <button
                  key={`r${rIdx + 2}-${cIdx}-${token}`}
                  type="button"
                  onClick={() => handleTokenClick(token)}
                  className="h-[25px] bg-[#efefef] hover:bg-[#e3eefb] active:bg-[#cce4f7] border border-[#707070] text-[#111] text-[11px] font-bold px-1 truncate cursor-pointer text-center"
                  title={token}
                >
                  {token}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Middle Editable Grid Table */}
        <div className="flex-1 bg-white border border-[#828790] overflow-auto erp-scrollbar">
          <table className="w-full border-collapse table-fixed text-[12px]">
            <thead className="sticky top-0 z-10 bg-[#f0f0f0]">
              <tr>
                <th className="w-[26px] border-b border-l border-[#c8c8c8] bg-[#f0f0f0] h-[24px]" />
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.widthClass} border-b border-l border-[#c8c8c8] bg-[#f0f0f0] px-1.5 h-[24px] font-bold text-[#111] text-center`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const isSelectedRow = activeCell.rowIdx === rowIdx;
                return (
                  <tr key={row.id} className="h-[22px]">
                    <td
                      onClick={() => setActiveCell({ rowIdx, colKey: activeCell.colKey })}
                      className="border-b border-l border-[#d4d4d4] bg-[#f0f0f0] text-center text-[10px] text-[#222] cursor-pointer"
                    >
                      {isSelectedRow ? '◀' : ''}
                    </td>
                    {columns.map((col) => {
                      const isSel = isSelectedRow && activeCell.colKey === col.key;
                      const isEditing =
                        editingCell?.rowIdx === rowIdx && editingCell?.colKey === col.key;
                      return (
                        <td
                          key={col.key}
                          onClick={() => setActiveCell({ rowIdx, colKey: col.key })}
                          onDoubleClick={() => {
                            setActiveCell({ rowIdx, colKey: col.key });
                            setEditingCell({ rowIdx, colKey: col.key });
                          }}
                          className={`border-b border-l border-[#d4d4d4] px-1.5 h-[22px] truncate cursor-pointer ${
                            col.align || 'text-right'
                          } ${isSel && !isEditing ? 'bg-[#0078d7] text-white' : 'bg-white text-[#111]'}`}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={row[col.key]}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRows((prev) =>
                                  prev.map((r, i) =>
                                    i === rowIdx ? { ...r, [col.key]: val } : r
                                  )
                                );
                              }}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="w-full h-[20px] px-1 bg-white text-black border border-[#0078d7] outline-none text-[12px]"
                            />
                          ) : (
                            row[col.key]
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls Bar */}
        <div className="flex items-center justify-between gap-4 pt-1 shrink-0">
          {/* Right: Row Add/Delete stacked */}
          <div className="flex flex-col gap-1.5 w-[112px]">
            <button
              type="button"
              onClick={handleAddRow}
              className="erp-classic-btn h-[25px] text-[12px]"
            >
              إضافة صف جديد
            </button>
            <button
              type="button"
              onClick={handleDeleteRow}
              className="erp-classic-btn h-[25px] text-[12px]"
            >
              حذف الصف المحدد
            </button>
          </div>

          {/* Center: Allow multiple tokens checkbox */}
          <label className="flex items-center gap-2 text-[12px] font-bold text-[#111] cursor-pointer">
            <span>السماح بإضافة أكثر من أمر في نفس الخلية</span>
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0078d7]"
            />
          </label>

          {/* Left: Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearCell}
              className="erp-classic-btn w-[82px] h-[28px] text-[12px]"
            >
              إلغاء الخلية
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="erp-classic-btn focused w-[82px] h-[28px] text-[12px]"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => setShowFontModal(true)}
              className="erp-classic-btn w-[82px] h-[28px] text-[12px]"
            >
              الخط
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="erp-classic-btn w-[82px] h-[28px] text-[12px]"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={onClose}
              className="erp-classic-btn w-[82px] h-[28px] text-[12px]"
            >
              خروج
            </button>
          </div>
        </div>

        {/* Fixed Text Sub-Modal */}
        {showFixedTextModal && (
          <div className="absolute inset-0 bg-black/20 z-30 flex items-center justify-center p-4">
            <div className="w-[340px] bg-[#f0f0f0] border border-[#666] shadow-xl p-3 flex flex-col gap-3">
              <div className="font-bold text-[13px] border-b border-[#ccc] pb-1">
                إدخال نص ثابت
              </div>
              <input
                autoFocus
                value={fixedTextDraft}
                onChange={(e) => setFixedTextDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fixedTextDraft.trim()) {
                    applyValueToActiveCell(fixedTextDraft.trim());
                    setShowFixedTextModal(false);
                  }
                }}
                placeholder="اكتب النص الثابت للخلية..."
                className="erp-field bg-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (fixedTextDraft.trim()) {
                      applyValueToActiveCell(fixedTextDraft.trim());
                    }
                    setShowFixedTextModal(false);
                  }}
                  className="erp-classic-btn focused px-4 h-[26px] text-[12px]"
                >
                  موافق
                </button>
                <button
                  type="button"
                  onClick={() => setShowFixedTextModal(false)}
                  className="erp-classic-btn px-4 h-[26px] text-[12px]"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Font Picker Sub-Modal */}
        {showFontModal && (
          <div className="absolute inset-0 bg-black/20 z-30 flex items-center justify-center p-4">
            <div className="w-[320px] bg-[#f0f0f0] border border-[#666] shadow-xl p-3 flex flex-col gap-3">
              <div className="font-bold text-[13px] border-b border-[#ccc] pb-1">
                اختيار خط الترويسة / التذيل
              </div>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="erp-field bg-white"
                dir="ltr"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFontModal(false)}
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

export const renderDesignerTokenPreview = (
  rawText: string,
  propsState: GeneralPropsState,
  reportType: string,
  attachBefore = '',
  attachAfter = ''
): React.ReactNode => {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  if (trimmed === '[الشعار]') {
    return propsState.logoData ? (
      <img
        src={propsState.logoData}
        alt="الشعار"
        referrerPolicy="no-referrer"
        className="h-14 w-auto object-contain inline-block"
      />
    ) : (
      <span className="inline-flex items-center justify-center w-16 h-12 border border-dashed border-[#999] text-[11px] text-[#666]">
        الشعار
      </span>
    );
  }
  if (trimmed === '[QR Code]') {
    return (
      <span className="inline-flex items-center justify-center w-11 h-11 border border-[#333] text-[9px] font-mono bg-[#f9f9f9]">
        QR
      </span>
    );
  }

  const tokenMap: Record<string, string> = {
    '[إسم الشركة]': propsState.hdrArName || propsState.company || 'بديل سوفت',
    '[العنوان عربي]': propsState.hdrArAddr || 'صنعاء - الجمهورية اليمنية',
    '[التلفون عربي]': propsState.hdrArTel || '771337032',
    '[العنوان أجنبي]': propsState.hdrEnAddr || 'Sanaa - Yemen',
    '[التلفون أجنبي]': propsState.hdrEnTel || '0562998713',
    '[الرقم الضريبي]': '300123456700003',
    '[التاريخ]': '2026/11/24',
    '[الوقت]': '01:04 ص',
    '[التاريخ والوقت]': '2026/11/24 01:04 ص',
    '[رقم الصفحة]': 'صفحة 1 من 1',
    '[عنوان النافذة]': reportType || 'تقرير عام',
    '[اسم المستخدم]': 'admin',
    '[من تاريخ]': '2026/01/01',
    '[إلى تاريخ]': '2026/11/24',
    '[العملة]': 'ريال يمني',
  };

  let resolved = trimmed;
  Object.entries(tokenMap).forEach(([tok, val]) => {
    resolved = resolved.split(tok).join(val);
  });

  return `${attachBefore}${resolved}${attachAfter}`;
};
