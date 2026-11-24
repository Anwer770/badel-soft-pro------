import React from 'react';
import type { MsgConfig } from '../types/erp';
import { TitleBar } from './TitleBar';

interface MessageBoxProps {
  config: MsgConfig | null;
  onResolve: (value: string) => void;
}

export const MessageBox: React.FC<MessageBoxProps> = ({ config, onResolve }) => {
  if (!config) return null;

  const buttons = config.buttons?.length
    ? config.buttons
    : [{ label: 'موافق', value: 'ok', focus: true }];

  return (
    <div
      dir="rtl"
      className="fixed inset-0 bg-black/25 z-[900] flex items-center justify-center p-4"
    >
      <div className="w-[420px] max-w-full bg-[#f0f0f0] border border-[#666] shadow-2xl flex flex-col">
        <TitleBar title={config.title || 'النظام'} onClose={() => onResolve('cancel')} />
        <div className="bg-white px-5 py-6 flex items-center gap-4 border-b border-[#dfdfdf]">
          <div className="shrink-0 w-10 h-10">
            {config.icon === 'warn' ? (
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <path d="M20 3 L38 35 L2 35 Z" fill="#F5C518" stroke="#C79A00" />
                <rect x="17.6" y="13" width="4.8" height="12" rx="2" fill="#3A3000" />
                <circle cx="20" cy="30" r="2.6" fill="#3A3000" />
              </svg>
            ) : config.icon === 'question' ? (
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <circle cx="20" cy="20" r="18" fill="#2A7CD6" />
                <path
                  d="M14 15a6 6 0 1 1 8.5 5.6c-1.8.9-2.5 1.8-2.5 3.4"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="30" r="2.8" fill="#fff" />
              </svg>
            ) : (
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <circle cx="20" cy="20" r="18" fill="#2A7CD6" />
                <rect x="17.4" y="16" width="5.2" height="14" rx="2" fill="#fff" />
                <circle cx="20" cy="10.5" r="3" fill="#fff" />
              </svg>
            )}
          </div>
          <div className="text-[14px] text-black leading-relaxed whitespace-pre-line">{config.text}</div>
        </div>
        <div className="bg-[#f0f0f0] px-4 py-3 flex justify-center gap-3">
          {buttons.map((b) => (
            <button
              key={b.value}
              type="button"
              autoFocus={b.focus}
              onClick={() => onResolve(b.value)}
              className={`erp-classic-btn min-w-[92px] h-[30px] px-4 text-[13px] ${
                b.focus ? 'focused' : ''
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
