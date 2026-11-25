import React, { useEffect, useMemo, useState } from 'react';
import { toAr } from '../data/erpDefaults';
import type {
  CostCenterRecord,
  CustomAccountRecord,
  ImportedMaterialItem,
  JournalEntry,
  MaterialDisposalRecord,
  MaterialExpenseRecord,
  MaterialGroupRecord,
  MaterialHandoverRecord,
  MsgConfig,
  WarehouseRecord,
} from '../types/erp';
import { buildAccountTree, flattenAccountTree } from './AccountsAndStatementDialogs';
import { DraggableWindow } from './DraggableWindow';

export type AccountsOpsMode =
  | 'add'
  | 'browse'
  | 'addGroup'
  | 'editGroup'
  | 'move'
  | 'guide'
  | 'aggregate'
  | 'costCenters'
  | 'partyImages';

const ACCOUNTS_MODE_TITLES: Record<AccountsOpsMode, string> = {
  add: 'اضافة حساب جديد',
  browse: 'استعراض وتعديل الحسابات',
  addGroup: 'اضافة مجموعة حسابات فرعيه',
  editGroup: 'تعديل خصائص مجموعة حسابات فرعية',
  move: 'نقل حساب',
  guide: 'دليل الحسابات',
  aggregate: 'الحسابات التجميعيه',
  costCenters: 'مراكز الكلفة',
  partyImages: 'استعراض صور العملاء والموردين',
};

