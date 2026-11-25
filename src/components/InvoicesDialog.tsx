import React, { useEffect, useState } from 'react';
import type { InvoiceLineItem, InvoiceRecord, MsgConfig } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

export interface InvoicesModalLaunch {
  mode: 'editor' | 'browse' | 'profit';
  kindTitle: string;
}

interface InvoicesDialogProps {
  open: boolean;
  launch: InvoicesModalLaunch;
  zIndex: number;
  currentUser: string;
  invoices: InvoiceRecord[];
  onFocus: () => void;
  onClose: () => void;
  onSaveInvoice: (inv: InvoiceRecord) => void;
  onDeleteInvoice: (id: string) => void;
  onOpenAiInvoiceScan: () => void;
  onOpenPrint: () => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const InvoicesDialog: React.FC<InvoicesDialogProps> = ({
  open,
  launch,
  zIndex,
  currentUser,
  invoices,
  onFocus,
  onClose,
  onSaveInvoice,
  onDeleteInvoice,
  onOpenAiInvoiceScan,
  onOpenPrint,
  onShowMsg,
  onNotify,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'browse' | 'profit'>(launch.mode);
  const [kindTitle, setKindTitle] = useState(launch.kindTitle);
  const [invNumber, setInvNumber] = useState('1');
  const [invDate, setInvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [party, setParty] = useState('عميل نقدي');
  const [currency, setCurrency] = useState('ريال يمني');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: '1', code: '101', name: 'صنف افتراضي', unit: 'حبة', qty: 1, price: 0, cost: 0 },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setViewMode(launch.mode);
      setKindTitle(launch.kindTitle);
      setEditingId(null);
      setInvNumber(String(invoices.length + 1));
    }
  }, [open, launch, invoices.length]);

  const totalAmount = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const totalProfit = items.reduce((sum, it) => sum + it.qty * (it.price - it.cost), 0);

  const addLine = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        code: '',
        name: '',
        unit: 'حبة',
        qty: 1,
        price: 0,
        cost: 0,
      },
    ]);
  };

  const updateLine = (idx: number, field: keyof InvoiceLineItem, val: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSave = () => {
    const validItems = items.filter((it) => it.name.trim() || it.price > 0);
    if (!validItems.length) {
      onNotify('أضف مادة واحدة على الأقل قبل الحفظ');
      return;
    }
    const record: InvoiceRecord = {
      id: editingId || `inv-${Date.now()}`,
      kind: kindTitle,
      number: invNumber || String(invoices.length + 1),
      date: invDate,
      party: party.trim() || 'عميل نقدي',
      currency,
      notes,
      items: validItems,
      total: totalAmount,
      profit: totalProfit,
      by: currentUser,
    };
    onSaveInvoice(record);
    onNotify(`تم حفظ ${kindTitle} رقم ${record.number}`);
    setEditingId(null);
    setInvNumber(String(invoices.length + 2));
    setItems([{ id: '1', code: '101', name: '', unit: 'حبة', qty: 1, price: 0, cost: 0 }]);
  };

  const loadForEdit = (inv: InvoiceRecord) => {
    setEditingId(inv.id);
    setKindTitle(inv.kind);
    setInvNumber(inv.number);
    setInvDate(inv.date);
    setParty(inv.party);
    setCurrency(inv.currency);
    setNotes(inv.notes);
    setItems(inv.items.length ? inv.items : [{ id: '1', code: '', name: '', unit: 'حبة', qty: 1, price: 0, cost: 0 }]);
    setViewMode('editor');
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const profitSource = kindTitle.includes('اليوم')
    ? invoices.filter((i) => i.date === todayStr)
    : invoices;

  return (
    <DraggableWindow
      open={open}
      title={kindTitle}
      width={1140}
      height={680}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 gap-2.5 overflow-hidden">
        {/* Top Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ccc] pb-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-3.5 py-1 text-[13px] font-bold border border-[#8e8e8e] cursor-pointer ${
                viewMode === 'editor' ? 'bg-white text-[#0078d7]' : 'bg-[#e3e6ee]'
              }`}
            >
              تحرير / إنشاء فاتورة
            </button>
            <button
              type="button"
              onClick={() => setViewMode('browse')}
              className={`px-3.5 py-1 text-[13px] font-bold border border-[#8e8e8e] cursor-pointer ${
                viewMode === 'browse' ? 'bg-white text-[#0078d7]' : 'bg-[#e3e6ee]'
              }`}
            >
              استعراض وتعديل الفواتير ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('profit')}
              className={`px-3.5 py-1 text-[13px] font-bold border border-[#8e8e8e] cursor-pointer ${
                viewMode === 'profit' ? 'bg-white text-[#0078d7]' : 'bg-[#e3e6ee]'
              }`}
            >
              تقرير الأرباح والجرد
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenAiInvoiceScan}
              className="erp-classic-btn focused px-3 h-[28px] text-[12px]"
            >
              قراءة فاتورة بالذكاء الاصطناعي
            </button>
            <button
              type="button"
              onClick={onOpenPrint}
              className="erp-classic-btn px-3 h-[28px] text-[12px]"
            >
              إعداد الطباعة
            </button>
          </div>
        </div>

        {viewMode === 'editor' && (
          <>
            <div className="bg-white border border-[#999] p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <label className="font-bold text-[12px] shrink-0">رقم الفاتورة</label>
                <input
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  className="erp-field w-full text-center font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold text-[12px] shrink-0">التاريخ</label>
                <input
                  type="date"
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                  className="erp-field w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold text-[12px] shrink-0">الحساب / العميل</label>
                <input
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="erp-field w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold text-[12px] shrink-0">العملة</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="erp-field w-full"
                >
                  <option>ريال يمني</option>
                  <option>ريال سعودي</option>
                  <option>دولار أمريكي</option>
                </select>
              </div>
            </div>

            <div className="flex-1 bg-white border border-[#8e8e8e] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#b9b9f0] border-b border-[#333]">
                    <th className="py-1.5 px-2 border-l border-[#555] w-24">رمز المادة</th>
                    <th className="py-1.5 px-2 border-l border-[#555]">اسم المادة</th>
                    <th className="py-1.5 px-2 border-l border-[#555] w-24">الوحدة</th>
                    <th className="py-1.5 px-2 border-l border-[#555] w-24">الكمية</th>
                    <th className="py-1.5 px-2 border-l border-[#555] w-28">السعر</th>
                    <th className="py-1.5 px-2 border-l border-[#555] w-28">الكلفة</th>
                    <th className="py-1.5 px-2 border-l border-[#555] w-32">الإجمالي</th>
                    <th className="py-1.5 px-2 w-14">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id} className="border-b border-[#ddd]">
                      <td className="p-0 border-l border-[#ddd]">
                        <input
                          value={it.code}
                          onChange={(e) => updateLine(idx, 'code', e.target.value)}
                          className="w-full h-8 px-2 text-center outline-none focus:bg-[#eaf3fc]"
                        />
                      </td>
                      <td className="p-0 border-l border-[#ddd]">
                        <input
                          value={it.name}
                          placeholder="اكتب اسم المادة..."
                          onChange={(e) => updateLine(idx, 'name', e.target.value)}
                          className="w-full h-8 px-2 outline-none focus:bg-[#eaf3fc]"
                        />
                      </td>
                      <td className="p-0 border-l border-[#ddd]">
                        <input
                          value={it.unit}
                          onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                          className="w-full h-8 px-2 text-center outline-none focus:bg-[#eaf3fc]"
                        />
                      </td>
                      <td className="p-0 border-l border-[#ddd]">
                        <input
                          type="number"
                          min={0}
                          value={it.qty}
                          onChange={(e) => updateLine(idx, 'qty', Number(e.target.value) || 0)}
                          className="w-full h-8 px-2 text-center outline-none focus:bg-[#eaf3fc]"
                        />
                      </td>
                      <td className="p-0 border-l border-[#ddd]">
                        <input
                          type="number"
                          min={0}
                          value={it.price}
                          onChange={(e) => updateLine(idx, 'price', Number(e.target.value) || 0)}
                          className="w-full h-8 px-2 text-center outline-none focus:bg-[#eaf3fc]"
                        />
                      </td>
                      <td className="p-0 border-l border-[#ddd]">
                        <input
                          type="number"
                          min={0}
                          value={it.cost}
                          onChange={(e) => updateLine(idx, 'cost', Number(e.target.value) || 0)}
                          className="w-full h-8 px-2 text-center outline-none focus:bg-[#eaf3fc]"
                        />
                      </td>
                      <td className="px-2 text-center font-bold border-l border-[#ddd]">
                        {(it.qty * it.price).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setItems((prev) =>
                              prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                            )
                          }
                          className="text-[#b00020] font-bold px-2 cursor-pointer"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-[#ccc] p-2.5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <button type="button" onClick={addLine} className="erp-classic-btn px-3 h-[30px]">
                  + إضافة سطر
                </button>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات الفاتورة..."
                  className="erp-field flex-1"
                />
              </div>
              <div className="flex items-center gap-6 text-[15px] font-extrabold">
                <span>
                  الإجمالي: <span className="text-[#005499]">{totalAmount.toLocaleString()}</span>{' '}
                  {currency}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="erp-classic-btn focused w-[140px] h-[34px]"
              >
                حفظ الفاتورة
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="erp-classic-btn w-[130px] h-[34px]"
              >
                طباعة
              </button>
              <button type="button" onClick={onClose} className="erp-classic-btn w-[130px] h-[34px]">
                خروج
              </button>
            </div>
          </>
        )}

        {viewMode === 'browse' && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <div className="flex-1 bg-white border border-[#8e8e8e] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#e8eaf0] border-b border-[#999]">
                    <th className="py-2 px-2 border-l border-[#ccc]">رقم</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">النوع</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">التاريخ</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">العميل / المورد</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">العملة</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">الإجمالي</th>
                    <th className="py-2 px-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#666]">
                        لا توجد فواتير مسجلة حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-[#ddd] hover:bg-[#f2f7fd]">
                        <td className="py-1.5 px-2 text-center border-l border-[#eee]">{inv.number}</td>
                        <td className="py-1.5 px-2 border-l border-[#eee]">{inv.kind}</td>
                        <td className="py-1.5 px-2 text-center border-l border-[#eee]">{inv.date}</td>
                        <td className="py-1.5 px-2 border-l border-[#eee]">{inv.party}</td>
                        <td className="py-1.5 px-2 text-center border-l border-[#eee]">{inv.currency}</td>
                        <td className="py-1.5 px-2 text-center font-bold border-l border-[#eee]">
                          {inv.total.toLocaleString()}
                        </td>
                        <td className="py-1 px-2 text-center flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => loadForEdit(inv)}
                            className="erp-classic-btn px-2.5 py-0.5 text-[12px]"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const r = await onShowMsg({
                                title: 'حذف فاتورة',
                                icon: 'question',
                                text: `هل تريد حذف الفاتورة رقم ${inv.number}؟`,
                                buttons: [
                                  { label: 'نعم', value: 'yes' },
                                  { label: 'لا', value: 'no', focus: true },
                                ],
                              });
                              if (r === 'yes') onDeleteInvoice(inv.id);
                            }}
                            className="erp-classic-btn px-2.5 py-0.5 text-[12px]"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'profit' && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-[#999] p-3 text-center">
                <div className="text-[13px] text-[#555] font-bold">عدد الفواتير</div>
                <div className="text-[22px] font-black text-[#005499]">{profitSource.length}</div>
              </div>
              <div className="bg-white border border-[#999] p-3 text-center">
                <div className="text-[13px] text-[#555] font-bold">إجمالي المبيعات / القيمة</div>
                <div className="text-[22px] font-black text-[#111]">
                  {profitSource.reduce((s, i) => s + i.total, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-[#999] p-3 text-center">
                <div className="text-[13px] text-[#555] font-bold">صافي الربح التقديري</div>
                <div className="text-[22px] font-black text-[#0b6b3a]">
                  {profitSource.reduce((s, i) => s + i.profit, 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white border border-[#8e8e8e] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#e8eaf0] border-b border-[#999]">
                    <th className="py-2 px-2 border-l border-[#ccc]">رقم</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">النوع</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">التاريخ</th>
                    <th className="py-2 px-2 border-l border-[#ccc]">الإجمالي</th>
                    <th className="py-2 px-2">الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {profitSource.map((inv) => (
                    <tr key={inv.id} className="border-b border-[#ddd]">
                      <td className="py-1.5 px-2 text-center border-l border-[#eee]">{inv.number}</td>
                      <td className="py-1.5 px-2 border-l border-[#eee]">{inv.kind}</td>
                      <td className="py-1.5 px-2 text-center border-l border-[#eee]">{inv.date}</td>
                      <td className="py-1.5 px-2 text-center border-l border-[#eee]">
                        {inv.total.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-[#0b6b3a]">
                        {inv.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
