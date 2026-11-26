import React, { useEffect, useState } from 'react';
import { PERMS_DATA, toAr } from '../data/erpDefaults';
import type { ErpUser, MsgConfig, PermCategoryKey } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

const TAB_GROUPS: { label: string; keys: PermCategoryKey[] }[] = [
  { label: 'شؤون الموظفين', keys: ['emp'] },
  { label: 'المحاسبة والمواد', keys: ['acc', 'mat'] },
  { label: 'صلاحيات عامة', keys: ['gen'] },
  { label: 'صلاحيات اخرى', keys: ['oth'] },
  { label: 'الدليل', keys: ['guide'] },
];

interface PermissionsDialogProps {
  open: boolean;
  zIndex: number;
  user: ErpUser | null;
  onFocus: () => void;
  onClose: () => void;
  onSave: (user: ErpUser) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
}

export const PermissionsDialog: React.FC<PermissionsDialogProps> = ({
  open,
  zIndex,
  user,
  onFocus,
  onClose,
  onSave,
  onShowMsg,
}) => {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [acct, setAcct] = useState('');
  const [box, setBox] = useState('');
  const [tabIdx, setTabIdx] = useState(0);
  const [perms, setPerms] = useState<Partial<Record<PermCategoryKey, number[]>>>({});
  const [selectedRow, setSelectedRow] = useState<number>(-1);

  useEffect(() => {
    if (open) {
      setName(user?.name || '');
      setPass(user?.pass || '');
      setPass2(user?.pass || '');
      setAcct(user?.acct || '');
      setBox(user?.box || '');
      setPerms(JSON.parse(JSON.stringify(user?.perms || {})));
      setTabIdx(0);
      setSelectedRow(-1);
    }
  }, [open, user]);

  const groupKeys = TAB_GROUPS[tabIdx].keys;
  const groupRows = groupKeys.flatMap((key) =>
    PERMS_DATA[key].map(([id, label]) => ({ key, id, label }))
  );
  const groupTotal = groupRows.length;
  const groupChecked = groupRows.filter((r) => (perms[r.key] || []).includes(r.id)).length;
  const allChecked = groupTotal > 0 && groupChecked === groupTotal;

  const isChecked = (key: PermCategoryKey, id: number) => (perms[key] || []).includes(id);

  const togglePerm = (key: PermCategoryKey, id: number, checked: boolean) => {
    const next = new Set(perms[key] || []);
    if (checked) next.add(id);
    else next.delete(id);
    setPerms({ ...perms, [key]: [...next] });
  };

  const toggleAll = (checked: boolean) => {
    const next: Partial<Record<PermCategoryKey, number[]>> = { ...perms };
    for (const key of groupKeys) {
      next[key] = checked ? PERMS_DATA[key].map((item) => item[0]) : [];
    }
    setPerms(next);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      await onShowMsg({
        title: 'صلاحيات المستخدمين',
        icon: 'warn',
        text: 'ادخل اسم المستخدم أولاً.',
      });
      return;
    }
    if (pass !== pass2) {
      await onShowMsg({
        title: 'صلاحيات المستخدمين',
        icon: 'warn',
        text: 'كلمة السر وتأكيدها غير متطابقتين.',
      });
      return;
    }
    onSave({
      name: name.trim(),
      pass,
      acct: acct.trim(),
      box: box.trim(),
      perms,
    });
    onClose();
  };

  return (
    <DraggableWindow
      open={open}
      title="صلاحيات المستخدمين"
      width={980}
      height={680}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] px-4 py-3 gap-2.5 overflow-hidden">
        {/* Top User Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 py-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px] text-right">اسم المستخدم</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="erp-field flex-1 h-[26px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px] text-right">كلمة السر</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="erp-field flex-1 h-[26px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px] text-right">تأكيد كلمة السر</label>
              <input
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                className="erp-field flex-1 h-[26px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="w-[100px] font-bold text-[13px] text-right">الحساب</label>
              <input
                value={acct}
                onChange={(e) => setAcct(e.target.value)}
                className="erp-field flex-1 h-[26px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-[100px] font-bold text-[13px] text-right">صندوق محدد</label>
              <input
                value={box}
                onChange={(e) => setBox(e.target.value)}
                className="erp-field flex-1 h-[26px]"
              />
            </div>
          </div>
        </div>

        {/* Permission Category Tabs + White Checklist Container */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap items-end px-0.5">
            {TAB_GROUPS.map((t, idx) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setTabIdx(idx);
                  setSelectedRow(-1);
                }}
                className={`px-3 py-1 text-[13px] font-bold border border-[#b5b5b5] border-b-0 -ml-px cursor-pointer ${
                  tabIdx === idx
                    ? 'bg-white text-black relative top-[1px] pb-[6px] z-10'
                    : 'bg-[#e9e9e9] text-[#222] hover:bg-[#e5f1fb]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col bg-white border border-[#9e9e9e] p-2 overflow-hidden">
            {/* Permissions List */}
            <div className="flex-1 border border-[#a5a5a5] bg-white overflow-y-auto erp-scrollbar">
              {groupRows.map((row, idx) => {
                const isSel = selectedRow === idx;
                const checked = isChecked(row.key, row.id);
                const showHeader = groupKeys.length > 1 && (idx === 0 || groupRows[idx - 1].key !== row.key);
                return (
                  <React.Fragment key={`${row.key}-${row.id}`}>
                    {showHeader && (
                      <div className="px-2 py-[3px] bg-[#e9eff7] border-y border-[#c9d3e0] font-bold text-[12px] text-[#274b74]">
                        {row.key === 'acc' ? 'صلاحيات المحاسبة' : 'صلاحيات المواد'}
                      </div>
                    )}
                    <div
                      onClick={() => setSelectedRow(idx)}
                      className={`flex items-center gap-2 px-2 py-[2px] cursor-pointer text-[13px] font-bold ${
                        isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#edf5fd] text-black'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => togglePerm(row.key, row.id, e.target.checked)}
                        className="w-[14px] h-[14px] accent-[#0078d7] shrink-0"
                      />
                      <span>
                        {row.label}
                        {toAr(idx + 1)}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="pt-2 px-1">
              <label className="inline-flex items-center gap-2 font-bold text-[13px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-[14px] h-[14px] accent-[#0078d7]"
                />
                <span>تحديد الكل</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex items-center justify-center gap-36 py-1">
          <button
            type="button"
            onClick={handleSave}
            className="erp-classic-btn w-[140px] h-[34px] text-[14px] font-bold"
          >
            موافق
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[140px] h-[34px] text-[14px] font-bold"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
