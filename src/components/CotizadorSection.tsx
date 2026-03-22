import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import {
  Truck, Home, Building2, Package,
  ChevronRight, ChevronLeft, Plus, Minus, MapPin, Calendar,
  Clock, Shield, AlertTriangle, CheckCircle2, FileText, Phone,
  Star, Zap, Upload, CreditCard, Loader2
} from 'lucide-react';
import OrdenServicioModal from '@/components/OrdenServicioModal';
import PagoModal from '@/components/PagoModal';
import { useCotizacion } from '@/hooks/use-cotizacion';

const WHATSAPP_NUMBER = '4421270514';
const TOTAL_STEPS = 6;
const MIN_VOL = 5; // Volumen mínimo cobrable

// ─── Volume table ────────────────────────────────────────────────
const VOLUMES: Record<string, number> = {
  cama_king: 2.5, cama_matrimonial: 2, cama_individual: 1.5,
  sofa_3_plazas: 2, sofa_2_plazas: 1.5, sofa_individual: 0.8, sofa_cama: 2.5,
  comedor_6: 1.5, comedor_4: 1, mesa_centro: 0.3,
  ropero_3p: 2, ropero_2p: 1.5, cajones_3: 0.8,
  buros: 0.3, tocador: 0.8, librero: 0.8,
  refrigerador_duplex: 2, refrigerador_14: 1.2, estufa: 0.6,
  lavadora: 0.5, secadora: 0.5,
  tv_55: 0.3, tv_65: 0.5, tv_75: 0.6,
  escritorio: 0.8, silla_oficina: 0.4, archivero: 0.5,
  computadora: 0.2, impresora: 0.2,
  bicicleta: 0.5,
  caja_estandar: 0.15,
};

// ─── Unit suggestion (based on BILLABLE volume) ───────────────────
function getUnit(vol: number) {
  if (vol <= 10) return { label: 'Nissan / Camioneta', range: '0–10 m³', icon: '🚐', emoji: '🚐', fill: Math.min(100, (vol / 10) * 100), prev: null };
  if (vol <= 20) return { label: 'Camioneta 3.5 ton', range: '10–20 m³', icon: '🚚', emoji: '🚚', fill: Math.min(100, ((vol - 10) / 10) * 100), prev: 'Nissan / Camioneta' };
  if (vol <= 35) return { label: 'Rabón', range: '20–35 m³', icon: '🚛', emoji: '🚛', fill: Math.min(100, ((vol - 20) / 15) * 100), prev: 'Camioneta 3.5 ton' };
  if (vol <= 60) return { label: 'Tórtón', range: '35–60 m³', icon: '🚛', emoji: '🚛', fill: Math.min(100, ((vol - 35) / 25) * 100), prev: 'Rabón' };
  if (vol <= 90) return { label: 'Camión Grande', range: '60–90 m³', icon: '🚛', emoji: '🚛', fill: Math.min(100, ((vol - 60) / 30) * 100), prev: 'Tórtón' };
  return { label: 'Tráiler', range: '+90 m³', icon: '🚛🚛', emoji: '🚛🚛', fill: 100, prev: 'Camión Grande' };
}

function getEstimatedTime(vol: number) {
  if (vol <= 5)  return '2–3 horas';
  if (vol <= 15) return '3–5 horas';
  if (vol <= 30) return '5–8 horas';
  return '1–2 días';
}

function getInsuranceRate(monto: number): number {
  if (monto < 100000) return 0.02;
  if (monto < 500000) return 0.015;
  return 0.01;
}

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

