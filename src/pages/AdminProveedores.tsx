/**
 * /admin/proveedores — Admin Provider Management
 * Complete provider profiles with all sections
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, Truck, Search, RefreshCw,
  Phone, Mail, MapPin, Star, ToggleLeft, ToggleRight,
  AlertTriangle, Crown, Eye, Plus, X,
  Users, Package, BadgeAlert, Building2, Calendar,
  History, Activity, FileText, Shield, Briefcase,
  Route as RouteIcon, ChevronRight, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logoOficial from '@/assets/logo-oficial.png';
import ReputacionPanel from '@/components/admin/ReputacionPanel';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Proveedor {
  id: string;
  nombre_comercial: string;
  razon_social: string | null;
  responsable_nombre: string | null;
  whatsapp: string | null;
  correo: string | null;
  direccion: string | null;
  direccion_operativa: string | null;
  descripcion: string | null;
  anios_experiencia: number | null;
  documentos_urls: string[] | null;
  modalidades: string[] | null;
  tipos_servicio: string[] | null;
  logo_url: string | null;
  ciudades_cobertura: string[] | null;
  rutas_frecuentes: string[] | null;
  calificacion: number | null;
  estatus: string | null;
  activo: boolean;
  premium_activo: boolean;
  supervision_especial: boolean;
  servicios_sin_anticipo_restantes: number;
  cuota_reingreso_pendiente: number;
  adeudo_cliente_pendiente: number;
  created_at: string;
  updated_at: string;
}

interface Unidad {
  id: string;
  tipo_unidad: string | null;
  capacidad_m3: number | null;
  capacidad_peso: number | null;
  placas: string | null;
  foto_url: string | null;
  activa: boolean;
  observaciones: string | null;
}

interface Sancion {
  id: string;
  motivo: string | null;
  bloqueado: boolean;
  supervision_especial: boolean;
  monto_reingreso: number | null;
  monto_adeudo: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
}

interface Suscripcion {
  id: string;
  plan: string | null;
  monto_mensual: number | null;
  estatus: string | null;
  fecha_renovacion: string | null;
}

interface Incidencia {
  id: string;
  tipo_incidencia: string | null;
  descripcion: string | null;
  estatus: string | null;
  fecha_reporte: string;
}

interface Publicacion {
  id: string;
  tipo_publicacion: string | null;
  origen: string | null;
  destino: string | null;
  volumen_disponible: number | null;
  estatus: string | null;
  fecha_salida: string | null;
}

interface ProveedorDetail extends Proveedor {
  unidades: Unidad[];
  sanciones: Sancion[];
  incidencias: Incidencia[];
  publicaciones: Publicacion[];
  suscripcion: Suscripcion | null;
  serviciosCount: number;
}

const ESTATUS_PROVEEDOR = ['aprobado', 'pendiente_revision', 'suspendido', 'bajo_supervision', 'bloqueado', 'baja'];

const ESTATUS_COLORS: Record<string, string> = {
  aprobado:           'bg-green-500/15 text-green-400 border-green-500/30',
  activo:             'bg-green-500/15 text-green-400 border-green-500/30',
  suspendido:         'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  bloqueado:          'bg-destructive/15 text-destructive border-destructive/30',
  pendiente_revision: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
  bajo_supervision:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  baja:               'bg-muted/40 text-muted-foreground border-border',
};

const fmt = (n: number | null) => n != null ? `$${n.toLocaleString('es-MX')}` : '—';
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

function EstatusBadge({ value }: { value: string | null }) {
  const v = value ?? 'activo';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ESTATUS_COLORS[v] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
      {v.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Provider Detail Modal ──────────────────────────────────────────────── */
type DetailTab = 'perfil' | 'unidades' | 'rutas' | 'marketplace' | 'historial' | 'sanciones' | 'suscripcion' | 'estatus';

