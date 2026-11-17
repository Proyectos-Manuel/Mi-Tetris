import { useRef, useState, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { BoardView } from './BoardView';
import type { GameState } from '@/game/engine';

interface BoardContainerProps {
  state: GameState;
  clearingRows: number[] | null;
  shake: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
  onSwipeDownSoft: () => void;
  onSwipeDownHard: () => void;
  overlay?: ReactNode;
}

interface TouchOrigin {
  x: number;
  y: number;
  time: number;
  cellsMoved: number;
  lastCellX: number;
}

const TAP_MAX_MS = 350;
const TAP_MAX_DIST = 24;
const CELL_PX_MIN = 24;

export function BoardContainer({
  state,
  clearingRows,
  shake,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onSwipeDownSoft,
  onSwipeDownHard,
  overlay,
}: BoardContainerProps) {
  const touch = useRef<TouchOrigin | null>(null);
  const [flash, setFlash] = useState(false);

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touch.current = {
      x: t.clientX,
      y: t.clientY,
      time: Date.now(),
      cellsMoved: 0,
      lastCellX: t.clientX,
    };
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!touch.current) return;
    const t = e.touches[0];
    const origin = touch.current;
    const dx = t.clientX - origin.lastCellX;
    if (Math.abs(dx) >= CELL_PX_MIN) {
      const steps = Math.trunc(dx / CELL_PX_MIN);
      for (let i = 0; i < Math.abs(steps); i++) {
        if (steps > 0) onSwipeRight();
        else onSwipeLeft();
      }
      origin.lastCellX += steps * CELL_PX_MIN;
      origin.cellsMoved += Math.abs(steps);
    }
    // prevent page scroll while dragging
    if (e.cancelable) e.preventDefault();
  };

  const handleTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!touch.current) return;
    const origin = touch.current;
    touch.current = null;
    const t = e.changedTouches[0];
    const dt = Date.now() - origin.time;
    const dy = t.clientY - origin.y;
    const dx = t.clientX - origin.x;

    const isTap = dt < TAP_MAX_MS && Math.hypot(dx, dy) < TAP_MAX_DIST && origin.cellsMoved === 0;
    if (isTap) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 120);
      onTap();
      return;
    }

    if (dy > 60 && Math.abs(dx) < 60) {
      if (dy > 140 || dt < 180) onSwipeDownHard();
      else onSwipeDownSoft();
    }
  };

  return (
    <div
      className="relative select-none touch-none rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 shadow-[0_0_40px_rgba(56,189,248,0.08)]"
      style={{ aspectRatio: '10 / 20', width: '100%' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* subtle grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)',
          backgroundSize: '10% 5%',
        }}
      />
      <div className="absolute inset-0 p-[2px]">
        <BoardView state={state} clearingRows={clearingRows} shake={shake} />
      </div>
      {flash && <div className="absolute inset-0 bg-white/15 pointer-events-none" />}
      {overlay}
    </div>
  );
}
