import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Users, ClipboardList, FileText,
  IdCard, Activity, RefreshCw, Eye, Search, ChevronDown,
  CheckCircle2, Clock, XCircle, Truck, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import logoOficial from '@/assets/logo-oficial.png';

/* ─── types ─────────────────────────────────────────────────────────────── */
type Tab = 'cotizaciones' | 'clientes' | 'ordenes' | 'ines';

interface Cotizacion {
  id: string; folio: string | null; created_at: string;
  origen: string | null; destino: string | null; precio_total: number | null;
  estatus: string | null; modalidad: string | null; urgencia: boolean;
  cliente_id: string;
}

interface Cliente {
  id: string; nombre_completo: string; whatsapp: string | null;
  correo: string | null; direccion_principal: string | null;
  ine_frente_url: string | null; ine_reverso_url: string | null;
  created_at: string;
}

interface Orden {
  id: string; folio: string | null; estatus: string | null;
  created_at: string; cotizacion_id: string; pdf_url: string | null;
  cotizaciones: { origen: string | null; destino: string | null; precio_total: number | null; cliente_id: string } | null;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
const ESTATUS_COTIZACION = ['borrador','enviada','aceptada','en_proceso','completada','cancelada'];
const ESTATUS_ORDEN      = ['generada','en_proceso','completada','cancelada'];

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function EstatusBadge({ value }: { value: string | null }) {
  const v = value ?? 'desconocido';
  const map: Record<string, string> = {
    completada: 'bg-green-500/15 text-green-400 border-green-500/30',
    aceptada:   'bg-primary/15 text-primary border-primary/30',
    en_proceso: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    enviada:    'bg-blue-400/15 text-blue-400 border-blue-400/30',
    cancelada:  'bg-destructive/15 text-destructive border-destructive/30',
    generada:   'bg-primary/15 text-primary border-primary/30',
    borrador:   'bg-muted/40 text-muted-foreground border-border',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[v] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {v}
    </span>
  );
}

/* ─── component ──────────────────────────────────────────────────────────── */
export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('cotizaciones');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // data
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);

  // modals
  const [ineModal, setIneModal] = useState<Cliente | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /* ── auth guard ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  /* ── fetch ─────────────────────────────────────────────────────────────── */
  const fetchData = async () => {
    setLoading(true);
    const [c, cl, o] = await Promise.all([
      supabase.from('cotizaciones').select('id,folio,created_at,origen,destino,precio_total,estatus,modalidad,urgencia,cliente_id').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id,nombre_completo,whatsapp,correo,direccion_principal,ine_frente_url,ine_reverso_url,created_at').order('created_at', { ascending: false }),
      supabase.from('ordenes_servicio').select('id,folio,estatus,created_at,cotizacion_id,pdf_url,cotizaciones(origen,destino,precio_total,cliente_id)').order('created_at', { ascending: false }),
    ]);
    if (c.data) setCotizaciones(c.data as Cotizacion[]);
    if (cl.data) setClientes(cl.data as Cliente[]);
    if (o.data) setOrdenes(o.data as Orden[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  /* ── update estatus ────────────────────────────────────────────────────── */
  const updateEstatusCot = async (id: string, estatus: string) => {
    setUpdatingId(id);
    await supabase.from('cotizaciones').update({ estatus }).eq('id', id);
    setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estatus } : c));
    setUpdatingId(null);
  };

  const updateEstatusOrden = async (id: string, estatus: string) => {
    setUpdatingId(id);
    await supabase.from('ordenes_servicio').update({ estatus }).eq('id', id);
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, estatus } : o));
    setUpdatingId(null);
  };

  /* ── filtered lists ────────────────────────────────────────────────────── */
  const q = search.toLowerCase();
  const filteredCot = cotizaciones.filter(c =>
    [c.folio, c.origen, c.destino, c.estatus].some(v => v?.toLowerCase().includes(q))
  );
  const filteredCli = clientes.filter(c =>
    [c.nombre_completo, c.whatsapp, c.correo].some(v => v?.toLowerCase().includes(q))
  );
  const filteredOrd = ordenes.filter(o =>
    [o.folio, o.estatus, o.cotizaciones?.origen, o.cotizaciones?.destino].some(v => v?.toLowerCase().includes(q))
  );
  const filteredInes = clientes.filter(c =>
    (c.ine_frente_url || c.ine_reverso_url) &&
    [c.nombre_completo, c.correo].some(v => v?.toLowerCase().includes(q))
  );

  /* ── stats ─────────────────────────────────────────────────────────────── */
  const stats = [
    { label: 'Cotizaciones', value: cotizaciones.length, icon: ClipboardList, color: 'text-primary' },
    { label: 'Clientes', value: clientes.length, icon: Users, color: 'text-blue-400' },
    { label: 'Órdenes', value: ordenes.length, icon: FileText, color: 'text-yellow-400' },
    { label: 'INEs subidos', value: clientes.filter(c => c.ine_frente_url || c.ine_reverso_url).length, icon: IdCard, color: 'text-green-400' },
  ];

  const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
    { id: 'cotizaciones', label: 'Cotizaciones', icon: ClipboardList },
    { id: 'clientes',     label: 'Clientes',     icon: Users },
    { id: 'ordenes',      label: 'Órdenes',       icon: FileText },
    { id: 'ines',         label: 'INEs',           icon: IdCard },
  ];

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Verificando acceso...</span>
      </div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* bg glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img src={logoOficial} alt="La Unión Mudanzas" className="h-9 w-auto object-contain" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-lg">Panel Admin</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <motion.button
              key={s.id}
              onClick={() => setTab(s.id as Tab)}
              whileHover={{ scale: 1.02 }}
              className={`bg-card border rounded-xl p-4 text-left transition-all duration-200 ${
                tab === s.id ? 'border-primary/50 shadow-[0_0_15px_hsl(185,100%,50%/0.1)]' : 'border-border hover:border-border/80'
              }`}
            >
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <p className="text-2xl font-bold text-foreground">{loading ? '…' : s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex bg-card border border-border rounded-xl p-1 gap-1 flex-wrap">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(185,100%,50%/0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>

        {/* Tables */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">

          {/* ── COTIZACIONES ── */}
          {tab === 'cotizaciones' && (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">Cotizaciones</span>
                <span className="ml-auto text-xs text-muted-foreground">{filteredCot.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Folio</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ruta</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Modalidad</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Total</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Fecha</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Estatus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">Cargando…</TableCell></TableRow>
                    ) : filteredCot.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">Sin resultados</TableCell></TableRow>
                    ) : filteredCot.map(c => (
                      <TableRow key={c.id} className="border-border hover:bg-muted/20">
                        <TableCell className="font-mono text-xs text-primary">{c.folio ?? c.id.slice(0,8)}</TableCell>
                        <TableCell className="text-xs text-foreground max-w-[160px]">
                          <span className="block truncate">{c.origen ?? '—'}</span>
                          <span className="block truncate text-muted-foreground">→ {c.destino ?? '—'}</span>
                          {c.urgencia && <span className="text-[10px] text-yellow-400 font-semibold">⚡ Urgente</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground capitalize">{c.modalidad ?? '—'}</TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">{fmt(c.precio_total)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                        <TableCell>
                          <Select
                            value={c.estatus ?? 'borrador'}
                            onValueChange={val => updateEstatusCot(c.id, val)}
                            disabled={updatingId === c.id}
                          >
                            <SelectTrigger className="h-7 text-xs bg-transparent border-0 p-0 gap-1 w-auto focus:ring-0">
                              <EstatusBadge value={c.estatus} />
                              <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {ESTATUS_COTIZACION.map(e => (
                                <SelectItem key={e} value={e} className="text-xs capitalize">{e}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── CLIENTES ── */}
          {tab === 'clientes' && (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-foreground text-sm">Clientes</span>
                <span className="ml-auto text-xs text-muted-foreground">{filteredCli.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Nombre</TableHead>
                      <TableHead className="text-muted-foreground text-xs">WhatsApp</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Correo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Dirección</TableHead>
                      <TableHead className="text-muted-foreground text-xs">INE</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">Cargando…</TableCell></TableRow>
                    ) : filteredCli.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">Sin resultados</TableCell></TableRow>
                    ) : filteredCli.map(c => (
                      <TableRow key={c.id} className="border-border hover:bg-muted/20">
                        <TableCell className="font-medium text-sm text-foreground">{c.nombre_completo}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.whatsapp ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{c.correo ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{c.direccion_principal ?? '—'}</TableCell>
                        <TableCell>
                          {(c.ine_frente_url || c.ine_reverso_url) ? (
                            <button
                              onClick={() => setIneModal(c)}
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver INE
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No subido</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── ÓRDENES DE SERVICIO ── */}
          {tab === 'ordenes' && (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-foreground text-sm">Órdenes de Servicio</span>
                <span className="ml-auto text-xs text-muted-foreground">{filteredOrd.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Folio</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Ruta</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Total</TableHead>
                      <TableHead className="text-muted-foreground text-xs">PDF</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Fecha</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Estatus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">Cargando…</TableCell></TableRow>
                    ) : filteredOrd.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">Sin resultados</TableCell></TableRow>
                    ) : filteredOrd.map(o => (
                      <TableRow key={o.id} className="border-border hover:bg-muted/20">
                        <TableCell className="font-mono text-xs text-primary">{o.folio ?? o.id.slice(0,8)}</TableCell>
                        <TableCell className="text-xs text-foreground max-w-[160px]">
                          <span className="block truncate">{o.cotizaciones?.origen ?? '—'}</span>
                          <span className="block truncate text-muted-foreground">→ {o.cotizaciones?.destino ?? '—'}</span>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">{fmt(o.cotizaciones?.precio_total ?? null)}</TableCell>
                        <TableCell>
                          {o.pdf_url ? (
                            <a href={o.pdf_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                              <Eye className="w-3.5 h-3.5" />
                              Ver PDF
                            </a>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</TableCell>
                        <TableCell>
                          <Select
                            value={o.estatus ?? 'generada'}
                            onValueChange={val => updateEstatusOrden(o.id, val)}
                            disabled={updatingId === o.id}
                          >
                            <SelectTrigger className="h-7 text-xs bg-transparent border-0 p-0 gap-1 w-auto focus:ring-0">
                              <EstatusBadge value={o.estatus} />
                              <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {ESTATUS_ORDEN.map(e => (
                                <SelectItem key={e} value={e} className="text-xs capitalize">{e}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── INEs ── */}
          {tab === 'ines' && (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <IdCard className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-foreground text-sm">INEs de Clientes</span>
                <span className="ml-auto text-xs text-muted-foreground">{filteredInes.length} con documentos</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">Cliente</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Correo</TableHead>
                      <TableHead className="text-muted-foreground text-xs">INE Frente</TableHead>
                      <TableHead className="text-muted-foreground text-xs">INE Reverso</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">Cargando…</TableCell></TableRow>
                    ) : filteredInes.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm">Ningún cliente ha subido INE aún</TableCell></TableRow>
                    ) : filteredInes.map(c => (
                      <TableRow key={c.id} className="border-border hover:bg-muted/20">
                        <TableCell className="font-medium text-sm text-foreground">{c.nombre_completo}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.correo ?? '—'}</TableCell>
                        <TableCell>
                          {c.ine_frente_url
                            ? <span className="flex items-center gap-1 text-xs text-green-400 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Subido</span>
                            : <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="w-3.5 h-3.5" />Faltante</span>}
                        </TableCell>
                        <TableCell>
                          {c.ine_reverso_url
                            ? <span className="flex items-center gap-1 text-xs text-green-400 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Subido</span>
                            : <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="w-3.5 h-3.5" />Faltante</span>}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setIneModal(c)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver imágenes
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INE viewer modal */}
      <Dialog open={!!ineModal} onOpenChange={() => setIneModal(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <IdCard className="w-5 h-5 text-green-400" />
              INE — {ineModal?.nombre_completo}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Documentos de identidad del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frente</p>
              {ineModal?.ine_frente_url ? (
                <a href={ineModal.ine_frente_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={ineModal.ine_frente_url}
                    alt="INE Frente"
                    className="w-full rounded-xl border border-border object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                  />
                </a>
              ) : (
                <div className="w-full h-32 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                  No disponible
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reverso</p>
              {ineModal?.ine_reverso_url ? (
                <a href={ineModal.ine_reverso_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={ineModal.ine_reverso_url}
                    alt="INE Reverso"
                    className="w-full rounded-xl border border-border object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                  />
                </a>
              ) : (
                <div className="w-full h-32 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                  No disponible
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
