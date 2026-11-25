import React, { useEffect, useMemo, useState } from 'react';
import {
  ACCOUNT_OPTION_GROUPS_RIGHT,
  ACCOUNT_OPTION_GROUP_LEFT,
  PRINTERS_LIST,
} from '../data/erpDefaults';
import type { AccountOptionFieldDef } from '../data/erpDefaults';
import type { AccountOptionsState } from '../types/erp';
import { ACCOUNT_TREE_DATA, type AccTreeNode } from './AccountsAndStatementDialogs';
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

function flattenTree(nodes: AccTreeNode[]): { code: string; name: string }[] {
  const out: { code: string; name: string }[] = [];
  for (const n of nodes) {
    out.push({ code: n.code, name: n.name });
    if (n.children?.length) {
      out.push(...flattenTree(n.children));
    }
  }
  return out;
}

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
  const [pickerTarget, setPickerTarget] = useState<AccountOptionFieldDef | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(JSON.parse(JSON.stringify(value)));
      setPickerTarget(null);
      setPickerSearch('');
    }
  }, [open, value]);

  const allAccounts = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of flattenTree(ACCOUNT_TREE_DATA)) {
      map.set(item.code, item.name);
    }
    for (const grp of ACCOUNT_OPTION_GROUPS_RIGHT) {
      for (const f of grp) {
        if (f.defaultCode && !map.has(f.defaultCode)) {
          map.set(f.defaultCode, f.defaultName);
        }
      }
    }
    for (const f of ACCOUNT_OPTION_GROUP_LEFT) {
      if (f.defaultCode && !map.has(f.defaultCode)) {
        map.set(f.defaultCode, f.defaultName);
      }
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, []);

  const filteredAccounts = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return allAccounts;
    return allAccounts.filter(
      (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [allAccounts, pickerSearch]);

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
      <div key={row.key} className="flex items-center gap-1.5 my-1">
        <label className="flex-1 text-[13px] font-bold text-right truncate text-[#111]">
          {row.label}
        </label>
        <input
          dir="ltr"
          value={pair.code}
          onChange={(e) => updatePair(row.key, 'code', e.target.value)}
          className="h-[25px] border border-[#8e98a8] bg-white px-2 text-[13px] font-bold text-left w-[125px] outline-none focus:border-[#0078d7]"
        />
        <button
          type="button"
          onClick={() => {
            setPickerTarget(row);
            setPickerSearch('');
          }}
          className="erp-classic-btn h-[25px] px-2.5 text-[12px] font-bold shrink-0"
        >
          بحث
        </button>
        <input
          value={pair.name}
          onChange={(e) => updatePair(row.key, 'name', e.target.value)}
          className="h-[25px] border border-[#9ba4b2] bg-[#e9edf3] px-2 text-[13px] font-bold text-right w-[178px] outline-none focus:border-[#0078d7]"
        />
      </div>
    );
  };

  return (
    <>
      <DraggableWindow
        open={open}
        title="خيارات الحسابات العامة"
        width={1220}
        height={675}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div className="flex-1 flex flex-col bg-[#dce4ee] p-3 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto erp-scrollbar pr-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Right Column */}
              <div className="flex flex-col gap-2.5">
                {ACCOUNT_OPTION_GROUPS_RIGHT.map((grp, idx) => (
                  <div
                    key={idx}
                    className="bg-[#dce4ee] border border-[#c5cedb] px-2.5 py-1.5"
                  >
                    {grp.map(renderRow)}
                  </div>
                ))}
                <label className="flex items-center gap-2 font-bold text-[13px] px-2 pt-1 cursor-pointer select-none">
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
              <div className="flex flex-col gap-2.5">
                <div className="bg-[#dce4ee] border border-[#c5cedb] px-2.5 py-1.5">
                  {ACCOUNT_OPTION_GROUP_LEFT.map(renderRow)}
                </div>

                <div className="px-1 pt-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <label className="w-[215px] font-bold text-[13px] text-right">
                      الطابعة الافتراضية
                    </label>
                    <select
                      value={draft.defaultPrinter}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, defaultPrinter: e.target.value }))
                      }
                      className="h-[26px] border border-[#8e98a8] bg-[#f4f6f9] px-2 text-[13px] font-bold flex-1 outline-none focus:border-[#0078d7]"
                    >
                      {PRINTERS_LIST.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-[215px] font-bold text-[13px] text-right">
                      طريقة تسعير الجرد
                    </label>
                    <select
                      value={draft.inventoryPricing}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, inventoryPricing: e.target.value }))
                      }
                      className="h-[26px] border border-[#8e98a8] bg-[#f4f6f9] px-2 text-[13px] font-bold flex-1 outline-none focus:border-[#0078d7]"
                    >
                      {PRICING_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-[215px] font-bold text-[13px] text-right">
                      سعر الكلفة لحساب أرباح الفواتير
                    </label>
                    <select
                      value={draft.invoiceProfitCost}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, invoiceProfitCost: e.target.value }))
                      }
                      className="h-[26px] border border-[#8e98a8] bg-[#f4f6f9] px-2 text-[13px] font-bold flex-1 outline-none focus:border-[#0078d7]"
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

          <div className="pt-3 mt-1 flex items-center justify-center gap-28">
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="erp-classic-btn focused w-[135px] h-[32px] text-[13px] font-bold"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={onClose}
              className="erp-classic-btn w-[135px] h-[32px] text-[13px] font-bold"
            >
              خروج
            </button>
          </div>

          {pickerTarget && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center z-20">
              <div className="w-[520px] max-w-[94%] bg-[#f0f0f0] border border-[#707070] shadow-xl flex flex-col">
                <div className="h-[30px] bg-white border-b border-[#ccc] px-3 flex items-center justify-between text-[13px] font-bold">
                  <span>بحث في شجرة الحسابات — {pickerTarget.label}</span>
                  <button
                    type="button"
                    onClick={() => setPickerTarget(null)}
                    className="px-2 hover:bg-[#e81123] hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2.5 flex flex-col gap-2">
                  <input
                    autoFocus
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="ابحث برقم الحساب أو الاسم..."
                    className="erp-field w-full"
                  />
                  <div className="h-[240px] bg-white border border-[#8e8e8e] overflow-y-auto erp-scrollbar">
                    <table className="w-full border-collapse text-[13px]">
                      <thead className="bg-[#f5f6fa] border-b border-[#bbb] sticky top-0">
                        <tr>
                          <th className="py-1.5 px-2 text-right border-l border-[#ddd] w-[140px]">
                            رقم الحساب
                          </th>
                          <th className="py-1.5 px-2 text-right">اسم الحساب</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccounts.map((acc) => (
                          <tr
                            key={acc.code}
                            onClick={() => {
                              setDraft((prev) => ({
                                ...prev,
                                accounts: {
                                  ...prev.accounts,
                                  [pickerTarget.key]: { code: acc.code, name: acc.name },
                                },
                              }));
                              onNotify(`تم اختيار ${acc.name} (${acc.code})`);
                              setPickerTarget(null);
                            }}
                            className="border-b border-[#eee] hover:bg-[#0078d7] hover:text-white cursor-pointer"
                          >
                            <td dir="ltr" className="py-1 px-2 text-right font-mono">
                              {acc.code}
                            </td>
                            <td className="py-1 px-2 text-right font-semibold">{acc.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setPickerTarget(null)}
                      className="erp-classic-btn px-4 h-[28px] text-[12px]"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DraggableWindow>
    </>
  );
};
