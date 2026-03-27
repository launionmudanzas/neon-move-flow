/**
 * ExpedienteServicio — Complete service record with:
 * - Timeline, evidence upload, bitácora, WhatsApp buttons, timer
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, Camera, Mic, PenTool, CheckCircle2,
  Clock, MessageCircle, Truck, MapPin, Package,
  AlertTriangle, Download, Eye, Trash2, RefreshCw,
  CreditCard, Calendar, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { registrarBitacora, EVENTOS } from '@/lib/bitacora-service';
import { openWhatsApp, type WAEvent } from '@/lib/whatsapp-messages';

interface Servicio {
  id: string; folio: string | null; cotizacion_id: string;
  estatus: string | null; pdf_url: string | null; created_at: string;
  cotizaciones: {
    origen: string | null; destino: string | null; precio_total: number | null;
    modalidad: string | null; fecha_salida: string | null; fecha_llegada: string | null;
    cliente_id: string; estatus: string | null; urgencia: boolean;
    volumen_cobrable: number | null; unidad_sugerida: string | null; folio: string | null;
  } | null;
  clientes?: { nombre_completo: string; whatsapp: string | null; correo: string | null } | null;
}

interface Evidencia {
  id: string; tipo: string; url: string; descripcion: string | null; created_at: string;
}

interface BitacoraEntry {
  id: string; evento: string; descripcion: string | null;
  estatus_anterior: string | null; estatus_nuevo: string | null; created_at: string;
}

const TIMELINE_STEPS = [
  { key: 'cotizado',       label: 'Cotización',  icon: FileText },
  { key: 'pendiente_pago', label: 'Pago',         icon: CreditCard },
  { key: 'asignado',       label: 'Asignado',     icon: FileText },
  { key: 'confirmado',     label: 'Confirmado',   icon: CheckCircle2 },
  { key: 'programado',     label: 'Programado',   icon: Calendar },
  { key: 'cargando',       label: 'Cargando',     icon: Package },
  { key: 'en_ruta',        label: 'En Ruta',      icon: Truck },
  { key: 'entregado',      label: 'Entregado',    icon: MapPin },
  { key: 'finalizado',     label: 'Finalizado',   icon: CheckCircle2 },
];
const ESTATUS_ORDER = TIMELINE_STEPS.map(s => s.key);

const ESTATUS_COLORS: Record<string, string> = {
  cotizado: 'bg-muted/40 text-muted-foreground border-border',
  pendiente_pago: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  asignado: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  confirmado: 'bg-green-500/15 text-green-400 border-green-500/30',
  programado: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
  cargando: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  en_ruta: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  entregado: 'bg-primary/15 text-primary border-primary/30',
  finalizado: 'bg-green-600/15 text-green-300 border-green-600/30',
  cancelado: 'bg-destructive/15 text-destructive border-destructive/30',
  incidencia: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

// Service timer: m3 → estimated hours
function estimateHours(m3: number | null): number {
  if (!m3) return 3;
  if (m3 <= 5)  return 2;
  if (m3 <= 15) return 3;
  if (m3 <= 25) return 5;
  if (m3 <= 40) return 7;
  return 10;
}

function useServiceTimer(startedAt: Date | null, estimatedHours: number) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const total = estimatedHours * 3600;
  const pct = Math.min(100, (elapsed / total) * 100);
  const remaining = Math.max(0, total - elapsed);
  const fmt = (s: number) => {
    const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = s%60;
    return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  return { elapsed: fmt(elapsed), remaining: fmt(remaining), pct, overdue: elapsed > total };
}

const TIPO_EVIDENCIA = [
  { key: 'foto_carga',    label: 'Foto de carga',    icon: Camera },
  { key: 'foto_entrega',  label: 'Foto de entrega',  icon: Camera },
  { key: 'firma_cliente', label: 'Firma del cliente', icon: PenTool },
  { key: 'comprobante',   label: 'Comprobante',      icon: FileText },
  { key: 'otro',          label: 'Otro',             icon: Upload },
];

const WA_EVENT_MAP: Record<string, WAEvent> = {
  cotizado: 'cotizacion_generada',
  confirmado: 'pago_recibido',
  programado: 'servicio_programado',
  cargando: 'inicio_carga',
  en_ruta: 'en_ruta',
  entregado: 'entrega_realizada',
  incidencia: 'incidencia',
};

interface Props {
  servicio: Servicio;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ExpedienteServicio({ servicio, onClose, onUpdate }: Props) {
  const [localEstatus, setLocalEstatus] = useState(servicio.estatus ?? 'cotizado');
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tipoEv, setTipoEv] = useState('foto_carga');
  const [tab, setTab] = useState<'timeline' | 'evidencias' | 'bitacora'>('timeline');
  const [updatingEstatus, setUpdatingEstatus] = useState(false);
  const [cargandoAt, setCargandoAt] = useState<Date | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cot = servicio.cotizaciones;
  const estimatedH = estimateHours(cot?.volumen_cobrable ?? null);
  const timer = useServiceTimer(cargandoAt, estimatedH);

  useEffect(() => {
    loadEvidencias();
    loadBitacora();
    // Check if service is currently loading
    if (localEstatus === 'cargando' || localEstatus === 'en_ruta') {
      // Use created_at as proxy start time for the demo
      setCargandoAt(new Date(servicio.created_at));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicio.id]);

  async function loadEvidencias() {
    const { data } = await supabase.from('evidencias_servicio')
      .select('id,tipo,url,descripcion,created_at')
      .eq('orden_id', servicio.id)
      .order('created_at', { ascending: false });
    if (data) setEvidencias(data as Evidencia[]);
  }

  async function loadBitacora() {
    const { data } = await supabase.from('bitacora_servicio')
      .select('id,evento,descripcion,estatus_anterior,estatus_nuevo,created_at')
      .eq('orden_id', servicio.id)
      .order('created_at', { ascending: false });
    if (data) setBitacora(data as BitacoraEntry[]);
  }

  async function updateEstatus(newEstatus: string) {
    setUpdatingEstatus(true);
    await supabase.from('ordenes_servicio').update({ estatus: newEstatus }).eq('id', servicio.id);
    await supabase.from('eventos_calendario').update({
      estatus: newEstatus,
      color: { confirmado:'#22c55e', en_ruta:'#3b82f6', finalizado:'#111827', cancelado:'#ef4444', cotizado:'#6b7280', incidencia:'#f97316' }[newEstatus] ?? '#6b7280',
    }).eq('cotizacion_id', servicio.cotizacion_id);
    await registrarBitacora({
      ordenId: servicio.id,
      cotizacionId: servicio.cotizacion_id,
      evento: EVENTOS.ESTATUS_CAMBIADO,
      descripcion: `Estatus actualizado de "${localEstatus}" a "${newEstatus}"`,
      estatusAnterior: localEstatus,
      estatusNuevo: newEstatus,
    });
    if (newEstatus === 'cargando') setCargandoAt(new Date());
    setLocalEstatus(newEstatus);
    setUpdatingEstatus(false);
    onUpdate();
  }

  async function uploadEvidencia(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${servicio.id}/${tipoEv}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('evidencias-servicio').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('evidencias-servicio').getPublicUrl(path);
      await supabase.from('evidencias_servicio').insert({
        orden_id: servicio.id,
        cotizacion_id: servicio.cotizacion_id,
        tipo: tipoEv,
        url: urlData.publicUrl,
        descripcion: TIPO_EVIDENCIA.find(t => t.key === tipoEv)?.label ?? tipoEv,
      });
      await registrarBitacora({
        ordenId: servicio.id,
        cotizacionId: servicio.cotizacion_id,
        evento: EVENTOS.EVIDENCIA_SUBIDA,
        descripcion: `Se subió evidencia tipo: ${tipoEv}`,
      });
      await loadEvidencias();
    } catch (err) {
      console.error('Error uploading evidence:', err);
    } finally {
      setUploading(false);
    }
  }

  const currentIdx = ESTATUS_ORDER.indexOf(localEstatus);

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'Folio', value: servicio.folio },
          { label: 'Ruta', value: cot ? `${cot.origen} → ${cot.destino}` : '—' },
          { label: 'Modalidad', value: cot?.modalidad },
          { label: 'Volumen', value: cot?.volumen_cobrable ? `${cot.volumen_cobrable} m³` : null },
          { label: 'Unidad', value: cot?.unidad_sugerida },
          { label: 'Total', value: cot?.precio_total ? `$${cot.precio_total.toLocaleString('es-MX')}` : null },
        ].filter(f => f.value).map(f => (
          <div key={f.label} className="bg-background border border-border rounded-xl p-2.5">
            <p className="text-[10px] text-muted-foreground">{f.label}</p>
            <p className="text-sm font-semibold text-foreground truncate">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Service timer (shown when cargando/en_ruta) */}
      {(localEstatus === 'cargando' || localEstatus === 'en_ruta') && cargandoAt && (
        <div className={`p-4 rounded-xl border ${timer.overdue ? 'bg-orange-500/10 border-orange-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${timer.overdue ? 'text-orange-400' : 'text-cyan-400'}`} />
              <span className="text-sm font-bold text-foreground">Cronómetro del servicio</span>
            </div>
            <span className={`text-xs font-mono ${timer.overdue ? 'text-orange-400' : 'text-cyan-400'}`}>
              {timer.overdue ? '⚠️ Tiempo excedido' : `Restante: ${timer.remaining}`}
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2 mb-1">
            <div className={`h-2 rounded-full transition-all ${timer.overdue ? 'bg-orange-400' : 'bg-cyan-400'}`}
              style={{ width: `${timer.pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Tiempo estimado: {estimatedH}h para {cot?.volumen_cobrable ?? '—'} m³ · Transcurrido: {timer.elapsed}
          </p>
        </div>
      )}

      {/* Status update */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Cambiar estatus:</span>
        <Select value={localEstatus} onValueChange={updateEstatus} disabled={updatingEstatus}>
          <SelectTrigger className="w-[180px] h-8 text-xs bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {[...ESTATUS_ORDER, 'cancelado', 'incidencia'].map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g,' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {updatingEstatus && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}

        {/* WhatsApp quick-send */}
        {WA_EVENT_MAP[localEstatus] && servicio.clientes && (
          <Button size="sm" variant="outline"
            className="h-8 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1.5"
            onClick={() => openWhatsApp(WA_EVENT_MAP[localEstatus], {
              folio: servicio.folio ?? '',
              nombre: servicio.clientes!.nombre_completo,
              origen: cot?.origen ?? '—',
              destino: cot?.destino ?? '—',
              vol: cot?.volumen_cobrable?.toString(),
              unidad: cot?.unidad_sugerida ?? undefined,
              total: cot?.precio_total ?? undefined,
            })}>
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </Button>
        )}

        {servicio.pdf_url && (
          <a href={servicio.pdf_url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5">
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
          </a>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-background border border-border rounded-xl p-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {TIMELINE_STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const pending = idx > currentIdx;
            return (
              <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex flex-col items-center gap-1 ${pending ? 'opacity-30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    active ? 'border-primary bg-primary/20 shadow-[0_0_8px_hsl(185,100%,50%/0.4)]'
                    : done ? 'border-green-500 bg-green-500/20' : 'border-border bg-muted/20'
                  }`}>
                    <step.icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : done ? 'text-green-400' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`text-[9px] font-medium whitespace-nowrap ${active ? 'text-primary' : done ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 mb-3 flex-shrink-0 ${done ? 'bg-green-500/50' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs: Evidencias | Bitácora */}
      <div className="flex bg-muted/20 border border-border rounded-xl p-0.5 gap-0.5">
        {[
          { key: 'timeline' as const, label: '📋 Detalles' },
          { key: 'evidencias' as const, label: `📷 Evidencias (${evidencias.length})` },
          { key: 'bitacora' as const, label: `📝 Bitácora (${bitacora.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'evidencias' && (
          <motion.div key="ev" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Upload */}
            <div className="p-4 bg-background border border-border rounded-xl mb-3">
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-primary" />
                Subir evidencia
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
                  {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
                </Button>
                <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadEvidencia(e.target.files[0])} />
              </div>
            </div>

            {evidencias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Camera className="w-8 h-8 opacity-30" />
                <p className="text-sm">Sin evidencias subidas</p>
                <p className="text-xs opacity-60">Sube fotos, videos o comprobantes del servicio</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {evidencias.map(ev => (
                  <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer"
                    className="bg-background border border-border rounded-xl p-2.5 hover:border-primary/30 transition-colors group">
                    {ev.url.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                      <img src={ev.url} alt={ev.descripcion ?? ev.tipo}
                        className="w-full h-20 object-cover rounded-lg mb-1.5" />
                    ) : (
                      <div className="w-full h-20 bg-muted/30 rounded-lg flex items-center justify-center mb-1.5">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-[10px] font-semibold text-foreground truncate">{ev.descripcion ?? ev.tipo}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {new Date(ev.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'bitacora' && (
          <motion.div key="bit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {bitacora.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <FileText className="w-8 h-8 opacity-30" />
                <p className="text-sm">Sin registros en bitácora</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bitacora.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {idx < bitacora.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">
                          {entry.evento.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                      {entry.descripcion && (
                        <p className="text-xs text-muted-foreground">{entry.descripcion}</p>
                      )}
                      {entry.estatus_anterior && entry.estatus_nuevo && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] bg-muted/30 px-1.5 py-0.5 rounded">{entry.estatus_anterior}</span>
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded">{entry.estatus_nuevo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'timeline' && (
          <motion.div key="det" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              {/* Client info */}
              {servicio.clientes && (
                <div className="p-3 bg-background border border-border rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Cliente</p>
                  <p className="text-sm font-bold text-foreground">{servicio.clientes.nombre_completo}</p>
                  {servicio.clientes.whatsapp && (
                    <a href={`https://wa.me/52${servicio.clientes.whatsapp.replace(/\D/g,'')}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-green-400 hover:underline flex items-center gap-1 mt-1">
                      <MessageCircle className="w-3 h-3" />
                      {servicio.clientes.whatsapp}
                    </a>
                  )}
                </div>
              )}
              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-background border border-border rounded-xl">
                  <p className="text-[10px] text-muted-foreground">Fecha de carga</p>
                  <p className="text-sm font-semibold text-foreground">
                    {cot?.fecha_salida ? new Date(cot.fecha_salida).toLocaleDateString('es-MX', {day:'2-digit',month:'short',year:'numeric'}) : '—'}
                  </p>
                </div>
                <div className="p-3 bg-background border border-border rounded-xl">
                  <p className="text-[10px] text-muted-foreground">Fecha de entrega</p>
                  <p className="text-sm font-semibold text-foreground">
                    {cot?.fecha_llegada ? new Date(cot.fecha_llegada).toLocaleDateString('es-MX', {day:'2-digit',month:'short',year:'numeric'}) : '—'}
                  </p>
                </div>
              </div>
              {/* Alerts */}
              {localEstatus === 'incidencia' && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-orange-300">Servicio con incidencia activa. Requiere atención.</p>
                </div>
              )}
              {!servicio.pdf_url && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <p className="text-xs text-yellow-300">Sin orden de servicio PDF generada.</p>
                </div>
              )}
              {evidencias.length === 0 && localEstatus === 'entregado' && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">⚠️ Sin evidencias para cerrar el servicio. Requerido antes de liberar pago.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
