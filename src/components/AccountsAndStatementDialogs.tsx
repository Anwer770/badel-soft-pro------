import React, { useEffect, useMemo, useState } from 'react';
import { toAr } from '../data/erpDefaults';
import type { JournalEntry, MsgConfig } from '../types/erp';
import { DraggableWindow } from './DraggableWindow';

export interface AccTreeNode {
  code: string;
  name: string;
  kind: 'folder' | 'leaf';
  children?: AccTreeNode[];
}

export const ACCOUNT_TREE_DATA: AccTreeNode[] = [
  {
    code: '1',
    name: 'الأصول',
    kind: 'folder',
    children: [
      {
        code: '11',
        name: 'الأصول الثابتة',
        kind: 'folder',
        children: [
          {
            code: '111',
            name: 'الاصول الثابتة .',
            kind: 'folder',
            children: [
              { code: '11101', name: 'السيارات ووسائل النقل', kind: 'folder', children: [] },
              { code: '11103', name: 'الاثاث والتجهيزات', kind: 'folder', children: [] },
            ],
          },
        ],
      },
      {
        code: '12',
        name: 'الأصول المتداولة',
        kind: 'folder',
        children: [
          {
            code: '121',
            name: 'المخازن',
            kind: 'folder',
            children: [
              {
                code: '12103',
                name: 'مخازن .',
                kind: 'folder',
                children: [{ code: '1210301', name: 'مستودع1', kind: 'leaf' }],
              },
            ],
          },
          {
            code: '122',
            name: 'الزبائن',
            kind: 'folder',
            children: [{ code: '1220001', name: 'زبون1', kind: 'leaf' }],
          },
          {
            code: '123',
            name: 'الصناديق',
            kind: 'folder',
            children: [{ code: '12301', name: 'الصندوق', kind: 'leaf' }],
          },
          { code: '124', name: 'البنوك', kind: 'folder', children: [] },
          { code: '126', name: 'السلف والعهد', kind: 'folder', children: [] },
        ],
      },
      {
        code: '15',
        name: 'بضاعة أخر المدة',
        kind: 'folder',
        children: [{ code: '1501', name: 'بضاعة أخر المدة.', kind: 'leaf' }],
      },
    ],
  },
  {
    code: '2',
    name: 'الخصوم',
    kind: 'folder',
    children: [
      {
        code: '21',
        name: 'الالتزامات الثابتة',
        kind: 'folder',
        children: [
          {
            code: '211',
            name: 'حقوق الملكية',
            kind: 'folder',
            children: [
              {
                code: '21101',
                name: 'رأس المال المقدم',
                kind: 'folder',
                children: [{ code: '21101001', name: 'رأس المال المقدم .', kind: 'leaf' }],
              },
              {
                code: '21102',
                name: 'الارباح والخسائر',
                kind: 'folder',
                children: [{ code: '211021', name: 'ارباح', kind: 'leaf' }],
              },
              { code: '21103', name: 'المسحوبات', kind: 'folder', children: [] },
            ],
          },
          {
            code: '212',
            name: 'المخصصات والمجمعات',
            kind: 'folder',
            children: [
              {
                code: '21201',
                name: 'المجمعات',
                kind: 'folder',
                children: [
                  { code: '21201001', name: 'مجمع اهلاك الاثاث والتجهيزات', kind: 'leaf' },
                ],
              },
            ],
          },
        ],
      },
      {
        code: '22',
        name: 'الالتزامات المتداولة',
        kind: 'folder',
        children: [
          {
            code: '221',
            name: 'الموردين',
            kind: 'folder',
            children: [{ code: '221001', name: 'مورد1', kind: 'leaf' }],
          },
        ],
      },
    ],
  },
  {
    code: '3',
    name: 'المصاريف العامة',
    kind: 'folder',
    children: [
      {
        code: '31',
        name: 'مصاريف النشاط الجاري',
        kind: 'folder',
        children: [
          { code: '311', name: 'مشتريات', kind: 'leaf' },
          { code: '312', name: 'مردودات المبيعات', kind: 'leaf' },
          { code: '313', name: 'الخصم المسموح به', kind: 'leaf' },
          { code: '314', name: 'ادخال', kind: 'leaf' },
        ],
      },
      {
        code: '320',
        name: 'بضاعة أول المدة',
        kind: 'folder',
        children: [{ code: '32001', name: 'بضاعة أول المده .', kind: 'leaf' }],
      },
      {
        code: '32',
        name: 'مصاريف ادارية وعمومية',
        kind: 'folder',
        children: [
          {
            code: '321',
            name: 'مصاريف ادارية',
            kind: 'folder',
            children: [
              { code: '32101001', name: 'مرتبات وأجور', kind: 'leaf' },
              { code: '32101002', name: 'مواصلات وتنقلات', kind: 'leaf' },
              { code: '32101003', name: 'قرطاسية ومطبوعات', kind: 'leaf' },
              { code: '32101004', name: 'تسهيلات', kind: 'leaf' },
              { code: '32101005', name: 'صيانة واصلاحات', kind: 'leaf' },
              { code: '32101006', name: 'نثريات متنوعة', kind: 'leaf' },
              { code: '32101007', name: 'العجز في المبيعات', kind: 'leaf' },
              { code: '32101008', name: 'الخصم للزبائن', kind: 'leaf' },
              { code: '32101009', name: 'العجز في المخزون', kind: 'leaf' },
              { code: '32101010', name: 'مصاريف ايجار المحل', kind: 'leaf' },
            ],
          },
          {
            code: '322',
            name: 'عقوبات ومخالفات',
            kind: 'folder',
            children: [
              { code: '32201', name: 'عقوبات مالية', kind: 'leaf' },
              { code: '32202', name: 'غياب وتأخير', kind: 'leaf' },
            ],
          },
        ],
      },
      {
        code: '33',
        name: 'إهلاكات الاصول',
        kind: 'folder',
        children: [{ code: '3301', name: 'اهلاك الأثاث والتجهيزات', kind: 'leaf' }],
      },
    ],
  },
  {
    code: '4',
    name: 'الإيرادات',
    kind: 'folder',
    children: [
      {
        code: '41',
        name: 'ايرادات النشاط الجاري',
        kind: 'folder',
        children: [
          { code: '411', name: 'المبيعات', kind: 'leaf' },
          { code: '412', name: 'الخصم المكتسب', kind: 'leaf' },
          { code: '413', name: 'مردود مشتريات', kind: 'leaf' },
          { code: '414', name: 'اخراج', kind: 'leaf' },
        ],
      },
      {
        code: '42',
        name: 'ايرادات أخرى',
        kind: 'folder',
        children: [
          { code: '4201', name: 'ايرادات متنوعة', kind: 'leaf' },
          { code: '4202', name: 'ايرادات الزيادة في الصندوق', kind: 'leaf' },
          { code: '4203', name: 'ايرادات الزيادة في المخزون', kind: 'leaf' },
        ],
      },
    ],
  },
];