// ─── Sub-components ───────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const labels = ['Ruta', 'Detalles', 'Inventario', 'Carga', 'Precio', 'Confirmar'];
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-neon-cyan tracking-widest uppercase">Paso {step} de {TOTAL_STEPS}</span>
        <span className="text-xs text-muted-foreground font-semibold">{labels[step - 1]}</span>
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
        {labels.map((l, i) => (
          <div key={l} className={`flex flex-col items-center gap-0.5 ${i + 1 <= step ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${i + 1 < step ? 'bg-neon-cyan' : i + 1 === step ? 'bg-neon-blue ring-2 ring-neon-blue/30' : 'bg-border'}`} />
            <span className="text-[9px] text-muted-foreground hidden sm:block">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionButton({ label, icon, desc, selected, onClick }: {
  label: string; icon: string; desc?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center ${
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

function CounterRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
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

function TruckVisualizer({ vol, billableVol, unit, prevUnit }: {
  vol: number; billableVol: number; unit: ReturnType<typeof getUnit>; prevUnit: string | null;
}) {
  const fill = unit.fill;
  const upgraded = prevUnit !== null;
  const stages = [
    { min: 0,  max: 30,  label: 'Vacío',      bg: 'from-neon-green to-neon-cyan' },
    { min: 30, max: 60,  label: 'Medio',       bg: 'from-neon-cyan to-neon-blue' },
    { min: 60, max: 90,  label: 'Casi lleno',  bg: 'from-neon-blue to-neon-orange' },
    { min: 90, max: 101, label: '¡Completo!',  bg: 'from-neon-orange to-destructive' },
  ];
  const stage = stages.find(s => fill >= s.min && fill < s.max) || stages[3];

  return (
    <div className="relative rounded-2xl border border-neon-cyan/20 bg-gradient-to-b from-surface to-background overflow-hidden p-5">
      {/* Unit upgrade banner */}
      <AnimatePresence>
        {upgraded && (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-neon-orange/15 border border-neon-orange/40 text-xs font-bold text-neon-orange"
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            ¡Tu carga ahora requiere una unidad más grande! ({prevUnit} → {unit.label})
          </motion.div>
        )}
      </AnimatePresence>

      {/* Truck emoji */}
      <div className="flex items-center justify-center mb-3">
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, scale: 0.7, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-6xl filter drop-shadow-lg select-none"
        >
          {unit.emoji}
        </motion.div>
      </div>

      {/* Load bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground font-semibold">Ocupación</span>
          <span className="font-black text-foreground">{Math.round(fill)}%  ·  {stage.label}</span>
        </div>
        <div className="w-full h-5 bg-border/40 rounded-full overflow-hidden relative">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${stage.bg}`}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 flex items-center px-2 gap-1 overflow-hidden pointer-events-none">
            {Array.from({ length: Math.floor(fill / 10) }).map((_, i) => (
              <span key={i} className="text-[9px]">📦</span>
            ))}
          </div>
        </div>
      </div>

      {/* Unit chip */}
      <motion.div
        key={unit.label}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{unit.icon}</span>
          <div>
            <p className="font-display font-black text-sm text-neon-cyan">{unit.label}</p>
            <p className="text-[10px] text-muted-foreground">{unit.range}</p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Unidad sugerida</span>
      </motion.div>

      {/* Volume: real vs billable */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 rounded-xl bg-surface border border-border">
          <p className="text-[10px] text-muted-foreground">Volumen real</p>
          <motion.p key={vol.toFixed(1)} initial={{ scale: 1.2, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
            className="font-black text-xl text-foreground">{vol > 0 ? `${vol.toFixed(1)} m³` : '—'}</motion.p>
        </div>
        <div className={`text-center p-2 rounded-xl border ${billableVol > vol ? 'bg-neon-orange/5 border-neon-orange/30' : 'bg-neon-cyan/5 border-neon-cyan/20'}`}>
          <p className="text-[10px] text-muted-foreground">Volumen cobrable</p>
          <motion.p key={billableVol.toFixed(1)} initial={{ scale: 1.2, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
            className={`font-black text-xl ${billableVol > vol ? 'text-neon-orange' : 'text-neon-cyan'}`}>{`${billableVol.toFixed(1)} m³`}</motion.p>
        </div>
      </div>
      {billableVol > vol && (
        <p className="text-[10px] text-neon-orange mt-1.5 text-center font-semibold">
          ⚠️ Volumen mínimo de cotización: {MIN_VOL} m³
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function CotizadorSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const [step, setStep] = useState(1);
  const [ordenOpen, setOrdenOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [savedCotizacion, setSavedCotizacion] = useState<{
    folio: string; cotizacionId: string; precioTotal: number;
  } | null>(null);
  const [guardandoCot, setGuardandoCot] = useState(false);

  const { guardarCotizacion } = useCotizacion();

  // INE upload state
  const [ineFrente, setIneFrente] = useState<File | null>(null);
  const [ineReverso, setIneReverso] = useState<File | null>(null);

  // Step 1 – Ruta
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Step 2 – Detalles
  const [tipoServicio, setTipoServicio] = useState<string>('');
  const [pisos, setPisos] = useState<string>('');
  const [elevador, setElevador] = useState<string>('');
  const [acarreo, setAcarreo] = useState<string>('');
  const [modalidad, setModalidad] = useState<string>('compartido');

  // Step 3 – Inventory
  const [inventory, setInventory] = useState<Record<string, number>>({
    cama_king: 0, cama_matrimonial: 0, cama_individual: 0,
    sofa_3_plazas: 0, sofa_2_plazas: 0, sofa_individual: 0, sofa_cama: 0,
    comedor_6: 0, comedor_4: 0, mesa_centro: 0,
    ropero_3p: 0, ropero_2p: 0, cajones_3: 0, buros: 0, tocador: 0, librero: 0,
    refrigerador_duplex: 0, refrigerador_14: 0, estufa: 0,
    lavadora: 0, secadora: 0,
    tv_55: 0, tv_65: 0, tv_75: 0,
    escritorio: 0, silla_oficina: 0, archivero: 0, computadora: 0,
    bicicleta: 0, caja_estandar: 0,
  });

  // Step 5 – Insurance
  const [seguro, setSeguro] = useState(false);
  const [montoSeguro, setMontoSeguro] = useState(50000);

  // Volume — real + billable (minimum 5 m³)
  const vol = Object.entries(inventory).reduce((acc, [k, v]) => acc + (VOLUMES[k] || 0) * v, 0);
  const billableVol = Math.max(MIN_VOL, vol);
  const unit = getUnit(billableVol);
  const prevUnit = unit.prev;
  const insuranceRate = getInsuranceRate(montoSeguro);
  const insuranceCost = montoSeguro * insuranceRate;
  const estimatedTime = getEstimatedTime(billableVol);

  const inventoryRooms = [
    { section: '🛏️ Recámara', keys: ['cama_king', 'cama_matrimonial', 'cama_individual', 'ropero_3p', 'ropero_2p', 'cajones_3', 'buros', 'tocador'] },
    { section: '🛋️ Sala', keys: ['sofa_3_plazas', 'sofa_2_plazas', 'sofa_individual', 'sofa_cama', 'mesa_centro', 'librero'] },
    { section: '🍽️ Comedor', keys: ['comedor_6', 'comedor_4'] },
    { section: '🍳 Cocina', keys: ['refrigerador_duplex', 'refrigerador_14', 'estufa'] },
    { section: '🧺 Lavado', keys: ['lavadora', 'secadora'] },
    { section: '📺 Electrónicos', keys: ['tv_55', 'tv_65', 'tv_75', 'computadora'] },
    { section: '🗂️ Oficina/otros', keys: ['escritorio', 'silla_oficina', 'archivero', 'bicicleta'] },
    { section: '📦 Cajas', keys: ['caja_estandar'] },
  ];

  const inventoryLabels: Record<string, string> = {
    cama_king: 'Cama king', cama_matrimonial: 'Cama matrimonial', cama_individual: 'Cama individual',
    sofa_3_plazas: 'Sofá 3 plazas', sofa_2_plazas: 'Sofá 2 plazas', sofa_individual: 'Sillón individual', sofa_cama: 'Sofá-cama',
    comedor_6: 'Comedor 6 personas', comedor_4: 'Comedor 4 personas', mesa_centro: 'Mesa de centro',
    ropero_3p: 'Ropero 3 puertas', ropero_2p: 'Ropero 2 puertas', cajones_3: 'Cajonera', buros: 'Buró(s)', tocador: 'Tocador', librero: 'Librero',
    refrigerador_duplex: 'Refrigerador dúplex', refrigerador_14: 'Refrigerador normal', estufa: 'Estufa',
    lavadora: 'Lavadora', secadora: 'Secadora',
    tv_55: 'TV 55"', tv_65: 'TV 65"', tv_75: 'TV 75"+',
    escritorio: 'Escritorio', silla_oficina: 'Silla oficina', archivero: 'Archivero', computadora: 'Computadora/laptop',
    bicicleta: 'Bicicleta',
    caja_estandar: 'Caja estándar (7 = 1 m³)',
  };

  const filledItems = Object.entries(inventory).filter(([, v]) => v > 0);

  function buildWAMessage(folio?: string) {
    const serviceLabel = tipoServicio || 'Mudanza';
    const items = filledItems.map(([k, v]) => `• ${inventoryLabels[k]}: ${v}`).join('\n');
    const insuranceText = seguro ? `\n🛡️ *Seguro:* ${formatMXN(montoSeguro)} asegurado · ${formatMXN(insuranceCost)}` : '';
    const folioText = folio ? `\n📋 *Folio:* ${folio}` : '';
    return encodeURIComponent(
      `¡Hola! Quiero apartar mi servicio con *La Unión Mudanzas* 🚛${folioText}\n\n` +
      `👤 *Cliente:* ${nombre}\n📱 *WhatsApp:* ${whatsapp}\n` +
      `📍 *Origen:* ${origen}\n🎯 *Destino:* ${destino}\n📅 *Fecha:* ${fecha || 'Por confirmar'}\n\n` +
      `🏠 *Tipo:* ${serviceLabel}\n🚛 *Modalidad:* ${modalidad}\n` +
      `📐 *Volumen real:* ${vol.toFixed(1)} m³\n📐 *Volumen cobrable:* ${billableVol.toFixed(1)} m³\n🚚 *Unidad:* ${unit.icon} ${unit.label}${insuranceText}\n\n` +
      `📋 *Inventario:*\n${items || '(por definir)'}\n\n` +
      `#LaUnionMudanzas ❤️`
    );
  }

  // Save cotizacion to Supabase and open order modal
  async function handleApartarServicio() {
    setGuardandoCot(true);
    const costoPisos = pisos === '2+' && elevador === 'no' ? 500 : 0;
    const costoAcarreo = acarreo === 'largo' ? 800 : 0;
    const result = await guardarCotizacion({
      nombre, whatsapp, origen, destino, fecha,
      tipoServicio, modalidad,
      volumenTotal: vol,
      volumenCobrable: billableVol,
      unidadSugerida: unit.label,
      seguro, montoSeguro,
      costoPisos, costoAcarreo,
      urgente: false,
    });
    setGuardandoCot(false);
    if (result) {
      setSavedCotizacion({ folio: result.folio, cotizacionId: result.cotizacionId, precioTotal: result.precioTotal });
    }
    setOrdenOpen(true);
  }

  const navBtn = (label: string, onClick: () => void, variant: 'primary' | 'ghost' = 'ghost') => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
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

  // Smart alert conditions
  const hasHighVolume = billableVol > 60;
  const hasMultipleFloors = pisos === '2+';
  const noElevator = elevador === 'no' && pisos !== 'pb';
  const canProceedStep1 = nombre.trim() && whatsapp.trim() && origen.trim() && destino.trim() && fecha.trim();

  return (
    <section id="cotizador" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 via-background to-surface/20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-neon-cyan/4 blur-[140px]" />

      <div className="relative container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange text-xs font-bold tracking-widest uppercase mb-4">
            <Zap className="w-3.5 h-3.5" />
            Cotizador Express
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-3">
            Calcula tu mudanza{' '}
            <span className="text-neon-cyan" style={{ textShadow: '0 0 24px hsl(180 100% 50% / 0.5)' }}>
              en minutos
            </span>{' '}
            🚛
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Sin sorpresas, todo claro desde el inicio · <span className="text-neon-cyan font-semibold">#LaUnionMudanzas</span>
          </p>
        </motion.div>

        {/* Wizard card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-card rounded-3xl border border-neon-cyan/20 overflow-hidden shadow-[0_0_60px_hsl(180_100%_50%/0.06)]"
        >
          <div className="h-1.5 bg-gradient-to-r from-neon-cyan/40 via-neon-blue/40 to-neon-cyan/40" />

          <div className="p-6 md:p-8">
            {!confirmed && <ProgressBar step={step} />}

            <AnimatePresence mode="wait">

              {/* ── STEP 1: RUTA ─────────────────────────────────────── */}
              {step === 1 && !confirmed && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-foreground">¿De dónde a dónde?</h3>
                      <p className="text-muted-foreground text-xs">Tu ruta y datos de contacto</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombre completo</label>
                        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">WhatsApp</label>
                        <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="442 127 0514" type="tel" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                    </div>

                    {/* Route visual */}
                    <div className="relative">
                      <div className="absolute left-5 top-[44px] bottom-[44px] w-0.5 bg-gradient-to-b from-neon-cyan via-neon-blue/50 to-neon-green z-10" />
                      <div className="space-y-2">
                        <div className="relative pl-10">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-cyan border-2 border-background z-20" />
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Origen 📍</label>
                          <input value={origen} onChange={e => setOrigen(e.target.value)} placeholder="Ciudad de origen (ej: Querétaro, CDMX...)" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                        </div>
                        <div className="relative pl-10">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-green border-2 border-background z-20" />
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Destino 🎯</label>
                          <input value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ciudad destino (ej: Monterrey, Guadalajara...)" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5"><Calendar className="w-3 h-3 inline mr-1" />Fecha estimada del servicio</label>
                      <input value={fecha} onChange={e => setFecha(e.target.value)} type="date" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                    </div>
                  </div>

                  {/* Trust pill */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/5 border border-neon-green/20 mb-5 text-xs text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
                    Salidas todas las semanas · Servicios compartidos · Más de 28 rutas activas
                  </div>

                  {!canProceedStep1 && (nombre || whatsapp || origen || destino || fecha) && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 mb-3 text-xs text-foreground">
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <span>Completa todos los campos: <strong>nombre, WhatsApp, origen, destino y fecha</strong> para continuar.</span>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-black text-base disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_24px_hsl(var(--neon-cyan)/0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                  >
                    Continuar a Detalles <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: DETALLES ──────────────────────────────────── */}
              {step === 2 && !confirmed && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                      <Home className="w-5 h-5 text-neon-blue" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-foreground">Detalles del servicio</h3>
                      <p className="text-muted-foreground text-xs">Cuéntanos cómo es tu mudanza</p>
                    </div>
                  </div>

                  <div className="space-y-5 mb-6">
                    {/* Tipo */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">¿Qué tipo de inmueble?</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'casa', label: 'Casa', icon: '🏠' },
                          { id: 'departamento', label: 'Depto.', icon: '🏢' },
                          { id: 'oficina', label: 'Oficina', icon: '🖥️' },
                          { id: 'bodega', label: 'Bodega', icon: '🏭' },
                        ].map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.icon} selected={tipoServicio === o.id} onClick={() => setTipoServicio(o.id)} />
                        ))}
                      </div>
                    </div>

                    {/* Pisos */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Piso de origen</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'pb', label: 'Planta baja', icon: '🔽' },
                          { id: '1', label: 'Piso 1', icon: '1️⃣' },
                          { id: '2+', label: 'Piso 2+', icon: '🔼' },
                        ].map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.icon} selected={pisos === o.id} onClick={() => setPisos(o.id)} />
                        ))}
                      </div>
                    </div>

                    {/* Elevador */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">¿Hay elevador?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ id: 'si', label: 'Sí', icon: '🛗' }, { id: 'no', label: 'No', icon: '🚶' }].map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.icon} selected={elevador === o.id} onClick={() => setElevador(o.id)} />
                        ))}
                      </div>
                    </div>

                    {/* Acarreo */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Acarreo (distancia al camión)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ id: 'corto', label: 'Corto (–10m)', icon: '🟢' }, { id: 'largo', label: 'Largo (+10m)', icon: '🟡' }].map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.icon} selected={acarreo === o.id} onClick={() => setAcarreo(o.id)} />
                        ))}
                      </div>
                    </div>

                    {/* Modalidad */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Modalidad del servicio</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'compartido', label: 'Compartido', icon: '🤝', desc: 'Más económico' },
                          { id: 'directo', label: 'Directo', icon: '⚡', desc: 'Rápido' },
                          { id: 'exclusivo', label: 'Exclusivo', icon: '⭐', desc: 'Tu unidad' },
                        ].map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.icon} desc={o.desc} selected={modalidad === o.id} onClick={() => setModalidad(o.id)} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Smart alerts */}
                  {noElevator && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 mb-4 text-xs text-foreground">
                      <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                      <span>Sin elevador en piso superior puede generar <strong>costo adicional por maniobras de escalera</strong>.</span>
                    </div>
                  )}
                  {acarreo === 'largo' && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 mb-4 text-xs text-foreground">
                      <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                      <span>Acarreo largo puede generar <strong>cargo adicional por distancia</strong>. Se informará al confirmar.</span>
                    </div>
                  )}

                  <div className="flex gap-3">{navBtn('Atrás', () => setStep(1))}{navBtn('Continuar', () => setStep(3), 'primary')}</div>
                </motion.div>
              )}

              {/* ── STEP 3: INVENTARIO ────────────────────────────────── */}
              {step === 3 && !confirmed && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center">
                        <Package className="w-5 h-5 text-neon-orange" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-xl text-foreground">Inventario de muebles</h3>
                        <p className="text-muted-foreground text-xs">Agrega tus artículos, calculamos el volumen</p>
                      </div>
                    </div>
                    {/* Live volume badge */}
                    <motion.div
                      key={vol.toFixed(0)}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30"
                    >
                      <span className="font-black text-neon-cyan text-lg leading-tight">{vol.toFixed(1)}</span>
                      <span className="text-[9px] text-muted-foreground">m³</span>
                    </motion.div>
                  </div>

                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 pb-2 scrollbar-thin">
                    {inventoryRooms.map(room => (
                      <div key={room.section} className="glass-card rounded-xl border border-border/50 p-4">
                        <h4 className="font-display font-bold text-sm text-foreground mb-2">{room.section}</h4>
                        {room.keys.map(k => (
                          <CounterRow
                            key={k}
                            label={inventoryLabels[k] || k}
                            value={inventory[k] || 0}
                            onChange={v => setInventory({ ...inventory, [k]: v })}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-surface border border-neon-cyan/20 text-xs text-muted-foreground">
                    💡 <strong className="text-foreground">7 cajas estándar = 1 m³</strong> · Volumen mínimo cobrable: <strong className="text-neon-orange">{MIN_VOL} m³</strong>
                  </div>

                  {vol === 0 && (
                    <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 text-xs text-foreground">
                      <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                      Agrega al menos un artículo para calcular tu volumen antes de continuar.
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    {navBtn('Atrás', () => setStep(2))}
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-neon-cyan to-neon-blue text-background hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                    >
                      Ver mi carga <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: VISUALIZACIÓN ─────────────────────────────── */}
              {step === 4 && !confirmed && (
                <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-neon-green" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-foreground">Tu carga en movimiento</h3>
                      <p className="text-muted-foreground text-xs">Así se ve tu mudanza en nuestra unidad</p>
                    </div>
                  </div>

                  <TruckVisualizer vol={vol} billableVol={billableVol} unit={unit} prevUnit={prevUnit} />

                  {/* Smart alerts */}
                  {hasHighVolume && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 mt-4 p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 text-xs text-foreground">
                      <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                      <span>⚠️ Con este volumen la unidad grande puede <strong>no ingresar a zonas residenciales estrechas</strong>. Confirma accesos.</span>
                    </motion.div>
                  )}
                  {vol === 0 && (
                    <div className="flex items-start gap-3 mt-4 p-3 rounded-xl bg-neon-blue/10 border border-neon-blue/30 text-xs text-foreground">
                      <Package className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
                      <span>Agrega artículos en el paso anterior para ver tu carga estimada.</span>
                    </div>
                  )}

                  {/* Time estimate */}
                  <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                    <Clock className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tiempo estimado de servicio</p>
                      <p className="font-display font-black text-foreground">{estimatedTime}</p>
                      <p className="text-[10px] text-muted-foreground">Puede variar según accesos y pisos</p>
                    </div>
                  </div>

                  {vol > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 flex items-center gap-2 text-xs text-neon-cyan font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Tu carga ya requiere: <strong>{unit.label}</strong> ({unit.range})
                    </motion.div>
                  )}

                  <div className="flex gap-3 mt-5">{navBtn('Atrás', () => setStep(3))}{navBtn('Ver precio', () => setStep(5), 'primary')}</div>
                </motion.div>
              )}

              {/* ── STEP 5: PRECIO ────────────────────────────────────── */}
              {step === 5 && !confirmed && (
                <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                      <Star className="w-5 h-5 text-neon-blue" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-foreground">Resultado inteligente</h3>
                      <p className="text-muted-foreground text-xs">Tu mudanza documentada y lista</p>
                    </div>
                  </div>

                  {/* Result cards — 4 grid with billable vol prominently */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                      <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">📦 Volumen real</p>
                      <p className="font-display font-black text-xl text-neon-cyan">{vol > 0 ? `${vol.toFixed(1)} m³` : '—'}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${billableVol > vol ? 'bg-neon-orange/5 border-neon-orange/30' : 'bg-neon-cyan/5 border-neon-cyan/20'}`}>
                      <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">📐 Volumen cobrable</p>
                      <p className={`font-display font-black text-xl ${billableVol > vol ? 'text-neon-orange' : 'text-neon-cyan'}`}>{billableVol.toFixed(1)} m³</p>
                      {billableVol > vol && <p className="text-[10px] text-neon-orange">Mínimo: {MIN_VOL} m³</p>}
                    </div>
                    <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
                      <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">🚛 Unidad</p>
                      <p className="font-display font-black text-base text-neon-green leading-tight">{unit.label}</p>
                      <p className="text-[10px] text-muted-foreground">{unit.range}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-neon-orange/5 border border-neon-orange/20">
                      <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wider">⚙️ Modalidad</p>
                      <p className="font-display font-black text-base text-neon-orange capitalize leading-tight">{modalidad}</p>
                      {modalidad === 'compartido' && <p className="text-[10px] text-neon-green">✔ Recomendado</p>}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 mb-4">
                    <Clock className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground">⏱️ Tiempo estimado: </span>
                      <span className="font-bold text-foreground text-xs">{estimatedTime}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-auto">puede variar</span>
                  </div>

                  {/* Precio base */}
                  <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20 mb-3">
                    <p className="text-xs font-bold text-neon-green mb-2">🟢 Precio base</p>
                    <p className="font-display font-black text-2xl text-foreground mb-1">A cotizar</p>
                    <p className="text-xs text-muted-foreground">Confirmamos precio exacto por WhatsApp · <strong className="text-foreground">Sin compromiso</strong></p>
                    <p className="text-[11px] text-neon-orange mt-1.5 font-semibold">⚠️ El precio puede ajustarse si el volumen real es mayor</p>
                  </div>

                  {/* Posibles adicionales */}
                  <div className="p-4 rounded-xl bg-neon-orange/5 border border-neon-orange/20 mb-3">
                    <p className="text-xs font-bold text-neon-orange mb-2">🟡 Posibles cargos adicionales</p>
                    <ul className="space-y-1">
                      {[
                        hasMultipleFloors && 'Pisos adicionales no informados',
                        noElevator && 'Maniobras de escalera sin elevador',
                        acarreo === 'largo' && 'Acarreo de larga distancia',
                        hasHighVolume && 'Volumen extra al cotizado',
                      ].filter(Boolean).map(item => (
                        <li key={String(item)} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-neon-orange flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                      <li className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-1 h-1 rounded-full bg-neon-orange flex-shrink-0" />Embalaje especializado no cotizado</li>
                    </ul>
                  </div>

                  {/* Advertencias rojas */}
                  <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 mb-4">
                    <p className="text-xs font-bold text-destructive mb-1.5">🔴 Advertencias importantes</p>
                    <ul className="space-y-1">
                      {[
                        'No se descarga sin liquidación del servicio',
                        'Accesos complicados generan cargos adicionales',
                        hasHighVolume && 'La unidad puede no ingresar al domicilio — confirma acceso',
                      ].filter(Boolean).map(item => (
                        <li key={String(item)} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Seguro slider */}
                  <div className="p-4 rounded-xl bg-surface border border-border mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-neon-cyan" />
                        <span className="font-bold text-sm text-foreground">Protege tu mudanza</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSeguro(!seguro)}
                        className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${seguro ? 'bg-neon-cyan border-neon-cyan' : 'bg-muted border-border'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-all duration-300 ${seguro ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {seguro && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>$50,000</span>
                          <span className="font-bold text-foreground">{formatMXN(montoSeguro)}</span>
                          <span>$1,000,000</span>
                        </div>
                        <input
                          type="range"
                          min={50000}
                          max={1000000}
                          step={50000}
                          value={montoSeguro}
                          onChange={e => setMontoSeguro(Number(e.target.value))}
                          className="w-full accent-[hsl(180_100%_50%)]"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">Tasa {(insuranceRate * 100).toFixed(1)}%</span>
                          <span className="font-black text-neon-green text-sm">{formatMXN(insuranceCost)}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Urgency strip */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/5 border border-neon-green/20 mb-5 text-xs">
                    <span className="text-lg">🚛</span>
                    <span className="text-muted-foreground">#LaUnionMudanzas ❤️ · Salimos todas las semanas · <strong className="text-neon-green">Espacios limitados en rutas compartidas</strong></span>
                  </div>

                   {/* CTAs */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleApartarServicio}
                      disabled={guardandoCot}
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-neon-orange text-background font-black text-lg hover:shadow-glow-orange hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-60"
                    >
                      {guardandoCot ? (
                        <><Loader2 className="w-5 h-5 animate-spin" />Generando orden…</>
                      ) : (
                        <>🎯 APARTAR MI SERVICIO + PAGAR</>
                      )}
                    </button>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWAMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-black text-base hover:shadow-[0_0_24px_hsl(var(--neon-cyan)/0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      QUIERO MI COTIZACIÓN
                    </a>
                    <a
                      href={`tel:${WHATSAPP_NUMBER}`}
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-border text-foreground font-bold text-sm hover:border-neon-cyan/50 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      HABLAR POR WHATSAPP
                    </a>
                  </div>

                  <button type="button" onClick={() => setStep(4)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-3">
                    ← Volver a visualización de carga
                  </button>
                </motion.div>
              )}

              {/* ── STEP 6: CONFIRMACIÓN + INE + ORDEN ────────────────── */}
              {step === 6 && !confirmed && (
                <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon-green/10 border-2 border-neon-green mb-4 shadow-[0_0_30px_hsl(142_100%_42%/0.3)]"
                    >
                      <span className="text-4xl">🎉</span>
                    </motion.div>
                    <h3 className="font-display font-black text-2xl text-foreground mb-1">¡Gracias por elegirnos!</h3>
                    <p className="text-muted-foreground text-sm">Un paso más · Completa tu expediente con <strong className="text-neon-cyan">#LaUnionMudanzas</strong></p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
                    {[
                      { label: 'Cliente', value: nombre },
                      { label: 'Ruta', value: `${origen} → ${destino}` },
                      { label: 'Fecha', value: fecha || 'Por confirmar' },
                      { label: 'Unidad', value: `${unit.icon} ${unit.label}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-xl bg-surface border border-border">
                        <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mb-0.5">{label}</p>
                        <p className="text-foreground font-bold truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* INE Upload */}
                  <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-neon-blue flex-shrink-0" />
                      <p className="font-bold text-neon-blue text-sm">Identificación oficial (INE)</p>
                      <span className="ml-auto text-[10px] text-muted-foreground font-semibold bg-neon-blue/10 px-2 py-0.5 rounded-full border border-neon-blue/20">Requerida</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                      🔒 Su identificación se usará únicamente para validar y documentar su servicio.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {/* INE Frente */}
                      <label className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${ineFrente ? 'border-neon-green/50 bg-neon-green/5' : 'border-border hover:border-neon-blue/50 hover:bg-surface'}`}>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setIneFrente(e.target.files?.[0] || null)} />
                        {ineFrente ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-neon-green" />
                            <span className="text-[10px] text-neon-green font-bold text-center leading-tight">✓ Cargado</span>
                            <span className="text-[9px] text-muted-foreground text-center line-clamp-1">{ineFrente.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-semibold text-center">INE Frente</span>
                            <span className="text-[10px] text-muted-foreground">Imagen o PDF</span>
                          </>
                        )}
                      </label>
                      {/* INE Reverso */}
                      <label className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${ineReverso ? 'border-neon-green/50 bg-neon-green/5' : 'border-border hover:border-neon-blue/50 hover:bg-surface'}`}>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setIneReverso(e.target.files?.[0] || null)} />
                        {ineReverso ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-neon-green" />
                            <span className="text-[10px] text-neon-green font-bold text-center leading-tight">✓ Cargado</span>
                            <span className="text-[9px] text-muted-foreground text-center line-clamp-1">{ineReverso.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-semibold text-center">INE Reverso</span>
                            <span className="text-[10px] text-muted-foreground">Imagen o PDF</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Service order CTA */}
                  <button
                    type="button"
                    onClick={() => setOrdenOpen(true)}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-black text-base hover:shadow-[0_0_24px_hsl(var(--neon-cyan)/0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mb-3"
                  >
                    <FileText className="w-5 h-5" />
                    VER MI ORDEN DE SERVICIO
                  </button>

                  {/* Checklist */}
                  <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20 mb-4">
                    <p className="font-bold text-neon-green text-sm mb-3">✔ Prepárate para tu mudanza</p>
                    {[
                      'El personal llevará tu orden de servicio impresa',
                      'Revisa el inventario antes de la carga',
                      'Toma fotos de artículos de valor',
                      'Reporta cualquier anomalía antes de firmar',
                      '50% se liquida al momento de la carga',
                    ].map(item => (
                      <div key={item} className="flex items-start gap-2 mb-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neon-green flex-shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Extras warning */}
                  <div className="p-3 rounded-xl bg-neon-orange/5 border border-neon-orange/20 mb-5 text-xs text-muted-foreground">
                    <p className="font-bold text-neon-orange mb-1">⚠️ Costos extras pueden generarse por:</p>
                    <p>Acarreos · Pisos adicionales · Volumen extra · Se solicitará firma digital</p>
                  </div>

                  {/* WhatsApp CTA */}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWAMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-neon-green text-background font-black text-base hover:shadow-[0_0_24px_hsl(142_100%_42%/0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mb-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    IR A MI SEGUIMIENTO POR WHATSAPP
                  </a>
                  <button type="button" onClick={() => { setStep(1); setConfirmed(false); setIneFrente(null); setIneReverso(null); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Nueva cotización
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          {[
            '🚛 Más de 28 rutas activas',
            '📋 Toda mudanza con orden de servicio',
            '🔒 Tu mercancía viaja documentada',
            '⭐ Sin sorpresas, todo claro',
          ].map(item => (
            <span key={item} className="flex items-center gap-1">{item}</span>
          ))}
        </motion.div>
      </div>

      {/* Orden de Servicio Modal */}
      <OrdenServicioModal
        isOpen={ordenOpen}
        onClose={() => setOrdenOpen(false)}
        onPagar={() => { setOrdenOpen(false); setPagoOpen(true); }}
        data={{
          nombre, whatsapp, origen, destino, fecha,
          serviceLabel: tipoServicio ? `Mudanza ${tipoServicio.charAt(0).toUpperCase() + tipoServicio.slice(1)}` : 'Mudanza',
          vol: vol.toFixed(1),
          unitLabel: unit.label,
          unitIcon: unit.icon,
          folio: savedCotizacion?.folio,
          precioTotal: savedCotizacion?.precioTotal,
          cotizacionId: savedCotizacion?.cotizacionId,
        }}
      />

      {/* Pago Modal */}
      {savedCotizacion && (
        <PagoModal
          isOpen={pagoOpen}
          onClose={() => setPagoOpen(false)}
          onPagoExitoso={() => { setPagoOpen(false); setStep(6); setConfirmed(true); }}
          data={{
            folio: savedCotizacion.folio,
            nombre,
            monto: savedCotizacion.precioTotal,
            origen,
            destino,
            serviceLabel: tipoServicio || 'Mudanza',
            cotizacionId: savedCotizacion.cotizacionId,
          }}
        />
      )}
    </section>
  );
}
