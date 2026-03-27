/**
 * ServiciosOperativos — Provider's operational service management
 * Shows assigned/active/completed services with evidence upload, status updates, incidents
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Package, MapPin, Calendar, CreditCard, CheckCircle2,
  Clock, Camera, Upload, AlertTriangle, FileText, RefreshCw,
  ChevronRight, MessageCircle, X, PenTool, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { registrarBitacora, EVENTOS } from '@/lib/bitacora-service';

/* ── Types ─────────────────────────────────────── */
interface OrdenAsignada {
  id: string;
  folio: string | null;
  estatus: string | null;
  created_at: string;
  cotizacion_id: string;
  proveedor_id: string | null;
  aceptado_proveedor: boolean;
  evidencias_carga: boolean;
  evidencias_entrega: boolean;
  firma_cliente: boolean;
  pago_completo: boolean;
  origen_asignacion: string | null;
  cotizaciones: {
    origen: string | null;
    destino: string | null;
    precio_total: number | null;
    modalidad: string | null;
    fecha_salida: string | null;
    fecha_llegada: string | null;
    volumen_cobrable: number | null;
    unidad_sugerida: string | null;
    folio: string | null;
    tipo_servicio: string | null;
  } | null;
  clientes?: { nombre_completo: string; whatsapp: string | null } | null;
}

interface Evidencia {
  id: string; tipo: string; url: string; descripcion: string | null; created_at: string;
}

const SERVICE_FLOW = [
  { key: 'asignado',          label: 'Asignado',       icon: FileText },
  { key: 'confirmado',        label: 'Confirmado',     icon: CheckCircle2 },
  { key: 'programado',        label: 'Programado',     icon: Calendar },
  { key: 'cargando',          label: 'En carga',       icon: Package },
  { key: 'en_ruta',           label: 'En tránsito',    icon: Truck },
  { key: 'entregado',         label: 'En entrega',     icon: MapPin },
  { key: 'finalizado',        label: 'Finalizado',     icon: CheckCircle2 },
];
const FLOW_KEYS = SERVICE_FLOW.map(s => s.key);

const ESTATUS_COLORS: Record<string, string> = {
  asignado:       'bg-blue-500/15 text-blue-400 border-blue-500/30',
  confirmado:     'bg-green-500/15 text-green-400 border-green-500/30',
  programado:     'bg-blue-400/15 text-blue-400 border-blue-400/30',
  cargando:       'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  en_ruta:        'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  entregado:      'bg-primary/15 text-primary border-primary/30',
  finalizado:     'bg-green-600/15 text-green-300 border-green-600/30',
  incidencia:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  cancelado:      'bg-destructive/15 text-destructive border-destructive/30',
};

const TIPO_EVIDENCIA = [
  { key: 'foto_domicilio',    label: 'Foto domicilio' },
  { key: 'foto_carga',        label: 'Foto de carga' },
  { key: 'evidencia_inicio',  label: 'Evidencia de inicio' },
  { key: 'foto_entrega',      label: 'Foto de entrega' },
  { key: 'evidencia_descarga',label: 'Evidencia descarga' },
  { key: 'firma_cliente',     label: 'Firma del cliente' },
  { key: 'otro',              label: 'Otro' },
];

const TIPOS_INCIDENCIA = [
  'Retraso', 'Acceso complicado', 'Volumen adicional', 'Maniobra extra',
  'Cliente no disponible', 'Daños', 'Falla mecánica', 'Otro',
];

const fmt = (n: number | null) => n != null ? `$${n.toLocaleString('es-MX')}` : '—';
const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface Props {
  proveedorId: string;
}

