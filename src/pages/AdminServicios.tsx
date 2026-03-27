/**
 * /admin/servicios — Service Tracking with full Expediente
 * La Unión Mudanzas — Full operational service lifecycle
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Truck, Search, RefreshCw,
  MapPin, Calendar, Package, CreditCard,
  CheckCircle2, ArrowRight, ChevronRight,
  FileText, MessageCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logoOficial from '@/assets/logo-oficial.png';
import ExpedienteServicio from '@/components/admin/ExpedienteServicio';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Servicio {
  id: string;
  folio: string | null;
  cotizacion_id: string;
  estatus: string | null;
  pdf_url: string | null;
  created_at: string;
  proveedor_id: string | null;
  aceptado_proveedor: boolean;
  origen_asignacion: string | null;
  evidencias_carga: boolean;
  evidencias_entrega: boolean;
  pago_completo: boolean;
  cotizaciones: {
    origen: string | null;
    destino: string | null;
    precio_total: number | null;
    modalidad: string | null;
    fecha_salida: string | null;
    fecha_llegada: string | null;
    cliente_id: string;
    estatus: string | null;
    urgencia: boolean;
  } | null;
  proveedores?: { nombre_comercial: string } | null;
}

interface Expediente {
  id: string;
  estatus: string | null;
  comprobante_pago_url: string | null;
  poliza_seguro_url: string | null;
}

const SERVICE_TIMELINE = [
  { key: 'cotizado',         label: 'Cotización',       icon: FileText },
  { key: 'pendiente_pago',   label: 'Pago',             icon: CreditCard },
  { key: 'asignado',         label: 'Asignado',         icon: FileText },
  { key: 'confirmado',       label: 'Confirmado',       icon: CheckCircle2 },
  { key: 'programado',       label: 'Programado',       icon: Calendar },
  { key: 'cargando',         label: 'Cargando',         icon: Package },
  { key: 'en_ruta',          label: 'En Ruta',          icon: Truck },
  { key: 'entregado',        label: 'Entregado',        icon: MapPin },
  { key: 'finalizado',       label: 'Finalizado',       icon: CheckCircle2 },
];

const ESTATUS_ORDER = SERVICE_TIMELINE.map(s => s.key);

const ESTATUS_COLORS: Record<string, string> = {
  cotizado:       'bg-muted/40 text-muted-foreground border-border',
  pendiente_pago: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  confirmado:     'bg-green-500/15 text-green-400 border-green-500/30',
  programado:     'bg-blue-400/15 text-blue-400 border-blue-400/30',
  cargando:       'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  en_ruta:        'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  entregado:      'bg-primary/15 text-primary border-primary/30',
  finalizado:     'bg-green-600/15 text-green-300 border-green-600/30',
  cancelado:      'bg-destructive/15 text-destructive border-destructive/30',
  incidencia:     'bg-destructive/15 text-destructive border-destructive/30',
};

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString('es-MX')}` : '—';
const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

function EstatusBadge({ value }: { value: string | null }) {
  const v = value ?? 'cotizado';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ESTATUS_COLORS[v] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {v.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Timeline Component ─────────────────────────────────────────────────── */
