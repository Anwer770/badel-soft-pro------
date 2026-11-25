import React, { useEffect, useMemo, useState } from 'react';
import type {
  AccountOptionsState,
  ExtractedInvoiceData,
  JournalEntry,
  JournalOptionsState,
  MsgConfig,
} from '../types/erp';
import {
  AccTreeDialog,
  DetailedAccountStatementDialog,
  findAccountCodeInTree,
} from './AccountsAndStatementDialogs';
import { DraggableWindow } from './DraggableWindow';

interface AccountCatalogItem {
  code: string;
  name: string;
  category: string;
}

const BASE_ACCOUNTS: AccountCatalogItem[] = [
  { code: '12301', name: 'الصندوق', category: 'الأصول المتداولة' },
  { code: '21101', name: 'البنك', category: 'الأصول المتداولة' },
  { code: '122', name: 'الزبائن', category: 'الذمم المدينة' },
  { code: '221', name: 'الموردون', category: 'الذمم الدائنة' },
  { code: '411', name: 'المبيعات', category: 'الإيرادات' },
  { code: '311', name: 'المشتريات', category: 'المصروفات والتكاليف' },
  { code: '312', name: 'مردودات المبيعات', category: 'الإيرادات' },
  { code: '313', name: 'الخصم الممنوح به', category: 'المصروفات' },
  { code: '412', name: 'الخصم المكتسب', category: 'الإيرادات' },
  { code: '511', name: 'المصاريف العمومية', category: 'المصروفات' },
  { code: '211021', name: 'ارباح', category: 'حقوق الملكية' },
  { code: '32201', name: 'عقوبات مالية', category: 'شؤون الموظفين' },
  { code: '32202', name: 'غياب وتأخير', category: 'شؤون الموظفين' },
  { code: '1210301', name: 'مستودع1', category: 'المخزون' },
];

