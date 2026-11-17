import { useCallback, useEffect, useState } from 'react';
import { GameScreen } from '@/components/GameScreen';
import { LeaderboardCard } from '@/components/Leaderboard';
import { NameDialog } from '@/components/NameDialog';
import { fetchTopScores, qualifiesForLeaderboard, saveScore, type HighScore } from '@/lib/scores';

type Screen = 'home' | 'game';

interface RunResult {
  score: number;
  lines: number;
  level: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [scores, setScores] = useState<HighScore[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [pendingRank, setPendingRank] = useState<number | null>(null);

  const loadScores = useCallback(async () => {
    try {
      const top = await fetchTopScores();
      setScores(top);
    } catch {
      setScores([]);
    } finally {
      setLoadingScores(false);
    }
  }, []);

  useEffect(() => {
    if (screen === 'home') loadScores();
  }, [screen, loadScores]);

  const handleGameOver = useCallback(
    async (result: RunResult) => {
      setRunResult(result);
      try {
        const top = await fetchTopScores();
        setScores(top);
        if (qualifiesForLeaderboard(result.score, top)) {
          setPendingRank(top.filter((s) => s.score >= result.score).length + 1);
        }
      } catch {
        setScores([]);
      }
    },
    [],
  );

  const handleSaveScore = useCallback(
    async (name: string) => {
      if (!runResult) return;
      try {
        await saveScore({ name, ...runResult });
      } catch {
        // If saving fails we still let the player continue.
      }
      setPendingRank(null);
      await loadScores();
    },
    [runResult, loadScores],
  );

  if (screen === 'game') {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <GameScreen onExit={() => setScreen('home')} onGameOver={handleGameOver} />
        {pendingRank !== null && runResult && (
          <NameDialog
            score={runResult.score}
            lines={runResult.lines}
            rank={pendingRank}
            onSave={handleSaveScore}
            onSkip={() => setPendingRank(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-md flex flex-col items-center px-6 py-10 gap-8 min-h-dvh">
        <header className="text-center mt-6">
          <div className="flex justify-center gap-1.5 mb-4">
            {['#22d3ee', '#facc15', '#e879f9', '#4ade80', '#fb923c'].map((c, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-[4px] animate-bounce-subtle"
                style={{
                  background: c,
                  boxShadow: `0 0 12px ${c}`,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-sky-300 via-cyan-200 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            TETRIS
          </h1>
          <p className="text-slate-400 text-sm mt-2">Desliza, toca y atrapa las piezas</p>
        </header>

        <button
          onClick={() => setScreen('game')}
          className="w-full py-5 rounded-2xl text-xl font-black text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_40px_rgba(56,189,248,0.35)] active:scale-[0.98] transition-transform"
        >
          JUGAR
        </button>

        <div className="w-full">
          <LeaderboardCard scores={scores} />
        </div>

        <div className="mt-auto text-xs text-slate-600 text-center pb-4">
          Desliza a los lados para mover · Toca para rotar · Desliza abajo para soltar
        </div>
      </div>

      {loadingScores && null}
    </div>
  );
}
