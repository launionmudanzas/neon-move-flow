/**
 * CotizadorSection — 5-step wizard for La Unión Mudanzas
 * Flow: Datos → Validación Ruta → Tipo Servicio → Cálculo → Resultado
 * Includes automatic detection of local CDMX services
 */
import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  MapPin, Zap, Package, Truck, Star, Phone,
  AlertTriangle, CheckCircle2, Loader2, Clock, Shield,
  ChevronRight, Upload, CreditCard, FileText,
  BadgeCheck, Navigation, ShieldAlert, HelpCircle, Route as RouteIcon, Info,
} from 'lucide-react';
import CityField, { CityBadge, STATUS_CFG } from '@/components/cotizador/CityField';
import { ProgressBar, OptionButton, CounterRow, TruckVisualizer, NavButton } from '@/components/cotizador/shared';
import {
  WHATSAPP_NUMBER, MIN_VOL, VOLUMES, INVENTORY_LABELS, INVENTORY_ROOMS,
  getUnit, formatMXN, getInsuranceRate, getAvailableModalidades,
  INITIAL_STATE, MARGEN_APP, COSTO_RECOLECCION, COSTO_ENTREGA,
  SERVICE_TYPES, COMPLEX_SERVICE_TYPES,
  type WizardState,
} from '@/components/cotizador/constants';
import { useCotizacion, calcularRuta, getDesvioSurcharge } from '@/hooks/use-cotizacion';
import { classifyCity, type CityClassification } from '@/lib/routing-data';
import { supabase } from '@/integrations/supabase/client';
import { sendServiceEmail } from '@/lib/email-service';
import OrdenServicioModal from '@/components/OrdenServicioModal';
import PagoModal from '@/components/PagoModal';
import ProveedorSelector from '@/components/ProveedorSelector';
import AsesorBanner from '@/components/AsesorBanner';
import CotizadorLocal from '@/components/CotizadorLocal';
import { isZonaLocal } from '@/lib/cotizador-local';
import type { TramoResult, RutaRow } from '@/hooks/use-cotizacion';

// ─── Calculation result type ─────────────────────────────────────
interface CalcResult {
  tipo: 'directa' | 'espejo' | 'tramos' | 'no_disponible';
  costoM3: number;
  tramos: { desde: string; hasta: string; costo: number }[];
  observaciones: string[];
  advertencias: string[];
  costoDesvio: number;
  precioBase: number;
  subtotal: number;
  conMargen: number;
  precioTotal: number;
  volumenCobrable: number;
  unit: ReturnType<typeof getUnit>;
  origenCls: CityClassification;
  destinoCls: CityClassification;
}

