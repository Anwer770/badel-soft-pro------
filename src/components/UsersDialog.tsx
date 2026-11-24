import React, { useState } from 'react';
import type { ErpUser, MsgConfig } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface UsersDialogProps {
  open: boolean;
  zIndex: number;
  users: ErpUser[];
  onFocus: () => void;
  onClose: () => void;
  onAddUser: () => void;
  onEditUser: (index: number) => void;
  onDeleteUser: (index: number) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
}

export const UsersDialog: React.FC<UsersDialogProps> = ({
  open,
  zIndex,
  users,
  onFocus,
  onClose,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onShowMsg,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(users.length ? 0 : -1);

  const handleEdit = () => {
    if (selectedIdx < 0 || !users[selectedIdx]) {
      void onShowMsg({
        title: 'قائمة المستخدمين',
        icon: 'info',
        text: 'اختر مستخدماً من القائمة أولاً.',
      });
      return;
    }
    onEditUser(selectedIdx);
  };

  const handleDelete = async () => {
    if (selectedIdx < 0 || !users[selectedIdx]) {
      void onShowMsg({
        title: 'قائمة المستخدمين',
        icon: 'info',
        text: 'اختر مستخدماً من القائمة أولاً.',
      });
      return;
    }
    const u = users[selectedIdx];
    const res = await onShowMsg({
      title: 'حذف مستخدم',
      icon: 'question',
      text: `هل تريد حذف المستخدم «${u.name}»؟`,
      buttons: [
        { label: 'نعم', value: 'yes' },
        { label: 'لا', value: 'no', focus: true },
      ],
    });
    if (res === 'yes') {
      onDeleteUser(selectedIdx);
      setSelectedIdx(-1);
    }
  };

  return (
    <DraggableWindow
      open={open}
      title="قائمة المستخدمين"
      width={720}
      height={520}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 gap-3 overflow-hidden">
        <div className="flex-1 bg-[#e5e5e5] border border-[#8e8e8e] overflow-y-auto erp-scrollbar">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-[#f8f9fc] border-b border-[#bbb]">
                <th className="w-11 border-l border-[#ccc] py-2" />
                <th className="py-2 px-4 text-center font-bold text-[14px]">الاسم</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const isSel = idx === selectedIdx;
                return (
                  <tr
                    key={`${u.name}-${idx}`}
                    onClick={() => setSelectedIdx(idx)}
                    onDoubleClick={() => onEditUser(idx)}
                    className={`cursor-pointer border-b border-[#dcdcdc] ${
                      isSel ? 'bg-[#0078d7] text-white' : 'bg-[#ececec] hover:bg-[#e1effc]'
                    }`}
                  >
                    <td className="w-11 border-l border-[#ccc] text-center text-[11px] py-1.5">
                      {isSel ? '◀' : ''}
                    </td>
                    <td className="py-1.5 px-4 text-center font-semibold text-[14px]">{u.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-4 py-1">
          <button
            type="button"
            onClick={onAddUser}
            className="erp-classic-btn focused w-[135px] h-[34px] text-[14px]"
          >
            اضافه
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="erp-classic-btn w-[135px] h-[34px] text-[14px]"
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="erp-classic-btn w-[135px] h-[34px] text-[14px]"
          >
            حذف
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[135px] h-[34px] text-[14px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
