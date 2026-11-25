import React, { useEffect, useMemo, useState } from 'react';
import { toAr } from '../data/erpDefaults';
import type { CurrencyItem, ErpState, MsgConfig } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface CurrenciesDialogProps {
  open: boolean;
  zIndex: number;
  currencies: CurrencyItem[];
  onFocus: () => void;
  onClose: () => void;
  onSave: (next: CurrencyItem[]) => void;
  onShowMsg?: (cfg: MsgConfig) => Promise<string>;
  onNotify?: (msg: string) => void;
}

export const CurrenciesDialog: React.FC<CurrenciesDialogProps> = ({
  open,
  zIndex,
  currencies,
  onFocus,
  onClose,
  onSave,
  onShowMsg,
  onNotify,
}) => {
  const [list, setList] = useState<CurrencyItem[]>(currencies);
  const [selectedCode, setSelectedCode] = useState<string>(currencies[0]?.code || '');

  // frmAddCurrancy1 / تعديل عملة modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingOriginalCode, setEditingOriginalCode] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftForeignName, setDraftForeignName] = useState('');
  const [draftSymbol, setDraftSymbol] = useState('');
  const [draftSubUnit, setDraftSubUnit] = useState('');
  const [draftRate, setDraftRate] = useState('1');
  const [draftDecimals, setDraftDecimals] = useState('');
  const [draftMinRate, setDraftMinRate] = useState('');
  const [draftMaxRate, setDraftMaxRate] = useState('');
  const [draftDualName, setDraftDualName] = useState('');
  const [draftPluralName, setDraftPluralName] = useState('');
  const [draftGender, setDraftGender] = useState<'ذكر' | 'انثى' | ''>('');

  useEffect(() => {
    if (open) {
      setList(currencies);
      setSelectedCode(currencies[0]?.code || '');
      setEditorOpen(false);
    }
  }, [open, currencies]);

  const openAddModal = () => {
    setEditingOriginalCode(null);
    setDraftName('');
    setDraftForeignName('');
    setDraftSymbol('');
    setDraftSubUnit('');
    setDraftRate('1');
    setDraftDecimals('');
    setDraftMinRate('');
    setDraftMaxRate('');
    setDraftDualName('');
    setDraftPluralName('');
    setDraftGender('');
    setEditorOpen(true);
  };

  const openEditModal = (target?: CurrencyItem) => {
    const item = target || list.find((c) => c.code === selectedCode);
    if (!item) {
      onNotify?.('يرجى تحديد عملة للتعديل');
      return;
    }
    setEditingOriginalCode(item.code);
    setDraftName(item.name);
    setDraftForeignName(item.foreignName || '');
    setDraftSymbol(item.symbol);
    setDraftSubUnit(item.subUnit || '');
    setDraftRate(String(item.rate));
    setDraftDecimals(item.decimals !== undefined ? String(item.decimals) : '2');
    setDraftMinRate(item.minRate || '');
    setDraftMaxRate(item.maxRate || '');
    setDraftDualName(item.dualName || '');
    setDraftPluralName(item.pluralName || '');
    setDraftGender(item.gender || '');
    setEditorOpen(true);
  };

  const handleSaveDraft = () => {
    if (!draftName.trim()) {
      onNotify?.('يرجى إدخال اسم العملة');
      return;
    }
    const existing = editingOriginalCode
      ? list.find((c) => c.code === editingOriginalCode)
      : undefined;

    const item: CurrencyItem = {
      code:
        existing?.code ||
        (draftForeignName.trim()
          ? draftForeignName.trim().slice(0, 3).toUpperCase()
          : `C${Date.now().toString().slice(-3)}`),
      name: draftName.trim(),
      foreignName: draftForeignName.trim(),
      symbol: draftSymbol.trim() || draftName.trim().slice(0, 2),
      subUnit: draftSubUnit.trim() || 'فلس',
      rate: Number(draftRate) || 1,
      decimals: draftDecimals.trim() !== '' ? Number(draftDecimals) || 0 : 2,
      minRate: draftMinRate.trim(),
      maxRate: draftMaxRate.trim(),
      dualName: draftDualName.trim(),
      pluralName: draftPluralName.trim(),
      gender: draftGender,
      isBase: existing?.isBase,
    };

    const next = editingOriginalCode
      ? list.map((c) => (c.code === editingOriginalCode ? item : c))
      : [...list, item];

    setList(next);
    setSelectedCode(item.code);
    onSave(next);
    setEditorOpen(false);
  };

  const handleDeleteSelected = async () => {
    const item = list.find((c) => c.code === selectedCode);
    if (!item) return;
    if (item.isBase) {
      if (onShowMsg) {
        await onShowMsg({
          title: 'تنبيه',
          icon: 'warn',
          text: 'لا يمكن حذف العملة الأساسية للنظام.',
        });
      }
      return;
    }
    if (onShowMsg) {
      const res = await onShowMsg({
        title: 'تحذير',
        icon: 'warn',
        text: `هل تريد حذف عملة «${item.name}»؟`,
        buttons: [
          { label: 'OK', value: 'yes', focus: true },
          { label: 'Cancel', value: 'no' },
        ],
      });
      if (res !== 'yes') return;
    }
    const next = list.filter((c) => c.code !== item.code);
    setList(next);
    setSelectedCode(next[0]?.code || '');
    onSave(next);
    onNotify?.(`تم حذف عملة «${item.name}»`);
  };

  return (
    <>
      <DraggableWindow
        open={open}
        title="قائمة العملات"
        width={840}
        height={460}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div className="flex-1 flex flex-col bg-[#b8cce4] p-1 gap-2 overflow-hidden select-none">
          <div className="bg-[#c9d6e6] border border-[#000] flex-1 overflow-auto erp-scrollbar">
            <table className="w-full border-collapse text-[13px] bg-white">
              <thead className="sticky top-0 bg-[#f4f6fa]">
                <tr className="border-b border-[#b8c0cc]">
                  <th className="py-1.5 px-3 border-l border-[#d8dfe8] text-right font-bold">الاسم</th>
                  <th className="py-1.5 px-3 border-l border-[#d8dfe8] text-left font-bold w-[95px]">
                    السعر
                  </th>
                  <th className="py-1.5 px-3 border-l border-[#d8dfe8] text-left font-bold w-[75px]">
                    الرمز
                  </th>
                  <th className="py-1.5 px-3 border-l border-[#d8dfe8] text-left font-bold w-[95px]">
                    اسم الاجزاء
                  </th>
                  <th className="py-1.5 px-3 border-l border-[#d8dfe8] text-left font-bold w-[80px] leading-tight">
                    خانات عشرية
                  </th>
                  <th className="py-1.5 px-3 border-l border-[#d8dfe8] text-left font-bold w-[105px]">
                    مثنى العملة
                  </th>
                  <th className="py-1.5 px-3 border-l border-[#d8dfe8] text-left font-bold w-[105px]">
                    جمع العملة
                  </th>
                  <th className="py-1.5 px-3 text-left font-bold w-[90px]">جنس العملة</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, idx) => {
                  const isSel = c.code === selectedCode;
                  const rowBg = isSel
                    ? 'bg-[#0078d7] text-white'
                    : idx % 2 === 1
                    ? 'bg-[#ffffc8] text-[#111] hover:bg-[#eef5fc]'
                    : 'bg-white text-[#111] hover:bg-[#eef5fc]';
                  return (
                    <tr
                      key={c.code}
                      onClick={() => setSelectedCode(c.code)}
                      onDoubleClick={() => openEditModal(c)}
                      className={`border-b border-[#e5e9f0] cursor-pointer font-bold ${rowBg}`}
                    >
                      <td className="py-1 px-3 border-l border-[#e5e9f0] text-right">{c.name}</td>
                      <td className="py-1 px-3 border-l border-[#e5e9f0] text-left">
                        {toAr(c.rate)}
                      </td>
                      <td className="py-1 px-3 border-l border-[#e5e9f0] text-left">{c.symbol}</td>
                      <td className="py-1 px-3 border-l border-[#e5e9f0] text-left">
                        {c.subUnit || 'فلس'}
                      </td>
                      <td className="py-1 px-3 border-l border-[#e5e9f0] text-left">
                        {toAr(c.decimals ?? 2)}
                      </td>
                      <td className="py-1 px-3 border-l border-[#e5e9f0] text-left">
                        {c.dualName || '—'}
                      </td>
                      <td className="py-1 px-3 border-l border-[#e5e9f0] text-left">
                        {c.pluralName || '—'}
                      </td>
                      <td className="py-1 px-3 text-left">{c.gender || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-2 py-2.5 bg-[#b8cce4]">
            <button
              type="button"
              onClick={openAddModal}
              className="erp-classic-btn w-[100px] h-[28px] text-[12px]"
            >
              اضافة
            </button>
            <button
              type="button"
              onClick={() => openEditModal()}
              className="erp-classic-btn focused w-[100px] h-[28px] text-[12px]"
            >
              تعديل
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteSelected()}
              className="erp-classic-btn w-[100px] h-[28px] text-[12px]"
            >
              حذف
            </button>
            <button
              type="button"
              onClick={onClose}
              className="erp-classic-btn w-[100px] h-[28px] text-[12px]"
            >
              خروج
            </button>
          </div>
        </div>
      </DraggableWindow>

      {/* frmAddCurrancy1 / تعديل عملة Sub-Window matching 004738, 004800, 004814 */}
      <DraggableWindow
        open={open && editorOpen}
        title={editingOriginalCode ? `تعديل عملة ${draftName}` : 'frmAddCurrancy1'}
        width={470}
        height={445}
        zIndex={zIndex + 25}
        onFocus={onFocus}
        onClose={() => setEditorOpen(false)}
      >
        <div className="flex-1 bg-[#dce4ee] p-2.5 flex flex-col justify-between gap-2 select-none text-[12px]">
          {/* Section 1: Name / Foreign Name / Symbol / SubUnit */}
          <div className="border border-[#c5cfd9] p-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="w-[90px] font-bold">الاسم</label>
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="erp-field flex-1 bg-white border-[#0078d7]"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[90px] font-bold">الاسم الاجنبي</label>
              <input
                value={draftForeignName}
                onChange={(e) => setDraftForeignName(e.target.value)}
                className="erp-field flex-1 bg-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[90px] font-bold">الرمز</label>
              <input
                value={draftSymbol}
                onChange={(e) => setDraftSymbol(e.target.value)}
                className="erp-field w-[105px] bg-white mr-auto"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[90px] font-bold">اسم الاجزاء</label>
              <input
                value={draftSubUnit}
                onChange={(e) => setDraftSubUnit(e.target.value)}
                className="erp-field flex-1 bg-white"
              />
            </div>
          </div>

          {/* Section 2: Rate / Decimals / Min / Max */}
          <div className="border border-[#c5cfd9] p-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="w-[82px] font-bold shrink-0">السعر</label>
              <input
                type="number"
                step="0.01"
                value={draftRate}
                disabled={Boolean(
                  editingOriginalCode &&
                    list.find((c) => c.code === editingOriginalCode)?.isBase
                )}
                onChange={(e) => setDraftRate(e.target.value)}
                className="erp-field w-[125px] bg-white text-left"
                dir="ltr"
              />
              <label className="font-bold mr-2 whitespace-nowrap">خانات عشرية</label>
              <input
                type="number"
                value={draftDecimals}
                onChange={(e) => setDraftDecimals(e.target.value)}
                className="erp-field w-[70px] bg-white text-center"
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-[82px] font-bold shrink-0">أدنى سعر</label>
              <input
                type="number"
                step="0.01"
                value={draftMinRate}
                onChange={(e) => setDraftMinRate(e.target.value)}
                className="erp-field w-[125px] bg-white text-left"
                dir="ltr"
              />
              <label className="font-bold mr-2 whitespace-nowrap">أعلى سعر</label>
              <input
                type="number"
                step="0.01"
                value={draftMaxRate}
                onChange={(e) => setDraftMaxRate(e.target.value)}
                className="erp-field flex-1 bg-white text-left"
                dir="ltr"
              />
            </div>
          </div>

          {/* Section 3: Dual / Plural / Gender */}
          <div className="border border-[#c5cfd9] p-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="w-[90px] font-bold">مثنى العملة</label>
              <input
                value={draftDualName}
                onChange={(e) => setDraftDualName(e.target.value)}
                className="erp-field flex-1 bg-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[90px] font-bold">جمع العملة</label>
              <input
                value={draftPluralName}
                onChange={(e) => setDraftPluralName(e.target.value)}
                className="erp-field flex-1 bg-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[90px] font-bold">جنس العملة</label>
              <select
                value={draftGender}
                onChange={(e) => setDraftGender(e.target.value as 'ذكر' | 'انثى' | '')}
                className="erp-field w-[105px] bg-white mr-auto"
              >
                <option value="" />
                <option value="ذكر">ذكر</option>
                <option value="انثى">انثى</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-center gap-12 pt-1">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="erp-classic-btn focused w-[100px] h-[28px] text-[12px]"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="erp-classic-btn w-[100px] h-[28px] text-[12px]"
            >
              خروج
            </button>
          </div>
        </div>
      </DraggableWindow>
    </>
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
  const activeJournal = state.journal.filter((j) => !j.deleted);
  const sumField = (key: 'rec' | 'pay' | 'dhm') =>
    activeJournal.reduce((acc, row) => acc + (parseFloat(row[key]) || 0), 0);

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
              {activeJournal.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#666]">
                    لا توجد حركات مسجلة في اليومية العامة حتى الآن.
                  </td>
                </tr>
              ) : (
                activeJournal.map((j) => (
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

interface MovementRow {
  uid: string;
  source: 'journal' | 'invoice';
  rawId: string;
  number: string;
  date: string;
  movementType: string;
  posted: boolean;
  postedAt: string;
}

interface PostDailyMovementDialogProps {
  open: boolean;
  zIndex: number;
  state: ErpState;
  onFocus: () => void;
  onClose: () => void;
  onSavePosted: (updates: {
    journalUpdates: Record<string, { posted: boolean; postedAt: string }>;
    invoiceUpdates: Record<string, { posted: boolean; postedAt: string }>;
  }) => void;
  onNotify: (msg: string) => void;
}

export const PostDailyMovementDialog: React.FC<PostDailyMovementDialogProps> = ({
  open,
  zIndex,
  state,
  onFocus,
  onClose,
  onSavePosted,
  onNotify,
}) => {
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }, []);

  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [docType, setDocType] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'المرحل' | 'الغير مرحل'>('الكل');
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const buildRows = (): MovementRow[] => {
    const jRows: MovementRow[] = state.journal
      .filter((j) => !j.deleted)
      .map((j, idx) => ({
      uid: `j-${j.id}`,
      source: 'journal',
      rawId: j.id,
      number: j.doc || String(idx + 1),
      date: (j.at || todayStr).slice(0, 10).replace(/-/g, '/'),
      movementType: j.rec ? 'سند قبض / قيد يومية' : j.pay ? 'سند صرف / قيد يومية' : 'قيد يومية',
      posted: Boolean(j.posted),
      postedAt: j.postedAt || '',
    }));

    const iRows: MovementRow[] = state.invoices.map((inv) => ({
      uid: `i-${inv.id}`,
      source: 'invoice',
      rawId: inv.id,
      number: inv.number,
      date: (inv.date || todayStr).slice(0, 10).replace(/-/g, '/'),
      movementType: inv.kind,
      posted: Boolean(inv.posted),
      postedAt: inv.postedAt || '',
    }));

    return [...jRows, ...iRows].filter((r) => {
      if (docType !== 'الكل' && !r.movementType.includes(docType)) return false;
      if (statusFilter === 'المرحل' && !r.posted) return false;
      if (statusFilter === 'الغير مرحل' && r.posted) return false;
      return true;
    });
  };

  useEffect(() => {
    if (open) {
      setDateFrom(todayStr);
      setDateTo(todayStr);
      setDocType('الكل');
      setStatusFilter('الكل');
      setRows([]);
      setHasLoaded(false);
    }
  }, [open, todayStr]);

  const handleDisplay = () => {
    setRows(buildRows());
    setHasLoaded(true);
  };

  const allChecked = rows.length > 0 && rows.every((r) => r.posted);

  const handleToggleAll = (checked: boolean) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        posted: checked,
        postedAt: checked ? r.postedAt || todayStr : '',
      }))
    );
  };

  const handleSave = () => {
    const journalUpdates: Record<string, { posted: boolean; postedAt: string }> = {};
    const invoiceUpdates: Record<string, { posted: boolean; postedAt: string }> = {};
    rows.forEach((r) => {
      if (r.source === 'journal') {
        journalUpdates[r.rawId] = { posted: r.posted, postedAt: r.postedAt };
      } else {
        invoiceUpdates[r.rawId] = { posted: r.posted, postedAt: r.postedAt };
      }
    });
    onSavePosted({ journalUpdates, invoiceUpdates });
    onNotify('تم حفظ حالة ترحيل الحركة اليومية');
    onClose();
  };

  return (
    <DraggableWindow
      open={open}
      title="ترحيل الحركة اليومية"
      width={690}
      height={495}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 bg-[#dce4ee] p-3 flex flex-col gap-2.5 overflow-hidden select-none text-[13px]">
        {/* Row 1: Date Range */}
        <div className="flex flex-wrap items-center gap-6 px-2 pt-1">
          <div className="flex items-center gap-3">
            <label className="font-bold">من تاريخ</label>
            <input
              type="date"
              value={dateFrom.replace(/\//g, '-')}
              onChange={(e) => setDateFrom(e.target.value.replace(/-/g, '/'))}
              className="erp-field w-[155px] bg-white text-center font-bold"
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="font-bold">الى تاريخ</label>
            <input
              type="date"
              value={dateTo.replace(/\//g, '-')}
              onChange={(e) => setDateTo(e.target.value.replace(/-/g, '/'))}
              className="erp-field w-[155px] bg-white text-center font-bold"
              dir="ltr"
            />
          </div>
        </div>

        {/* Row 2: Document Type + Status + Display Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            <label className="font-bold whitespace-nowrap">نوع المستند</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="erp-field w-[180px] bg-white font-bold"
            >
              <option value="الكل">الكل</option>
              <option value="قيد يومية">قيد يومية</option>
              <option value="فاتورة مبيعات">فاتورة مبيعات</option>
              <option value="فاتورة مشتريات">فاتورة مشتريات</option>
              <option value="سند قبض">سند قبض</option>
              <option value="سند صرف">سند صرف</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'الكل' | 'المرحل' | 'الغير مرحل')
            }
            className="erp-field w-[145px] bg-white font-bold"
          >
            <option value="الكل">الكل</option>
            <option value="المرحل">المرحل</option>
            <option value="الغير مرحل">الغير مرحل</option>
          </select>

          <button
            type="button"
            onClick={handleDisplay}
            className="erp-classic-btn w-[62px] h-[26px] text-[12px]"
          >
            عرض
          </button>
        </div>

        {/* Middle DataGridView matching Screenshot_2026-11-24_004638_6886cdee.png */}
        <div className="flex-1 bg-[#9e9e9e] border border-[#333] overflow-auto erp-scrollbar">
          <table className="w-full border-collapse text-[12px] bg-white">
            <thead className="sticky top-0 bg-[#f0f0f0]">
              <tr className="border-b border-[#bbb]">
                <th className="py-1 px-2 border-l border-[#ccc] text-right font-bold w-[90px]">
                  الرقم
                </th>
                <th className="py-1 px-2 border-l border-[#ccc] text-right font-bold w-[110px]">
                  التاريخ
                </th>
                <th className="py-1 px-2 border-l border-[#ccc] text-right font-bold">الحركة</th>
                <th className="py-1 px-2 border-l border-[#ccc] text-center font-bold w-[85px]">
                  ترحيل
                </th>
                <th className="py-1 px-2 text-right font-bold w-[125px]">تاريخ الترحيل</th>
              </tr>
            </thead>
            <tbody>
              {hasLoaded && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#555] bg-white">
                    لا توجد حركات مطابقة لشروط العرض.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.uid} className="border-b border-[#e5e5e5] hover:bg-[#eaf3fc]">
                  <td className="py-1 px-2 border-l border-[#ddd] font-bold">{r.number}</td>
                  <td className="py-1 px-2 border-l border-[#ddd]">{r.date}</td>
                  <td className="py-1 px-2 border-l border-[#ddd]">{r.movementType}</td>
                  <td className="py-1 px-2 border-l border-[#ddd] text-center">
                    <input
                      type="checkbox"
                      checked={r.posted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRows((prev) =>
                          prev.map((row) =>
                            row.uid === r.uid
                              ? {
                                  ...row,
                                  posted: checked,
                                  postedAt: checked ? row.postedAt || todayStr : '',
                                }
                              : row
                          )
                        );
                      }}
                      className="w-4 h-4 accent-[#0078d7]"
                    />
                  </td>
                  <td className="py-1 px-2">{r.postedAt || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Select All Row */}
        <div className="flex justify-start px-2">
          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <span>تحديد الكل</span>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => handleToggleAll(e.target.checked)}
              className="w-4 h-4 accent-[#0078d7]"
            />
          </label>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-around pt-1 pb-1">
          <button
            type="button"
            onClick={handleSave}
            className="erp-classic-btn focused w-[115px] h-[30px] text-[13px]"
          >
            حفظ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[115px] h-[30px] text-[13px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
