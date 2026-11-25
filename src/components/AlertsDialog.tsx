import React, { useEffect, useState } from 'react';
import { SYSTEM_ALERTS_LIST } from '../data/erpDefaults';
import { DraggableWindow } from './DraggableWindow';

interface AlertsDialogProps {
  open: boolean;
  zIndex: number;
  value: Record<number, boolean>;
  days?: { expiry: number; checks: number };
  onFocus: () => void;
  onClose: () => void;
  onSave: (next: Record<number, boolean>, nextDays: { expiry: number; checks: number }) => void;
}

export const AlertsDialog: React.FC<AlertsDialogProps> = ({
  open,
  zIndex,
  value,
  days,
  onFocus,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<Record<number, boolean>>(value);
  const [expiryDays, setExpiryDays] = useState(days?.expiry ?? 0);
  const [checksDays, setChecksDays] = useState(days?.checks ?? 0);

  useEffect(() => {
    if (open) {
      setDraft({ ...value });
      setExpiryDays(days?.expiry ?? 0);
      setChecksDays(days?.checks ?? 0);
    }
  }, [open, value, days]);

  return (
    <DraggableWindow
      open={open}
      title="تنبيهات النظام"
      width={445}
      height={395}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col justify-between bg-[#dce4ee] px-4 py-3.5 overflow-hidden select-none">
        <div className="flex flex-col gap-2 overflow-y-auto erp-scrollbar pr-1">
          {SYSTEM_ALERTS_LIST.map((text, idx) => (
            <div key={text} className="flex items-center justify-between gap-2 min-h-[24px]">
              <label className="flex items-center gap-2.5 font-bold text-[12px] text-[#111] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!draft[idx]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [idx]: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-[#0078d7]"
                />
                <span>{text}</span>
              </label>

              {idx === 0 && (
                <div className="flex items-center gap-1.5 shrink-0 text-[12px] font-bold">
                  <input
                    type="number"
                    min={0}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Math.max(0, Number(e.target.value) || 0))}
                    className="w-[74px] h-[22px] bg-white border border-[#8e8e8e] px-1.5 text-left font-bold outline-none focus:border-[#0078d7]"
                    dir="ltr"
                  />
                  <span>يوم</span>
                </div>
              )}

              {idx === 1 && (
                <div className="flex items-center gap-1.5 shrink-0 text-[12px] font-bold">
                  <input
                    type="number"
                    min={0}
                    value={checksDays}
                    onChange={(e) => setChecksDays(Math.max(0, Number(e.target.value) || 0))}
                    className="w-[74px] h-[22px] bg-white border border-[#8e8e8e] px-1.5 text-left font-bold outline-none focus:border-[#0078d7]"
                    dir="ltr"
                  />
                  <span>يوم</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-10 pt-3">
          <button
            type="button"
            onClick={() => {
              onSave(draft, { expiry: expiryDays, checks: checksDays });
              onClose();
            }}
            className="erp-classic-btn focused w-[108px] h-[29px] text-[13px]"
          >
            حفظ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[108px] h-[29px] text-[13px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
