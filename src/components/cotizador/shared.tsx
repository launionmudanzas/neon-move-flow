import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { TOTAL_STEPS } from './constants';

// ─── Progress Bar ────────────────────────────────────────────────
const STEP_LABELS = ['Datos', 'Ruta', 'Servicio', 'Cálculo', 'Resultado'];

export function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-neon-cyan tracking-widest uppercase">Paso {step} de {TOTAL_STEPS}</span>
        <span className="text-xs text-muted-foreground font-semibold">{STEP_LABELS[step - 1]}</span>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {STEP_LABELS.map((l, i) => (
          <div key={l} className={`flex flex-col items-center gap-0.5 ${i + 1 <= step ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${i + 1 < step ? 'bg-neon-cyan' : i + 1 === step ? 'bg-neon-blue ring-2 ring-neon-blue/30' : 'bg-border'}`} />
            <span className="text-[9px] text-muted-foreground hidden sm:block">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Option Button ───────────────────────────────────────────────
export function OptionButton({ label, icon, desc, selected, onClick, disabled }: {
  label: string; icon: string; desc?: string; selected: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center ${
        disabled ? 'opacity-30 cursor-not-allowed border-border bg-muted' :
        selected
          ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_12px_hsl(var(--neon-cyan)/0.3)]'
          : 'border-border hover:border-neon-cyan/40 hover:bg-surface-2 bg-surface'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-bold leading-tight ${selected ? 'text-neon-cyan' : 'text-foreground'}`}>{label}</span>
      {desc && <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>}
    </button>
  );
}

// ─── Counter Row ─────────────────────────────────────────────────
export function CounterRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-foreground flex-1 pr-4">{label}</span>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/50 transition-all active:scale-95"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className={`w-7 text-center font-black text-sm tabular-nums transition-colors ${value > 0 ? 'text-neon-cyan' : 'text-muted-foreground'}`}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/50 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Truck Visualizer ────────────────────────────────────────────
export function TruckVisualizer({ vol, billableVol, unit }: {
  vol: number; billableVol: number; unit: { label: string; emoji: string; fill: number; range: string };
}) {
  const fill = unit.fill;
  const stages = [
    { min: 0,  max: 30,  label: 'Vacío',      bg: 'from-neon-green to-neon-cyan' },
    { min: 30, max: 60,  label: 'Medio',       bg: 'from-neon-cyan to-neon-blue' },
    { min: 60, max: 90,  label: 'Casi lleno',  bg: 'from-neon-blue to-neon-orange' },
    { min: 90, max: 101, label: '¡Completo!',  bg: 'from-neon-orange to-destructive' },
  ];
  const stage = stages.find(s => fill >= s.min && fill < s.max) || stages[3];

  return (
    <div className="rounded-2xl border border-neon-cyan/20 bg-gradient-to-b from-surface to-background overflow-hidden p-5">
      <div className="flex items-center justify-center mb-3">
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-5xl select-none"
        >
          {unit.emoji}
        </motion.div>
      </div>

      {/* Load bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground font-semibold">Ocupación</span>
          <span className="font-black text-foreground">{Math.round(fill)}% · {stage.label}</span>
        </div>
        <div className="w-full h-4 bg-border/40 rounded-full overflow-hidden relative">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${stage.bg}`}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Unit chip */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{unit.emoji}</span>
          <div>
            <p className="font-display font-black text-sm text-neon-cyan">{unit.label}</p>
            <p className="text-[10px] text-muted-foreground">{unit.range}</p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Unidad sugerida</span>
      </div>

      {/* Volume */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 rounded-xl bg-surface border border-border">
          <p className="text-[10px] text-muted-foreground">Volumen real</p>
          <p className="font-black text-xl text-foreground">{vol > 0 ? `${vol.toFixed(1)} m³` : '—'}</p>
        </div>
        <div className={`text-center p-2 rounded-xl border ${billableVol > vol ? 'bg-neon-orange/5 border-neon-orange/30' : 'bg-neon-cyan/5 border-neon-cyan/20'}`}>
          <p className="text-[10px] text-muted-foreground">Volumen cobrable</p>
          <p className={`font-black text-xl ${billableVol > vol ? 'text-neon-orange' : 'text-neon-cyan'}`}>{billableVol.toFixed(1)} m³</p>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation Buttons ──────────────────────────────────────────
export function NavButton({ label, onClick, variant = 'ghost', disabled }: {
  label: string; onClick: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-neon-cyan to-neon-blue text-background hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.4)] hover:scale-[1.01] active:scale-[0.99]'
          : 'border border-border text-muted-foreground hover:border-neon-cyan/30 hover:text-foreground'
      }`}
    >
      {label === 'Atrás' && <ChevronLeft className="w-4 h-4" />}
      {label}
      {label !== 'Atrás' && variant === 'primary' && <ChevronRight className="w-4 h-4" />}
    </button>
  );
}
