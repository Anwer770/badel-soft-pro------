import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ErpState,
  GeneralPropsState,
  MsgConfig,
  ReportTemplateItem,
} from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

const BACKUP_HISTORY_KEY = 'badel_soft_backup_history_v1';

interface SavedBackupEntry {
  id: string;
  fileName: string;
  fullPath: string;
  folder: 'mssql' | 'accounts_secure';
  dateLabel: string;
  typeLabel: string;
  stateSnapshot?: ErpState;
}

const DEFAULT_ACCOUNTS_SECURE_FILES: SavedBackupEntry[] = [
  {
    id: 'def-1',
    fileName: 'dbBillEAccount نظام فارغBackup2026-11-4-23-9.bak',
    fullPath: 'D:\\Accounts_Secure\\backup\\dbBillEAccount نظام فارغBackup2026-11-4-23-9.bak',
    folder: 'accounts_secure',
    dateLabel: '٢٠٢٦/١١/٠٤ ١١:١٠ PM',
    typeLabel: 'BAK File',
  },
  {
    id: 'def-2',
    fileName: 'dbBillEAccountBackup2026-11-12-6-10-59.bak',
    fullPath: 'D:\\Accounts_Secure\\backup\\dbBillEAccountBackup2026-11-12-6-10-59.bak',
    folder: 'accounts_secure',
    dateLabel: '٢٠٢٦/١١/١٣ ٠٦:١١ AM',
    typeLabel: 'BAK File',
  },
  {
    id: 'def-3',
    fileName: 'dbBillEAccountBackup2026-11-11-2-53-36.bak',
    fullPath: 'D:\\Accounts_Secure\\backup\\dbBillEAccountBackup2026-11-11-2-53-36.bak',
    folder: 'accounts_secure',
    dateLabel: '٢٠٢٦/١١/١١ ٠٢:٥٣ AM',
    typeLabel: 'BAK File',
  },
  {
    id: 'def-4',
    fileName: 'dbBillEAccountBackup2026-11-10-3-42-47.bak',
    fullPath: 'D:\\Accounts_Secure\\backup\\dbBillEAccountBackup2026-11-10-3-42-47.bak',
    folder: 'accounts_secure',
    dateLabel: '٢٠٢٦/١١/١٠ ٠٣:٤٦ AM',
    typeLabel: 'BAK File',
  },
  {
    id: 'def-5',
    fileName: 'dbBillEAccountBackup2026-11-4-20-37-28.bak',
    fullPath: 'D:\\Accounts_Secure\\backup\\dbBillEAccountBackup2026-11-4-20-37-28.bak',
    folder: 'accounts_secure',
    dateLabel: '٢٠٢٦/١١/٠٤ ٠٨:٣٧ PM',
    typeLabel: 'BAK File',
  },
];

const DEFAULT_MSSQL_FILES: SavedBackupEntry[] = [
  {
    id: 'ms-1',
    fileName: 'dbBillEAccountUP.BAK',
    fullPath: 'C:\\Program Files\\Microsoft SQL Server\\MSSQL12.MSSQLSERVER\\MSSQL\\Backup\\dbBillEAccountUP.BAK',
    folder: 'mssql',
    dateLabel: '٢٠٢٦/١٠/٣٠ ٠٣:٠٩ AM',
    typeLabel: 'BAK File',
  },
  {
    id: 'ms-2',
    fileName: 'masterup.bak',
    fullPath: 'C:\\Program Files\\Microsoft SQL Server\\MSSQL12.MSSQLSERVER\\MSSQL\\Backup\\masterup.bak',
    folder: 'mssql',
    dateLabel: '٢٠٢٦/١٠/٢٩ ٠٢:٣١ AM',
    typeLabel: 'BAK File',
  },
  {
    id: 'ms-3',
    fileName: 'modelup.bak',
    fullPath: 'C:\\Program Files\\Microsoft SQL Server\\MSSQL12.MSSQLSERVER\\MSSQL\\Backup\\modelup.bak',
    folder: 'mssql',
    dateLabel: '٢٠٢٦/١٠/٢٩ ٠٢:٣٣ AM',
    typeLabel: 'BAK File',
  },
  {
    id: 'ms-4',
    fileName: 'msdbup.bak',
    fullPath: 'C:\\Program Files\\Microsoft SQL Server\\MSSQL12.MSSQLSERVER\\MSSQL\\Backup\\msdbup.bak',
    folder: 'mssql',
    dateLabel: '٢٠٢٦/١٠/٢٩ ٠٢:٣٣ AM',
    typeLabel: 'BAK File',
  },
];

function loadBackupHistory(): SavedBackupEntry[] {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBackupHistory(entries: SavedBackupEntry[]) {
  try {
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(entries.slice(0, 15)));
  } catch {
    // ignore storage limits
  }
}

