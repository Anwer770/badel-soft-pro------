import React, { useEffect, useRef, useState } from 'react';
import type {
  ErpState,
  GeneralPropsState,
  MsgConfig,
  ReportTemplateItem,
} from '../types/erp';
import { DraggableWindow } from './DraggableWindow';
import { FolderBrowseDialog } from './FolderBrowseDialog';

interface BackupRestoreDialogProps {
  open: boolean;
  mode: 'backup' | 'restore';
  zIndex: number;
  propsState: GeneralPropsState;
  onFocus: () => void;
  onClose: () => void;
  onExecuteBackup: (opts: {
    serverName: string;
    dbName: string;
    backupPath: string;
    integratedSecurity: boolean;
  }) => void;
  onExecuteRestore: (restoredState: ErpState) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
}

export const BackupRestoreDialog: React.FC<BackupRestoreDialogProps> = ({
  open,
  mode,
  zIndex,
  propsState,
  onFocus,
  onClose,
  onExecuteBackup,
  onExecuteRestore,
  onShowMsg,
}) => {
  const [serverName, setServerName] = useState(propsState.serverName || 'DESKTOP-RNJ1CCU');
  const [serverEditable, setServerEditable] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [integratedSecurity, setIntegratedSecurity] = useState(
    Boolean(propsState.integratedSecurity)
  );
  const [dbName, setDbName] = useState(propsState.dbName || 'dbBillEAccount');
  const [dbEditable, setDbEditable] = useState(false);
  const [locationPath, setLocationPath] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setServerName(propsState.serverName || 'DESKTOP-RNJ1CCU');
      setDbName(propsState.dbName || 'dbBillEAccount');
      setIntegratedSecurity(Boolean(propsState.integratedSecurity));
      setServerEditable(false);
      setDbEditable(false);
      setUsername('');
      setPassword('');
      setLocationPath(mode === 'backup' ? '' : '');
      setPendingRestoreFile(null);
    }
  }, [open, mode, propsState]);

  const handleBrowse = () => {
    if (mode === 'backup') {
      setBrowseOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleConfirm = async () => {
    if (mode === 'backup') {
      const targetPath = locationPath.trim() || propsState.backupPath || 'D:\\Accounts_Secure\\backup';
      onExecuteBackup({
        serverName: serverName.trim() || 'DESKTOP-RNJ1CCU',
        dbName: dbName.trim() || 'dbBillEAccount',
        backupPath: targetPath,
        integratedSecurity,
      });
      onClose();
      return;
    }

    // Restore mode
    if (!pendingRestoreFile) {
      await onShowMsg({
        title: 'استرجاع نسخة احتياطية',
        icon: 'warn',
        text: 'يرجى تحديد ملف النسخة الاحتياطية أولاً عبر زر (......).',
      });
      return;
    }

    try {
      const text = await pendingRestoreFile.text();
      const parsed = JSON.parse(text) as ErpState;
      if (!parsed.props || !Array.isArray(parsed.users)) {
        throw new Error('Invalid backup');
      }
      onExecuteRestore(parsed);
      onClose();
    } catch {
      await onShowMsg({
        title: 'استرجاع نسخة احتياطية',
        icon: 'warn',
        text: 'تعذر قراءة ملف النسخة الاحتياطية المحدد.',
      });
    }
  };

  const title = mode === 'backup' ? 'عمل نسخة احتياطية' : 'استرجاع نسخة احتياطية';

  return (
    <>
      <DraggableWindow
        open={open}
        title={title}
        width={520}
        height={320}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div className="flex-1 flex flex-col justify-between bg-[#f0f0f0] p-3">
          <fieldset className="border border-[#c5c5c5] p-3 flex flex-col gap-2.5 bg-[#f4f4f4]">
            <legend className="px-1.5 text-[12px] font-bold">خيارات</legend>

            {/* اسم السيرفر */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-semibold">اسم السيرفر</label>
              {serverEditable ? (
                <input
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="erp-field flex-1 text-left"
                  dir="ltr"
                />
              ) : (
                <select
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  disabled
                  className="erp-field flex-1 bg-[#d8d8d8] text-[#555] text-left"
                  dir="ltr"
                >
                  <option value={serverName}>{serverName}</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => setServerEditable((v) => !v)}
                className="erp-classic-btn w-[64px] h-[25px] text-[12px]"
              >
                تبديل
              </button>
            </div>

            {/* اسم المستخدم */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-semibold">اسم المستخدم</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={integratedSecurity}
                className="erp-field flex-1 disabled:bg-[#e2e2e2]"
              />
              <div className="w-[64px]" />
            </div>

            {/* كلمة المرور */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-semibold">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={integratedSecurity}
                className="erp-field flex-1 disabled:bg-[#e2e2e2]"
              />
              <div className="w-[64px]" />
            </div>

            {/* Integrated Security */}
            <div className="flex items-center justify-center py-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold">
                <span dir="ltr">Integrated Security</span>
                <input
                  type="checkbox"
                  checked={integratedSecurity}
                  onChange={(e) => setIntegratedSecurity(e.target.checked)}
                  className="w-4 h-4 accent-[#0078d7]"
                />
              </label>
            </div>

            {/* قاعدة البيانات */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-semibold">قاعدة البيانات</label>
              {dbEditable ? (
                <input
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className="erp-field flex-1 text-left"
                  dir="ltr"
                />
              ) : (
                <select
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  disabled
                  className="erp-field flex-1 bg-[#d8d8d8] text-[#555] text-left"
                  dir="ltr"
                >
                  <option value={dbName}>{dbName}</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => setDbEditable((v) => !v)}
                className="erp-classic-btn focused w-[64px] h-[25px] text-[12px]"
              >
                تبديل
              </button>
            </div>

            {/* الموقع */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-semibold">الموقع</label>
              <input
                value={locationPath}
                onChange={(e) => setLocationPath(e.target.value)}
                placeholder={mode === 'backup' ? propsState.backupPath : 'اختر ملف النسخة (.json)'}
                className="erp-field flex-1 text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleBrowse}
                className="erp-classic-btn w-[40px] h-[25px] text-[12px]"
              >
                ......
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPendingRestoreFile(file);
                  if (file) {
                    setLocationPath(file.name);
                  }
                }}
              />
            </div>
          </fieldset>

          <div className="flex items-center justify-center gap-8 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="erp-classic-btn focused w-[120px] h-[28px] text-[13px]"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={onClose}
              className="erp-classic-btn w-[120px] h-[28px] text-[13px]"
            >
              الغاء الأمر
            </button>
          </div>
        </div>
      </DraggableWindow>

      <FolderBrowseDialog
        open={browseOpen}
        initialPath={locationPath || propsState.backupPath}
        onCancel={() => setBrowseOpen(false)}
        onConfirm={(path: string) => {
          setLocationPath(path);
          setBrowseOpen(false);
        }}
      />
    </>
  );
};

interface ReportsListDialogProps {
  open: boolean;
  zIndex: number;
  templates: ReportTemplateItem[];
  onFocus: () => void;
  onClose: () => void;
  onAddTemplate?: () => void;
  onEditTemplate: (tpl: ReportTemplateItem) => void;
  onDeleteTemplate: (id: string) => void;
  onPickTemplate?: (tpl: ReportTemplateItem) => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const ReportsListDialog: React.FC<ReportsListDialogProps> = ({
  open,
  zIndex,
  templates,
  onFocus,
  onClose,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onPickTemplate,
  onShowMsg,
  onNotify,
}) => {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id || '');

  useEffect(() => {
    if (open && templates.length > 0 && !templates.some((t) => t.id === selectedId)) {
      setSelectedId(templates[0].id);
    }
  }, [open, templates, selectedId]);

  const selectedTemplate = templates.find((t) => t.id === selectedId) || null;

  const handleDelete = async () => {
    if (!selectedTemplate) {
      onNotify('يرجى تحديد تقرير أولاً');
      return;
    }
    const res = await onShowMsg({
      title: 'لائحة التقارير',
      icon: 'question',
      text: `هل تريد حذف النموذج «${selectedTemplate.name}»؟`,
      buttons: [
        { label: 'OK', value: 'yes' },
        { label: 'Cancel', value: 'no', focus: true },
      ],
    });
    if (res === 'yes') {
      onDeleteTemplate(selectedTemplate.id);
      onNotify('تم حذف نموذج التقرير');
    }
  };

  return (
    <DraggableWindow
      open={open}
      title="لائحة التقارير"
      width={500}
      height={470}
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#f0f0f0] p-2.5 overflow-hidden gap-2.5">
        <div className="flex-1 bg-white border border-[#999] overflow-y-auto erp-scrollbar">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f3f3f3]">
                <th className="border-b border-l border-[#ccc] py-1.5 px-2 font-bold text-center w-1/2">
                  اسم التقرير
                </th>
                <th className="border-b border-[#ccc] py-1.5 px-2 font-bold text-center w-1/2">
                  نوع التقرير
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => {
                const isSel = tpl.id === selectedId;
                return (
                  <tr
                    key={tpl.id}
                    onClick={() => setSelectedId(tpl.id)}
                    onDoubleClick={() => {
                      if (onPickTemplate) {
                        onPickTemplate(tpl);
                        onClose();
                      } else {
                        onEditTemplate(tpl);
                      }
                    }}
                    className={`cursor-pointer ${
                      isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#eaf3fc]'
                    }`}
                  >
                    <td className="border-b border-l border-[#d8d8d8] py-1 px-2 text-center">
                      {tpl.name}
                    </td>
                    <td className="border-b border-[#d8d8d8] py-1 px-2 text-center">
                      {tpl.reportType}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-0.5">
          {onPickTemplate ? (
            <button
              type="button"
              onClick={() => {
                if (!selectedTemplate) {
                  onNotify('يرجى تحديد تقرير أولاً');
                  return;
                }
                onPickTemplate(selectedTemplate);
                onClose();
              }}
              className="erp-classic-btn focused h-[30px] text-[13px]"
            >
              موافق
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddTemplate}
              className="erp-classic-btn focused h-[30px] text-[13px]"
            >
              اضافه
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!selectedTemplate) {
                onNotify('يرجى تحديد تقرير للتعديل');
                return;
              }
              onEditTemplate(selectedTemplate);
            }}
            className="erp-classic-btn h-[30px] text-[13px]"
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="erp-classic-btn h-[30px] text-[13px]"
          >
            حذف
          </button>
          <button
            type="button"
            onClick={onClose}
            className="erp-classic-btn h-[30px] text-[13px]"
          >
            خروج
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
};
