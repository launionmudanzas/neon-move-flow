/**
 * /portal-proveedor — Portal de Proveedor Logístico
 * Módulo completo con 8 tabs: Perfil, Unidades, Rutas, Espacios, Cargas, Visitas, Historial, Estatus
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Truck, Upload, Plus, X, Package, MapPin,
  Calendar, Star, Crown, Eye, Clock, Users, Settings,
  Image, Route as RouteIcon, CheckCircle2, RefreshCw,
  FileText, Shield, AlertTriangle, Loader2, Building2,
  Weight, Hash, Camera, ToggleLeft, ToggleRight, Briefcase,
  History, Activity, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Proveedor {
  id: string;
  nombre_comercial: string;
  razon_social: string | null;
  responsable_nombre: string | null;
  logo_url: string | null;
  calificacion: number | null;
  ciudades_cobertura: string[] | null;
  rutas_frecuentes: string[] | null;
  premium_activo: boolean;
  whatsapp: string | null;
  correo: string | null;
  direccion: string | null;
  direccion_operativa: string | null;
  descripcion: string | null;
  anios_experiencia: number | null;
  documentos_urls: string[] | null;
  modalidades: string[] | null;
  tipos_servicio: string[] | null;
  estatus: string | null;
  activo: boolean;
  supervision_especial: boolean;
  servicios_sin_anticipo_restantes: number;
  cuota_reingreso_pendiente: number;
  adeudo_cliente_pendiente: number;
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

interface Publicacion {
  id: string;
  tipo_publicacion: string | null;
  origen: string | null;
  destino: string | null;
  fecha_salida: string | null;
  fecha_llegada_estimada: string | null;
  volumen_disponible: number | null;
  peso_disponible: number | null;
  modalidad_disponible: string | null;
  tipo_unidad: string | null;
  tipo_oportunidad: string | null;
  observaciones: string | null;
  costo_ofrecido: number | null;
  estatus: string | null;
  expira_at: string | null;
  vistas_cotizaciones: number;
  intereses_count: number;
}

interface HorarioVisita {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

interface SolicitudVisita {
  id: string;
  fecha_solicitada: string;
  hora_solicitada: string | null;
  direccion: string | null;
  notas: string | null;
  estatus: string;
  created_at: string;
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

interface Incidencia {
  id: string;
  tipo_incidencia: string | null;
  descripcion: string | null;
  estatus: string | null;
  fecha_reporte: string;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIPO_UNIDADES = ['Nissan / camioneta chica', 'Nissan larga', '3.5', 'Rabón corto', 'Rabón', 'Torton', 'Camión grande', 'Tráiler'];
const TIPO_PUBLICACIONES = ['espacio_vacio', 'fraccion', 'carga_completa', 'ruta_compartible'];
const MODALIDADES = ['compartido', 'directo', 'exclusivo'];
const TIPOS_SERVICIO = ['mudanza_casa', 'flete', 'traslado_auto', 'traslado_moto', 'maniobras', 'paqueteria', 'almacenaje', 'especial'];

const fmt = (n: number | null) => n != null ? `$${n.toLocaleString('es-MX')}` : '—';
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

type TabId = 'perfil' | 'unidades' | 'rutas' | 'espacios' | 'cargas' | 'visitas' | 'historial' | 'estatus';

export default function PortalProveedor() {
  const { user, identity, isLoading } = useAuth();
  const navigate = useNavigate();

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [horarios, setHorarios] = useState<HorarioVisita[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudVisita[]>([]);
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [serviciosCount, setServiciosCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('perfil');

  // Form states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [addingUnidad, setAddingUnidad] = useState(false);
  const [newUnidad, setNewUnidad] = useState({ tipo: '', capacidad: '', capacidadPeso: '', placas: '', observaciones: '' });
  const [addingPub, setAddingPub] = useState(false);
  const [newPub, setNewPub] = useState({ tipo: 'espacio_vacio', origen: '', destino: '', fecha: '', fechaLlegada: '', volumen: '', peso: '', modalidad: '', tipoUnidad: '', tipoOportunidad: 'espacio_vacio', costo: '', observaciones: '' });
  const [newCiudad, setNewCiudad] = useState('');
  const [newRuta, setNewRuta] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ razon_social: '', responsable_nombre: '', descripcion: '', direccion: '', direccion_operativa: '', anios_experiencia: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const proveedorId = identity?.proveedor_id;

  useEffect(() => {
    if (!isLoading && (!user || !proveedorId)) navigate('/cuenta');
  }, [isLoading, user, proveedorId, navigate]);

  const fetchData = useCallback(async () => {
    if (!proveedorId) return;
    setLoading(true);
    const [p, u, pub, h, sol, sanc, inc, svcCount] = await Promise.all([
      supabase.from('proveedores').select('*').eq('id', proveedorId).single(),
      supabase.from('proveedor_unidades').select('*').eq('proveedor_id', proveedorId),
      supabase.from('publicaciones_carga').select('*').eq('proveedor_id', proveedorId).order('created_at', { ascending: false }),
      supabase.from('horarios_visita_proveedor').select('*').eq('proveedor_id', proveedorId),
      supabase.from('solicitudes_visita').select('*').eq('proveedor_id', proveedorId).order('created_at', { ascending: false }),
      supabase.from('sanciones_proveedor').select('*').eq('proveedor_id', proveedorId).order('fecha_inicio', { ascending: false }),
      supabase.from('incidencias').select('id,tipo_incidencia,descripcion,estatus,fecha_reporte').eq('proveedor_id', proveedorId).order('fecha_reporte', { ascending: false }).limit(20),
      supabase.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).eq('estatus', 'completado'),
    ]);
    if (p.data) {
      const prov = p.data as unknown as Proveedor;
      setProveedor(prov);
      setProfileForm({
        razon_social: prov.razon_social ?? '',
        responsable_nombre: prov.responsable_nombre ?? '',
        descripcion: prov.descripcion ?? '',
        direccion: prov.direccion ?? '',
        direccion_operativa: prov.direccion_operativa ?? '',
        anios_experiencia: prov.anios_experiencia?.toString() ?? '',
      });
    }
    setUnidades((u.data ?? []) as unknown as Unidad[]);
    setPublicaciones((pub.data ?? []) as unknown as Publicacion[]);
    setHorarios((h.data ?? []) as HorarioVisita[]);
    setSolicitudes((sol.data ?? []) as SolicitudVisita[]);
    setSanciones((sanc.data ?? []) as unknown as Sancion[]);
    setIncidencias((inc.data ?? []) as unknown as Incidencia[]);
    setServiciosCount(svcCount.count ?? 0);
    setLoading(false);
  }, [proveedorId]);

  useEffect(() => { if (proveedorId) fetchData(); }, [proveedorId, fetchData]);

  // ── Logo upload ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proveedorId) return;
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const path = `${proveedorId}/logo.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('logos-proveedor').upload(path, file, { upsert: true });
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('logos-proveedor').getPublicUrl(path);
      await supabase.from('proveedores').update({ logo_url: urlData.publicUrl }).eq('id', proveedorId);
      setProveedor(prev => prev ? { ...prev, logo_url: urlData.publicUrl } : prev);
    }
    setUploadingLogo(false);
  };

  // ── Save profile ──
  const saveProfile = async () => {
    if (!proveedorId) return;
    setSavingProfile(true);
    await supabase.from('proveedores').update({
      razon_social: profileForm.razon_social || null,
      responsable_nombre: profileForm.responsable_nombre || null,
      descripcion: profileForm.descripcion || null,
      direccion: profileForm.direccion || null,
      direccion_operativa: profileForm.direccion_operativa || null,
      anios_experiencia: profileForm.anios_experiencia ? Number(profileForm.anios_experiencia) : null,
    }).eq('id', proveedorId);
    setProveedor(prev => prev ? {
      ...prev,
      razon_social: profileForm.razon_social || null,
      responsable_nombre: profileForm.responsable_nombre || null,
      descripcion: profileForm.descripcion || null,
      direccion: profileForm.direccion || null,
      direccion_operativa: profileForm.direccion_operativa || null,
      anios_experiencia: profileForm.anios_experiencia ? Number(profileForm.anios_experiencia) : null,
    } : prev);
    setSavingProfile(false);
    setEditingProfile(false);
  };

  // ── Add unit ──
  const handleAddUnidad = async () => {
    if (!proveedorId || !newUnidad.tipo) return;
    const { data } = await supabase.from('proveedor_unidades').insert({
      proveedor_id: proveedorId,
      tipo_unidad: newUnidad.tipo,
      capacidad_m3: newUnidad.capacidad ? Number(newUnidad.capacidad) : null,
      capacidad_peso: newUnidad.capacidadPeso ? Number(newUnidad.capacidadPeso) : null,
      placas: newUnidad.placas || null,
      observaciones: newUnidad.observaciones || null,
    }).select('*').single();
    if (data) setUnidades(prev => [...prev, data as unknown as Unidad]);
    setNewUnidad({ tipo: '', capacidad: '', capacidadPeso: '', placas: '', observaciones: '' });
    setAddingUnidad(false);
  };

  // ── Toggle unit ──
  const toggleUnidad = async (id: string, activa: boolean) => {
    await supabase.from('proveedor_unidades').update({ activa: !activa }).eq('id', id);
    setUnidades(prev => prev.map(u => u.id === id ? { ...u, activa: !activa } : u));
  };

  // ── Add ciudad/ruta ──
  const addCiudad = async () => {
    if (!proveedorId || !newCiudad.trim() || !proveedor) return;
    const updated = [...(proveedor.ciudades_cobertura ?? []), newCiudad.trim()];
    await supabase.from('proveedores').update({ ciudades_cobertura: updated }).eq('id', proveedorId);
    setProveedor(prev => prev ? { ...prev, ciudades_cobertura: updated } : prev);
    setNewCiudad('');
  };

  const removeCiudad = async (ciudad: string) => {
    if (!proveedorId || !proveedor) return;
    const updated = (proveedor.ciudades_cobertura ?? []).filter(c => c !== ciudad);
    await supabase.from('proveedores').update({ ciudades_cobertura: updated }).eq('id', proveedorId);
    setProveedor(prev => prev ? { ...prev, ciudades_cobertura: updated } : prev);
  };

  const addRuta = async () => {
    if (!proveedorId || !newRuta.trim() || !proveedor) return;
    const updated = [...(proveedor.rutas_frecuentes ?? []), newRuta.trim()];
    await supabase.from('proveedores').update({ rutas_frecuentes: updated }).eq('id', proveedorId);
    setProveedor(prev => prev ? { ...prev, rutas_frecuentes: updated } : prev);
    setNewRuta('');
  };

  const removeRuta = async (ruta: string) => {
    if (!proveedorId || !proveedor) return;
    const updated = (proveedor.rutas_frecuentes ?? []).filter(r => r !== ruta);
    await supabase.from('proveedores').update({ rutas_frecuentes: updated }).eq('id', proveedorId);
    setProveedor(prev => prev ? { ...prev, rutas_frecuentes: updated } : prev);
  };

  // ── Toggle modalidad / tipo servicio ──
  const toggleArrayField = async (field: 'modalidades' | 'tipos_servicio', value: string) => {
    if (!proveedorId || !proveedor) return;
    const current = (proveedor[field] ?? []) as string[];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    await supabase.from('proveedores').update({ [field]: updated }).eq('id', proveedorId);
    setProveedor(prev => prev ? { ...prev, [field]: updated } : prev);
  };

  // ── Publish cargo/space ──
  const handlePublish = async () => {
    if (!proveedorId) return;
    const { data } = await supabase.from('publicaciones_carga').insert({
      proveedor_id: proveedorId,
      tipo_publicacion: newPub.tipo,
      origen: newPub.origen || null,
      destino: newPub.destino || null,
      fecha_salida: newPub.fecha || null,
      fecha_llegada_estimada: newPub.fechaLlegada || null,
      volumen_disponible: newPub.volumen ? Number(newPub.volumen) : null,
      peso_disponible: newPub.peso ? Number(newPub.peso) : null,
      modalidad_disponible: newPub.modalidad || null,
      tipo_unidad: newPub.tipoUnidad || null,
      tipo_oportunidad: newPub.tipoOportunidad || null,
      costo_ofrecido: newPub.costo ? Number(newPub.costo) : null,
      observaciones: newPub.observaciones || null,
      estatus: 'activa',
      comision_app_publicador: 10,
      comision_app_tomador: 10,
    }).select('*').single();
    if (data) setPublicaciones(prev => [data as unknown as Publicacion, ...prev]);
    setNewPub({ tipo: 'espacio_vacio', origen: '', destino: '', fecha: '', fechaLlegada: '', volumen: '', peso: '', modalidad: '', tipoUnidad: '', tipoOportunidad: 'espacio_vacio', costo: '', observaciones: '' });
    setAddingPub(false);
  };

  // ── Horarios ──
  const toggleHorario = async (dia: number) => {
    if (!proveedorId) return;
    const existing = horarios.find(h => h.dia_semana === dia);
    if (existing) {
      const newActivo = !existing.activo;
      await supabase.from('horarios_visita_proveedor').update({ activo: newActivo }).eq('id', existing.id);
      setHorarios(prev => prev.map(h => h.id === existing.id ? { ...h, activo: newActivo } : h));
    } else {
      const { data } = await supabase.from('horarios_visita_proveedor').insert({
        proveedor_id: proveedorId,
        dia_semana: dia,
        activo: true,
      }).select('*').single();
      if (data) setHorarios(prev => [...prev, data as HorarioVisita]);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!proveedor) return null;

  const espacios = publicaciones.filter(p => p.tipo_publicacion === 'espacio_vacio' || p.tipo_publicacion === 'fraccion');
  const cargas = publicaciones.filter(p => p.tipo_publicacion === 'carga_completa' || p.tipo_publicacion === 'ruta_compartible');

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'perfil', label: 'Datos generales', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'unidades', label: `Unidades (${unidades.length})`, icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'rutas', label: 'Rutas', icon: <RouteIcon className="w-3.5 h-3.5" /> },
    { id: 'espacios', label: `Espacios (${espacios.length})`, icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'cargas', label: `Cargas (${cargas.length})`, icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'visitas', label: 'Visitas', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'historial', label: 'Historial', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'estatus', label: 'Estatus', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  const ESTATUS_COLOR: Record<string, string> = {
    aprobado: 'bg-green-500/15 text-green-400 border-green-500/30',
    activo: 'bg-green-500/15 text-green-400 border-green-500/30',
    pendiente: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    pendiente_revision: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    suspendido: 'bg-destructive/15 text-destructive border-destructive/30',
    bloqueado: 'bg-destructive/15 text-destructive border-destructive/30',
    bajo_supervision: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/cuenta" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
            {proveedor.logo_url ? (
              <img src={proveedor.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Truck className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-foreground flex items-center gap-2">
              {proveedor.nombre_comercial}
              {proveedor.premium_activo && <Crown className="w-4 h-4 text-yellow-400" />}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${ESTATUS_COLOR[proveedor.estatus ?? 'activo'] ?? 'bg-muted/30 text-muted-foreground border-border'}`}>
                {(proveedor.estatus ?? 'activo').replace(/_/g, ' ')}
              </span>
              {proveedor.calificacion != null && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  {proveedor.calificacion.toFixed(1)}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">Portal de Proveedor Logístico</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-card border border-border rounded-xl p-1 gap-0.5 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ TAB: DATOS GENERALES ═══ */}
        {tab === 'perfil' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Logo */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" /> Identidad comercial
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
                  {proveedor.logo_url ? <img src={proveedor.logo_url} alt="" className="w-full h-full object-cover" /> : <Truck className="w-8 h-8 text-muted-foreground" />}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-bold cursor-pointer hover:bg-primary/20 transition-all">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Profile fields */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Información general
                </h3>
                <Button size="sm" variant="outline" onClick={() => editingProfile ? saveProfile() : setEditingProfile(true)} disabled={savingProfile} className="text-xs gap-1">
                  {editingProfile ? (savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />) : <Settings className="w-3 h-3" />}
                  {editingProfile ? 'Guardar' : 'Editar'}
                </Button>
              </div>

              {editingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Razón social</label>
                    <Input value={profileForm.razon_social} onChange={e => setProfileForm(p => ({ ...p, razon_social: e.target.value }))} className="bg-background border-border text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Responsable</label>
                    <Input value={profileForm.responsable_nombre} onChange={e => setProfileForm(p => ({ ...p, responsable_nombre: e.target.value }))} className="bg-background border-border text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Dirección fiscal</label>
                    <Input value={profileForm.direccion} onChange={e => setProfileForm(p => ({ ...p, direccion: e.target.value }))} className="bg-background border-border text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Dirección operativa</label>
                    <Input value={profileForm.direccion_operativa} onChange={e => setProfileForm(p => ({ ...p, direccion_operativa: e.target.value }))} className="bg-background border-border text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Años de experiencia</label>
                    <Input value={profileForm.anios_experiencia} onChange={e => setProfileForm(p => ({ ...p, anios_experiencia: e.target.value }))} type="number" className="bg-background border-border text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-muted-foreground mb-1 block">Descripción del proveedor</label>
                    <Textarea value={profileForm.descripcion} onChange={e => setProfileForm(p => ({ ...p, descripcion: e.target.value }))} className="bg-background border-border text-sm" rows={3} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Nombre comercial', value: proveedor.nombre_comercial },
                    { label: 'Razón social', value: proveedor.razon_social },
                    { label: 'Responsable', value: proveedor.responsable_nombre },
                    { label: 'WhatsApp', value: proveedor.whatsapp },
                    { label: 'Correo', value: proveedor.correo },
                    { label: 'Dirección fiscal', value: proveedor.direccion },
                    { label: 'Dirección operativa', value: proveedor.direccion_operativa },
                    { label: 'Años de experiencia', value: proveedor.anios_experiencia?.toString() },
                  ].map(f => (
                    <div key={f.label} className="bg-background border border-border rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-medium text-foreground text-sm">{f.value ?? '—'}</p>
                    </div>
                  ))}
                  {proveedor.descripcion && (
                    <div className="sm:col-span-2 bg-background border border-border rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Descripción</p>
                      <p className="text-sm text-foreground">{proveedor.descripcion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modalidades y Tipos de Servicio */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Modalidades y servicios
              </h3>
              <div className="mb-4">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Modalidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {MODALIDADES.map(m => {
                    const active = (proveedor.modalidades ?? []).includes(m);
                    return (
                      <button key={m} onClick={() => toggleArrayField('modalidades', m)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${active ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Tipos de servicio</p>
                <div className="flex flex-wrap gap-1.5">
                  {TIPOS_SERVICIO.map(t => {
                    const active = (proveedor.tipos_servicio ?? []).includes(t);
                    return (
                      <button key={t} onClick={() => toggleArrayField('tipos_servicio', t)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${active ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}>
                        {t.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ TAB: UNIDADES ═══ */}
        {tab === 'unidades' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{unidades.length} unidades registradas</p>
              <Button size="sm" onClick={() => setAddingUnidad(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Agregar unidad
              </Button>
            </div>

            {addingUnidad && (
              <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={newUnidad.tipo} onChange={e => setNewUnidad(p => ({ ...p, tipo: e.target.value }))}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground">
                    <option value="">Tipo de unidad</option>
                    {TIPO_UNIDADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Input value={newUnidad.capacidad} onChange={e => setNewUnidad(p => ({ ...p, capacidad: e.target.value }))} placeholder="Capacidad m³" type="number" className="bg-background border-border" />
                  <Input value={newUnidad.capacidadPeso} onChange={e => setNewUnidad(p => ({ ...p, capacidadPeso: e.target.value }))} placeholder="Capacidad kg" type="number" className="bg-background border-border" />
                  <Input value={newUnidad.placas} onChange={e => setNewUnidad(p => ({ ...p, placas: e.target.value }))} placeholder="Placas" className="bg-background border-border" />
                  <Input value={newUnidad.observaciones} onChange={e => setNewUnidad(p => ({ ...p, observaciones: e.target.value }))} placeholder="Observaciones" className="bg-background border-border sm:col-span-2" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddUnidad} disabled={!newUnidad.tipo}>Guardar</Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingUnidad(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {unidades.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {u.foto_url ? <img src={u.foto_url} alt="" className="w-full h-full object-cover rounded-lg" /> : <Truck className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{u.tipo_unidad ?? 'Unidad'}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.capacidad_m3 ? `${u.capacidad_m3} m³` : '—'} · {u.capacidad_peso ? `${u.capacidad_peso} kg` : '—'} · {u.placas ?? 'Sin placas'}
                  </p>
                  {u.observaciones && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{u.observaciones}</p>}
                </div>
                <button onClick={() => toggleUnidad(u.id, u.activa)} className={`transition-colors ${u.activa ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {u.activa ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            ))}
            {unidades.length === 0 && !addingUnidad && (
              <p className="text-center text-muted-foreground text-sm py-8">Sin unidades registradas</p>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: RUTAS Y COBERTURA ═══ */}
        {tab === 'rutas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Ciudades */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Ciudades de cobertura
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(proveedor.ciudades_cobertura ?? []).map(c => (
                  <span key={c} className="text-xs px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center gap-1">
                    {c}
                    <button onClick={() => removeCiudad(c)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {(proveedor.ciudades_cobertura ?? []).length === 0 && <span className="text-xs text-muted-foreground">Sin ciudades registradas</span>}
              </div>
              <div className="flex gap-2">
                <Input value={newCiudad} onChange={e => setNewCiudad(e.target.value)} placeholder="Ej. Guadalajara" className="bg-background border-border text-sm flex-1" />
                <Button size="sm" onClick={addCiudad} disabled={!newCiudad.trim()} className="gap-1"><Plus className="w-3.5 h-3.5" /> Agregar</Button>
              </div>
            </div>

            {/* Rutas frecuentes */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-primary" /> Rutas frecuentes
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(proveedor.rutas_frecuentes ?? []).map(r => (
                  <span key={r} className="text-xs px-2 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center gap-1">
                    {r}
                    <button onClick={() => removeRuta(r)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {(proveedor.rutas_frecuentes ?? []).length === 0 && <span className="text-xs text-muted-foreground">Sin rutas registradas</span>}
              </div>
              <div className="flex gap-2">
                <Input value={newRuta} onChange={e => setNewRuta(e.target.value)} placeholder="Ej. CDMX → Guadalajara" className="bg-background border-border text-sm flex-1" />
                <Button size="sm" onClick={addRuta} disabled={!newRuta.trim()} className="gap-1"><Plus className="w-3.5 h-3.5" /> Agregar</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ TAB: ESPACIOS DISPONIBLES ═══ */}
        {tab === 'espacios' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs text-muted-foreground">Publica espacios vacíos en tus rutas</p>
                <p className="text-[10px] text-muted-foreground/60">Vigencia: 48 horas · Comisión: 10% publicador / 10% tomador</p>
              </div>
              <Button size="sm" onClick={() => { setNewPub(p => ({ ...p, tipo: 'espacio_vacio' })); setAddingPub(true); }} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Publicar espacio
              </Button>
            </div>

            {addingPub && newPub.tipo === 'espacio_vacio' && renderPubForm()}

            {espacios.map(p => renderPubCard(p))}
            {espacios.length === 0 && !addingPub && <p className="text-center text-muted-foreground text-sm py-8">Sin espacios publicados</p>}
          </motion.div>
        )}

        {/* ═══ TAB: CARGAS DISPONIBLES ═══ */}
        {tab === 'cargas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs text-muted-foreground">Publica cargas para compartir con otros proveedores</p>
                <p className="text-[10px] text-muted-foreground/60">Vigencia configurable · Comisión: 10% por parte</p>
              </div>
              <Button size="sm" onClick={() => { setNewPub(p => ({ ...p, tipo: 'carga_completa' })); setAddingPub(true); }} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Publicar carga
              </Button>
            </div>

            {addingPub && (newPub.tipo === 'carga_completa' || newPub.tipo === 'ruta_compartible') && renderPubForm()}

            {cargas.map(p => renderPubCard(p))}
            {cargas.length === 0 && !addingPub && <p className="text-center text-muted-foreground text-sm py-8">Sin cargas publicadas</p>}
          </motion.div>
        )}

        {/* ═══ TAB: VISITAS OCULARES ═══ */}
        {tab === 'visitas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Disponibilidad para visitas oculares
              </h3>
              <div className="space-y-2">
                {DIAS.map((dia, i) => {
                  const horario = horarios.find(h => h.dia_semana === i);
                  const activo = horario?.activo ?? false;
                  return (
                    <button key={i} onClick={() => toggleHorario(i)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${activo ? 'bg-primary/10 border-primary/30' : 'bg-background border-border hover:border-border/80'}`}>
                      <span className={`text-sm font-medium ${activo ? 'text-primary' : 'text-muted-foreground'}`}>{dia}</span>
                      <div className="flex items-center gap-2">
                        {activo && <span className="text-xs text-muted-foreground">{horario?.hora_inicio ?? '9:00'} - {horario?.hora_fin ?? '17:00'}</span>}
                        <div className={`w-8 h-5 rounded-full border transition-all ${activo ? 'bg-primary border-primary' : 'bg-muted border-border'}`}>
                          <div className={`w-4 h-4 rounded-full bg-background shadow transition-all mt-0.5 ${activo ? 'ml-3.5' : 'ml-0.5'}`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Solicitudes recibidas */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Solicitudes recibidas ({solicitudes.length})
              </h3>
              {solicitudes.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Sin solicitudes de visita</p>}
              <div className="space-y-2">
                {solicitudes.map(s => (
                  <div key={s.id} className="p-3 bg-background border border-border rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          Visita — {new Date(s.fecha_solicitada).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                          {s.hora_solicitada && ` a las ${s.hora_solicitada}`}
                        </p>
                        {s.direccion && <p className="text-xs text-muted-foreground mt-0.5">{s.direccion}</p>}
                        {s.notas && <p className="text-xs text-muted-foreground/70 italic mt-0.5">"{s.notas}"</p>}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        s.estatus === 'pendiente' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                        s.estatus === 'confirmada' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                        'bg-muted/30 text-muted-foreground border-border'
                      }`}>{s.estatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ TAB: HISTORIAL ═══ */}
        {tab === 'historial' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Resumen operativo
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-background border border-border rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-foreground">{serviciosCount}</p>
                  <p className="text-[10px] text-muted-foreground">Servicios completados</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-foreground">{unidades.filter(u => u.activa).length}</p>
                  <p className="text-[10px] text-muted-foreground">Unidades activas</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-foreground">{incidencias.length}</p>
                  <p className="text-[10px] text-muted-foreground">Incidencias</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-foreground">{sanciones.length}</p>
                  <p className="text-[10px] text-muted-foreground">Sanciones</p>
                </div>
              </div>
            </div>

            {/* Incidencias recientes */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Incidencias recientes
              </h3>
              {incidencias.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin incidencias registradas</p>}
              <div className="space-y-2">
                {incidencias.slice(0, 10).map(inc => (
                  <div key={inc.id} className="p-3 bg-background border border-border rounded-xl text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{inc.tipo_incidencia ?? 'Incidencia'}</p>
                        {inc.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{inc.descripcion}</p>}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        inc.estatus === 'resuelta' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                        inc.estatus === 'abierta' ? 'bg-destructive/15 text-destructive border-destructive/30' :
                        'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                      }`}>{inc.estatus ?? 'pendiente'}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(inc.fecha_reporte)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sanciones */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" /> Historial de sanciones
              </h3>
              {sanciones.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin sanciones</p>}
              <div className="space-y-2">
                {sanciones.map(s => (
                  <div key={s.id} className="p-3 bg-background border border-destructive/20 rounded-xl text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">{s.motivo ?? 'Sanción registrada'}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${s.bloqueado ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
                        {s.bloqueado ? 'Bloqueado' : 'Advertencia'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {fmtDate(s.fecha_inicio)}{s.fecha_fin ? ` — ${fmtDate(s.fecha_fin)}` : ' — Vigente'}
                    </p>
                    {(s.monto_adeudo || s.monto_reingreso) && (
                      <p className="text-[10px] text-orange-400 mt-0.5">Adeudo: {fmt(s.monto_adeudo)} · Reingreso: {fmt(s.monto_reingreso)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ TAB: ESTATUS ═══ */}
        {tab === 'estatus' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Estado actual del proveedor
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatusCard label="Estatus operativo" value={(proveedor.estatus ?? 'activo').replace(/_/g, ' ')} variant={['aprobado', 'activo'].includes(proveedor.estatus ?? '') ? 'success' : 'warning'} />
                <StatusCard label="Premium" value={proveedor.premium_activo ? 'Activo' : 'Inactivo'} variant={proveedor.premium_activo ? 'premium' : 'neutral'} />
                <StatusCard label="Supervisión especial" value={proveedor.supervision_especial ? 'Sí — bajo supervisión' : 'No'} variant={proveedor.supervision_especial ? 'danger' : 'success'} />
                <StatusCard label="Calificación" value={proveedor.calificacion != null ? `${proveedor.calificacion.toFixed(1)} ★` : 'Sin calificación'} variant="neutral" />
                <StatusCard label="Adeudo pendiente" value={fmt(proveedor.adeudo_cliente_pendiente)} variant={proveedor.adeudo_cliente_pendiente > 0 ? 'warning' : 'success'} />
                <StatusCard label="Cuota de reingreso" value={fmt(proveedor.cuota_reingreso_pendiente)} variant={proveedor.cuota_reingreso_pendiente > 0 ? 'danger' : 'success'} />
                <StatusCard label="Servicios sin anticipo restantes" value={proveedor.servicios_sin_anticipo_restantes.toString()} variant={proveedor.servicios_sin_anticipo_restantes > 0 ? 'warning' : 'success'} />
                <StatusCard label="Activo en plataforma" value={proveedor.activo ? 'Sí' : 'No'} variant={proveedor.activo ? 'success' : 'danger'} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  // ── Helpers for pub form/card ──
  function renderPubForm() {
    return (
      <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={newPub.tipo} onChange={e => setNewPub(p => ({ ...p, tipo: e.target.value }))}
            className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground">
            {TIPO_PUBLICACIONES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <Input value={newPub.origen} onChange={e => setNewPub(p => ({ ...p, origen: e.target.value }))} placeholder="Origen" className="bg-background border-border" />
          <Input value={newPub.destino} onChange={e => setNewPub(p => ({ ...p, destino: e.target.value }))} placeholder="Destino" className="bg-background border-border" />
          <Input value={newPub.fecha} onChange={e => setNewPub(p => ({ ...p, fecha: e.target.value }))} type="date" className="bg-background border-border" />
          <Input value={newPub.volumen} onChange={e => setNewPub(p => ({ ...p, volumen: e.target.value }))} placeholder="Volumen m³" type="number" className="bg-background border-border" />
          <Input value={newPub.costo} onChange={e => setNewPub(p => ({ ...p, costo: e.target.value }))} placeholder="Costo ofrecido $" type="number" className="bg-background border-border" />
        </div>
        <p className="text-[10px] text-muted-foreground">Comisión: 10% publicador · 10% tomador · Expira en 48h</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handlePublish}>Publicar</Button>
          <Button size="sm" variant="outline" onClick={() => setAddingPub(false)}>Cancelar</Button>
        </div>
      </div>
    );
  }

  function renderPubCard(p: Publicacion) {
    return (
      <div key={p.id} className={`p-4 bg-card border rounded-xl ${p.estatus === 'activa' ? 'border-green-500/20' : 'border-border'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-foreground text-sm">{p.tipo_publicacion?.replace(/_/g, ' ') ?? 'Publicación'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.origen} → {p.destino} · {p.volumen_disponible ? `${p.volumen_disponible} m³` : '—'}
              {p.costo_ofrecido ? ` · ${fmt(p.costo_ofrecido)}` : ''}
            </p>
            {p.fecha_salida && <p className="text-[10px] text-muted-foreground mt-0.5">Salida: {fmtDate(p.fecha_salida)}</p>}
            {p.expira_at && <p className="text-[10px] text-muted-foreground/60">Expira: {fmtDate(p.expira_at)}</p>}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
            p.estatus === 'activa' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
            p.estatus === 'expirada' ? 'bg-muted/30 text-muted-foreground border-border' :
            'bg-primary/15 text-primary border-primary/30'
          }`}>{p.estatus}</span>
        </div>
      </div>
    );
  }
}

// ── Status card helper ──
function StatusCard({ label, value, variant }: { label: string; value: string; variant: 'success' | 'warning' | 'danger' | 'premium' | 'neutral' }) {
  const colors = {
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    danger: 'border-destructive/20 bg-destructive/5',
    premium: 'border-yellow-500/20 bg-yellow-500/5',
    neutral: 'border-border bg-background',
  };
  const textColors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-destructive',
    premium: 'text-yellow-400',
    neutral: 'text-foreground',
  };
  return (
    <div className={`border rounded-xl p-3 ${colors[variant]}`}>
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`font-semibold text-sm ${textColors[variant]}`}>{value}</p>
    </div>
  );
}
