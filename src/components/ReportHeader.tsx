import React from 'react';
import type { GeneralPropsState } from '../types/erp';
import { useReportProps } from './ReportPropsContext';

interface ReportHeaderProps {
  /** تُقرأ من ReportPropsProvider عند عدم تمريرها */
  props?: GeneralPropsState | null;
  /** Optional extra info rendered on the opposite side (period, user, year…) */
  meta?: React.ReactNode;
  subtitle?: string;
  compact?: boolean;
}

/**
 * ترويسة تقارير موحّدة: الشعار + اسم الشركة + العنوان والتلفون والرقم الضريبي.
 * تحترم خيار «توسيط الترويسة لكافة التقارير» من خصائص الملف.
 */
export const ReportHeader: React.FC<ReportHeaderProps> = ({
  props: propsProp,
  meta,
  subtitle,
  compact,
}) => {
  const ctxProps = useReportProps();
  const props = propsProp || ctxProps;
  if (!props) return null;
  const centered = Boolean(props.centerHeader);
  const nameAr = props.hdrArName || props.company || 'النظام';
  const logo = props.logoData || undefined;
  const titleSize = compact ? 'text-[15px]' : 'text-[17px]';

  return (
    <div
      dir="rtl"
      className={`bg-white border border-[#8e8e8e] ${compact ? 'px-3 py-2' : 'px-4 py-3'} flex ${
        centered ? 'flex-col items-center text-center gap-1' : 'items-center justify-between gap-3'
      }`}
    >
      {centered ? (
        <>
          {logo && (
            <img
              src={logo}
              alt="شعار الشركة"
              referrerPolicy="no-referrer"
              className={compact ? 'max-h-[38px] object-contain' : 'max-h-[52px] object-contain'}
            />
          )}
          <div className={`font-extrabold ${titleSize}`}>{nameAr}</div>
          {subtitle && <div className="text-[12px] text-[#333] font-bold">{subtitle}</div>}
          {(props.hdrArAddr || props.hdrArTel || props.taxNumber) && (
            <div className="text-[11px] text-[#555]">
              {[props.hdrArAddr, props.hdrArTel && `تلفون: ${props.hdrArTel}`, props.taxNumber && `الرقم الضريبي: ${props.taxNumber}`]
                .filter(Boolean)
                .join('  —  ')}
            </div>
          )}
          {meta && <div className="text-[12px] text-[#333]">{meta}</div>}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5 min-w-0">
            {logo && (
              <img
                src={logo}
                alt="شعار الشركة"
                referrerPolicy="no-referrer"
                className={compact ? 'max-h-[34px] object-contain' : 'max-h-[46px] object-contain'}
              />
            )}
            <div className="min-w-0">
              <div className={`font-extrabold ${titleSize} truncate`}>{nameAr}</div>
              {subtitle && <div className="text-[12px] text-[#333] font-bold">{subtitle}</div>}
              {(props.hdrArAddr || props.hdrArTel) && (
                <div className="text-[11px] text-[#555] truncate">
                  {[props.hdrArAddr, props.hdrArTel && `تلفون: ${props.hdrArTel}`]
                    .filter(Boolean)
                    .join('  —  ')}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {meta}
          </div>
        </>
      )}
    </div>
  );
};