interface AccountsOpsDialogProps {
  open: boolean;
  mode: AccountsOpsMode;
  zIndex: number;
  customAccounts: CustomAccountRecord[];
  costCenters: CostCenterRecord[];
  journal: JournalEntry[];
  onFocus: () => void;
  onClose: () => void;
  onSaveCustomAccounts: (next: CustomAccountRecord[]) => void;
  onSaveCostCenters: (next: CostCenterRecord[]) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const AccountsOpsDialog: React.FC<AccountsOpsDialogProps> = ({
  open,
  mode,
  zIndex,
  customAccounts,
  costCenters,
  journal,
  onFocus,
  onClose,
  onSaveCustomAccounts,
  onSaveCostCenters,
  onShowMsg,
  onNotify,
}) => {
  const [activeMode, setActiveMode] = useState<AccountsOpsMode>(mode);
  const [search, setSearch] = useState('');

  // Account / Group editor state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentCode, setParentCode] = useState('122');
  const [kind, setKind] = useState<'folder' | 'leaf'>('leaf');
  const [isAggregate, setIsAggregate] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [imageData, setImageData] = useState<string>('');
  const [selectedCode, setSelectedCode] = useState<string>('');

  // Move state
  const [moveTargetCode, setMoveTargetCode] = useState('');
  const [moveNewParent, setMoveNewParent] = useState('122');

  // Cost center state
  const [ccEditId, setCcEditId] = useState<string | null>(null);
  const [ccCode, setCcCode] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccParent, setCcParent] = useState('');
  const [ccNotes, setCcNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setActiveMode(mode);
    setSearch('');
    setSelectedCode('');
    if (mode === 'add') {
      setKind('leaf');
      setIsAggregate(false);
      setCode('');
      setName('');
      setParentCode('122');
      setPhone('');
      setAddress('');
      setNotes('');
      setImageData('');
    } else if (mode === 'addGroup') {
      setKind('folder');
      setIsAggregate(true);
      setCode('');
      setName('');
      setParentCode('12');
      setPhone('');
      setAddress('');
      setNotes('');
      setImageData('');
    } else if (mode === 'editGroup') {
      setKind('folder');
    }
  }, [open, mode]);

  const treeNodes = useMemo(() => buildAccountTree(customAccounts), [customAccounts]);
  const flatAccounts = useMemo(() => flattenAccountTree(treeNodes), [treeNodes]);
  const folderAccounts = useMemo(
    () => flatAccounts.filter((a) => a.kind === 'folder'),
    [flatAccounts]
  );

  const customMap = useMemo(() => {
    const map = new Map<string, CustomAccountRecord>();
    for (const c of customAccounts) map.set(c.code, c);
    return map;
  }, [customAccounts]);

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flatAccounts.filter((a) => {
      if (activeMode === 'editGroup' && a.kind !== 'folder') return false;
      if (activeMode === 'aggregate') {
        const cust = customMap.get(a.code);
        if (a.kind !== 'folder' && !cust?.isAggregate) return false;
      }
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
    });
  }, [flatAccounts, search, activeMode, customMap]);

  const selectAccountForEdit = (itemCode: string) => {
    const flat = flatAccounts.find((a) => a.code === itemCode);
    const custom = customMap.get(itemCode);
    if (!flat) return;
    setSelectedCode(itemCode);
    setCode(flat.code);
    setName(custom?.name || flat.name);
    setParentCode(custom?.parentCode ?? flat.parentCode);
    setKind(custom?.kind || flat.kind);
    setIsAggregate(Boolean(custom?.isAggregate || flat.kind === 'folder'));
    setPhone(custom?.phone || '');
    setAddress(custom?.address || '');
    setNotes(custom?.notes || '');
    setImageData(custom?.imageData || '');
  };

  const handleSaveAccount = () => {
    if (!code.trim() || !name.trim()) {
      onNotify('يرجى إدخال رقم الحساب واسم الحساب');
      return;
    }
    const rec: CustomAccountRecord = {
      code: code.trim(),
      name: name.trim(),
      parentCode: parentCode.trim(),
      kind: activeMode === 'addGroup' || activeMode === 'editGroup' ? 'folder' : kind,
      isAggregate,
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      imageData,
    };
    const exists = customAccounts.some((c) => c.code === rec.code);
    const next = exists
      ? customAccounts.map((c) => (c.code === rec.code ? rec : c))
      : [...customAccounts, rec];
    onSaveCustomAccounts(next);
    onNotify(`تم حفظ الحساب (${rec.code} - ${rec.name})`);
    if (activeMode === 'add' || activeMode === 'addGroup') {
      setCode('');
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      setImageData('');
    }
  };

  const handleDeleteCustomAccount = async (targetCode: string) => {
    const isCustom = customAccounts.some((c) => c.code === targetCode);
    if (!isCustom) {
      onNotify('الحسابات الافتراضية للنظام محمية من الحذف');
      return;
    }
    const res = await onShowMsg({
      title: 'حذف حساب',
      icon: 'question',
      text: `هل تريد حذف الحساب رقم (${targetCode})؟`,
      buttons: [
        { label: 'نعم', value: 'yes' },
        { label: 'لا', value: 'no', focus: true },
      ],
    });
    if (res === 'yes') {
      onSaveCustomAccounts(customAccounts.filter((c) => c.code !== targetCode));
      setSelectedCode('');
      onNotify('تم حذف الحساب بنجاح');
    }
  };

  const handleMoveAccount = () => {
    if (!moveTargetCode || !moveNewParent) {
      onNotify('اختر الحساب والمجموعة الهدف أولاً');
      return;
    }
    if (moveTargetCode === moveNewParent) {
      onNotify('لا يمكن نقل الحساب إلى نفسه');
      return;
    }
    const flat = flatAccounts.find((a) => a.code === moveTargetCode);
    if (!flat) return;
    const existing = customMap.get(moveTargetCode);
    const updated: CustomAccountRecord = existing
      ? { ...existing, parentCode: moveNewParent }
      : {
          code: flat.code,
          name: flat.name,
          parentCode: moveNewParent,
          kind: flat.kind,
        };
    const next = existing
      ? customAccounts.map((c) => (c.code === moveTargetCode ? updated : c))
      : [...customAccounts, updated];
    onSaveCustomAccounts(next);
    onNotify(`تم نقل الحساب «${flat.name}» إلى المجموعة ${moveNewParent}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetCode?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (targetCode) {
        const flat = flatAccounts.find((a) => a.code === targetCode);
        const existing = customMap.get(targetCode);
        if (!flat && !existing) return;
        const rec: CustomAccountRecord = existing
          ? { ...existing, imageData: dataUrl }
          : {
              code: flat!.code,
              name: flat!.name,
              parentCode: flat!.parentCode,
              kind: flat!.kind,
              imageData: dataUrl,
            };
        const next = existing
          ? customAccounts.map((c) => (c.code === targetCode ? rec : c))
          : [...customAccounts, rec];
        onSaveCustomAccounts(next);
        onNotify(`تم تحديث صورة الحساب (${rec.name})`);
      } else {
        setImageData(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const getAccountActivityTotal = (accName: string) => {
    return journal
      .filter((j) => !j.deleted && (j.from === accName || j.to === accName))
      .reduce(
        (sum, j) => sum + (parseFloat(j.rec) || 0) + (parseFloat(j.pay) || 0) + (parseFloat(j.dhm) || 0),
        0
      );
  };

  const exportAccountsGuideCsv = () => {
    const rows = [
      ['رقم الحساب', 'اسم الحساب', 'الحساب الأب', 'النوع'],
      ...flatAccounts.map((a) => [a.code, a.name, a.parentCode || '-', a.kind === 'folder' ? 'رئيسي' : 'فرعي']),
    ];
    const csv =
      '\uFEFF' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts-guide.csv';
    a.click();
    URL.revokeObjectURL(url);
    onNotify('تم تصدير دليل الحسابات إلى CSV');
  };

  const partyAccounts = useMemo(() => {
    return flatAccounts.filter((a) => {
      const custom = customMap.get(a.code);
      return (
        a.code.startsWith('122') ||
        a.code.startsWith('221') ||
        a.parentCode === '122' ||
        a.parentCode === '221' ||
        Boolean(custom?.imageData)
      );
    });
  }, [flatAccounts, customMap]);

  return (
    <DraggableWindow
      open={open}
      title={ACCOUNTS_MODE_TITLES[activeMode]}
      width={980}
      height={640}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#dce4ee] p-3 gap-2.5 overflow-hidden text-[13px]">
        {/* Top quick-switch strip */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#b9c4d4]">
          {(
            [
              ['add', 'اضافة حساب جديد'],
              ['browse', 'استعراض وتعديل'],
              ['addGroup', 'مجموعة فرعية'],
              ['move', 'نقل حساب'],
              ['guide', 'دليل الحسابات'],
              ['aggregate', 'الحسابات التجميعيه'],
              ['costCenters', 'مراكز الكلفة'],
              ['partyImages', 'صور العملاء والموردين'],
            ] as [AccountsOpsMode, string][]
          ).map(([m, lbl]) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMode(m)}
              className={`erp-classic-btn px-2.5 h-[26px] text-[12px] ${
                activeMode === m ? 'focused font-bold' : ''
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {(activeMode === 'add' || activeMode === 'addGroup') && (
          <div className="flex-1 bg-[#f4f6fa] border border-[#b9c4d4] p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="font-bold w-[130px] shrink-0">رقم الحساب</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: 1220002"
                  className="erp-field flex-1"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold w-[130px] shrink-0">اسم الحساب</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={activeMode === 'addGroup' ? 'اسم المجموعة الفرعية' : 'اسم الحساب'}
                  className="erp-field flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold w-[130px] shrink-0">الحساب الأب</label>
                <select
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  className="erp-field flex-1 bg-white"
                >
                  <option value="">جذر الشجرة</option>
                  {folderAccounts.map((f) => (
                    <option key={f.code} value={f.code}>
                      {toAr(f.code)} - {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="font-bold w-[130px] shrink-0">طبيعة الحساب</label>
                <select
                  value={activeMode === 'addGroup' ? 'folder' : kind}
                  disabled={activeMode === 'addGroup'}
                  onChange={(e) => setKind(e.target.value as 'folder' | 'leaf')}
                  className="erp-field flex-1 bg-white"
                >
                  <option value="leaf">حساب فرعي (حركة)</option>
                  <option value="folder">مجموعة / حساب رئيسي</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold w-[130px] shrink-0">الهاتف</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="erp-field flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold w-[130px] shrink-0">العنوان</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="erp-field flex-1" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAggregate}
                  onChange={(e) => setIsAggregate(e.target.checked)}
                  className="accent-[#0078d7]"
                />
                <span>تضمين في الحسابات التجميعية</span>
              </label>
              <label className="erp-classic-btn px-3 py-1 text-[12px] cursor-pointer">
                إرفاق صورة الحساب / العميل
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} className="hidden" />
              </label>
              {imageData && <img src={imageData} alt="preview" className="w-10 h-10 object-cover border" />}
            </div>

            <div className="flex items-start gap-2">
              <label className="font-bold w-[130px] shrink-0 pt-1">ملاحظات</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="erp-field flex-1 h-auto py-1"
              />
            </div>

            <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-[#d0d7e2]">
              <button type="button" onClick={handleSaveAccount} className="erp-classic-btn focused px-6 h-[30px]">
                حفظ في شجرة الحسابات
              </button>
              <button type="button" onClick={onClose} className="erp-classic-btn px-5 h-[30px]">
                خروج
              </button>
            </div>
          </div>
        )}

        {(activeMode === 'browse' ||
          activeMode === 'editGroup' ||
          activeMode === 'guide' ||
          activeMode === 'aggregate') && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center gap-2 bg-[#eef3f9] border border-[#b9c4d4] p-2">
              <label className="font-bold shrink-0">بحث بالرقم أو الاسم</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اكتب جزء من اسم أو رقم الحساب..."
                className="erp-field flex-1"
              />
              {activeMode === 'guide' && (
                <button type="button" onClick={exportAccountsGuideCsv} className="erp-classic-btn px-3 h-[26px]">
                  تصدير اكسل CSV
                </button>
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 overflow-hidden">
              <div className="bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#cfdce8] sticky top-0">
                      <th className="border border-[#9aa7b8] p-1.5">رقم الحساب</th>
                      <th className="border border-[#9aa7b8] p-1.5">اسم الحساب</th>
                      <th className="border border-[#9aa7b8] p-1.5">النوع</th>
                      <th className="border border-[#9aa7b8] p-1.5">الحساب الأب</th>
                      {activeMode === 'aggregate' && (
                        <th className="border border-[#9aa7b8] p-1.5">إجمالي الحركات</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((acc) => {
                      const isSel = selectedCode === acc.code;
                      return (
                        <tr
                          key={acc.code}
                          onClick={() => selectAccountForEdit(acc.code)}
                          className={`cursor-pointer ${
                            isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                          }`}
                        >
                          <td className="border border-[#d5dce6] p-1.5 text-center" dir="ltr">
                            {toAr(acc.code)}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5 font-semibold">
                            {'— '.repeat(acc.level)}
                            {acc.name}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5 text-center">
                            {acc.kind === 'folder' ? 'مجموعة رئيسية' : 'حساب فرعي'}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5 text-center">
                            {acc.parentCode ? toAr(acc.parentCode) : 'جذر'}
                          </td>
                          {activeMode === 'aggregate' && (
                            <td className="border border-[#d5dce6] p-1.5 text-center font-bold">
                              {getAccountActivityTotal(acc.name).toFixed(2)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 flex flex-col gap-2 overflow-y-auto">
                <div className="font-bold text-[13px] border-b border-[#cbd4e0] pb-1">
                  {selectedCode ? `تعديل خصائص: ${toAr(selectedCode)}` : 'اختر حساباً للتعديل'}
                </div>
                <label className="font-bold text-[12px]">اسم الحساب</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="erp-field w-full" />
                <label className="font-bold text-[12px]">المجموعة الأب</label>
                <select
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  className="erp-field w-full bg-white"
                >
                  <option value="">جذر الشجرة</option>
                  {folderAccounts.map((f) => (
                    <option key={f.code} value={f.code}>
                      {toAr(f.code)} - {f.name}
                    </option>
                  ))}
                </select>
                <label className="font-bold text-[12px]">الهاتف</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="erp-field w-full" />
                <label className="font-bold text-[12px]">ملاحظات</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="erp-field w-full h-auto py-1"
                />
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAggregate}
                    onChange={(e) => setIsAggregate(e.target.checked)}
                    className="accent-[#0078d7]"
                  />
                  <span>حساب تجميعي</span>
                </label>
                <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-[#d0d7e2]">
                  <button
                    type="button"
                    disabled={!selectedCode}
                    onClick={handleSaveAccount}
                    className="erp-classic-btn focused flex-1 h-[28px] disabled:opacity-50"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCode}
                    onClick={() => handleDeleteCustomAccount(selectedCode)}
                    className="erp-classic-btn px-3 h-[28px] disabled:opacity-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'move' && (
          <div className="flex-1 bg-[#f4f6fa] border border-[#b9c4d4] p-5 flex flex-col gap-4">
            <div className="font-bold text-[14px]">نقل حساب أو مجموعة فرعية داخل شجرة الحسابات</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold">الحساب المراد نقله</label>
                <select
                  value={moveTargetCode}
                  onChange={(e) => setMoveTargetCode(e.target.value)}
                  className="erp-field bg-white"
                >
                  <option value="">-- اختر الحساب --</option>
                  {flatAccounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {toAr(a.code)} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold">المجموعة الجديدة (الأب)</label>
                <select
                  value={moveNewParent}
                  onChange={(e) => setMoveNewParent(e.target.value)}
                  className="erp-field bg-white"
                >
                  {folderAccounts.map((f) => (
                    <option key={f.code} value={f.code}>
                      {toAr(f.code)} - {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-auto flex justify-end gap-2">
              <button type="button" onClick={handleMoveAccount} className="erp-classic-btn focused px-6 h-[30px]">
                تنفيذ النقل
              </button>
              <button type="button" onClick={onClose} className="erp-classic-btn px-5 h-[30px]">
                خروج
              </button>
            </div>
          </div>
        )}

        {activeMode === 'costCenters' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 overflow-hidden">
            <div className="bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرمز</th>
                    <th className="border border-[#9aa7b8] p-1.5">اسم مركز الكلفة</th>
                    <th className="border border-[#9aa7b8] p-1.5">المركز الأب</th>
                    <th className="border border-[#9aa7b8] p-1.5">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {costCenters.map((cc) => (
                    <tr
                      key={cc.id}
                      onClick={() => {
                        setCcEditId(cc.id);
                        setCcCode(cc.code);
                        setCcName(cc.name);
                        setCcParent(cc.parentCode);
                        setCcNotes(cc.notes);
                      }}
                      className={`cursor-pointer ${
                        ccEditId === cc.id ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                      }`}
                    >
                      <td className="border border-[#d5dce6] p-1.5 text-center">{cc.code}</td>
                      <td className="border border-[#d5dce6] p-1.5 font-bold">{cc.name}</td>
                      <td className="border border-[#d5dce6] p-1.5 text-center">{cc.parentCode || '-'}</td>
                      <td className="border border-[#d5dce6] p-1.5">{cc.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 flex flex-col gap-2">
              <div className="font-bold border-b border-[#cbd4e0] pb-1">بيانات مركز الكلفة</div>
              <label className="font-bold text-[12px]">رمز المركز</label>
              <input value={ccCode} onChange={(e) => setCcCode(e.target.value)} className="erp-field" />
              <label className="font-bold text-[12px]">اسم مركز الكلفة</label>
              <input value={ccName} onChange={(e) => setCcName(e.target.value)} className="erp-field" />
              <label className="font-bold text-[12px]">المركز الأب</label>
              <input value={ccParent} onChange={(e) => setCcParent(e.target.value)} className="erp-field" />
              <label className="font-bold text-[12px]">ملاحظات</label>
              <textarea
                value={ccNotes}
                onChange={(e) => setCcNotes(e.target.value)}
                rows={2}
                className="erp-field h-auto py-1"
              />
              <div className="mt-auto flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCcEditId(null);
                    setCcCode(`CC-0${costCenters.length + 1}`);
                    setCcName('');
                    setCcParent('');
                    setCcNotes('');
                  }}
                  className="erp-classic-btn px-3 h-[28px]"
                >
                  جديد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!ccCode.trim() || !ccName.trim()) {
                      onNotify('أدخل الرمز والاسم');
                      return;
                    }
                    const rec: CostCenterRecord = {
                      id: ccEditId || `cc-${Date.now()}`,
                      code: ccCode.trim(),
                      name: ccName.trim(),
                      parentCode: ccParent.trim(),
                      notes: ccNotes.trim(),
                    };
                    const next = ccEditId
                      ? costCenters.map((c) => (c.id === ccEditId ? rec : c))
                      : [...costCenters, rec];
                    onSaveCostCenters(next);
                    setCcEditId(rec.id);
                    onNotify('تم حفظ مركز الكلفة');
                  }}
                  className="erp-classic-btn focused flex-1 h-[28px]"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  disabled={!ccEditId}
                  onClick={() => {
                    if (!ccEditId) return;
                    onSaveCostCenters(costCenters.filter((c) => c.id !== ccEditId));
                    setCcEditId(null);
                    setCcCode('');
                    setCcName('');
                    onNotify('تم حذف مركز الكلفة');
                  }}
                  className="erp-classic-btn px-3 h-[28px] disabled:opacity-50"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'partyImages' && (
          <div className="flex-1 bg-white border border-[#b9c4d4] p-3 overflow-y-auto erp-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {partyAccounts.map((p) => {
                const custom = customMap.get(p.code);
                return (
                  <div
                    key={p.code}
                    className="border border-[#c5cedb] bg-[#f7f9fc] p-2.5 flex flex-col items-center gap-2"
                  >
                    <div className="w-full h-[120px] bg-white border border-[#d6dde8] flex items-center justify-center overflow-hidden">
                      {custom?.imageData ? (
                        <img src={custom.imageData} alt={p.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[36px] text-[#7c94b2]">🪪</span>
                      )}
                    </div>
                    <div className="font-bold text-center">
                      {toAr(p.code)} - {p.name}
                    </div>
                    <label className="erp-classic-btn px-3 py-1 text-[12px] cursor-pointer">
                      تعيين / تحديث صورة
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, p.code)}
                        className="hidden"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};

export type MaterialsOpsMode =
  | 'add'
  | 'browse'
  | 'addGroup'
  | 'editSpecs'
  | 'editProps'
  | 'editPrices'
  | 'guide'
  | 'mainMaterials'
  | 'totalMaterials'
  | 'warehouses'
  | 'expenses'
  | 'tree'
  | 'labels'
  | 'handoverCycle'
  | 'handoverReport'
  | 'dispose';

const MATERIALS_MODE_TITLES: Record<MaterialsOpsMode, string> = {
  add: 'اضافة مادة جديدة',
  browse: 'استعراض وتعديل المواد',
  addGroup: 'اضافة مجموعة مواد',
  editSpecs: 'تعديل المواصفات الأساسية لمجموعة مواد',
  editProps: 'تعديل خصائص مشتركة لمجموعة مواد',
  editPrices: 'تعديل تسعيرات المواد',
  guide: 'دليل المواد',
  mainMaterials: 'المواد الرئيسية',
  totalMaterials: 'المواد الإجمالية',
  warehouses: 'المستودعات',
  expenses: 'المصاريف',
  tree: 'شجرة المواد',
  labels: 'طباعة لصقات المواد',
  handoverCycle: 'دورة استلام وتسليم',
  handoverReport: 'تقرير الاستلام والتسليم',
  dispose: 'اتلاف مواد',
};

interface MaterialsOpsDialogProps {
  open: boolean;
  mode: MaterialsOpsMode;
  zIndex: number;
  currentUser: string;
  materials: ImportedMaterialItem[];
  groups: MaterialGroupRecord[];
  warehouses: WarehouseRecord[];
  expenses: MaterialExpenseRecord[];
  handovers: MaterialHandoverRecord[];
  disposals: MaterialDisposalRecord[];
  onFocus: () => void;
  onClose: () => void;
  onSaveMaterials: (next: ImportedMaterialItem[]) => void;
  onSaveGroups: (next: MaterialGroupRecord[]) => void;
  onSaveWarehouses: (next: WarehouseRecord[]) => void;
  onSaveExpenses: (next: MaterialExpenseRecord[]) => void;
  onSaveHandovers: (next: MaterialHandoverRecord[]) => void;
  onSaveDisposals: (next: MaterialDisposalRecord[]) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const MaterialsOpsDialog: React.FC<MaterialsOpsDialogProps> = ({
  open,
  mode,
  zIndex,
  currentUser,
  materials,
  groups,
  warehouses,
  expenses,
  handovers,
  disposals,
  onFocus,
  onClose,
  onSaveMaterials,
  onSaveGroups,
  onSaveWarehouses,
  onSaveExpenses,
  onSaveHandovers,
  onSaveDisposals,
  onShowMsg,
  onNotify,
}) => {
  const [activeMode, setActiveMode] = useState<MaterialsOpsMode>(mode);
  const [search, setSearch] = useState('');

  // Material editor
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [matForm, setMatForm] = useState<ImportedMaterialItem>({
    code: '',
    name: '',
    foreignName: '',
    barcode: '',
    qty: '0',
    purchasePrice: '0',
    mainUnit: 'حبة',
    maxLimit: '100',
    minLimit: '1',
    warehouse: warehouses[0]?.name || 'مستودع1',
    unit1: 'حبة',
    unit2: 'كرتون',
    expiryDate: '',
    groupCode: groups[0]?.code || '01',
  });

  // Group editor
  const [grpEditId, setGrpEditId] = useState<string | null>(null);
  const [grpForm, setGrpForm] = useState<Omit<MaterialGroupRecord, 'id'>>({
    code: '',
    name: '',
    parentCode: '',
    defaultUnit: 'حبة',
    taxRate: 0,
    requireExpiry: false,
    notes: '',
  });

  // Batch spec / pricing
  const [batchGroupCode, setBatchGroupCode] = useState(groups[0]?.code || '01');
  const [batchUnit, setBatchUnit] = useState('حبة');
  const [batchWarehouse, setBatchWarehouse] = useState(warehouses[0]?.name || 'مستودع1');
  const [batchTax, setBatchTax] = useState(0);
  const [batchExpiry, setBatchExpiry] = useState(false);
  const [pricePct, setPricePct] = useState('0');

  // Warehouse editor
  const [whEditId, setWhEditId] = useState<string | null>(null);
  const [whForm, setWhForm] = useState({ code: '', name: '', location: '', keeper: '', notes: '' });

  // Expense editor
  const [expEditId, setExpEditId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState({
    code: '',
    name: '',
    accountName: 'مواصلات وتنقلات',
    defaultAmount: '0',
    notes: '',
  });

  // Labels print
  const [labelCode, setLabelCode] = useState('');
  const [labelCount, setLabelCount] = useState(3);

  // Handover
  const [hoForm, setHoForm] = useState({
    number: '',
    date: new Date().toISOString().slice(0, 10),
    fromEmployee: currentUser,
    toEmployee: '',
    warehouse: warehouses[0]?.name || 'مستودع1',
    itemName: '',
    qty: '1',
    status: 'مستلم' as MaterialHandoverRecord['status'],
    notes: '',
  });

  // Disposal
  const [dispForm, setDispForm] = useState({
    number: '',
    date: new Date().toISOString().slice(0, 10),
    warehouse: warehouses[0]?.name || 'مستودع1',
    itemCode: '',
    itemName: '',
    qty: '1',
    cost: '0',
    reason: 'تلف / انتهاء صلاحية',
  });

  useEffect(() => {
    if (!open) return;
    setActiveMode(mode);
    setSearch('');
    if (mode === 'add') {
      setEditingCode(null);
      setMatForm({
        code: String(100 + materials.length + 1),
        name: '',
        foreignName: '',
        barcode: String(628000000 + materials.length + 1),
        qty: '0',
        purchasePrice: '0',
        mainUnit: 'حبة',
        maxLimit: '100',
        minLimit: '1',
        warehouse: warehouses[0]?.name || 'مستودع1',
        unit1: 'حبة',
        unit2: 'كرتون',
        expiryDate: '',
        groupCode: groups[0]?.code || '01',
      });
    }
    if (materials[0] && !labelCode) {
      setLabelCode(materials[0].code);
    }
  }, [open, mode, materials, warehouses, groups, labelCode]);

  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.barcode.toLowerCase().includes(q)
    );
  }, [materials, search]);

  const saveMaterial = () => {
    if (!matForm.code.trim() || !matForm.name.trim()) {
      onNotify('يرجى إدخال رمز المادة واسمها');
      return;
    }
    const next = editingCode
      ? materials.map((m) => (m.code === editingCode ? matForm : m))
      : [...materials, matForm];
    onSaveMaterials(next);
    onNotify(`تم حفظ المادة «${matForm.name}»`);
    if (!editingCode) {
      setMatForm((prev) => ({
        ...prev,
        code: String(100 + next.length + 1),
        name: '',
        foreignName: '',
        barcode: String(628000000 + next.length + 1),
      }));
    }
  };

  const applyPricePercentage = () => {
    const pct = parseFloat(pricePct);
    if (Number.isNaN(pct) || pct === 0) {
      onNotify('أدخل نسبة تعديل صحيحة');
      return;
    }
    const next = materials.map((m) => {
      const p = parseFloat(m.purchasePrice || '0') || 0;
      const updated = Math.max(0, p * (1 + pct / 100));
      return { ...m, purchasePrice: updated.toFixed(2) };
    });
    onSaveMaterials(next);
    onNotify(`تم تعديل أسعار كافة المواد بنسبة ${pct}%`);
  };

  const recordDisposal = async () => {
    const q = parseFloat(dispForm.qty) || 0;
    if (!dispForm.itemName.trim() || q <= 0) {
      onNotify('اختر المادة وأدخل كمية الإتلاف');
      return;
    }
    const res = await onShowMsg({
      title: 'اتلاف مواد',
      icon: 'question',
      text: `هل تريد اعتماد محضر إتلاف المادة «${dispForm.itemName}» بكمية ${q}؟`,
      buttons: [
        { label: 'نعم', value: 'yes' },
        { label: 'لا', value: 'no', focus: true },
      ],
    });
    if (res !== 'yes') return;

    const record: MaterialDisposalRecord = {
      id: `disp-${Date.now()}`,
      number: dispForm.number || String(disposals.length + 1),
      date: dispForm.date,
      warehouse: dispForm.warehouse,
      itemCode: dispForm.itemCode,
      itemName: dispForm.itemName,
      qty: q,
      cost: parseFloat(dispForm.cost) || 0,
      reason: dispForm.reason,
      by: currentUser,
    };
    onSaveDisposals([record, ...disposals]);

    if (dispForm.itemCode) {
      const updatedMats = materials.map((m) => {
        if (m.code !== dispForm.itemCode) return m;
        const curQty = parseFloat(m.qty || '0') || 0;
        return { ...m, qty: String(Math.max(0, curQty - q)) };
      });
      onSaveMaterials(updatedMats);
    }
    onNotify('تم تسجيل محضر إتلاف المواد وتحديث المخزون');
  };

  const selectedLabelMat = materials.find((m) => m.code === labelCode) || materials[0];

  return (
    <DraggableWindow
      open={open}
      title={MATERIALS_MODE_TITLES[activeMode]}
      width={1020}
      height={660}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#dce4ee] p-3 gap-2.5 overflow-hidden text-[13px]">
        {/* Quick navigation strip */}
        <div className="flex flex-wrap items-center gap-1 pb-2 border-b border-[#b9c4d4]">
          {(
            [
              ['add', 'اضافة مادة'],
              ['browse', 'استعراض المواد'],
              ['addGroup', 'مجموعات المواد'],
              ['editPrices', 'تسعيرات المواد'],
              ['warehouses', 'المستودعات'],
              ['expenses', 'المصاريف'],
              ['tree', 'شجرة المواد'],
              ['labels', 'لصقات المواد'],
              ['handoverCycle', 'استلام وتسليم'],
              ['dispose', 'اتلاف مواد'],
            ] as [MaterialsOpsMode, string][]
          ).map(([m, lbl]) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMode(m)}
              className={`erp-classic-btn px-2.5 h-[26px] text-[12px] ${
                activeMode === m ? 'focused font-bold' : ''
              } ${m === 'dispose' ? 'text-[#0000cc]' : ''}`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Add Material */}
        {activeMode === 'add' && (
          <div className="flex-1 bg-[#f4f6fa] border border-[#b9c4d4] p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold">رمز المادة</label>
                <input
                  value={matForm.code}
                  onChange={(e) => setMatForm((p) => ({ ...p, code: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">اسم المادة</label>
                <input
                  value={matForm.name}
                  onChange={(e) => setMatForm((p) => ({ ...p, name: e.target.value }))}
                  className="erp-field"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">الاسم الأجنبي</label>
                <input
                  value={matForm.foreignName}
                  onChange={(e) => setMatForm((p) => ({ ...p, foreignName: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">الباركود</label>
                <input
                  value={matForm.barcode}
                  onChange={(e) => setMatForm((p) => ({ ...p, barcode: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">مجموعة المادة</label>
                <select
                  value={matForm.groupCode || '01'}
                  onChange={(e) => setMatForm((p) => ({ ...p, groupCode: e.target.value }))}
                  className="erp-field bg-white"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.code}>
                      {g.code} - {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">المستودع</label>
                <select
                  value={matForm.warehouse}
                  onChange={(e) => setMatForm((p) => ({ ...p, warehouse: e.target.value }))}
                  className="erp-field bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">الوحدة الرئيسية</label>
                <input
                  value={matForm.mainUnit}
                  onChange={(e) => setMatForm((p) => ({ ...p, mainUnit: e.target.value }))}
                  className="erp-field"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  value={matForm.qty}
                  onChange={(e) => setMatForm((p) => ({ ...p, qty: e.target.value }))}
                  className="erp-field text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">سعر الشراء / التكلفة</label>
                <input
                  type="number"
                  value={matForm.purchasePrice}
                  onChange={(e) => setMatForm((p) => ({ ...p, purchasePrice: e.target.value }))}
                  className="erp-field text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">الحد الأدنى</label>
                <input
                  type="number"
                  value={matForm.minLimit}
                  onChange={(e) => setMatForm((p) => ({ ...p, minLimit: e.target.value }))}
                  className="erp-field text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">الحد الأعلى</label>
                <input
                  type="number"
                  value={matForm.maxLimit}
                  onChange={(e) => setMatForm((p) => ({ ...p, maxLimit: e.target.value }))}
                  className="erp-field text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">تاريخ الصلاحية</label>
                <input
                  type="date"
                  value={matForm.expiryDate}
                  onChange={(e) => setMatForm((p) => ({ ...p, expiryDate: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="mt-auto flex justify-end gap-2 pt-3 border-t border-[#d0d7e2]">
              <button type="button" onClick={saveMaterial} className="erp-classic-btn focused px-6 h-[30px]">
                حفظ المادة
              </button>
              <button type="button" onClick={onClose} className="erp-classic-btn px-5 h-[30px]">
                خروج
              </button>
            </div>
          </div>
        )}

        {/* Browse / Guide / Main / Total Materials / Edit Prices */}
        {(activeMode === 'browse' ||
          activeMode === 'guide' ||
          activeMode === 'mainMaterials' ||
          activeMode === 'totalMaterials' ||
          activeMode === 'editPrices') && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 bg-[#eef3f9] border border-[#b9c4d4] p-2">
              <label className="font-bold">بحث عن مادة</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اسم المادة / الرمز / الباركود"
                className="erp-field flex-1 min-w-[200px]"
              />
              {activeMode === 'editPrices' && (
                <div className="flex items-center gap-1.5">
                  <label className="font-bold text-[12px]">نسبة التعديل %:</label>
                  <input
                    type="number"
                    value={pricePct}
                    onChange={(e) => setPricePct(e.target.value)}
                    className="erp-field w-[75px] text-center"
                    dir="ltr"
                  />
                  <button type="button" onClick={applyPricePercentage} className="erp-classic-btn focused px-3 h-[26px]">
                    تطبيق على الكل
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingCode(null);
                  setActiveMode('add');
                }}
                className="erp-classic-btn px-3 h-[26px]"
              >
                + مادة جديدة
              </button>
            </div>

            <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرمز</th>
                    <th className="border border-[#9aa7b8] p-1.5">اسم المادة</th>
                    <th className="border border-[#9aa7b8] p-1.5">الباركود</th>
                    <th className="border border-[#9aa7b8] p-1.5">الوحدة</th>
                    <th className="border border-[#9aa7b8] p-1.5">المستودع</th>
                    <th className="border border-[#9aa7b8] p-1.5">الكمية</th>
                    <th className="border border-[#9aa7b8] p-1.5">السعر / التكلفة</th>
                    <th className="border border-[#9aa7b8] p-1.5">إجمالي القيمة</th>
                    <th className="border border-[#9aa7b8] p-1.5">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#666]">
                        لا توجد مواد مسجلة حالياً. اضغط «+ مادة جديدة» لإضافة مادة أو استورد من Excel.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((m) => {
                      const q = parseFloat(m.qty || '0') || 0;
                      const p = parseFloat(m.purchasePrice || '0') || 0;
                      return (
                        <tr key={m.code} className="hover:bg-[#eaf3fc]">
                          <td className="border border-[#d5dce6] p-1.5 text-center" dir="ltr">
                            {m.code}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5 font-bold">{m.name}</td>
                          <td className="border border-[#d5dce6] p-1.5 text-center" dir="ltr">
                            {m.barcode}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5 text-center">{m.mainUnit}</td>
                          <td className="border border-[#d5dce6] p-1.5 text-center">{m.warehouse}</td>
                          <td className="border border-[#d5dce6] p-1.5 text-center">{m.qty}</td>
                          <td className="border border-[#d5dce6] p-1.5 text-center">
                            {activeMode === 'editPrices' ? (
                              <input
                                type="number"
                                value={m.purchasePrice}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onSaveMaterials(
                                    materials.map((x) => (x.code === m.code ? { ...x, purchasePrice: val } : x))
                                  );
                                }}
                                className="erp-field w-[90px] text-center"
                                dir="ltr"
                              />
                            ) : (
                              p.toFixed(2)
                            )}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5 text-center font-bold">
                            {(q * p).toFixed(2)}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCode(m.code);
                                setMatForm(m);
                                setActiveMode('add');
                              }}
                              className="erp-classic-btn px-2 py-0.5 text-[11px]"
                            >
                              تعديل
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Material Groups + Batch Specs/Props */}
        {(activeMode === 'addGroup' || activeMode === 'editSpecs' || activeMode === 'editProps') && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-2 overflow-hidden">
            <div className="bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرمز</th>
                    <th className="border border-[#9aa7b8] p-1.5">اسم المجموعة</th>
                    <th className="border border-[#9aa7b8] p-1.5">الوحدة الافتراضية</th>
                    <th className="border border-[#9aa7b8] p-1.5">الضريبة %</th>
                    <th className="border border-[#9aa7b8] p-1.5">صلاحية إجبارية</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr
                      key={g.id}
                      onClick={() => {
                        setGrpEditId(g.id);
                        setBatchGroupCode(g.code);
                        setGrpForm({
                          code: g.code,
                          name: g.name,
                          parentCode: g.parentCode,
                          defaultUnit: g.defaultUnit,
                          taxRate: g.taxRate,
                          requireExpiry: g.requireExpiry,
                          notes: g.notes,
                        });
                      }}
                      className={`cursor-pointer ${
                        grpEditId === g.id ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                      }`}
                    >
                      <td className="border border-[#d5dce6] p-1.5 text-center">{g.code}</td>
                      <td className="border border-[#d5dce6] p-1.5 font-bold">{g.name}</td>
                      <td className="border border-[#d5dce6] p-1.5 text-center">{g.defaultUnit}</td>
                      <td className="border border-[#d5dce6] p-1.5 text-center">{g.taxRate}%</td>
                      <td className="border border-[#d5dce6] p-1.5 text-center">
                        {g.requireExpiry ? 'نعم' : 'لا'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 flex flex-col gap-2 overflow-y-auto">
              {activeMode === 'addGroup' ? (
                <>
                  <div className="font-bold border-b border-[#cbd4e0] pb-1">إضافة / تعديل مجموعة مواد</div>
                  <label className="font-bold text-[12px]">رمز المجموعة</label>
                  <input
                    value={grpForm.code}
                    onChange={(e) => setGrpForm((p) => ({ ...p, code: e.target.value }))}
                    className="erp-field"
                  />
                  <label className="font-bold text-[12px]">اسم المجموعة</label>
                  <input
                    value={grpForm.name}
                    onChange={(e) => setGrpForm((p) => ({ ...p, name: e.target.value }))}
                    className="erp-field"
                  />
                  <label className="font-bold text-[12px]">الوحدة الافتراضية</label>
                  <input
                    value={grpForm.defaultUnit}
                    onChange={(e) => setGrpForm((p) => ({ ...p, defaultUnit: e.target.value }))}
                    className="erp-field"
                  />
                  <label className="font-bold text-[12px]">نسبة الضريبة %</label>
                  <input
                    type="number"
                    value={grpForm.taxRate}
                    onChange={(e) => setGrpForm((p) => ({ ...p, taxRate: Number(e.target.value) || 0 }))}
                    className="erp-field"
                  />
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grpForm.requireExpiry}
                      onChange={(e) => setGrpForm((p) => ({ ...p, requireExpiry: e.target.checked }))}
                      className="accent-[#0078d7]"
                    />
                    <span>تتطلب تاريخ صلاحية</span>
                  </label>
                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!grpForm.code.trim() || !grpForm.name.trim()) {
                          onNotify('أدخل رمز واسم المجموعة');
                          return;
                        }
                        const rec: MaterialGroupRecord = { id: grpEditId || `mg-${Date.now()}`, ...grpForm };
                        const next = grpEditId ? groups.map((g) => (g.id === grpEditId ? rec : g)) : [...groups, rec];
                        onSaveGroups(next);
                        onNotify('تم حفظ مجموعة المواد');
                      }}
                      className="erp-classic-btn focused flex-1 h-[28px]"
                    >
                      حفظ المجموعة
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold border-b border-[#cbd4e0] pb-1">تحديث جماعي للمجموعة</div>
                  <label className="font-bold text-[12px]">المجموعة المستهدفة</label>
                  <select
                    value={batchGroupCode}
                    onChange={(e) => setBatchGroupCode(e.target.value)}
                    className="erp-field bg-white"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.code}>
                        {g.code} - {g.name}
                      </option>
                    ))}
                  </select>
                  <label className="font-bold text-[12px]">توحيد الوحدة الرئيسية</label>
                  <input value={batchUnit} onChange={(e) => setBatchUnit(e.target.value)} className="erp-field" />
                  <label className="font-bold text-[12px]">توحيد المستودع</label>
                  <select
                    value={batchWarehouse}
                    onChange={(e) => setBatchWarehouse(e.target.value)}
                    className="erp-field bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <label className="font-bold text-[12px]">نسبة الضريبة المشتركة %</label>
                  <input
                    type="number"
                    value={batchTax}
                    onChange={(e) => setBatchTax(Number(e.target.value) || 0)}
                    className="erp-field"
                  />
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchExpiry}
                      onChange={(e) => setBatchExpiry(e.target.checked)}
                      className="accent-[#0078d7]"
                    />
                    <span>إلزام الصلاحية للمجموعة</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveGroups(
                        groups.map((g) =>
                          g.code === batchGroupCode
                            ? { ...g, defaultUnit: batchUnit, taxRate: batchTax, requireExpiry: batchExpiry }
                            : g
                        )
                      );
                      onSaveMaterials(
                        materials.map((m) =>
                          (m.groupCode || '01') === batchGroupCode
                            ? { ...m, mainUnit: batchUnit, warehouse: batchWarehouse }
                            : m
                        )
                      );
                      onNotify('تم تطبيق المواصفات والخصائص على المجموعة بنجاح');
                    }}
                    className="erp-classic-btn focused mt-auto h-[30px]"
                  >
                    تطبيق التحديث الجماعي
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Warehouses */}
        {activeMode === 'warehouses' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 overflow-hidden">
            <div className="bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرمز</th>
                    <th className="border border-[#9aa7b8] p-1.5">اسم المستودع</th>
                    <th className="border border-[#9aa7b8] p-1.5">الموقع</th>
                    <th className="border border-[#9aa7b8] p-1.5">أمين المستودع</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => {
                        setWhEditId(w.id);
                        setWhForm({ code: w.code, name: w.name, location: w.location, keeper: w.keeper, notes: w.notes });
                      }}
                      className={`cursor-pointer ${
                        whEditId === w.id ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                      }`}
                    >
                      <td className="border border-[#d5dce6] p-1.5 text-center">{w.code}</td>
                      <td className="border border-[#d5dce6] p-1.5 font-bold">{w.name}</td>
                      <td className="border border-[#d5dce6] p-1.5">{w.location}</td>
                      <td className="border border-[#d5dce6] p-1.5">{w.keeper}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 flex flex-col gap-2">
              <div className="font-bold border-b border-[#cbd4e0] pb-1">بيانات المستودع</div>
              <label className="font-bold text-[12px]">الرمز</label>
              <input value={whForm.code} onChange={(e) => setWhForm((p) => ({ ...p, code: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">اسم المستودع</label>
              <input value={whForm.name} onChange={(e) => setWhForm((p) => ({ ...p, name: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">الموقع</label>
              <input value={whForm.location} onChange={(e) => setWhForm((p) => ({ ...p, location: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">أمين المستودع</label>
              <input value={whForm.keeper} onChange={(e) => setWhForm((p) => ({ ...p, keeper: e.target.value }))} className="erp-field" />
              <div className="mt-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setWhEditId(null);
                    setWhForm({ code: String(warehouses.length + 1), name: '', location: '', keeper: '', notes: '' });
                  }}
                  className="erp-classic-btn px-3 h-[28px]"
                >
                  جديد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!whForm.name.trim()) {
                      onNotify('أدخل اسم المستودع');
                      return;
                    }
                    const rec: WarehouseRecord = { id: whEditId || `wh-${Date.now()}`, ...whForm };
                    onSaveWarehouses(
                      whEditId ? warehouses.map((w) => (w.id === whEditId ? rec : w)) : [...warehouses, rec]
                    );
                    setWhEditId(rec.id);
                    onNotify('تم حفظ بيانات المستودع');
                  }}
                  className="erp-classic-btn focused flex-1 h-[28px]"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expenses */}
        {activeMode === 'expenses' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 overflow-hidden">
            <div className="bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرمز</th>
                    <th className="border border-[#9aa7b8] p-1.5">اسم المصروف</th>
                    <th className="border border-[#9aa7b8] p-1.5">الحساب المقابل</th>
                    <th className="border border-[#9aa7b8] p-1.5">القيمة الافتراضية</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((ex) => (
                    <tr
                      key={ex.id}
                      onClick={() => {
                        setExpEditId(ex.id);
                        setExpForm({
                          code: ex.code,
                          name: ex.name,
                          accountName: ex.accountName,
                          defaultAmount: String(ex.defaultAmount),
                          notes: ex.notes,
                        });
                      }}
                      className={`cursor-pointer ${
                        expEditId === ex.id ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                      }`}
                    >
                      <td className="border border-[#d5dce6] p-1.5 text-center">{ex.code}</td>
                      <td className="border border-[#d5dce6] p-1.5 font-bold">{ex.name}</td>
                      <td className="border border-[#d5dce6] p-1.5">{ex.accountName}</td>
                      <td className="border border-[#d5dce6] p-1.5 text-center">{ex.defaultAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 flex flex-col gap-2">
              <div className="font-bold border-b border-[#cbd4e0] pb-1">تعريف مصاريف المواد</div>
              <label className="font-bold text-[12px]">الرمز</label>
              <input value={expForm.code} onChange={(e) => setExpForm((p) => ({ ...p, code: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">اسم المصروف</label>
              <input value={expForm.name} onChange={(e) => setExpForm((p) => ({ ...p, name: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">الحساب المرتبط</label>
              <input value={expForm.accountName} onChange={(e) => setExpForm((p) => ({ ...p, accountName: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">المبلغ الافتراضي</label>
              <input
                type="number"
                value={expForm.defaultAmount}
                onChange={(e) => setExpForm((p) => ({ ...p, defaultAmount: e.target.value }))}
                className="erp-field"
              />
              <div className="mt-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setExpEditId(null);
                    setExpForm({ code: `EXP-0${expenses.length + 1}`, name: '', accountName: '', defaultAmount: '0', notes: '' });
                  }}
                  className="erp-classic-btn px-3 h-[28px]"
                >
                  جديد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!expForm.name.trim()) {
                      onNotify('أدخل اسم المصروف');
                      return;
                    }
                    const rec: MaterialExpenseRecord = {
                      id: expEditId || `me-${Date.now()}`,
                      code: expForm.code,
                      name: expForm.name,
                      accountName: expForm.accountName,
                      defaultAmount: parseFloat(expForm.defaultAmount) || 0,
                      notes: expForm.notes,
                    };
                    onSaveExpenses(
                      expEditId ? expenses.map((x) => (x.id === expEditId ? rec : x)) : [...expenses, rec]
                    );
                    onNotify('تم حفظ المصروف');
                  }}
                  className="erp-classic-btn focused flex-1 h-[28px]"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Materials Tree */}
        {activeMode === 'tree' && (
          <div className="flex-1 bg-[#cfdce8] border border-[#9aa7b8] p-3 overflow-y-auto erp-scrollbar">
            {groups.map((g) => {
              const itemsInGrp = materials.filter((m) => (m.groupCode || '01') === g.code);
              return (
                <div key={g.id} className="mb-2">
                  <div className="font-bold text-[14px] flex items-center gap-2 py-1">
                    <span>📁</span>
                    <span>
                      {toAr(g.code)} - {g.name} ({itemsInGrp.length})
                    </span>
                  </div>
                  <div className="pr-6 border-r border-dotted border-[#6f7e91] space-y-1">
                    {itemsInGrp.length === 0 ? (
                      <div className="text-[12px] text-[#555]">لا توجد مواد ضمن هذه المجموعة</div>
                    ) : (
                      itemsInGrp.map((m) => (
                        <div key={m.code} className="text-[13px] flex items-center gap-2 py-0.5">
                          <span>📦</span>
                          <span className="font-semibold">
                            {m.code} - {m.name}
                          </span>
                          <span className="text-[11px] text-[#444]">
                            (الكمية: {m.qty} {m.mainUnit})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Barcode Labels */}
        {activeMode === 'labels' && (
          <div className="flex-1 bg-[#f4f6fa] border border-[#b9c4d4] p-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex flex-wrap items-center gap-3">
              <label className="font-bold">اختر المادة:</label>
              <select
                value={labelCode}
                onChange={(e) => setLabelCode(e.target.value)}
                className="erp-field min-w-[220px] bg-white"
              >
                {materials.length === 0 && <option value="">مادة تجريبية (101)</option>}
                {materials.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
              <label className="font-bold">عدد اللصقات:</label>
              <input
                type="number"
                min={1}
                max={24}
                value={labelCount}
                onChange={(e) => setLabelCount(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                className="erp-field w-[70px] text-center"
              />
              <button
                type="button"
                onClick={() => {
                  window.print();
                  onNotify('تم إرسال اللصقات إلى الطابعة');
                }}
                className="erp-classic-btn focused px-4 h-[28px]"
              >
                طباعة اللصقات
              </button>
            </div>
            <div className="flex-1 bg-white border border-[#9aa7b8] p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start">
              {Array.from({ length: labelCount }, (_, idx) => {
                const lblName = selectedLabelMat?.name || 'صنف نموذجي';
                const lblBarcode = selectedLabelMat?.barcode || '62810000101';
                const lblPrice = selectedLabelMat?.purchasePrice || '0.00';
                return (
                  <div
                    key={idx}
                    className="border border-dashed border-[#444] p-2.5 flex flex-col items-center gap-1 bg-white"
                  >
                    <div className="font-bold text-[12px] text-center truncate w-full">{lblName}</div>
                    <svg width="130" height="36" viewBox="0 0 130 36" aria-hidden="true">
                      <rect x="2" y="2" width="3" height="28" fill="#111" />
                      <rect x="8" y="2" width="1.5" height="28" fill="#111" />
                      <rect x="13" y="2" width="4" height="28" fill="#111" />
                      <rect x="20" y="2" width="2" height="28" fill="#111" />
                      <rect x="26" y="2" width="3.5" height="28" fill="#111" />
                      <rect x="33" y="2" width="1.5" height="28" fill="#111" />
                      <rect x="38" y="2" width="3" height="28" fill="#111" />
                      <rect x="45" y="2" width="4" height="28" fill="#111" />
                      <rect x="53" y="2" width="2" height="28" fill="#111" />
                      <rect x="58" y="2" width="3" height="28" fill="#111" />
                      <rect x="65" y="2" width="1.5" height="28" fill="#111" />
                      <rect x="70" y="2" width="4" height="28" fill="#111" />
                      <rect x="78" y="2" width="2" height="28" fill="#111" />
                      <rect x="84" y="2" width="3.5" height="28" fill="#111" />
                      <rect x="92" y="2" width="2" height="28" fill="#111" />
                      <rect x="98" y="2" width="4" height="28" fill="#111" />
                      <rect x="106" y="2" width="1.5" height="28" fill="#111" />
                      <rect x="111" y="2" width="3" height="28" fill="#111" />
                      <rect x="118" y="2" width="2" height="28" fill="#111" />
                      <rect x="123" y="2" width="3" height="28" fill="#111" />
                    </svg>
                    <div className="text-[11px] font-mono" dir="ltr">
                      {lblBarcode}
                    </div>
                    <div className="text-[11px] font-bold">السعر: {lblPrice}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Handover Cycle & Report */}
        {(activeMode === 'handoverCycle' || activeMode === 'handoverReport') && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {activeMode === 'handoverCycle' && (
              <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                  value={hoForm.fromEmployee}
                  onChange={(e) => setHoForm((p) => ({ ...p, fromEmployee: e.target.value }))}
                  placeholder="المسلّم"
                  className="erp-field"
                />
                <input
                  value={hoForm.toEmployee}
                  onChange={(e) => setHoForm((p) => ({ ...p, toEmployee: e.target.value }))}
                  placeholder="المستلم"
                  className="erp-field"
                />
                <input
                  value={hoForm.itemName}
                  onChange={(e) => setHoForm((p) => ({ ...p, itemName: e.target.value }))}
                  placeholder="اسم المادة / العهدة"
                  className="erp-field"
                />
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={hoForm.qty}
                    onChange={(e) => setHoForm((p) => ({ ...p, qty: e.target.value }))}
                    placeholder="الكمية"
                    className="erp-field w-[80px] text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!hoForm.toEmployee.trim() || !hoForm.itemName.trim()) {
                        onNotify('أدخل المستلم واسم المادة');
                        return;
                      }
                      const rec: MaterialHandoverRecord = {
                        id: `ho-${Date.now()}`,
                        number: hoForm.number || String(handovers.length + 1),
                        date: hoForm.date,
                        fromEmployee: hoForm.fromEmployee,
                        toEmployee: hoForm.toEmployee,
                        warehouse: hoForm.warehouse,
                        itemName: hoForm.itemName,
                        qty: parseFloat(hoForm.qty) || 1,
                        status: hoForm.status,
                        notes: hoForm.notes,
                      };
                      onSaveHandovers([rec, ...handovers]);
                      onNotify('تم تسجيل حركة الاستلام والتسليم');
                    }}
                    className="erp-classic-btn focused flex-1"
                  >
                    تسجيل
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرقم</th>
                    <th className="border border-[#9aa7b8] p-1.5">التاريخ</th>
                    <th className="border border-[#9aa7b8] p-1.5">من الموظف</th>
                    <th className="border border-[#9aa7b8] p-1.5">إلى الموظف</th>
                    <th className="border border-[#9aa7b8] p-1.5">المادة</th>
                    <th className="border border-[#9aa7b8] p-1.5">الكمية</th>
                    <th className="border border-[#9aa7b8] p-1.5">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {handovers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#666]">
                        لا توجد حركات استلام وتسليم مسجلة بعد.
                      </td>
                    </tr>
                  ) : (
                    handovers.map((h) => (
                      <tr key={h.id} className="hover:bg-[#eaf3fc]">
                        <td className="border border-[#d5dce6] p-1.5 text-center">{h.number}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{h.date}</td>
                        <td className="border border-[#d5dce6] p-1.5">{h.fromEmployee}</td>
                        <td className="border border-[#d5dce6] p-1.5">{h.toEmployee}</td>
                        <td className="border border-[#d5dce6] p-1.5 font-bold">{h.itemName}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{h.qty}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{h.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dispose Materials */}
        {activeMode === 'dispose' && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-bold">اختر المادة (أو اكتب اسمها)</label>
                <div className="flex gap-1">
                  <select
                    value={dispForm.itemCode}
                    onChange={(e) => {
                      const m = materials.find((x) => x.code === e.target.value);
                      setDispForm((p) => ({
                        ...p,
                        itemCode: e.target.value,
                        itemName: m?.name || p.itemName,
                        cost: m?.purchasePrice || p.cost,
                      }));
                    }}
                    className="erp-field flex-1 bg-white"
                  >
                    <option value="">-- مادة مخصصة --</option>
                    {materials.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.code} - {m.name} (متاح: {m.qty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">اسم المادة المتلفة</label>
                <input
                  value={dispForm.itemName}
                  onChange={(e) => setDispForm((p) => ({ ...p, itemName: e.target.value }))}
                  className="erp-field"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold">الكمية المتلفة وسبب الإتلاف</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={dispForm.qty}
                    onChange={(e) => setDispForm((p) => ({ ...p, qty: e.target.value }))}
                    className="erp-field w-[75px] text-center"
                  />
                  <input
                    value={dispForm.reason}
                    onChange={(e) => setDispForm((p) => ({ ...p, reason: e.target.value }))}
                    className="erp-field flex-1"
                  />
                  <button type="button" onClick={recordDisposal} className="erp-classic-btn focused px-3">
                    اعتماد الإتلاف
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">رقم المحضر</th>
                    <th className="border border-[#9aa7b8] p-1.5">التاريخ</th>
                    <th className="border border-[#9aa7b8] p-1.5">المستودع</th>
                    <th className="border border-[#9aa7b8] p-1.5">اسم المادة</th>
                    <th className="border border-[#9aa7b8] p-1.5">الكمية</th>
                    <th className="border border-[#9aa7b8] p-1.5">السبب</th>
                    <th className="border border-[#9aa7b8] p-1.5">المستخدم</th>
                  </tr>
                </thead>
                <tbody>
                  {disposals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#666]">
                        لا توجد محاضر إتلاف مواد مسجلة.
                      </td>
                    </tr>
                  ) : (
                    disposals.map((d) => (
                      <tr key={d.id} className="hover:bg-[#eaf3fc]">
                        <td className="border border-[#d5dce6] p-1.5 text-center">{d.number}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{d.date}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{d.warehouse}</td>
                        <td className="border border-[#d5dce6] p-1.5 font-bold">{d.itemName}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{d.qty}</td>
                        <td className="border border-[#d5dce6] p-1.5">{d.reason}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{d.by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};