function ProveedorDetailModal({ proveedorId, onClose, onUpdate }: { proveedorId: string | null; onClose: () => void; onUpdate: () => void }) {
  const [detail, setDetail] = useState<ProveedorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<DetailTab>('perfil');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!proveedorId) { setDetail(null); setTab('perfil'); return; }
    setLoading(true);
    Promise.all([
      supabase.from('proveedores').select('*').eq('id', proveedorId).single(),
      supabase.from('proveedor_unidades').select('*').eq('proveedor_id', proveedorId),
      supabase.from('sanciones_proveedor').select('*').eq('proveedor_id', proveedorId).order('fecha_inicio', { ascending: false }),
      supabase.from('suscripciones_proveedor').select('*').eq('proveedor_id', proveedorId).order('created_at', { ascending: false }).limit(1),
      supabase.from('incidencias').select('id,tipo_incidencia,descripcion,estatus,fecha_reporte').eq('proveedor_id', proveedorId).order('fecha_reporte', { ascending: false }).limit(20),
      supabase.from('publicaciones_carga').select('id,tipo_publicacion,origen,destino,volumen_disponible,estatus,fecha_salida').eq('proveedor_id', proveedorId).order('created_at', { ascending: false }).limit(20),
      supabase.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).eq('estatus', 'completado'),
    ]).then(([p, u, s, sub, inc, pub, svcCount]) => {
      if (p.data) {
        setDetail({
          ...(p.data as unknown as Proveedor),
          unidades: (u.data ?? []) as unknown as Unidad[],
          sanciones: (s.data ?? []) as unknown as Sancion[],
          suscripcion: (sub.data?.[0] ?? null) as Suscripcion | null,
          incidencias: (inc.data ?? []) as unknown as Incidencia[],
          publicaciones: (pub.data ?? []) as unknown as Publicacion[],
          serviciosCount: svcCount.count ?? 0,
        });
      }
      setLoading(false);
    });
  }, [proveedorId]);

  const toggleField = async (field: string, current: boolean) => {
    if (!detail) return;
    setSaving(true);
    await supabase.from('proveedores').update({ [field]: !current }).eq('id', detail.id);
    setDetail(prev => prev ? { ...prev, [field]: !current } : prev);
    setSaving(false);
    onUpdate();
  };

  const DETAIL_TABS: { id: DetailTab; label: string }[] = [
    { id: 'perfil', label: 'Perfil' },
    { id: 'unidades', label: `Unidades (${detail?.unidades.length ?? 0})` },
    { id: 'rutas', label: 'Rutas' },
    { id: 'marketplace', label: `Marketplace (${detail?.publicaciones.length ?? 0})` },
    { id: 'historial', label: 'Historial' },
    { id: 'sanciones', label: `Sanciones (${detail?.sanciones.length ?? 0})` },
    { id: 'suscripcion', label: 'Suscripción' },
    { id: 'estatus', label: 'Control' },
  ];

  return (
    <Dialog open={!!proveedorId} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {detail?.logo_url ? <img src={detail.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <Truck className="w-5 h-5 text-primary" />}
            {loading ? 'Cargando...' : detail?.nombre_comercial}
            {detail?.premium_activo && <Crown className="w-4 h-4 text-yellow-400" />}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando información...
          </div>
        )}

        {detail && !loading && (
          <div className="space-y-4">
            {/* Status chips */}
            <div className="flex flex-wrap gap-2">
              <EstatusBadge value={detail.estatus} />
              {detail.premium_activo && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-yellow-500/15 text-yellow-400 border-yellow-500/30"><Crown className="w-3 h-3" /> Premium</span>}
              {detail.supervision_especial && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-destructive/15 text-destructive border-destructive/30"><AlertTriangle className="w-3 h-3" /> Supervisión</span>}
              {detail.adeudo_cliente_pendiente > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-orange-500/15 text-orange-400 border-orange-500/30">Adeudo: {fmt(detail.adeudo_cliente_pendiente)}</span>}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleField('supervision_especial', detail.supervision_especial)} disabled={saving}
                className={`gap-1.5 text-xs ${detail.supervision_especial ? 'border-destructive/50 text-destructive' : 'border-border text-muted-foreground'}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {detail.supervision_especial ? 'Quitar supervisión' : 'Poner supervisión'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleField('premium_activo', detail.premium_activo)} disabled={saving}
                className={`gap-1.5 text-xs ${detail.premium_activo ? 'border-yellow-500/50 text-yellow-400' : 'border-border text-muted-foreground'}`}>
                <Crown className="w-3.5 h-3.5" />
                {detail.premium_activo ? 'Desactivar premium' : 'Activar premium'}
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex bg-background border border-border rounded-xl p-1 gap-0.5 overflow-x-auto">
              {DETAIL_TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Perfil tab ── */}
            {tab === 'perfil' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Nombre comercial', value: detail.nombre_comercial },
                    { label: 'Razón social', value: detail.razon_social },
                    { label: 'Responsable', value: detail.responsable_nombre },
                    { label: 'WhatsApp', value: detail.whatsapp },
                    { label: 'Correo', value: detail.correo },
                    { label: 'Dirección fiscal', value: detail.direccion },
                    { label: 'Dirección operativa', value: detail.direccion_operativa },
                    { label: 'Años de experiencia', value: detail.anios_experiencia?.toString() },
                    { label: 'Calificación', value: detail.calificacion != null ? `${detail.calificacion.toFixed(1)} ★` : '—' },
                    { label: 'Servicios sin anticipo restantes', value: detail.servicios_sin_anticipo_restantes.toString() },
                    { label: 'Cuota de reingreso', value: fmt(detail.cuota_reingreso_pendiente) },
                    { label: 'Servicios completados', value: detail.serviciosCount.toString() },
                  ].map(f => (
                    <div key={f.label} className="bg-background border border-border rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-medium text-foreground">{f.value ?? '—'}</p>
                    </div>
                  ))}
                </div>
                {detail.descripcion && (
                  <div className="bg-background border border-border rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Descripción</p>
                    <p className="text-sm text-foreground">{detail.descripcion}</p>
                  </div>
                )}
                {/* Modalidades y servicios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-background border border-border rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground mb-2">Modalidades</p>
                    <div className="flex flex-wrap gap-1">
                      {(detail.modalidades ?? []).length > 0
                        ? (detail.modalidades ?? []).map(m => <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">{m}</span>)
                        : <span className="text-xs text-muted-foreground">Sin definir</span>}
                    </div>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground mb-2">Tipos de servicio</p>
                    <div className="flex flex-wrap gap-1">
                      {(detail.tipos_servicio ?? []).length > 0
                        ? (detail.tipos_servicio ?? []).map(t => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">{t.replace(/_/g, ' ')}</span>)
                        : <span className="text-xs text-muted-foreground">Sin definir</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Unidades tab ── */}
            {tab === 'unidades' && (
              <div className="space-y-2">
                {detail.unidades.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">Sin unidades registradas</p>}
                {detail.unidades.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl text-sm">
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                      {u.foto_url ? <img src={u.foto_url} alt="" className="w-full h-full object-cover rounded-lg" /> : <Truck className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{u.tipo_unidad ?? 'Unidad'}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.capacidad_m3 != null ? `${u.capacidad_m3} m³` : '—'} · {u.capacidad_peso != null ? `${u.capacidad_peso} kg` : '—'} · Placas: {u.placas ?? '—'}
                      </p>
                      {u.observaciones && <p className="text-[10px] text-muted-foreground/60">{u.observaciones}</p>}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${u.activa ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-muted/30 text-muted-foreground border-border'}`}>
                      {u.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Rutas tab ── */}
            {tab === 'rutas' && (
              <div className="space-y-3">
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-2">Ciudades de cobertura</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(detail.ciudades_cobertura ?? []).length > 0
                      ? (detail.ciudades_cobertura ?? []).map(c => <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">{c}</span>)
                      : <span className="text-xs text-muted-foreground">Sin ciudades</span>}
                  </div>
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-2">Rutas frecuentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(detail.rutas_frecuentes ?? []).length > 0
                      ? (detail.rutas_frecuentes ?? []).map(r => <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">{r}</span>)
                      : <span className="text-xs text-muted-foreground">Sin rutas</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Marketplace tab ── */}
            {tab === 'marketplace' && (
              <div className="space-y-2">
                {detail.publicaciones.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">Sin publicaciones</p>}
                {detail.publicaciones.map(p => (
                  <div key={p.id} className={`p-3 bg-background border rounded-xl text-sm ${p.estatus === 'activa' ? 'border-green-500/20' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{p.tipo_publicacion?.replace(/_/g, ' ') ?? 'Publicación'}</p>
                        <p className="text-xs text-muted-foreground">{p.origen} → {p.destino} · {p.volumen_disponible ? `${p.volumen_disponible} m³` : '—'}</p>
                        {p.fecha_salida && <p className="text-[10px] text-muted-foreground/60">Salida: {fmtDate(p.fecha_salida)}</p>}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        p.estatus === 'activa' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-muted/30 text-muted-foreground border-border'
                      }`}>{p.estatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Historial tab ── */}
            {tab === 'historial' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-background border border-border rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-foreground">{detail.serviciosCount}</p>
                    <p className="text-[10px] text-muted-foreground">Completados</p>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-foreground">{detail.unidades.filter(u => u.activa).length}</p>
                    <p className="text-[10px] text-muted-foreground">Unidades activas</p>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-foreground">{detail.incidencias.length}</p>
                    <p className="text-[10px] text-muted-foreground">Incidencias</p>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-foreground">{detail.sanciones.length}</p>
                    <p className="text-[10px] text-muted-foreground">Sanciones</p>
                  </div>
                </div>
                {/* Recent incidencias */}
                {detail.incidencias.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Incidencias recientes</p>
                    {detail.incidencias.slice(0, 5).map(inc => (
                      <div key={inc.id} className="p-2 bg-background border border-border rounded-lg text-sm mb-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground font-medium">{inc.tipo_incidencia ?? 'Incidencia'}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${
                            inc.estatus === 'resuelta' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                          }`}>{inc.estatus ?? 'pendiente'}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{fmtDate(inc.fecha_reporte)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Sanciones tab ── */}
            {tab === 'sanciones' && (
              <div className="space-y-2">
                {detail.sanciones.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">Sin sanciones</p>}
                {detail.sanciones.map(s => (
                  <div key={s.id} className="p-3 bg-background border border-destructive/20 rounded-xl text-sm space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">{s.motivo ?? 'Sanción registrada'}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${s.bloqueado ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
                        {s.bloqueado ? 'Bloqueado' : 'Advertencia'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Inicio: {fmtDate(s.fecha_inicio)}{s.fecha_fin ? ` · Fin: ${fmtDate(s.fecha_fin)}` : ' · Activa'}</p>
                    {(s.monto_adeudo || s.monto_reingreso) && (
                      <p className="text-xs text-orange-400">Adeudo: {fmt(s.monto_adeudo)} · Reingreso: {fmt(s.monto_reingreso)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Suscripcion tab ── */}
            {tab === 'suscripcion' && (
              <div>
                {!detail.suscripcion ? (
                  <p className="text-center text-muted-foreground text-sm py-6">Sin suscripción activa</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Plan', value: detail.suscripcion.plan },
                      { label: 'Monto mensual', value: fmt(detail.suscripcion.monto_mensual) },
                      { label: 'Estatus', value: detail.suscripcion.estatus },
                      { label: 'Renovación', value: detail.suscripcion.fecha_renovacion ? fmtDate(detail.suscripcion.fecha_renovacion) : '—' },
                    ].map(f => (
                      <div key={f.label} className="bg-background border border-border rounded-xl p-3">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{f.label}</p>
                        <p className="font-medium text-foreground">{f.value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Estatus / Control tab ── */}
            {tab === 'estatus' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Estatus operativo', value: (detail.estatus ?? 'activo').replace(/_/g, ' '), active: ['aprobado', 'activo'].includes(detail.estatus ?? '') },
                    { label: 'Premium', value: detail.premium_activo ? 'Activo' : 'Inactivo', active: detail.premium_activo },
                    { label: 'Supervisión especial', value: detail.supervision_especial ? 'Sí' : 'No', active: !detail.supervision_especial },
                    { label: 'Activo en plataforma', value: detail.activo ? 'Sí' : 'No', active: detail.activo },
                    { label: 'Adeudo pendiente', value: fmt(detail.adeudo_cliente_pendiente), active: detail.adeudo_cliente_pendiente === 0 },
                    { label: 'Cuota reingreso', value: fmt(detail.cuota_reingreso_pendiente), active: detail.cuota_reingreso_pendiente === 0 },
                    { label: 'Servicios sin anticipo', value: detail.servicios_sin_anticipo_restantes.toString(), active: detail.servicios_sin_anticipo_restantes === 0 },
                    { label: 'Registro', value: fmtDate(detail.created_at), active: true },
                  ].map(f => (
                    <div key={f.label} className={`border rounded-xl p-3 ${f.active ? 'border-green-500/20 bg-green-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{f.label}</p>
                      <p className={`font-semibold text-sm ${f.active ? 'text-green-400' : 'text-destructive'}`}>{f.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">Observaciones internas y documentos se gestionan desde la vista detallada del expediente</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminProveedores() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'lista' | 'reputacion'>('lista');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/');
  }, [isLoading, user, isAdmin, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('proveedores').select('*').order('created_at', { ascending: false });
    if (data) setProveedores(data as unknown as Proveedor[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin, fetchData]);

  const updateEstatus = async (id: string, estatus: string) => {
    setUpdatingId(id);
    await supabase.from('proveedores').update({ estatus }).eq('id', id);
    setProveedores(prev => prev.map(p => p.id === id ? { ...p, estatus } : p));
    setUpdatingId(null);
  };

  const toggleActivo = async (id: string, current: boolean) => {
    setUpdatingId(id);
    await supabase.from('proveedores').update({ activo: !current }).eq('id', id);
    setProveedores(prev => prev.map(p => p.id === id ? { ...p, activo: !current } : p));
    setUpdatingId(null);
  };

  const q = search.toLowerCase();
  const filtered = proveedores.filter(p => {
    const matchSearch = [p.nombre_comercial, p.responsable_nombre, p.whatsapp, p.correo, p.estatus]
      .some(v => v?.toLowerCase().includes(q));
    const matchEstatus = filterEstatus === 'todos' || p.estatus === filterEstatus;
    return matchSearch && matchEstatus;
  });

  const stats = [
    { label: 'Total', value: proveedores.length, color: 'text-foreground' },
    { label: 'Activos', value: proveedores.filter(p => p.activo).length, color: 'text-green-400' },
    { label: 'Premium', value: proveedores.filter(p => p.premium_activo).length, color: 'text-yellow-400' },
    { label: 'Supervisión', value: proveedores.filter(p => p.supervision_especial).length, color: 'text-destructive' },
    { label: 'Con adeudo', value: proveedores.filter(p => p.adeudo_cliente_pendiente > 0).length, color: 'text-orange-400' },
  ];

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>;
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
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <img src={logoOficial} alt="La Unión Mudanzas" className="h-9 w-auto object-contain" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-lg">Proveedores Logísticos</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-border text-muted-foreground hover:text-foreground gap-2 self-start sm:self-auto">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </Button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-card border border-border rounded-xl p-1 gap-1 mb-6 w-fit">
          <button onClick={() => setViewMode('lista')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'lista' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            📋 Proveedores
          </button>
          <button onClick={() => setViewMode('reputacion')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'reputacion' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            🏆 Reputación
          </button>
        </div>

        {viewMode === 'reputacion' ? (
          <ReputacionPanel />
        ) : (
        <>
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
            <Input placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
          </div>
          <Select value={filterEstatus} onValueChange={setFilterEstatus}>
            <SelectTrigger className="w-[180px] bg-card border-border"><SelectValue placeholder="Estatus" /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="todos">Todos</SelectItem>
              {ESTATUS_PROVEEDOR.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground self-center">{filtered.length} proveedores</span>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Proveedor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Estatus</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Cal.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Flags</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-muted/30 rounded w-40" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-muted/30 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-muted/30 rounded-full w-20" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-muted/30 rounded w-8" /></td>
                    <td className="px-4 py-3 hidden xl:table-cell"><div className="h-4 bg-muted/30 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-7 bg-muted/30 rounded w-24" /></td>
                  </tr>
                ))}
                {!loading && filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedId(p.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.logo_url
                          ? <img src={p.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0"><Truck className="w-4 h-4 text-muted-foreground" /></div>}
                        <div>
                          <p className="font-semibold text-foreground text-sm">{p.nombre_comercial}</p>
                          {p.responsable_nombre && <p className="text-xs text-muted-foreground">{p.responsable_nombre}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {p.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.whatsapp}</span>}
                        {p.correo && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.correo}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleActivo(p.id, p.activo)} disabled={updatingId === p.id}
                          className={`transition-colors ${p.activo ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {p.activo ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                        <Select value={p.estatus ?? 'aprobado'} onValueChange={v => updateEstatus(p.id, v)}>
                          <SelectTrigger className="h-7 text-xs border-border bg-background w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {ESTATUS_PROVEEDOR.map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {p.calificacion != null
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-foreground"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{p.calificacion.toFixed(1)}</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        {p.premium_activo && <span title="Premium"><Crown className="w-3.5 h-3.5 text-yellow-400" /></span>}
                        {p.supervision_especial && <span title="Supervisión especial"><AlertTriangle className="w-3.5 h-3.5 text-destructive" /></span>}
                        {p.adeudo_cliente_pendiente > 0 && <span title={`Adeudo: ${fmt(p.adeudo_cliente_pendiente)}`}><BadgeAlert className="w-3.5 h-3.5 text-orange-400" /></span>}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedId(p.id)} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Ver perfil
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <Truck className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No se encontraron proveedores</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <ProveedorDetailModal proveedorId={selectedId} onClose={() => setSelectedId(null)} onUpdate={fetchData} />
        </>
        )}
      </div>
    </div>
  );
}
