import React, { useEffect, useState } from 'react';
import { SYSTEM_ALERTS_LIST } from '../data/erpDefaults';
import { DraggableWindow } from './DraggableWindow';

interface AlertsDialogProps {
  open: boolean;
  zIndex: number;
  value: Record<number, boolean>;
  onFocus: () => void;
  onClose: () => void;
  onSave: (next: Record<number, boolean>) => void;
}

export const AlertsDialog: React.FC<AlertsDialogProps> = ({
  open,
  zIndex,
  value,
  onFocus,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<Record<number, boolean>>(value);

  useEffect(() => {
    if (open) setDraft({ ...value });
  }, [open, value]);

  return (
    <DraggableWindow
      open={open}
      title="تنبيهات النظام"
      width={620}
      height={430}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-4 gap-4 overflow-hidden">
        <div className="flex-1 bg-white border border-[#8e8e8e] p-4 overflow-y-auto erp-scrollbar flex flex-col gap-3.5">
          {SYSTEM_ALERTS_LIST.map((text, idx) => (
            <label
              key={text}
              className="flex items-center gap-3 font-semibold text-[14px] cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={!!draft[idx]}
                onChange={(e) => setDraft((prev) => ({ ...prev, [idx]: e.target.checked }))}
                className="w-4 h-4 accent-[#0078d7]"
              />
              <span>{text}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-center gap-20">
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="erp-classic-btn focused w-[135px] h-[34px] text-[14px]"
          >
            موافق
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
