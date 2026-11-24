import React, { useEffect, useState } from 'react';
import { PERMS_DATA, PERM_TABS, toAr } from '../data/erpDefaults';
import type { ErpUser, MsgConfig, PermCategoryKey } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

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
  const [activeTab, setActiveTab] = useState<PermCategoryKey>('emp');
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
      setActiveTab('emp');
      setSelectedRow(-1);
    }
  }, [open, user]);

  const currentList = PERMS_DATA[activeTab];
  const currentSet = new Set(perms[activeTab] || []);
  const allChecked = currentList.length > 0 && currentSet.size === currentList.length;

  const togglePerm = (id: number, checked: boolean) => {
    const next = new Set(perms[activeTab] || []);
    if (checked) next.add(id);
    else next.delete(id);
    setPerms({ ...perms, [activeTab]: [...next] });
  };

  const toggleAll = (checked: boolean) => {
    setPerms({
      ...perms,
      [activeTab]: checked ? currentList.map((item) => item[0]) : [],
    });
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
      width={1020}
      height={680}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 gap-3 overflow-hidden">
        {/* Top User Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-2.5 bg-[#f7f8fb] border border-[#d6d9e0] p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px]">اسم المستخدم</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="erp-field flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px]">كلمة السر</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="erp-field flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px]">تأكيد كلمة السر</label>
              <input
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                className="erp-field flex-1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px]">الحساب</label>
              <input
                value={acct}
                onChange={(e) => setAcct(e.target.value)}
                className="erp-field flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-[115px] font-bold text-[13px]">صندوق محدد</label>
              <input
                value={box}
                onChange={(e) => setBox(e.target.value)}
                className="erp-field flex-1"
              />
            </div>
          </div>
        </div>

        {/* Permission Category Tabs */}
        <div className="flex flex-wrap items-end border-b border-[#8e8e8e] px-1">
          {PERM_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                setSelectedRow(-1);
              }}
              className={`px-3.5 py-1.5 text-[13px] font-bold border border-[#adadad] border-b-0 -ml-px cursor-pointer ${
                activeTab === t.key
                  ? 'bg-white text-black relative top-[1px] pb-[7px] z-10'
                  : 'bg-[#e8eaf0] text-[#333] hover:bg-[#e5f1fb]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Permissions List */}
        <div className="flex-1 bg-white border border-[#8e8e8e] overflow-y-auto p-1 erp-scrollbar">
          {currentList.map(([id, label], idx) => {
            const isSel = selectedRow === idx;
            const checked = currentSet.has(id);
            return (
              <div
                key={id}
                onClick={() => setSelectedRow(idx)}
                className={`flex items-center gap-3 px-2.5 py-1 cursor-pointer text-[14px] font-semibold ${
                  isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#edf5fd] text-black'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => togglePerm(id, e.target.checked)}
                  className="w-4 h-4 accent-[#0078d7] shrink-0"
                />
                <span>
                  {label} ({toAr(id)})
                </span>
              </div>
            );
          })}
        </div>

        <label className="flex items-center gap-2 font-bold text-[14px] px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => toggleAll(e.target.checked)}
            className="w-4 h-4 accent-[#0078d7]"
          />
          <span>تحديد الكل</span>
        </label>

        {/* Bottom Buttons */}
        <div className="flex items-center justify-center gap-24 py-1 border-t border-[#d0d0d8]">
          <button
            type="button"
            onClick={handleSave}
            className="erp-classic-btn focused w-[140px] h-[34px] text-[14px]"
          >
            موافق
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