export default function CotizadorSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const [step, setStep] = useState(1);
  const [s, setS] = useState<WizardState>({ ...INITIAL_STATE });
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [localMode, setLocalMode] = useState(false);

  // Order/payment state
  const [ordenOpen, setOrdenOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [savedCotizacion, setSavedCotizacion] = useState<{
    folio: string; cotizacionId: string; precioTotal: number; precioBase?: number;
  } | null>(null);
  const [guardandoCot, setGuardandoCot] = useState(false);
  const [savedClienteId, setSavedClienteId] = useState<string | null>(null);
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null);
  const [selectedProveedorNombre, setSelectedProveedorNombre] = useState<string | null>(null);

  const { guardarCotizacion, crearEventoCalendario, cargarRutas } = useCotizacion();

  // Computed values
  const vol = s.volMode === 'manual'
    ? s.volManual
    : Object.entries(s.inventory).reduce((acc, [k, v]) => acc + (VOLUMES[k] || 0) * v, 0);
  const billableVol = Math.max(MIN_VOL, vol);
  const unit = getUnit(billableVol);

  const origenCls = useMemo(() => s.origen.trim().length >= 2 ? classifyCity(s.origen) : null, [s.origen]);
  const destinoCls = useMemo(() => s.destino.trim().length >= 2 ? classifyCity(s.destino) : null, [s.destino]);
  const hasExclusiveZone = origenCls?.status === 'exclusivo' || destinoCls?.status === 'exclusivo';
  const isLocalZone = useMemo(() => isZonaLocal(s.origen) && isZonaLocal(s.destino), [s.origen, s.destino]);

  const insuranceRate = getInsuranceRate(s.montoSeguro);
  const insuranceCost = s.montoSeguro * insuranceRate;

  const availableModalidades = useMemo(() => getAvailableModalidades(billableVol, hasExclusiveZone), [billableVol, hasExclusiveZone]);

  // Update helper
  const upd = (patch: Partial<WizardState>) => setS(prev => ({ ...prev, ...patch }));

  // ─── Step validation ───────────────────────────────────────────
  const canStep1 = Boolean(s.nombre.trim() && s.whatsapp.trim().length >= 10 && s.origen.trim() && s.destino.trim());
  const canStep2 = Boolean(origenCls && destinoCls && !hasExclusiveZone);
  // Allow step 2 even with exclusive if user picks exclusive modalidad

  // ─── Calculate route ───────────────────────────────────────────
  const runCalculation = useCallback(async () => {
    if (!origenCls || !destinoCls) return;
    setCalculating(true);
    try {
      const rutas = await cargarRutas();
      const autoDesvio = origenCls.status === 'desvio' || destinoCls.status === 'desvio';
      const ciudadDesvio = origenCls.status === 'desvio' ? s.origen : destinoCls.status === 'desvio' ? s.destino : '';

      const res = calcularRuta(rutas, s.origen, s.destino, billableVol, autoDesvio, ciudadDesvio);

      const precioBase = billableVol * res.costoM3;
      const costoPisos = s.pisos === '2+' && s.elevador === 'no' ? 500 : 0;
      const costoAcarreo = s.acarreo === 'largo' ? 800 : 0;
      const subtotal = precioBase + COSTO_RECOLECCION + COSTO_ENTREGA + res.costoDesvio + costoPisos + costoAcarreo;
      const conMargen = subtotal * (1 + MARGEN_APP);
      const seguroCosto = s.seguro ? s.montoSeguro * insuranceRate : 0;
      const precioTotal = Math.round(conMargen + seguroCosto);

      const advertencias = [...res.advertencias];
      if (autoDesvio) {
        const desvioCity = origenCls.status === 'desvio' ? s.origen : s.destino;
        advertencias.unshift(`📍 "${desvioCity}" es una ciudad con desvío. Se aplicó cargo automáticamente.`);
      }
      if (origenCls.status === 'extension' || destinoCls.status === 'extension') {
        advertencias.push('📌 Una o más ciudades son extensiones de ruta. Confirmar disponibilidad.');
      }

      setCalcResult({
        ...res,
        advertencias,
        costoDesvio: res.costoDesvio,
        precioBase,
        subtotal,
        conMargen,
        precioTotal,
        volumenCobrable: billableVol,
        unit,
        origenCls,
        destinoCls,
      });
    } catch {
      // silent
    } finally {
      setCalculating(false);
    }
  }, [origenCls, destinoCls, s, billableVol, unit, cargarRutas, insuranceRate]);

  // Auto-calculate when entering step 4
  const goToStep4 = useCallback(async () => {
    setStep(4);
    await runCalculation();
  }, [runCalculation]);

  // ─── Save & order ──────────────────────────────────────────────
  async function handleApartarServicio() {
    setGuardandoCot(true);
    const costoPisos = s.pisos === '2+' && s.elevador === 'no' ? 500 : 0;
    const costoAcarreo = s.acarreo === 'largo' ? 800 : 0;
    const result = await guardarCotizacion({
      nombre: s.nombre, whatsapp: s.whatsapp, correo: s.correo,
      origen: s.origen, destino: s.destino, fecha: s.fecha,
      tipoServicio: s.tipoServicio, modalidad: s.modalidad,
      volumenTotal: vol, volumenCobrable: billableVol,
      unidadSugerida: unit.label,
      seguro: s.seguro, montoSeguro: s.montoSeguro,
      costoPisos, costoAcarreo, urgente: false,
      horarioCarga: s.horarioCarga || undefined,
      horarioEntrega: s.horarioEntrega || undefined,
      peso: s.peso ? Number(s.peso) : undefined,
      presupuestoCliente: s.presupuestoCliente ? Number(s.presupuestoCliente) : undefined,
      comentariosEspeciales: s.comentariosEspeciales || undefined,
      visitaOcular: s.visitaOcular,
      cotizacionEspecial: COMPLEX_SERVICE_TYPES.includes(s.tipoServicio),
    });
    setGuardandoCot(false);
    if (result) {
      setSavedCotizacion({ folio: result.folio, cotizacionId: result.cotizacionId, precioTotal: result.precioTotal, precioBase: result.precioBase });
      setSavedClienteId(result.clienteId);

      // Save selected provider to cotización
      if (selectedProveedorId) {
        void supabase.from('cotizaciones').update({ proveedor_id: selectedProveedorId }).eq('id', result.cotizacionId);
      }

      void crearEventoCalendario({
        cotizacionId: result.cotizacionId, clienteId: result.clienteId,
        fechaSalida: s.fecha, origen: s.origen, destino: s.destino, folio: result.folio,
      });
      void sendServiceEmail({
        type: 'cotizacion', folio: result.folio, customer_name: s.nombre,
        to: s.correo || undefined, route: `${s.origen} → ${s.destino}`,
        service_date: s.fecha, service_type: s.tipoServicio ? `Mudanza ${s.tipoServicio}` : 'Mudanza',
        volume: billableVol.toFixed(1), unit: unit.label, amount: result.precioTotal,
      });
    }
    setOrdenOpen(true);
  }

  // ─── WhatsApp message ──────────────────────────────────────────
  function buildWALink(folio?: string) {
    const r = calcResult;
    const rutaDetectada = r ? (r.tipo === 'directa' ? 'Ruta directa' : r.tipo === 'tramos' ? `Vía tramos: ${r.tramos.map(t => t.desde).join(' → ')} → ${r.tramos[r.tramos.length - 1]?.hasta}` : 'Estimado') : 'Por calcular';
    const obs = r?.observaciones.join(' · ') || '';
    const totalText = r ? formatMXN(r.precioTotal) : 'Por confirmar';

    const lines = [
      `Hola, quiero cotizar un servicio 🚛`,
      ``,
      `👤 *Nombre:* ${s.nombre}`,
      `📱 *WhatsApp:* ${s.whatsapp}`,
      `📍 *Origen:* ${s.origen}`,
      `🎯 *Destino:* ${s.destino}`,
      `📅 *Fecha:* ${s.fecha || 'Por confirmar'}`,
      `📦 *Volumen:* ${billableVol.toFixed(1)} m³`,
      `🚛 *Unidad:* ${unit.emoji} ${unit.label}`,
      `🏷️ *Servicio:* ${s.modalidad || 'Por definir'}`,
      `🗺️ *Ruta detectada:* ${rutaDetectada}`,
      `💰 *Total estimado:* ${totalText}`,
    ];
    if (obs) lines.push(`📋 *Observaciones:* ${obs}`);
    if (folio) lines.push(`📋 *Folio:* ${folio}`);
    lines.push(``, `_#LaUnionMudanzas · 4421270514_`);

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  // ─── Route status label ────────────────────────────────────────
  function getRouteStatusBlock(cls: CityClassification | null, label: string) {
    if (!cls) return null;
    const cfg = STATUS_CFG[cls.status];
    const messages: Record<string, string> = {
      en_ruta: 'Dentro de nuestra red operativa',
      desvio: 'Requiere desvío operativo. Cargo adicional aplicado.',
      extension: 'Extensión de ruta. Confirmar disponibilidad.',
      exclusivo: 'Zona restringida. Solo servicio exclusivo.',
      desconocida: 'Sin cobertura automática. Revisión manual.',
    };
    return (
      <div className={`p-4 rounded-xl border ${cfg.color}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{label}</p>
        <div className="flex items-center gap-2 mb-1">
          {cfg.icon}
          <span className="text-sm font-bold">{cfg.label}</span>
        </div>
        <p className="text-xs opacity-80">{messages[cls.status]}</p>
        {cls.routeNames.length > 0 && (
          <p className="text-[10px] mt-1 opacity-60">Rutas: {cls.routeNames.slice(0, 3).join(' · ')}</p>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <section id="cotizador" ref={ref} className="py-20 relative overflow-x-hidden">
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
            </span>
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Sin sorpresas, todo claro desde el inicio
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
            <ProgressBar step={step} />

            <AnimatePresence mode="wait">

              {/* ════════════ STEP 1: DATOS ════════════ */}
              {step === 1 && (
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
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombre completo *</label>
                        <input value={s.nombre} onChange={e => upd({ nombre: e.target.value })} placeholder="Tu nombre" maxLength={100}
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">WhatsApp *</label>
                        <input value={s.whatsapp} onChange={e => upd({ whatsapp: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="10 dígitos" type="tel"
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          Correo electrónico <span className="text-muted-foreground/60 font-normal normal-case">(para recibir tu orden)</span>
                        </label>
                        <input value={s.correo} onChange={e => upd({ correo: e.target.value })} placeholder="tu@correo.com" type="email"
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                    </div>

                    {/* Route inputs */}
                    <div className="relative">
                      <div className="absolute left-5 top-[54px] bottom-[54px] w-0.5 bg-gradient-to-b from-neon-cyan via-neon-blue/50 to-neon-green z-10 pointer-events-none" />
                      <div className="space-y-3">
                        <div className="relative pl-10">
                          <div className="absolute left-3.5 top-[34px] w-3 h-3 rounded-full bg-neon-cyan border-2 border-background z-20" />
                          <CityField label="Origen *" value={s.origen} onChange={v => upd({ origen: v })} placeholder="Ciudad de origen" billableVol={billableVol} />
                        </div>
                        <div className="relative pl-10">
                          <div className="absolute left-3.5 top-[34px] w-3 h-3 rounded-full bg-neon-green border-2 border-background z-20" />
                          <CityField label="Destino *" value={s.destino} onChange={v => upd({ destino: v })} placeholder="Ciudad destino" billableVol={billableVol} />
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Fecha estimada de servicio</label>
                      <input type="date" value={s.fecha} onChange={e => upd({ fecha: e.target.value })}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                    </div>

                    {/* Volume mode toggle */}
                    <div className="p-4 rounded-xl bg-surface border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">¿Cómo calculas tu volumen?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <OptionButton label="Inventario" icon="📦" desc="Artículo por artículo" selected={s.volMode === 'inventario'} onClick={() => upd({ volMode: 'inventario' })} />
                        <OptionButton label="Manual" icon="📐" desc="Ya conozco los m³" selected={s.volMode === 'manual'} onClick={() => upd({ volMode: 'manual' })} />
                      </div>

                      {s.volMode === 'manual' && (
                        <div className="mt-3">
                          <input type="number" min={1} max={200} value={s.volManual || ''} onChange={e => upd({ volManual: Number(e.target.value) })}
                            placeholder="Ej. 15 m³"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                        </div>
                      )}

                      {s.volMode === 'inventario' && (
                        <div className="mt-3 space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {INVENTORY_ROOMS.map(room => (
                            <div key={room.section} className="glass-card rounded-xl border border-border/50 p-3">
                              <h4 className="font-display font-bold text-sm text-foreground mb-1">{room.section}</h4>
                              {room.keys.map(k => (
                                <CounterRow key={k} label={INVENTORY_LABELS[k] || k} value={s.inventory[k] || 0}
                                  onChange={v => upd({ inventory: { ...s.inventory, [k]: v } })} />
                              ))}
                            </div>
                          ))}
                          <p className="text-[10px] text-muted-foreground text-center">
                            💡 7 cajas = 1 m³ · Mínimo cobrable: <strong className="text-neon-orange">{MIN_VOL} m³</strong>
                          </p>
                        </div>
                      )}

                      {/* Volume summary */}
                      {vol > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <TruckVisualizer vol={vol} billableVol={billableVol} unit={unit} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <NavButton label="Validar ruta" onClick={() => setStep(2)} variant="primary" disabled={!canStep1 || vol === 0} />
                  </div>
                  {!canStep1 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">Completa nombre, WhatsApp, origen y destino</p>
                  )}
                  {canStep1 && vol === 0 && (
                    <p className="text-xs text-neon-orange text-center mt-2">Agrega al menos un artículo o ingresa volumen manual</p>
                  )}
                </motion.div>
              )}

              {/* ════════════ STEP 2: VALIDACIÓN DE RUTA ════════════ */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                      <RouteIcon className="w-5 h-5 text-neon-blue" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-foreground">Validación de ruta</h3>
                      <p className="text-muted-foreground text-xs">Revisamos tu trayecto en nuestra red</p>
                    </div>
                  </div>

                  {/* Route summary */}
                  <div className="p-4 rounded-xl bg-surface border border-border mb-4">
                    <div className="flex items-center gap-2 text-sm text-foreground font-bold mb-1">
                      <MapPin className="w-4 h-4 text-neon-cyan" />
                      {s.origen}
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <MapPin className="w-4 h-4 text-neon-green" />
                      {s.destino}
                    </div>
                    <p className="text-xs text-muted-foreground">{billableVol.toFixed(1)} m³ · {unit.emoji} {unit.label}</p>
                  </div>

                  {/* Classification cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {getRouteStatusBlock(origenCls, 'Origen')}
                    {getRouteStatusBlock(destinoCls, 'Destino')}
                  </div>

                  {/* Overall route status */}
                  {origenCls && destinoCls && (
                    <div className="space-y-3 mb-4">
                      {/* Both in route */}
                      {origenCls.status === 'en_ruta' && destinoCls.status === 'en_ruta' && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-cyan/8 border border-neon-cyan/25">
                          <CheckCircle2 className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-neon-cyan">Tu servicio está dentro de nuestra red operativa</p>
                            <p className="text-xs text-muted-foreground">Todas las modalidades disponibles</p>
                          </div>
                        </div>
                      )}

                      {/* Has detour */}
                      {(origenCls.status === 'desvio' || destinoCls.status === 'desvio') && !hasExclusiveZone && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-orange/10 border border-neon-orange/30">
                          <Navigation className="w-5 h-5 text-neon-orange flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-neon-orange">Tu servicio requiere un desvío operativo</p>
                            <p className="text-xs text-muted-foreground">Se aplicará cargo adicional: <strong className="text-neon-orange">{formatMXN(getDesvioSurcharge(billableVol))}</strong></p>
                          </div>
                        </div>
                      )}

                      {/* Exclusive zone */}
                      {hasExclusiveZone && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                          <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-destructive">Zona restringida detectada</p>
                            <p className="text-xs text-muted-foreground">Solo disponible en servicio exclusivo. Compartido no aplica.</p>
                          </div>
                        </div>
                      )}

                      {/* Unknown */}
                      {(origenCls.status === 'desconocida' || destinoCls.status === 'desconocida') && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-border">
                          <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-foreground">Sin cobertura automática</p>
                            <p className="text-xs text-muted-foreground">No tenemos cobertura directa. Puedes solicitar revisión manual.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Local CDMX detection */}
                  {isLocalZone && !hasExclusiveZone && !(origenCls?.status === 'desconocida' || destinoCls?.status === 'desconocida') && (
                    <div className="p-4 rounded-xl bg-neon-green/8 border border-neon-green/25 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-neon-green flex-shrink-0" />
                        <p className="text-sm font-bold text-neon-green">¡Servicio local CDMX detectado!</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Ambas ubicaciones están en la zona metropolitana. Usa nuestro cotizador local con precios fijos por unidad, desglose de pisos y extras.
                      </p>
                      <button
                        onClick={() => setLocalMode(true)}
                        className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-neon-green text-background hover:shadow-glow-green transition-all"
                      >
                        🏙️ Cotizar servicio local CDMX
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <NavButton label="Atrás" onClick={() => setStep(1)} />
                    {(origenCls?.status === 'desconocida' || destinoCls?.status === 'desconocida') ? (
                      <a
                        href={buildWALink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-neon-green text-background hover:shadow-glow-green transition-all"
                      >
                        Solicitar revisión manual
                      </a>
                    ) : (
                      <NavButton label={isLocalZone ? 'Cotizar foráneo' : 'Elegir servicio'} onClick={() => {
                        if (hasExclusiveZone) upd({ modalidad: 'exclusivo' });
                        setLocalMode(false);
                        setStep(3);
                      }} variant="primary" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* ════════════ LOCAL CDMX MODE ════════════ */}
              {localMode && (
                <motion.div key="local" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <CotizadorLocal
                    volumenInicial={billableVol}
                    origen={s.origen}
                    destino={s.destino}
                    onBack={() => { setLocalMode(false); setStep(2); }}
                  />
                </motion.div>
              )}

              {/* ════════════ STEP 3: TIPO DE SERVICIO ════════════ */}
              {step === 3 && !localMode && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-neon-orange" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-foreground">Tipo de servicio</h3>
                      <p className="text-muted-foreground text-xs">Elige la modalidad ideal para tu mudanza</p>
                    </div>
                  </div>

                   <div className="space-y-4 mb-6">
                    {/* Tipo de servicio expandido */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tipo de servicio</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SERVICE_TYPES.map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.icon} selected={s.tipoServicio === o.id} onClick={() => upd({ tipoServicio: o.id })} />
                        ))}
                      </div>
                      {COMPLEX_SERVICE_TYPES.includes(s.tipoServicio) && (
                        <div className="mt-3">
                          <AsesorBanner reason="Servicio especial" nombre={s.nombre} origen={s.origen} destino={s.destino} volumen={billableVol} />
                        </div>
                      )}
                    </div>

                    {/* Modalidad */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Modalidad del servicio</p>
                      <div className={`grid grid-cols-${availableModalidades.length} gap-2`}>
                        {availableModalidades.map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.emoji} desc={o.desc} selected={s.modalidad === o.id} onClick={() => upd({ modalidad: o.id })} />
                        ))}
                      </div>
                      {hasExclusiveZone && (
                        <p className="text-xs text-destructive mt-2 font-medium">⛔ Zona restringida: solo servicio exclusivo</p>
                      )}
                      {billableVol > 40 && billableVol <= 60 && !hasExclusiveZone && (
                        <p className="text-xs text-neon-orange mt-2 font-medium">⚠️ Volumen alto: solo directo o exclusivo</p>
                      )}
                      {billableVol > 60 && !hasExclusiveZone && (
                        <p className="text-xs text-neon-orange mt-2 font-medium">⚠️ Volumen &gt; 60 m³: solo exclusivo</p>
                      )}
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
                          <OptionButton key={o.id} label={o.label} icon={o.icon} selected={s.pisos === o.id} onClick={() => upd({ pisos: o.id })} />
                        ))}
                      </div>
                    </div>

                    {/* Elevador */}
                    {s.pisos === '2+' && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">¿Hay elevador?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[{ id: 'si', label: 'Sí', icon: '🛗' }, { id: 'no', label: 'No', icon: '🚶' }].map(o => (
                            <OptionButton key={o.id} label={o.label} icon={o.icon} selected={s.elevador === o.id} onClick={() => upd({ elevador: o.id })} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acarreo */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Distancia al camión</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ id: 'corto', label: 'Corto (–10m)', icon: '🟢' }, { id: 'largo', label: 'Largo (+10m)', icon: '🟡' }].map(o => (
                          <OptionButton key={o.id} label={o.label} icon={o.icon} selected={s.acarreo === o.id} onClick={() => upd({ acarreo: o.id })} />
                        ))}
                      </div>
                    </div>

                    {/* Seguro */}
                    <div className="p-4 rounded-xl bg-surface border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-neon-cyan" />
                          <span className="font-bold text-sm text-foreground">Protege tu mudanza</span>
                        </div>
                        <button type="button" onClick={() => upd({ seguro: !s.seguro })}
                          className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${s.seguro ? 'bg-neon-cyan border-neon-cyan' : 'bg-muted border-border'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-all duration-300 ${s.seguro ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {s.seguro && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>$50,000</span>
                            <span className="font-bold text-foreground">{formatMXN(s.montoSeguro)}</span>
                            <span>$1,000,000</span>
                          </div>
                          <input type="range" min={50000} max={1000000} step={50000} value={s.montoSeguro} onChange={e => upd({ montoSeguro: Number(e.target.value) })}
                            className="w-full accent-[hsl(180_100%_50%)]" />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">Tasa {(insuranceRate * 100).toFixed(1)}%</span>
                            <span className="font-black text-neon-green text-sm">{formatMXN(insuranceCost)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* New fields: horarios, peso, presupuesto, comentarios */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Horario de carga</label>
                        <input type="time" value={s.horarioCarga} onChange={e => upd({ horarioCarga: e.target.value })}
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Horario de entrega</label>
                        <input type="time" value={s.horarioEntrega} onChange={e => upd({ horarioEntrega: e.target.value })}
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Peso estimado (kg)</label>
                        <input type="number" min={0} value={s.peso || ''} onChange={e => upd({ peso: e.target.value })} placeholder="Opcional"
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Tu presupuesto</label>
                        <input type="number" min={0} value={s.presupuestoCliente || ''} onChange={e => upd({ presupuestoCliente: e.target.value })} placeholder="Opcional ($)"
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Comentarios especiales <span className="text-muted-foreground/60 font-normal normal-case">(aduanas, ferry, grúas, accesos, permisos)</span>
                      </label>
                      <textarea value={s.comentariosEspeciales} onChange={e => upd({ comentariosEspeciales: e.target.value })} placeholder="Describe cualquier condición especial..."
                        rows={2} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all resize-none" />
                    </div>

                    {/* Visita ocular toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔍</span>
                        <span className="font-bold text-sm text-foreground">¿Requieres visita ocular?</span>
                      </div>
                      <button type="button" onClick={() => upd({ visitaOcular: !s.visitaOcular })}
                        className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${s.visitaOcular ? 'bg-neon-cyan border-neon-cyan' : 'bg-muted border-border'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-all duration-300 ${s.visitaOcular ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Alerts */}
                  {s.pisos === '2+' && s.elevador === 'no' && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 mb-4 text-xs text-foreground">
                      <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                      <span>Sin elevador genera <strong>costo adicional por escalera</strong>.</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <NavButton label="Atrás" onClick={() => setStep(2)} />
                    <NavButton label="Ver cálculo" onClick={goToStep4} variant="primary" />
                  </div>
                </motion.div>
              )}

              {/* ════════════ STEP 4: DETALLE DE CÁLCULO ════════════ */}
              {step === 4 && !localMode && (
                <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                      <Star className="w-5 h-5 text-neon-green" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-foreground">Detalle de cálculo</h3>
                      <p className="text-muted-foreground text-xs">Desglose transparente de tu cotización</p>
                    </div>
                  </div>

                  {calculating ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                      <p className="text-muted-foreground text-sm">Calculando tu ruta...</p>
                    </div>
                  ) : calcResult ? (
                    <div className="space-y-4">
                      {/* Route info card */}
                      <div className="p-4 rounded-xl bg-surface border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-neon-cyan" />
                          <span className="font-bold text-sm text-foreground">{s.origen}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <MapPin className="w-4 h-4 text-neon-green" />
                          <span className="font-bold text-sm text-foreground">{s.destino}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            calcResult.tipo === 'directa' ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30' :
                            calcResult.tipo === 'tramos' ? 'bg-neon-orange/15 text-neon-orange border-neon-orange/30' :
                            'bg-destructive/15 text-destructive border-destructive/30'
                          }`}>
                            <RouteIcon className="w-3 h-3" />
                            {calcResult.tipo === 'directa' ? 'Ruta directa' : calcResult.tipo === 'tramos' ? 'Vía tramos' : 'Estimado'}
                          </span>
                          {origenCls && <CityBadge cls={origenCls} />}
                          {destinoCls && <CityBadge cls={destinoCls} />}
                        </div>
                      </div>

                      {/* Tramos */}
                      {calcResult.tramos.length > 0 && (
                        <div className="p-4 rounded-xl bg-surface border border-border">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Trayecto</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {calcResult.tramos.map((t, i) => (
                              <div key={i} className="flex items-center gap-2">
                                {i === 0 && (
                                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
                                    <MapPin className="w-2.5 h-2.5 inline mr-1" />{t.desde}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                  {formatMXN(t.costo)}/m³
                                </span>
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                  i === calcResult.tramos.length - 1
                                    ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                                    : 'bg-muted border border-border text-muted-foreground'
                                }`}>
                                  <MapPin className="w-2.5 h-2.5 inline mr-1" />{t.hasta}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price breakdown */}
                      <div className="p-4 rounded-xl bg-surface border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Desglose</p>
                        <div className="space-y-2">
                          <PriceRow label="Tarifa de ruta" value={`${formatMXN(calcResult.costoM3)}/m³`} accent />
                          <PriceRow label={`Volumen cobrable (${calcResult.volumenCobrable} m³)`} value={formatMXN(calcResult.precioBase)} />
                          <PriceRow label="Recolección + entrega" value={formatMXN(COSTO_RECOLECCION + COSTO_ENTREGA)} />
                          {calcResult.costoDesvio > 0 && <PriceRow label="Cargo por desvío" value={formatMXN(calcResult.costoDesvio)} warn />}
                          {s.pisos === '2+' && s.elevador === 'no' && <PriceRow label="Maniobras escalera" value={formatMXN(500)} warn />}
                          {s.acarreo === 'largo' && <PriceRow label="Acarreo largo" value={formatMXN(800)} warn />}
                          <div className="border-t border-border pt-2 mt-1">
                            <PriceRow label={`Margen operativo (${MARGEN_APP * 100}%)`} value={formatMXN(calcResult.conMargen - calcResult.subtotal)} />
                          </div>
                          {s.seguro && <PriceRow label={`Seguro (${(insuranceRate * 100).toFixed(1)}% de ${formatMXN(s.montoSeguro)})`} value={formatMXN(insuranceCost)} />}
                          <div className="border-t-2 border-neon-cyan/30 pt-2">
                            <PriceRow label="TOTAL ESTIMADO" value={formatMXN(calcResult.precioTotal)} total />
                          </div>
                        </div>
                      </div>

                      {/* Warnings */}
                      {calcResult.advertencias.length > 0 && (
                        <div className="space-y-2">
                          {calcResult.advertencias.map((a, i) => (
                            <div key={i} className="flex gap-2 p-3 rounded-xl bg-neon-orange/8 border border-neon-orange/20">
                              <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-neon-orange font-medium">{a}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Observations */}
                      {calcResult.observaciones.length > 0 && (
                        <div className="space-y-2">
                          {calcResult.observaciones.map((o, i) => (
                            <div key={i} className="flex gap-2 p-3 rounded-xl bg-neon-blue/8 border border-neon-blue/20">
                              <Info className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-neon-blue font-medium">{o}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No se pudo calcular la ruta.</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <NavButton label="Atrás" onClick={() => setStep(3)} />
                    <NavButton label="Ver resultado" onClick={() => setStep(5)} variant="primary" disabled={!calcResult} />
                  </div>
                </motion.div>
              )}

              {/* ════════════ STEP 5: RESULTADO Y CIERRE ════════════ */}
              {step === 5 && !localMode && (
                <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan mb-3"
                    >
                      <CheckCircle2 className="w-8 h-8 text-neon-cyan" />
                    </motion.div>
                    <h3 className="font-display font-black text-2xl text-foreground mb-1">Tu cotización estimada está lista</h3>
                    <p className="text-muted-foreground text-sm">Cada mudanza es distinta. Si necesitas ajustar detalles, te atendemos por WhatsApp.</p>
                  </div>

                  {calcResult && (
                    <div className="space-y-4 mb-6">
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-surface border border-border">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">🗺️ Ruta</p>
                          <p className="font-bold text-sm text-foreground">{s.origen} → {s.destino}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface border border-border">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">🏷️ Servicio</p>
                          <p className="font-bold text-sm text-foreground capitalize">{s.modalidad}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface border border-border">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">📦 Volumen</p>
                          <p className="font-bold text-sm text-foreground">{calcResult.volumenCobrable} m³</p>
                        </div>
                        <div className="p-4 rounded-xl bg-surface border border-border">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">💰 Costo/m³</p>
                          <p className="font-bold text-sm text-neon-cyan">{formatMXN(calcResult.costoM3)}</p>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="p-6 rounded-xl bg-neon-cyan/5 border-2 border-neon-cyan/30 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total estimado</p>
                        <p className="font-display font-black text-4xl text-neon-cyan" style={{ textShadow: '0 0 20px hsl(180 100% 50% / 0.4)' }}>
                          {formatMXN(calcResult.precioTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {calcResult.unit.emoji} {calcResult.unit.label} · {calcResult.tipo === 'directa' ? 'Ruta directa' : 'Vía tramos'}
                        </p>
                      </div>

                      {/* Observations */}
                      {calcResult.observaciones.length > 0 && (
                        <div className="p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
                          <p className="text-xs font-bold text-neon-blue mb-1">📋 Observaciones</p>
                          {calcResult.observaciones.map((o, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {o}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Complex quote: advisor banner */}
                  {calcResult && (billableVol > 90 || (origenCls?.status === 'desconocida' || destinoCls?.status === 'desconocida')) && (
                    <div className="mb-4">
                      <AsesorBanner
                        reason={
                          billableVol > 90
                            ? `Volumen de ${billableVol} m³ requiere coordinación especial.`
                            : 'Una o más ciudades requieren revisión manual.'
                        }
                        nombre={s.nombre}
                        origen={s.origen}
                        destino={s.destino}
                        volumen={billableVol}
                      />
                    </div>
                  )}

                  {/* Intelligent provider funnel */}
                  {calcResult && billableVol <= 90 && origenCls?.status !== 'desconocida' && destinoCls?.status !== 'desconocida' && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">Selecciona tu proveedor</p>
                          <p className="text-[10px] text-muted-foreground">Opciones filtradas y verificadas para tu servicio</p>
                        </div>
                      </div>
                      <ProveedorSelector
                        origen={s.origen}
                        destino={s.destino}
                        fecha={s.fecha}
                        volumen={billableVol}
                        modalidad={s.modalidad}
                        tipoServicio={s.tipoServicio}
                        onSelect={(id, nombre) => {
                          setSelectedProveedorId(id);
                          setSelectedProveedorNombre(nombre);
                        }}
                        selectedId={selectedProveedorId}
                      />
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleApartarServicio}
                      disabled={guardandoCot || (billableVol <= 90 && !selectedProveedorId)}
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-neon-orange text-background font-black text-lg hover:shadow-glow-orange hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-60"
                    >
                      {guardandoCot ? (
                        <><Loader2 className="w-5 h-5 animate-spin" />Generando orden…</>
                      ) : (
                        <>🎯 APARTAR MI SERVICIO</>
                      )}
                    </button>

                    <a
                      href={buildWALink(savedCotizacion?.folio)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-neon-green text-background font-black text-base hover:shadow-glow-green hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      Cotizar por WhatsApp
                    </a>

                    <a
                      href={`tel:${WHATSAPP_NUMBER}`}
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-border text-foreground font-bold text-sm hover:border-neon-cyan/50 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      Solicitar llamada
                    </a>

                    <button type="button" onClick={() => setStep(1)}
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
                      ← Ajustar datos
                    </button>
                  </div>
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
          {['🚛 +28 rutas activas', '📋 Toda mudanza documentada', '🔒 Mercancía asegurada', '⭐ Sin sorpresas'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </motion.div>
      </div>

      {/* Modals */}
      <OrdenServicioModal
        isOpen={ordenOpen}
        onClose={() => setOrdenOpen(false)}
        onPagar={() => { setOrdenOpen(false); setPagoOpen(true); }}
        data={{
          nombre: s.nombre, whatsapp: s.whatsapp, origen: s.origen, destino: s.destino, fecha: s.fecha,
          serviceLabel: s.tipoServicio ? `Mudanza ${s.tipoServicio.charAt(0).toUpperCase() + s.tipoServicio.slice(1)}` : 'Mudanza',
          vol: vol.toFixed(1), unitLabel: unit.label, unitIcon: unit.emoji,
          folio: savedCotizacion?.folio, precioTotal: savedCotizacion?.precioTotal,
          cotizacionId: savedCotizacion?.cotizacionId,
        }}
      />

      {savedCotizacion && (
        <PagoModal
          isOpen={pagoOpen}
          onClose={() => setPagoOpen(false)}
          onPagoExitoso={() => setPagoOpen(false)}
          data={{
            folio: savedCotizacion.folio, nombre: s.nombre, whatsapp: s.whatsapp,
            correo: s.correo || undefined, monto: savedCotizacion.precioTotal,
            origen: s.origen, destino: s.destino, fecha: s.fecha,
            serviceLabel: s.tipoServicio ? `Mudanza ${s.tipoServicio}` : 'Mudanza',
            tipoServicio: s.tipoServicio, modalidad: s.modalidad,
            vol: billableVol.toFixed(1), unitLabel: unit.label,
            cotizacionId: savedCotizacion.cotizacionId,
            precioBase: savedCotizacion.precioBase ?? undefined,
            costoRecoleccion: COSTO_RECOLECCION, costoEntrega: COSTO_ENTREGA,
          }}
        />
      )}
    </section>
  );
}

// ─── Price Row ───────────────────────────────────────────────────
function PriceRow({ label, value, accent, warn, total }: {
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
