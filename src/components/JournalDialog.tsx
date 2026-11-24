import React, { useEffect, useState } from 'react';
import type { ExtractedInvoiceData, JournalEntry, MsgConfig } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface JournalDialogProps {
  open: boolean;
  zIndex: number;
  currentUser: string;
  entries: JournalEntry[];
  prefillData: ExtractedInvoiceData | null;
  onConsumePrefill: () => void;
  onFocus: () => void;
  onClose: () => void;
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onOpenPrint: () => void;
  onOpenAiInvoiceScan: () => void;
  onOpenGeneralReport: () => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const JournalDialog: React.FC<JournalDialogProps> = ({
  open,
  zIndex,
  currentUser,
  entries,
  prefillData,
  onConsumePrefill,
  onFocus,
  onClose,
  onAddEntry,
  onDeleteEntry,
  onOpenPrint,
  onOpenAiInvoiceScan,
  onOpenGeneralReport,
  onShowMsg,
  onNotify,
}) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rec, setRec] = useState('');
  const [pay, setPay] = useState('');
  const [dhm, setDhm] = useState('');
  const [stmt, setStmt] = useState('');
  const [doc, setDoc] = useState('');
  const [fromAcc, setFromAcc] = useState('');
  const [toAcc, setToAcc] = useState('');
  const [cur, setCur] = useState('ريال يمني');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && prefillData) {
      const amount = prefillData.totalAmount || '';
      if (prefillData.entryType === 'مقبوضات') {
        setRec(amount);
        setPay('');
        setDhm('');
      } else if (prefillData.entryType === 'ذمم') {
        setRec('');
        setPay('');
        setDhm(amount);
      } else {
        setRec('');
        setPay(amount);
        setDhm('');
      }
      if (prefillData.date && /^\d{4}-\d{2}-\d{2}$/.test(prefillData.date)) {
        setDate(prefillData.date);
      }
      setStmt(
        prefillData.statement ||
          (prefillData.vendorOrParty ? `فاتورة - ${prefillData.vendorOrParty}` : '')
      );
      setDoc(prefillData.documentNumber || '');
      setFromAcc(prefillData.suggestedDebitAccount || '');
      setToAcc(prefillData.suggestedCreditAccount || '');
      if (prefillData.currency) {
        if (prefillData.currency.includes('دولار') || prefillData.currency.includes('USD')) {
          setCur('دولار أمريكي');
        } else if (prefillData.currency.includes('سعودي') || prefillData.currency.includes('SAR')) {
          setCur('ريال سعودي');
        } else {
          setCur('ريال يمني');
        }
      }
      onConsumePrefill();
    }
  }, [open, prefillData, onConsumePrefill]);

  const moveDate = (delta: number) => {
    const dt = new Date(date);
    if (Number.isNaN(dt.getTime())) return;
    dt.setDate(dt.getDate() + delta);
    setDate(dt.toISOString().slice(0, 10));
  };

  const clearForm = () => {
    setRec('');
    setPay('');
    setDhm('');
    setStmt('');
    setDoc('');
    setFromAcc('');
    setToAcc('');
    setSelectedId(null);
  };

  const handleSave = () => {
    if (!stmt.trim() && !rec.trim() && !pay.trim() && !dhm.trim()) {
      onNotify('لا يوجد بيانات للحفظ');
      return;
    }
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      rec: rec.trim(),
      pay: pay.trim(),
      dhm: dhm.trim(),
      from: fromAcc.trim() || 'الصندوق',
      to: toAcc.trim() || 'المبيعات',
      cur,
      stmt: stmt.trim(),
      doc: doc.trim(),
      by: currentUser,
      at: date,
    };
    onAddEntry(entry);
    clearForm();
    onNotify('تم حفظ القيد في اليومية العامة');
  };

  const handleDelete = async () => {
    if (!selectedId) {
      onNotify('اختر قيداً من الجدول أولاً');
      return;
    }
    const res = await onShowMsg({
      title: 'اليومية العامة',
      icon: 'question',
      text: 'هل تريد حذف القيد المحدد؟',
      buttons: [
        { label: 'نعم', value: 'yes' },
        { label: 'لا', value: 'no', focus: true },
      ],
    });
    if (res === 'yes') {
      onDeleteEntry(selectedId);
      setSelectedId(null);
      onNotify('تم حذف القيد');
    }
  };

  const exportCsv = () => {
    const header = [
      'مقبوضات',
      'مدفوعات',
      'عمليات ذم',
      'من حساب (مدين)',
      'إلى حساب (دائن)',
      'العملة',
      'البيان',
      'المستند',
      'ادخل من قبل',
      'تاريخ الادخال',
    ];
    const rows = entries.map((e) => [
      e.rec,
      e.pay,
      e.dhm,
      e.from,
      e.to,
      e.cur,
      e.stmt,
      e.doc,
      e.by,
      e.at,
    ]);
    const csv =
      '\uFEFF' +
      [header, ...rows]
        .map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('تم تصدير قيود اليومية إلى ملف CSV');
  };

  return (
    <DraggableWindow
      open={open}
      title="اليومية العامة"
      width={1260}
      height={740}
      initialMaximized
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f2f3f7] overflow-hidden">
        {/* Top Date Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 py-2 px-3 bg-[#f2f3f7] border-b border-[#d4d6de]">
          <span className="font-bold text-[14px]">التاريخ</span>
          <button
            type="button"
            onClick={() => moveDate(1)}
            className="erp-classic-btn w-10 h-8 text-[15px]"
            title="اليوم التالي"
          >
            ⬆
          </button>
          <button
            type="button"
            onClick={() => moveDate(-1)}
            className="erp-classic-btn w-10 h-8 text-[15px]"
            title="اليوم السابق"
          >
            ⬇
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="erp-field w-[240px] h-8 border-2 border-[#0078d7] font-semibold"
          />
          <button
            type="button"
            onClick={onOpenAiInvoiceScan}
            className="erp-classic-btn focused h-8 px-3.5 text-[13px]"
          >
            مسح فاتورة / سند بالذكاء الاصطناعي
          </button>
        </div>

        {/* Main Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Side Panel */}
          <div className="hidden lg:flex w-[220px] shrink-0 bg-[#fbfcfd] border-l border-[#99a] p-3 flex-col items-center gap-3">
            <div className="text-[44px] leading-none">📅</div>
            <div className="font-extrabold text-[15px]">اليومية العامة</div>
            <div className="w-full border-t border-[#ddd] pt-3 text-[12px] text-[#444] space-y-1.5">
              <div>
                عدد القيود المسجلة: <b>{entries.length}</b>
              </div>
              <div>
                المستخدم الحالي: <b>{currentUser}</b>
              </div>
            </div>
          </div>

          {/* Entry Form + Table */}
          <div className="flex-1 flex flex-col overflow-hidden p-2 gap-2">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="bg-[#fbfcfe] border border-[#bbc] p-2.5 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-[12px] shrink-0">مقبوضات</label>
                    <input
                      value={rec}
                      onChange={(e) => setRec(e.target.value)}
                      className="erp-field w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-[12px] shrink-0">مدفوعات</label>
                    <input
                      value={pay}
                      onChange={(e) => setPay(e.target.value)}
                      className="erp-field w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-[12px] shrink-0">عمليات ذم</label>
                    <input
                      value={dhm}
                      onChange={(e) => setDhm(e.target.value)}
                      className="erp-field w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-bold text-[13px] shrink-0">البيان</label>
                  <input
                    value={stmt}
                    onChange={(e) => setStmt(e.target.value)}
                    className="erp-field flex-1"
                  />
                  <label className="font-bold text-[13px] shrink-0">المستند</label>
                  <input
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    className="erp-field w-[130px]"
                  />
                </div>
              </div>

              <div className="bg-[#fbfcfe] border border-[#bbc] p-2.5 flex flex-col gap-2">
                <div className="grid grid-cols-[1fr_1fr_130px] gap-2 text-[12px] font-bold">
                  <label>من حساب (المدين)</label>
                  <label>الى حساب (الدائن)</label>
                  <label>العملة</label>
                </div>
                <div className="grid grid-cols-[1fr_1fr_130px] gap-2">
                  <input
                    value={fromAcc}
                    onChange={(e) => setFromAcc(e.target.value)}
                    placeholder="مثال: الصندوق"
                    className="erp-field w-full"
                  />
                  <input
                    value={toAcc}
                    onChange={(e) => setToAcc(e.target.value)}
                    placeholder="مثال: المبيعات"
                    className="erp-field w-full"
                  />
                  <select
                    value={cur}
                    onChange={(e) => setCur(e.target.value)}
                    className="erp-field w-full"
                  >
                    <option>ريال يمني</option>
                    <option>دولار أمريكي</option>
                    <option>ريال سعودي</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-[#cfdce8] border border-[#333] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      'مقبوضات',
                      'مدفوعات',
                      'عمليات ذم',
                      'من حساب (مدين)',
                      'إلى حساب (دائن)',
                      'العملة',
                      'البيان',
                      'المستند',
                      'ادخل من قبل',
                      'تاريخ الادخال',
                    ].map((h) => (
                      <th
                        key={h}
                        className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#334] font-semibold bg-[#cfdce8]">
                        لا توجد قيود مسجلة بعد. أدخل قيداً يدوياً أو استخدم «مسح فاتورة / سند بالذكاء الاصطناعي».
                      </td>
                    </tr>
                  ) : (
                    entries.map((e) => {
                      const isSel = e.id === selectedId;
                      return (
                        <tr
                          key={e.id}
                          onClick={() => setSelectedId(e.id)}
                          className={`cursor-pointer ${
                            isSel ? 'bg-[#0078d7] text-white' : 'bg-white hover:bg-[#eaf3fc]'
                          }`}
                        >
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.rec}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.pay}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.dhm}</td>
                          <td className="border border-[#555] px-2 py-1.5">{e.from}</td>
                          <td className="border border-[#555] px-2 py-1.5">{e.to}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.cur}</td>
                          <td className="border border-[#555] px-2 py-1.5">{e.stmt}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.doc}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.by}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.at}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#ccd]">
              <button type="button" onClick={onOpenPrint} className="erp-classic-btn h-8 px-3 text-[13px]">
                اعدادات الطباعة
              </button>
              <button
                type="button"
                onClick={onOpenGeneralReport}
                className="erp-classic-btn h-8 px-3 text-[13px]"
              >
                التقرير العام
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="erp-classic-btn h-8 px-3 text-[13px]"
              >
                تصدير الى اكسل
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={clearForm}
                className="erp-classic-btn h-8 px-4 text-[13px]"
              >
                جديد
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="erp-classic-btn focused h-8 px-5 text-[13px]"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="erp-classic-btn h-8 px-4 text-[13px]"
              >
                حذف
              </button>
              <button
                type="button"
                onClick={onClose}
                className="erp-classic-btn h-8 px-4 text-[13px]"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
