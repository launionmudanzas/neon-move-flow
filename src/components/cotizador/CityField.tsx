import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, BadgeCheck, Navigation, ShieldAlert, HelpCircle,
  Route as RouteIcon,
} from 'lucide-react';
import { classifyCity, ALL_CITIES, CityStatus, CityClassification } from '@/lib/routing-data';
import { getDesvioSurcharge } from '@/hooks/use-cotizacion';

const STATUS_CFG: Record<CityStatus, { icon: React.ReactNode; color: string; label: string }> = {
  en_ruta:     { icon: <BadgeCheck className="w-3 h-3" />,   color: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan',       label: 'En ruta' },
  desvio:      { icon: <Navigation className="w-3 h-3" />,   color: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange', label: 'Con desvío' },
  extension:   { icon: <RouteIcon className="w-3 h-3" />,    color: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue',       label: 'Extensión' },
  exclusivo:   { icon: <ShieldAlert className="w-3 h-3" />,  color: 'bg-destructive/10 border-destructive/30 text-destructive', label: 'Solo exclusivo' },
  desconocida: { icon: <HelpCircle className="w-3 h-3" />,   color: 'bg-muted border-border text-muted-foreground',             label: 'No encontrada' },
};

export { STATUS_CFG };

export function CityBadge({ cls }: { cls: CityClassification }) {
  if (!cls || cls.status === 'desconocida') return null;
  const cfg = STATUS_CFG[cls.status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
      {cls.routeNames.length > 0 && (
        <span className="opacity-70 font-normal">· {cls.routeNames.slice(0, 2).join(', ')}</span>
      )}
    </span>
  );
}

interface CityFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  billableVol?: number;
  showWarnings?: boolean;
}

export default function CityField({ label, value, onChange, placeholder, billableVol = 0, showWarnings = true }: CityFieldProps) {
  const [open, setOpen] = useState(false);
  const cls: CityClassification | null = value.trim().length >= 2 ? classifyCity(value) : null;
  const suggestions = value.length >= 2
    ? ALL_CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];
  const desvioCharge = cls?.status === 'desvio' ? getDesvioSurcharge(Math.max(5, billableVol)) : 0;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
        {cls && <CityBadge cls={cls} />}
      </div>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all"
      />

      {/* Autocomplete */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {suggestions.map(city => {
              const c = classifyCity(city);
              const cfg = STATUS_CFG[c.status];
              return (
                <li key={city}>
                  <button
                    type="button"
                    onMouseDown={() => { onChange(city); setOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      {city}
                    </span>
                    {c.status !== 'desconocida' && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Inline warnings */}
      {showWarnings && (
        <AnimatePresence>
          {cls?.status === 'exclusivo' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/30">
                <ShieldAlert className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-semibold">
                  Esta zona no aplica para servicio compartido. Solo se ofrece servicio exclusivo.
                </p>
              </div>
            </motion.div>
          )}
          {cls?.status === 'desvio' && desvioCharge > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-neon-orange/10 border border-neon-orange/30">
                <Navigation className="w-3.5 h-3.5 text-neon-orange flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neon-orange font-semibold">
                  Ciudad con desvío · cargo adicional estimado:{' '}
                  <strong>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(desvioCharge)}</strong>
                </p>
              </div>
            </motion.div>
          )}
          {cls?.status === 'desconocida' && value.trim().length >= 3 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-muted border border-border">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground font-medium">Ciudad no encontrada en el sistema.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