export function findAccountCodeInTree(nameOrCode: string): string {
  const q = nameOrCode.trim();
  if (!q) return '';
  let found = '';
  const walk = (nodes: AccTreeNode[]) => {
    for (const n of nodes) {
      if (n.name === q || n.code === q || `${n.code}-${n.name}` === q) {
        found = n.code;
        return;
      }
      if (n.children) walk(n.children);
      if (found) return;
    }
  };
  walk(ACCOUNT_TREE_DATA);
  return found;
}

interface AccTreeDialogProps {
  open: boolean;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  onAssignAccount?: (role: 'from' | 'to', accountName: string, accountCode: string) => void;
  onSelectSingle?: (accountName: string, accountCode: string) => void;
  onNotify: (msg: string) => void;
}

export const AccTreeDialog: React.FC<AccTreeDialogProps> = ({
  open,
  zIndex,
  onFocus,
  onClose,
  onAssignAccount,
  onSelectSingle,
  onNotify,
}) => {
  const [searchText, setSearchText] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<AccTreeNode | null>(null);

  useEffect(() => {
    if (open) {
      setExpanded({});
      setSearchText('');
      setSelectedNode(null);
    }
  }, [open]);

  const handleSearch = () => {
    const q = searchText.trim().toLowerCase();
    if (!q) {
      setExpanded({});
      return;
    }
    const nextExpanded: Record<string, boolean> = {};
    let firstMatch: AccTreeNode | null = null;

    const visit = (node: AccTreeNode, ancestors: string[]) => {
      const label = `${node.code}-${node.name}`.toLowerCase();
      const matched = label.includes(q);
      if (matched) {
        if (!firstMatch) firstMatch = node;
        for (const anc of ancestors) {
          nextExpanded[anc] = true;
        }
      }
      if (node.children) {
        for (const ch of node.children) {
          visit(ch, [...ancestors, node.code]);
        }
      }
    };

    for (const root of ACCOUNT_TREE_DATA) {
      visit(root, []);
    }
    setExpanded(nextExpanded);
    if (firstMatch) {
      setSelectedNode(firstMatch);
    } else {
      onNotify('لم يتم العثور على حساب مطابق');
    }
  };

  const toggleNode = (code: string) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const renderTree = (nodes: AccTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = Boolean(expanded[node.code]);
      const isSelected = selectedNode?.code === node.code;

      return (
        <div key={node.code}>
          <div
            onClick={() => setSelectedNode(node)}
            onDoubleClick={() => {
              if (hasChildren) {
                toggleNode(node.code);
              } else if (onSelectSingle) {
                onSelectSingle(node.name, node.code);
                onClose();
              } else if (onAssignAccount) {
                onAssignAccount('from', node.name, node.code);
                onClose();
              }
            }}
            style={{ paddingRight: `${depth * 22 + 8}px` }}
            className="flex items-center gap-1.5 py-[2px] px-2 cursor-pointer select-none text-[14px] leading-tight"
          >
            {/* Expand/Collapse Box */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleNode(node.code);
              }}
              className={`w-[13px] h-[13px] border flex items-center justify-center text-[11px] leading-none shrink-0 bg-white ${
                hasChildren
                  ? 'border-[#777] text-[#222] cursor-pointer'
                  : 'border-transparent bg-transparent pointer-events-none'
              }`}
              aria-label={isExpanded ? 'طي' : 'توسيع'}
            >
              {hasChildren ? (isExpanded ? '−' : '+') : ''}
            </button>

            {/* Folder or Green Ledger Icon matching frmAccTree */}
            {node.kind === 'folder' ? (
              <svg className="w-4 h-3.5 shrink-0" viewBox="0 0 18 15">
                <path
                  d="M1 2.5h5.5l1.6 2H17v8.5H1z"
                  fill="#F7D358"
                  stroke="#B88E1A"
                  strokeWidth="1"
                />
                <path d="M1 5h16" stroke="#C79F28" strokeWidth="0.8" />
              </svg>
            ) : (
              <svg className="w-4 h-3.5 shrink-0" viewBox="0 0 18 15">
                <rect
                  x="1"
                  y="3"
                  width="15"
                  height="9"
                  rx="1"
                  fill="#22A83B"
                  stroke="#0F6B20"
                  strokeWidth="1"
                />
                <path d="M3 5.5h11M3 8h11" stroke="#A7F3B5" strokeWidth="0.9" />
              </svg>
            )}

            <span
              className={`px-1 font-bold ${
                isSelected ? 'bg-[#0078d7] text-white' : 'text-[#111] hover:bg-[#dce8f5]'
              }`}
            >
              {toAr(node.code)}-{node.name}
            </span>
          </div>

          {hasChildren && isExpanded && node.children && (
            <div className="border-r border-dotted border-[#8e9bb0] mr-[14px]">
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <DraggableWindow
      open={open}
      title="frmAccTree"
      width={1180}
      height={680}
      initialMaximized
      zIndex={zIndex}
      onFocus={onFocus}
      onClose={onClose}
    >
      <div className="flex-1 flex flex-col bg-[#dce4ee] overflow-hidden">
        {/* Top Search Bar */}
        <div className="py-2 px-3 bg-[#dce4ee] border-b border-[#b9c4d4] flex items-center justify-center">
          <div className="flex items-center gap-2 bg-[#dce4ee] border border-[#c0cad8] px-3 py-1.5">
            <label className="font-bold text-[14px] text-[#111] shrink-0">اسم الحساب</label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="erp-field w-[340px] max-w-[40vw] h-[28px] border border-[#0078d7] bg-white"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="erp-classic-btn h-[28px] px-4 text-[13px]"
            >
              بحث
            </button>
            <input
              readOnly
              value={selectedNode ? selectedNode.code : ''}
              className="erp-field w-[180px] h-[28px] bg-[#eceef2] text-center"
              dir="ltr"
            />
          </div>
        </div>

        {/* TreeView Canvas */}
        <div className="flex-1 bg-[#cfdce8] border-t border-[#99a7b8] overflow-y-auto p-2 erp-scrollbar">
          {renderTree(ACCOUNT_TREE_DATA)}
        </div>

        {/* Action Strip when selecting into Journal or Statement */}
        {(onAssignAccount || onSelectSingle) && (
          <div className="bg-[#f0f0f0] border-t border-[#b8c0cc] px-3 py-1.5 flex items-center justify-between gap-2">
            <div className="text-[12px] text-[#333] font-semibold">
              {selectedNode
                ? `الحساب المحدد: ${toAr(selectedNode.code)} - ${selectedNode.name}`
                : 'اختر حساباً من الشجرة ثم اضغط تعيين أو انقر نقراً مزدوجاً'}
            </div>
            <div className="flex items-center gap-2">
              {onAssignAccount && (
                <>
                  <button
                    type="button"
                    disabled={!selectedNode}
                    onClick={() => {
                      if (!selectedNode) return;
                      onAssignAccount('from', selectedNode.name, selectedNode.code);
                      onClose();
                    }}
                    className="erp-classic-btn focused h-[28px] px-3 text-[12px] disabled:opacity-50"
                  >
                    تعيين في من حساب (المدين)
                  </button>
                  <button
                    type="button"
                    disabled={!selectedNode}
                    onClick={() => {
                      if (!selectedNode) return;
                      onAssignAccount('to', selectedNode.name, selectedNode.code);
                      onClose();
                    }}
                    className="erp-classic-btn h-[28px] px-3 text-[12px] disabled:opacity-50"
                  >
                    تعيين في إلى حساب (الدائن)
                  </button>
                </>
              )}
              {onSelectSingle && (
                <button
                  type="button"
                  disabled={!selectedNode}
                  onClick={() => {
                    if (!selectedNode) return;
                    onSelectSingle(selectedNode.name, selectedNode.code);
                    onClose();
                  }}
                  className="erp-classic-btn focused h-[28px] px-4 text-[12px] disabled:opacity-50"
                >
                  اختيار الحساب
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="erp-classic-btn h-[28px] px-4 text-[12px]"
              >
                خروج
              </button>
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};

interface DetailedAccountStatementDialogProps {
  open: boolean;
  zIndex: number;
  initialAccountName?: string;
  entries: JournalEntry[];
  onFocus: () => void;
  onClose: () => void;
  onOpenPrint: () => void;
  onShowMsg: (cfg: MsgConfig) => Promise<string>;
  onNotify: (msg: string) => void;
}

export const DetailedAccountStatementDialog: React.FC<DetailedAccountStatementDialogProps> = ({
  open,
  zIndex,
  initialAccountName = 'الصندوق',
  entries,
  onFocus,
  onClose,
  onOpenPrint,
  onShowMsg,
  onNotify,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [templateModel, setTemplateModel] = useState('');
  const [accountName, setAccountName] = useState(initialAccountName);
  const [counterAccount, setCounterAccount] = useState('');
  const [exceptAccount, setExceptAccount] = useState('');
  const [specificAmount, setSpecificAmount] = useState('');
  const [specificStmt, setSpecificStmt] = useState('');
  const [specificDoc, setSpecificDoc] = useState('');
  const [exceptStmt, setExceptStmt] = useState('');
  const [fullPeriod, setFullPeriod] = useState(true);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [activeTab, setActiveTab] = useState(0);

  // General Options checkboxes matching Screenshot_2026-11-24_010933_adc03551.png
  const [showBalance, setShowBalance] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState('كافة العملات');
  const [currencyDetails, setCurrencyDetails] = useState(false);
  const [showMoveCurAmount, setShowMoveCurAmount] = useState(false);
  const [showCostCenters, setShowCostCenters] = useState(false);
  const [showBalanceWords, setShowBalanceWords] = useState(false);
  const [fitAllColumns, setFitAllColumns] = useState(false);

  const [showCounterAcc, setShowCounterAcc] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showOpType, setShowOpType] = useState(false);
  const [matchType, setMatchType] = useState('');

  const [showOpeningBal, setShowOpeningBal] = useState(false);
  const [showMoveNo, setShowMoveNo] = useState(false);
  const [lastBalance, setLastBalance] = useState(false);
  const [showEntryNo, setShowEntryNo] = useState(false);
  const [showMatchCol, setShowMatchCol] = useState(false);

  const [showDoc, setShowDoc] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  const [showMoveTotals, setShowMoveTotals] = useState(false);
  const [showDueAmount, setShowDueAmount] = useState(false);
  const [hideCurDiff, setHideCurDiff] = useState(false);
  const [hideCompoundDetails, setHideCompoundDetails] = useState(false);

  const [viewResults, setViewResults] = useState(false);
  const [treePickerOpen, setTreePickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setAccountName(initialAccountName);
      setViewResults(false);
      setActiveTab(0);
    }
  }, [open, initialAccountName]);

  const matchingRows = useMemo(() => {
    const accQ = accountName.trim().toLowerCase();
    const counterQ = counterAccount.trim().toLowerCase();
    const exceptQ = exceptAccount.trim().toLowerCase();
    const amtQ = specificAmount.trim();
    const stmtQ = specificStmt.trim().toLowerCase();
    const docQ = specificDoc.trim().toLowerCase();
    const exStmtQ = exceptStmt.trim().toLowerCase();

    return entries.filter((e) => {
      const fromL = e.from.toLowerCase();
      const toL = e.to.toLowerCase();
      if (accQ && !fromL.includes(accQ) && !toL.includes(accQ)) return false;
      if (counterQ && !fromL.includes(counterQ) && !toL.includes(counterQ)) return false;
      if (exceptQ && (fromL.includes(exceptQ) || toL.includes(exceptQ))) return false;
      if (amtQ && e.rec !== amtQ && e.pay !== amtQ && e.dhm !== amtQ) return false;
      if (stmtQ && !e.stmt.toLowerCase().includes(stmtQ)) return false;
      if (docQ && !e.doc.toLowerCase().includes(docQ)) return false;
      if (exStmtQ && e.stmt.toLowerCase().includes(exStmtQ)) return false;
      if (currencyFilter !== 'كافة العملات' && e.cur !== currencyFilter) return false;
      if (!fullPeriod && e.at) {
        if (fromDate && e.at < fromDate) return false;
        if (toDate && e.at > toDate) return false;
      }
      return true;
    });
  }, [
    entries,
    accountName,
    counterAccount,
    exceptAccount,
    specificAmount,
    specificStmt,
    specificDoc,
    exceptStmt,
    currencyFilter,
    fullPeriod,
    fromDate,
    toDate,
  ]);

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const r of matchingRows) {
      totalIn += parseFloat(r.rec) || 0;
      totalOut += parseFloat(r.pay) || 0;
      if (!r.rec && !r.pay && r.dhm) {
        if (r.from.includes(accountName.trim())) totalIn += parseFloat(r.dhm) || 0;
        else totalOut += parseFloat(r.dhm) || 0;
      }
    }
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [matchingRows, accountName]);

  const stepDates = (delta: number) => {
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    if (!Number.isNaN(d1.getTime())) {
      d1.setDate(d1.getDate() + delta);
      setFromDate(d1.toISOString().slice(0, 10));
    }
    if (!Number.isNaN(d2.getTime())) {
      d2.setDate(d2.getDate() + delta);
      setToDate(d2.toISOString().slice(0, 10));
    }
  };

  const resetForm = () => {
    setCounterAccount('');
    setExceptAccount('');
    setSpecificAmount('');
    setSpecificStmt('');
    setSpecificDoc('');
    setExceptStmt('');
    setFullPeriod(true);
    setCurrencyFilter('كافة العملات');
    onNotify('تم تجهيز نموذج كشف حساب جديد');
  };

  const tabLabels = [
    'خيارات عامة',
    'خيارات إضافية',
    'خيارات الفواتير',
    'السنوات السابقة',
    'خصائص الجدول',
  ];

  return (
    <>
      <DraggableWindow
        open={open}
        title="كشف حساب تفصيلي"
        width={900}
        height={640}
        zIndex={zIndex}
        onFocus={onFocus}
        onClose={onClose}
      >
        {!viewResults ? (
          <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 overflow-y-auto erp-scrollbar gap-2.5 text-[13px]">
            {/* Row 1: النموذج */}
            <div className="flex items-center gap-2 pb-1 border-b border-[#d4d4d4]">
              <label className="font-bold w-[90px] shrink-0">النموذج</label>
              <select
                value={templateModel}
                onChange={(e) => setTemplateModel(e.target.value)}
                className="erp-field flex-1 bg-white"
              >
                <option value="" />
                <option value="نموذج كشف تفصيلي">نموذج كشف تفصيلي</option>
                <option value="كشف الصندوق اليومي">كشف الصندوق اليومي</option>
              </select>
              <button
                type="button"
                onClick={resetForm}
                className="erp-classic-btn w-[68px] h-[28px] text-[12px]"
              >
                جديد
              </button>
              <button
                type="button"
                onClick={() => onNotify('تم حفظ خيارات نموذج كشف الحساب')}
                className="erp-classic-btn w-[68px] h-[28px] text-[12px]"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => onNotify('لا يوجد نموذج مخصص محدد للحذف')}
                className="erp-classic-btn w-[68px] h-[28px] text-[12px]"
              >
                حذف
              </button>
            </div>

            {/* Row 2: اسم الحساب */}
            <div className="flex items-center gap-2">
              <label className="font-bold w-[90px] shrink-0">اسم الحساب</label>
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="erp-field flex-1 border-2 border-[#0078d7] font-bold text-center"
              />
              <button
                type="button"
                onClick={() => setTreePickerOpen(true)}
                className="erp-classic-btn px-3 h-[26px] text-[12px]"
              >
                بحث
              </button>
              <div className="w-[230px] h-[26px] bg-[#e6e6e6] border border-[#bdbdbd] flex items-center justify-center font-bold text-[#222]">
                {matchingRows.length === 0 ? 'لايوجد رصيد' : `${summary.net.toFixed(2)}`}
              </div>
            </div>

            {/* Rows 3-6: Account & Filter Criteria */}
            <div className="bg-[#f4f4f4] border border-[#d6d6d6] p-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label className="font-bold w-[90px] shrink-0">الحساب المقابل</label>
                <input
                  value={counterAccount}
                  onChange={(e) => setCounterAccount(e.target.value)}
                  className="erp-field flex-1"
                />
                <input
                  readOnly
                  value={findAccountCodeInTree(counterAccount)}
                  className="erp-field w-[230px] bg-[#e6e6e6] text-center"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold w-[90px] shrink-0">ماعدا حساب</label>
                <input
                  value={exceptAccount}
                  onChange={(e) => setExceptAccount(e.target.value)}
                  className="erp-field flex-1"
                />
                <input
                  readOnly
                  value={findAccountCodeInTree(exceptAccount)}
                  className="erp-field w-[230px] bg-[#e6e6e6] text-center"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <label className="font-bold w-[90px] shrink-0">مبلغ محدد</label>
                  <input
                    value={specificAmount}
                    onChange={(e) => setSpecificAmount(e.target.value)}
                    className="erp-field flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-bold w-[80px] shrink-0">بيان محدد</label>
                  <input
                    value={specificStmt}
                    onChange={(e) => setSpecificStmt(e.target.value)}
                    className="erp-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setViewResults(true)}
                    className="erp-classic-btn px-2.5 h-[24px] text-[12px]"
                  >
                    بحث
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <label className="font-bold w-[90px] shrink-0">سند محدد</label>
                  <input
                    value={specificDoc}
                    onChange={(e) => setSpecificDoc(e.target.value)}
                    className="erp-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setViewResults(true)}
                    className="erp-classic-btn px-2.5 h-[24px] text-[12px]"
                  >
                    بحث
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-bold w-[80px] shrink-0">ماعدا بيان</label>
                  <input
                    value={exceptStmt}
                    onChange={(e) => setExceptStmt(e.target.value)}
                    className="erp-field flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Date Bar */}
            <div className="bg-[#f4f4f4] border border-[#d6d6d6] p-2 flex flex-col gap-2">
              <div className="flex justify-start">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={fullPeriod}
                    onChange={(e) => setFullPeriod(e.target.checked)}
                    className="w-4 h-4 accent-[#0078d7]"
                  />
                  <span>الفترة كاملة</span>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="font-bold shrink-0">من تاريخ:</label>
                <input
                  type="date"
                  value={fromDate}
                  disabled={fullPeriod}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="erp-field w-[150px] disabled:bg-[#e5e5e5]"
                />
                <label className="font-bold shrink-0">الى تاريخ:</label>
                <input
                  type="date"
                  value={toDate}
                  disabled={fullPeriod}
                  onChange={(e) => setToDate(e.target.value)}
                  className="erp-field w-[150px] disabled:bg-[#e5e5e5]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFullPeriod(false);
                    setFromDate(today);
                    setToDate(today);
                  }}
                  className="erp-classic-btn px-4 h-[28px] text-[12px]"
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFullPeriod(false);
                    setFromDate(`${today.slice(0, 7)}-01`);
                    setToDate(today);
                  }}
                  className="erp-classic-btn px-4 h-[28px] text-[12px]"
                >
                  الشهر
                </button>
                <button
                  type="button"
                  onClick={() => stepDates(-1)}
                  className="erp-classic-btn w-9 h-[28px] text-[13px]"
                  title="اليوم السابق"
                >
                  ⬇
                </button>
                <button
                  type="button"
                  onClick={() => stepDates(1)}
                  className="erp-classic-btn w-9 h-[28px] text-[13px]"
                  title="اليوم التالي"
                >
                  ⬆
                </button>
              </div>
            </div>

            {/* 5 Tabs */}
            <div className="flex-1 flex flex-col min-h-[210px]">
              <div className="flex border-b border-[#b5b5b5]">
                {tabLabels.map((lbl, idx) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1 text-[13px] font-bold border border-[#b5b5b5] border-b-0 -ml-px cursor-pointer ${
                      activeTab === idx ? 'bg-white relative top-[1px] pb-[5px]' : 'bg-[#eaeaea]'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <div className="flex-1 bg-white border border-[#b5b5b5] border-t-0 p-3">
                {activeTab === 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                    {/* Column 1 (Rightmost) */}
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showBalance}
                          onChange={(e) => setShowBalance(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار الرصيد</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold shrink-0">العملة</span>
                        <select
                          value={currencyFilter}
                          onChange={(e) => setCurrencyFilter(e.target.value)}
                          className="erp-field flex-1 bg-[#e5e5e5]"
                        >
                          <option value="كافة العملات">كافة العملات</option>
                          <option value="ريال يمني">ريال يمني</option>
                          <option value="ريال سعودي">ريال سعودي</option>
                          <option value="دولار">دولار</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currencyDetails}
                          onChange={(e) => setCurrencyDetails(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>تفصيل العملات</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMoveCurAmount}
                          onChange={(e) => setShowMoveCurAmount(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار المبلغ بعملة الحركة</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCostCenters}
                          onChange={(e) => setShowCostCenters(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار مراكز الكلفة</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showBalanceWords}
                          onChange={(e) => setShowBalanceWords(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار إجمالي الرصيد كتابه</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fitAllColumns}
                          onChange={(e) => setFitAllColumns(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>احتوى التقرير لكافة الاعمدة</span>
                      </label>
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCounterAcc}
                          onChange={(e) => setShowCounterAcc(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار الحساب المقابل</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showNotes}
                          onChange={(e) => setShowNotes(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار الملاحظات</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOpType}
                          onChange={(e) => setShowOpType(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>نوع العملية</span>
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="font-bold shrink-0">نوع مطابقة</span>
                        <select
                          value={matchType}
                          onChange={(e) => setMatchType(e.target.value)}
                          className="erp-field flex-1 bg-[#e5e5e5]"
                        >
                          <option value="" />
                          <option value="مطابق">مطابق</option>
                          <option value="غير مطابق">غير مطابق</option>
                        </select>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOpeningBal}
                          onChange={(e) => setShowOpeningBal(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار الرصيد المدور</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMoveNo}
                          onChange={(e) => setShowMoveNo(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>رقم الحركة</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lastBalance}
                          onChange={(e) => setLastBalance(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>أخر ترصيد</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showEntryNo}
                          onChange={(e) => setShowEntryNo(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>رقم القيد</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMatchCol}
                          onChange={(e) => setShowMatchCol(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>عمود المطابقة</span>
                      </label>
                    </div>

                    {/* Column 4 (Leftmost) */}
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showDoc}
                          onChange={(e) => setShowDoc(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار المستند</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showTotal}
                          onChange={(e) => setShowTotal(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار المجموع</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMoveTotals}
                          onChange={(e) => setShowMoveTotals(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار إجماليات الحركات</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showDueAmount}
                          onChange={(e) => setShowDueAmount(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>اظهار مبلغ الاستحقاق</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideCurDiff}
                          onChange={(e) => setHideCurDiff(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>عدم إظهار قيد فروق العملة</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideCompoundDetails}
                          onChange={(e) => setHideCompoundDetails(e.target.checked)}
                          className="accent-[#0078d7]"
                        />
                        <span>عدم تفصيل القيد المركب</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#555] text-[13px]">
                    خيارات تبويب «{tabLabels[activeTab]}» متوافقة مع الإعدادات الافتراضية للحساب المحدد.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center justify-center gap-8 pt-1">
              <button
                type="button"
                onClick={async () => {
                  if (!accountName.trim()) {
                    await onShowMsg({
                      title: 'كشف حساب تفصيلي',
                      icon: 'warn',
                      text: 'يرجى تحديد اسم الحساب أولاً.',
                    });
                    return;
                  }
                  setViewResults(true);
                }}
                className="erp-classic-btn focused w-[140px] h-[34px] text-[14px]"
              >
                عرض
              </button>
              <button
                type="button"
                onClick={onClose}
                className="erp-classic-btn w-[140px] h-[34px] text-[14px]"
              >
                خروج
              </button>
            </div>
          </div>
        ) : (
          /* Statement Results Table View */
          <div className="flex-1 flex flex-col bg-[#f0f0f0] p-3 overflow-hidden gap-2.5">
            <div className="bg-white border border-[#bdbdbd] p-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <div>
                كشف حساب تفصيلي: <b className="text-[#005a9e]">{accountName}</b> ({currencyFilter})
              </div>
              <div className="flex gap-4 font-bold">
                <span className="text-emerald-700">مقبوضات/مدين: {summary.totalIn.toFixed(2)}</span>
                <span className="text-rose-700">مدفوعات/دائن: {summary.totalOut.toFixed(2)}</span>
                <span className="text-[#111]">الرصيد الصافي: {summary.net.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex-1 bg-white border border-[#999] overflow-auto erp-scrollbar">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#d7d7f4]">
                    {showMoveNo && <th className="border border-[#999] p-1.5">رقم الحركة</th>}
                    <th className="border border-[#999] p-1.5">التاريخ</th>
                    <th className="border border-[#999] p-1.5">من حساب (مدين)</th>
                    <th className="border border-[#999] p-1.5">إلى حساب (دائن)</th>
                    <th className="border border-[#999] p-1.5">مقبوضات</th>
                    <th className="border border-[#999] p-1.5">مدفوعات</th>
                    <th className="border border-[#999] p-1.5">العملة</th>
                    <th className="border border-[#999] p-1.5">البيان</th>
                    {showDoc && <th className="border border-[#999] p-1.5">المستند</th>}
                    {showBalance && <th className="border border-[#999] p-1.5">الرصيد</th>}
                  </tr>
                </thead>
                <tbody>
                  {matchingRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[#666]">
                        لا توجد حركات مطابقة للفترة والمعايير المحددة.
                      </td>
                    </tr>
                  ) : (
                    matchingRows.map((row, i) => {
                      const rowDiff = (parseFloat(row.rec) || 0) - (parseFloat(row.pay) || 0);
                      return (
                        <tr key={row.id} className="hover:bg-[#eaf3fc]">
                          {showMoveNo && (
                            <td className="border border-[#ccc] p-1.5 text-center">{i + 1}</td>
                          )}
                          <td className="border border-[#ccc] p-1.5 text-center">{row.at}</td>
                          <td className="border border-[#ccc] p-1.5">{row.from}</td>
                          <td className="border border-[#ccc] p-1.5">{row.to}</td>
                          <td className="border border-[#ccc] p-1.5 text-center">
                            {row.rec || '0'}
                          </td>
                          <td className="border border-[#ccc] p-1.5 text-center">
                            {row.pay || '0'}
                          </td>
                          <td className="border border-[#ccc] p-1.5 text-center">{row.cur}</td>
                          <td className="border border-[#ccc] p-1.5">{row.stmt}</td>
                          {showDoc && (
                            <td className="border border-[#ccc] p-1.5 text-center">{row.doc}</td>
                          )}
                          {showBalance && (
                            <td className="border border-[#ccc] p-1.5 text-center font-bold">
                              {rowDiff.toFixed(2)}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setViewResults(false)}
                className="erp-classic-btn px-4 h-[30px] text-[13px]"
              >
                رجوع للخيارات
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onOpenPrint}
                  className="erp-classic-btn px-4 h-[30px] text-[13px]"
                >
                  طباعة
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="erp-classic-btn focused px-5 h-[30px] text-[13px]"
                >
                  خروج
                </button>
              </div>
            </div>
          </div>
        )}
      </DraggableWindow>

      <AccTreeDialog
        open={treePickerOpen}
        zIndex={zIndex + 25}
        onFocus={() => undefined}
        onClose={() => setTreePickerOpen(false)}
        onSelectSingle={(name) => setAccountName(name)}
        onNotify={onNotify}
      />
    </>
  );
};
