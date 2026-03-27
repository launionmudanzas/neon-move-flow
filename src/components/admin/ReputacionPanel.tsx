/**
 * ReputacionPanel — Admin ranking & reputation management
 */
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Star, Crown, AlertTriangle, Shield, Search, XCircle,
  ChevronDown, ChevronUp, Award, Ban, Eye, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProveedorReputacion {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  calificacion: number | null;
  premium_activo: boolean;
  activo: boolean;
  supervision_especial: boolean;
  estatus: string | null;
  servicios_sin_anticipo_restantes: number;
  cuota_reingreso_pendiente: number;
  adeudo_cliente_pendiente: number;
  servicios_count: number;
  incidencias_count: number;
  nivel: string;
}

interface Calificacion {
  id: string;
  puntualidad: number;
  trato: number;
  cuidado_carga: number;
  cumplimiento: number;
  experiencia_general: number;
  promedio: number | null;
  comentario: string | null;
  created_at: string;
  proveedor_id: string;
}

const NIVELES = [
  { key: 'premium', label: 'Premium', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: Crown },
  { key: 'confiable', label: 'Confiable', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', icon: Shield },
  { key: 'regular', label: 'Regular', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', icon: Star },
  { key: 'bajo_supervision', label: 'Bajo supervisión', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', icon: AlertTriangle },
  { key: 'suspendido', label: 'Suspendido', color: 'text-destructive', bg: 'bg-destructive/15 border-destructive/30', icon: Ban },
];

function computeNivel(cal: number | null, servicios: number, incidencias: number, estatus: string | null, premium: boolean, supervision: boolean): string {
  if (estatus === 'suspendido' || estatus === 'bloqueado') return 'suspendido';
  if (supervision || incidencias >= 2 || (cal != null && cal < 2.5)) return 'bajo_supervision';
  if (servicios < 5 || (cal != null && cal < 3.5) || cal == null) return 'regular';
  if (premium && cal >= 4.5 && servicios >= 20 && incidencias === 0) return 'premium';
  if (cal >= 3.5 && servicios >= 5) return 'confiable';
  return 'regular';
}

export default function ReputacionPanel() {
  const [proveedores, setProveedores] = useState<ProveedorReputacion[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterNivel, setFilterNivel] = useState('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [provRes, calRes, svcRes, incRes] = await Promise.all([
      supabase.from('proveedores').select('id,nombre_comercial,logo_url,calificacion,premium_activo,activo,supervision_especial,estatus,servicios_sin_anticipo_restantes,cuota_reingreso_pendiente,adeudo_cliente_pendiente'),
      supabase.from('calificaciones_servicio').select('id,puntualidad,trato,cuidado_carga,cumplimiento,experiencia_general,promedio,comentario,created_at,proveedor_id').order('created_at', { ascending: false }).limit(500),
      supabase.from('ordenes_servicio').select('proveedor_id').eq('estatus', 'finalizado'),
      supabase.from('incidencias').select('proveedor_id').in('estatus', ['abierta', 'en_proceso']),
    ]);

    const svcCounts = new Map<string, number>();
    (svcRes.data ?? []).forEach((r: any) => { svcCounts.set(r.proveedor_id, (svcCounts.get(r.proveedor_id) ?? 0) + 1); });
    const incCounts = new Map<string, number>();
    (incRes.data ?? []).forEach((r: any) => { incCounts.set(r.proveedor_id, (incCounts.get(r.proveedor_id) ?? 0) + 1); });

    const provs: ProveedorReputacion[] = ((provRes.data ?? []) as any[]).map(p => {
      const svc = svcCounts.get(p.id) ?? 0;
      const inc = incCounts.get(p.id) ?? 0;
      return {
        ...p,
        servicios_count: svc,
        incidencias_count: inc,
        nivel: computeNivel(p.calificacion, svc, inc, p.estatus, p.premium_activo, p.supervision_especial),
      };
    });
    provs.sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0));
    setProveedores(provs);
    setCalificaciones((calRes.data ?? []) as Calificacion[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return proveedores.filter(p => {
      if (filterNivel !== 'todos' && p.nivel !== filterNivel) return false;
      if (q && !p.nombre_comercial.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [proveedores, search, filterNivel]);

  const nivelCounts = useMemo(() => {
    const c: Record<string, number> = {};
    proveedores.forEach(p => { c[p.nivel] = (c[p.nivel] ?? 0) + 1; });
    return c;
  }, [proveedores]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Award className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground">Reputación de Proveedores</h3>
          <p className="text-xs text-muted-foreground">Ranking, niveles y calificaciones del cliente</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="ml-auto gap-1 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      {/* Nivel summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {NIVELES.map(n => (
          <button
            key={n.key}
            onClick={() => setFilterNivel(filterNivel === n.key ? 'todos' : n.key)}
            className={`p-3 rounded-xl border text-center transition-all ${
              filterNivel === n.key ? n.bg + ' ring-1 ring-offset-1 ring-offset-background' : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            <n.icon className={`w-4 h-4 mx-auto mb-1 ${n.color}`} />
            <p className={`text-xl font-black ${n.color}`}>{nivelCounts[n.key] ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">{n.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
      </div>

      {/* Ranking list */}
      <div className="space-y-2">
        {loading && <div className="text-center py-12 text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando...</div>}
        {!loading && filtered.map((p, i) => {
          const nivelCfg = NIVELES.find(n => n.key === p.nivel) ?? NIVELES[2];
          const provCals = calificaciones.filter(c => c.proveedor_id === p.id);
          const expanded = expandedId === p.id;

          return (
            <motion.div key={p.id} layout className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : p.id)}
                className="w-full text-left p-3 flex items-center gap-3"
              >
                <span className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center text-xs font-black text-muted-foreground">
                  #{i + 1}
                </span>
                {p.logo_url
                  ? <img src={p.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center"><Star className="w-4 h-4 text-muted-foreground" /></div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground truncate">{p.nombre_comercial}</span>
                    {p.premium_activo && <Crown className="w-3 h-3 text-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[9px] font-bold border ${nivelCfg.bg} ${nivelCfg.color}`}>
                      {nivelCfg.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{p.servicios_count} servicios · {p.incidencias_count} incidencias</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-black ${(p.calificacion ?? 0) >= 4 ? 'text-yellow-400' : (p.calificacion ?? 0) >= 3 ? 'text-foreground' : 'text-destructive'}`}>
                    {p.calificacion != null ? p.calificacion.toFixed(1) : '—'}
                  </p>
                  <p className="text-[9px] text-muted-foreground">★ promedio</p>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border/30 p-4 space-y-3">
                  {/* Dimension averages */}
                  {provCals.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {(['puntualidad', 'trato', 'cuidado_carga', 'cumplimiento', 'experiencia_general'] as const).map(dim => {
                        const avg = provCals.reduce((s, c) => s + c[dim], 0) / provCals.length;
                        return (
                          <div key={dim} className="text-center p-2 rounded-lg bg-background border border-border">
                            <p className="text-lg font-black text-foreground">{avg.toFixed(1)}</p>
                            <p className="text-[9px] text-muted-foreground capitalize">{dim.replace(/_/g, ' ')}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Flags */}
                  <div className="flex flex-wrap gap-2">
                    {p.supervision_especial && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 font-bold">⚠️ Supervisión especial</span>}
                    {p.adeudo_cliente_pendiente > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold">💰 Adeudo: ${p.adeudo_cliente_pendiente.toLocaleString()}</span>}
                    {p.cuota_reingreso_pendiente > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold">🔑 Reingreso: ${p.cuota_reingreso_pendiente.toLocaleString()}</span>}
                    {p.servicios_sin_anticipo_restantes > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-bold">🚫 Sin anticipo: {p.servicios_sin_anticipo_restantes} servicios</span>}
                  </div>

                  {/* Recent comments */}
                  {provCals.filter(c => c.comentario).length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Comentarios recientes</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {provCals.filter(c => c.comentario).slice(0, 5).map(c => (
                          <div key={c.id} className="p-2 rounded-lg bg-background border border-border text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-yellow-400 font-bold">{(c.promedio ?? 0).toFixed(1)} ★</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString('es-MX')}</span>
                            </div>
                            <p className="text-foreground italic">"{c.comentario}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {provCals.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Sin calificaciones aún</p>}
                </motion.div>
              )}
            </motion.div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <XCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron proveedores</p>
          </div>
        )}
      </div>
    </div>
  );
}
