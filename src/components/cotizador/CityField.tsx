import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, BadgeCheck, Navigation, ShieldAlert, HelpCircle,
  Route as RouteIcon, Globe, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { classifyCity, type CityClassification, type CityStatus } from '@/lib/routing-data';
import { getDesvioSurcharge } from '@/hooks/use-cotizacion';
import {
  searchCityEntries, findCityEntry, getCityTypeLabel, getCityTypeMessage,
  type CityEntry, type CityType,
} from '@/lib/city-database';

// ─── Status config for legacy route classification ───────────────────────
const STATUS_CFG: Record<CityStatus, { icon: React.ReactNode; color: string; label: string }> = {
  en_ruta:     { icon: <BadgeCheck className="w-3 h-3" />,   color: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan',       label: 'En ruta' },
  desvio:      { icon: <Navigation className="w-3 h-3" />,   color: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange', label: 'Con desvío' },
  extension:   { icon: <RouteIcon className="w-3 h-3" />,    color: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue',       label: 'Extensión' },
  exclusivo:   { icon: <ShieldAlert className="w-3 h-3" />,  color: 'bg-destructive/10 border-destructive/30 text-destructive', label: 'Solo exclusivo' },
  desconocida: { icon: <HelpCircle className="w-3 h-3" />,   color: 'bg-muted border-border text-muted-foreground',             label: 'No encontrada' },
};

export { STATUS_CFG };

// ─── City type badge config ──────────────────────────────────────────────
const TYPE_CFG: Record<CityType, { icon: React.ReactNode; color: string }> = {
  ruta_regular:  { icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' },
  fuera_de_ruta: { icon: <AlertTriangle className="w-3 h-3" />, color: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange' },
  internacional: { icon: <Globe className="w-3 h-3" />,         color: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' },
};

function CityTypeBadge({ type }: { type: CityType }) {
  const cfg = TYPE_CFG[type];
  const label = getCityTypeLabel(type);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      {cfg.icon}
      {label}
    </span>
  );
}

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
  const [focusIdx, setFocusIdx] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  // Get city entry for current value
  const cityEntry = findCityEntry(value);

  // Legacy classification for backward compatibility with cotizador logic
  const cls: CityClassification | null = value.trim().length >= 2 ? classifyCity(value) : null;
  const desvioCharge = cls?.status === 'desvio' ? getDesvioSurcharge(Math.max(5, billableVol)) : 0;

  // Search results
  const suggestions = searchCityEntries(value);

  // Group suggestions by country
  const mxSuggestions = suggestions.filter(s => s.country === 'MX');
  const usaSuggestions = suggestions.filter(s => s.country === 'USA');
  const allSuggestions = [...mxSuggestions, ...usaSuggestions];

  // Reset focus index when suggestions change
  useEffect(() => { setFocusIdx(-1); }, [value]);

  function handleSelect(entry: CityEntry) {
    onChange(entry.city);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || allSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx(prev => Math.min(prev + 1, allSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault();
      handleSelect(allSuggestions[focusIdx]);
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focusIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      items[focusIdx]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIdx]);

  return (
    <div className="relative">
      {/* Label + Badge */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
        {cityEntry && <CityTypeBadge type={cityEntry.type} />}
        {!cityEntry && cls && cls.status !== 'desconocida' && <CityBadge cls={cls} />}
      </div>

      {/* Input */}
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all"
      />

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {open && allSuggestions.length > 0 && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto"
          >
            {/* Mexico cities */}
            {mxSuggestions.length > 0 && (
              <>
                <li className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-border flex items-center gap-1.5">
                  <span className="text-sm">🇲🇽</span> México
                </li>
                {mxSuggestions.map((entry, i) => {
                  const idx = i;
                  const typeCfg = TYPE_CFG[entry.type];
                  return (
                    <li key={entry.display}>
                      <button
                        type="button"
                        onMouseDown={() => handleSelect(entry)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                          focusIdx === idx
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50 hover:text-accent-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            <span className="font-semibold text-foreground">{entry.city}</span>
                            <span className="text-muted-foreground">, {entry.state}</span>
                          </span>
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${typeCfg.color}`}>
                          {typeCfg.icon}
                          {getCityTypeLabel(entry.type)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </>
            )}

            {/* USA cities */}
            {usaSuggestions.length > 0 && (
              <>
                <li className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 border-b border-border flex items-center gap-1.5">
                  <span className="text-sm">🇺🇸</span> Estados Unidos
                </li>
                {usaSuggestions.map((entry, i) => {
                  const idx = mxSuggestions.length + i;
                  const typeCfg = TYPE_CFG[entry.type];
                  return (
                    <li key={entry.display}>
                      <button
                        type="button"
                        onMouseDown={() => handleSelect(entry)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                          focusIdx === idx
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50 hover:text-accent-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Globe className="w-3.5 h-3.5 text-neon-blue flex-shrink-0" />
                          <span className="truncate">
                            <span className="font-semibold text-foreground">{entry.city}</span>
                            <span className="text-muted-foreground">, {entry.state}</span>
                          </span>
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${typeCfg.color}`}>
                          {typeCfg.icon}
                          {getCityTypeLabel(entry.type)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </>
            )}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Inline messages based on city type */}
      {showWarnings && (
        <AnimatePresence>
          {/* Ruta regular message */}
          {cityEntry?.type === 'ruta_regular' && value.trim().length >= 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-neon-cyan flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neon-cyan font-medium">
                  {getCityTypeMessage('ruta_regular')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Fuera de ruta message */}
          {cityEntry?.type === 'fuera_de_ruta' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-neon-orange/10 border border-neon-orange/30">
                <AlertTriangle className="w-3.5 h-3.5 text-neon-orange flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neon-orange font-semibold">
                  {getCityTypeMessage('fuera_de_ruta')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Internacional message */}
          {cityEntry?.type === 'internacional' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-neon-blue/10 border border-neon-blue/30">
                <Globe className="w-3.5 h-3.5 text-neon-blue flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neon-blue font-semibold">
                  {getCityTypeMessage('internacional')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Legacy: exclusivo zone */}
          {!cityEntry && cls?.status === 'exclusivo' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/30">
                <ShieldAlert className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-semibold">
                  Esta zona no aplica para servicio compartido. Solo se ofrece servicio exclusivo.
                </p>
              </div>
            </motion.div>
          )}

          {/* Legacy: desvío surcharge */}
          {!cityEntry && cls?.status === 'desvio' && desvioCharge > 0 && (
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

          {/* Unknown city */}
          {!cityEntry && cls?.status === 'desconocida' && value.trim().length >= 3 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-1.5 flex gap-2 p-2.5 rounded-xl bg-muted border border-border">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground font-medium">Ciudad no encontrada en el sistema. Cotización sujeta a validación.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
