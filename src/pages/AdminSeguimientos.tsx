/**
 * /admin/seguimientos — Follow-up & Lead tracking module
 * La Unión Mudanzas
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Search, RefreshCw, Phone, Mail,
  MapPin, Calendar, FileText, CreditCard, MessageSquare,
  Plus, X, Check, Filter, Clock, CheckCircle2, XCircle,
  AlertTriangle, Eye, Bell, ChevronRight, Send, StickyNote,
  CalendarPlus, ThumbsUp, ThumbsDown, Pencil,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildWhatsAppLink, type WAEvent, type ServiceData } from '@/lib/whatsapp-messages';
import logoOficial from '@/assets/logo-oficial.png';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Seguimiento {
  id: string;
  cotizacion_id: string;
  cliente_id: string;
  tipo: string;
  mensaje: string | null;
  fecha_programada: string;
  fecha_completado: string | null;
  estatus: string;
  notas: string | null;
  created_at: string;
}

interface CotizacionLead {
  id: string;
  folio: string | null;
  origen: string | null;
  destino: string | null;
  precio_total: number | null;
  estatus: string | null;
  volumen_total: number | null;
  unidad_sugerida: string | null;
  tipo_servicio: string | null;
  fecha_salida: string | null;
  created_at: string;
  cliente_id: string;
}

interface Cliente {
  id: string;
  nombre_completo: string;
  whatsapp: string | null;
  correo: string | null;
}

interface NotaLead {
  id: string;
  contenido: string;
  created_at: string;
  cotizacion_id: string | null;
  cliente_id: string | null;
}

interface PagoSimple {
  id: string;
  monto: number | null;
  tipo_pago: string | null;
  estatus: string | null;
  created_at: string;
}

interface OrdenSimple {
  id: string;
  folio: string | null;
  estatus: string | null;
  pdf_url: string | null;
}

/* ── Constants ──────────────────────────────────────────────────────────── */
const LEAD_ESTADOS = [
  'nuevo', 'cotizado', 'pendiente_respuesta', 'en_seguimiento',
  'interesado', 'pago_pendiente', 'confirmado', 'perdido',
];

const ESTADO_COLORS: Record<string, string> = {
  nuevo:               'bg-muted/40 text-muted-foreground border-border',
  cotizado:            'bg-blue-500/15 text-blue-400 border-blue-500/30',
  pendiente_respuesta: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  en_seguimiento:      'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  interesado:          'bg-green-500/15 text-green-400 border-green-500/30',
  pago_pendiente:      'bg-orange-500/15 text-orange-400 border-orange-500/30',
  confirmado:          'bg-primary/15 text-primary border-primary/30',
  perdido:             'bg-destructive/15 text-destructive border-destructive/30',
};

