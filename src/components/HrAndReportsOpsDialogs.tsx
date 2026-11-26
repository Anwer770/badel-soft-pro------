import React, { useEffect, useMemo, useState } from 'react';
import { toAr } from '../data/erpDefaults';
import type {
  AttendanceRecord,
  DepartmentRecord,
  EmployeeRecord,
  ErpState,
  HrAdjustmentRecord,
  JournalEntry,
  LeaveRecord,
  MsgConfig,
} from '../types/erp';
import { ReportHeader } from './ReportHeader';
import { DraggableWindow } from './DraggableWindow';

export type HrOpsMode =
  | 'employees'
  | 'browseEmployees'
  | 'departments'
  | 'attendance'
  | 'manualAttendance'
  | 'leaves'
  | 'payroll'
  | 'advances'
  | 'penalties'
  | 'bonuses'
  | 'reports';

const HR_MODE_TITLES: Record<HrOpsMode, string> = {
  employees: 'اضافة موظف جديد',
  browseEmployees: 'استعراض وتعديل الموظفين',
  departments: 'الاقسام',
  attendance: 'ادارة الحضور',
  manualAttendance: 'التسجيل اليدوي للحضور والانصراف',
  leaves: 'الإجازات',
  payroll: 'الرواتب والأجور',
  advances: 'السلف النقدية',
  penalties: 'العقوبات المالية',
  bonuses: 'الاضافات والمكافآت',
  reports: 'تقارير تفصيلية - شؤون الموظفين',
};

