import React, { useEffect, useState } from 'react';
import type { CompanyRecord, MsgConfig, YearRecord } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

interface CompaniesYearsDialogProps {
  open: boolean;
  zIndex: number;
  companies: CompanyRecord[];
  years: YearRecord[];
  onFocus: () => void;
  onClose: () => void;
  onSave: (companies: CompanyRecord[], years: YearRecord[]) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
}

export const CompaniesYearsDialog: React.FC<CompaniesYearsDialogProps> = ({
  open,
  zIndex,
  companies,
  years,
  onFocus,
  onClose,
  onSave,
  onShowMsg,
}) => {
  const [compList, setCompList] = useState<CompanyRecord[]>(companies);
  const [yearList, setYearList] = useState<YearRecord[]>(years);
  const [activeGrid, setActiveGrid] = useState<'comp' | 'year'>('comp');
  const [compSel, setCompSel] = useState(0);
  const [yearSel, setYearSel] = useState(0);

  useEffect(() => {
    if (open) {
      setCompList(companies.map((c) => ({ ...c })));
      setYearList(years.map((y) => ({ ...y })));
      setCompSel(0);
      setYearSel(0);
    }
  }, [open, companies, years]);

  const handleAdd = () => {
    if (activeGrid === 'comp') {
      const nextNum = compList.length ? Math.max(...compList.map((c) => c.num || 0)) + 1 : 1;
      const next = [...compList, { num: nextNum, name: `شركة ${nextNum}` }];
      setCompList(next);
      setCompSel(next.length - 1);
    } else {
      const nextM = yearList.length ? Math.max(...yearList.map((y) => y.m || 0)) + 1 : 1;
      const next = [...yearList, { m: nextM, year: '2026', next: '0', notes: '' }];
      setYearList(next);
      setYearSel(next.length - 1);
    }
  };

  const handleDelete = async () => {
    if (activeGrid === 'comp') {
      if (compSel < 0 || !compList[compSel]) return;
      if (compList.length <= 1) {
        await onShowMsg({
          title: 'بيانات الشركات',
          icon: 'warn',
          text: 'يجب الإبقاء على شركة واحدة على الأقل.',
        });
        return;
      }
      const next = compList.filter((_, idx) => idx !== compSel);
      setCompList(next);
      setCompSel(Math.max(0, compSel - 1));
    } else {
      if (yearSel < 0 || !yearList[yearSel]) return;
      const next = yearList.filter((_, idx) => idx !== yearSel);
      setYearList(next);
      setYearSel(Math.max(0, yearSel - 1));
    }
  };

  return (
    <DraggableWindow
      open={open}
      title="بيانات الشركات والسنوات"
      width={1160}
      height={620}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={() => {
        onSave(compList, yearList);
        onClose();
      }}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 gap-3 overflow-hidden">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          {/* Companies Grid */}
          <div className="flex flex-col overflow-hidden">
            <div className="font-extrabold text-[14px] mb-1.5">الشركات</div>
            <div className="flex-1 bg-white border border-[#8e8e8e] overflow-y-auto erp-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f4f6fa] border-b border-[#999]">
                    <th className="w-20 border-l border-[#ccc] py-1.5 px-2 text-center">الرقم</th>
                    <th className="border-l border-[#ccc] py-1.5 px-2 text-center">الاسم</th>
                    <th className="w-8 bg-[#ececec]" />
                  </tr>
                </thead>
                <tbody>
                  {compList.map((c, i) => {
                    const isSel = activeGrid === 'comp' && i === compSel;
                    return (
                      <tr
                        key={`${c.num}-${i}`}
                        onClick={() => {
                          setActiveGrid('comp');
                          setCompSel(i);
                        }}
                        className={`border-b border-[#ccc] ${isSel ? 'bg-[#eaf3fc]' : ''}`}
                      >
                        <td className="border-l border-[#ccc] py-1 px-2 text-center font-semibold">
                          {c.num}
                        </td>
                        <td className="border-l border-[#ccc] p-0">
                          <input
                            value={c.name}
                            onFocus={() => {
                              setActiveGrid('comp');
                              setCompSel(i);
                            }}
                            onChange={(e) => {
                              const next = [...compList];
                              next[i] = { ...next[i], name: e.target.value };
                              setCompList(next);
                            }}
                            className="w-full h-8 px-2.5 bg-transparent outline-none focus:bg-[#eaf3fc]"
                          />
                        </td>
                        <td className="text-center text-[11px] bg-[#ececec]">
                          {i === compSel ? '◀' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Years Grid */}
          <div className="flex flex-col overflow-hidden">
            <div className="font-extrabold text-[14px] mb-1.5">السنوات</div>
            <div className="flex-1 bg-white border border-[#8e8e8e] overflow-y-auto erp-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f4f6fa] border-b border-[#999]">
                    <th className="w-12 border-l border-[#ccc] py-1.5 px-1 text-center">م</th>
                    <th className="w-24 border-l border-[#ccc] py-1.5 px-2 text-center">العام</th>
                    <th className="w-28 border-l border-[#ccc] py-1.5 px-2 text-center">
                      رقم العام التالي
                    </th>
                    <th className="border-l border-[#ccc] py-1.5 px-2 text-center">ملاحظات</th>
                    <th className="w-8 bg-[#ececec]" />
                  </tr>
                </thead>
                <tbody>
                  {yearList.map((y, i) => {
                    const isSel = activeGrid === 'year' && i === yearSel;
                    return (
                      <tr
                        key={`${y.m}-${i}`}
                        onClick={() => {
                          setActiveGrid('year');
                          setYearSel(i);
                        }}
                        className={`border-b border-[#ccc] ${isSel ? 'bg-[#eaf3fc]' : ''}`}
                      >
                        <td className="border-l border-[#ccc] py-1 px-2 text-center font-semibold">
                          {y.m}
                        </td>
                        <td className="border-l border-[#ccc] p-0">
                          <input
                            value={y.year}
                            onFocus={() => {
                              setActiveGrid('year');
                              setYearSel(i);
                            }}
                            onChange={(e) => {
                              const next = [...yearList];
                              next[i] = { ...next[i], year: e.target.value };
                              setYearList(next);
                            }}
                            className="w-full h-8 px-2 text-center bg-transparent outline-none focus:bg-[#eaf3fc]"
                          />
                        </td>
                        <td className="border-l border-[#ccc] p-0">
                          <input
                            value={y.next}
                            onFocus={() => {
                              setActiveGrid('year');
                              setYearSel(i);
                            }}
                            onChange={(e) => {
                              const next = [...yearList];
                              next[i] = { ...next[i], next: e.target.value };
                              setYearList(next);
                            }}
                            className="w-full h-8 px-2 text-center bg-transparent outline-none focus:bg-[#eaf3fc]"
                          />
                        </td>
                        <td className="border-l border-[#ccc] p-0">
                          <input
                            value={y.notes}
                            onFocus={() => {
                              setActiveGrid('year');
                              setYearSel(i);
                            }}
                            onChange={(e) => {
                              const next = [...yearList];
                              next[i] = { ...next[i], notes: e.target.value };
                              setYearList(next);
                            }}
                            className="w-full h-8 px-2 bg-transparent outline-none focus:bg-[#eaf3fc]"
                          />
                        </td>
                        <td className="text-center text-[11px] bg-[#ececec]">
                          {i === yearSel ? '◀' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2 border-t border-[#ccc]">
          <button
            type="button"
            onClick={handleAdd}
            className="erp-classic-btn focused w-[135px] h-[34px] text-[14px]"
          >
            اضافه
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(compList, yearList);
              onShowMsg({
                title: 'بيانات الشركات والسنوات',
                icon: 'info',
                text: 'تم حفظ التعديلات بنجاح.',
              });
            }}
            className="erp-classic-btn w-[135px] h-[34px] text-[14px]"
          >
            حفظ التعديل
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="erp-classic-btn w-[135px] h-[34px] text-[14px]"
          >
            حذف
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(compList, yearList);
              onClose();
            }}
            className="erp-classic-btn w-[135px] h-[34px] text-[14px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