function ServiceTimeline({ estatus }: { estatus: string | null }) {
  const currentIdx = ESTATUS_ORDER.indexOf(estatus ?? 'cotizado');

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {SERVICE_TIMELINE.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const pending = idx > currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex flex-col items-center gap-1 ${pending ? 'opacity-30' : ''}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                active
                  ? 'border-primary bg-primary/20 shadow-[0_0_8px_hsl(185,100%,50%/0.4)]'
                  : done
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-border bg-muted/20'
              }`}>
                <step.icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : done ? 'text-green-400' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-[9px] font-medium whitespace-nowrap ${active ? 'text-primary' : done ? 'text-green-400' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {idx < SERVICE_TIMELINE.length - 1 && (
              <div className={`w-4 h-0.5 mb-3 flex-shrink-0 transition-all ${done ? 'bg-green-500/50' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Service Detail Modal ───────────────────────────────────────────────── */
function ServicioDetail({
  servicio,
  onClose,
  onUpdate,
}: {
  servicio: Servicio | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingEstatus, setUpdatingEstatus] = useState(false);
  const [localEstatus, setLocalEstatus] = useState<string>('');

  useEffect(() => {
    if (!servicio) return;
    setLocalEstatus(servicio.estatus ?? 'cotizado');
    setLoading(true);
    supabase
      .from('expedientes_servicio')
      .select('*')
      .eq('orden_servicio_id', servicio.id)
      .maybeSingle()
      .then(({ data }) => {
        setExpediente(data as Expediente | null);
        setLoading(false);
      });
  }, [servicio]);

  const updateEstatus = async (estatus: string) => {
    if (!servicio) return;
    setUpdatingEstatus(true);
    await supabase.from('ordenes_servicio').update({ estatus }).eq('id', servicio.id);
    // Sync evento calendario
    await supabase.from('eventos_calendario')
      .update({ estatus, color: {
        confirmado: '#22c55e', en_ruta: '#3b82f6', finalizado: '#111827',
        cancelado: '#ef4444', cotizado: '#6b7280',
      }[estatus] ?? '#6b7280' })
      .eq('cotizacion_id', servicio.cotizacion_id);
    setLocalEstatus(estatus);
    setUpdatingEstatus(false);
    onUpdate();
  };

  if (!servicio) return null;
  const cot = servicio.cotizaciones;

  return (
    <Dialog open={!!servicio} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Truck className="w-5 h-5 text-primary" />
            Servicio — {servicio.folio ?? servicio.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Timeline */}
          <div className="bg-background border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Progreso del servicio</p>
            <ServiceTimeline estatus={localEstatus} />
          </div>

          {/* Route & details */}
          {cot && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Origen',     value: cot.origen },
                { label: 'Destino',    value: cot.destino },
                { label: 'Modalidad',  value: cot.modalidad },
                { label: 'Precio',     value: fmt(cot.precio_total) },
                { label: 'Fecha carga', value: fmtDate(cot.fecha_salida) },
                { label: 'Entrega est.', value: fmtDate(cot.fecha_llegada) },
              ].map(f => (
                <div key={f.label} className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">{f.label}</p>
                  <p className="font-medium text-foreground text-sm">{f.value ?? '—'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status update */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Actualizar estatus:</span>
            <Select value={localEstatus} onValueChange={updateEstatus} disabled={updatingEstatus}>
              <SelectTrigger className="w-[200px] bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {[...ESTATUS_ORDER, 'cancelado', 'incidencia'].map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {updatingEstatus && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
          </div>

          {/* Expediente */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Expediente
            </h4>
            {loading ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : !expediente ? (
              <p className="text-xs text-muted-foreground italic">Sin expediente generado</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Estatus expediente</p>
                  <EstatusBadge value={expediente.estatus} />
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Comprobante de pago</p>
                  {expediente.comprobante_pago_url
                    ? <a href={expediente.comprobante_pago_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Ver comprobante</a>
                    : <span className="text-xs text-muted-foreground">—</span>
                  }
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Póliza de seguro</p>
                  {expediente.poliza_seguro_url
                    ? <a href={expediente.poliza_seguro_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Ver póliza</a>
                    : <span className="text-xs text-muted-foreground">—</span>
                  }
                </div>
                {servicio.pdf_url && (
                  <div className="bg-background border border-border rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">Orden PDF</p>
                    <a href={servicio.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Descargar PDF</a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminServicios() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('todos');
  const [selected, setSelected] = useState<Servicio | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ordenes_servicio')
      .select(`
        id, folio, estatus, pdf_url, created_at, cotizacion_id,
        proveedor_id, aceptado_proveedor, origen_asignacion,
        evidencias_carga, evidencias_entrega, pago_completo,
        cotizaciones(origen, destino, precio_total, modalidad, fecha_salida, fecha_llegada, cliente_id, estatus, urgencia, volumen_cobrable, unidad_sugerida, folio),
        clientes:cotizaciones(clientes(nombre_completo, whatsapp, correo)),
        proveedores(nombre_comercial)
      `)
      .order('created_at', { ascending: false });
    if (data) setServicios(data as Servicio[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const q = search.toLowerCase();
  const filtered = servicios.filter(s => {
    const matchSearch = [
      s.folio, s.estatus,
      s.cotizaciones?.origen, s.cotizaciones?.destino,
      s.cotizaciones?.modalidad,
    ].some(v => v?.toLowerCase().includes(q));
    const matchEstatus = filterEstatus === 'todos' || s.estatus === filterEstatus;
    return matchSearch && matchEstatus;
  });

  const stats = [
    { label: 'Total',         value: servicios.length,                                              color: 'text-foreground' },
    { label: 'En ruta',       value: servicios.filter(s => s.estatus === 'en_ruta').length,         color: 'text-cyan-400' },
    { label: 'Confirmados',   value: servicios.filter(s => s.estatus === 'confirmado').length,      color: 'text-green-400' },
    { label: 'Pendiente pago',value: servicios.filter(s => s.estatus === 'pendiente_pago').length,  color: 'text-orange-400' },
    { label: 'Incidencia',    value: servicios.filter(s => s.estatus === 'incidencia').length,      color: 'text-destructive' },
  ];

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
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-lg">Admin /</span>
              <Truck className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-cyan-400 text-lg">Servicios</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="border-border text-muted-foreground hover:text-foreground gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className={`text-2xl font-black ${s.color}`}>{loading ? '…' : s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar folio, origen o destino..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={filterEstatus} onValueChange={setFilterEstatus}>
            <SelectTrigger className="w-[190px] bg-card border-border">
              <SelectValue placeholder="Estatus" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="todos">Todos</SelectItem>
              {[...ESTATUS_ORDER, 'cancelado', 'incidencia'].map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground self-center">{filtered.length} servicios</span>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-32" />
          ))}

          {!loading && filtered.map(s => {
            const cot = s.cotizaciones;
            return (
              <motion.div
                key={s.id}
                layout
                whileHover={{ scale: 1.005 }}
                className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all duration-200"
                onClick={() => setSelected(s)}
              >
                <div className="flex flex-col gap-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-foreground text-sm">{s.folio ?? s.id.slice(0, 12)}</p>
                        {cot && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {cot.origen} <ArrowRight className="w-3 h-3" /> {cot.destino}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <EstatusBadge value={s.estatus} />
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Mini timeline */}
                  <div className="overflow-x-auto">
                    <ServiceTimeline estatus={s.estatus} />
                  </div>

                  {/* Footer */}
                  {cot && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {fmt(cot.precio_total)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(cot.fecha_salida)}
                      </span>
                      {cot.modalidad && <span>{cot.modalidad}</span>}
                      {cot.urgencia && (
                        <span className="text-orange-400 font-semibold">⚡ Urgente</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No se encontraron servicios</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Truck className="w-5 h-5 text-primary" />
                  Expediente — {selected.folio ?? selected.id.slice(0, 8)}
                </DialogTitle>
              </DialogHeader>
              <ExpedienteServicio
                servicio={selected as any}
                onClose={() => setSelected(null)}
                onUpdate={fetchData}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