function makeDefaultBackupFilePath(dbName: string, folder: 'mssql' | 'accounts_secure'): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
  const base =
    folder === 'mssql'
      ? 'C:\\Program Files\\Microsoft SQL Server\\MSSQL12.MSSQLSERVER\\MSSQL\\Backup'
      : 'D:\\Accounts_Secure\\backup';
  return `${base}\\${dbName || 'dbBillEAccount'}Backup${stamp}.bak`;
}

interface BackupRestoreDialogProps {
  open: boolean;
  mode: 'backup' | 'restore';
  zIndex: number;
  propsState: GeneralPropsState;
  currentState?: ErpState;
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
  currentState,
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
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerFolder, setExplorerFolder] = useState<'mssql' | 'accounts_secure'>('mssql');
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerFileInput, setExplorerFileInput] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [history, setHistory] = useState<SavedBackupEntry[]>(() => loadBackupHistory());
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [pendingSnapshot, setPendingSnapshot] = useState<ErpState | null>(null);
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
      setLocationPath('');
      setPendingRestoreFile(null);
      setPendingSnapshot(null);
      setExplorerOpen(false);
      setHistory(loadBackupHistory());
    }
  }, [open, mode, propsState]);

  const activeFolderEntries = useMemo(() => {
    const defaults =
      explorerFolder === 'mssql' ? DEFAULT_MSSQL_FILES : DEFAULT_ACCOUNTS_SECURE_FILES;
    const saved = history.filter((h) => h.folder === explorerFolder);
    const all = [...saved, ...defaults];
    const q = explorerSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter((e) => e.fileName.toLowerCase().includes(q));
  }, [explorerFolder, history, explorerSearch]);

  const handleBrowse = () => {
    const initialFolder: 'mssql' | 'accounts_secure' =
      mode === 'backup' ? 'mssql' : 'accounts_secure';
    setExplorerFolder(initialFolder);
    setExplorerSearch('');
    setSelectedEntryId('');
    setExplorerFileInput(
      mode === 'backup'
        ? makeDefaultBackupFilePath(dbName, initialFolder)
        : locationPath || ''
    );
    setExplorerOpen(true);
  };

  const handleExplorerConfirm = () => {
    if (mode === 'backup') {
      const chosen =
        explorerFileInput.trim() || makeDefaultBackupFilePath(dbName, explorerFolder);
      setLocationPath(chosen);
      setExplorerOpen(false);
      return;
    }

    const picked = activeFolderEntries.find((e) => e.id === selectedEntryId);
    if (picked) {
      setLocationPath(picked.fullPath);
      if (picked.stateSnapshot) {
        setPendingSnapshot(picked.stateSnapshot);
        setPendingRestoreFile(null);
      } else if (currentState) {
        setPendingSnapshot(currentState);
        setPendingRestoreFile(null);
      }
      setExplorerOpen(false);
      return;
    }

    if (explorerFileInput.trim()) {
      setLocationPath(explorerFileInput.trim());
      if (currentState && !pendingRestoreFile) {
        setPendingSnapshot(currentState);
      }
      setExplorerOpen(false);
      return;
    }

    void onShowMsg({
      title: 'Open',
      icon: 'info',
      text: 'اختر ملف نسخة احتياطية أو اختر ملفاً من جهازك.',
    });
  };

  const handleConfirm = async () => {
    if (mode === 'backup') {
      const targetPath =
        locationPath.trim() || makeDefaultBackupFilePath(dbName, 'mssql');
      const parts = targetPath.split('\\');
      const fileName = parts[parts.length - 1] || `${dbName}Backup.bak`;
      const newEntry: SavedBackupEntry = {
        id: `snap-${Date.now()}`,
        fileName,
        fullPath: targetPath,
        folder: targetPath.toLowerCase().includes('accounts_secure')
          ? 'accounts_secure'
          : 'mssql',
        dateLabel: new Date().toLocaleString('ar-EG'),
        typeLabel: 'BAK File',
        stateSnapshot: currentState,
      };
      const updated = [newEntry, ...history];
      setHistory(updated);
      saveBackupHistory(updated);

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
    if (pendingRestoreFile) {
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
      return;
    }

    if (pendingSnapshot) {
      onExecuteRestore(pendingSnapshot);
      onClose();
      return;
    }

    await onShowMsg({
      title: 'استرجاع نسخة احتياطية',
      icon: 'warn',
      text: 'يرجى تحديد ملف النسخة الاحتياطية أولاً عبر زر (......).',
    });
  };

  const title = mode === 'backup' ? 'عمل نسخة احتياطية' : 'استرجاع نسخة احتياطية';

  return (
    <>
      <DraggableWindow
        open={open}
        title={title}
        width={520}
        height={325}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        <div className="flex-1 flex flex-col justify-between bg-[#f0f0f0] px-3 py-2.5">
          <fieldset className="border border-[#d2d2d2] px-3 py-2.5 flex flex-col gap-2 bg-[#f0f0f0]">
            <legend className="px-1.5 text-[12px] font-bold">خيارات</legend>

            {/* اسم السيرفر */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-bold text-right">اسم السيرفر</label>
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
                  className="erp-field flex-1 bg-[#d8d8d8] text-[#555] text-left font-semibold"
                  dir="rtl"
                >
                  <option value={serverName}>{serverName}</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => setServerEditable((v) => !v)}
                className="erp-classic-btn w-[68px] h-[24px] text-[12px]"
              >
                تبديل
              </button>
            </div>

            {/* اسم المستخدم */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-bold text-right">اسم المستخدم</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={integratedSecurity}
                className="erp-field flex-1 disabled:bg-[#e2e2e2]"
              />
              <div className="w-[68px]" />
            </div>

            {/* كلمة المرور */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-bold text-right">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={integratedSecurity}
                className="erp-field flex-1 disabled:bg-[#e2e2e2]"
              />
              <div className="w-[68px]" />
            </div>

            {/* Integrated Security */}
            <div className="flex items-center justify-center py-0.5 pr-12">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold">
                <input
                  type="checkbox"
                  checked={integratedSecurity}
                  onChange={(e) => setIntegratedSecurity(e.target.checked)}
                  className="w-4 h-4 accent-[#0078d7]"
                />
                <span dir="ltr">Integrated Security</span>
              </label>
            </div>

            {/* قاعدة البيانات */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-bold text-right">قاعدة البيانات</label>
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
                  className="erp-field flex-1 bg-[#c8c8c8] text-[#555] text-left font-semibold"
                  dir="rtl"
                >
                  <option value={dbName}>{dbName}</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => setDbEditable((v) => !v)}
                className="erp-classic-btn w-[68px] h-[24px] text-[12px]"
              >
                تبديل
              </button>
            </div>

            {/* الموقع */}
            <div className="flex items-center gap-2">
              <label className="w-[100px] text-[13px] font-bold text-right">الموقع</label>
              <input
                value={locationPath}
                onChange={(e) => setLocationPath(e.target.value)}
                className="erp-field flex-1 bg-[#e4e4e4] text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleBrowse}
                className="erp-classic-btn focused w-[44px] h-[24px] text-[12px]"
              >
                ......
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.bak"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPendingRestoreFile(file);
                  setPendingSnapshot(null);
                  if (file) {
                    setLocationPath(file.name);
                    setExplorerFileInput(file.name);
                    setExplorerOpen(false);
                  }
                }}
              />
            </div>
          </fieldset>

          <div className="flex items-center justify-center gap-16 pt-2 border-t border-[#d8d8d8]">
            <button
              type="button"
              onClick={handleConfirm}
              className="erp-classic-btn w-[125px] h-[28px] text-[13px] font-bold"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={onClose}
              className="erp-classic-btn w-[125px] h-[28px] text-[13px] font-bold"
            >
              الغاء الأمر
            </button>
          </div>
        </div>
      </DraggableWindow>

      {explorerOpen && (
        <div
          dir="ltr"
          className="fixed inset-0 bg-black/35 z-[320] flex items-center justify-center p-4"
        >
          <div className="w-[640px] max-w-[96vw] h-[450px] bg-[#1e1e1e] text-[#eee] border border-[#555] shadow-2xl flex flex-col select-none">
            {/* Dark Explorer Title Bar */}
            <div className="h-[30px] bg-[#141414] px-3 flex items-center justify-between text-[12px] border-b border-[#333]">
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-[#ffd257]">📁</span>
                <span>{mode === 'backup' ? 'Save As' : 'Open'}</span>
              </div>
              <button
                type="button"
                onClick={() => setExplorerOpen(false)}
                className="w-7 h-6 flex items-center justify-center hover:bg-[#e81123] text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Address & Search Bar */}
            <div className="h-[34px] bg-[#252526] border-b border-[#3a3a3a] px-2 flex items-center gap-2 text-[12px]">
              <div className="flex-1 h-[24px] bg-[#1b1b1b] border border-[#444] px-2 flex items-center gap-1.5 text-[#ddd] truncate">
                <span>📁</span>
                <span>
                  {explorerFolder === 'mssql'
                    ? '« MSSQL > Backup'
                    : '« Accounts_Secure > backup'}
                </span>
              </div>
              <input
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                placeholder={
                  explorerFolder === 'mssql' ? 'Search Backup' : 'Search backup'
                }
                className="w-[170px] h-[24px] bg-[#1b1b1b] border border-[#444] px-2 text-[12px] text-white outline-none focus:border-[#0078d7]"
              />
            </div>

            {/* Explorer Toolbar */}
            <div className="h-[28px] bg-[#2b2b2b] border-b border-[#3a3a3a] px-3 flex items-center justify-between text-[11px] text-[#ccc]">
              <div className="flex items-center gap-4">
                <span>Organize ▾</span>
                <span>New folder</span>
              </div>
              {mode === 'restore' && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-0.5 bg-[#0078d7] hover:bg-[#198ae3] text-white text-[11px] cursor-pointer"
                >
                  استعراض ملف من الجهاز (.json)...
                </button>
              )}
            </div>

            {/* Explorer Main Split */}
            <div className="flex-1 flex min-h-0">
              {/* Left Navigation Pane */}
              <div className="w-[155px] bg-[#1c1c1c] border-r border-[#333] p-1.5 flex flex-col gap-0.5 text-[12px] overflow-y-auto">
                <div className="px-2 py-1 text-[#aaa] font-semibold">This PC</div>
                <button
                  type="button"
                  onClick={() => setExplorerFolder('mssql')}
                  className={`text-left px-3 py-1 flex items-center gap-1.5 cursor-pointer ${
                    explorerFolder === 'mssql' ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'
                  }`}
                >
                  <span>💽</span>
                  <span className="truncate">Local Disk (C:)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExplorerFolder('accounts_secure')}
                  className={`text-left px-3 py-1 flex items-center gap-1.5 cursor-pointer ${
                    explorerFolder === 'accounts_secure'
                      ? 'bg-[#37373d] text-white'
                      : 'hover:bg-[#2a2d2e]'
                  }`}
                >
                  <span>📁</span>
                  <span className="truncate">Accounts_Secure</span>
                </button>
              </div>

              {/* Right File List */}
              <div className="flex-1 bg-[#1e1e1e] overflow-y-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-[#252526] border-b border-[#383838] text-[#bbb] sticky top-0">
                    <tr>
                      <th className="py-1 px-2 text-left font-normal">Name</th>
                      <th className="py-1 px-2 text-left font-normal w-[140px]">Date modified</th>
                      <th className="py-1 px-2 text-left font-normal w-[75px]">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFolderEntries.map((entry) => {
                      const isSel = selectedEntryId === entry.id;
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => {
                            setSelectedEntryId(entry.id);
                            setExplorerFileInput(entry.fullPath);
                          }}
                          onDoubleClick={() => {
                            setSelectedEntryId(entry.id);
                            setExplorerFileInput(entry.fullPath);
                            if (mode === 'backup') {
                              setLocationPath(entry.fullPath);
                              setExplorerOpen(false);
                            } else {
                              setLocationPath(entry.fullPath);
                              setPendingSnapshot(entry.stateSnapshot || currentState || null);
                              setPendingRestoreFile(null);
                              setExplorerOpen(false);
                            }
                          }}
                          className={`cursor-pointer ${
                            isSel ? 'bg-[#0078d7] text-white' : 'hover:bg-[#2d2d30] text-[#e6e6e6]'
                          }`}
                        >
                          <td className="py-1 px-2 truncate max-w-[230px]">
                            <span className="mr-1.5">📄</span>
                            {entry.fileName}
                          </td>
                          <td className="py-1 px-2 text-[#bbb]">{entry.dateLabel}</td>
                          <td className="py-1 px-2 text-[#bbb]">{entry.typeLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom File Name & Save/Open Buttons */}
            <div className="bg-[#252526] border-t border-[#3a3a3a] px-3 py-2 flex flex-col gap-2 text-[12px]">
              <div className="flex items-center gap-2">
                <label className="w-[80px] text-right text-[#ccc]">File name:</label>
                <input
                  value={explorerFileInput}
                  onChange={(e) => setExplorerFileInput(e.target.value)}
                  className="flex-1 h-[24px] bg-[#1b1b1b] border border-[#0078d7] px-2 text-white outline-none"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {mode === 'backup' && (
                    <>
                      <label className="w-[80px] text-right text-[#ccc]">Save as type:</label>
                      <select className="flex-1 h-[24px] bg-[#1b1b1b] border border-[#444] px-2 text-[#ddd] outline-none">
                        <option>Backup Files (*.bak; *.json)</option>
                      </select>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExplorerConfirm}
                    className="w-[84px] h-[24px] bg-[#333] hover:bg-[#444] border border-[#777] text-white cursor-pointer"
                  >
                    {mode === 'backup' ? 'Save' : 'Open'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExplorerOpen(false)}
                    className="w-[84px] h-[24px] bg-[#333] hover:bg-[#444] border border-[#555] text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
