/**
 * /admin/incidencias — Incidents & Sanctions Module
 * La Unión Mudanzas — Incident tracking, auto-sanctions, refunds
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, AlertTriangle, Search, RefreshCw,
  AlertCircle, CheckCircle2, Clock, XCircle, Eye,
  Ban, DollarSign, FileText, Truck, Users, Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendServiceEmail } from '@/lib/email-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logoOficial from '@/assets/logo-oficial.png';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Incidencia {
  id: string;
  tipo_incidencia: string | null;
  descripcion: string | null;
  estatus: string | null;
  fecha_reporte: string;
  negligencia_proveedor: boolean;
  requiere_reembolso: boolean;
  reportada_en_app: boolean;
  cliente_id: string | null;
  proveedor_id: string | null;
  cotizacion_id: string | null;
  created_at: string;
}

interface Reembolso {
  id: string;
  monto: number | null;
  estatus: string | null;
  fecha_limite: string | null;
  fecha_cumplimiento: string | null;
  cotizacion_id: string | null;
  cliente_id: string | null;
  proveedor_id: string | null;
  created_at: string;
}

interface Sancion {
  id: string;
  proveedor_id: string;
  motivo: string | null;
  bloqueado: boolean;
  supervision_especial: boolean;
  monto_reingreso: number | null;
  monto_adeudo: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  servicios_sin_anticipo: number;
}

const TIPOS_INCIDENCIA = [
  'accidente', 'reten', 'falla_mecanica', 'retraso',
  'imposibilidad_carga', 'imposibilidad_descarga', 'cliente_ausente',
  'volumen_distinto', 'acceso_restringido', 'otro',
];

const ESTATUS_COLORS: Record<string, string> = {
  abierta:     'bg-destructive/15 text-destructive border-destructive/30',
  en_revision: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  resuelta:    'bg-green-500/15 text-green-400 border-green-500/30',
  cerrada:     'bg-muted/40 text-muted-foreground border-border',
  pendiente:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  completado:  'bg-green-500/15 text-green-400 border-green-500/30',
  vencido:     'bg-destructive/15 text-destructive border-destructive/30',
};

const fmt = (n: number | null) =>
  n != null ? `$${n.toLocaleString('es-MX')}` : '—';
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function EstatusBadge({ value }: { value: string | null }) {
  const v = value ?? 'abierta';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ESTATUS_COLORS[v] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {v.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Incident Detail Modal ───────────────────────────────────────────────── */
