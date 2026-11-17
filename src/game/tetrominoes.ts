export type Cell = string | null;

export type Board = Cell[][];

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export interface PieceDef {
  type: PieceType;
  color: string;
  glow: string; // rgb triplet for glow effects, e.g. "34,211,238"
  cells: [number, number][][]; // 4 rotations, each a list of [row, col] in a 4x4 box
}

export const TETROMINOES: Record<PieceType, PieceDef> = {
  I: {
    type: 'I',
    color: '#22d3ee',
    glow: '34,211,238',
    cells: [
      [[1, 0], [1, 1], [1, 2], [1, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 1], [1, 1], [2, 1], [3, 1]],
    ],
  },
  O: {
    type: 'O',
    color: '#facc15',
    glow: '250,204,21',
    cells: [
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
    ],
  },
  T: {
    type: 'T',
    color: '#e879f9',
    glow: '232,121,249',
    cells: [
      [[0, 1], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 1]],
    ],
  },
  S: {
    type: 'S',
    color: '#4ade80',
    glow: '74,222,128',
    cells: [
      [[0, 1], [0, 2], [1, 0], [1, 1]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 0], [1, 1], [2, 0], [2, 1]],
      [[0, 0], [0, 1], [1, 1], [1, 2]],
    ],
  },
  Z: {
    type: 'Z',
    color: '#f87171',
    glow: '248,113,113',
    cells: [
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 2], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [2, 0], [2, 1]],
      [[0, 1], [0, 2], [1, 0], [1, 1]],
    ],
  },
  J: {
    type: 'J',
    color: '#60a5fa',
    glow: '96,165,250',
    cells: [
      [[0, 0], [1, 0], [1, 1], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 0], [2, 1]],
    ],
  },
  L: {
    type: 'L',
    color: '#fb923c',
    glow: '251,146,60',
    cells: [
      [[0, 2], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [1, 2], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
    ],
  },
};

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  row: number;
  col: number;
}

export function createBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () => Array<Cell>(cols).fill(null));
}

export function getCells(piece: ActivePiece): [number, number][] {
  return TETROMINOES[piece.type].cells[piece.rotation % 4];
}

export function rotatedPiece(piece: ActivePiece, dir: 1 | -1): ActivePiece {
  return { ...piece, rotation: (piece.rotation + dir + 4) % 4 };
}

export function makePiece(type: PieceType): ActivePiece {
  // Pieces spawn centered, with I/O using the same 4-wide box as the others.
  return { type, rotation: 0, row: -1, col: 3 };
}

// 7-bag randomizer: every piece appears once per bag, like modern Tetris.
export function createBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}
