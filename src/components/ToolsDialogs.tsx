import React, { useState } from 'react';
import { toAr } from '../data/erpDefaults';
import type { CurrencyItem, ErpState } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface CurrenciesDialogProps {
  open: boolean;
  zIndex: number;
  currencies: CurrencyItem[];
  onFocus: () => void;
  onClose: () => void;
  onSave: (next: CurrencyItem[]) => void;
}

export const CurrenciesDialog: React.FC<CurrenciesDialogProps> = ({
  open,
  zIndex,
  currencies,
  onFocus,
  onClose,
  onSave,
}) => {
  const [list, setList] = useState<CurrencyItem[]>(currencies);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newRate, setNewRate] = useState('1');

  const handleAdd = () => {
    if (!newName.trim() || !newCode.trim()) return;
    const next = [
      ...list,
      {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        symbol: newSymbol.trim() || newCode.trim(),
        rate: Number(newRate) || 1,
      },
    ];
    setList(next);
    onSave(next);
    setNewName('');
    setNewCode('');
    setNewSymbol('');
    setNewRate('1');
  };

  return (
    <DraggableWindow
      open={open}
      title="قائمة العملات"
      width={740}
      height={480}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 gap-3 overflow-hidden">
        <div className="bg-white border border-[#8e8e8e] flex-1 overflow-auto erp-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f6fa] border-b border-[#999]">
                <th className="py-2 px-3 border-l border-[#ccc]">الرمز</th>
                <th className="py-2 px-3 border-l border-[#ccc]">اسم العملة</th>
                <th className="py-2 px-3 border-l border-[#ccc]">الاختصار</th>
                <th className="py-2 px-3">سعر الصرف</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c, idx) => (
                <tr key={c.code} className="border-b border-[#ddd]">
                  <td className="py-1.5 px-3 text-center border-l border-[#ddd] font-bold">{c.code}</td>
                  <td className="py-1.5 px-3 border-l border-[#ddd]">{c.name}</td>
                  <td className="py-1.5 px-3 text-center border-l border-[#ddd]">{c.symbol}</td>
                  <td className="py-1 px-3 text-center">
                    <input
                      type="number"
                      step="0.01"
                      value={c.rate}
                      disabled={c.isBase}
                      onChange={(e) => {
                        const next = [...list];
                        next[idx] = { ...next[idx], rate: Number(e.target.value) || 1 };
                        setList(next);
                      }}
                      className="erp-field w-28 text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#ccc] p-2.5 grid grid-cols-5 gap-2 items-center">
          <input
            placeholder="الرمز (EUR)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="erp-field"
          />
          <input
            placeholder="اسم العملة"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="erp-field"
          />
          <input
            placeholder="الاختصار"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="erp-field"
          />
          <input
            type="number"
            placeholder="سعر الصرف"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            className="erp-field"
          />
          <button type="button" onClick={handleAdd} className="erp-classic-btn focused h-[28px]">
            إضافة عملة
          </button>
        </div>

        <div className="flex justify-center gap-6">
          <button
            type="button"
            onClick={() => {
              onSave(list);
              onClose();
            }}
            className="erp-classic-btn focused w-[130px] h-[32px]"
          >
            حفظ وخروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

interface GeneralReportDialogProps {
  open: boolean;
  zIndex: number;
  state: ErpState;
  onFocus: () => void;
  onClose: () => void;
}

export const GeneralReportDialog: React.FC<GeneralReportDialogProps> = ({
  open,
  zIndex,
  state,
  onFocus,
  onClose,
}) => {
  const sumField = (key: 'rec' | 'pay' | 'dhm') =>
    state.journal.reduce((acc, row) => acc + (parseFloat(row[key]) || 0), 0);

  const totalRec = sumField('rec');
  const totalPay = sumField('pay');
  const totalDhm = sumField('dhm');

  return (
    <DraggableWindow
      open={open}
      title="التقرير العام"
      width={880}
      height={560}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 gap-3 overflow-hidden">
        <div className="bg-white border border-[#8e8e8e] p-4 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-[17px]">{state.props.hdrArName || state.props.company}</div>
            <div className="text-[13px] text-[#555]">
              الفترة المالية: {state.props.dateFrom} إلى {state.props.dateTo}
            </div>
          </div>
          <div className="text-left text-[13px]">
            <div>العام: {toAr(state.props.year)}</div>
            <div>المستخدم: {state.currentUser}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#999] p-3 text-center">
            <div className="text-[13px] text-[#555] font-bold">إجمالي المقبوضات</div>
            <div className="text-[22px] font-black text-[#0b6b3a] mt-1">{totalRec.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-[#999] p-3 text-center">
            <div className="text-[13px] text-[#555] font-bold">إجمالي المدفوعات</div>
            <div className="text-[22px] font-black text-[#b00020] mt-1">{totalPay.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-[#999] p-3 text-center">
            <div className="text-[13px] text-[#555] font-bold">إجمالي الذمم</div>
            <div className="text-[22px] font-black text-[#005499] mt-1">{totalDhm.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex-1 bg-white border border-[#8e8e8e] overflow-auto erp-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#e8eaf0] border-b border-[#999]">
                <th className="py-1.5 px-2 border-l border-[#ccc]">التاريخ</th>
                <th className="py-1.5 px-2 border-l border-[#ccc]">البيان</th>
                <th className="py-1.5 px-2 border-l border-[#ccc]">المدين</th>
                <th className="py-1.5 px-2 border-l border-[#ccc]">الدائن</th>
                <th className="py-1.5 px-2 border-l border-[#ccc]">مقبوضات</th>
                <th className="py-1.5 px-2">مدفوعات</th>
              </tr>
            </thead>
            <tbody>
              {state.journal.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#666]">
                    لا توجد حركات مسجلة في اليومية العامة حتى الآن.
                  </td>
                </tr>
              ) : (
                state.journal.map((j) => (
                  <tr key={j.id} className="border-b border-[#e5e5e5]">
                    <td className="py-1.5 px-2 text-center border-l border-[#eee]">{j.at}</td>
                    <td className="py-1.5 px-2 border-l border-[#eee]">{j.stmt}</td>
                    <td className="py-1.5 px-2 border-l border-[#eee]">{j.from}</td>
                    <td className="py-1.5 px-2 border-l border-[#eee]">{j.to}</td>
                    <td className="py-1.5 px-2 text-center border-l border-[#eee]">{j.rec || '—'}</td>
                    <td className="py-1.5 px-2 text-center">{j.pay || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-6">
          <button
            type="button"
            onClick={() => window.print()}
            className="erp-classic-btn focused w-[130px] h-[32px]"
          >
            طباعة التقرير
          </button>
          <button type="button" onClick={onClose} className="erp-classic-btn w-[130px] h-[32px]">
            إغلاق
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

interface SwitchUserDialogProps {
  open: boolean;
  zIndex: number;
  users: ErpState['users'];
  currentUser: string;
  onFocus: () => void;
  onClose: () => void;
  onSwitch: (username: string) => void;
}

export const SwitchUserDialog: React.FC<SwitchUserDialogProps> = ({
  open,
  zIndex,
  users,
  currentUser,
  onFocus,
  onClose,
  onSwitch,
}) => {
  const [selected, setSelected] = useState(currentUser);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const handleConfirm = () => {
    const found = users.find((u) => u.name === selected);
    if (!found) return;
    if (found.pass && found.pass !== pass && found.name !== currentUser) {
      setErr('كلمة المرور غير صحيحة.');
      return;
    }
    onSwitch(found.name);
    onClose();
  };

  return (
    <DraggableWindow
      open={open}
      title="تغيير المستخدم"
      width={440}
      height={270}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-4 gap-3">
        <div className="bg-white border border-[#999] p-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="w-[110px] font-bold">اسم المستخدم</label>
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setErr('');
              }}
              className="erp-field flex-1"
            >
              {users.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-[110px] font-bold">كلمة المرور</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setErr('');
              }}
              className="erp-field flex-1"
            />
          </div>
          {err && <div className="text-[12px] text-[#b00020] font-bold">{err}</div>}
        </div>
        <div className="flex justify-center gap-6 mt-auto">
          <button
            type="button"
            onClick={handleConfirm}
            className="erp-classic-btn focused w-[120px] h-[32px]"
          >
            دخول
          </button>
          <button type="button" onClick={onClose} className="erp-classic-btn w-[120px] h-[32px]">
            إلغاء
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
