/**
 * /admin/dashboard — Centro de Operaciones
 * La Unión Mudanzas — Unified admin dashboard
 * Cotizaciones · Servicios · Pagos · Clientes · Calendario
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, RefreshCw, Search,
  ClipboardList, Truck, CreditCard, Users, CalendarDays,
  ChevronRight, ArrowRight, MapPin, Calendar, Package,
  CheckCircle2, FileText, Phone, Mail, AlertCircle,
  TrendingUp, Eye, MessageCircle, XCircle, Filter,
  DollarSign, BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CalendarioOperativo from '@/components/admin/CalendarioOperativo';
import logoOficial from '@/assets/logo-oficial.png';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Tab = 'cotizaciones' | 'servicios' | 'pagos' | 'clientes' | 'calendario';

interface Cotizacion {
  id: string; folio: string | null; created_at: string;
  origen: string | null; destino: string | null;
  precio_total: number | null; estatus: string | null;
  modalidad: string | null; urgencia: boolean;
  volumen_cobrable: number | null; unidad_sugerida: string | null;
  fecha_salida: string | null;
  clientes: { nombre_completo: string; whatsapp: string | null; correo: string | null } | null;
}

interface Servicio {
  id: string; folio: string | null; estatus: string | null;
  created_at: string; cotizacion_id: string; pdf_url: string | null;
  cotizaciones: {
    origen: string | null; destino: string | null;
    precio_total: number | null; modalidad: string | null;
    fecha_salida: string | null; volumen_cobrable: number | null;
    clientes: { nombre_completo: string; whatsapp: string | null } | null;
  } | null;
}

interface Pago {
  id: string; monto: number | null; tipo_pago: string | null;
  metodo_pago: string | null; estatus: string | null;
  created_at: string; referencia: string | null;
  cotizacion_id: string | null;
  clientes: { nombre_completo: string; whatsapp: string | null } | null;
}

interface Cliente {
  id: string; nombre_completo: string; whatsapp: string | null;
  correo: string | null; direccion_principal: string | null;
  created_at: string; notas: string | null;
}

interface EventoCalendario {
  id: string; titulo: string | null; fecha_inicio: string | null;
  fecha_fin: string | null; estatus: string | null; color: string | null;
  cotizacion_id: string | null; cliente_id: string | null;
  observaciones: string | null; proveedor_id: string | null; created_at: string;
  cotizaciones?: {
    origen: string | null; destino: string | null; precio_total: number | null;
    modalidad: string | null; volumen_cobrable: number | null;
    unidad_sugerida: string | null; folio: string | null;
  } | null;
  clientes?: { nombre_completo: string; whatsapp: string | null } | null;
  proveedores?: { nombre_comercial: string } | null;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ESTATUS_COT = ['todos','nuevo','cotizado','seguimiento','pendiente_pago','confirmado','cancelado'];
const ESTATUS_SVC = ['todos','cotizado','pendiente_pago','confirmado','programado','cargando','en_ruta','entregado','finalizado','cancelado'];
const ESTATUS_PAG = ['todos','pendiente','completado','fallido','reembolsado'];

const BADGE_COLORS: Record<string, string> = {
  // cotizaciones
  nuevo:           'bg-muted/40 text-muted-foreground border-border',
  cotizado:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  seguimiento:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  pendiente_pago:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
  confirmado:      'bg-green-500/15 text-green-400 border-green-500/30',
  cancelado:       'bg-destructive/15 text-destructive border-destructive/30',
  // servicios
  programado:      'bg-blue-400/15 text-blue-400 border-blue-400/30',
  cargando:        'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  en_ruta:         'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  entregado:       'bg-primary/15 text-primary border-primary/30',
  finalizado:      'bg-green-600/15 text-green-300 border-green-600/30',
  incidencia:      'bg-destructive/15 text-destructive border-destructive/30',
  // pagos
  pendiente:       'bg-orange-500/15 text-orange-400 border-orange-500/30',
  completado:      'bg-green-500/15 text-green-400 border-green-500/30',
  fallido:         'bg-destructive/15 text-destructive border-destructive/30',
  reembolsado:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

function Badge({ value }: { value: string | null }) {
  const v = value ?? 'nuevo';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${BADGE_COLORS[v] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {v.replace(/_/g, ' ')}
    </span>
  );
}

const fmt  = (n: number | null) => n != null ? `$${n.toLocaleString('es-MX')}` : '—';
const fmtD = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── Cotizacion Detail Modal ─────────────────────────────────────────────── */
function CotizacionDetail({ cot, onClose, onUpdate }: {
  cot: Cotizacion | null; onClose: () => void; onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [localEstatus, setLocalEstatus] = useState('');

  useEffect(() => {
    if (cot) setLocalEstatus(cot.estatus ?? 'nuevo');
  }, [cot]);

  const updateEstatus = async (estatus: string) => {
    if (!cot) return;
    setSaving(true);
    await supabase.from('cotizaciones').update({ estatus }).eq('id', cot.id);
    setLocalEstatus(estatus);
    setSaving(false);
    onUpdate();
  };

  const convertToServicio = async () => {
    if (!cot) return;
    setSaving(true);
    // Create orden_servicio
    const { data: ord } = await supabase.from('ordenes_servicio').insert({
      cotizacion_id: cot.id,
      estatus: 'confirmado',
    }).select().single();
    if (ord) {
      await supabase.from('cotizaciones').update({ estatus: 'confirmado', cliente_acepto: true }).eq('id', cot.id);
      // Create calendario event
      await supabase.from('eventos_calendario').upsert({
        cotizacion_id: cot.id,
        titulo: `${ord.folio ?? cot.folio} · ${cot.origen} → ${cot.destino}`,
        fecha_inicio: cot.fecha_salida ? `${cot.fecha_salida}T09:00:00` : new Date().toISOString(),
        estatus: 'confirmado',
        color: '#22c55e',
        cliente_id: null,
      }, { onConflict: 'cotizacion_id' });
      setLocalEstatus('confirmado');
      onUpdate();
    }
    setSaving(false);
  };

  if (!cot) return null;
  const cli = cot.clientes;

  return (
    <Dialog open={!!cot} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ClipboardList className="w-5 h-5 text-primary" />
            {cot.folio ?? cot.id.slice(0, 10)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Client */}
          {cli && (
            <div className="bg-background border border-border rounded-xl p-3 flex items-start gap-3">
              <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{cli.nombre_completo}</p>
                {cli.whatsapp && (
                  <a href={`https://wa.me/52${cli.whatsapp}`} target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />{cli.whatsapp}
                  </a>
                )}
                {cli.correo && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Mail className="w-3 h-3" />{cli.correo}</p>}
              </div>
            </div>
          )}

          {/* Route & details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Origen',      value: cot.origen },
              { label: 'Destino',     value: cot.destino },
              { label: 'Modalidad',   value: cot.modalidad },
              { label: 'Precio',      value: fmt(cot.precio_total) },
              { label: 'Volumen',     value: cot.volumen_cobrable ? `${cot.volumen_cobrable} m³` : null },
              { label: 'Fecha carga', value: fmtD(cot.fecha_salida) },
            ].map(f => (
              <div key={f.label} className="bg-background border border-border rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground">{f.label}</p>
                <p className="font-medium text-foreground text-sm">{f.value ?? '—'}</p>
              </div>
            ))}
          </div>

          {/* Status + actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Estatus:</span>
              <Select value={localEstatus} onValueChange={updateEstatus} disabled={saving}>
                <SelectTrigger className="w-[170px] bg-background border-border h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ESTATUS_COT.filter(e => e !== 'todos').map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cli?.whatsapp && (
              <a href={`https://wa.me/52${cli.whatsapp}?text=${encodeURIComponent(`Hola ${cli.nombre_completo}, seguimiento cotización ${cot.folio ?? ''}\nRuta: ${cot.origen} → ${cot.destino}\nTotal: ${fmt(cot.precio_total)}`)}`}
                target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1.5 text-xs h-8">
                  <MessageCircle className="w-3.5 h-3.5" />Seguimiento WA
                </Button>
              </a>
            )}
            {localEstatus !== 'confirmado' && localEstatus !== 'cancelado' && (
              <Button size="sm" onClick={convertToServicio} disabled={saving}
                className="bg-primary text-primary-foreground gap-1.5 text-xs h-8">
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                Convertir a servicio
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Servicio Detail Modal ───────────────────────────────────────────────── */
function ServicioDetail({ svc, onClose, onUpdate }: {
  svc: Servicio | null; onClose: () => void; onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [localEstatus, setLocalEstatus] = useState('');

  useEffect(() => {
    if (svc) setLocalEstatus(svc.estatus ?? 'confirmado');
  }, [svc]);

  const updateEstatus = async (estatus: string) => {
    if (!svc) return;
    setSaving(true);
    await supabase.from('ordenes_servicio').update({ estatus }).eq('id', svc.id);
    await supabase.from('eventos_calendario').update({
      estatus,
      color: { confirmado: '#22c55e', en_ruta: '#3b82f6', finalizado: '#111827', cancelado: '#ef4444' }[estatus] ?? '#6b7280',
    }).eq('cotizacion_id', svc.cotizacion_id);
    setLocalEstatus(estatus);
    setSaving(false);
    onUpdate();
  };

  if (!svc) return null;
  const cot = svc.cotizaciones;
  const cli = cot?.clientes;

  return (
    <Dialog open={!!svc} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Truck className="w-5 h-5 text-primary" />
            {svc.folio ?? svc.id.slice(0, 10)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {cli && (
            <div className="bg-background border border-border rounded-xl p-3 flex items-center gap-3">
              <Users className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{cli.nombre_completo}</p>
                {cli.whatsapp && <p className="text-xs text-muted-foreground">{cli.whatsapp}</p>}
              </div>
            </div>
          )}
          {cot && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Origen',     value: cot.origen },
                { label: 'Destino',    value: cot.destino },
                { label: 'Modalidad',  value: cot.modalidad },
                { label: 'Precio',     value: fmt(cot.precio_total) },
                { label: 'Volumen',    value: cot.volumen_cobrable ? `${cot.volumen_cobrable} m³` : null },
                { label: 'Fecha carga',value: fmtD(cot.fecha_salida) },
              ].map(f => (
                <div key={f.label} className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">{f.label}</p>
                  <p className="font-medium text-foreground text-sm">{f.value ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Estatus:</span>
              <Select value={localEstatus} onValueChange={updateEstatus} disabled={saving}>
                <SelectTrigger className="w-[170px] bg-background border-border h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ESTATUS_SVC.filter(e => e !== 'todos').map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
            </div>
            {svc.pdf_url && (
              <a href={svc.pdf_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="border-border text-muted-foreground gap-1.5 text-xs h-8">
                  <FileText className="w-3.5 h-3.5" />PDF Orden
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('cotizaciones');
  const [search, setSearch] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('todos');
  const [loading, setLoading] = useState(false);

  // data
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);

  // modals
  const [selectedCot, setSelectedCot] = useState<Cotizacion | null>(null);
  const [selectedSvc, setSelectedSvc] = useState<Servicio | null>(null);

  /* ── Auth guard ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  /* ── Fetch ───────────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [c, s, p, cl, ev] = await Promise.all([
      supabase.from('cotizaciones')
        .select('id,folio,created_at,origen,destino,precio_total,estatus,modalidad,urgencia,volumen_cobrable,unidad_sugerida,fecha_salida,clientes(nombre_completo,whatsapp,correo)')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('ordenes_servicio')
        .select('id,folio,estatus,created_at,cotizacion_id,pdf_url,cotizaciones(origen,destino,precio_total,modalidad,fecha_salida,volumen_cobrable,clientes(nombre_completo,whatsapp))')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('pagos')
        .select('id,monto,tipo_pago,metodo_pago,estatus,created_at,referencia,cotizacion_id,clientes(nombre_completo,whatsapp)')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('clientes')
        .select('id,nombre_completo,whatsapp,correo,direccion_principal,created_at,notas')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('eventos_calendario')
        .select('id,titulo,fecha_inicio,fecha_fin,estatus,color,cotizacion_id,cliente_id,observaciones,proveedor_id,created_at,cotizaciones(origen,destino,precio_total,modalidad,volumen_cobrable,unidad_sugerida,folio),clientes(nombre_completo,whatsapp)')
        .order('fecha_inicio', { ascending: true }).limit(500),
    ]);
    if (c.data) setCotizaciones(c.data as Cotizacion[]);
    if (s.data) setServicios(s.data as Servicio[]);
    if (p.data) setPagos(p.data as Pago[]);
    if (cl.data) setClientes(cl.data as Cliente[]);
    if (ev.data) setEventos(ev.data as EventoCalendario[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin, fetchData]);

  /* ── Filtered lists ──────────────────────────────────────────────────────── */
  const q = search.toLowerCase();

  const filteredCot = cotizaciones.filter(c => {
    const matchQ = [c.folio, c.origen, c.destino, c.estatus, c.clientes?.nombre_completo, c.clientes?.whatsapp]
      .some(v => v?.toLowerCase().includes(q));
    const matchE = filterEstatus === 'todos' || c.estatus === filterEstatus;
    return matchQ && matchE;
  });

  const filteredSvc = servicios.filter(s => {
    const matchQ = [s.folio, s.estatus, s.cotizaciones?.origen, s.cotizaciones?.destino, s.cotizaciones?.clientes?.nombre_completo]
      .some(v => v?.toLowerCase().includes(q));
    const matchE = filterEstatus === 'todos' || s.estatus === filterEstatus;
    return matchQ && matchE;
  });

  const filteredPag = pagos.filter(p => {
    const matchQ = [p.clientes?.nombre_completo, p.tipo_pago, p.metodo_pago, p.referencia, p.estatus]
      .some(v => v?.toLowerCase().includes(q));
    const matchE = filterEstatus === 'todos' || p.estatus === filterEstatus;
    return matchQ && matchE;
  });

  const filteredCli = clientes.filter(c =>
    [c.nombre_completo, c.whatsapp, c.correo, c.direccion_principal].some(v => v?.toLowerCase().includes(q))
  );

  /* ── Stats ───────────────────────────────────────────────────────────────── */
  const totalFacturado = pagos
    .filter(p => p.estatus === 'completado')
    .reduce((a, p) => a + (p.monto ?? 0), 0);

  const stats = [
    { id: 'cotizaciones' as Tab, label: 'Cotizaciones', value: cotizaciones.length, icon: ClipboardList, sub: `${cotizaciones.filter(c => c.estatus === 'nuevo' || c.estatus === 'cotizado').length} nuevas`, color: 'text-blue-400', accent: 'border-blue-500/30 bg-blue-500/5' },
    { id: 'servicios'    as Tab, label: 'Servicios',    value: servicios.length,    icon: Truck,         sub: `${servicios.filter(s => s.estatus === 'en_ruta').length} en ruta`,   color: 'text-cyan-400', accent: 'border-cyan-500/30 bg-cyan-500/5' },
    { id: 'pagos'        as Tab, label: 'Cobrado',       value: fmt(totalFacturado), icon: DollarSign,    sub: `${pagos.filter(p => p.estatus === 'pendiente').length} pendientes`, color: 'text-green-400', accent: 'border-green-500/30 bg-green-500/5' },
    { id: 'clientes'     as Tab, label: 'Clientes',      value: clientes.length,     icon: Users,         sub: 'registrados',                                                       color: 'text-primary',   accent: 'border-primary/30 bg-primary/5' },
    { id: 'calendario'   as Tab, label: 'Calendario',    value: eventos.filter(e => {
      if (!e.fecha_inicio) return false;
      const d = new Date(e.fecha_inicio);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length, icon: CalendarDays, sub: 'este mes', color: 'text-accent', accent: 'border-accent/30 bg-accent/5' },
  ];

  const TABS = [
    { id: 'cotizaciones' as Tab, label: 'Cotizaciones', icon: ClipboardList },
    { id: 'servicios'    as Tab, label: 'Servicios',    icon: Truck },
    { id: 'pagos'        as Tab, label: 'Pagos',         icon: CreditCard },
    { id: 'clientes'     as Tab, label: 'Clientes',      icon: Users },
    { id: 'calendario'   as Tab, label: 'Calendario',    icon: CalendarDays },
  ];

  const FILTER_OPTIONS: Record<Tab, string[]> = {
    cotizaciones: ESTATUS_COT,
    servicios:    ESTATUS_SVC,
    pagos:        ESTATUS_PAG,
    clientes:     ['todos'],
    calendario:   ['todos'],
  };

  const onTabChange = (t: Tab) => { setTab(t); setSearch(''); setFilterEstatus('todos'); };

  /* ── Loading / guard ──────────────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img src={logoOficial} alt="La Unión Mudanzas" className="h-9 w-auto object-contain" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-lg">Centro de Operaciones</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}
            className="border-border text-muted-foreground hover:text-foreground gap-2 self-start sm:self-auto">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {stats.map(s => (
            <motion.button key={s.id} onClick={() => onTabChange(s.id)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`bg-card border rounded-2xl p-4 text-left transition-all duration-200 ${
                tab === s.id ? `${s.accent} shadow-[0_0_20px_hsl(var(--primary)/0.08)]` : 'border-border hover:border-border/80'
              }`}>
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <p className="text-2xl font-black text-foreground">{loading ? '…' : s.value}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
            </motion.button>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex bg-card border border-border rounded-xl p-1 gap-1 flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => onTabChange(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}>
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Search + filter */}
          {tab !== 'calendario' && (
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-card border-border h-10" />
              </div>
              {FILTER_OPTIONS[tab].length > 1 && (
                <Select value={filterEstatus} onValueChange={setFilterEstatus}>
                  <SelectTrigger className="w-[160px] bg-card border-border h-10">
                    <SelectValue placeholder="Estatus" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {FILTER_OPTIONS[tab].map(s => (
                      <SelectItem key={s} value={s} className="text-xs">{s === 'todos' ? 'Todos' : s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

            {/* COTIZACIONES */}
            {tab === 'cotizaciones' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{filteredCot.length} cotizaciones</p>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl h-20 animate-pulse" />
                ))}
                {!loading && filteredCot.map(c => (
                  <motion.div key={c.id} whileHover={{ scale: 1.002 }} onClick={() => setSelectedCot(c)}
                    className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-foreground text-sm">{c.folio ?? c.id.slice(0, 10)}</p>
                          <Badge value={c.estatus} />
                          {c.urgencia && <span className="text-orange-400 text-xs font-semibold">⚡ Urgente</span>}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {c.origen} <ArrowRight className="w-3 h-3" /> {c.destino}
                        </p>
                        {c.clientes && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" />{c.clientes.nombre_completo}
                            {c.clientes.whatsapp && <span>· {c.clientes.whatsapp}</span>}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="font-bold text-foreground text-sm">{fmt(c.precio_total)}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtD(c.fecha_salida)}</p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {!loading && filteredCot.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Sin cotizaciones</p>
                  </div>
                )}
              </div>
            )}

            {/* SERVICIOS */}
            {tab === 'servicios' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{filteredSvc.length} servicios</p>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl h-20 animate-pulse" />
                ))}
                {!loading && filteredSvc.map(s => (
                  <motion.div key={s.id} whileHover={{ scale: 1.002 }} onClick={() => setSelectedSvc(s)}
                    className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                          <p className="font-bold text-foreground text-sm">{s.folio ?? s.id.slice(0, 10)}</p>
                          <Badge value={s.estatus} />
                        </div>
                        {s.cotizaciones && (
                          <>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {s.cotizaciones.origen} <ArrowRight className="w-3 h-3" /> {s.cotizaciones.destino}
                            </p>
                            {s.cotizaciones.clientes && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Users className="w-3 h-3" />{s.cotizaciones.clientes.nombre_completo}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="font-bold text-foreground text-sm">{fmt(s.cotizaciones?.precio_total ?? null)}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtD(s.cotizaciones?.fecha_salida ?? null)}</p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {!loading && filteredSvc.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Truck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Sin servicios</p>
                  </div>
                )}
              </div>
            )}

            {/* PAGOS */}
            {tab === 'pagos' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">{filteredPag.length} registros</p>
                  <p className="text-xs font-semibold text-green-400">
                    Total cobrado: {fmt(filteredPag.filter(p => p.estatus === 'completado').reduce((a, p) => a + (p.monto ?? 0), 0))}
                  </p>
                </div>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl h-16 animate-pulse" />
                ))}
                {!loading && filteredPag.map(p => (
                  <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <CreditCard className={`w-4 h-4 flex-shrink-0 ${p.estatus === 'completado' ? 'text-green-400' : 'text-muted-foreground'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-foreground text-sm">{fmt(p.monto)}</p>
                            <Badge value={p.estatus} />
                            {p.tipo_pago && (
                              <span className="text-[10px] bg-muted/40 border border-border px-1.5 py-0.5 rounded-full text-muted-foreground">
                                {p.tipo_pago.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          {p.clientes && (
                            <p className="text-xs text-muted-foreground mt-0.5">{p.clientes.nombre_completo}</p>
                          )}
                          {p.metodo_pago && (
                            <p className="text-[10px] text-muted-foreground">{p.metodo_pago} · {fmtD(p.created_at)}</p>
                          )}
                        </div>
                      </div>
                      {p.clientes?.whatsapp && (
                        <a href={`https://wa.me/52${p.clientes.whatsapp}?text=${encodeURIComponent(`Hola ${p.clientes.nombre_completo}, recordatorio de pago por ${fmt(p.monto)}`)}`}
                          target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10 h-7 w-7 p-0">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {!loading && filteredPag.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Sin pagos registrados</p>
                  </div>
                )}
              </div>
            )}

            {/* CLIENTES */}
            {tab === 'clientes' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{filteredCli.length} clientes</p>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl h-16 animate-pulse" />
                ))}
                {!loading && filteredCli.map(c => (
                  <div key={c.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-sm font-bold">{c.nombre_completo.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm">{c.nombre_completo}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                            {c.whatsapp && (
                              <a href={`https://wa.me/52${c.whatsapp}`} target="_blank" rel="noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Phone className="w-3 h-3" />{c.whatsapp}
                              </a>
                            )}
                            {c.correo && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />{c.correo}
                              </p>
                            )}
                          </div>
                          {c.direccion_principal && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{c.direccion_principal}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex-shrink-0">{fmtD(c.created_at)}</p>
                    </div>
                  </div>
                ))}
                {!loading && filteredCli.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Sin clientes registrados</p>
                  </div>
                )}
              </div>
            )}

            {/* CALENDARIO */}
            {tab === 'calendario' && (
              <CalendarioOperativo eventos={eventos} onRefresh={fetchData} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <CotizacionDetail cot={selectedCot} onClose={() => setSelectedCot(null)} onUpdate={fetchData} />
      <ServicioDetail   svc={selectedSvc} onClose={() => setSelectedSvc(null)} onUpdate={fetchData} />
    </div>
  );
}