interface HrOpsDialogProps {
  open: boolean;
  mode: HrOpsMode;
  zIndex: number;
  employees: EmployeeRecord[];
  departments: DepartmentRecord[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  hrAdjustments: HrAdjustmentRecord[];
  onFocus: () => void;
  onClose: () => void;
  onSaveEmployees: (next: EmployeeRecord[]) => void;
  onSaveDepartments: (next: DepartmentRecord[]) => void;
  onSaveAttendance: (next: AttendanceRecord[]) => void;
  onSaveLeaves: (next: LeaveRecord[]) => void;
  onSaveAdjustments: (next: HrAdjustmentRecord[]) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const HrOpsDialog: React.FC<HrOpsDialogProps> = ({
  open,
  mode,
  zIndex,
  employees,
  departments,
  attendance,
  leaves,
  hrAdjustments,
  onFocus,
  onClose,
  onSaveEmployees,
  onSaveDepartments,
  onSaveAttendance,
  onSaveLeaves,
  onSaveAdjustments,
  onShowMsg,
  onNotify,
}) => {
  const [activeMode, setActiveMode] = useState<HrOpsMode>(mode);
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  // Employee form
  const [empEditId, setEmpEditId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({
    code: '',
    name: '',
    department: departments[0]?.name || 'الإدارة المالية',
    jobTitle: '',
    baseSalary: '0',
    phone: '',
    hireDate: today,
    active: true,
  });

  // Department form
  const [depEditId, setDepEditId] = useState<string | null>(null);
  const [depForm, setDepForm] = useState({ code: '', name: '', manager: '', notes: '' });

  // Attendance form
  const [attForm, setAttForm] = useState({
    date: today,
    employeeName: employees[0]?.name || '',
    checkIn: '08:00',
    checkOut: '16:00',
    status: 'حاضر' as AttendanceRecord['status'],
    notes: '',
  });

  // Leave form
  const [leaveForm, setLeaveForm] = useState({
    employeeName: employees[0]?.name || '',
    leaveType: 'سنوية' as LeaveRecord['leaveType'],
    fromDate: today,
    toDate: today,
    days: '1',
    notes: '',
  });

  // Adjustment form (advance/penalty/bonus)
  const [adjForm, setAdjForm] = useState({
    date: today,
    employeeName: employees[0]?.name || '',
    amount: '',
    reason: '',
  });

  useEffect(() => {
    if (!open) return;
    setActiveMode(mode);
    setSearch('');
    if (mode === 'employees') {
      setEmpEditId(null);
      setEmpForm({
        code: String(1001 + employees.length),
        name: '',
        department: departments[0]?.name || 'الإدارة المالية',
        jobTitle: '',
        baseSalary: '0',
        phone: '',
        hireDate: today,
        active: true,
      });
    }
    if (employees[0]) {
      setAttForm((p) => ({ ...p, employeeName: p.employeeName || employees[0].name }));
      setLeaveForm((p) => ({ ...p, employeeName: p.employeeName || employees[0].name }));
      setAdjForm((p) => ({ ...p, employeeName: p.employeeName || employees[0].name }));
    }
  }, [open, mode, employees, departments, today]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const payrollRows = useMemo(() => {
    return employees.map((emp) => {
      const adjs = hrAdjustments.filter((a) => a.employeeName === emp.name);
      const advances = adjs.filter((a) => a.kind === 'advance').reduce((s, a) => s + a.amount, 0);
      const penalties = adjs.filter((a) => a.kind === 'penalty').reduce((s, a) => s + a.amount, 0);
      const bonuses = adjs.filter((a) => a.kind === 'bonus').reduce((s, a) => s + a.amount, 0);
      const net = emp.baseSalary + bonuses - advances - penalties;
      return { emp, advances, penalties, bonuses, net };
    });
  }, [employees, hrAdjustments]);

  const currentAdjKind: HrAdjustmentRecord['kind'] =
    activeMode === 'penalties' ? 'penalty' : activeMode === 'bonuses' ? 'bonus' : 'advance';

  return (
    <DraggableWindow
      open={open}
      title={HR_MODE_TITLES[activeMode]}
      width={1000}
      height={650}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#dce4ee] p-3 gap-2.5 overflow-hidden text-[13px]">
        <div className="flex flex-wrap items-center gap-1 pb-2 border-b border-[#b9c4d4]">
          {(
            [
              ['employees', 'اضافة موظف'],
              ['browseEmployees', 'الموظفين'],
              ['departments', 'الاقسام'],
              ['attendance', 'ادارة الحضور'],
              ['leaves', 'الإجازات'],
              ['payroll', 'الرواتب'],
              ['advances', 'السلف'],
              ['penalties', 'العقوبات'],
              ['bonuses', 'الاضافات'],
              ['reports', 'التقارير التفصيلية'],
            ] as [HrOpsMode, string][]
          ).map(([m, lbl]) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMode(m)}
              className={`erp-classic-btn px-2.5 h-[26px] text-[12px] ${
                activeMode === m ? 'focused font-bold' : ''
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {(activeMode === 'employees' || activeMode === 'browseEmployees') && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-2 overflow-hidden">
            <div className="flex flex-col gap-2 overflow-hidden">
              <div className="flex items-center gap-2 bg-[#eef3f9] border border-[#b9c4d4] p-2">
                <label className="font-bold shrink-0">بحث</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="اسم الموظف أو الرقم أو القسم"
                  className="erp-field flex-1"
                />
              </div>
              <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#cfdce8] sticky top-0">
                      <th className="border border-[#9aa7b8] p-1.5">الرقم</th>
                      <th className="border border-[#9aa7b8] p-1.5">اسم الموظف</th>
                      <th className="border border-[#9aa7b8] p-1.5">القسم</th>
                      <th className="border border-[#9aa7b8] p-1.5">المسمى الوظيفي</th>
                      <th className="border border-[#9aa7b8] p-1.5">الراتب الأساسي</th>
                      <th className="border border-[#9aa7b8] p-1.5">الهاتف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        onClick={() => {
                          setEmpEditId(emp.id);
                          setEmpForm({
                            code: emp.code,
                            name: emp.name,
                            department: emp.department,
                            jobTitle: emp.jobTitle,
                            baseSalary: String(emp.baseSalary),
                            phone: emp.phone,
                            hireDate: emp.hireDate,
                            active: emp.active,
                          });
                        }}
                        className={`cursor-pointer ${
                          empEditId === emp.id ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                        }`}
                      >
                        <td className="border border-[#d5dce6] p-1.5 text-center">{emp.code}</td>
                        <td className="border border-[#d5dce6] p-1.5 font-bold">{emp.name}</td>
                        <td className="border border-[#d5dce6] p-1.5">{emp.department}</td>
                        <td className="border border-[#d5dce6] p-1.5">{emp.jobTitle}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">
                          {emp.baseSalary.toLocaleString()}
                        </td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{emp.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 flex flex-col gap-2 overflow-y-auto">
              <div className="font-bold border-b border-[#cbd4e0] pb-1">
                {empEditId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </div>
              <label className="font-bold text-[12px]">الرقم الوظيفي</label>
              <input
                value={empForm.code}
                onChange={(e) => setEmpForm((p) => ({ ...p, code: e.target.value }))}
                className="erp-field"
              />
              <label className="font-bold text-[12px]">اسم الموظف</label>
              <input
                value={empForm.name}
                onChange={(e) => setEmpForm((p) => ({ ...p, name: e.target.value }))}
                className="erp-field"
              />
              <label className="font-bold text-[12px]">القسم</label>
              <select
                value={empForm.department}
                onChange={(e) => setEmpForm((p) => ({ ...p, department: e.target.value }))}
                className="erp-field bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <label className="font-bold text-[12px]">المسمى الوظيفي</label>
              <input
                value={empForm.jobTitle}
                onChange={(e) => setEmpForm((p) => ({ ...p, jobTitle: e.target.value }))}
                className="erp-field"
              />
              <label className="font-bold text-[12px]">الراتب الأساسي</label>
              <input
                type="number"
                value={empForm.baseSalary}
                onChange={(e) => setEmpForm((p) => ({ ...p, baseSalary: e.target.value }))}
                className="erp-field text-center"
              />
              <label className="font-bold text-[12px]">الهاتف</label>
              <input
                value={empForm.phone}
                onChange={(e) => setEmpForm((p) => ({ ...p, phone: e.target.value }))}
                className="erp-field"
              />
              <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmpEditId(null);
                    setEmpForm({
                      code: String(1001 + employees.length),
                      name: '',
                      department: departments[0]?.name || 'الإدارة المالية',
                      jobTitle: '',
                      baseSalary: '0',
                      phone: '',
                      hireDate: today,
                      active: true,
                    });
                  }}
                  className="erp-classic-btn px-3 h-[28px]"
                >
                  جديد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!empForm.name.trim()) {
                      onNotify('أدخل اسم الموظف');
                      return;
                    }
                    const rec: EmployeeRecord = {
                      id: empEditId || `emp-${Date.now()}`,
                      code: empForm.code,
                      name: empForm.name.trim(),
                      department: empForm.department,
                      jobTitle: empForm.jobTitle.trim(),
                      baseSalary: parseFloat(empForm.baseSalary) || 0,
                      phone: empForm.phone.trim(),
                      hireDate: empForm.hireDate,
                      active: empForm.active,
                    };
                    onSaveEmployees(
                      empEditId ? employees.map((e) => (e.id === empEditId ? rec : e)) : [...employees, rec]
                    );
                    setEmpEditId(rec.id);
                    onNotify(`تم حفظ بيانات الموظف «${rec.name}»`);
                  }}
                  className="erp-classic-btn focused flex-1 h-[28px]"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  disabled={!empEditId}
                  onClick={async () => {
                    if (!empEditId) return;
                    const res = await onShowMsg({
                      title: 'حذف موظف',
                      icon: 'question',
                      text: 'هل تريد حذف الموظف المحدد؟',
                      buttons: [
                        { label: 'نعم', value: 'yes' },
                        { label: 'لا', value: 'no', focus: true },
                      ],
                    });
                    if (res === 'yes') {
                      onSaveEmployees(employees.filter((e) => e.id !== empEditId));
                      setEmpEditId(null);
                      onNotify('تم حذف الموظف');
                    }
                  }}
                  className="erp-classic-btn px-3 h-[28px] disabled:opacity-50"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'departments' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 overflow-hidden">
            <div className="bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرمز</th>
                    <th className="border border-[#9aa7b8] p-1.5">اسم القسم</th>
                    <th className="border border-[#9aa7b8] p-1.5">رئيس القسم</th>
                    <th className="border border-[#9aa7b8] p-1.5">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => {
                        setDepEditId(d.id);
                        setDepForm({ code: d.code, name: d.name, manager: d.manager, notes: d.notes });
                      }}
                      className={`cursor-pointer ${
                        depEditId === d.id ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                      }`}
                    >
                      <td className="border border-[#d5dce6] p-1.5 text-center">{d.code}</td>
                      <td className="border border-[#d5dce6] p-1.5 font-bold">{d.name}</td>
                      <td className="border border-[#d5dce6] p-1.5">{d.manager}</td>
                      <td className="border border-[#d5dce6] p-1.5">{d.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 flex flex-col gap-2">
              <div className="font-bold border-b border-[#cbd4e0] pb-1">بيانات القسم</div>
              <label className="font-bold text-[12px]">الرمز</label>
              <input value={depForm.code} onChange={(e) => setDepForm((p) => ({ ...p, code: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">اسم القسم</label>
              <input value={depForm.name} onChange={(e) => setDepForm((p) => ({ ...p, name: e.target.value }))} className="erp-field" />
              <label className="font-bold text-[12px]">رئيس القسم</label>
              <input value={depForm.manager} onChange={(e) => setDepForm((p) => ({ ...p, manager: e.target.value }))} className="erp-field" />
              <div className="mt-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDepEditId(null);
                    setDepForm({ code: `D-0${departments.length + 1}`, name: '', manager: '', notes: '' });
                  }}
                  className="erp-classic-btn px-3 h-[28px]"
                >
                  جديد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!depForm.name.trim()) {
                      onNotify('أدخل اسم القسم');
                      return;
                    }
                    const rec: DepartmentRecord = { id: depEditId || `dep-${Date.now()}`, ...depForm };
                    onSaveDepartments(
                      depEditId ? departments.map((d) => (d.id === depEditId ? rec : d)) : [...departments, rec]
                    );
                    onNotify('تم حفظ القسم');
                  }}
                  className="erp-classic-btn focused flex-1 h-[28px]"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {(activeMode === 'attendance' || activeMode === 'manualAttendance') && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">الموظف</label>
                <select
                  value={attForm.employeeName}
                  onChange={(e) => setAttForm((p) => ({ ...p, employeeName: e.target.value }))}
                  className="erp-field bg-white"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">التاريخ</label>
                <input
                  type="date"
                  value={attForm.date}
                  onChange={(e) => setAttForm((p) => ({ ...p, date: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">الحضور</label>
                <input
                  type="time"
                  value={attForm.checkIn}
                  onChange={(e) => setAttForm((p) => ({ ...p, checkIn: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">الانصراف</label>
                <input
                  type="time"
                  value={attForm.checkOut}
                  onChange={(e) => setAttForm((p) => ({ ...p, checkOut: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">الحالة</label>
                <select
                  value={attForm.status}
                  onChange={(e) =>
                    setAttForm((p) => ({ ...p, status: e.target.value as AttendanceRecord['status'] }))
                  }
                  className="erp-field bg-white"
                >
                  <option value="حاضر">حاضر</option>
                  <option value="متأخر">متأخر</option>
                  <option value="غائب">غائب</option>
                  <option value="إجازة">إجازة</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!attForm.employeeName) {
                    onNotify('اختر الموظف');
                    return;
                  }
                  const rec: AttendanceRecord = { id: `att-${Date.now()}`, ...attForm };
                  onSaveAttendance([rec, ...attendance]);
                  onNotify(`تم تسجيل حضور/انصراف ${rec.employeeName}`);
                }}
                className="erp-classic-btn focused h-[28px]"
              >
                تسجيل الدوام
              </button>
            </div>
            <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">التاريخ</th>
                    <th className="border border-[#9aa7b8] p-1.5">الموظف</th>
                    <th className="border border-[#9aa7b8] p-1.5">وقت الحضور</th>
                    <th className="border border-[#9aa7b8] p-1.5">وقت الانصراف</th>
                    <th className="border border-[#9aa7b8] p-1.5">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#666]">
                        لا توجد سجلات حضور مسجلة.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-[#eaf3fc]">
                        <td className="border border-[#d5dce6] p-1.5 text-center">{a.date}</td>
                        <td className="border border-[#d5dce6] p-1.5 font-bold">{a.employeeName}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{a.checkIn}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{a.checkOut}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{a.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeMode === 'leaves' && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">الموظف</label>
                <select
                  value={leaveForm.employeeName}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, employeeName: e.target.value }))}
                  className="erp-field bg-white"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">نوع الإجازة</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) =>
                    setLeaveForm((p) => ({ ...p, leaveType: e.target.value as LeaveRecord['leaveType'] }))
                  }
                  className="erp-field bg-white"
                >
                  <option value="سنوية">سنوية</option>
                  <option value="مرضية">مرضية</option>
                  <option value="اضطرارية">اضطرارية</option>
                  <option value="بدون راتب">بدون راتب</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">من تاريخ</label>
                <input
                  type="date"
                  value={leaveForm.fromDate}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, fromDate: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">إلى تاريخ</label>
                <input
                  type="date"
                  value={leaveForm.toDate}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, toDate: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">الأيام</label>
                <input
                  type="number"
                  value={leaveForm.days}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, days: e.target.value }))}
                  className="erp-field text-center"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const rec: LeaveRecord = {
                    id: `lv-${Date.now()}`,
                    employeeName: leaveForm.employeeName,
                    leaveType: leaveForm.leaveType,
                    fromDate: leaveForm.fromDate,
                    toDate: leaveForm.toDate,
                    days: parseInt(leaveForm.days, 10) || 1,
                    notes: leaveForm.notes,
                  };
                  onSaveLeaves([rec, ...leaves]);
                  onNotify('تم حفظ الإجازة');
                }}
                className="erp-classic-btn focused h-[28px]"
              >
                إضافة إجازة
              </button>
            </div>
            <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الموظف</th>
                    <th className="border border-[#9aa7b8] p-1.5">نوع الإجازة</th>
                    <th className="border border-[#9aa7b8] p-1.5">من تاريخ</th>
                    <th className="border border-[#9aa7b8] p-1.5">إلى تاريخ</th>
                    <th className="border border-[#9aa7b8] p-1.5">الأيام</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#666]">
                        لا توجد إجازات مسجلة.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-[#eaf3fc]">
                        <td className="border border-[#d5dce6] p-1.5 font-bold">{l.employeeName}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{l.leaveType}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{l.fromDate}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{l.toDate}</td>
                        <td className="border border-[#d5dce6] p-1.5 text-center">{l.days}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeMode === 'advances' || activeMode === 'penalties' || activeMode === 'bonuses') && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-3 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">الموظف</label>
                <select
                  value={adjForm.employeeName}
                  onChange={(e) => setAdjForm((p) => ({ ...p, employeeName: e.target.value }))}
                  className="erp-field bg-white"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">التاريخ</label>
                <input
                  type="date"
                  value={adjForm.date}
                  onChange={(e) => setAdjForm((p) => ({ ...p, date: e.target.value }))}
                  className="erp-field"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">المبلغ</label>
                <input
                  type="number"
                  value={adjForm.amount}
                  onChange={(e) => setAdjForm((p) => ({ ...p, amount: e.target.value }))}
                  className="erp-field text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[12px]">السبب / البيان</label>
                <input
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm((p) => ({ ...p, reason: e.target.value }))}
                  className="erp-field"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const amt = parseFloat(adjForm.amount) || 0;
                  if (!adjForm.employeeName || amt <= 0) {
                    onNotify('اختر الموظف وأدخل مبلغاً صحيحاً');
                    return;
                  }
                  const rec: HrAdjustmentRecord = {
                    id: `adj-${Date.now()}`,
                    kind: currentAdjKind,
                    date: adjForm.date,
                    employeeName: adjForm.employeeName,
                    amount: amt,
                    reason: adjForm.reason.trim() || HR_MODE_TITLES[activeMode],
                  };
                  onSaveAdjustments([rec, ...hrAdjustments]);
                  setAdjForm((p) => ({ ...p, amount: '', reason: '' }));
                  onNotify('تم تسجيل الحركة المالية للموظف');
                }}
                className="erp-classic-btn focused h-[28px]"
              >
                حفظ
              </button>
            </div>

            <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">التاريخ</th>
                    <th className="border border-[#9aa7b8] p-1.5">الموظف</th>
                    <th className="border border-[#9aa7b8] p-1.5">المبلغ</th>
                    <th className="border border-[#9aa7b8] p-1.5">البيان</th>
                  </tr>
                </thead>
                <tbody>
                  {hrAdjustments.filter((a) => a.kind === currentAdjKind).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#666]">
                        لا توجد حركات مسجلة في هذا القسم.
                      </td>
                    </tr>
                  ) : (
                    hrAdjustments
                      .filter((a) => a.kind === currentAdjKind)
                      .map((a) => (
                        <tr key={a.id} className="hover:bg-[#eaf3fc]">
                          <td className="border border-[#d5dce6] p-1.5 text-center">{a.date}</td>
                          <td className="border border-[#d5dce6] p-1.5 font-bold">{a.employeeName}</td>
                          <td className="border border-[#d5dce6] p-1.5 text-center font-bold">
                            {a.amount.toLocaleString()}
                          </td>
                          <td className="border border-[#d5dce6] p-1.5">{a.reason}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeMode === 'payroll' || activeMode === 'reports') && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between bg-[#eef3f9] border border-[#b9c4d4] p-2">
              <div className="font-bold">كشف جدول الرواتب والمستحقات التفصيلي</div>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  onNotify('تم إرسال جدول الرواتب للطباعة');
                }}
                className="erp-classic-btn focused px-4 h-[26px]"
              >
                طباعة الجدول
              </button>
            </div>
            <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#cfdce8] sticky top-0">
                    <th className="border border-[#9aa7b8] p-1.5">الرقم</th>
                    <th className="border border-[#9aa7b8] p-1.5">الموظف</th>
                    <th className="border border-[#9aa7b8] p-1.5">القسم</th>
                    <th className="border border-[#9aa7b8] p-1.5">الراتب الأساسي</th>
                    <th className="border border-[#9aa7b8] p-1.5">الاضافات (+)</th>
                    <th className="border border-[#9aa7b8] p-1.5">السلف (-)</th>
                    <th className="border border-[#9aa7b8] p-1.5">العقوبات (-)</th>
                    <th className="border border-[#9aa7b8] p-1.5">الصافي المستحق</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRows.map((r) => (
                    <tr key={r.emp.id} className="hover:bg-[#eaf3fc]">
                      <td className="border border-[#d5dce6] p-1.5 text-center">{r.emp.code}</td>
                      <td className="border border-[#d5dce6] p-1.5 font-bold">{r.emp.name}</td>
                      <td className="border border-[#d5dce6] p-1.5">{r.emp.department}</td>
                      <td className="border border-[#d5dce6] p-1.5 text-center">
                        {r.emp.baseSalary.toLocaleString()}
                      </td>
                      <td className="border border-[#d5dce6] p-1.5 text-center text-emerald-700">
                        {r.bonuses.toLocaleString()}
                      </td>
                      <td className="border border-[#d5dce6] p-1.5 text-center text-amber-700">
                        {r.advances.toLocaleString()}
                      </td>
                      <td className="border border-[#d5dce6] p-1.5 text-center text-rose-700">
                        {r.penalties.toLocaleString()}
                      </td>
                      <td className="border border-[#d5dce6] p-1.5 text-center font-extrabold">
                        {r.net.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};

export type ReportSuiteMode =
  | 'accSummary'
  | 'dailyCashbook'
  | 'dailyMovement'
  | 'dailyReport'
  | 'generalOps'
  | 'costCenterReport'
  | 'receiptsReport'
  | 'paymentsReport'
  | 'agingReport'
  | 'userReport'
  | 'collectionPlan'
  | 'matDetailMove'
  | 'matAllDetailMove'
  | 'matSummaryMove'
  | 'matWarehouseSummary'
  | 'matDetailInv'
  | 'matExpiry'
  | 'matBrowse'
  | 'matMinAlerts'
  | 'matMaxAlerts'
  | 'matStagnant'
  | 'matBaseQty'
  | 'matWarranties'
  | 'monthlyTrialBalance'
  | 'generalTrialBalance'
  | 'openingBalanceSheet'
  | 'currentBalanceSheet'
  | 'operatingAccount'
  | 'tradingAccount'
  | 'profitAndLoss'
  | 'closingReports'
  | 'organizeClosingEntries'
  | 'browseClosingEntries'
  | 'finalBalanceSheet'
  | 'nextPeriodPrep';

const REPORT_TITLES: Record<ReportSuiteMode, string> = {
  accSummary: 'كشف حساب اجمالي',
  dailyCashbook: 'كشف حساب يومي',
  dailyMovement: 'تقرير الحركة اليومية',
  dailyReport: 'التقرير اليومي',
  generalOps: 'التقرير العام للعمليات',
  costCenterReport: 'تقرير مراكزالتكلفة',
  receiptsReport: 'تقارير سندات وشيكات القبض',
  paymentsReport: 'تقارير سندات وشيكات الصرف',
  agingReport: 'تقرير أعمار الذمم',
  userReport: 'تقرير مستخدم',
  collectionPlan: 'تقرير خطة التحصيل/الدفع',
  matDetailMove: 'حركة مادة تفصيلي',
  matAllDetailMove: 'الحركة التفصيلية للمواد',
  matSummaryMove: 'الحركة الإجمالية للمواد',
  matWarehouseSummary: 'حركة المواد حسب المستودع',
  matDetailInv: 'جرد مواد تفصيلي',
  matExpiry: 'صلاحية المواد',
  matBrowse: 'استعراض المواد',
  matMinAlerts: 'نواقص المواد والمتجاوزه الحد الدنى',
  matMaxAlerts: 'المواد المتجاوزه الحد الاعلى',
  matStagnant: 'المواد عديمة الحركة',
  matBaseQty: 'تقرير بالكميات الاساسية',
  matWarranties: 'تقرير الكفالات',
  monthlyTrialBalance: 'ميزان المراجعة الشهرية',
  generalTrialBalance: 'ميزان المراجعة العامة',
  openingBalanceSheet: 'الميزانية الافتتاحية',
  currentBalanceSheet: 'الميزانية الحالية',
  operatingAccount: 'حساب التشغيل',
  tradingAccount: 'حساب المتاجرة',
  profitAndLoss: 'حساب الأرباح والخسائر',
  closingReports: 'تقارير الحسابات الختامية',
  organizeClosingEntries: 'تنظيم القيود الختامية',
  browseClosingEntries: 'استعراض القيود الختامية',
  finalBalanceSheet: 'الميزانية الختاميه',
  nextPeriodPrep: 'التهيه لدوره قادمه',
};

interface ReportsSuiteDialogProps {
  open: boolean;
  mode: ReportSuiteMode;
  zIndex: number;
  state: ErpState;
  onFocus: () => void;
  onClose: () => void;
  onAddClosingEntries: (entries: JournalEntry[]) => void;
  onAdvanceNextYear: (nextYear: number) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const ReportsSuiteDialog: React.FC<ReportsSuiteDialogProps> = ({
  open,
  mode,
  zIndex,
  state,
  onFocus,
  onClose,
  onAddClosingEntries,
  onAdvanceNextYear,
  onShowMsg,
  onNotify,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(`${state.props.year}-01-01`);
  const [dateTo, setDateTo] = useState(today);
  const [filterText, setFilterText] = useState('');
  const [selectedUser, setSelectedUser] = useState(state.currentUser);

  useEffect(() => {
    if (open) {
      setFilterText('');
    }
  }, [open, mode]);

  const activeJournal = useMemo(() => state.journal.filter((j) => !j.deleted), [state.journal]);

  const reportData = useMemo((): {
    columns: string[];
    rows: (string | number)[][];
    summaryLine: string;
  } => {
    const q = filterText.trim().toLowerCase();

    // 1. Account aggregation reports
    if (
      mode === 'accSummary' ||
      mode === 'monthlyTrialBalance' ||
      mode === 'generalTrialBalance' ||
      mode === 'openingBalanceSheet' ||
      mode === 'currentBalanceSheet' ||
      mode === 'finalBalanceSheet' ||
      mode === 'closingReports'
    ) {
      const map = new Map<string, { debit: number; credit: number }>();
      const source =
        mode === 'openingBalanceSheet'
          ? activeJournal.filter((j) => j.voucherType === 'opening' || j.stmt.includes('افتتاح'))
          : activeJournal;
      for (const j of source) {
        const amt = (parseFloat(j.rec) || 0) + (parseFloat(j.pay) || 0) + (parseFloat(j.dhm) || 0);
        if (j.from) {
          const cur = map.get(j.from) || { debit: 0, credit: 0 };
          cur.debit += amt;
          map.set(j.from, cur);
        }
        if (j.to) {
          const cur = map.get(j.to) || { debit: 0, credit: 0 };
          cur.credit += amt;
          map.set(j.to, cur);
        }
      }
      const rows = Array.from(map.entries())
        .filter(([acc]) => !q || acc.toLowerCase().includes(q))
        .map(([acc, v]) => [
          acc,
          v.debit.toFixed(2),
          v.credit.toFixed(2),
          (v.debit - v.credit).toFixed(2),
        ]);
      const sumD = Array.from(map.values()).reduce((s, v) => s + v.debit, 0);
      const sumC = Array.from(map.values()).reduce((s, v) => s + v.credit, 0);
      return {
        columns: ['اسم الحساب', 'إجمالي المدين', 'إجمالي الدائن', 'الرصيد الصافي'],
        rows,
        summaryLine: `إجمالي المدين: ${sumD.toFixed(2)} | إجمالي الدائن: ${sumC.toFixed(2)}`,
      };
    }

    // 2. Trading / Operating / P&L
    if (mode === 'operatingAccount' || mode === 'tradingAccount' || mode === 'profitAndLoss') {
      const salesTotal = state.invoices
        .filter((i) => i.kind.includes('مبيعات') && !i.kind.includes('مردود'))
        .reduce((s, i) => s + i.total, 0);
      const purchTotal = state.invoices
        .filter((i) => i.kind.includes('مشتريات') && !i.kind.includes('مردود'))
        .reduce((s, i) => s + i.total, 0);
      const invProfit = state.invoices.reduce((s, i) => s + (i.profit || 0), 0);
      const expenses = activeJournal
        .filter((j) => j.pay)
        .reduce((s, j) => s + (parseFloat(j.pay) || 0), 0);
      const net = invProfit - expenses;
      return {
        columns: ['البند المحاسبي', 'مدين (مصروفات/تكلفة)', 'دائن (إيرادات)', 'النتيجة'],
        rows: [
          ['إجمالي المبيعات', '0.00', salesTotal.toFixed(2), salesTotal.toFixed(2)],
          ['إجمالي المشتريات', purchTotal.toFixed(2), '0.00', (-purchTotal).toFixed(2)],
          ['أرباح الفواتير المقدرة', '0.00', invProfit.toFixed(2), invProfit.toFixed(2)],
          ['المصروفات والمدفوعات', expenses.toFixed(2), '0.00', (-expenses).toFixed(2)],
          ['صافي الربح / الخسارة', '', '', net.toFixed(2)],
        ],
        summaryLine: `صافي النتيجة: ${net.toFixed(2)}`,
      };
    }

    // 3. Closing entries viewer
    if (mode === 'browseClosingEntries' || mode === 'organizeClosingEntries') {
      const rows = activeJournal
        .filter((j) => j.stmt.includes('ختام') || j.stmt.includes('اقفال'))
        .map((j) => [j.at, j.from, j.to, j.rec || j.pay || j.dhm || '0', j.stmt]);
      return {
        columns: ['التاريخ', 'من حساب', 'إلى حساب', 'المبلغ', 'البيان'],
        rows,
        summaryLine: `عدد القيود الختامية: ${rows.length}`,
      };
    }

    // 4. Receipts / Payments / Daily / User / Cost Centers / Aging / Collection
    if (
      mode === 'dailyCashbook' ||
      mode === 'dailyMovement' ||
      mode === 'dailyReport' ||
      mode === 'generalOps' ||
      mode === 'receiptsReport' ||
      mode === 'paymentsReport' ||
      mode === 'userReport' ||
      mode === 'agingReport' ||
      mode === 'collectionPlan'
    ) {
      let filtered = activeJournal.filter((j) => {
        if (dateFrom && j.at && j.at < dateFrom) return false;
        if (dateTo && j.at && j.at > dateTo) return false;
        if (mode === 'dailyReport' || mode === 'dailyCashbook') {
          return j.at === today || !j.at;
        }
        if (mode === 'receiptsReport') return Boolean(j.rec) || j.voucherType === 'receipt' || j.voucherType === 'check';
        if (mode === 'paymentsReport') return Boolean(j.pay) || j.voucherType === 'payment';
        if (mode === 'userReport') return j.by === selectedUser;
        if (mode === 'agingReport' || mode === 'collectionPlan') {
          return Boolean(j.dhm) || j.from.includes('زبون') || j.to.includes('مورد');
        }
        return true;
      });
      if (q) {
        filtered = filtered.filter(
          (j) =>
            j.stmt.toLowerCase().includes(q) ||
            j.from.toLowerCase().includes(q) ||
            j.to.toLowerCase().includes(q)
        );
      }
      return {
        columns: ['التاريخ', 'من حساب', 'إلى حساب', 'مقبوضات', 'مدفوعات', 'ذمم', 'البيان', 'المستخدم'],
        rows: filtered.map((j) => [
          j.at,
          j.from,
          j.to,
          j.rec || '0',
          j.pay || '0',
          j.dhm || '0',
          j.stmt,
          j.by,
        ]),
        summaryLine: `عدد الحركات: ${filtered.length}`,
      };
    }

    if (mode === 'costCenterReport') {
      const rows = state.costCenters.map((cc) => [cc.code, cc.name, cc.parentCode || '-', cc.notes]);
      return {
        columns: ['رمز المركز', 'اسم مركز الكلفة', 'المركز الأب', 'ملاحظات'],
        rows,
        summaryLine: `عدد مراكز الكلفة: ${rows.length}`,
      };
    }

    // 5. Material reports
    const mats = state.importedMaterials.filter(
      (m) => !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    );
    if (mode === 'matMinAlerts') {
      const low = mats.filter((m) => (parseFloat(m.qty) || 0) <= (parseFloat(m.minLimit) || 0));
      return {
        columns: ['الرمز', 'المادة', 'الكمية الحالية', 'الحد الأدنى', 'المستودع'],
        rows: low.map((m) => [m.code, m.name, m.qty, m.minLimit, m.warehouse]),
        summaryLine: `المواد الناقصة عن الحد الأدنى: ${low.length}`,
      };
    }
    if (mode === 'matMaxAlerts') {
      const high = mats.filter((m) => (parseFloat(m.qty) || 0) >= (parseFloat(m.maxLimit) || 999999));
      return {
        columns: ['الرمز', 'المادة', 'الكمية الحالية', 'الحد الأعلى', 'المستودع'],
        rows: high.map((m) => [m.code, m.name, m.qty, m.maxLimit, m.warehouse]),
        summaryLine: `المواد المتجاوزة الحد الأعلى: ${high.length}`,
      };
    }
    if (mode === 'matExpiry') {
      const withExp = mats.filter((m) => Boolean(m.expiryDate));
      return {
        columns: ['الرمز', 'المادة', 'تاريخ الصلاحية', 'الكمية', 'المستودع'],
        rows: withExp.map((m) => [m.code, m.name, m.expiryDate, m.qty, m.warehouse]),
        summaryLine: `المواد ذات تاريخ الصلاحية: ${withExp.length}`,
      };
    }
    if (mode === 'matStagnant') {
      const movedNames = new Set(state.invoices.flatMap((i) => i.items.map((it) => it.name)));
      const stagnant = mats.filter((m) => !movedNames.has(m.name));
      return {
        columns: ['الرمز', 'المادة', 'الرصيد', 'سعر التكلفة', 'المستودع'],
        rows: stagnant.map((m) => [m.code, m.name, m.qty, m.purchasePrice, m.warehouse]),
        summaryLine: `المواد عديمة الحركة: ${stagnant.length}`,
      };
    }
    if (mode === 'matDetailMove' || mode === 'matAllDetailMove') {
      const invRows = state.invoices.flatMap((inv) =>
        inv.items
          .filter((it) => !q || it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q))
          .map((it) => [inv.date, inv.kind, inv.number, it.code, it.name, it.qty, it.price, it.qty * it.price])
      );
      return {
        columns: ['التاريخ', 'نوع الحركة', 'رقم الفاتورة', 'الرمز', 'المادة', 'الكمية', 'السعر', 'الإجمالي'],
        rows: invRows,
        summaryLine: `عدد حركات المواد: ${invRows.length}`,
      };
    }

    // Default material summary / browse / inventory / baseQty / warranties
    return {
      columns: ['الرمز', 'اسم المادة', 'الوحدة الأساسية', 'المستودع', 'الكمية', 'سعر التكلفة', 'إجمالي القيمة'],
      rows: mats.map((m) => {
        const val = (parseFloat(m.qty) || 0) * (parseFloat(m.purchasePrice) || 0);
        return [m.code, m.name, m.mainUnit, m.warehouse, m.qty, m.purchasePrice, val.toFixed(2)];
      }),
      summaryLine: `إجمالي الأصناف: ${mats.length}`,
    };
  }, [mode, activeJournal, state, filterText, dateFrom, dateTo, today, selectedUser]);

  const exportCsv = () => {
    const csv =
      '\uFEFF' +
      [reportData.columns, ...reportData.rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mode}-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('تم تصدير التقرير إلى ملف CSV');
  };

  return (
    <DraggableWindow
      open={open}
      title={REPORT_TITLES[mode]}
      width={1020}
      height={640}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#dce4ee] p-3 gap-2.5 overflow-hidden text-[13px]">
        <ReportHeader
          props={state.props}
          compact
          subtitle={REPORT_TITLES[mode]}
          meta={<span className="text-[#555] font-bold">العام: {toAr(state.props.year)}</span>}
        />
        {/* Filters */}
        <div className="bg-[#f4f6fa] border border-[#b9c4d4] p-2.5 flex flex-wrap items-center gap-2">
          <span className="font-bold">{state.props.hdrArName || state.props.company}</span>
          <span className="text-[#555]">| العام: {toAr(state.props.year)}</span>
          <div className="flex-1" />
          {mode === 'userReport' && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="erp-field bg-white"
            >
              {state.users.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="erp-field w-[135px]"
            dir="ltr"
          />
          <span>إلى</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="erp-field w-[135px]"
            dir="ltr"
          />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="تصفية سريعة..."
            className="erp-field w-[180px]"
          />
        </div>

        {/* Special actions for Closing Entries & Next Period Prep */}
        {mode === 'organizeClosingEntries' && (
          <div className="bg-[#fff8e6] border border-[#d6b669] p-3 flex items-center justify-between gap-3">
            <span className="font-bold">
              توليد وترحيل قيد إقفال الإيرادات والمصروفات إلى حساب الأرباح والخسائر ({toAr(state.props.year)}):
            </span>
            <button
              type="button"
              onClick={async () => {
                const res = await onShowMsg({
                  title: 'تنظيم القيود الختامية',
                  icon: 'question',
                  text: 'هل تريد إنشاء القيد الختامي لأرصدة الإيرادات والمصروفات الآن؟',
                  buttons: [
                    { label: 'نعم', value: 'yes' },
                    { label: 'لا', value: 'no', focus: true },
                  ],
                });
                if (res !== 'yes') return;
                const salesAmt = state.invoices.reduce((s, i) => s + i.total, 0);
                const closingEntry: JournalEntry = {
                  id: `close-${Date.now()}`,
                  rec: '',
                  pay: '',
                  dhm: String(salesAmt),
                  from: 'المبيعات',
                  to: 'ارباح',
                  cur: 'ريال يمني',
                  stmt: `قيد ختامي - إقفال السنة المالية ${state.props.year}`,
                  doc: `CL-${state.props.year}`,
                  by: state.currentUser,
                  at: today,
                };
                onAddClosingEntries([closingEntry]);
                onNotify('تم إنشاء القيد الختامي بنجاح');
              }}
              className="erp-classic-btn focused px-4 h-[28px]"
            >
              توليد القيود الختامية
            </button>
          </div>
        )}

        {mode === 'nextPeriodPrep' && (
          <div className="bg-[#eaf4ff] border border-[#7ea7d8] p-3 flex items-center justify-between gap-3">
            <span className="font-bold">
              التهيئة لدورة مالية قادمة: تدوير الأرصدة الافتتاحية والانتقال إلى السنة {toAr(state.props.year + 1)}
            </span>
            <button
              type="button"
              onClick={async () => {
                const nextYear = state.props.year + 1;
                const res = await onShowMsg({
                  title: 'التهيئة لدورة قادمة',
                  icon: 'question',
                  text: `هل تريد فتح السنة المالية الجديدة (${toAr(nextYear)}) وتدوير الأرصدة؟`,
                  buttons: [
                    { label: 'نعم', value: 'yes' },
                    { label: 'لا', value: 'no', focus: true },
                  ],
                });
                if (res === 'yes') {
                  onAdvanceNextYear(nextYear);
                  onNotify(`تمت التهيئة وفتح الدورة المالية ${nextYear}`);
                }
              }}
              className="erp-classic-btn focused px-4 h-[28px]"
            >
              فتح دورة {toAr(state.props.year + 1)}
            </button>
          </div>
        )}

        {/* Data Table */}
        <div className="flex-1 bg-white border border-[#9aa7b8] overflow-auto erp-scrollbar">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#cfdce8] sticky top-0">
                {reportData.columns.map((c) => (
                  <th key={c} className="border border-[#9aa7b8] p-1.5">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={reportData.columns.length} className="p-8 text-center text-[#666]">
                    لا توجد بيانات مطابقة في الفترة المحددة.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((r, ri) => (
                  <tr key={ri} className="hover:bg-[#eaf3fc]">
                    {r.map((cell, ci) => (
                      <td key={ci} className="border border-[#d5dce6] p-1.5 text-center">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="font-bold text-[#0f3d6e]">{reportData.summaryLine}</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportCsv} className="erp-classic-btn px-4 h-[28px]">
              تصدير اكسل CSV
            </button>
            <button
              type="button"
              onClick={() => {
                window.print();
                onNotify('تم إرسال التقرير للطباعة');
              }}
              className="erp-classic-btn focused px-4 h-[28px]"
            >
              طباعة
            </button>
            <button type="button" onClick={onClose} className="erp-classic-btn px-4 h-[28px]">
              خروج
            </button>
          </div>
        </div>
      </div>
    </DraggableWindow>
  );
};
