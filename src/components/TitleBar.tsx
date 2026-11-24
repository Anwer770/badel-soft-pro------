import React from 'react';

interface TitleBarProps {
  title: string;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
  isMain?: boolean;
}

export function AppWindowIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="3" y="1" width="7" height="7" fill="#F5C518" stroke="#B8860B" strokeWidth="0.6" />
      <rect x="1" y="9" width="7" height="7" fill="#E03A3A" stroke="#A02020" strokeWidth="0.6" />
      <rect x="9" y="9" width="7" height="7" fill="#3A6FD8" stroke="#2A4FA0" strokeWidth="0.6" />
    </svg>
  );
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  onMinimize,
  onMaximize,
  onClose,
  onDragStart,
  isMain = false,
}) => {
  return (
    <div
      dir="rtl"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onDragStart?.(e);
      }}
      className={`h-[34px] shrink-0 bg-white border-b border-[#dadada] flex items-center select-none pr-3 ${
        onDragStart ? 'cursor-move' : ''
      } ${isMain ? '' : 'bg-gradient-to-b from-white to-[#edf1fa]'}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AppWindowIcon />
        <span className="text-[13px] font-semibold text-black truncate">{title}</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center h-full">
        {onMinimize && (
          <button
            type="button"
            title="تصغير"
            onClick={onMinimize}
            className="w-[44px] h-[34px] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors cursor-pointer"
          >
            <svg className="w-[11px] h-[11px] stroke-[#222]" viewBox="0 0 11 11" strokeWidth="1.2">
              <line x1="1" y1="6" x2="10" y2="6" />
            </svg>
          </button>
        )}
        {onMaximize && (
          <button
            type="button"
            title="استعادة / تكبير"
            onClick={onMaximize}
            className="w-[44px] h-[34px] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors cursor-pointer"
          >
            <svg
              className="w-[11px] h-[11px] stroke-[#222] fill-none"
              viewBox="0 0 11 11"
              strokeWidth="1.2"
            >
              <rect x="1.5" y="1.5" width="8" height="8" />
            </svg>
          </button>
        )}
        {onClose && (
          <button
            type="button"
            title="إغلاق"
            onClick={onClose}
            className="w-[44px] h-[34px] flex items-center justify-center hover:bg-[#e81123] hover:text-white group transition-colors cursor-pointer"
          >
            <svg
              className="w-[11px] h-[11px] stroke-[#222] group-hover:stroke-white"
              viewBox="0 0 11 11"
              strokeWidth="1.2"
            >
              <line x1="1" y1="1" x2="10" y2="10" />
              <line x1="10" y1="1" x2="1" y2="10" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
