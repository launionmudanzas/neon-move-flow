/**
 * /admin/crm — CRM Module
 * La Unión Mudanzas — Client & leads management
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Users, Search, RefreshCw,
  Phone, Mail, MapPin, Calendar, FileText, CreditCard,
  AlertCircle, MessageSquare, ChevronDown, ChevronUp,
  Plus, Edit3, X, Check, Filter, TrendingUp, Star,
  Clock, CheckCircle2, XCircle, Truck, Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logoOficial from '@/assets/logo-oficial.png';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Cliente {
  id: string;
  nombre_completo: string;
  whatsapp: string | null;
  correo: string | null;
  direccion_principal: string | null;
  notas: string | null;
  ine_frente_url: string | null;
  ine_reverso_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Cotizacion {
  id: string;
  folio: string | null;
  origen: string | null;
  destino: string | null;
  precio_total: number | null;
  estatus: string | null;
  modalidad: string | null;
  urgencia: boolean;
  created_at: string;
  fecha_salida: string | null;
}

interface Pago {
  id: string;
  monto: number | null;
  estatus: string | null;
  metodo_pago: string | null;
  tipo_pago: string | null;
  created_at: string;
  cotizacion_id: string | null;
}

interface Incidencia {
  id: string;
  tipo_incidencia: string | null;
  descripcion: string | null;
  estatus: string | null;
  fecha_reporte: string;
  cotizacion_id: string | null;
}

interface ClienteDetail extends Cliente {
  cotizaciones: Cotizacion[];
  pagos: Pago[];
  incidencias: Incidencia[];
}

const LEAD_ESTATUS = [
  'nuevo', 'cotizado', 'seguimiento', 'pendiente_pago',
  'confirmado', 'en_ruta', 'finalizado', 'cancelado',
];

const ESTATUS_COLORS: Record<string, string> = {
  nuevo:           'bg-muted/40 text-muted-foreground border-border',
  cotizado:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  seguimiento:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  pendiente_pago:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
  confirmado:      'bg-green-500/15 text-green-400 border-green-500/30',
  en_ruta:         'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  finalizado:      'bg-primary/15 text-primary border-primary/30',
  cancelado:       'bg-destructive/15 text-destructive border-destructive/30',
};

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—';
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function EstatusBadge({ value }: { value: string | null }) {
  const v = value ?? 'nuevo';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ESTATUS_COLORS[v] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {v.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Client Detail Modal ─────────────────────────────────────────────────── */
