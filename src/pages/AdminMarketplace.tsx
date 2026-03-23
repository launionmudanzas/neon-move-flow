/**
 * /admin/marketplace — Marketplace de cargas y espacios
 * La Unión Mudanzas — Internal cargo/space marketplace
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Package, Search, RefreshCw,
  MapPin, Calendar, Truck, TrendingUp, Eye, MessageSquare,
  Users, Clock, CheckCircle2, XCircle, Filter,
  ArrowRight, DollarSign, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logoOficial from '@/assets/logo-oficial.png';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Publicacion {
  id: string;
  proveedor_id: string;
  tipo_publicacion: string | null;
  origen: string | null;
  destino: string | null;
  fecha_salida: string | null;
  volumen_disponible: number | null;
  costo_ofrecido: number | null;
  estatus: string | null;
  expira_at: string | null;
  comision_app_publicador: number | null;
  comision_app_tomador: number | null;
  created_at: string;
  proveedores?: { nombre_comercial: string; premium_activo: boolean; logo_url: string | null };
}

interface Interes {
  id: string;
  publicacion_id: string;
  proveedor_interesado_id: string;
  estatus: string | null;
  created_at: string;
  proveedores?: { nombre_comercial: string };
}

interface Chat {
  id: string;
  publicacion_id: string;
  proveedor_interesado_id: string;
  proveedor_origen_id: string;
  estatus: string | null;
  contacto_desbloqueado: boolean;
  created_at: string;
}

const ESTATUS_COLORS: Record<string, string> = {
  activa:    'bg-green-500/15 text-green-400 border-green-500/30',
  expirada:  'bg-muted/30 text-muted-foreground border-border',
  asignada:  'bg-primary/15 text-primary border-primary/30',
  cancelada: 'bg-destructive/15 text-destructive border-destructive/30',
  cerrada:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString('es-MX')}` : '—';
const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const timeRemaining = (expira: string | null): string => {
  if (!expira) return '—';
  const diff = new Date(expira).getTime() - Date.now();
  if (diff <= 0) return 'Expirada';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
};

/* ── Publication Detail ─────────────────────────────────────────────────── */
function PublicacionDetail({
  publicacion,
  onClose,
}: {
  publicacion: Publicacion | null;
  onClose: () => void;
}) {
  const [intereses, setIntereses] = useState<Interes[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicacion) return;
    setLoading(true);
    Promise.all([
      supabase.from('intereses_publicacion')
        .select('*, proveedores(nombre_comercial)')
        .eq('publicacion_id', publicacion.id),
      supabase.from('chats_publicaciones')
        .select('*')
        .eq('publicacion_id', publicacion.id),
    ]).then(([i, c]) => {
      setIntereses((i.data ?? []) as Interes[]);
      setChats((c.data ?? []) as Chat[]);
      setLoading(false);
    });
  }, [publicacion]);

  const updateInteresEstatus = async (id: string, estatus: string) => {
    await supabase.from('intereses_publicacion').update({ estatus }).eq('id', id);
    setIntereses(prev => prev.map(i => i.id === id ? { ...i, estatus } : i));
  };

  if (!publicacion) return null;

  return (
    <Dialog open={!!publicacion} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Package className="w-5 h-5 text-primary" />
            Publicación — {publicacion.tipo_publicacion ?? 'Carga'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Route */}
          <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-xl">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-foreground text-sm">{publicacion.origen}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground text-sm">{publicacion.destino}</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Proveedor', value: publicacion.proveedores?.nombre_comercial },
              { label: 'Tipo', value: publicacion.tipo_publicacion },
              { label: 'Volumen disponible', value: publicacion.volumen_disponible != null ? `${publicacion.volumen_disponible} m³` : '—' },
              { label: 'Costo ofrecido', value: fmt(publicacion.costo_ofrecido) },
              { label: 'Fecha salida', value: fmtDate(publicacion.fecha_salida) },
              { label: 'Expira en', value: timeRemaining(publicacion.expira_at) },
              { label: 'Comisión publicador', value: publicacion.comision_app_publicador != null ? `${publicacion.comision_app_publicador}%` : '10%' },
              { label: 'Comisión tomador', value: publicacion.comision_app_tomador != null ? `${publicacion.comision_app_tomador}%` : '10%' },
            ].map(f => (
              <div key={f.label} className="bg-background border border-border rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground">{f.label}</p>
                <p className="font-medium text-foreground text-sm">{f.value ?? '—'}</p>
              </div>
            ))}
          </div>

          {/* Interests */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Interesados ({intereses.length})
            </h4>
            {loading && <p className="text-xs text-muted-foreground">Cargando...</p>}
            {!loading && intereses.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Sin interesados aún</p>
            )}
            {!loading && intereses.map(i => (
              <div key={i.id} className="flex items-center gap-3 p-2.5 bg-background border border-border rounded-xl text-sm mb-2">
                <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-foreground font-medium">
                  {i.proveedores?.nombre_comercial ?? i.proveedor_interesado_id.slice(0, 8)}
                </span>
                <Select
                  value={i.estatus ?? 'interesado'}
                  onValueChange={v => updateInteresEstatus(i.id, v)}
                >
                  <SelectTrigger className="h-7 w-[130px] text-xs border-border bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {['interesado', 'negociando', 'asignado', 'cerrado', 'rechazado'].map(s => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Chats */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Chats activos ({chats.length})
            </h4>
            {!loading && chats.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Sin chats</p>
            )}
            {!loading && chats.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 bg-background border border-border rounded-xl text-sm mb-2">
                <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1 text-xs text-muted-foreground">
                  Chat — {c.estatus ?? 'activo'}
                </div>
                {c.contacto_desbloqueado && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                    Contacto desbloqueado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminMarketplace() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [selected, setSelected] = useState<Publicacion | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('publicaciones_carga')
      .select('*, proveedores(nombre_comercial, premium_activo, logo_url)')
      .order('created_at', { ascending: false });
    if (data) setPublicaciones(data as Publicacion[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  // Run expiry function
  const runExpiry = async () => {
    const { data } = await supabase.rpc('expire_publicaciones_now' as never);
    await fetchData();
  };

  const q = search.toLowerCase();
  const filtered = publicaciones.filter(p => {
    const matchSearch = [p.origen, p.destino, p.tipo_publicacion, p.proveedores?.nombre_comercial]
      .some(v => v?.toLowerCase().includes(q));
    const matchEstatus = filterEstatus === 'todos' || p.estatus === filterEstatus;
    const matchTipo = filterTipo === 'todos' || p.tipo_publicacion === filterTipo;
    return matchSearch && matchEstatus && matchTipo;
  });

  const stats = [
    { label: 'Total',     value: publicaciones.length,                                    color: 'text-foreground' },
    { label: 'Activas',   value: publicaciones.filter(p => p.estatus === 'activa').length, color: 'text-green-400' },
    { label: 'Expiradas', value: publicaciones.filter(p => p.estatus === 'expirada').length, color: 'text-muted-foreground' },
    { label: 'Asignadas', value: publicaciones.filter(p => p.estatus === 'asignada').length, color: 'text-primary' },
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
              <Package className="w-4 h-4 text-green-400" />
              <span className="font-bold text-green-400 text-lg">Marketplace</span>
            </div>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={runExpiry}
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              Expirar vencidas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="border-border text-muted-foreground hover:text-foreground gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
              placeholder="Buscar origen, destino o proveedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={filterEstatus} onValueChange={setFilterEstatus}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <SelectValue placeholder="Estatus" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="todos">Todos</SelectItem>
              {['activa', 'expirada', 'asignada', 'cancelada', 'cerrada'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {['espacio_vacio', 'fraccion', 'carga_completa', 'ruta_compartible'].map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground self-center">{filtered.length} registros</span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-48" />
          ))}
          {!loading && filtered.map(p => {
            const isExpiring = p.expira_at && new Date(p.expira_at).getTime() - Date.now() < 6 * 3600000;
            return (
              <motion.div
                key={p.id}
                layout
                whileHover={{ scale: 1.01 }}
                className={`bg-card border rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 ${
                  p.estatus === 'activa' ? 'border-green-500/20 hover:border-green-500/40' : 'border-border hover:border-border/80'
                } ${isExpiring ? 'ring-1 ring-orange-500/30' : ''}`}
                onClick={() => setSelected(p)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {p.tipo_publicacion?.replace(/_/g, ' ') ?? 'Publicación'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.proveedores?.nombre_comercial ?? 'Proveedor'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 ${ESTATUS_COLORS[p.estatus ?? 'activa'] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
                    {p.estatus ?? 'activa'}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground truncate">{p.origen}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-foreground truncate">{p.destino}</span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-background border border-border rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{p.volumen_disponible != null ? `${p.volumen_disponible}` : '—'}</p>
                    <p className="text-muted-foreground">m³</p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{fmt(p.costo_ofrecido)}</p>
                    <p className="text-muted-foreground">Costo</p>
                  </div>
                  <div className={`border rounded-lg p-2 text-center ${isExpiring && p.estatus === 'activa' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-background border-border'}`}>
                    <p className={`font-bold text-xs ${isExpiring && p.estatus === 'activa' ? 'text-orange-400' : 'text-foreground'}`}>
                      {p.estatus === 'activa' ? timeRemaining(p.expira_at) : fmtDate(p.fecha_salida)}
                    </p>
                    <p className="text-muted-foreground">{p.estatus === 'activa' ? 'Expira' : 'Salida'}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs text-muted-foreground">
                  <span>{fmtDate(p.created_at)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Ver detalle
                  </span>
                </div>
              </motion.div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No se encontraron publicaciones</p>
            </div>
          )}
        </div>
      </div>

      <PublicacionDetail publicacion={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
