import { getCells } from './tetrominoes';
import type { ActivePiece } from './tetrominoes';

export function getCellsSafe(piece: ActivePiece): [number, number][] {
  return getCells(piece);
}
