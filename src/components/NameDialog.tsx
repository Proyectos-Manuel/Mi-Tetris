import { useState } from 'react';

interface NameDialogProps {
  score: number;
  lines: number;
  rank: number;
  onSave: (name: string) => void;
  onSkip: () => void;
}

export function NameDialog({ score, lines, rank, onSave, onSkip }: NameDialogProps) {
  const [name, setName] = useState('');
  const valid = name.trim().length > 0 && name.trim().length <= 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl animate-pop">
        <p className="text-sky-300 font-bold text-sm tracking-widest mb-1">¡NUEVO RÉCORD!</p>
        <h2 className="text-3xl font-black text-white mb-1">{score.toLocaleString('es')} pts</h2>
        <p className="text-slate-400 text-sm mb-5">
          Puesto #{rank} del top 10 · {lines} líneas
        </p>
        <input
          autoFocus
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) onSave(name);
          }}
          placeholder="Tu nombre"
          className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-sky-400/60 mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 rounded-xl py-3 text-slate-400 font-semibold active:scale-95 transition-transform"
          >
            Omitir
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave(name)}
            className="flex-1 rounded-xl py-3 font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 disabled:opacity-40 disabled:from-slate-600 disabled:to-slate-600 active:scale-95 transition-transform"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
