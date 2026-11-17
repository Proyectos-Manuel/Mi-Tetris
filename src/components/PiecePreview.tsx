import { TETROMINOES, type PieceType } from '@/game/tetrominoes';

const PREVIEW_SIZE = 4;

function MiniPiece({ type, dim }: { type: PieceType | null; dim?: boolean }) {
  if (!type) {
    return (
      <div className="flex items-center justify-center w-full h-full text-slate-600 text-xs">
        —
      </div>
    );
  }
  const def = TETROMINOES[type];
  const cells = def.cells[0];
  const inBox: boolean[][] = Array.from({ length: PREVIEW_SIZE }, () =>
    Array(PREVIEW_SIZE).fill(false),
  );
  cells.forEach(([r, c]) => {
    if (r < PREVIEW_SIZE && c < PREVIEW_SIZE) inBox[r][c] = true;
  });
  // trim empty rows/cols for a tight box
  const rowsUsed = inBox.map((row, r) => row.some(Boolean) ? r : -1).filter((r) => r >= 0);
  const colsUsed = PREVIEW_SIZE > 0 ? [0, 1, 2, 3].filter((c) => inBox.some((row) => row[c])) : [];
  const r0 = Math.min(...rowsUsed);
  const r1 = Math.max(...rowsUsed);
  const c0 = Math.min(...colsUsed);
  const c1 = Math.max(...colsUsed);
  const h = r1 - r0 + 1;
  const w = c1 - c0 + 1;

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${w}, 1fr)`, width: `${w * 18}px`, opacity: dim ? 0.55 : 1 }}
      >
        {Array.from({ length: h * w }, (_, i) => {
          const r = r0 + Math.floor(i / w);
          const c = c0 + (i % w);
          const filled = inBox[r][c];
          return (
            <div
              key={i}
              className="rounded-[3px]"
              style={{
                width: 16,
                height: 16,
                background: filled ? def.color : 'transparent',
                boxShadow: filled ? `0 0 8px rgba(${def.glow}, 0.5), inset 0 1px 2px rgba(255,255,255,0.35)` : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function NextQueue({ next }: { next: PieceType[] }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="h-14">
        <MiniPiece type={next[0] ?? null} />
      </div>
      <div className="grid grid-cols-2 gap-1 opacity-80">
        {next.slice(1, 5).map((t, i) => (
          <div key={i} className="h-9">
            <MiniPiece type={t ?? null} dim />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HoldPiece({ hold, canHold }: { hold: PieceType | null; canHold: boolean }) {
  return (
    <div className="h-14 w-full">
      <MiniPiece type={hold} dim={!canHold && !!hold} />
    </div>
  );
}

export { MiniPiece };
