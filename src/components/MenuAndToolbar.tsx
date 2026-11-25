import React, { useEffect, useRef, useState } from 'react';
import { MENU_SECTIONS, type MenuItemDef } from '../data/erpDefaults';
import type { SectionKey } from '../types/erp';

interface MenuAndToolbarProps {
  activeSection: SectionKey;
  panelOpen: boolean;
  showMenus: boolean;
  showTiles: boolean;
  onSelectSection: (section: SectionKey) => void;
  onDropdownAction: (section: SectionKey, item: string) => void;
}

export const MenuAndToolbar: React.FC<MenuAndToolbarProps> = ({
  activeSection,
  panelOpen,
  showMenus,
  showTiles,
  onSelectSection,
  onDropdownAction,
}) => {
  const [openMenu, setOpenMenu] = useState<{
    section: SectionKey;
    items: MenuItemDef[];
    top: number;
    right: number;
  } | null>(null);
  const [openSubIdx, setOpenSubIdx] = useState<number | null>(null);

  const toolbarScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-erp-dropdown]') && !target.closest('[data-erp-menuitem]')) {
        setOpenMenu(null);
        setOpenSubIdx(null);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleMenuClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    sec: (typeof MENU_SECTIONS)[number]
  ) => {
    e.stopPropagation();
    if (sec.items && sec.items.length > 0) {
      if (openMenu?.section === sec.title) {
        setOpenMenu(null);
        setOpenSubIdx(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      setOpenSubIdx(null);
      setOpenMenu({
        section: sec.title,
        items: sec.items,
        top: rect.bottom + 2,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    } else {
      setOpenMenu(null);
      setOpenSubIdx(null);
      onSelectSection(sec.title);
    }
  };

  return (
    <>
      {showMenus && (
        <div
          dir="rtl"
          className="h-[34px] shrink-0 bg-[#f8f8ff] border-b border-[#d0d0d8] flex items-center justify-center gap-1 px-3 select-none overflow-x-auto"
        >
          {MENU_SECTIONS.map((sec) => {
            const isOpen = openMenu?.section === sec.title;
            return (
              <button
                key={sec.title}
                type="button"
                data-erp-menuitem
                onClick={(e) => handleMenuClick(e, sec)}
                className={`px-3 py-1 text-[16px] font-bold text-[#111] whitespace-nowrap border cursor-pointer transition-colors ${
                  isOpen
                    ? 'bg-white border-[#889] shadow-xs'
                    : panelOpen && activeSection === sec.title
                    ? 'bg-[#dde7f7] border-[#9bb7dc]'
                    : 'border-transparent hover:bg-[#e5f3ff] hover:border-[#99d1ff]'
                }`}
              >
                {sec.title}
              </button>
            );
          })}
        </div>
      )}

      {openMenu && (
        <div
          data-erp-dropdown
          dir="rtl"
          style={{ top: openMenu.top, right: openMenu.right }}
          className="fixed z-[250] min-w-[270px] bg-white border border-[#889] shadow-lg p-1"
        >
          {openMenu.items.map((item, idx) => {
            if (item === '---') {
              return <div key={`sep-${idx}`} className="my-1 border-t border-[#d8d8d8]" />;
            }

            const label = typeof item === 'string' ? item : item.label;
            const shortcut = typeof item === 'string' ? undefined : item.shortcut;
            const children = typeof item === 'string' ? undefined : item.children;
            const hasChildren = Boolean(children && children.length > 0);
            const isSubOpen = hasChildren && openSubIdx === idx;

            return (
              <div
                key={`${label}-${idx}`}
                className="relative"
                onMouseEnter={() => {
                  if (hasChildren) setOpenSubIdx(idx);
                  else setOpenSubIdx(null);
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasChildren) {
                      setOpenSubIdx((prev) => (prev === idx ? null : idx));
                      return;
                    }
                    const sec = openMenu.section;
                    setOpenMenu(null);
                    setOpenSubIdx(null);
                    onDropdownAction(sec, label);
                  }}
                  className={`w-full text-right px-4 py-1.5 text-[14px] font-semibold text-black border flex items-center justify-between gap-4 cursor-pointer ${
                    isSubOpen
                      ? 'bg-[#cde1f7] border-[#79a8d9]'
                      : 'border-transparent hover:bg-[#cde1f7] hover:border-[#79a8d9]'
                  }`}
                >
                  <span>{label}</span>
                  {shortcut && (
                    <span dir="ltr" className="text-[13px] font-bold text-[#222] shrink-0">
                      {shortcut}
                    </span>
                  )}
                  {hasChildren && (
                    <span className="text-[11px] text-[#222] shrink-0 mr-auto">◀</span>
                  )}
                </button>

                {isSubOpen && children && (
                  <div
                    data-erp-dropdown
                    dir="rtl"
                    className="absolute top-0 left-full ml-[2px] min-w-[260px] bg-white border border-[#889] shadow-lg p-1 z-[260]"
                  >
                    {children.map((subItem) => (
                      <button
                        key={subItem}
                        type="button"
                        onClick={() => {
                          const sec = openMenu.section;
                          setOpenMenu(null);
                          setOpenSubIdx(null);
                          onDropdownAction(sec, subItem);
                        }}
                        className="w-full text-right px-4 py-1.5 text-[14px] font-semibold text-black border border-transparent hover:bg-[#cde1f7] hover:border-[#79a8d9] cursor-pointer block"
                      >
                        {subItem}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showTiles && (
        <div
          dir="rtl"
          className="h-[94px] shrink-0 bg-[#fff0f5] border-y border-[#8a8a8a] flex items-stretch relative select-none"
        >
          <div
            ref={toolbarScrollRef}
            className="flex-1 flex items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MENU_SECTIONS.map((sec) => {
              const isActive = panelOpen && activeSection === sec.title;
              return (
                <button
                  key={sec.title}
                  type="button"
                  onClick={() => {
                    setOpenMenu(null);
                    onSelectSection(sec.title);
                  }}
                  className={`w-[136px] min-w-[136px] h-full border-2 border-black -ml-[2px] font-bold text-[17px] leading-[1.2] flex items-center justify-center text-center px-1.5 cursor-pointer transition-colors whitespace-pre-line ${
                    isActive
                      ? 'bg-[#f4ceaa] shadow-[inset_0_0_0_1px_#000]'
                      : 'bg-[#ffe0c0] hover:bg-[#ffd5ab] active:bg-[#f4c69a]'
                  }`}
                >
                  {sec.toolbarLabel}
                </button>
              );
            })}
            <div className="flex-1 bg-[#fff0f5]" />
          </div>

          <div className="w-[18px] bg-[#f0f0f0] border-r border-[#ccc] flex flex-col justify-between items-center py-0.5 shrink-0">
            <button
              type="button"
              title="تمرير لليمين"
              onClick={() => toolbarScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
              className="w-4 h-4 text-[10px] text-[#555] flex items-center justify-center hover:bg-[#dadada] cursor-pointer"
            >
              ▲
            </button>
            <div className="w-3 h-7 bg-[#cdcdcd] border border-[#b5b5b5]" />
            <button
              type="button"
              title="تمرير لليسار"
              onClick={() => toolbarScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
              className="w-4 h-4 text-[10px] text-[#555] flex items-center justify-center hover:bg-[#dadada] cursor-pointer"
            >
              ▼
            </button>
          </div>
        </div>
      )}
    </>
  );
};
