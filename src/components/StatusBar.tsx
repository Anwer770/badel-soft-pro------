import React, { useEffect, useState } from 'react';
import { toAr } from '../data/erpDefaults';

interface StatusBarProps {
  username: string;
  year: number;
  toastMessage: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ username, year, toastMessage }) => {
  const [loginTime, setLoginTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let h = now.getHours();
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const m = String(now.getMinutes()).padStart(2, '0');
      setLoginTime(`${toAr(h)}:${toAr(m)} ${ap}`);
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      dir="rtl"
      className="h-[26px] shrink-0 bg-[#f0f0f0] border-t border-[#c4c4c4] px-3 flex items-center justify-between text-[13px] font-bold text-[#111] select-none"
    >
      <div className="flex items-center gap-2.5">
        <span>اسم المستخدم: {username}</span>
        <span className="text-[#888] font-normal">|</span>
        <span>العام: {toAr(year)}</span>
        <span className="text-[#888] font-normal">|</span>
        <span>وقت الدخول: {loginTime}</span>
        <span className="text-[#888] font-normal">|</span>
      </div>
      {toastMessage && (
        <div className="text-[#005499] bg-[#eaf3fc] border border-[#99c8f2] px-2.5 py-0.5 text-[12px] font-bold">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
