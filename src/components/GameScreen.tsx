import { useEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import {
  type GameState,
  applyAction,
  createInitialState,
  dropIntervalMs,
  finishClearing,
  startGame,
  step,
  ROWS,
} from '@/game/engine';
import type { PieceType } from '@/game/tetrominoes';
import { haptic, spawnParticlesForRow, stepParticles, type Particle } from '@/game/effects';
import { BoardContainer } from '@/components/BoardContainer';
import { ActionButtons } from '@/components/ActionButtons';
import { HoldPiece, MiniPiece } from '@/components/PiecePreview';

interface GameScreenProps {
  onExit: () => void;
  onGameOver: (result: { score: number; lines: number; level: number }) => void;
}

const CLEAR_ANIM_MS = 320;

export function GameScreen({ onExit, onGameOver }: GameScreenProps) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const reportedOver = useRef(false);

  const flashShake = useCallback(() => {
    setShake(true);
    window.setTimeout(() => setShake(false), 120);
  }, []);

  // Main game loop
  useEffect(() => {
    if (state.status !== 'playing') return;
    let cancelled = false;
    let timer: number;

    const schedule = () => {
      if (cancelled) return;
      const interval = stateRef.current.clearing
        ? CLEAR_ANIM_MS
        : dropIntervalMs(stateRef.current.stats.level);
      timer = window.setTimeout(tick, interval);
    };

    const tick = () => {
      if (cancelled) return;
      const current = stateRef.current;
      if (current.status !== 'playing') return;

      if (current.clearing) {
        // The flash animation has had its time; remove rows and continue.
        setState((s) => finishClearing(s));
        schedule();
        return;
      }

      const result = step(current);
      stateRef.current = result.state;
      setState(result.state);

      if (result.state.clearing) {
        haptic(result.linesCleared >= 4 ? [40, 40, 80] : 25);
        flashShake();
        const newParticles: Particle[] = [];
        result.state.clearing.rows.forEach((r) => {
          newParticles.push(...spawnParticlesForRow(r, current.board[r]));
        });
        setParticles((p) => [...p, ...newParticles].slice(0, 120));
      }

      if (result.gameOver && !reportedOver.current) {
        reportedOver.current = true;
        haptic([60, 40, 60, 40, 120]);
        onGameOver({
          score: result.state.stats.score,
          lines: result.state.stats.lines,
          level: result.state.stats.level,
        });
        return;
      }

      schedule();
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state.status, flashShake, onGameOver]);

  // Particle animation loop
  const hasParticles = particles.length > 0;
  useEffect(() => {
    if (!hasParticles) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      setParticles((p) => {
        const next = stepParticles(p, dt);
        if (next.length === 0) return next;
        raf = requestAnimationFrame(loop);
        return next;
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hasParticles]);

  const doAction = useCallback(
    (action: Parameters<typeof applyAction>[1]) => {
      const current = stateRef.current;
      if (current.status !== 'playing' || current.clearing) return;
      const result = applyAction(current, action);
      stateRef.current = result.state;
      setState(result.state);
      if (result.hardDropped) {
        haptic(15);
        flashShake();
      }
      if (result.gameOver && !reportedOver.current) {
        reportedOver.current = true;
        haptic([60, 40, 60, 40, 120]);
        onGameOver({
          score: result.state.stats.score,
          lines: result.state.stats.lines,
          level: result.state.stats.level,
        });
      }
    },
    [flashShake, onGameOver],
  );

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          doAction('moveLeft');
          break;
        case 'ArrowRight':
          e.preventDefault();
          doAction('moveRight');
          break;
        case 'ArrowDown':
          e.preventDefault();
          doAction('softDrop');
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          doAction('rotateCW');
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          doAction('rotateCCW');
          break;
        case ' ':
          e.preventDefault();
          doAction('hardDrop');
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          doAction('hold');
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setState((s) => ({ ...s, status: s.status === 'playing' ? 'paused' : s.status === 'paused' ? 'playing' : s.status }));
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doAction]);

  const togglePause = useCallback(() => {
    haptic(10);
    setState((s) => {
      if (s.status === 'playing') return { ...s, status: 'paused' };
      if (s.status === 'paused') return { ...s, status: 'playing' };
      return s;
    });
  }, []);

  const restart = useCallback(() => {
    reportedOver.current = false;
    setParticles([]);
    const fresh = startGame();
    stateRef.current = fresh;
    setState(fresh);
  }, []);

  const { stats } = state;
  const clearingRows = state.clearing?.rows ?? null;

  const renderParticles = () =>
    particles.map((p) => (
      <div
        key={p.id}
        className="absolute rounded-full pointer-events-none"
        style={{
          left: `${p.x * 100}%`,
          top: `${(p.y / ROWS) * 100}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          opacity: p.life,
          boxShadow: `0 0 6px ${p.color}`,
        }}
      />
    ));

  return (
    <div className="min-h-dvh w-full flex flex-col items-center px-3 py-3 gap-2">
      {/* HUD */}
      <div className="w-full max-w-3xl flex items-stretch gap-2">
        <button
          onClick={onExit}
          className="rounded-xl bg-slate-800/70 border border-white/10 px-3 text-slate-400 text-sm active:scale-95 transition-transform"
        >
          Salir
        </button>
        <div className="flex-1 grid grid-cols-3 gap-2 text-center">
          <Stat label="Puntos" value={stats.score.toLocaleString('es')} accent />
          <Stat label="Nivel" value={String(stats.level)} />
          <Stat label="Líneas" value={String(stats.lines)} />
        </div>
      </div>
      {stats.combo > 1 && (
        <div className="text-orange-300 font-black text-sm animate-pulse tracking-wider">
          COMBO x{stats.combo}
        </div>
      )}

      <div className="w-full max-w-3xl flex gap-2 items-stretch justify-center flex-1 min-h-0">
        {/* Hold */}
        <div className="flex flex-col gap-2 w-16 shrink-0">
          <Panel label="Guardar">
            <HoldPiece hold={state.hold} canHold={state.canHold} />
          </Panel>
        </div>

        {/* Board */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-[min(92vw,38dvh)] max-w-[420px]">
            <BoardContainer
              state={state}
              clearingRows={clearingRows}
              shake={shake}
              onSwipeLeft={() => doAction('moveLeft')}
              onSwipeRight={() => doAction('moveRight')}
              onTap={() => doAction('rotateCW')}
              onSwipeDownSoft={() => doAction('softDrop')}
              onSwipeDownHard={() => doAction('hardDrop')}
              overlay={
                <>
                  {renderParticles()}
                  {state.status === 'paused' && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                      <p className="text-2xl font-black text-white tracking-widest">PAUSA</p>
                      <button
                        onClick={togglePause}
                        className="px-6 py-3 rounded-xl bg-sky-400 text-slate-950 font-bold active:scale-95 transition-transform"
                      >
                        Continuar
                      </button>
                      <button onClick={restart} className="text-slate-400 text-sm underline">
                        Reiniciar
                      </button>
                      <button onClick={onExit} className="text-slate-500 text-sm">
                        Salir
                      </button>
                    </div>
                  )}
                  {state.status === 'over' && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <p className="text-3xl font-black text-red-400 tracking-widest">FIN</p>
                      <p className="text-white font-bold text-xl">{stats.score.toLocaleString('es')} pts</p>
                      <button
                        onClick={restart}
                        className="px-6 py-3 rounded-xl bg-sky-400 text-slate-950 font-bold active:scale-95 transition-transform"
                      >
                        Jugar otra vez
                      </button>
                      <button onClick={onExit} className="text-slate-400 text-sm underline">
                        Inicio
                      </button>
                    </div>
                  )}
                  {state.status === 'idle' && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                      <button
                        onClick={restart}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 font-black text-lg active:scale-95 transition-transform"
                      >
                        JUGAR
                      </button>
                    </div>
                  )}
                </>
              }
            />
          </div>
        </div>

        {/* Next queue */}
        <div className="flex flex-col gap-2 w-16 shrink-0">
          <Panel label="Siguiente">
            <div className="flex flex-col items-center gap-1">
              {state.next.slice(0, 3).map((t: PieceType, i: number) => (
                <div key={i} className="w-8 h-6">
                  <MiniPiece type={t} dim={i > 0} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Touch controls */}
      <div className="w-full max-w-md mt-auto pt-2 pb-3">
        <ActionButtons
          onPause={togglePause}
          onMoveLeft={() => doAction('moveLeft')}
          onMoveRight={() => doAction('moveRight')}
          onRotateCW={() => doAction('rotateCW')}
          onRotateCCW={() => doAction('rotateCCW')}
          onHardDrop={() => doAction('hardDrop')}
          onHold={() => doAction('hold')}
          paused={state.status === 'paused'}
        />
      </div>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex-1 rounded-xl bg-slate-900/70 border border-white/10 p-1.5 flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-slate-500 text-center">{label}</span>
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-900/70 border border-white/10 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`font-black tabular-nums leading-tight ${accent ? 'text-sky-300 text-lg' : 'text-white text-lg'}`}>
        {value}
      </p>
    </div>
  );
}
