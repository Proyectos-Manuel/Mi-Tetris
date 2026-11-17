import {
  type Board,
  type ActivePiece,
  type PieceType,
  TETROMINOES,
  createBoard,
  getCells,
  makePiece,
  createBag,
} from './tetrominoes';

export const COLS = 10;
export const ROWS = 20;

export type GameStatus = 'idle' | 'playing' | 'paused' | 'over';

export interface Stats {
  score: number;
  lines: number;
  level: number;
  combo: number;
}

export interface LineClearEffect {
  rows: number[];
  startedAt: number;
}

export interface GameState {
  board: Board;
  piece: ActivePiece | null;
  next: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  stats: Stats;
  status: GameStatus;
  clearing: LineClearEffect | null;
}

export interface TickResult {
  state: GameState;
  locked: boolean;
  hardDropped: boolean;
  linesCleared: number;
  levelUp: boolean;
  gameOver: boolean;
}

const LINES_PER_LEVEL = 5;

// Classic-ish scoring: more lines at once = big bonus, plus combo multiplier.
export function scoreForClear(linesCleared: number, level: number, combo: number): number {
  const base = [0, 100, 300, 500, 800][linesCleared] ?? 0;
  const comboBonus = combo > 0 ? 50 * combo : 0;
  return base * level + comboBonus;
}

export function dropIntervalMs(level: number): number {
  // Starts at 1000ms, shrinks as the level rises, floors at ~60ms.
  return Math.max(60, 900 - (level - 1) * 120);
}

export function createInitialState(): GameState {
  const bag = createBag();
  return {
    board: createBoard(ROWS, COLS),
    piece: null,
    next: [...bag, ...createBag()].slice(0, 5),
    hold: null,
    canHold: true,
    stats: { score: 0, lines: 0, level: 1, combo: 0 },
    status: 'idle',
    clearing: null,
  };
}

export function collides(board: Board, piece: ActivePiece): boolean {
  for (const [dr, dc] of getCells(piece)) {
    const r = piece.row + dr;
    const c = piece.col + dc;
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && board[r][c] !== null) return true;
  }
  return false;
}

function tryMove(
  board: Board,
  piece: ActivePiece,
  dRow: number,
  dCol: number,
): ActivePiece | null {
  const moved = { ...piece, row: piece.row + dRow, col: piece.col + dCol };
  return collides(board, moved) ? null : moved;
}

// Simple wall kicks: try sideways offsets before giving up on a rotation.
function tryRotate(board: Board, piece: ActivePiece, dir: 1 | -1): ActivePiece | null {
  const rotated = {
    ...piece,
    rotation: (piece.rotation + dir + 4) % 4,
  };
  const kicks: Array<[number, number]> = [
    [0, 0],
    [0, -1],
    [0, 1],
    [0, -2],
    [0, 2],
    [-1, 0],
    [-2, 0],
    [1, 0],
    [2, 0],
  ];
  for (const [dr, dc] of kicks) {
    const candidate = { ...rotated, row: rotated.row + dr, col: rotated.col + dc };
    if (!collides(board, candidate)) return candidate;
  }
  return null;
}

export function ghostRow(board: Board, piece: ActivePiece): number {
  let row = piece.row;
  while (true) {
    const candidate = { ...piece, row: row + 1 };
    if (collides(board, candidate)) break;
    row += 1;
  }
  return row;
}

function refillQueue(queue: PieceType[]): PieceType[] {
  while (queue.length < 5) {
    queue.push(...createBag());
  }
  return queue;
}

export function lockPiece(state: GameState): GameState {
  if (!state.piece) return state;
  const def = TETROMINOES[state.piece.type];
  const board = state.board.map((row) => [...row]);
  for (const [dr, dc] of getCells(state.piece)) {
    const r = state.piece.row + dr;
    const c = state.piece.col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      board[r][c] = def.color;
    }
  }
  return { ...state, board, piece: null };
}

export function findFullRows(board: Board): number[] {
  const rows: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every((cell) => cell !== null)) rows.push(r);
  }
  return rows;
}

export function removeRows(board: Board, rows: number[]): Board {
  const remaining = board.filter((_, i) => !rows.includes(i));
  const newRows = Array.from({ length: rows.length }, () => Array<string | null>(COLS).fill(null));
  return [...newRows, ...remaining];
}

function spawnNextPiece(state: GameState): GameState {
  const [next, ...rest] = state.next;
  if (!next) return state;
  const piece = makePiece(next);
  const queue = refillQueue(rest);
  const newState: GameState = {
    ...state,
    piece,
    next: queue,
    canHold: true,
  };
  // If the fresh piece already collides, the stack has reached the top.
  if (collides(state.board, piece)) {
    return { ...newState, status: 'over', piece: null };
  }
  return newState;
}

export function startGame(): GameState {
  const base = createInitialState();
  return { ...spawnNextPiece(base), status: 'playing' };
}