function ClienteDetailModal({
  clienteId,
  onClose,
}: {
  clienteId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ClienteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'pagos' | 'incidencias' | 'notas'>('cotizaciones');
  const [nota, setNota] = useState('');
  const [savingNota, setSavingNota] = useState(false);

  useEffect(() => {
    if (!clienteId) { setDetail(null); return; }
    setLoading(true);
    Promise.all([
      supabase.from('clientes').select('*').eq('id', clienteId).single(),
      supabase.from('cotizaciones').select('id,folio,origen,destino,precio_total,estatus,modalidad,urgencia,created_at,fecha_salida').eq('cliente_id', clienteId).order('created_at', { ascending: false }),
      supabase.from('pagos').select('id,monto,estatus,metodo_pago,tipo_pago,created_at,cotizacion_id').eq('cliente_id', clienteId).order('created_at', { ascending: false }),
      supabase.from('incidencias').select('id,tipo_incidencia,descripcion,estatus,fecha_reporte,cotizacion_id').eq('cliente_id', clienteId).order('fecha_reporte', { ascending: false }),
    ]).then(([c, cots, pags, incs]) => {
      if (c.data) {
        setDetail({
          ...(c.data as Cliente),
          cotizaciones: (cots.data ?? []) as Cotizacion[],
          pagos: (pags.data ?? []) as Pago[],
          incidencias: (incs.data ?? []) as Incidencia[],
        });
        setNota(c.data.notas ?? '');
      }
      setLoading(false);
    });
  }, [clienteId]);

  const saveNota = async () => {
    if (!detail) return;
    setSavingNota(true);
    await supabase.from('clientes').update({ notas: nota }).eq('id', detail.id);
    setDetail(prev => prev ? { ...prev, notas: nota } : prev);
    setSavingNota(false);
  };

  const totalFacturado = detail?.pagos
    .filter(p => p.estatus === 'completado' || p.estatus === 'confirmado')
    .reduce((acc, p) => acc + (p.monto ?? 0), 0) ?? 0;

  return (
    <Dialog open={!!clienteId} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-primary" />
            {loading ? 'Cargando...' : detail?.nombre_completo}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Cargando información...
          </div>
        )}

        {detail && !loading && (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Cotizaciones', value: detail.cotizaciones.length, icon: FileText, color: 'text-blue-400' },
                { label: 'Servicios',    value: detail.cotizaciones.filter(c => c.estatus === 'confirmado' || c.estatus === 'completada').length, icon: Truck, color: 'text-green-400' },
                { label: 'Total pagado', value: fmt(totalFacturado), icon: CreditCard, color: 'text-primary' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-background border border-border rounded-xl p-3 text-center">
                  <kpi.icon className={`w-4 h-4 mx-auto mb-1 ${kpi.color}`} />
                  <p className="font-bold text-foreground text-sm">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {detail.whatsapp && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <a href={`https://wa.me/52${detail.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                    {detail.whatsapp}
                  </a>
                </div>
              )}
              {detail.correo && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{detail.correo}</span>
                </div>
              )}
              {detail.direccion_principal && (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{detail.direccion_principal}</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex bg-background border border-border rounded-xl p-1 gap-1">
              {([
                { id: 'cotizaciones', label: 'Cotizaciones', count: detail.cotizaciones.length },
                { id: 'pagos',        label: 'Pagos',        count: detail.pagos.length },
                { id: 'incidencias',  label: 'Incidencias',  count: detail.incidencias.length },
                { id: 'notas',        label: 'Notas',        count: null },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                    activeTab === t.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                  {t.count != null && t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === t.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'cotizaciones' && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detail.cotizaciones.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">Sin cotizaciones</p>
                )}
                {detail.cotizaciones.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl text-sm">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{c.folio ?? c.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.origen} → {c.destino}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <EstatusBadge value={c.estatus} />
                      <span className="text-xs text-muted-foreground">{fmt(c.precio_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pagos' && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detail.pagos.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">Sin pagos registrados</p>
                )}
                {detail.pagos.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl text-sm">
                    <CreditCard className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{fmt(p.monto)}</p>
                      <p className="text-xs text-muted-foreground">{p.metodo_pago} · {fmtDate(p.created_at)}</p>
                    </div>
                    <EstatusBadge value={p.estatus} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'incidencias' && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detail.incidencias.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">Sin incidencias</p>
                )}
                {detail.incidencias.map(i => (
                  <div key={i.id} className="flex items-start gap-3 p-3 bg-background border border-border rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{i.tipo_incidencia ?? 'Incidencia'}</p>
                      <p className="text-xs text-muted-foreground">{i.descripcion}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(i.fecha_reporte)}</p>
                    </div>
                    <EstatusBadge value={i.estatus} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notas' && (
              <div className="space-y-2">
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  rows={5}
                  placeholder="Agregar notas internas sobre este cliente..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none transition-all"
                />
                <Button
                  onClick={saveNota}
                  disabled={savingNota}
                  size="sm"
                  className="bg-primary text-primary-foreground"
                >
                  {savingNota ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Guardar nota
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminCRM() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cotStats, setCotStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cli, cots] = await Promise.all([
      supabase.from('clientes').select('*').order('created_at', { ascending: false }),
      supabase.from('cotizaciones').select('cliente_id,estatus,precio_total'),
    ]);
    if (cli.data) setClientes(cli.data as Cliente[]);

    // build stats per client
    if (cots.data) {
      const stats: Record<string, number> = {};
      for (const c of cots.data) {
        stats[c.cliente_id] = (stats[c.cliente_id] ?? 0) + 1;
      }
      setCotStats(stats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const updateNotas = async (id: string, notas: string) => {
    setUpdatingId(id);
    await supabase.from('clientes').update({ notas }).eq('id', id);
    setClientes(prev => prev.map(c => c.id === id ? { ...c, notas } : c));
    setUpdatingId(null);
  };

  // Derive "lead estatus" from notas field (we store it as JSON prefix)
  const getLeadEstatus = (c: Cliente): string => {
    if (c.notas?.startsWith('[estatus:')) {
      const m = c.notas.match(/^\[estatus:([^\]]+)\]/);
      if (m) return m[1];
    }
    return 'nuevo';
  };

  const setLeadEstatus = async (id: string, estatus: string, currentNotas: string | null) => {
    const notasRaw = currentNotas ?? '';
    const newNotas = notasRaw.startsWith('[estatus:')
      ? notasRaw.replace(/^\[estatus:[^\]]+\]/, `[estatus:${estatus}]`)
      : `[estatus:${estatus}] ${notasRaw}`;
    await updateNotas(id, newNotas.trim());
  };

  const q = search.toLowerCase();
  const filtered = clientes.filter(c => {
    const matchSearch = [c.nombre_completo, c.whatsapp, c.correo, c.direccion_principal]
      .some(v => v?.toLowerCase().includes(q));
    const matchEstatus = filterEstatus === 'todos' || getLeadEstatus(c) === filterEstatus;
    return matchSearch && matchEstatus;
  });

  const pipeline = LEAD_ESTATUS.map(s => ({
    estatus: s,
    count: clientes.filter(c => getLeadEstatus(c) === s).length,
  }));

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
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-cyan-400 text-lg">CRM</span>
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

        {/* Pipeline strip */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {pipeline.map(p => (
            <button
              key={p.estatus}
              onClick={() => setFilterEstatus(filterEstatus === p.estatus ? 'todos' : p.estatus)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                filterEstatus === p.estatus
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80'
              }`}
            >
              <span className="text-xl font-black text-foreground">{p.count}</span>
              <span>{p.estatus.replace(/_/g, ' ')}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, teléfono o correo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={filterEstatus} onValueChange={setFilterEstatus}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue placeholder="Estatus" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="todos">Todos</SelectItem>
              {LEAD_ESTATUS.map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground self-center">{filtered.length} registros</span>
        </div>

        {/* Client grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-muted/40 rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted/30 rounded w-1/2 mb-1" />
              <div className="h-3 bg-muted/30 rounded w-1/3" />
            </div>
          ))}
          {!loading && filtered.map(c => {
            const leadEstatus = getLeadEstatus(c);
            const notas = c.notas?.replace(/^\[estatus:[^\]]+\]\s*/, '') ?? '';
            return (
              <motion.div
                key={c.id}
                layout
                whileHover={{ scale: 1.01 }}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedId(c.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{c.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Alta: {fmtDate(c.created_at)}
                    </p>
                  </div>
                  <EstatusBadge value={leadEstatus} />
                </div>

                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {c.whatsapp && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {c.whatsapp}
                    </span>
                  )}
                  {c.correo && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> {c.correo}
                    </span>
                  )}
                  {c.direccion_principal && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {c.direccion_principal}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    {cotStats[c.id] ?? 0} cotizaciones
                  </span>
                  {(c.ine_frente_url || c.ine_reverso_url) && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      INE
                    </span>
                  )}
                  <div className="ml-auto" onClick={e => e.stopPropagation()}>
                    <Select
                      value={leadEstatus}
                      onValueChange={v => setLeadEstatus(c.id, v, c.notas)}
                    >
                      <SelectTrigger className="h-7 text-xs border-border bg-background w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {LEAD_ESTATUS.map(s => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {notas && (
                  <p className="text-[11px] text-muted-foreground/70 italic border-t border-border/30 pt-2 truncate">
                    📝 {notas}
                  </p>
                )}
              </motion.div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No se encontraron clientes</p>
            </div>
          )}
        </div>
      </div>

      <ClienteDetailModal clienteId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
