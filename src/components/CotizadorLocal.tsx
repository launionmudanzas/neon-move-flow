/**
 * CotizadorLocal — Cotizador standalone para mudanzas locales
 * Soporta múltiples zonas (CDMX inicial, expandible)
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, MapPin, Building, Package, Shield, AlertTriangle,
  CheckCircle2, ChevronRight, Plus, Minus, Info, Wrench,
  DoorOpen, ArrowUp, Eye, Phone,
} from 'lucide-react';
import {
  UNIDADES_LOCALES, seleccionarUnidad, PIEZAS_ESPECIALES,
  EXTRAS_INICIALES, calcularCostoPisos, calcularVolumenExtra,
  calcularServicioLocal, ZONAS_COBERTURA_LOCAL,
  type ExtraItem, type PisosConfig, type ResultadoLocal,
} from '@/lib/cotizador-local';
import { formatMXN, WHATSAPP_NUMBER } from '@/components/cotizador/constants';
import { NavButton } from '@/components/cotizador/shared';

// ─── Zonas disponibles ───────────────────────────────────────────
interface ZonaConfig {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
}

const ZONAS_DISPONIBLES: ZonaConfig[] = [
  { id: 'cdmx', nombre: 'CDMX y Zona Metropolitana', emoji: '🏙️', descripcion: 'Ciudad de México, Naucalpan, Atizapán, Huixquilucan, Tlalpan, Coyoacán' },
  // Futuras zonas se agregan aquí
];

// ─── State ───────────────────────────────────────────────────────
interface LocalState {
  zona: string;
  nombre: string;
  whatsapp: string;
  origen: string;
  destino: string;
  volumen: number;
  pisosOrigen: number;
  pisosDestino: number;
  elevadorOrigen: boolean;
  elevadorDestino: boolean;
  escaleras: boolean;
  tipoPiso: 'sencillo' | 'complejo';
  m3Reales: number;
  extras: ExtraItem[];
  piezasSeleccionadas: string[];
  piezasObservaciones: string;
}

const INITIAL_LOCAL: LocalState = {
  zona: 'cdmx',
  nombre: '',
  whatsapp: '',
  origen: '',
  destino: '',
  volumen: 0,
  pisosOrigen: 1,
  pisosDestino: 1,
  elevadorOrigen: false,
  elevadorDestino: false,
  escaleras: true,
  tipoPiso: 'sencillo',
  m3Reales: 0,
  extras: EXTRAS_INICIALES.map(e => ({ ...e })),
  piezasSeleccionadas: [],
  piezasObservaciones: '',
};

// ─── Sub-components ──────────────────────────────────────────────
function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-black text-xl text-foreground">{title}</h3>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 0, max = 99, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-neon-cyan/40 transition-colors"
          disabled={value <= min}>
          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <span className="w-10 text-center font-bold text-foreground text-sm">{value}{suffix}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-neon-cyan/40 transition-colors"
          disabled={value >= max}>
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-neon-cyan' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function DesgloseLine({ label, value, accent, warn, bold }: {
  label: string; value: string; accent?: boolean; warn?: boolean; bold?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${bold ? 'font-bold text-base' : 'text-sm'}`}>
      <span className={`${warn ? 'text-neon-orange' : accent ? 'text-neon-cyan' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`font-mono ${bold ? 'text-foreground text-lg' : accent ? 'text-neon-cyan font-bold' : warn ? 'text-neon-orange font-bold' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function LocalProgress({ step, total }: { step: number; total: number }) {
  const steps = ['Datos', 'Volumen', 'Pisos', 'Extras', 'Resultado'];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-neon-cyan' : 'bg-border'}`} />
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
        </div>
      ))}
      <span className="text-[10px] font-bold text-muted-foreground ml-2">{steps[step - 1]}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function CotizadorLocal() {
  const [step, setStep] = useState(1);
  const [s, setS] = useState<LocalState>({ ...INITIAL_LOCAL });

  const upd = (patch: Partial<LocalState>) => setS(prev => ({ ...prev, ...patch }));

  const unidad = useMemo(() => seleccionarUnidad(s.volumen), [s.volumen]);

  const resultado: ResultadoLocal | null = useMemo(() => {
    if (!unidad) return null;
    return calcularServicioLocal({
      volumen: s.volumen,
      pisos: {
        pisosOrigen: s.pisosOrigen,
        pisosDestino: s.pisosDestino,
        elevadorOrigen: s.elevadorOrigen,
        elevadorDestino: s.elevadorDestino,
        escaleras: s.escaleras,
        tipo: s.tipoPiso,
      },
      m3Reales: s.m3Reales,
      extras: s.extras,
      piezasEspeciales: s.piezasSeleccionadas,
    });
  }, [s, unidad]);

  const updateExtra = (id: string, patch: Partial<ExtraItem>) => {
    upd({
      extras: s.extras.map(e => e.id === id ? { ...e, ...patch } : e),
    });
  };

  const canStep1 = Boolean(s.nombre.trim() && s.whatsapp.trim().length >= 10 && s.origen.trim() && s.destino.trim());

  const selectedZona = ZONAS_DISPONIBLES.find(z => z.id === s.zona);

  // ════════════ RENDER ════════════
  return (
    <div>
      <LocalProgress step={step} total={5} />

      <AnimatePresence mode="wait">

        {/* ════════════ STEP 1: DATOS Y ZONA ════════════ */}
        {step === 1 && (
          <motion.div key="l1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <StepHeader icon={<MapPin className="w-5 h-5 text-neon-cyan" />} title="Datos y zona" subtitle="Tu información y zona de servicio" />

            {/* Zona selector */}
            <div className="mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Zona de servicio</p>
              <div className="space-y-2">
                {ZONAS_DISPONIBLES.map(zona => (
                  <button
                    key={zona.id}
                    onClick={() => upd({ zona: zona.id })}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      s.zona === zona.id
                        ? 'border-neon-cyan bg-neon-cyan/5 shadow-[0_0_20px_hsl(180_100%_50%/0.08)]'
                        : 'border-border bg-surface hover:border-border/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{zona.emoji}</span>
                      <div>
                        <p className={`font-bold text-sm ${s.zona === zona.id ? 'text-neon-cyan' : 'text-foreground'}`}>{zona.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">{zona.descripcion}</p>
                      </div>
                      {s.zona === zona.id && <CheckCircle2 className="w-5 h-5 text-neon-cyan ml-auto flex-shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Más zonas próximamente · Tarifa básica hasta 50 km
              </p>
            </div>

            {/* Contact fields */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombre completo *</label>
                  <input value={s.nombre} onChange={e => upd({ nombre: e.target.value })} placeholder="Tu nombre" maxLength={100}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">WhatsApp *</label>
                  <input value={s.whatsapp} onChange={e => upd({ whatsapp: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="10 dígitos" type="tel"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Origen *</label>
                  <input value={s.origen} onChange={e => upd({ origen: e.target.value })} placeholder="Colonia o zona de origen" maxLength={150}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Destino *</label>
                  <input value={s.destino} onChange={e => upd({ destino: e.target.value })} placeholder="Colonia o zona de destino" maxLength={150}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <NavButton label="Siguiente" onClick={() => setStep(2)} variant="primary" disabled={!canStep1} />
            </div>
            {!canStep1 && (
              <p className="text-xs text-muted-foreground text-center mt-2">Completa nombre, WhatsApp, origen y destino</p>
            )}
          </motion.div>
        )}

        {/* ════════════ STEP 2: VOLUMEN Y UNIDAD ════════════ */}
        {step === 2 && (
          <motion.div key="l2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <StepHeader icon={<Truck className="w-5 h-5 text-neon-cyan" />} title="Volumen y unidad" subtitle="Selecciona según tu carga" />

            {/* Zone banner */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-cyan/8 border border-neon-cyan/25 mb-4">
              <MapPin className="w-4 h-4 text-neon-cyan flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-neon-cyan">Servicio Local · {selectedZona?.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{s.origen} → {s.destino}</p>
              </div>
            </div>

            {/* Volume input */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Volumen estimado (m³)</label>
              <input
                type="number" min={1} max={45} step={0.5}
                value={s.volumen || ''}
                onChange={e => {
                  const v = Number(e.target.value);
                  upd({ volumen: v, m3Reales: Math.max(v, s.m3Reales === 0 ? v : s.m3Reales) });
                }}
                placeholder="Ej. 10"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all"
              />
              {s.volumen > 45 && (
                <p className="text-xs text-neon-orange mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Volumen fuera de rango local. Contacta un asesor.
                </p>
              )}
            </div>

            {/* Unit cards */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unidades disponibles</p>
              {UNIDADES_LOCALES.map(u => {
                const selected = unidad?.id === u.id;
                return (
                  <div key={u.id} className={`p-4 rounded-xl border transition-all ${selected ? 'border-neon-cyan bg-neon-cyan/5 shadow-[0_0_20px_hsl(180_100%_50%/0.08)]' : 'border-border bg-surface'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{u.emoji}</span>
                        <div>
                          <p className={`font-bold text-sm ${selected ? 'text-neon-cyan' : 'text-foreground'}`}>{u.nombre}</p>
                          <p className="text-[10px] text-muted-foreground">Hasta {u.capacidadMax} m³ · {u.personal} personas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold text-sm ${selected ? 'text-neon-cyan' : 'text-foreground'}`}>
                          {formatMXN(u.precioMin)}{u.precioMin !== u.precioMax && ` - ${formatMXN(u.precioMax)}`}
                        </p>
                        {selected && (
                          <span className="text-[10px] text-neon-cyan font-bold">✓ SUGERIDA</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <NavButton label="Atrás" onClick={() => setStep(1)} />
              <NavButton label="Pisos y acceso" onClick={() => setStep(3)} variant="primary" disabled={!unidad} />
            </div>
          </motion.div>
        )}

        {/* ════════════ STEP 3: PISOS ════════════ */}
        {step === 3 && (
          <motion.div key="l3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <StepHeader icon={<Building className="w-5 h-5 text-neon-cyan" />} title="Pisos y acceso" subtitle="Condiciones de carga y descarga" />

            {/* Tipo de servicio de pisos */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tipo de maniobra</p>
              <div className="grid grid-cols-2 gap-2">
                {(['sencillo', 'complejo'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => upd({ tipoPiso: t })}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      s.tipoPiso === t
                        ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                        : 'border-border bg-background text-muted-foreground hover:border-border/60'
                    }`}
                  >
                    {t === 'sencillo' ? '📦 Regular / Sencillo' : '🏗️ Complejo / Pesado'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {s.tipoPiso === 'sencillo' ? '$250/piso adicional' : '$450/piso adicional (piezas pesadas, difícil acceso)'}
              </p>
            </div>

            {/* Origen */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-3">
              <div className="flex items-center gap-2 mb-3">
                <DoorOpen className="w-4 h-4 text-neon-cyan" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origen</p>
              </div>
              <NumberInput label="Número de piso" value={s.pisosOrigen} onChange={v => upd({ pisosOrigen: v })} min={1} max={30} />
              <ToggleSwitch label="¿Tiene elevador?" checked={s.elevadorOrigen} onChange={v => upd({ elevadorOrigen: v })} />
            </div>

            {/* Destino */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUp className="w-4 h-4 text-neon-green" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Destino</p>
              </div>
              <NumberInput label="Número de piso" value={s.pisosDestino} onChange={v => upd({ pisosDestino: v })} min={1} max={30} />
              <ToggleSwitch label="¿Tiene elevador?" checked={s.elevadorDestino} onChange={v => upd({ elevadorDestino: v })} />
            </div>

            {/* Pisos summary */}
            {(() => {
              const dp = calcularCostoPisos({
                pisosOrigen: s.pisosOrigen,
                pisosDestino: s.pisosDestino,
                elevadorOrigen: s.elevadorOrigen,
                elevadorDestino: s.elevadorDestino,
                escaleras: s.escaleras,
                tipo: s.tipoPiso,
              });
              return dp.pisosTotal > 0 ? (
                <div className="p-3 rounded-xl bg-neon-orange/8 border border-neon-orange/20 mb-4">
                  <p className="text-xs text-neon-orange font-bold">
                    {dp.pisosTotal} piso{dp.pisosTotal > 1 ? 's' : ''} adicional{dp.pisosTotal > 1 ? 'es' : ''} · {formatMXN(dp.porPiso)}/piso = {formatMXN(dp.total)}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-neon-cyan/8 border border-neon-cyan/20 mb-4">
                  <p className="text-xs text-neon-cyan font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sin cargo extra por pisos
                  </p>
                </div>
              );
            })()}

            <div className="flex gap-3">
              <NavButton label="Atrás" onClick={() => setStep(2)} />
              <NavButton label="Extras" onClick={() => setStep(4)} variant="primary" />
            </div>
          </motion.div>
        )}

        {/* ════════════ STEP 4: EXTRAS ════════════ */}
        {step === 4 && (
          <motion.div key="l4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <StepHeader icon={<Wrench className="w-5 h-5 text-neon-cyan" />} title="Extras y piezas especiales" subtitle="Cobros adicionales al servicio base" />

            {/* Volumen extra */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Volumen real vs. cotizado</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">m³ cotizados</label>
                  <input type="number" value={s.volumen} disabled
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm opacity-60" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">m³ reales</label>
                  <input type="number" min={0} max={100} step={0.5} value={s.m3Reales || ''}
                    onChange={e => upd({ m3Reales: Number(e.target.value) })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                </div>
              </div>
              {s.m3Reales > s.volumen && unidad && (
                <div className="mt-2 p-2 rounded-lg bg-neon-orange/8 border border-neon-orange/20">
                  <p className="text-[11px] text-neon-orange font-bold">
                    +{(s.m3Reales - s.volumen).toFixed(1)} m³ extra · Cargo adicional: {formatMXN(calcularVolumenExtra(s.volumen, s.m3Reales, Math.round((unidad.precioMin + unidad.precioMax) / 2)).costoExtra)}
                  </p>
                </div>
              )}
            </div>

            {/* Extras */}
            <div className="space-y-3 mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Servicios adicionales</p>
              {s.extras.map(extra => (
                <div key={extra.id} className={`p-4 rounded-xl border transition-all ${extra.activo ? 'border-neon-cyan/30 bg-neon-cyan/5' : 'border-border bg-surface'}`}>
                  <ToggleSwitch label={extra.label} checked={extra.activo} onChange={v => updateExtra(extra.id, { activo: v })} />
                  {extra.activo && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Monto ($)</label>
                        <input type="number" min={0} value={extra.monto || ''} onChange={e => updateExtra(extra.id, { monto: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Observaciones</label>
                        <input value={extra.observaciones} onChange={e => updateExtra(extra.id, { observaciones: e.target.value })}
                          placeholder="Detalle del servicio..."
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" maxLength={200} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Piezas especiales */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Piezas especiales</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PIEZAS_ESPECIALES.map(pieza => {
                  const selected = s.piezasSeleccionadas.includes(pieza);
                  return (
                    <button
                      key={pieza}
                      onClick={() => {
                        const next = selected
                          ? s.piezasSeleccionadas.filter(p => p !== pieza)
                          : [...s.piezasSeleccionadas, pieza];
                        upd({ piezasSeleccionadas: next });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        selected
                          ? 'border-neon-orange bg-neon-orange/10 text-neon-orange'
                          : 'border-border text-muted-foreground hover:border-border/60'
                      }`}
                    >
                      {selected ? '✓ ' : ''}{pieza}
                    </button>
                  );
                })}
              </div>
              {s.piezasSeleccionadas.length > 0 && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">Observaciones de piezas</label>
                  <input value={s.piezasObservaciones} onChange={e => upd({ piezasObservaciones: e.target.value })}
                    placeholder="Detalles de las piezas especiales..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" maxLength={300} />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <NavButton label="Atrás" onClick={() => setStep(3)} />
              <NavButton label="Ver resultado" onClick={() => setStep(5)} variant="primary" />
            </div>
          </motion.div>
        )}

        {/* ════════════ STEP 5: RESULTADO ════════════ */}
        {step === 5 && resultado && (
          <motion.div key="l5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <StepHeader icon={<Eye className="w-5 h-5 text-neon-cyan" />} title="Resumen de cotización" subtitle="Desglose completo del servicio local" />

            {/* Validation warning */}
            <div className="p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/25 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-neon-orange">Sujeto a validación por fotos o visita virtual.</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Si no se suben fotos o hay datos ambiguos, la cotización queda pendiente de validación.
                </p>
              </div>
            </div>

            {/* Unit summary */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{resultado.unidad.emoji}</span>
                  <div>
                    <p className="font-bold text-foreground">{resultado.unidad.nombre}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Hasta {resultado.unidad.capacidadMax} m³ · {resultado.unidad.personal} personas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Volumen</p>
                  <p className="font-bold text-foreground">{s.volumen} m³</p>
                </div>
              </div>
            </div>

            {/* Desglose */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Desglose</p>
              <div className="space-y-1">
                <DesgloseLine label={`Servicio básico (${resultado.unidad.nombre})`} value={formatMXN(resultado.costoBase)} accent />

                {resultado.desglosePisos.pisosTotal > 0 && (
                  <DesgloseLine
                    label={`Pisos (${resultado.desglosePisos.pisosTotal} × ${formatMXN(resultado.desglosePisos.porPiso)})`}
                    value={formatMXN(resultado.costoPisos)}
                  />
                )}
                {resultado.desglosePisos.pisosTotal === 0 && (
                  <DesgloseLine label="Pisos" value="Sin cargo" />
                )}

                {resultado.desgloseVolumen.m3Extra > 0 && (
                  <DesgloseLine
                    label={`m³ extra (${resultado.desgloseVolumen.m3Extra.toFixed(1)} × ${formatMXN(resultado.desgloseVolumen.costoM3)})`}
                    value={formatMXN(resultado.costoVolumenExtra)}
                    warn
                  />
                )}

                {resultado.detalleExtras.map((e, i) => (
                  <DesgloseLine key={i} label={e.label} value={formatMXN(e.monto)} />
                ))}

                <div className="border-t-2 border-neon-cyan/30 pt-2 mt-2">
                  <DesgloseLine label="TOTAL ESTIMADO" value={formatMXN(resultado.total)} bold />
                </div>
              </div>
            </div>

            {/* Piezas especiales note */}
            {s.piezasSeleccionadas.length > 0 && (
              <div className="p-3 rounded-xl bg-neon-orange/8 border border-neon-orange/20 mb-4">
                <p className="text-xs font-bold text-neon-orange mb-1">Piezas especiales detectadas:</p>
                <p className="text-[11px] text-muted-foreground">{s.piezasSeleccionadas.join(' · ')}</p>
                {s.piezasObservaciones && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">{s.piezasObservaciones}</p>
                )}
              </div>
            )}

            {/* Final warning */}
            <div className="p-3 rounded-xl bg-muted border border-border mb-4 flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Costos adicionales pueden aplicarse según condiciones reales del servicio. 
                Las tarifas son indicativas y pueden variar tras la validación visual del inventario.
              </p>
            </div>

            {resultado.requiereValidacion && (
              <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/20 mb-4 flex items-start gap-2">
                <Shield className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-bold">
                  Esta cotización requiere validación visual antes de confirmar precios.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <NavButton label="Modificar" onClick={() => setStep(1)} />
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hola, solicito cotización de servicio local:\n\n` +
                  `👤 ${s.nombre}\n` +
                  `📱 ${s.whatsapp}\n` +
                  `🏙️ Zona: ${selectedZona?.nombre}\n` +
                  `📍 ${s.origen} → ${s.destino}\n` +
                  `📦 Volumen: ${s.volumen} m³\n` +
                  `🚛 Unidad: ${resultado.unidad.nombre}\n` +
                  `💰 Estimado: ${formatMXN(resultado.total)}\n` +
                  (s.piezasSeleccionadas.length > 0 ? `⚠️ Piezas especiales: ${s.piezasSeleccionadas.join(', ')}\n` : '') +
                  `\n_#LaUnionMudanzas · Servicio Local_`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-neon-green text-background hover:shadow-glow-green transition-all"
              >
                Confirmar por WhatsApp
              </a>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
