import React, { useState } from 'react';
import { BACKUP_FOLDER_TREE, type FolderNode } from '../data/erpDefaults';
import { TitleBar } from './TitleBar';

interface FolderBrowseDialogProps {
  open: boolean;
  initialPath: string;
  onConfirm: (path: string) => void;
  onCancel: () => void;
}

export const FolderBrowseDialog: React.FC<FolderBrowseDialogProps> = ({
  open,
  initialPath,
  onConfirm,
  onCancel,
}) => {
  const [selectedPath, setSelectedPath] = useState(initialPath || 'D:\\Accounts_Secure\\backup');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    '': true,
    'D:': true,
    'D:\\Accounts_Secure': true,
  });

  if (!open) return null;

  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderNode = (node: FolderNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = !!expanded[node.path];
    const isSelected = selectedPath === node.path && node.path !== '';

    return (
      <div key={node.path || 'root'}>
        <div
          onClick={() => {
            if (hasChildren) toggleExpand(node.path);
            if (node.path) setSelectedPath(node.path);
          }}
          style={{ paddingRight: `${depth * 18 + 6}px` }}
          className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer text-[13px] select-none ${
            isSelected ? 'bg-[#0078d7] text-white' : 'hover:bg-[#e5f3ff] text-black'
          }`}
        >
          <span className="w-4 text-center text-[11px] font-bold">
            {hasChildren ? (isExpanded ? '▾' : '◂') : ''}
          </span>
          <svg className="w-4 h-3.5 shrink-0" viewBox="0 0 17 15">
            <path d="M1 3h5l1.5 2H16v9H1z" fill="#F7D774" stroke="#C9A227" strokeWidth="0.8" />
          </svg>
          <span className="truncate">{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div dir="rtl" className="fixed inset-0 bg-black/25 z-[300] flex items-center justify-center p-4">
      <div className="w-[380px] max-w-full bg-[#f0f0f0] border border-[#666] shadow-2xl flex flex-col">
        <TitleBar title="استعراض المجلدات" onClose={onCancel} />
        <div className="p-3.5 flex flex-col gap-3">
          <div className="h-[250px] bg-white border border-[#8e8e8e] overflow-y-auto p-1 erp-scrollbar">
            {renderNode(BACKUP_FOLDER_TREE)}
          </div>
          <div className="flex items-center gap-2">
            <label className="font-bold text-[13px] shrink-0">المجلد:</label>
            <input
              dir="ltr"
              type="text"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="erp-field flex-1 text-left"
            />
          </div>
          <div className="flex justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => selectedPath && onConfirm(selectedPath)}
              className="erp-classic-btn focused w-[104px] h-[30px] text-[13px]"
            >
              موافق
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="erp-classic-btn w-[104px] h-[30px] text-[13px]"
            >
              الغاء الأمر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