interface JournalDialogProps {
  open: boolean;
  zIndex: number;
  currentUser: string;
  entries: JournalEntry[];
  journalOptions: JournalOptionsState;
  accountOptions: AccountOptionsState;
  prefillData: ExtractedInvoiceData | null;
  onConsumePrefill: () => void;
  onFocus: () => void;
  onClose: () => void;
  onAddEntry: (entry: JournalEntry) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveJournalOptions: (opts: JournalOptionsState) => void;
  onOpenPrint: () => void;
  onOpenAiInvoiceScan: () => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const JournalDialog: React.FC<JournalDialogProps> = ({
  open,
  zIndex,
  currentUser,
  entries,
  journalOptions,
  accountOptions,
  prefillData,
  onConsumePrefill,
  onFocus,
  onClose,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSaveJournalOptions,
  onOpenPrint,
  onOpenAiInvoiceScan,
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

  // Sub-modals
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [draftOptions, setDraftOptions] = useState<JournalOptionsState>(journalOptions);
  const [cashboxOpen, setCashboxOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  useEffect(() => {
    setDraftOptions(journalOptions);
  }, [journalOptions]);

  const accountCatalog = useMemo(() => {
    const map = new Map<string, AccountCatalogItem>();
    for (const item of BASE_ACCOUNTS) {
      map.set(`${item.code}-${item.name}`, item);
    }
    for (const pair of Object.values(accountOptions.accounts || {})) {
      if (pair.name?.trim()) {
        const key = `${pair.code}-${pair.name}`;
        if (!map.has(key)) {
          map.set(key, {
            code: pair.code || '—',
            name: pair.name.trim(),
            category: 'حسابات عامة',
          });
        }
      }
    }
    return Array.from(map.values());
  }, [accountOptions]);

  const findAccountCode = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const treeCode = findAccountCodeInTree(trimmed);
    if (treeCode) return treeCode;
    const match = accountCatalog.find((a) => a.name === trimmed || a.code === trimmed);
    return match ? match.code : '';
  };

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
          setCur('دولار');
        } else if (prefillData.currency.includes('سعودي') || prefillData.currency.includes('SAR')) {
          setCur('ريال سعودي');
        } else {
          setCur('ريال يمني');
        }
      }
      setSelectedId(null);
      onConsumePrefill();
    }
  }, [open, prefillData, onConsumePrefill]);

  const moveDate = (delta: number) => {
    const dt = new Date(date);
    if (Number.isNaN(dt.getTime())) return;
    dt.setDate(dt.getDate() + delta);
    setDate(dt.toISOString().slice(0, 10));
  };

  const clearAllFields = () => {
    setRec('');
    setPay('');
    setDhm('');
    setStmt('');
    setDoc('');
    setFromAcc('');
    setToAcc('');
    setSelectedId(null);
  };

  const clearNonStickyFields = () => {
    const { sticky } = journalOptions;
    if (!sticky.rec) setRec('');
    if (!sticky.pay) setPay('');
    if (!sticky.dhm) setDhm('');
    if (!sticky.stmt) setStmt('');
    if (!sticky.from) setFromAcc('');
    if (!sticky.to) setToAcc('');
    setDoc('');
    setSelectedId(null);
  };

  const handleSelectRow = (entry: JournalEntry) => {
    setSelectedId(entry.id);
    setRec(entry.rec);
    setPay(entry.pay);
    setDhm(entry.dhm);
    setFromAcc(entry.from);
    setToAcc(entry.to);
    setCur(entry.cur === 'دولار أمريكي' ? 'دولار' : entry.cur);
    setStmt(entry.stmt);
    setDoc(entry.doc);
    if (entry.at && /^\d{4}-\d{2}-\d{2}$/.test(entry.at)) {
      setDate(entry.at);
    }
  };

  const handleRefresh = () => {
    clearAllFields();
    onNotify('تم تحديث بيانات اليومية العامة');
  };

  const handleSave = () => {
    if (!stmt.trim() && !rec.trim() && !pay.trim() && !dhm.trim()) {
      onNotify('لا يوجد بيانات للحفظ');
      return;
    }

    const existing = selectedId ? entries.find((e) => e.id === selectedId) : undefined;
    if (existing) {
      const updated: JournalEntry = {
        ...existing,
        rec: rec.trim(),
        pay: pay.trim(),
        dhm: dhm.trim(),
        from: fromAcc.trim() || 'الصندوق',
        to: toAcc.trim() || 'المبيعات',
        cur,
        stmt: stmt.trim(),
        doc: doc.trim(),
        updatedBy: currentUser,
        updatedAt: new Date().toISOString().slice(0, 10),
        editCount: (existing.editCount || 0) + 1,
      };
      onUpdateEntry(updated);
      clearNonStickyFields();
      onNotify('تم تعديل القيد في اليومية العامة');
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
      updatedBy: '',
      updatedAt: '',
      editCount: 0,
    };
    onAddEntry(entry);
    clearNonStickyFields();
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
      clearAllFields();
      onNotify('تم حذف القيد');
    }
  };

  const exportCsv = () => {
    const header = [
      'مقبوضات',
      'مدفوعات',
      'عمليات ذمم',
      'من حساب (مدين)',
      'إلى حساب (دائن)',
      'العملة',
      'البيان',
      ...(journalOptions.columns.showDoc ? ['المستند'] : []),
      ...(journalOptions.columns.showUser ? ['ادخل من قبل'] : []),
      ...(journalOptions.columns.showCreatedAt ? ['تاريخ الادخال'] : []),
      ...(journalOptions.columns.showUpdatedBy ? ['اسم معدل البيانات'] : []),
      ...(journalOptions.columns.showUpdatedAt ? ['تاريخ اخر تعديل'] : []),
      ...(journalOptions.columns.showEditCount ? ['مرات التعديل'] : []),
    ];
    const rows = entries.map((e) => [
      e.rec,
      e.pay,
      e.dhm,
      e.from,
      e.to,
      e.cur,
      e.stmt,
      ...(journalOptions.columns.showDoc ? [e.doc] : []),
      ...(journalOptions.columns.showUser ? [e.by] : []),
      ...(journalOptions.columns.showCreatedAt ? [e.at] : []),
      ...(journalOptions.columns.showUpdatedBy ? [e.updatedBy || ''] : []),
      ...(journalOptions.columns.showUpdatedAt ? [e.updatedAt || ''] : []),
      ...(journalOptions.columns.showEditCount ? [String(e.editCount || 0)] : []),
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

  // Dynamic visible columns count
  const { columns } = journalOptions;
  const visibleColCount =
    8 +
    (columns.showDoc ? 1 : 0) +
    (columns.showUser ? 1 : 0) +
    (columns.showCreatedAt ? 1 : 0) +
    (columns.showUpdatedBy ? 1 : 0) +
    (columns.showUpdatedAt ? 1 : 0) +
    (columns.showEditCount ? 1 : 0);

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
      <div className="flex-1 flex flex-col bg-[#f2f3f7] overflow-hidden relative">
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
              {selectedId && (
                <div className="text-[#0078d7] font-bold pt-1">وضع تعديل قيد محدد</div>
              )}
            </div>
          </div>

          {/* Entry Form + Table */}
          <div className="flex-1 flex flex-col overflow-hidden p-2 gap-2">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {/* Right Panel: Amounts + Statement + Document */}
              <div className="bg-[#fbfcfe] border border-[#bbc] p-2.5 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[12px] text-center">مقبوضات</label>
                    <input
                      value={rec}
                      onChange={(e) => setRec(e.target.value)}
                      className="erp-field w-full text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[12px] text-center">مدفوعات</label>
                    <input
                      value={pay}
                      onChange={(e) => setPay(e.target.value)}
                      className="erp-field w-full text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[12px] text-center">عمليات ذمم</label>
                    <input
                      value={dhm}
                      onChange={(e) => setDhm(e.target.value)}
                      className="erp-field w-full text-center"
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

              {/* Left Panel: Debit/Credit accounts + Currency */}
              <div className="bg-[#fbfcfe] border border-[#bbc] p-2.5 flex flex-col gap-2">
                <div className="grid grid-cols-[1fr_1fr_130px] gap-2 text-[12px] font-bold text-center">
                  <label>من حساب (المدين)</label>
                  <label>إلى حساب (الدائن)</label>
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
                    <option value="ريال يمني">ريال يمني</option>
                    <option value="ريال سعودي">ريال سعودي</option>
                    <option value="دولار">دولار</option>
                  </select>
                </div>
                <div className="grid grid-cols-[1fr_1fr_130px] gap-2">
                  <input
                    readOnly
                    value={findAccountCode(fromAcc)}
                    placeholder="رقم الحساب المدين"
                    className="erp-field w-full bg-[#e5e7ec] text-[#444] text-center"
                  />
                  <input
                    readOnly
                    value={findAccountCode(toAcc)}
                    placeholder="رقم الحساب الدائن"
                    className="erp-field w-full bg-[#e5e7ec] text-[#444] text-center"
                  />
                  <div />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-[#cfdce8] border border-[#333] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0 w-7" />
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                      مقبوضات
                    </th>
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                      مدفوعات
                    </th>
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                      عمليات ذمم
                    </th>
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                      من حساب (مدين)
                    </th>
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                      إلى حساب (دائن)
                    </th>
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                      العملة
                    </th>
                    <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                      البيان
                    </th>
                    {columns.showDoc && (
                      <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                        المستند
                      </th>
                    )}
                    {columns.showUser && (
                      <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                        ادخل من قبل
                      </th>
                    )}
                    {columns.showCreatedAt && (
                      <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                        تاريخ الادخال
                      </th>
                    )}
                    {columns.showUpdatedBy && (
                      <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                        اسم معدل البيانات
                      </th>
                    )}
                    {columns.showUpdatedAt && (
                      <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                        تاريخ اخر تعديل
                      </th>
                    )}
                    {columns.showEditCount && (
                      <th className="bg-[#b9b9f0] border border-[#333] py-2 px-2 text-[13px] font-bold sticky top-0">
                        مرات التعديل
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColCount}
                        className="py-12 text-center text-[#334] font-semibold bg-[#cfdce8]"
                      >
                        لا توجد قيود مسجلة بعد. أدخل قيداً يدوياً أو استخدم «مسح فاتورة / سند بالذكاء الاصطناعي».
                      </td>
                    </tr>
                  ) : (
                    entries.map((e, idx) => {
                      const isSel = e.id === selectedId;
                      return (
                        <tr
                          key={e.id}
                          onClick={() => handleSelectRow(e)}
                          className={`cursor-pointer ${
                            isSel ? 'bg-[#0078d7] text-white' : 'bg-white hover:bg-[#eaf3fc]'
                          }`}
                        >
                          <td className="border border-[#555] px-1.5 py-1.5 text-center text-[12px] bg-[#eceef4] text-black">
                            {idx + 1}
                          </td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.rec}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.pay}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.dhm}</td>
                          <td className="border border-[#555] px-2 py-1.5">{e.from}</td>
                          <td className="border border-[#555] px-2 py-1.5">{e.to}</td>
                          <td className="border border-[#555] px-2 py-1.5 text-center">{e.cur}</td>
                          <td className="border border-[#555] px-2 py-1.5">{e.stmt}</td>
                          {columns.showDoc && (
                            <td className="border border-[#555] px-2 py-1.5 text-center">{e.doc}</td>
                          )}
                          {columns.showUser && (
                            <td className="border border-[#555] px-2 py-1.5 text-center">{e.by}</td>
                          )}
                          {columns.showCreatedAt && (
                            <td className="border border-[#555] px-2 py-1.5 text-center">{e.at}</td>
                          )}
                          {columns.showUpdatedBy && (
                            <td className="border border-[#555] px-2 py-1.5 text-center">
                              {e.updatedBy || ''}
                            </td>
                          )}
                          {columns.showUpdatedAt && (
                            <td className="border border-[#555] px-2 py-1.5 text-center">
                              {e.updatedAt || ''}
                            </td>
                          )}
                          {columns.showEditCount && (
                            <td className="border border-[#555] px-2 py-1.5 text-center">
                              {e.editCount ?? 0}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer matching exact order in screenshot */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#ccd]">
              <button
                type="button"
                onClick={onOpenPrint}
                className="erp-classic-btn h-8 px-3 text-[13px]"
              >
                اعدادات الطباعة
              </button>
              <button
                type="button"
                onClick={() => setCashboxOpen(true)}
                className="erp-classic-btn h-8 px-3 text-[13px]"
              >
                تقرير الصندوق
              </button>
              <button
                type="button"
                onClick={() => setChartOpen(true)}
                className="erp-classic-btn h-8 px-3 text-[13px]"
              >
                شجرة الحسابات
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
                onClick={() => {
                  setDraftOptions(journalOptions);
                  setOptionsOpen(true);
                }}
                className="erp-classic-btn h-8 px-4 text-[13px]"
              >
                خيارات
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="erp-classic-btn h-8 px-4 text-[13px]"
              >
                تحديث
              </button>
              <button
                type="button"
                onClick={clearAllFields}
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

        {/* Sub-Modal: خيارات تثبيت الاطراف */}
        {optionsOpen && (
          <div className="absolute inset-0 bg-black/25 z-30 flex items-center justify-center p-4">
            <div className="w-[480px] max-w-full bg-[#f0f0f0] border border-[#686868] shadow-[0_8px_28px_rgba(0,0,0,0.35)] flex flex-col">
              <div className="h-[30px] bg-white border-b border-[#d4d4d4] flex items-center justify-between px-2.5 select-none">
                <div className="flex items-center gap-2 text-[13px]">
                  <span>🗂️</span>
                  <span>خيارات تثبيت الاطراف</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOptionsOpen(false)}
                  className="w-8 h-[28px] text-[#333] hover:bg-[#e81123] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                {/* تثبيت الاطراف */}
                <fieldset className="border border-[#c5c5c5] p-3 bg-[#f3f3f3]">
                  <legend className="px-1.5 font-bold text-[12px]">تثبيت الاطراف</legend>
                  <div className="flex flex-col gap-2 text-[13px]">
                    {[
                      ['dhm', 'عمليات ذمم'],
                      ['rec', 'مقبوضات'],
                      ['pay', 'مدفوعات'],
                      ['to', 'الحساب الدائن'],
                      ['from', 'الحساب المدين'],
                      ['stmt', 'البيان'],
                    ].map(([k, lbl]) => {
                      const key = k as keyof JournalOptionsState['sticky'];
                      return (
                        <label key={k} className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="font-semibold">{lbl}</span>
                          <input
                            type="checkbox"
                            checked={draftOptions.sticky[key]}
                            onChange={(e) =>
                              setDraftOptions((prev) => ({
                                ...prev,
                                sticky: { ...prev.sticky, [key]: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-[#0078d7]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* اظهار الحقول */}
                <fieldset className="border border-[#c5c5c5] p-3 bg-[#f3f3f3]">
                  <legend className="px-1.5 font-bold text-[12px]">اضهار الحقول</legend>
                  <div className="flex flex-col gap-2 text-[13px]">
                    {[
                      ['showUser', 'اضهار المستخدم'],
                      ['showCreatedAt', 'اضهار تاريخ الادخال'],
                      ['showUpdatedBy', 'اضهار اسم معدل البيانات'],
                      ['showUpdatedAt', 'اضهار تاريخ اخر تعديل'],
                      ['showDoc', 'اضهار المستند'],
                      ['showEditCount', 'اضهار مرات التعديل'],
                    ].map(([k, lbl]) => {
                      const key = k as keyof JournalOptionsState['columns'];
                      return (
                        <label key={k} className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="font-semibold">{lbl}</span>
                          <input
                            type="checkbox"
                            checked={draftOptions.columns[key]}
                            onChange={(e) =>
                              setDraftOptions((prev) => ({
                                ...prev,
                                columns: { ...prev.columns, [key]: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-[#0078d7]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
              <div className="px-4 pb-4 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => {
                    onSaveJournalOptions(draftOptions);
                    setOptionsOpen(false);
                    onNotify('تم حفظ خيارات تثبيت الاطراف واظهار الحقول');
                  }}
                  className="erp-classic-btn focused w-[110px] h-[30px] text-[13px]"
                >
                  موافق
                </button>
                <button
                  type="button"
                  onClick={() => setOptionsOpen(false)}
                  className="erp-classic-btn w-[110px] h-[30px] text-[13px]"
                >
                  خروج
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* تقرير الصندوق -> كشف حساب تفصيلي */}
      <DetailedAccountStatementDialog
        open={cashboxOpen}
        zIndex={zIndex + 10}
        initialAccountName="الصندوق"
        entries={entries}
        onFocus={() => undefined}
        onClose={() => setCashboxOpen(false)}
        onOpenPrint={onOpenPrint}
        onShowMsg={onShowMsg}
        onNotify={onNotify}
      />

      {/* شجرة الحسابات -> frmAccTree */}
      <AccTreeDialog
        open={chartOpen}
        zIndex={zIndex + 10}
        onFocus={() => undefined}
        onClose={() => setChartOpen(false)}
        onAssignAccount={(role, accountName) => {
          if (role === 'from') setFromAcc(accountName);
          else setToAcc(accountName);
        }}
        onNotify={onNotify}
      />
    </DraggableWindow>
  );
};
