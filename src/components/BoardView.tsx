import { memo, type ReactNode } from 'react';
import { COLS, ROWS, ghostRow } from '@/game/engine';
import { type Board, TETROMINOES, type ActivePiece } from '@/game/tetrominoes';
import { getCellsSafe } from '@/game/boardViewHelpers';
import type { GameState } from '@/game/engine';

interface BoardViewProps {
  state: GameState;
  clearingRows: number[] | null;
  shake: boolean;
}

const BLOCK_BASE =
  'absolute rounded-[3px] transition-[opacity,transform] duration-150 will-change-transform';

function Block({
  color,
  glow,
  top,
  left,
  sizeW,
  sizeH,
  variant,
}: {
  color: string;
  glow: string;
  top: number;
  left: number;
  sizeW: number;
  sizeH: number;
  variant: 'ghost' | 'locked' | 'active' | 'clearing';
}) {
  if (variant === 'ghost') {
    return (
      <div
        className={BLOCK_BASE}
        style={{
          top: `${top * sizeH}%`,
          left: `${left * sizeW}%`,
          width: `calc(${sizeW}% - 2px)`,
          height: `calc(${sizeH}% - 2px)`,
          border: `2px solid rgba(${glow}, 0.35)`,
          borderRadius: 4,
          opacity: 0.35,
        }}
      />
    );
  }
  const clearing = variant === 'clearing';
  const active = variant === 'active';
  return (
    <div
      className={BLOCK_BASE}
      style={{
        top: `${top * sizeH}%`,
        left: `${left * sizeW}%`,
        width: `calc(${sizeW}% - 2px)`,
        height: `calc(${sizeH}% - 2px)`,
        background: `linear-gradient(145deg, ${color} 0%, ${color} 55%, rgba(255,255,255,0.35) 100%)`,
        boxShadow: active
          ? `0 0 10px rgba(${glow}, 0.8), inset 0 1px 2px rgba(255,255,255,0.4)`
          : `inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.35)`,
        borderRadius: 5,
        opacity: clearing ? 0.15 : 1,
        transform: clearing ? 'scale(0.4)' : 'scale(1)',
      }}
    />
  );
}

function MemoizedBoardView({ state, clearingRows, shake }: BoardViewProps) {
  const { board, piece } = state;
  const sizeW = 100 / COLS;
  const sizeH = 100 / ROWS;

  const cells: ReactNode[] = [];

  // Locked cells
  board.forEach((row, r) => {
    row.forEach((color, c) => {
      if (!color) return;
      const def = Object.values(TETROMINOES).find((d) => d.color === color);
      const glow = def ? def.glow : '255,255,255';
      cells.push(
        <Block
          key={`l-${r}-${c}`}
          color={color}
          glow={glow}
          top={r}
          left={c}
          sizeW={sizeW}
          sizeH={sizeH}
          variant={clearingRows?.includes(r) ? 'clearing' : 'locked'}
        />,
      );
    });
  });

  // Ghost + active piece
  if (piece && !clearingRows) {
    const def = TETROMINOES[piece.type];
    const gRow = ghostRow(board, piece);
    const ghost = { ...piece, row: gRow };
    for (const [dr, dc] of getCellsSafe(ghost)) {
      const r = ghost.row + dr;
      const c = ghost.col + dc;
      if (r >= 0) {
        cells.push(
          <Block key={`g-${dr}-${dc}`} color={def.color} glow={def.glow} top={r} left={c} sizeW={sizeW} sizeH={sizeH} variant="ghost" />,
        );
      }
    }
    for (const [dr, dc] of getCellsSafe(piece)) {
      const r = piece.row + dr;
      const c = piece.col + dc;
      if (r >= 0) {
        cells.push(
          <Block key={`a-${dr}-${dc}`} color={def.color} glow={def.glow} top={r} left={c} sizeW={sizeW} sizeH={sizeH} variant="active" />,
        );
      }
    }
  }

  return (
    <div
      className="relative w-full h-full"
      style={{
        aspectRatio: `${COLS} / ${ROWS}`,
        transform: shake ? 'translate(2px, 3px)' : 'translate(0, 0)',
        transition: 'transform 60ms',
      }}
    >
      {cells}
    </div>
  );
}

export const BoardView = memo(MemoizedBoardView);

export type { Board, ActivePiece };