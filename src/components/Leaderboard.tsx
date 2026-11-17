import { Trophy } from 'lucide-react';
import type { HighScore } from '@/lib/scores';

export function Leaderboard({ scores }: { scores: HighScore[] }) {
  if (scores.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-6">
        Todavía no hay récords. ¡Sé el primero!
      </p>
    );
  }
  const medal = (i: number) => (i === 0 ? 'text-yellow-300' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500');
  return (
    <ol className="flex flex-col gap-1.5">
      {scores.map((s, i) => (
        <li
          key={s.id}
          className={`flex items-center justify-between rounded-xl px-3 py-2 ${
            i === 0 ? 'bg-yellow-400/10 border border-yellow-300/30' : 'bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={`font-black tabular-nums w-6 text-center ${medal(i)}`}>{i + 1}</span>
            <span className="font-semibold text-slate-100 truncate max-w-[9rem]">{s.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 tabular-nums">
            <span>{s.lines} líns</span>
            <span className="font-bold text-sky-300 text-sm">{s.score.toLocaleString('es')}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LeaderboardCard({ scores, compact }: { scores: HighScore[]; compact?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-yellow-300" />
        <h2 className="font-bold text-slate-100 tracking-wide">MEJORES PUNTAJES</h2>
      </div>
      <Leaderboard scores={scores} />
      {!compact && scores.length === 0 && null}
    </div>
  );
}
