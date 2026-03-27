/**
 * /portal-proveedor — Provider self-service portal
 * Features: logo upload, units, routes, cargo publishing, interests, available spaces, visitas oculares
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Truck, Upload, Plus, X, Package, MapPin,
  Calendar, Star, Crown, Eye, Clock, Users, Settings,
  Image, Route as RouteIcon, CheckCircle2, RefreshCw,
  MessageSquare, AlertTriangle, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Proveedor {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  calificacion: number | null;
  ciudades_cobertura: string[] | null;
  rutas_frecuentes: string[] | null;
  premium_activo: boolean;
  whatsapp: string | null;
  correo: string | null;
}

interface Unidad {
  id: string;
  tipo_unidad: string | null;
  capacidad_m3: number | null;
  placas: string | null;
  activa: boolean;
}

interface Publicacion {
  id: string;
  tipo_publicacion: string | null;
  origen: string | null;
  destino: string | null;
  fecha_salida: string | null;
  volumen_disponible: number | null;
  costo_ofrecido: number | null;
  estatus: string | null;
  expira_at: string | null;
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

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIPO_UNIDADES = ['Nissan', 'Nissan Larga/3.5', 'Camioneta 3.5', 'Rabón', 'Torton', 'Camión Grande', 'Tráiler'];
const TIPO_PUBLICACIONES = ['espacio_vacio', 'fraccion', 'carga_completa', 'ruta_compartible'];

export default function PortalProveedor() {
  const { user, identity, isLoading } = useAuth();
  const navigate = useNavigate();

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [horarios, setHorarios] = useState<HorarioVisita[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'perfil' | 'unidades' | 'publicaciones' | 'horarios' | 'solicitudes'>('perfil');

  // Form states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [addingUnidad, setAddingUnidad] = useState(false);
  const [newUnidad, setNewUnidad] = useState({ tipo: '', capacidad: '', placas: '' });
  const [addingPub, setAddingPub] = useState(false);
  const [newPub, setNewPub] = useState({ tipo: 'espacio_vacio', origen: '', destino: '', fecha: '', volumen: '', costo: '' });
  const [newCiudad, setNewCiudad] = useState('');
  const [newRuta, setNewRuta] = useState('');

  const proveedorId = identity?.proveedor_id;

  useEffect(() => {
    if (!isLoading && (!user || !proveedorId)) {
      navigate('/cuenta');
    }
  }, [isLoading, user, proveedorId, navigate]);

  const fetchData = useCallback(async () => {
    if (!proveedorId) return;
    setLoading(true);
    const [p, u, pub, h, sol] = await Promise.all([
      supabase.from('proveedores').select('id,nombre_comercial,logo_url,calificacion,ciudades_cobertura,rutas_frecuentes,premium_activo,whatsapp,correo').eq('id', proveedorId).single(),
      supabase.from('proveedor_unidades').select('*').eq('proveedor_id', proveedorId),
      supabase.from('publicaciones_carga').select('*').eq('proveedor_id', proveedorId).order('created_at', { ascending: false }),
      supabase.from('horarios_visita_proveedor').select('*').eq('proveedor_id', proveedorId),
      supabase.from('solicitudes_visita').select('*').eq('proveedor_id', proveedorId).order('created_at', { ascending: false }),
    ]);
    if (p.data) setProveedor(p.data as Proveedor);
    setUnidades((u.data ?? []) as Unidad[]);
    setPublicaciones((pub.data ?? []) as Publicacion[]);
    setHorarios((h.data ?? []) as HorarioVisita[]);
    setSolicitudes((sol.data ?? []) as SolicitudVisita[]);
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

  // ── Add unit ──
  const handleAddUnidad = async () => {
    if (!proveedorId || !newUnidad.tipo) return;
    const { data } = await supabase.from('proveedor_unidades').insert({
      proveedor_id: proveedorId,
      tipo_unidad: newUnidad.tipo,
      capacidad_m3: newUnidad.capacidad ? Number(newUnidad.capacidad) : null,
      placas: newUnidad.placas || null,
    }).select('*').single();
    if (data) setUnidades(prev => [...prev, data as Unidad]);
    setNewUnidad({ tipo: '', capacidad: '', placas: '' });
    setAddingUnidad(false);
  };

  // ── Add ciudad/ruta ──
  const addCiudad = async () => {
    if (!proveedorId || !newCiudad.trim() || !proveedor) return;
    const updated = [...(proveedor.ciudades_cobertura ?? []), newCiudad.trim()];
    await supabase.from('proveedores').update({ ciudades_cobertura: updated }).eq('id', proveedorId);
    setProveedor(prev => prev ? { ...prev, ciudades_cobertura: updated } : prev);
    setNewCiudad('');
  };

  const addRuta = async () => {
    if (!proveedorId || !newRuta.trim() || !proveedor) return;
    const updated = [...(proveedor.rutas_frecuentes ?? []), newRuta.trim()];
    await supabase.from('proveedores').update({ rutas_frecuentes: updated }).eq('id', proveedorId);
    setProveedor(prev => prev ? { ...prev, rutas_frecuentes: updated } : prev);
    setNewRuta('');
  };

  // ── Publish cargo ──
  const handlePublish = async () => {
    if (!proveedorId) return;
    const { data } = await supabase.from('publicaciones_carga').insert({
      proveedor_id: proveedorId,
      tipo_publicacion: newPub.tipo,
      origen: newPub.origen || null,
      destino: newPub.destino || null,
      fecha_salida: newPub.fecha || null,
      volumen_disponible: newPub.volumen ? Number(newPub.volumen) : null,
      costo_ofrecido: newPub.costo ? Number(newPub.costo) : null,
      estatus: 'activa',
      comision_app_publicador: 10,
      comision_app_tomador: 10,
    }).select('*').single();
    if (data) setPublicaciones(prev => [data as Publicacion, ...prev]);
    setNewPub({ tipo: 'espacio_vacio', origen: '', destino: '', fecha: '', volumen: '', costo: '' });
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

  const TABS = [
    { id: 'perfil', label: 'Perfil', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'unidades', label: `Unidades (${unidades.length})`, icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'publicaciones', label: `Cargas (${publicaciones.length})`, icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'horarios', label: 'Visitas', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'solicitudes', label: `Solicitudes (${solicitudes.length})`, icon: <Users className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/cuenta" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
            {proveedor.logo_url ? (
              <img src={proveedor.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Truck className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-foreground flex items-center gap-2">
              {proveedor.nombre_comercial}
              {proveedor.premium_activo && <Crown className="w-4 h-4 text-yellow-400" />}
            </h1>
            <p className="text-xs text-muted-foreground">Portal de Proveedor</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-card border border-border rounded-xl p-1 gap-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Perfil Tab ── */}
        {tab === 'perfil' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Logo upload */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" /> Logo
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
                  {proveedor.logo_url ? (
                    <img src={proveedor.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Truck className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-bold cursor-pointer hover:bg-primary/20 transition-all">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Coverage cities */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Ciudades de cobertura
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(proveedor.ciudades_cobertura ?? []).map(c => (
                  <span key={c} className="text-xs px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">{c}</span>
                ))}
                {(proveedor.ciudades_cobertura ?? []).length === 0 && (
                  <span className="text-xs text-muted-foreground">Sin ciudades registradas</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input value={newCiudad} onChange={e => setNewCiudad(e.target.value)} placeholder="Ej. Guadalajara" className="bg-background border-border text-sm flex-1" />
                <Button size="sm" onClick={addCiudad} disabled={!newCiudad.trim()} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </Button>
              </div>
            </div>

            {/* Frequent routes */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-primary" /> Rutas frecuentes
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(proveedor.rutas_frecuentes ?? []).map(r => (
                  <span key={r} className="text-xs px-2 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">{r}</span>
                ))}
                {(proveedor.rutas_frecuentes ?? []).length === 0 && (
                  <span className="text-xs text-muted-foreground">Sin rutas registradas</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input value={newRuta} onChange={e => setNewRuta(e.target.value)} placeholder="Ej. CDMX → Guadalajara" className="bg-background border-border text-sm flex-1" />
                <Button size="sm" onClick={addRuta} disabled={!newRuta.trim()} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Unidades Tab ── */}
        {tab === 'unidades' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <Button size="sm" onClick={() => setAddingUnidad(true)} className="gap-1.5 mb-3">
              <Plus className="w-3.5 h-3.5" /> Agregar unidad
            </Button>

            {addingUnidad && (
              <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select value={newUnidad.tipo} onChange={e => setNewUnidad(p => ({ ...p, tipo: e.target.value }))}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground">
                    <option value="">Tipo de unidad</option>
                    {TIPO_UNIDADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Input value={newUnidad.capacidad} onChange={e => setNewUnidad(p => ({ ...p, capacidad: e.target.value }))} placeholder="Capacidad m³" type="number" className="bg-background border-border" />
                  <Input value={newUnidad.placas} onChange={e => setNewUnidad(p => ({ ...p, placas: e.target.value }))} placeholder="Placas" className="bg-background border-border" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddUnidad} disabled={!newUnidad.tipo}>Guardar</Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingUnidad(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {unidades.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                <Truck className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{u.tipo_unidad ?? 'Unidad'}</p>
                  <p className="text-xs text-muted-foreground">{u.capacidad_m3 ? `${u.capacidad_m3} m³` : '—'} · {u.placas ?? 'Sin placas'}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${u.activa ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-muted/30 text-muted-foreground border-border'}`}>
                  {u.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            ))}
            {unidades.length === 0 && !addingUnidad && (
              <p className="text-center text-muted-foreground text-sm py-8">Sin unidades registradas</p>
            )}
          </motion.div>
        )}

        {/* ── Publicaciones Tab ── */}
        {tab === 'publicaciones' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <Button size="sm" onClick={() => setAddingPub(true)} className="gap-1.5 mb-3">
              <Plus className="w-3.5 h-3.5" /> Publicar carga/espacio
            </Button>

            {addingPub && (
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
            )}

            {publicaciones.map(p => (
              <div key={p.id} className={`p-4 bg-card border rounded-xl ${p.estatus === 'activa' ? 'border-green-500/20' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground text-sm">{p.tipo_publicacion?.replace(/_/g, ' ') ?? 'Publicación'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.origen} → {p.destino} · {p.volumen_disponible ? `${p.volumen_disponible} m³` : '—'}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
                    p.estatus === 'activa' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                    p.estatus === 'expirada' ? 'bg-muted/30 text-muted-foreground border-border' :
                    'bg-primary/15 text-primary border-primary/30'
                  }`}>
                    {p.estatus}
                  </span>
                </div>
              </div>
            ))}
            {publicaciones.length === 0 && !addingPub && (
              <p className="text-center text-muted-foreground text-sm py-8">Sin publicaciones</p>
            )}
          </motion.div>
        )}

        {/* ── Horarios Tab ── */}
        {tab === 'horarios' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Disponibilidad para visitas oculares
              </h3>
              <div className="space-y-2">
                {DIAS.map((dia, i) => {
                  const horario = horarios.find(h => h.dia_semana === i);
                  const activo = horario?.activo ?? false;
                  return (
                    <button
                      key={i}
                      onClick={() => toggleHorario(i)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        activo ? 'bg-primary/10 border-primary/30' : 'bg-background border-border hover:border-border/80'
                      }`}
                    >
                      <span className={`text-sm font-medium ${activo ? 'text-primary' : 'text-muted-foreground'}`}>{dia}</span>
                      <div className="flex items-center gap-2">
                        {activo && <span className="text-xs text-muted-foreground">9:00 - 17:00</span>}
                        <div className={`w-8 h-5 rounded-full border transition-all ${activo ? 'bg-primary border-primary' : 'bg-muted border-border'}`}>
                          <div className={`w-4 h-4 rounded-full bg-background shadow transition-all mt-0.5 ${activo ? 'ml-3.5' : 'ml-0.5'}`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Solicitudes Tab ── */}
        {tab === 'solicitudes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {solicitudes.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Sin solicitudes de visita</p>
            )}
            {solicitudes.map(s => (
              <div key={s.id} className="p-4 bg-card border border-border rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      Visita — {new Date(s.fecha_solicitada).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      {s.hora_solicitada && ` a las ${s.hora_solicitada}`}
                    </p>
                    {s.direccion && <p className="text-xs text-muted-foreground mt-0.5">{s.direccion}</p>}
                    {s.notas && <p className="text-xs text-muted-foreground italic mt-1">"{s.notas}"</p>}
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
                    s.estatus === 'pendiente' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                    s.estatus === 'confirmada' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                    'bg-muted/30 text-muted-foreground border-border'
                  }`}>
                    {s.estatus}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
