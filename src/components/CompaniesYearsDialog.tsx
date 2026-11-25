import React, { useEffect, useRef, useState } from 'react';
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

  const compInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const yearInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (open) {
      setCompList(companies.map((c) => ({ ...c })));
      setYearList(years.map((y) => ({ ...y })));
      setCompSel(0);
      setYearSel(0);
      setActiveGrid('comp');
    }
  }, [open, companies, years]);

  const handleAdd = () => {
    if (activeGrid === 'comp') {
      const nextNum = compList.length ? Math.max(...compList.map((c) => c.num || 0)) + 1 : 1;
      const next = [...compList, { num: nextNum, name: `شركة ${nextNum}` }];
      setCompList(next);
      setCompSel(next.length - 1);
      onSave(next, yearList);
    } else {
      const nextM = yearList.length ? Math.max(...yearList.map((y) => y.m || 0)) + 1 : 1;
      const next = [...yearList, { m: nextM, year: '2026', next: '0', notes: '' }];
      setYearList(next);
      setYearSel(next.length - 1);
      onSave(compList, next);
    }
  };

  const handleEdit = () => {
    onSave(compList, yearList);
    if (activeGrid === 'comp') {
      compInputRefs.current[compSel]?.focus();
    } else {
      yearInputRefs.current[yearSel]?.focus();
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
      onSave(next, yearList);
    } else {
      if (yearSel < 0 || !yearList[yearSel]) return;
      const next = yearList.filter((_, idx) => idx !== yearSel);
      setYearList(next);
      setYearSel(Math.max(0, yearSel - 1));
      onSave(compList, next);
    }
  };

  return (
    <DraggableWindow
      open={open}
      title="بيانات الشركات والسنوات"
      width={920}
      height={470}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={() => {
        onSave(compList, yearList);
        onClose();
      }}
    >
      <div className="flex-1 flex flex-col bg-[#dce4ee] px-2 pt-2 pb-3 gap-2.5 overflow-hidden select-none">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1.5 overflow-hidden">
          {/* Companies Grid */}
          <div className="flex flex-col overflow-hidden">
            <div className="font-bold text-[13px] mb-1 px-1">الشركات</div>
            <div className="flex-1 bg-[#eaeaea] border border-[#8e8e8e] overflow-y-auto erp-scrollbar">
              <table className="w-full border-collapse bg-white text-[13px]">
                <thead className="sticky top-0 bg-[#f4f4f4]">
                  <tr className="border-b border-[#bbb]">
                    <th className="w-[75px] border-l border-[#ccc] py-1 px-2 text-center font-bold">
                      الرقم
                    </th>
                    <th className="border-l border-[#ccc] py-1 px-2 text-center font-bold">الاسم</th>
                    <th className="w-[24px] bg-[#f4f4f4]" />
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
                        className={`border-b border-[#ddd] ${isSel ? 'bg-[#f4f8fd]' : 'bg-white'}`}
                      >
                        <td className="border-l border-[#ccc] py-0.5 px-2 text-left font-bold">
                          {c.num}
                        </td>
                        <td className="border-l border-[#ccc] p-0">
                          <input
                            ref={(el) => {
                              compInputRefs.current[i] = el;
                            }}
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
                            className="w-full h-[24px] px-2 bg-transparent font-bold outline-none focus:bg-[#eaf3fc]"
                          />
                        </td>
                        <td className="text-center text-[10px] bg-[#f0f0f0] border-r border-[#ccc]">
                          {i === compSel ? '▶' : ''}
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
            <div className="font-bold text-[13px] mb-1 px-1">السنوات</div>
            <div className="flex-1 bg-[#eaeaea] border border-[#8e8e8e] overflow-y-auto erp-scrollbar">
              <table className="w-full border-collapse bg-white text-[13px]">
                <thead className="sticky top-0 bg-[#f4f4f4]">
                  <tr className="border-b border-[#bbb]">
                    <th className="w-[40px] border-l border-[#ccc] py-1 px-1 text-center font-bold">
                      م
                    </th>
                    <th className="w-[82px] border-l border-[#ccc] py-1 px-2 text-center font-bold">
                      العام
                    </th>
                    <th className="w-[100px] border-l border-[#ccc] py-1 px-2 text-center font-bold">
                      رقم العام التالي
                    </th>
                    <th className="border-l border-[#ccc] py-1 px-2 text-center font-bold">
                      ملاحظات
                    </th>
                    <th className="w-[24px] bg-[#f4f4f4]" />
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
                        className={`border-b border-[#ddd] ${isSel ? 'bg-[#f4f8fd]' : 'bg-white'}`}
                      >
                        <td className="border-l border-[#ccc] py-0.5 px-2 text-center font-bold">
                          {y.m}
                        </td>
                        <td className="border-l border-[#ccc] p-0">
                          <input
                            ref={(el) => {
                              yearInputRefs.current[i] = el;
                            }}
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
                            className="w-full h-[24px] px-2 text-left font-bold bg-transparent outline-none focus:bg-[#eaf3fc]"
                            dir="ltr"
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
                            className="w-full h-[24px] px-2 text-left font-bold bg-transparent outline-none focus:bg-[#eaf3fc]"
                            dir="ltr"
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
                            className="w-full h-[24px] px-2 bg-transparent outline-none focus:bg-[#eaf3fc]"
                          />
                        </td>
                        <td className="text-center text-[10px] bg-[#f0f0f0] border-r border-[#ccc]">
                          {i === yearSel ? '▶' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleAdd}
            className="erp-classic-btn focused w-[140px] h-[34px] text-[13px]"
          >
            اضافه
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="erp-classic-btn w-[140px] h-[34px] text-[13px]"
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="erp-classic-btn w-[140px] h-[34px] text-[13px]"
          >
            حذف
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(compList, yearList);
              onClose();
            }}
            className="erp-classic-btn w-[140px] h-[34px] text-[13px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
