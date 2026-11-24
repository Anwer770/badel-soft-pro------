import React, { useState } from 'react';

interface CalendarPopupProps {
  open: boolean;
  value: string; // YYYY/MM/DD
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];
const DOWS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const CalendarPopup: React.FC<CalendarPopupProps> = ({ open, value, onSelect, onClose }) => {
  const parts = (value || '2026/01/01').split('/');
  const [calYear, setCalYear] = useState(Number(parts[0]) || 2026);
  const [calMonth, setCalMonth] = useState((Number(parts[1]) || 1) - 1);

  if (!open) return null;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  const cells: { day: number; year: number; month: number; isOther: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    if (i < firstDay) {
      let m = calMonth - 1;
      let y = calYear;
      if (m < 0) {
        m = 11;
        y--;
      }
      cells.push({ day: prevMonthDays - firstDay + 1 + i, year: y, month: m, isOther: true });
    } else if (i - firstDay + 1 > daysInMonth) {
      let m = calMonth + 1;
      let y = calYear;
      if (m > 11) {
        m = 0;
        y++;
      }
      cells.push({ day: i - firstDay + 1 - daysInMonth, year: y, month: m, isOther: true });
    } else {
      cells.push({ day: i - firstDay + 1, year: calYear, month: calMonth, isOther: false });
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[320] flex items-center justify-center bg-black/15"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[260px] bg-white border border-[#7a7a7a] shadow-xl p-2 select-none"
      >
        <div className="flex items-center justify-between bg-[#f0f0f0] border border-[#dadada] px-2 py-1 mb-1.5">
          <button
            type="button"
            onClick={() => {
              if (calMonth === 0) {
                setCalMonth(11);
                setCalYear((y) => y - 1);
              } else {
                setCalMonth((m) => m - 1);
              }
            }}
            className="px-2 py-0.5 hover:bg-[#e5f1fb] font-bold cursor-pointer"
          >
            ▸
          </button>
          <span className="font-bold text-[13px]">
            {MONTHS[calMonth]} {calYear}
          </span>
          <button
            type="button"
            onClick={() => {
              if (calMonth === 11) {
                setCalMonth(0);
                setCalYear((y) => y + 1);
              } else {
                setCalMonth((m) => m + 1);
              }
            }}
            className="px-2 py-0.5 hover:bg-[#e5f1fb] font-bold cursor-pointer"
          >
            ◂
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[12px]">
          {DOWS.map((d) => (
            <div key={d} className="font-bold text-[#666] py-1 text-[11px]">
              {d}
            </div>
          ))}
          {cells.map((c, idx) => {
            const ds = `${c.year}/${pad(c.month + 1)}/${pad(c.day)}`;
            const isSel = ds === value;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelect(ds);
                  onClose();
                }}
                className={`py-1 text-[12px] cursor-pointer ${
                  isSel
                    ? 'bg-[#0078d7] text-white font-bold'
                    : c.isOther
                    ? 'text-[#999] hover:bg-[#e5f3ff]'
                    : 'text-black hover:bg-[#e5f3ff]'
                }`}
              >
                {c.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