const FILTRO_SEGUIMIENTO = ['todos', 'hoy', 'vencidos', 'proximos', 'completados'] as const;

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—';
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function EstatusBadge({ value }: { value: string | null }) {
  const v = value ?? 'nuevo';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ESTADO_COLORS[v] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {v.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Auto-generate seguimientos ─────────────────────────────────────────── */
const SEGUIMIENTO_OFFSETS = [
  { hours: 1, msg: 'Seguimiento 1h — primer contacto' },
  { hours: 24, msg: 'Seguimiento 24h — recordatorio' },
  { hours: 72, msg: 'Seguimiento 3 días — insistencia' },
  { hours: 120, msg: 'Seguimiento 5 días — último intento' },
];

async function generarSeguimientosAutomaticos(cotizacionId: string, clienteId: string) {
  const now = new Date();
  const rows = SEGUIMIENTO_OFFSETS.map(o => ({
    cotizacion_id: cotizacionId,
    cliente_id: clienteId,
    tipo: 'automatico',
    mensaje: o.msg,
    fecha_programada: new Date(now.getTime() + o.hours * 3600000).toISOString(),
    estatus: 'pendiente',
  }));
  await supabase.from('seguimientos').insert(rows);
}

/* ── Lead Detail Modal ──────────────────────────────────────────────────── */
function LeadDetailModal({
  cotizacion,
  cliente,
  onClose,
  onRefresh,
}: {
  cotizacion: CotizacionLead | null;
  cliente: Cliente | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [notas, setNotas] = useState<NotaLead[]>([]);
  const [pagos, setPagos] = useState<PagoSimple[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenSimple[]>([]);
  const [newNota, setNewNota] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'seguimientos' | 'notas' | 'pagos'>('seguimientos');

  useEffect(() => {
    if (!cotizacion) return;
    Promise.all([
      supabase.from('seguimientos').select('*').eq('cotizacion_id', cotizacion.id).order('fecha_programada'),
      supabase.from('notas_lead').select('*').eq('cotizacion_id', cotizacion.id).order('created_at', { ascending: false }),
      supabase.from('pagos').select('id,monto,tipo_pago,estatus,created_at').eq('cotizacion_id', cotizacion.id).order('created_at', { ascending: false }),
      supabase.from('ordenes_servicio').select('id,folio,estatus,pdf_url').eq('cotizacion_id', cotizacion.id),
    ]).then(([s, n, p, o]) => {
      setSeguimientos((s.data ?? []) as Seguimiento[]);
      setNotas((n.data ?? []) as NotaLead[]);
      setPagos((p.data ?? []) as PagoSimple[]);
      setOrdenes((o.data ?? []) as OrdenSimple[]);
    });
  }, [cotizacion]);

  const addNota = async () => {
    if (!newNota.trim() || !cotizacion || !cliente) return;
    setSaving(true);
    await supabase.from('notas_lead').insert({
      cotizacion_id: cotizacion.id,
      cliente_id: cliente.id,
      contenido: newNota.trim(),
    });
    setNewNota('');
    const { data } = await supabase.from('notas_lead').select('*').eq('cotizacion_id', cotizacion.id).order('created_at', { ascending: false });
    setNotas((data ?? []) as NotaLead[]);
    setSaving(false);
  };

  const completarSeguimiento = async (segId: string) => {
    await supabase.from('seguimientos').update({
      estatus: 'completado',
      fecha_completado: new Date().toISOString(),
    }).eq('id', segId);
    setSeguimientos(prev => prev.map(s => s.id === segId ? { ...s, estatus: 'completado', fecha_completado: new Date().toISOString() } : s));
  };

  const cambiarEstatus = async (estatus: string) => {
    if (!cotizacion) return;
    await supabase.from('cotizaciones').update({ estatus }).eq('id', cotizacion.id);
    onRefresh();
  };

  const getWaLink = (event: WAEvent) => {
    if (!cotizacion || !cliente) return '#';
    const data: ServiceData = {
      folio: cotizacion.folio ?? cotizacion.id.slice(0, 8),
      nombre: cliente.nombre_completo,
      origen: cotizacion.origen ?? '',
      destino: cotizacion.destino ?? '',
      fecha: cotizacion.fecha_salida ?? undefined,
      vol: cotizacion.volumen_total?.toString(),
      unidad: cotizacion.unidad_sugerida ?? undefined,
      tipoServicio: cotizacion.tipo_servicio ?? undefined,
      total: cotizacion.precio_total ?? undefined,
    };
    return buildWhatsAppLink(event, data, cliente.whatsapp ? `52${cliente.whatsapp}` : undefined);
  };

  if (!cotizacion || !cliente) return null;

  const now = new Date();

  return (
    <Dialog open={!!cotizacion} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Eye className="w-5 h-5 text-primary" />
            Lead: {cotizacion.folio ?? cotizacion.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lead info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-background border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Cliente</p>
              <p className="font-semibold text-foreground text-sm truncate">{cliente.nombre_completo}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Ruta</p>
              <p className="font-semibold text-foreground text-sm truncate">{cotizacion.origen} → {cotizacion.destino}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Precio</p>
              <p className="font-semibold text-foreground text-sm">{fmt(cotizacion.precio_total)}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Estatus</p>
              <EstatusBadge value={cotizacion.estatus} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <a href={getWaLink('seguimiento_1')} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1 text-xs">
                <Send className="w-3.5 h-3.5" /> WhatsApp
              </Button>
            </a>
            {cliente.correo && (
              <a href={`mailto:${cliente.correo}?subject=Seguimiento cotización ${cotizacion.folio ?? ''}`}>
                <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-1 text-xs">
                  <Mail className="w-3.5 h-3.5" /> Correo
                </Button>
              </a>
            )}
            <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1 text-xs" onClick={() => cambiarEstatus('interesado')}>
              <ThumbsUp className="w-3.5 h-3.5" /> Interesado
            </Button>
            <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1 text-xs" onClick={() => cambiarEstatus('perdido')}>
              <ThumbsDown className="w-3.5 h-3.5" /> Perdido
            </Button>

            <Select onValueChange={cambiarEstatus}>
              <SelectTrigger className="w-auto h-8 text-xs border-border bg-background">
                <SelectValue placeholder="Cambiar estatus" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_ESTADOS.map(e => (
                  <SelectItem key={e} value={e}>{e.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="flex bg-background border border-border rounded-xl p-1 gap-1">
            {([
              { id: 'seguimientos', label: 'Seguimientos', count: seguimientos.filter(s => s.estatus === 'pendiente').length },
              { id: 'notas', label: 'Notas', count: notas.length },
              { id: 'pagos', label: 'Pagos / Órdenes', count: pagos.length + ordenes.length },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                  tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab === t.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'seguimientos' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {seguimientos.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">Sin seguimientos programados</p>
              )}
              {seguimientos.map(s => {
                const isPast = new Date(s.fecha_programada) < now && s.estatus === 'pendiente';
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl text-sm border ${
                    s.estatus === 'completado' ? 'bg-green-500/5 border-green-500/20' :
                    isPast ? 'bg-destructive/5 border-destructive/20' :
                    'bg-background border-border'
                  }`}>
                    {s.estatus === 'completado' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : isPast ? (
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{s.mensaje}</p>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(s.fecha_programada)}</p>
                    </div>
                    {s.estatus === 'pendiente' && (
                      <div className="flex gap-1">
                        <a href={getWaLink(isPast ? 'seguimiento_3' : 'seguimiento_1')} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400">
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => completarSeguimiento(s.id)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'notas' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={newNota}
                  onChange={e => setNewNota(e.target.value)}
                  placeholder="Agregar nota interna..."
                  rows={2}
                  className="text-sm bg-background"
                />
                <Button onClick={addNota} disabled={saving || !newNota.trim()} size="sm" className="self-end">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notas.map(n => (
                  <div key={n.id} className="p-3 bg-background border border-border rounded-xl text-sm">
                    <p className="text-foreground">{n.contenido}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{fmtDateTime(n.created_at)}</p>
                  </div>
                ))}
                {notas.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Sin notas</p>}
              </div>
            </div>
          )}

          {tab === 'pagos' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ordenes.map(o => (
                <div key={o.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl text-sm">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Orden {o.folio}</p>
                    <p className="text-xs text-muted-foreground">{o.estatus}</p>
                  </div>
                  {o.pdf_url && (
                    <a href={o.pdf_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 text-xs">PDF</Button>
                    </a>
                  )}
                </div>
              ))}
              {pagos.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl text-sm">
                  <CreditCard className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{fmt(p.monto)}</p>
                    <p className="text-xs text-muted-foreground">{p.tipo_pago} · {fmtDate(p.created_at)}</p>
                  </div>
                  <EstatusBadge value={p.estatus} />
                </div>
              ))}
              {pagos.length === 0 && ordenes.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">Sin pagos ni órdenes</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminSeguimientos() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionLead[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<typeof FILTRO_SEGUIMIENTO[number]>('todos');
  const [filterEstatus, setFilterEstatus] = useState('todos');
  const [selectedCot, setSelectedCot] = useState<CotizacionLead | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [seg, cot, cli] = await Promise.all([
      supabase.from('seguimientos').select('*').order('fecha_programada'),
      supabase.from('cotizaciones').select('id,folio,origen,destino,precio_total,estatus,volumen_total,unidad_sugerida,tipo_servicio,fecha_salida,created_at,cliente_id').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id,nombre_completo,whatsapp,correo'),
    ]);
    setSeguimientos((seg.data ?? []) as Seguimiento[]);
    setCotizaciones((cot.data ?? []) as CotizacionLead[]);
    setClientes((cli.data ?? []) as Cliente[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const clienteMap = new Map(clientes.map(c => [c.id, c]));
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const threeDays = new Date(now.getTime() + 3 * 86400000);

  // Build a map: cotizacion_id → next pending seguimiento
  const nextSeg = new Map<string, Seguimiento>();
  for (const s of seguimientos) {
    if (s.estatus !== 'pendiente') continue;
    const existing = nextSeg.get(s.cotizacion_id);
    if (!existing || new Date(s.fecha_programada) < new Date(existing.fecha_programada)) {
      nextSeg.set(s.cotizacion_id, s);
    }
  }

  // Overdue seguimientos count per cotizacion
  const overdueCount = new Map<string, number>();
  for (const s of seguimientos) {
    if (s.estatus === 'pendiente' && new Date(s.fecha_programada) < now) {
      overdueCount.set(s.cotizacion_id, (overdueCount.get(s.cotizacion_id) ?? 0) + 1);
    }
  }

  // Filter cotizaciones
  const q = search.toLowerCase();
  const filtered = cotizaciones.filter(c => {
    const cli = clienteMap.get(c.cliente_id);
    const matchSearch = [c.folio, c.origen, c.destino, cli?.nombre_completo, cli?.whatsapp]
      .some(v => v?.toLowerCase().includes(q));
    const matchEstatus = filterEstatus === 'todos' || c.estatus === filterEstatus;

    if (!matchSearch || !matchEstatus) return false;

    const seg = nextSeg.get(c.id);
    if (filtro === 'hoy') {
      return seg && new Date(seg.fecha_programada) >= todayStart && new Date(seg.fecha_programada) < todayEnd;
    }
    if (filtro === 'vencidos') {
      return (overdueCount.get(c.id) ?? 0) > 0;
    }
    if (filtro === 'proximos') {
      return seg && new Date(seg.fecha_programada) >= now && new Date(seg.fecha_programada) < threeDays;
    }
    if (filtro === 'completados') {
      const allSeg = seguimientos.filter(s => s.cotizacion_id === c.id);
      return allSeg.length > 0 && allSeg.every(s => s.estatus === 'completado');
    }
    return true;
  });

  // KPIs
  const kpis = {
    pendientes: seguimientos.filter(s => s.estatus === 'pendiente').length,
    vencidos: seguimientos.filter(s => s.estatus === 'pendiente' && new Date(s.fecha_programada) < now).length,
    hoy: seguimientos.filter(s => s.estatus === 'pendiente' && new Date(s.fecha_programada) >= todayStart && new Date(s.fecha_programada) < todayEnd).length,
    completados: seguimientos.filter(s => s.estatus === 'completado').length,
  };

  const openDetail = (c: CotizacionLead) => {
    setSelectedCot(c);
    setSelectedCliente(clienteMap.get(c.cliente_id) ?? null);
  };

  const generarSeguimientosCot = async (cotId: string, clienteId: string) => {
    await generarSeguimientosAutomaticos(cotId, clienteId);
    fetchData();
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img src={logoOficial} alt="La Unión Mudanzas" className="h-9 w-auto object-contain" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-lg">Seguimientos</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-border text-muted-foreground hover:text-foreground gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pendientes', value: kpis.pendientes, icon: Clock, color: 'text-yellow-400', bg: 'border-yellow-500/30' },
            { label: 'Vencidos', value: kpis.vencidos, icon: AlertTriangle, color: 'text-destructive', bg: 'border-destructive/30' },
            { label: 'Hoy', value: kpis.hoy, icon: Calendar, color: 'text-cyan-400', bg: 'border-cyan-500/30' },
            { label: 'Completados', value: kpis.completados, icon: CheckCircle2, color: 'text-green-400', bg: 'border-green-500/30' },
          ].map(k => (
            <div key={k.label} className={`bg-card border ${k.bg} rounded-xl p-4`}>
              <k.icon className={`w-5 h-5 mb-2 ${k.color}`} />
              <p className="text-2xl font-bold text-foreground">{loading ? '…' : k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por folio, cliente, ruta..."
              className="pl-10 bg-card border-border text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTRO_SEGUIMIENTO.map(f => (
              <Button
                key={f}
                size="sm"
                variant={filtro === f ? 'default' : 'outline'}
                onClick={() => setFiltro(f)}
                className={`text-xs ${filtro === f ? '' : 'border-border text-muted-foreground'}`}
              >
                {f === 'todos' ? 'Todos' : f === 'hoy' ? 'Hoy' : f === 'vencidos' ? '⚠️ Vencidos' : f === 'proximos' ? 'Próximos' : '✅ Completados'}
              </Button>
            ))}
          </div>
          <Select value={filterEstatus} onValueChange={setFilterEstatus}>
            <SelectTrigger className="w-44 h-9 text-xs border-border bg-card">
              <SelectValue placeholder="Estatus lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estatus</SelectItem>
              {LEAD_ESTADOS.map(e => (
                <SelectItem key={e} value={e}>{e.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Folio</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Ruta</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Precio</th>
                  <th className="text-left p-3 font-medium">Próx. Seguimiento</th>
                  <th className="text-left p-3 font-medium">Estatus</th>
                  <th className="text-left p-3 font-medium">Alertas</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Cargando...
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Sin resultados
                    </td>
                  </tr>
                )}
                {!loading && filtered.map(c => {
                  const cli = clienteMap.get(c.cliente_id);
                  const seg = nextSeg.get(c.id);
                  const overdue = overdueCount.get(c.id) ?? 0;
                  const hasSeg = seguimientos.some(s => s.cotizacion_id === c.id);
                  const isPaid = c.estatus === 'confirmado' || c.estatus === 'apartado';

                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-foreground truncate max-w-[150px]">{cli?.nombre_completo ?? '—'}</p>
                        {cli?.whatsapp && <p className="text-[10px] text-muted-foreground">{cli.whatsapp}</p>}
                      </td>
                      <td className="p-3 text-foreground font-mono text-xs">{c.folio ?? c.id.slice(0, 8)}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell truncate max-w-[180px]">{c.origen} → {c.destino}</td>
                      <td className="p-3 text-foreground hidden lg:table-cell">{fmt(c.precio_total)}</td>
                      <td className="p-3">
                        {seg ? (
                          <span className={`text-xs ${new Date(seg.fecha_programada) < now ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                            {fmtDateTime(seg.fecha_programada)}
                          </span>
                        ) : hasSeg ? (
                          <span className="text-xs text-green-400">✅ Todos completados</span>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-xs h-6 text-primary" onClick={() => generarSeguimientosCot(c.id, c.cliente_id)}>
                            <Plus className="w-3 h-3 mr-1" /> Generar
                          </Button>
                        )}
                      </td>
                      <td className="p-3"><EstatusBadge value={c.estatus} /></td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {overdue > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                              {overdue} vencido{overdue > 1 ? 's' : ''}
                            </span>
                          )}
                          {isPaid && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                              💰 Pagó
                            </span>
                          )}
                          {c.estatus === 'perdido' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted/40 text-muted-foreground border border-border">
                              Perdido
                            </span>
                          )}
                          {c.estatus === 'interesado' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                              🔥 Caliente
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          {cli?.whatsapp && (
                            <a href={buildWhatsAppLink('seguimiento_1', {
                              folio: c.folio ?? c.id.slice(0, 8),
                              nombre: cli.nombre_completo,
                              origen: c.origen ?? '',
                              destino: c.destino ?? '',
                            }, `52${cli.whatsapp}`)} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400">
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => openDetail(c)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LeadDetailModal
        cotizacion={selectedCot}
        cliente={selectedCliente}
        onClose={() => { setSelectedCot(null); setSelectedCliente(null); }}
        onRefresh={() => { fetchData(); setSelectedCot(null); setSelectedCliente(null); }}
      />
    </div>
  );
}
