/**
 * ReputacionCard — Provider-facing reputation summary with level, KPIs, and tips
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Crown, Shield, AlertTriangle, Ban, TrendingUp, CheckCircle2, XCircle, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  proveedorId: string;
}

interface RepData {
  calificacion: number | null;
  premium_activo: boolean;
  supervision_especial: boolean;
  servicios_count: number;
  incidencias_count: number;
  incidencias_abiertas: number;
  nivel: string;
  dimensiones: { puntualidad: number; trato: number; cuidado_carga: number; cumplimiento: number; experiencia_general: number } | null;
}

const NIVEL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Star; desc: string }> = {
  premium: { label: 'Premium', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Crown, desc: 'Máximo nivel. Prioridad en cotizaciones y acceso completo.' },
  confiable: { label: 'Confiable', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: Shield, desc: 'Buen historial. Acceso a servicios urgentes y pagos rápidos.' },
  regular: { label: 'Regular', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: Star, desc: 'En crecimiento. Completa más servicios para subir de nivel.' },
  bajo_supervision: { label: 'Bajo supervisión', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: AlertTriangle, desc: 'Atención requerida. Resuelve incidencias para mejorar.' },
  suspendido: { label: 'Suspendido', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: Ban, desc: 'Cuenta suspendida. Contacta administración.' },
};

function computeNivel(cal: number | null, servicios: number, incAbiertas: number, premium: boolean, supervision: boolean): string {
  if (supervision || incAbiertas >= 2 || (cal != null && cal < 2.5)) return 'bajo_supervision';
  if (servicios < 5 || (cal != null && cal < 3.5) || cal == null) return 'regular';
  if (premium && cal >= 4.5 && servicios >= 20 && incAbiertas === 0) return 'premium';
  if (cal >= 3.5 && servicios >= 5) return 'confiable';
  return 'regular';
}

export default function ReputacionCard({ proveedorId }: Props) {
  const [data, setData] = useState<RepData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [provRes, svcRes, incRes, incOpenRes, calRes] = await Promise.all([
        supabase.from('proveedores').select('calificacion,premium_activo,supervision_especial').eq('id', proveedorId).single(),
        supabase.from('ordenes_servicio').select('id', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).eq('estatus', 'finalizado'),
        supabase.from('incidencias').select('id', { count: 'exact', head: true }).eq('proveedor_id', proveedorId),
        supabase.from('incidencias').select('id', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).in('estatus', ['abierta', 'en_proceso']),
        supabase.from('calificaciones_servicio').select('puntualidad,trato,cuidado_carga,cumplimiento,experiencia_general').eq('proveedor_id', proveedorId),
      ]);

      const p = provRes.data as any;
      if (!p) { setLoading(false); return; }

      const svc = svcRes.count ?? 0;
      const incOpen = incOpenRes.count ?? 0;
      const cals = (calRes.data ?? []) as any[];

      let dims = null;
      if (cals.length > 0) {
        dims = {
          puntualidad: +(cals.reduce((s: number, c: any) => s + c.puntualidad, 0) / cals.length).toFixed(1),
          trato: +(cals.reduce((s: number, c: any) => s + c.trato, 0) / cals.length).toFixed(1),
          cuidado_carga: +(cals.reduce((s: number, c: any) => s + c.cuidado_carga, 0) / cals.length).toFixed(1),
          cumplimiento: +(cals.reduce((s: number, c: any) => s + c.cumplimiento, 0) / cals.length).toFixed(1),
          experiencia_general: +(cals.reduce((s: number, c: any) => s + c.experiencia_general, 0) / cals.length).toFixed(1),
        };
      }

      setData({
        calificacion: p.calificacion,
        premium_activo: p.premium_activo,
        supervision_especial: p.supervision_especial,
        servicios_count: svc,
        incidencias_count: incRes.count ?? 0,
        incidencias_abiertas: incOpen,
        nivel: computeNivel(p.calificacion, svc, incOpen, p.premium_activo, p.supervision_especial),
        dimensiones: dims,
      });
      setLoading(false);
    };
    fetch();
  }, [proveedorId]);

  if (loading || !data) return null;

  const cfg = NIVEL_CONFIG[data.nivel] ?? NIVEL_CONFIG.regular;
  const Icon = cfg.icon;
  const cumplimiento = data.servicios_count > 0
    ? Math.round(((data.servicios_count - data.incidencias_count) / data.servicios_count) * 100)
    : 100;

  const tips: string[] = [];
  if (data.nivel === 'regular') {
    if (data.servicios_count < 5) tips.push('Completa al menos 5 servicios para subir a "Confiable"');
    if ((data.calificacion ?? 0) < 3.5) tips.push('Mantén una calificación de 3.5+ para avanzar');
  }
  if (data.nivel === 'bajo_supervision') {
    if (data.incidencias_abiertas > 0) tips.push('Resuelve tus incidencias abiertas lo antes posible');
    tips.push('Mantén buena comunicación y cumple los tiempos');
  }
  if (data.nivel === 'confiable') {
    tips.push('Para llegar a Premium: 4.5+ de calificación, 20+ servicios y 0 incidencias');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${cfg.bg}`}>
          <Icon className={`w-6 h-6 ${cfg.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            Tu Reputación
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          </h3>
          <p className="text-xs text-muted-foreground">{cfg.desc}</p>
        </div>
        {data.calificacion != null && (
          <div className="text-right">
            <p className="text-2xl font-black text-yellow-400">{data.calificacion.toFixed(1)}</p>
            <p className="text-[9px] text-muted-foreground">★ promedio</p>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-background border border-border text-center">
          <p className="text-lg font-black text-foreground">{data.servicios_count}</p>
          <p className="text-[9px] text-muted-foreground">Servicios</p>
        </div>
        <div className="p-3 rounded-xl bg-background border border-border text-center">
          <p className={`text-lg font-black ${cumplimiento >= 90 ? 'text-green-400' : cumplimiento >= 70 ? 'text-yellow-400' : 'text-destructive'}`}>{cumplimiento}%</p>
          <p className="text-[9px] text-muted-foreground">Cumplimiento</p>
        </div>
        <div className="p-3 rounded-xl bg-background border border-border text-center">
          <p className={`text-lg font-black ${data.incidencias_abiertas === 0 ? 'text-green-400' : 'text-destructive'}`}>{data.incidencias_abiertas}</p>
          <p className="text-[9px] text-muted-foreground">Incidencias abiertas</p>
        </div>
      </div>

      {/* Dimension breakdown */}
      {data.dimensiones && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Detalle por dimensión</p>
          {([
            { key: 'puntualidad', label: '⏰ Puntualidad' },
            { key: 'trato', label: '🤝 Trato' },
            { key: 'cuidado_carga', label: '📦 Cuidado' },
            { key: 'cumplimiento', label: '✅ Cumplimiento' },
            { key: 'experiencia_general', label: '⭐ Experiencia' },
          ] as const).map(d => {
            const val = data.dimensiones![d.key];
            const pct = (val / 5) * 100;
            return (
              <div key={d.key} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-28 flex-shrink-0">{d.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-destructive/60'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="font-bold text-foreground w-6 text-right">{val}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
          <p className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Cómo mejorar
          </p>
          {tips.map((t, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" /> {t}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