function IncidenciaDetail({
  incidencia,
  onClose,
  onUpdate,
}: {
  incidencia: Incidencia | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [localEstatus, setLocalEstatus] = useState('');

  useEffect(() => {
    if (incidencia) setLocalEstatus(incidencia.estatus ?? 'abierta');
  }, [incidencia]);

  const updateEstatus = async (estatus: string) => {
    if (!incidencia) return;
    setSaving(true);
    await supabase.from('incidencias').update({ estatus }).eq('id', incidencia.id);
    setLocalEstatus(estatus);
    setSaving(false);
    onUpdate();
  };

  const applySanction = async () => {
    if (!incidencia?.proveedor_id) return;
    setSaving(true);
    // Create sanction record
    await supabase.from('sanciones_proveedor').insert({
      proveedor_id: incidencia.proveedor_id,
      motivo: `Incidencia: ${incidencia.tipo_incidencia} — ${incidencia.descripcion ?? ''}`,
      bloqueado: true,
      supervision_especial: true,
      monto_reingreso: 5000,
      servicios_sin_anticipo: 10,
    });
    // Update proveedor
    await supabase.from('proveedores').update({
      supervision_especial: true,
      premium_activo: false,
      servicios_sin_anticipo_restantes: 10,
      cuota_reingreso_pendiente: 5000,
    }).eq('id', incidencia.proveedor_id);
    setSaving(false);
    onUpdate();
  };

  if (!incidencia) return null;

  return (
    <Dialog open={!!incidencia} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Incidencia — {incidencia.tipo_incidencia?.replace(/_/g, ' ') ?? 'Incidencia'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Flags */}
          <div className="flex flex-wrap gap-2">
            <EstatusBadge value={localEstatus} />
            {incidencia.negligencia_proveedor && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-destructive/15 text-destructive border-destructive/30">
                <AlertTriangle className="w-3 h-3" /> Negligencia proveedor
              </span>
            )}
            {incidencia.requiere_reembolso && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-orange-500/15 text-orange-400 border-orange-500/30">
                <DollarSign className="w-3 h-3" /> Requiere reembolso
              </span>
            )}
            {!incidencia.reportada_en_app && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                <AlertCircle className="w-3 h-3" /> Sin respaldo (fuera de app)
              </span>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Tipo</p>
              <p className="font-medium text-foreground text-sm">{incidencia.tipo_incidencia?.replace(/_/g, ' ') ?? '—'}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground">Fecha reporte</p>
              <p className="font-medium text-foreground text-sm">{fmtDate(incidencia.fecha_reporte)}</p>
            </div>
            <div className="col-span-2 bg-background border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Descripción</p>
              <p className="text-foreground text-sm">{incidencia.descripcion ?? 'Sin descripción'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Cambiar estatus:</span>
              <Select value={localEstatus} onValueChange={updateEstatus} disabled={saving}>
                <SelectTrigger className="bg-background border-border w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {['abierta', 'en_revision', 'resuelta', 'cerrada'].map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {incidencia.negligencia_proveedor && incidencia.proveedor_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={applySanction}
                disabled={saving}
                className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                Aplicar sanción automática
              </Button>
            )}
          </div>

          {/* Policy reminder */}
          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-400/80 space-y-1">
            <p className="font-semibold text-yellow-400">Reglas operativas:</p>
            <p>• Sin evidencia en app → no aplica garantía ni respaldo</p>
            <p>• Si negligencia: cliente reagenda con descuento o reembolso en 7 días hábiles</p>
            <p>• Proveedor sin respuesta en 48h → baja automática + cuota de reingreso $5,000</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminIncidencias() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'incidencias' | 'reembolsos' | 'sanciones'>('incidencias');
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Incidencia | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [inc, rem, san] = await Promise.all([
      supabase.from('incidencias').select('*').order('created_at', { ascending: false }),
      supabase.from('reembolsos').select('*').order('created_at', { ascending: false }),
      supabase.from('sanciones_proveedor').select('*').order('fecha_inicio', { ascending: false }),
    ]);
    if (inc.data) setIncidencias(inc.data as Incidencia[]);
    if (rem.data) setReembolsos(rem.data as Reembolso[]);
    if (san.data) setSanciones(san.data as Sancion[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const q = search.toLowerCase();
  const filteredInc = incidencias.filter(i =>
    [i.tipo_incidencia, i.descripcion, i.estatus].some(v => v?.toLowerCase().includes(q))
  );

  const stats = [
    { label: 'Incidencias abiertas', value: incidencias.filter(i => i.estatus === 'abierta').length, color: 'text-destructive' },
    { label: 'En revisión',          value: incidencias.filter(i => i.estatus === 'en_revision').length, color: 'text-yellow-400' },
    { label: 'Reembolsos pendientes',value: reembolsos.filter(r => r.estatus === 'pendiente').length, color: 'text-orange-400' },
    { label: 'Proveedores sancionados', value: sanciones.filter(s => s.bloqueado).length, color: 'text-destructive' },
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-destructive/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
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
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="font-bold text-destructive text-lg">Incidencias</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className={`text-2xl font-black ${s.color}`}>{loading ? '…' : s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-card border border-border rounded-xl p-1 gap-1 mb-5 w-fit">
          {([
            { id: 'incidencias', label: `Incidencias (${incidencias.length})`, icon: AlertTriangle },
            { id: 'reembolsos',  label: `Reembolsos (${reembolsos.length})`,   icon: DollarSign },
            { id: 'sanciones',   label: `Sanciones (${sanciones.length})`,     icon: Ban },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Search (incidencias only) */}
        {tab === 'incidencias' && (
          <div className="relative flex-1 max-w-sm mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar incidencia..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">

          {/* INCIDENCIAS */}
          {tab === 'incidencias' && (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="font-semibold text-foreground text-sm">Incidencias registradas</span>
                <span className="ml-auto text-xs text-muted-foreground">{filteredInc.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Descripción</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Estatus</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Fecha</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Flags</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50 animate-pulse">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted/30 rounded w-24" />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!loading && filteredInc.map(i => (
                      <tr
                        key={i.id}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer"
                        onClick={() => setSelected(i)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground text-sm">
                            {i.tipo_incidencia?.replace(/_/g, ' ') ?? 'Incidencia'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {i.descripcion ?? '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3"><EstatusBadge value={i.estatus} /></td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{fmtDate(i.fecha_reporte)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex gap-1">
                            {i.negligencia_proveedor && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">Negligencia</span>
                            )}
                            {i.requiere_reembolso && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Reembolso</span>
                            )}
                            {!i.reportada_en_app && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Fuera app</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => { e.stopPropagation(); setSelected(i); }}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredInc.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Sin incidencias</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REEMBOLSOS */}
          {tab === 'reembolsos' && (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-foreground text-sm">Reembolsos</span>
                <span className="ml-auto text-xs text-muted-foreground">{reembolsos.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Monto</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Estatus</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Fecha límite</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50 animate-pulse">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-muted/30 rounded w-24" /></td>
                        ))}
                      </tr>
                    ))}
                    {!loading && reembolsos.map(r => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-foreground">{fmt(r.monto)}</span>
                        </td>
                        <td className="px-4 py-3"><EstatusBadge value={r.estatus} /></td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs ${r.fecha_limite && new Date(r.fecha_limite) < new Date() && r.estatus !== 'completado' ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                            {r.fecha_limite ? fmtDate(r.fecha_limite) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {r.fecha_cumplimiento ? fmtDate(r.fecha_cumplimiento) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && reembolsos.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-muted-foreground">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Sin reembolsos</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SANCIONES */}
          {tab === 'sanciones' && (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Ban className="w-4 h-4 text-destructive" />
                <span className="font-semibold text-foreground text-sm">Sanciones a proveedores</span>
                <span className="ml-auto text-xs text-muted-foreground">{sanciones.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Motivo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Adeudo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Reingreso</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Sin anticipo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50 animate-pulse">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-muted/30 rounded w-24" /></td>
                        ))}
                      </tr>
                    ))}
                    {!loading && sanciones.map(s => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-foreground text-sm truncate max-w-xs">{s.motivo ?? 'Sanción aplicada'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {s.bloqueado && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 font-semibold">Bloqueado</span>
                            )}
                            {s.supervision_especial && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-semibold">Supervisión</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-semibold text-orange-400">{fmt(s.monto_adeudo)}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs font-semibold text-destructive">{fmt(s.monto_reingreso)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{s.servicios_sin_anticipo} servicios</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{fmtDate(s.fecha_inicio)}</span>
                        </td>
                      </tr>
                    ))}
                    {!loading && sanciones.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Ban className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Sin sanciones registradas</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <IncidenciaDetail
        incidencia={selected}
        onClose={() => setSelected(null)}
        onUpdate={fetchData}
      />
    </div>
  );
}
