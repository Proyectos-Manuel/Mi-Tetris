import { supabase } from './supabase';

export interface HighScore {
  id: string;
  name: string;
  score: number;
  lines: number;
  level: number;
  created_at: string;
}

export async function fetchTopScores(limit = 10): Promise<HighScore[]> {
  const { data, error } = await supabase
    .from('high_scores')
    .select('id, name, score, lines, level, created_at')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as HighScore[];
}

export interface SaveScoreInput {
  name: string;
  score: number;
  lines: number;
  level: number;
}

export async function saveScore(input: SaveScoreInput): Promise<void> {
  const { error } = await supabase.from('high_scores').insert({
    name: input.name.trim(),
    score: input.score,
    lines: input.lines,
    level: input.level,
  });
  if (error) throw error;
}

export function qualifiesForLeaderboard(score: number, top: HighScore[]): boolean {
  if (score <= 0) return false;
  if (top.length < 10) return true;
  return score > top[top.length - 1].score;
}
