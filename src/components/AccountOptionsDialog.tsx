import React, { useEffect, useState } from 'react';
import {
  ACCOUNT_OPTION_GROUPS_RIGHT,
  ACCOUNT_OPTION_GROUP_LEFT,
  PRINTERS_LIST,
} from '../data/erpDefaults';
import type { AccountOptionFieldDef } from '../data/erpDefaults';
import type { AccountOptionsState } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface AccountOptionsDialogProps {
  open: boolean;
  zIndex: number;
  value: AccountOptionsState;
  onFocus: () => void;
  onClose: () => void;
  onSave: (next: AccountOptionsState) => void;
  onNotify: (msg: string) => void;
}

const PRICING_MODES = [
  'السعر الوسطي (الكلفة)',
  'وارد أولاً صادر أولاً',
  'آخر سعر شراء',
];

export const AccountOptionsDialog: React.FC<AccountOptionsDialogProps> = ({
  open,
  zIndex,
  value,
  onFocus,
  onClose,
  onSave,
  onNotify,
}) => {
  const [draft, setDraft] = useState<AccountOptionsState>(value);

  useEffect(() => {
    if (open) {
      setDraft(JSON.parse(JSON.stringify(value)));
    }
  }, [open, value]);

  const updatePair = (key: string, field: 'code' | 'name', val: string) => {
    setDraft((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [key]: {
          code: prev.accounts[key]?.code || '',
          name: prev.accounts[key]?.name || '',
          [field]: val,
        },
      },
    }));
  };

  const renderRow = (row: AccountOptionFieldDef) => {
    const pair = draft.accounts[row.key] || { code: row.defaultCode, name: row.defaultName };
    return (
      <div key={row.key} className="flex items-center gap-2 my-1.5">
        <label className="flex-1 text-[13px] font-bold text-right truncate">{row.label}</label>
        <input
          dir="ltr"
          value={pair.code}
          onChange={(e) => updatePair(row.key, 'code', e.target.value)}
          className="erp-field w-[105px] text-center"
        />
        <button
          type="button"
          onClick={() => onNotify(`بحث في شجرة الحسابات لـ: ${row.label}`)}
          className="erp-classic-btn h-[28px] px-2.5 text-[12px] shrink-0"
        >
          بحث
        </button>
        <input
          value={pair.name}
          onChange={(e) => updatePair(row.key, 'name', e.target.value)}
          className="erp-field w-[165px] bg-[#f1f1f1]"
        />
      </div>
    );
  };

  return (
    <DraggableWindow
      open={open}
      title="خيارات الحسابات العامة"
      width={1220}
      height={700}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 overflow-hidden">
        <div className="flex-1 overflow-y-auto erp-scrollbar pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Right Column */}
            <div className="flex flex-col gap-3">
              {ACCOUNT_OPTION_GROUPS_RIGHT.map((grp, idx) => (
                <div key={idx} className="bg-[#fbfcfe] border border-[#bbc] p-2.5">
                  {grp.map(renderRow)}
                </div>
              ))}
              <label className="flex items-center gap-2.5 font-bold text-[14px] px-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.autoCurrencyDiff}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, autoCurrencyDiff: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#0078d7]"
                />
                <span>عمل قيد فروق العملة تلقائيا</span>
              </label>
            </div>

            {/* Left Column */}
            <div className="flex flex-col gap-3">
              <div className="bg-[#fbfcfe] border border-[#bbc] p-2.5">
                {ACCOUNT_OPTION_GROUP_LEFT.map(renderRow)}
              </div>

              <div className="bg-[#fbfcfe] border border-[#bbc] p-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <label className="w-[220px] font-bold text-[13px]">الطابعة الافتراضية</label>
                  <select
                    value={draft.defaultPrinter}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, defaultPrinter: e.target.value }))
                    }
                    className="erp-field flex-1"
                  >
                    {PRINTERS_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[220px] font-bold text-[13px]">طريقة تسعير الجرد</label>
                  <select
                    value={draft.inventoryPricing}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, inventoryPricing: e.target.value }))
                    }
                    className="erp-field flex-1"
                  >
                    {PRICING_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-[220px] font-bold text-[13px]">
                    سعر الكلفة لحساب أرباح الفواتير
                  </label>
                  <select
                    value={draft.invoiceProfitCost}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, invoiceProfitCost: e.target.value }))
                    }
                    className="erp-field flex-1"
                  >
                    {PRICING_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-2 border-t border-[#ccc] flex items-center justify-center gap-24">
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
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