export default function ServiciosOperativos({ proveedorId }: Props) {
  const [ordenes, setOrdenes] = useState<OrdenAsignada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrdenAsignada | null>(null);
  const [filter, setFilter] = useState<'activos' | 'historial'>('activos');

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ordenes_servicio')
      .select(`
        id, folio, estatus, created_at, cotizacion_id, proveedor_id,
        aceptado_proveedor, evidencias_carga, evidencias_entrega, firma_cliente,
        pago_completo, origen_asignacion,
        cotizaciones(origen, destino, precio_total, modalidad, fecha_salida, fecha_llegada,
          volumen_cobrable, unidad_sugerida, folio, tipo_servicio,
          clientes(nombre_completo, whatsapp))
      `)
      .eq('proveedor_id', proveedorId)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped = (data as any[]).map(d => ({
        ...d,
        clientes: d.cotizaciones?.clientes ?? null,
      }));
      setOrdenes(mapped);
    }
    setLoading(false);
  }, [proveedorId]);

  useEffect(() => { fetchOrdenes(); }, [fetchOrdenes]);

  const activeStatuses = ['asignado', 'confirmado', 'programado', 'cargando', 'en_ruta', 'entregado', 'incidencia'];
  const activos = ordenes.filter(o => activeStatuses.includes(o.estatus ?? ''));
  const historial = ordenes.filter(o => ['finalizado', 'cancelado'].includes(o.estatus ?? ''));
  const shown = filter === 'activos' ? activos : historial;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Asignados', count: ordenes.filter(o => o.estatus === 'asignado').length, color: 'text-blue-400' },
          { label: 'En curso', count: ordenes.filter(o => ['cargando', 'en_ruta'].includes(o.estatus ?? '')).length, color: 'text-cyan-400' },
          { label: 'Completados', count: historial.length, color: 'text-green-400' },
          { label: 'Incidencias', count: ordenes.filter(o => o.estatus === 'incidencia').length, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-background border border-border rounded-xl p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex bg-muted/20 border border-border rounded-xl p-0.5 gap-0.5">
        {[
          { key: 'activos' as const, label: `Activos (${activos.length})` },
          { key: 'historial' as const, label: `Historial (${historial.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Service list */}
      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-primary" /></div>
      ) : shown.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Truck className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">{filter === 'activos' ? 'Sin servicios activos' : 'Sin historial'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map(o => {
            const cot = o.cotizaciones;
            const idx = FLOW_KEYS.indexOf(o.estatus ?? '');
            return (
              <motion.div key={o.id} whileHover={{ scale: 1.003 }}
                onClick={() => setSelected(o)}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="font-bold text-foreground text-sm">{o.folio ?? 'Sin folio'}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${ESTATUS_COLORS[o.estatus ?? ''] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
                        {(o.estatus ?? 'pendiente').replace(/_/g, ' ')}
                      </span>
                      {!o.aceptado_proveedor && o.estatus === 'asignado' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold animate-pulse">
                          Requiere aceptación
                        </span>
                      )}
                    </div>
                    {cot && (
                      <>
                        <p className="text-xs text-muted-foreground">{cot.origen} → {cot.destino}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {fmtDate(cot.fecha_salida)} · {cot.volumen_cobrable ? `${cot.volumen_cobrable} m³` : ''} · {cot.unidad_sugerida ?? ''} · {fmt(cot.precio_total)}
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                {/* Mini progress */}
                <div className="flex items-center gap-0.5 mt-2">
                  {SERVICE_FLOW.map((step, i) => (
                    <div key={step.key} className={`h-1 flex-1 rounded-full transition-all ${
                      i <= idx ? 'bg-primary' : 'bg-border'
                    }`} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {selected && (
            <OrdenOperativaDetail
              orden={selected}
              onClose={() => setSelected(null)}
              onUpdate={() => { fetchOrdenes(); setSelected(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Operational Detail ─────────────────────────────────── */
function OrdenOperativaDetail({
  orden, onClose, onUpdate,
}: {
  orden: OrdenAsignada;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [localEstatus, setLocalEstatus] = useState(orden.estatus ?? 'asignado');
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tipoEv, setTipoEv] = useState('foto_carga');
  const [tab, setTab] = useState<'detalle' | 'evidencias' | 'incidencia'>('detalle');
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [updatingEstatus, setUpdatingEstatus] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Incident form
  const [incTipo, setIncTipo] = useState('Retraso');
  const [incDesc, setIncDesc] = useState('');
  const [submittingInc, setSubmittingInc] = useState(false);

  const cot = orden.cotizaciones;
  const currentIdx = FLOW_KEYS.indexOf(localEstatus);

  useEffect(() => {
    loadEvidencias();
  }, [orden.id]);

  async function loadEvidencias() {
    const { data } = await supabase.from('evidencias_servicio')
      .select('id,tipo,url,descripcion,created_at')
      .eq('orden_id', orden.id)
      .order('created_at', { ascending: false });
    if (data) setEvidencias(data as Evidencia[]);
  }

  // Accept assignment
  async function acceptService() {
    setAccepting(true);
    await supabase.from('ordenes_servicio').update({
      aceptado_proveedor: true,
      fecha_aceptacion_proveedor: new Date().toISOString(),
      estatus: 'confirmado',
    }).eq('id', orden.id);
    await registrarBitacora({
      ordenId: orden.id,
      cotizacionId: orden.cotizacion_id,
      evento: 'proveedor_acepto',
      descripcion: 'Proveedor aceptó el servicio asignado',
      estatusAnterior: 'asignado',
      estatusNuevo: 'confirmado',
    });
    setAccepting(false);
    onUpdate();
  }

  // Reject assignment
  async function rejectService() {
    setRejecting(true);
    await supabase.from('ordenes_servicio').update({
      aceptado_proveedor: false,
      estatus: 'cotizado',
      proveedor_id: null,
    }).eq('id', orden.id);
    // Also clear proveedor on cotización for re-assignment
    await supabase.from('cotizaciones').update({ proveedor_id: null }).eq('id', orden.cotizacion_id);
    await registrarBitacora({
      ordenId: orden.id,
      cotizacionId: orden.cotizacion_id,
      evento: 'proveedor_rechazo',
      descripcion: 'Proveedor rechazó el servicio. Requiere reasignación.',
      estatusAnterior: 'asignado',
      estatusNuevo: 'cotizado',
    });
    setRejecting(false);
    onUpdate();
  }

  // Advance status
  async function advanceStatus() {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= FLOW_KEYS.length) return;
    const next = FLOW_KEYS[nextIdx];

    // Validations
    if (next === 'finalizado') {
      const hasCarga = evidencias.some(e => ['foto_carga', 'foto_domicilio', 'evidencia_inicio'].includes(e.tipo));
      const hasEntrega = evidencias.some(e => ['foto_entrega', 'evidencia_descarga', 'firma_cliente'].includes(e.tipo));
      if (!hasCarga) { alert('Sube evidencias de carga antes de finalizar.'); return; }
      if (!hasEntrega) { alert('Sube evidencias de entrega antes de finalizar.'); return; }
    }

    setUpdatingEstatus(true);
    const updates: Record<string, any> = { estatus: next };
    if (next === 'finalizado') {
      updates.evidencias_carga = true;
      updates.evidencias_entrega = true;
    }

    await supabase.from('ordenes_servicio').update(updates).eq('id', orden.id);
    await registrarBitacora({
      ordenId: orden.id,
      cotizacionId: orden.cotizacion_id,
      evento: EVENTOS.ESTATUS_CAMBIADO,
      descripcion: `Proveedor avanzó estatus: "${localEstatus}" → "${next}"`,
      estatusAnterior: localEstatus,
      estatusNuevo: next,
    });
    setLocalEstatus(next);
    setUpdatingEstatus(false);
  }

  // Upload evidence
  async function uploadEvidencia(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${orden.id}/${tipoEv}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('evidencias-servicio').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('evidencias-servicio').getPublicUrl(path);
      await supabase.from('evidencias_servicio').insert({
        orden_id: orden.id,
        cotizacion_id: orden.cotizacion_id,
        tipo: tipoEv,
        url: urlData.publicUrl,
        descripcion: TIPO_EVIDENCIA.find(t => t.key === tipoEv)?.label ?? tipoEv,
      });
      await registrarBitacora({
        ordenId: orden.id,
        cotizacionId: orden.cotizacion_id,
        evento: EVENTOS.EVIDENCIA_SUBIDA,
        descripcion: `Proveedor subió evidencia: ${tipoEv}`,
      });
      await loadEvidencias();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  // Submit incident
  async function submitIncident() {
    if (!incDesc.trim()) return;
    setSubmittingInc(true);
    await supabase.from('incidencias').insert({
      cotizacion_id: orden.cotizacion_id,
      proveedor_id: orden.proveedor_id,
      tipo_incidencia: incTipo,
      descripcion: incDesc,
      estatus: 'abierta',
      reportada_en_app: true,
    });
    await supabase.from('ordenes_servicio').update({ estatus: 'incidencia' }).eq('id', orden.id);
    await registrarBitacora({
      ordenId: orden.id,
      cotizacionId: orden.cotizacion_id,
      evento: EVENTOS.INCIDENCIA_REPORTADA,
      descripcion: `Incidencia: ${incTipo} — ${incDesc}`,
      estatusAnterior: localEstatus,
      estatusNuevo: 'incidencia',
    });
    setLocalEstatus('incidencia');
    setIncDesc('');
    setSubmittingInc(false);
  }

  // Payment info
  const precioTotal = cot?.precio_total ?? 0;
  const apartado = Math.round(precioTotal * 0.3);
  const pagoAlCargar = Math.round(precioTotal * 0.5);
  const saldoRestante = precioTotal - apartado - pagoAlCargar;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-foreground">
          <Truck className="w-5 h-5 text-primary" />
          Servicio — {orden.folio ?? orden.id.slice(0, 8)}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Accept/Reject banner */}
        {!orden.aceptado_proveedor && localEstatus === 'asignado' && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-sm font-bold text-foreground mb-1">🔔 Servicio asignado</p>
            <p className="text-xs text-muted-foreground mb-3">
              Se te ha asignado un nuevo servicio. Revisa los detalles y acepta o rechaza.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={acceptService} disabled={accepting}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
                {accepting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Aceptar servicio
              </Button>
              <Button size="sm" variant="outline" onClick={rejectService} disabled={rejecting}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5">
                {rejecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Rechazar
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-background border border-border rounded-xl p-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {SERVICE_FLOW.map((step, idx) => {
              const done = idx < currentIdx;
              const active = idx === currentIdx;
              const pending = idx > currentIdx;
              return (
                <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`flex flex-col items-center gap-1 ${pending ? 'opacity-30' : ''}`}>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      active ? 'border-primary bg-primary/20 shadow-[0_0_6px_hsl(185,100%,50%/0.3)]'
                      : done ? 'border-green-500 bg-green-500/20' : 'border-border bg-muted/20'
                    }`}>
                      <step.icon className={`w-3 h-3 ${active ? 'text-primary' : done ? 'text-green-400' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-[8px] font-medium whitespace-nowrap ${active ? 'text-primary' : done ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < SERVICE_FLOW.length - 1 && (
                    <div className={`w-3 h-0.5 mb-3 flex-shrink-0 ${done ? 'bg-green-500/50' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Service details */}
        {cot && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Ruta', value: `${cot.origen} → ${cot.destino}` },
              { label: 'Servicio', value: cot.tipo_servicio?.replace(/_/g, ' ') },
              { label: 'Modalidad', value: cot.modalidad },
              { label: 'Volumen', value: cot.volumen_cobrable ? `${cot.volumen_cobrable} m³` : null },
              { label: 'Unidad', value: cot.unidad_sugerida },
              { label: 'Fecha carga', value: fmtDate(cot.fecha_salida) },
              { label: 'Fecha entrega', value: fmtDate(cot.fecha_llegada) },
              { label: 'Total', value: fmt(cot.precio_total) },
            ].filter(f => f.value).map(f => (
              <div key={f.label} className="bg-background border border-border rounded-xl p-2.5">
                <p className="text-[10px] text-muted-foreground">{f.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{f.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Client info (only when accepted) */}
        {orden.aceptado_proveedor && orden.clientes && (
          <div className="p-3 bg-background border border-border rounded-xl">
            <p className="text-[10px] text-muted-foreground mb-1">Cliente</p>
            <p className="text-sm font-bold text-foreground">{orden.clientes.nombre_completo}</p>
            {orden.clientes.whatsapp && (
              <a href={`https://wa.me/52${orden.clientes.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer"
                className="text-xs text-green-400 hover:underline flex items-center gap-1 mt-1">
                <MessageCircle className="w-3 h-3" /> {orden.clientes.whatsapp}
              </a>
            )}
          </div>
        )}

        {/* Payment breakdown */}
        {precioTotal > 0 && (
          <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
            <p className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Desglose de pagos
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Apartado (app)</p>
                <p className="text-sm font-bold text-foreground">{fmt(apartado)}</p>
                <p className="text-[9px] text-green-400">✓ Plataforma</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">50% al cargar</p>
                <p className="text-sm font-bold text-foreground">{fmt(pagoAlCargar)}</p>
                <p className="text-[9px] text-muted-foreground">Proveedor cobra</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Antes de descarga</p>
                <p className="text-sm font-bold text-foreground">{fmt(saldoRestante)}</p>
                <p className="text-[9px] text-destructive font-semibold">Sin descarga sin pago</p>
              </div>
            </div>
          </div>
        )}

        {/* Advance status button */}
        {orden.aceptado_proveedor && currentIdx >= 0 && currentIdx < FLOW_KEYS.length - 1 && localEstatus !== 'incidencia' && (
          <Button onClick={advanceStatus} disabled={updatingEstatus}
            className="w-full gap-2 bg-primary hover:bg-primary/90">
            {updatingEstatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            Avanzar a: {SERVICE_FLOW[currentIdx + 1]?.label}
          </Button>
        )}

        {/* Tabs */}
        <div className="flex bg-muted/20 border border-border rounded-xl p-0.5 gap-0.5">
          {[
            { key: 'detalle' as const, label: '📋 Detalle' },
            { key: 'evidencias' as const, label: `📷 Evidencias (${evidencias.length})` },
            { key: 'incidencia' as const, label: '⚠️ Incidencia' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'evidencias' && (
            <motion.div key="ev" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="p-4 bg-background border border-border rounded-xl mb-3">
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-primary" /> Subir evidencia
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={tipoEv} onValueChange={setTipoEv}>
                    <SelectTrigger className="flex-1 h-8 text-xs bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {TIPO_EVIDENCIA.map(t => (
                        <SelectItem key={t.key} value={t.key} className="text-xs">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="border-primary/30 text-primary hover:bg-primary/10 gap-1.5 text-xs h-8">
                    {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    {uploading ? 'Subiendo...' : 'Seleccionar'}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*,video/*,.pdf" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadEvidencia(e.target.files[0])} />
                </div>
              </div>

              {evidencias.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sin evidencias</p>
                  <p className="text-xs opacity-60">Sube fotos de carga, entrega y firma</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {evidencias.map(ev => (
                    <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer"
                      className="bg-background border border-border rounded-xl p-2 hover:border-primary/30 transition-colors">
                      {ev.url.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                        <img src={ev.url} alt={ev.descripcion ?? ev.tipo} className="w-full h-16 object-cover rounded-lg mb-1" />
                      ) : (
                        <div className="w-full h-16 bg-muted/30 rounded-lg flex items-center justify-center mb-1">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-[10px] font-semibold text-foreground truncate">{ev.descripcion ?? ev.tipo}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(ev.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'incidencia' && (
            <motion.div key="inc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="p-4 bg-background border border-border rounded-xl">
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> Reportar incidencia
                </p>
                <div className="space-y-3">
                  <Select value={incTipo} onValueChange={setIncTipo}>
                    <SelectTrigger className="h-8 text-xs bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {TIPOS_INCIDENCIA.map(t => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea value={incDesc} onChange={e => setIncDesc(e.target.value)}
                    placeholder="Describe la incidencia en detalle..."
                    className="bg-card border-border text-sm" rows={3} />
                  <Button size="sm" onClick={submitIncident} disabled={submittingInc || !incDesc.trim()}
                    className="w-full gap-1.5 bg-orange-600 hover:bg-orange-700 text-white">
                    {submittingInc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    Reportar incidencia
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'detalle' && (
            <motion.div key="det" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-3">
                {/* Validation checklist */}
                <div className="p-3 bg-background border border-border rounded-xl">
                  <p className="text-xs font-semibold text-foreground mb-2">Checklist de cierre</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Evidencias de carga', done: evidencias.some(e => ['foto_carga', 'foto_domicilio', 'evidencia_inicio'].includes(e.tipo)) },
                      { label: 'Evidencias de entrega', done: evidencias.some(e => ['foto_entrega', 'evidencia_descarga'].includes(e.tipo)) },
                      { label: 'Firma del cliente', done: evidencias.some(e => e.tipo === 'firma_cliente') },
                      { label: 'Proveedor aceptó', done: orden.aceptado_proveedor },
                    ].map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        {c.done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-border" />
                        }
                        <span className={`text-xs ${c.done ? 'text-foreground' : 'text-muted-foreground'}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                {localEstatus === 'incidencia' && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="text-xs text-orange-300">Servicio con incidencia activa.</p>
                  </div>
                )}
                {localEstatus === 'entregado' && evidencias.length === 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">⚠️ Sube evidencias para poder cerrar el servicio.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
