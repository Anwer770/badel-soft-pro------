import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (open) {
      setSelectedIdx((prev) => {
        if (!users.length) return -1;
        if (prev >= 0 && prev < users.length) return prev;
        return 0;
      });
    }
  }, [open, users.length]);

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
      width={600}
      height={480}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-2 gap-2.5 overflow-hidden">
        <div className="flex-1 bg-[#f0f0f0] border border-[#9a9a9a] overflow-auto erp-scrollbar">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-white border-b border-[#c5c5c5]">
                <th className="w-10 border-l border-[#d0d0d0] py-1.5 bg-white" />
                <th className="py-1.5 px-4 text-center font-bold text-[13px] bg-white">الاسم</th>
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
                      isSel ? 'bg-[#0078d7] text-white' : 'bg-white hover:bg-[#e5f1fb]'
                    }`}
                  >
                    <td
                      className={`w-10 border-l border-[#d0d0d0] text-center text-[11px] py-1 ${
                        isSel ? 'bg-[#f4f4f4] text-[#333]' : 'bg-[#f8f8f8] text-[#555]'
                      }`}
                    >
                      {isSel ? '◀' : ''}
                    </td>
                    <td className="py-1 px-4 text-center font-semibold text-[13px]">{u.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 pb-1">
          <button
            type="button"
            onClick={onAddUser}
            className="erp-classic-btn focused flex-1 h-[32px] text-[13px] font-bold"
          >
            اضافه
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="erp-classic-btn flex-1 h-[32px] text-[13px] font-bold"
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="erp-classic-btn flex-1 h-[32px] text-[13px] font-bold"
          >
            حذف
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn flex-1 h-[32px] text-[13px] font-bold"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
