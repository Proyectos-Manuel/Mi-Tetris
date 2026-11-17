import { Pause, Play, RotateCw, RotateCcw, ArrowDownToLine, Repeat, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActionButtonsProps {
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  paused: boolean;
}

function holdProps(repeat: boolean, fn: () => void) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      if (repeat) {
        fn();
        const interval = window.setInterval(fn, 110);
        const stop = () => window.clearInterval(interval);
        const target = e.currentTarget;
        target.addEventListener('pointerup', stop, { once: true });
        target.addEventListener('pointercancel', stop, { once: true });
        target.addEventListener('pointerleave', stop, { once: true });
      } else {
        fn();
      }
    },
  };
}

const BTN =
  'flex items-center justify-center rounded-2xl bg-slate-800/80 border border-white/10 text-slate-100 active:scale-95 active:bg-slate-700 transition-transform duration-75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]';

export function ActionButtons({
  onPause,
  onMoveLeft,
  onMoveRight,
  onRotateCW,
  onRotateCCW,
  onHardDrop,
  onHold,
  paused,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-5 gap-2 w-full">
      <button aria-label="Mover a la izquierda" className={`${BTN} h-14`} {...holdProps(true, onMoveLeft)}>
        <ChevronLeft size={26} />
      </button>
      <button aria-label="Rotar a la izquierda" className={`${BTN} h-14`} {...holdProps(false, onRotateCCW)}>
        <RotateCcw size={22} />
      </button>
      <button
        aria-label={paused ? 'Reanudar' : 'Pausar'}
        className={`${BTN} h-14 ${paused ? 'text-sky-300' : ''}`}
        {...holdProps(false, onPause)}
      >
        {paused ? <Play size={24} /> : <Pause size={24} />}
      </button>
      <button aria-label="Rotar a la derecha" className={`${BTN} h-14`} {...holdProps(false, onRotateCW)}>
        <RotateCw size={22} />
      </button>
      <button aria-label="Mover a la derecha" className={`${BTN} h-14`} {...holdProps(true, onMoveRight)}>
        <ChevronRight size={26} />
      </button>
      <button
        aria-label="Guardar pieza"
        className={`${BTN} h-12 col-span-2 text-sm gap-1`}
        {...holdProps(false, onHold)}
      >
        <Repeat size={18} /> Guardar
      </button>
      <button
        aria-label="Caída instantánea"
        className={`${BTN} h-12 col-span-3 text-sm gap-1 text-orange-300`}
        {...holdProps(false, onHardDrop)}
      >
        <ArrowDownToLine size={18} /> Soltar
      </button>
    </div>
  );
}
