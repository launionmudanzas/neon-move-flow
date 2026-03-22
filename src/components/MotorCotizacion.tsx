/**
 * MotorCotizacion – standalone logistics pricing engine UI
 * La Unión Mudanzas · zona/tramo-based m³ quotation tool
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ArrowRight, Package, AlertTriangle, CheckCircle2,
  Info, Route, Zap, Search, RotateCcw, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCotizacion, calcularRuta, DESVIO_CITIES, RutaRow } from '@/hooks/use-cotizacion';

// ──────────────────────────────────────────────────────────────────────────────
// City autocomplete list
// ──────────────────────────────────────────────────────────────────────────────

const CIUDADES = [
  'Ciudad de México','Guadalajara','Monterrey','Tijuana','Los Cabos','La Paz',
  'Querétaro','Puebla','San Luis Potosí','Morelia','León','Irapuato','Salamanca',
  'Aguascalientes','San Miguel de Allende','Durango','Chihuahua','Cd. Juárez',
  'Acapulco','Lázaro Cárdenas','Ixtapa','Zihuatanejo','Veracruz','Oaxaca',
  'Mérida','Cancún','Chiapas','Villahermosa','Vallarta','Colima','Mazatlán',
  'Culiacán','Hermosillo','Nogales','Cozumel','Reynosa','Nuevo Laredo',
  // Desvío cities
  'Piedras Negras','Tampico','Toluca','Valle de Bravo','Lerma',
  'Metepec','Bacalar','Chetumal','Ciudad del Carmen',
].sort();

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const MARGEN = 0.30;
const RECOLECCION = 500;
const ENTREGA = 500;
const MIN_VOL = 5;

function getUnit(vol: number) {
  if (vol <= 10) return { label: 'Nissan / Camioneta', emoji: '🚐' };
  if (vol <= 20) return { label: 'Camioneta 3.5 ton', emoji: '🚚' };
  if (vol <= 35) return { label: 'Rabón', emoji: '🚛' };
  if (vol <= 60) return { label: 'Tórtón', emoji: '🚛' };
  if (vol <= 90) return { label: 'Camión Grande', emoji: '🚛' };
  return { label: 'Tráiler', emoji: '🚛🚛' };
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-component: CityInput with autocomplete
// ──────────────────────────────────────────────────────────────────────────────

function CityInput({
  label, value, onChange, placeholder, icon
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const filtered = value.length >= 2
    ? CIUDADES.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="relative">
      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pl-10 bg-surface border-border focus:border-neon-cyan/60 text-foreground placeholder:text-muted-foreground/50"
        />
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
          >
            {filtered.map(city => (
              <li key={city}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                  onMouseDown={() => { onChange(city); setOpen(false); }}
                >
                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  {city}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Result breakdown card
// ──────────────────────────────────────────────────────────────────────────────

interface CotizacionResultado {
  tipo: 'directa' | 'espejo' | 'tramos' | 'no_disponible';
  costoM3: number;
  tramos: { desde: string; hasta: string; costo: number }[];
  observaciones: string[];
  advertencias: string[];
  costoDesvio: number;
  precioBase: number;
  conMargen: number;
  precioTotal: number;
  volumenCobrable: number;
  unit: { label: string; emoji: string };
}

function ResultCard({ r }: { r: CotizacionResultado }) {
  const tipoBadge = {
    directa: { label: 'Ruta directa', color: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30' },
    espejo: { label: 'Ruta espejo', color: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30' },
    tramos: { label: 'Vía tramos', color: 'bg-neon-orange/15 text-neon-orange border-neon-orange/30' },
    no_disponible: { label: 'Estimado', color: 'bg-destructive/15 text-destructive border-destructive/30' },
  }[r.tipo];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-border bg-surface overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-surface to-background">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tipoBadge.color} mb-2`}>
              <Route className="w-3 h-3" />
              {tipoBadge.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-black text-foreground">{fmt(r.precioTotal)}</span>
              <span className="text-sm text-muted-foreground font-semibold">total estimado</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl">{r.unit.emoji}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{r.unit.label}</p>
          </div>
        </div>
      </div>

      {/* Tramos route map */}
      {r.tramos.length > 0 && (
        <div className="px-6 py-4 border-b border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Trayecto</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {r.tramos.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="w-px h-3 bg-border" />
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <div className="w-px h-3 bg-border" />
                  </div>
                )}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  i === 0 ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan'
                  : i === r.tramos.length - 1 ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue'
                  : 'bg-muted border-border text-muted-foreground'
                }`}>
                  <MapPin className="w-2.5 h-2.5 inline mr-1" />
                  {i === 0 ? t.desde : t.hasta}
                </div>
                {r.tramos.length > 1 && i < r.tramos.length - 1 && (
                  <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {fmt(t.costo)}/m³
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price breakdown */}
      <div className="px-6 py-4 border-b border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Desglose</p>
        <div className="space-y-2">
          <Row label="Tarifa de ruta" value={`${fmt(r.costoM3)}/m³`} accent />
          <Row label={`Volumen cobrable (${r.volumenCobrable} m³)`} value={fmt(r.precioBase)} />
          <Row label="Recolección + entrega" value={fmt(RECOLECCION + ENTREGA)} />
          {r.costoDesvio > 0 && (
            <Row label="Cargo por desvío" value={fmt(r.costoDesvio)} warn />
          )}
          <div className="border-t border-border pt-2 mt-1">
            <Row label="Subtotal sin margen" value={fmt(r.precioBase + RECOLECCION + ENTREGA + r.costoDesvio)} />
            <Row label={`Margen operativo (${MARGEN * 100}%)`} value={fmt(r.conMargen - (r.precioBase + RECOLECCION + ENTREGA + r.costoDesvio))} />
          </div>
          <div className="border-t-2 border-neon-cyan/30 pt-2">
            <Row label="TOTAL ESTIMADO" value={fmt(r.precioTotal)} total />
          </div>
        </div>
      </div>

      {/* Warnings */}
      {r.advertencias.length > 0 && (
        <div className="px-6 py-4 border-b border-border space-y-2">
          {r.advertencias.map((a, i) => (
            <div key={i} className="flex gap-2 p-3 rounded-xl bg-neon-orange/8 border border-neon-orange/20">
              <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
              <p className="text-xs text-neon-orange font-medium">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Observations */}
      {r.observaciones.length > 0 && (
        <div className="px-6 py-4 space-y-2">
          {r.observaciones.map((o, i) => (
            <div key={i} className="flex gap-2 p-3 rounded-xl bg-neon-blue/8 border border-neon-blue/20">
              <Info className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-neon-blue font-medium">{o}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Row({ label, value, accent, warn, total }: {
  label: string; value: string; accent?: boolean; warn?: boolean; total?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-1 ${total ? 'py-1.5' : ''}`}>
      <span className={`text-sm ${total ? 'font-black text-foreground' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`text-sm font-bold tabular-nums ${
        total ? 'text-neon-cyan text-base font-black'
        : accent ? 'text-foreground'
        : warn ? 'text-neon-orange'
        : 'text-foreground'
      }`}>{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

export default function MotorCotizacion() {
  const { cargarRutas } = useCotizacion();

  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [volumen, setVolumen] = useState<number | ''>('');
  const [tieneDesvio, setTieneDesvio] = useState(false);
  const [ciudadDesvio, setCiudadDesvio] = useState('');
  const [resultado, setResultado] = useState<CotizacionResultado | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const calcular = useCallback(async () => {
    setErrMsg('');
    if (!origen.trim() || !destino.trim()) {
      setErrMsg('Ingresa origen y destino.');
      return;
    }
    const vol = typeof volumen === 'number' ? volumen : 0;
    if (vol < 1) {
      setErrMsg('Ingresa un volumen válido (mínimo 1 m³).');
      return;
    }
    if (tieneDesvio && !ciudadDesvio.trim()) {
      setErrMsg('Indica la ciudad de desvío.');
      return;
    }

    setCalculando(true);
    try {
      const rutas = await cargarRutas();
      const volCob = Math.max(MIN_VOL, vol);
      const res = calcularRuta(rutas, origen, destino, volCob, tieneDesvio, ciudadDesvio);

      const precioBase = volCob * res.costoM3;
      const subtotal = precioBase + RECOLECCION + ENTREGA + res.costoDesvio;
      const conMargen = subtotal * (1 + MARGEN);
      const precioTotal = Math.round(conMargen);

      setResultado({
        ...res,
        precioBase,
        conMargen,
        precioTotal,
        volumenCobrable: volCob,
        unit: getUnit(volCob),
      });
    } catch {
      setErrMsg('Error al calcular la ruta. Intenta de nuevo.');
    } finally {
      setCalculando(false);
    }
  }, [origen, destino, volumen, tieneDesvio, ciudadDesvio, cargarRutas]);

  const reset = () => {
    setOrigen('');
    setDestino('');
    setVolumen('');
    setTieneDesvio(false);
    setCiudadDesvio('');
    setResultado(null);
    setErrMsg('');
  };

  const swapCities = () => {
    const tmp = origen;
    setOrigen(destino);
    setDestino(tmp);
    setResultado(null);
  };

  return (
    <section id="motor-cotizacion" className="py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-bold mb-4">
            <Zap className="w-4 h-4" />
            Motor de cotización logística
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-2">
            Calcula tu mudanza <span className="text-neon-cyan">al instante</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Rutas directas, espejo y por tramos · Cargos por desvío · 130+ ciudades de México
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-surface p-6 mb-6 space-y-5"
        >
          {/* Origin / Destination */}
          <div className="grid grid-cols-1 gap-4 relative">
            <CityInput
              label="Origen"
              value={origen}
              onChange={v => { setOrigen(v); setResultado(null); }}
              placeholder="Ciudad de origen…"
              icon={<MapPin className="w-4 h-4" />}
            />

            {/* Swap button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={swapCities}
                className="w-9 h-9 rounded-full border border-border bg-muted hover:bg-accent hover:border-neon-cyan/40 flex items-center justify-center transition-all active:scale-90"
                title="Intercambiar ciudades"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <CityInput
              label="Destino"
              value={destino}
              onChange={v => { setDestino(v); setResultado(null); }}
              placeholder="Ciudad de destino…"
              icon={<MapPin className="w-4 h-4 text-neon-cyan" />}
            />
          </div>

          {/* Volume */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Volumen de carga (m³)
            </Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                max={200}
                value={volumen}
                onChange={e => {
                  const v = e.target.value === '' ? '' : Number(e.target.value);
                  setVolumen(v);
                  setResultado(null);
                }}
                placeholder="Ej. 15"
                className="pl-10 bg-surface border-border focus:border-neon-cyan/60"
              />
            </div>
            {typeof volumen === 'number' && volumen > 0 && volumen < MIN_VOL && (
              <p className="text-xs text-neon-orange mt-1 font-medium">
                ⚠️ Mínimo cobrable: {MIN_VOL} m³ (se cotizará con {MIN_VOL} m³)
              </p>
            )}
          </div>

          {/* Detour toggle */}
          <div className="p-4 rounded-xl border border-border bg-background">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">¿Incluye desvío?</span>
              </div>
              <Switch
                checked={tieneDesvio}
                onCheckedChange={v => { setTieneDesvio(v); if (!v) setCiudadDesvio(''); setResultado(null); }}
              />
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Parada adicional fuera de ruta principal (cargo fijo por volumen)
            </p>

            <AnimatePresence>
              {tieneDesvio && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                      Ciudad de desvío
                    </Label>
                    <CityInput
                      label=""
                      value={ciudadDesvio}
                      onChange={v => { setCiudadDesvio(v); setResultado(null); }}
                      placeholder="Ciudad del desvío…"
                      icon={<Route className="w-4 h-4 text-neon-orange" />}
                    />
                    {/* Desvío rate preview */}
                    {typeof volumen === 'number' && volumen >= 5 && (
                      <div className="mt-2 grid grid-cols-5 gap-1">
                        {[{r:'5-15',c:3000},{r:'16-20',c:5000},{r:'21-30',c:6000},{r:'31-50',c:7000},{r:'51+',c:8000}].map(t => {
                          const vol = typeof volumen === 'number' ? volumen : 0;
                          const volCob = Math.max(MIN_VOL, vol);
                          const active =
                            (t.r === '5-15'  && volCob >= 5  && volCob <= 15) ||
                            (t.r === '16-20' && volCob >= 16 && volCob <= 20) ||
                            (t.r === '21-30' && volCob >= 21 && volCob <= 30) ||
                            (t.r === '31-50' && volCob >= 31 && volCob <= 50) ||
                            (t.r === '51+'   && volCob >= 51);
                          return (
                            <div key={t.r} className={`text-center p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                              active ? 'bg-neon-orange/15 border-neon-orange/40 text-neon-orange' : 'bg-muted border-border text-muted-foreground'
                            }`}>
                              <div>{t.r} m³</div>
                              <div>${(t.c/1000).toFixed(0)}k</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {errMsg && (
            <div className="flex gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{errMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={calcular}
              disabled={calculando}
              className="flex-1 h-12 font-black text-sm bg-gradient-to-r from-neon-cyan to-neon-blue text-background hover:opacity-90 transition-opacity"
            >
              {calculando ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
                  Calculando…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Calcular precio
                </span>
              )}
            </Button>
            {resultado && (
              <Button variant="outline" onClick={reset} className="h-12 px-4">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Result */}
        <AnimatePresence>
          {resultado && <ResultCard r={resultado} />}
        </AnimatePresence>

        {/* Info footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl bg-muted border border-border"
        >
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            💡 Precios estimados con margen operativo del 30% · No incluyen seguro, maniobras adicionales ni IVA ·
            Para cotización formal con folio llama o escríbenos por WhatsApp
          </p>
        </motion.div>
      </div>
    </section>
  );
}
