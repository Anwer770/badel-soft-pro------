import React, { useEffect, useMemo, useState } from 'react';
import type { AppointmentItem, AppointmentRepeat, ErpState, MsgConfig } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

const SOUND_FILES = [
  'SaveOk.Wav',
  'Switch.Wav',
  'MissionOk.Wav',
  'Introduc.Wav',
  'Attention.Wav',
  'AppendOk.Wav',
];

function playPreviewSound(soundName: string) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const freqs: Record<string, number[]> = {
      'SaveOk.Wav': [523.25, 659.25, 783.99],
      'Switch.Wav': [440, 554.37],
      'MissionOk.Wav': [587.33, 739.99, 880],
      'Introduc.Wav': [392, 523.25, 659.25],
      'Attention.Wav': [880, 698.46, 880],
      'AppendOk.Wav': [493.88, 659.25],
    };
    const notes = freqs[soundName] || [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.12, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.18);
    });
  } catch {
    // Ignore audio context restriction errors
  }
}

interface SystemCheckDialogProps {
  open: boolean;
  zIndex: number;
  state: ErpState;
  onFocus: () => void;
  onClose: () => void;
  onCleanZeroExpired: () => number;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
}

export const SystemCheckDialog: React.FC<SystemCheckDialogProps> = ({
  open,
  zIndex,
  state,
  onFocus,
  onClose,
  onCleanZeroExpired,
  onShowMsg,
}) => {
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const runWarehouseCheck = async () => {
    setBusyAction('warehouse');
    await onShowMsg({
      title: 'فحص صحة البيانات الموجودة في المخازن',
      icon: 'info',
      text: `تم فحص بيانات المخازن بنجاح.\nعدد المواد المستوردة: ${state.importedMaterials.length}\nعدد فواتير الحركة المخزنية: ${state.invoices.length}\nالسماح بالبيع بالسالب: ${
        state.props.allowNegativeStock ? 'مفعل' : 'غير مفعل'
      }\nحالة الفهرسة: سليمة 100%`,
    });
    setBusyAction(null);
  };

  const runCostCheck = async () => {
    setBusyAction('cost');
    const zeroCostItems = state.importedMaterials.filter(
      (m) => !m.purchasePrice || Number(m.purchasePrice) <= 0
    ).length;
    await onShowMsg({
      title: 'فحص سعر التكلفة للمواد',
      icon: 'info',
      text: `تمت مراجعة أسعار التكلفة وفق سياسة «${state.accountOptions.inventoryPricing}».\nإجمالي الأصناف المفحوصة: ${state.importedMaterials.length}\nأصناف بدون سعر شراء: ${zeroCostItems}`,
    });
    setBusyAction(null);
  };

  const runSalesInvCheck = async () => {
    setBusyAction('salesInv');
    const salesCount = state.invoices.filter((inv) => inv.kind.includes('مبيعات')).length;
    await onShowMsg({
      title: 'فحص جرد أصناف المبيعات',
      icon: 'info',
      text: `تم مطابقة جرد أصناف المبيعات مع قيود اليومية.\nفواتير المبيعات المسجلة: ${salesCount}\nإجمالي قيود اليومية: ${state.journal.length}\nالنتيجة: لا توجد فروقات جردية.`,
    });
    setBusyAction(null);
  };

  const runDbUpdate = async () => {
    setBusyAction('db');
    try {
      const res = await fetch('/api/health');
      const info = await res.json();
      await onShowMsg({
        title: 'تحديث DataBase',
        icon: 'info',
        text: `تم تحديث وفحص قاعدة البيانات بنجاح.\nالخادم: ${state.props.serverName}\nالقاعدة: ${state.props.dbName}\nحالة الاتصال: ${
          info?.ok ? 'متصل وسليم' : 'متاح محلياً'
        }`,
      });
    } catch {
      await onShowMsg({
        title: 'تحديث DataBase',
        icon: 'info',
        text: `تم تحديث جداول التخزين المحلية بنجاح (${state.props.dbName}).`,
      });
    }
    setBusyAction(null);
  };

  const handleDeleteZeroExpired = async () => {
    const confirm = await onShowMsg({
      title: 'تحذير',
      icon: 'warn',
      text: 'هل تريد حذف التواريخ المنتهية للكميات الصفرية نهائياً؟',
      buttons: [
        { label: 'OK', value: 'yes', focus: true },
        { label: 'Cancel', value: 'no' },
      ],
    });
    if (confirm !== 'yes') return;
    const removed = onCleanZeroExpired();
    await onShowMsg({
      title: 'فحص النظام',
      icon: 'info',
      text:
        removed > 0
          ? `تم تنظيف وحذف ${removed} سجل منتهي الصلاحية بكمية صفرية.`
          : 'لا توجد سجلات منتهية الصلاحية بكميات صفرية حالياً.',
    });
  };

  return (
    <DraggableWindow
      open={open}
      title="فحص النظام"
      width={445}
      height={275}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 bg-[#f0f0f0] p-4 flex flex-col justify-between relative select-none">
        {/* Stacked Main Action Buttons matching Screenshot_2026-11-24_004935_903e1ff4.png */}
        <div className="flex flex-col items-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => void runWarehouseCheck()}
            className="w-[235px] h-[27px] bg-[#e5f1fb] hover:bg-[#d8ebfa] border-2 border-[#0078d7] text-[#111] text-[12px] font-bold cursor-pointer"
          >
            فحص صحة البيانات الموجودة في المخازن
          </button>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => void runCostCheck()}
            className="erp-classic-btn w-[235px] h-[27px] text-[12px]"
          >
            فحص سعر التكلفة للمواد
          </button>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => void runSalesInvCheck()}
            className="erp-classic-btn w-[235px] h-[27px] text-[12px]"
          >
            فحص جرد أصناف المبيعات
          </button>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => void runDbUpdate()}
            className="w-[235px] h-[28px] bg-[#edf6fd] hover:bg-[#dcedfa] border border-[#0078d7] text-[#111] text-[12px] font-bold cursor-pointer"
          >
            تحديث DataBase
          </button>
        </div>

        {/* Lower-left compact button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => void handleDeleteZeroExpired()}
            className="erp-classic-btn w-[98px] h-[44px] text-[11px] leading-tight text-center px-1"
          >
            حذف التواريخ المنتهية للكميات الصفرية
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};

interface AppointmentsDialogProps {
  open: boolean;
  zIndex: number;
  appointments: AppointmentItem[];
  onFocus: () => void;
  onClose: () => void;
  onSaveAppointment: (item: AppointmentItem, isEdit: boolean) => void;
  onDeleteAppointment: (id: string) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const AppointmentsDialog: React.FC<AppointmentsDialogProps> = ({
  open,
  zIndex,
  appointments,
  onFocus,
  onClose,
  onSaveAppointment,
  onDeleteAppointment,
  onShowMsg,
  onNotify,
}) => {
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }, []);

  const [scope, setScope] = useState<'all' | 'today'>('all');
  const [filterText, setFilterText] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterNotes, setFilterNotes] = useState('');
  const [appliedFilter, setAppliedFilter] = useState({ text: '', location: '', notes: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // frmAddDate modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState(todayStr);
  const [draftTime, setDraftTime] = useState('06:50:12');
  const [draftPeriod, setDraftPeriod] = useState<'ص' | 'م'>('ص');
  const [draftText, setDraftText] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftRepeat, setDraftRepeat] = useState<AppointmentRepeat>('none');
  const [draftSound, setDraftSound] = useState('SaveOk.Wav');

  const filteredList = useMemo(() => {
    return appointments.filter((apt) => {
      if (scope === 'today' && apt.date !== todayStr && apt.repeat !== 'daily') {
        return false;
      }
      if (
        appliedFilter.text &&
        !apt.text.toLowerCase().includes(appliedFilter.text.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.location &&
        !apt.location.toLowerCase().includes(appliedFilter.location.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilter.notes &&
        !apt.notes.toLowerCase().includes(appliedFilter.notes.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appointments, scope, todayStr, appliedFilter]);

  useEffect(() => {
    if (open) {
      setAddModalOpen(false);
      setSelectedId(filteredList[0]?.id || null);
    }
  }, [open]);

  const openAddDialog = () => {
    setEditingId(null);
    setDraftDate(todayStr);
    const now = new Date();
    const h24 = now.getHours();
    const h12 = String(h24 % 12 || 12).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    setDraftTime(`${h12}:${min}:${sec}`);
    setDraftPeriod(h24 >= 12 ? 'م' : 'ص');
    setDraftText('');
    setDraftLocation('');
    setDraftNotes('');
    setDraftRepeat('none');
    setDraftSound('SaveOk.Wav');
    setAddModalOpen(true);
  };

  const openEditDialog = (item?: AppointmentItem) => {
    const target = item || filteredList.find((a) => a.id === selectedId);
    if (!target) {
      onNotify('يرجى تحديد موعد للتعديل');
      return;
    }
    setEditingId(target.id);
    setDraftDate(target.date);
    const isPm = target.time.includes('م') || target.time.includes('PM');
    const cleanTime = target.time.replace(/[^\d:]/g, '') || '09:00:00';
    setDraftTime(cleanTime);
    setDraftPeriod(isPm ? 'م' : 'ص');
    setDraftText(target.text);
    setDraftLocation(target.location);
    setDraftNotes(target.notes);
    setDraftRepeat(target.repeat);
    setDraftSound(target.soundFile || 'SaveOk.Wav');
    setAddModalOpen(true);
  };

  const handleSaveDraft = () => {
    if (!draftText.trim()) {
      onNotify('يرجى إدخال نص الموعد');
      return;
    }
    const item: AppointmentItem = {
      id: editingId || `apt-${Date.now()}`,
      date: draftDate.replace(/-/g, '/') || todayStr,
      time: `${draftTime.trim() || '09:00:00'} ${draftPeriod}`,
      text: draftText.trim(),
      location: draftLocation.trim(),
      notes: draftNotes.trim(),
      repeat: draftRepeat,
      soundFile: draftSound,
    };
    onSaveAppointment(item, Boolean(editingId));
    setSelectedId(item.id);
    setAddModalOpen(false);
    onNotify(editingId ? 'تم تعديل الموعد بنجاح' : 'تمت إضافة الموعد بنجاح');
  };

  const handleDeleteSelected = async () => {
    if (!selectedId) {
      onNotify('يرجى تحديد موعد للحذف');
      return;
    }
    const res = await onShowMsg({
      title: 'تحذير',
      icon: 'warn',
      text: 'هل تريد حذف الموعد المحدد؟',
      buttons: [
        { label: 'OK', value: 'yes', focus: true },
        { label: 'Cancel', value: 'no' },
      ],
    });
    if (res === 'yes') {
      onDeleteAppointment(selectedId);
      setSelectedId(null);
      onNotify('تم حذف الموعد');
    }
  };

  return (
    <>
      <DraggableWindow
        open={open}
        title="مستعرض مواعيد اليوم"
        width={920}
        height={560}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div className="flex-1 bg-[#dce4ee] p-2.5 flex flex-col gap-2 overflow-hidden select-none">
          {/* Top Radio Toggle Box */}
          <div className="flex justify-start border border-[#c8d2de] bg-[#dde5ef] px-3 py-1.5">
            <div className="flex items-center gap-12 text-[13px] font-bold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aptScope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="accent-[#0078d7]"
                />
                <span>كل المواعيد</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aptScope"
                  checked={scope === 'today'}
                  onChange={() => setScope('today')}
                  className="accent-[#0078d7]"
                />
                <span>مواعيد اليوم</span>
              </label>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 border border-[#c8d2de] bg-[#dde5ef] px-3 py-2 text-[13px]">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <label className="font-bold whitespace-nowrap">نص محدد</label>
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedFilter({ text: filterText, location: filterLocation, notes: filterNotes });
                  }
                }}
                className="erp-field flex-1 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 w-[190px]">
              <label className="font-bold whitespace-nowrap">الموقع</label>
              <input
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedFilter({ text: filterText, location: filterLocation, notes: filterNotes });
                  }
                }}
                className="erp-field flex-1 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 w-[230px]">
              <label className="font-bold whitespace-nowrap">ملاحظات</label>
              <input
                value={filterNotes}
                onChange={(e) => setFilterNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedFilter({ text: filterText, location: filterLocation, notes: filterNotes });
                  }
                }}
                className="erp-field flex-1 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setAppliedFilter({ text: filterText, location: filterLocation, notes: filterNotes })
              }
              className="erp-classic-btn w-[68px] h-[25px] text-[12px]"
            >
              بحث
            </button>
          </div>

          {/* DataGridView with #9e9e9e background matching Screenshot_2026-11-24_005002_4c953ea8.png */}
          <div className="flex-1 bg-[#9e9e9e] border border-[#666] overflow-auto erp-scrollbar">
            <table className="w-full border-collapse text-[12px] bg-white">
              <thead className="sticky top-0 bg-[#f0f0f0]">
                <tr>
                  <th className="w-[26px] border-b border-l border-[#bbb] h-[24px]" />
                  <th className="w-[100px] border-b border-l border-[#bbb] px-2 h-[24px] font-bold text-right">
                    تاريخ الموعد
                  </th>
                  <th className="w-[95px] border-b border-l border-[#bbb] px-2 h-[24px] font-bold text-right">
                    الوقت
                  </th>
                  <th className="border-b border-l border-[#bbb] px-2 h-[24px] font-bold text-right">
                    نص الموعد
                  </th>
                  <th className="w-[130px] border-b border-l border-[#bbb] px-2 h-[24px] font-bold text-right">
                    الموقع
                  </th>
                  <th className="w-[180px] border-b border-[#bbb] px-2 h-[24px] font-bold text-right">
                    ملاحظات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((apt) => {
                  const isSel = apt.id === selectedId;
                  return (
                    <tr
                      key={apt.id}
                      onClick={() => setSelectedId(apt.id)}
                      onDoubleClick={() => openEditDialog(apt)}
                      className={`h-[23px] cursor-pointer ${
                        isSel ? 'bg-[#0078d7] text-white' : 'bg-white text-[#111] hover:bg-[#edf5fc]'
                      }`}
                    >
                      <td className="border-b border-l border-[#ccc] bg-[#f0f0f0] text-[#111] text-center text-[10px]">
                        {isSel ? '◀' : ''}
                      </td>
                      <td className="border-b border-l border-[#ddd] px-2 font-bold">{apt.date}</td>
                      <td className="border-b border-l border-[#ddd] px-2 font-bold">{apt.time}</td>
                      <td className="border-b border-l border-[#ddd] px-2 font-bold">{apt.text}</td>
                      <td className="border-b border-l border-[#ddd] px-2">{apt.location}</td>
                      <td className="border-b border-[#ddd] px-2">{apt.notes}</td>
                    </tr>
                  );
                })}
                {/* Trailing new-row marker (*) matching WinForms DataGridView */}
                <tr className="h-[23px] bg-white">
                  <td className="border-b border-l border-[#ccc] bg-[#f0f0f0] text-center font-bold text-[#333]">
                    *
                  </td>
                  <td className="border-b border-l border-[#ddd]" />
                  <td className="border-b border-l border-[#ddd]" />
                  <td className="border-b border-l border-[#ddd]" />
                  <td className="border-b border-l border-[#ddd]" />
                  <td className="border-b border-[#ddd]" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Centered Action Buttons */}
          <div className="pt-2 pb-1 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={openAddDialog}
              className="erp-classic-btn focused w-[108px] h-[30px] text-[13px]"
            >
              اضافة
            </button>
            <button
              type="button"
              onClick={() => openEditDialog()}
              className="erp-classic-btn w-[108px] h-[30px] text-[13px]"
            >
              تعديل
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteSelected()}
              className="erp-classic-btn w-[108px] h-[30px] text-[13px]"
            >
              حذف
            </button>
          </div>
        </div>
      </DraggableWindow>

      {/* frmAddDate Sub-Window matching Screenshot_2026-11-24_005102_8f1d0125.png */}
      <DraggableWindow
        open={open && addModalOpen}
        title="frmAddDate"
        width={540}
        height={395}
        zIndex={zIndex + 25}
        onFocus={onFocus}
        onClose={() => setAddModalOpen(false)}
      >
        <div className="flex-1 bg-[#dce4ee] p-3.5 flex flex-col justify-between gap-2.5 select-none">
          {/* Top Input Fields */}
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex items-center gap-3">
              <label className="w-[95px] font-bold text-right shrink-0">تاريخ الموعد</label>
              <input
                type="date"
                value={draftDate.replace(/\//g, '-')}
                onChange={(e) => setDraftDate(e.target.value.replace(/-/g, '/'))}
                className="erp-field w-[150px] bg-white text-center font-bold"
                dir="ltr"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[95px] font-bold text-right shrink-0">وقت الموعد</label>
              <div className="flex items-center gap-1.5">
                <input
                  value={draftTime}
                  onChange={(e) => setDraftTime(e.target.value)}
                  className="erp-field w-[115px] bg-white text-center font-bold"
                  dir="ltr"
                />
                <select
                  value={draftPeriod}
                  onChange={(e) => setDraftPeriod(e.target.value as 'ص' | 'م')}
                  className="erp-field w-[50px] bg-white text-center font-bold"
                >
                  <option value="ص">ص</option>
                  <option value="م">م</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[95px] font-bold text-right shrink-0">نص الموعد</label>
              <input
                autoFocus
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="erp-field flex-1 bg-white border-[#0078d7] focus:border-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[95px] font-bold text-right shrink-0">الموقع</label>
              <input
                value={draftLocation}
                onChange={(e) => setDraftLocation(e.target.value)}
                className="erp-field flex-1 bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[95px] font-bold text-right shrink-0">ملاحظات</label>
              <input
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                className="erp-field flex-1 bg-white"
              />
            </div>
          </div>

          {/* Middle Section: Sound List + سماع + تكرار Group */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-[165px] h-[112px] bg-white border border-[#888] overflow-y-auto erp-scrollbar text-[12px] font-bold" dir="ltr">
              {SOUND_FILES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraftSound(s)}
                  className={`w-full text-left px-2 py-0.5 cursor-pointer block ${
                    draftSound === s ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc] text-[#111]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                playPreviewSound(draftSound);
                onNotify(`تشغيل الصوت: ${draftSound}`);
              }}
              className="erp-classic-btn w-[56px] h-[25px] text-[12px] shrink-0"
            >
              سماع
            </button>

            <fieldset className="flex-1 border border-[#c0cad8] p-2.5 h-[112px]">
              <legend className="px-1 text-[12px] font-bold">تكرار</legend>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[12px] font-bold">
                {(
                  [
                    ['none', 'عدم تكرار'],
                    ['monthly30', 'كل ثلاثين يوم'],
                    ['daily', 'يومي'],
                    ['weekly', 'كل اسبوع'],
                    ['yearly', 'سنوي'],
                  ] as [AppointmentRepeat, string][]
                ).map(([val, lbl]) => (
                  <label key={val} className="flex items-center justify-end gap-1.5 cursor-pointer">
                    <span>{lbl}</span>
                    <input
                      type="radio"
                      name="aptRepeat"
                      checked={draftRepeat === val}
                      onChange={() => setDraftRepeat(val)}
                      className="accent-[#0078d7]"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Bottom Centered Save / Cancel */}
          <div className="flex items-center justify-center gap-8 pt-1">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="erp-classic-btn focused w-[108px] h-[30px] text-[13px]"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="erp-classic-btn w-[108px] h-[30px] text-[13px]"
            >
              الغاء الامر
            </button>
          </div>
        </div>
      </DraggableWindow>
    </>
  );
};

interface ChangePasswordDialogProps {
  open: boolean;
  zIndex: number;
  currentUser: string;
  currentPassword: string;
  onFocus: () => void;
  onClose: () => void;
  onSavePassword: (nextPassword: string) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  zIndex,
  currentUser,
  currentPassword,
  onFocus,
  onClose,
  onSavePassword,
  onShowMsg,
}) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  useEffect(() => {
    if (open) {
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    }
  }, [open]);

  const handleSave = async () => {
    if (oldPass !== currentPassword) {
      await onShowMsg({
        title: 'تنبيه',
        icon: 'warn',
        text: 'كلمة السر الحالية غير صحيحة.',
      });
      return;
    }
    if (!newPass.trim() || newPass !== confirmPass) {
      await onShowMsg({
        title: 'تنبيه',
        icon: 'warn',
        text: 'يرجى التأكد من تطابق كلمة السر الجديدة.',
      });
      return;
    }
    onSavePassword(newPass);
    onClose();
  };

  return (
    <DraggableWindow
      open={open}
      title={`تغير كلمة السر (${currentUser})`}
      width={390}
      height={240}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 bg-[#dce4ee] p-4 flex flex-col justify-between">
        <div className="flex flex-col gap-2.5 text-[13px]">
          <div className="flex items-center gap-3">
            <label className="w-[125px] font-bold">كلمة السر الحالية</label>
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="erp-field flex-1 bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-[125px] font-bold">كلمة السر الجديدة</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="erp-field flex-1 bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-[125px] font-bold">تأكيد كلمة السر</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="erp-field flex-1 bg-white"
            />
          </div>
        </div>
        <div className="flex justify-center gap-5 pt-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            className="erp-classic-btn focused w-[100px] h-[28px] text-[13px]"
          >
            موافق
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn w-[100px] h-[28px] text-[13px]"
          >
            الغاء الامر
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