export function step(state: GameState): TickResult {
  if (state.status !== 'playing' || !state.piece) {
    return { state, locked: false, hardDropped: false, linesCleared: 0, levelUp: false, gameOver: false };
  }

  // Mid clear-animation: wait it out before the next piece falls.
  if (state.clearing) {
    return { state, locked: false, hardDropped: false, linesCleared: 0, levelUp: false, gameOver: false };
  }

  const moved = tryMove(state.board, state.piece, 1, 0);
  if (moved) {
    return { state: { ...state, piece: moved }, locked: false, hardDropped: false, linesCleared: 0, levelUp: false, gameOver: false };
  }

  // Piece can't move down: lock it.
  const lockedState = lockPiece(state);
  const fullRows = findFullRows(lockedState.board);

  let stats = lockedState.stats;
  let clearing: LineClearEffect | null = null;
  let board = lockedState.board;

  if (fullRows.length > 0) {
    const combo = stats.combo + 1;
    stats = {
      ...stats,
      score: stats.score + scoreForClear(fullRows.length, stats.level, combo),
      lines: stats.lines + fullRows.length,
      combo,
    };
    clearing = { rows: fullRows, startedAt: Date.now() };
  } else {
    stats = { ...stats, combo: 0 };
    board = removeRows(lockedState.board, []); // no-op copy for cleanliness
  }

  const newLevel = Math.floor(stats.lines / LINES_PER_LEVEL) + 1;
  const levelUp = newLevel > stats.level;
  stats = { ...stats, level: newLevel };

  const afterLock: GameState = {
    ...lockedState,
    board,
    stats,
    clearing,
  };

  if (clearing) {
    // Rows get removed after the flash animation finishes.
    return { state: afterLock, locked: true, hardDropped: false, linesCleared: fullRows.length, levelUp, gameOver: false };
  }

  const withPiece = spawnNextPiece(afterLock);
  return {
    state: withPiece,
    locked: true,
    hardDropped: false,
    linesCleared: 0,
    levelUp,
    gameOver: withPiece.status === 'over',
  };
}

export function finishClearing(state: GameState): GameState {
  if (!state.clearing) return state;
  const board = removeRows(state.board, state.clearing.rows);
  const spawned = spawnNextPiece({ ...state, board, clearing: null });
  return spawned;
}

export interface ActionInput {
  state: GameState;
  action:
    | 'moveLeft'
    | 'moveRight'
    | 'softDrop'
    | 'rotateCW'
    | 'rotateCCW'
    | 'hardDrop'
    | 'hold';
}

export function applyAction(state: GameState, action: ActionInput['action']): TickResult {
  const empty: TickResult = { state, locked: false, hardDropped: false, linesCleared: 0, levelUp: false, gameOver: false };
  if (state.status !== 'playing' || !state.piece || state.clearing) return empty;

  switch (action) {
    case 'moveLeft': {
      const moved = tryMove(state.board, state.piece, 0, -1);
      return moved ? { ...empty, state: { ...state, piece: moved } } : empty;
    }
    case 'moveRight': {
      const moved = tryMove(state.board, state.piece, 0, 1);
      return moved ? { ...empty, state: { ...state, piece: moved } } : empty;
    }
    case 'softDrop': {
      const moved = tryMove(state.board, state.piece, 1, 0);
      if (moved) {
        return {
          ...empty,
          state: { ...state, piece: moved, stats: { ...state.stats, score: state.stats.score + 1 } },
        };
      }
      return step(state);
    }
    case 'rotateCW': {
      const rotated = tryRotate(state.board, state.piece, 1);
      return rotated ? { ...empty, state: { ...state, piece: rotated } } : empty;
    }
    case 'rotateCCW': {
      const rotated = tryRotate(state.board, state.piece, -1);
      return rotated ? { ...empty, state: { ...state, piece: rotated } } : empty;
    }
    case 'hardDrop': {
      const row = ghostRow(state.board, state.piece);
      const dropped = { ...state.piece, row };
      const withPiece = { ...state, piece: dropped, stats: { ...state.stats, score: state.stats.score + 2 * (row - state.piece.row) } };
      const result = step({ ...withPiece, piece: dropped });
      return { ...result, hardDropped: true };
    }
    case 'hold': {
      if (!state.canHold) return empty;
      const current = state.piece.type;
      if (state.hold) {
        const swapped = makePiece(state.hold);
        if (collides(state.board, swapped)) return empty;
        return { ...empty, state: { ...state, piece: swapped, hold: current, canHold: false } };
      }
      const [next, ...rest] = state.next;
      if (!next) return empty;
      const spawned = makePiece(next);
      if (collides(state.board, spawned)) return empty;
      return {
        ...empty,
        state: { ...state, piece: spawned, hold: current, canHold: false, next: refillQueue(rest) },
      };
    }
  }
}
