import React, { useEffect, useRef, useState } from 'react';
import { TitleBar } from './TitleBar';

interface DraggableWindowProps {
  open: boolean;
  title: string;
  width?: number;
  height?: number;
  zIndex: number;
  initialMaximized?: boolean;
  onFocus: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  open,
  title,
  width = 1040,
  height = 680,
  zIndex,
  initialMaximized = false,
  onFocus,
  onClose,
  children,
}) => {
  const [maximized, setMaximized] = useState(initialMaximized);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const winRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !pos && !initialMaximized) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(width, vw - 24);
      const h = Math.min(height, vh - 54);
      setPos({
        x: Math.max(8, Math.round((vw - w) / 2)),
        y: Math.max(12, Math.round((vh - 34 - h) / 2)),
      });
    }
  }, [open, pos, width, height, initialMaximized]);

  if (!open) return null;

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (maximized) return;
    onFocus();
    const el = winRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;

    const move = (ev: PointerEvent) => {
      const x = Math.max(-rect.width + 140, Math.min(ev.clientX - ox, window.innerWidth - 80));
      const y = Math.max(0, Math.min(ev.clientY - oy, window.innerHeight - 60));
      setPos({ x, y });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const style: React.CSSProperties = maximized
    ? {
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 26px)',
        zIndex,
      }
    : {
        top: pos?.y ?? 24,
        left: pos?.x ?? 24,
        width: `min(${width}px, 96vw)`,
        height: `min(${height}px, calc(100vh - 44px))`,
        zIndex,
      };

  return (
    <div
      ref={winRef}
      dir="rtl"
      onPointerDown={onFocus}
      style={style}
      className="erp-dialog"
    >
      <TitleBar
        title={title}
        onDragStart={handleDragStart}
        onMinimize={onClose}
        onMaximize={() => setMaximized((m) => !m)}
        onClose={onClose}
      />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};
