/**
 * ProveedorSelector — Smart provider matching "Uber mode"
 * Uses scoring engine to rank and display best providers.
 * Shows badges, opportunity indicators, and score-based ranking.
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Star, Crown, CheckCircle2, Shield, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  scoreProveedores,
  BADGE_CONFIG,
  type ProveedorRaw,
  type PublicacionCarga,
  type SancionRow,
  type IncidenciaCount,
  type ScoredProveedor,
  type ScoringInput,
} from '@/lib/proveedor-scoring';

interface Props {
  origen: string;
  destino: string;
  fecha?: string;
  volumen: number;
  modalidad: string;
  tipoServicio?: string;
  onSelect: (proveedorId: string, nombre: string) => void;
  selectedId?: string | null;
  pagado?: boolean;
}

export default function ProveedorSelector({ origen, destino, fecha, volumen, modalidad, tipoServicio, onSelect, selectedId, pagado }: Props) {
  const [proveedores, setProveedores] = useState<ProveedorRaw[]>([]);
  const [publicaciones, setPublicaciones] = useState<PublicacionCarga[]>([]);
  const [sanciones, setSanciones] = useState<SancionRow[]>([]);
  const [incidencias, setIncidencias] = useState<IncidenciaCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [provRes, pubRes] = await Promise.all([
        supabase
          .from('proveedores')
          .select('id,nombre_comercial,logo_url,calificacion,ciudades_cobertura,rutas_frecuentes,premium_activo,activo,estatus,supervision_especial,adeudo_cliente_pendiente,servicios_sin_anticipo_restantes')
          .eq('activo', true),
        supabase
          .from('publicaciones_carga')
          .select('id,proveedor_id,origen,destino,fecha_salida,volumen_disponible,estatus')
          .in('estatus', ['activa', 'publicada']),
      ]);

      if (provRes.data) setProveedores(provRes.data as unknown as ProveedorRaw[]);
      if (pubRes.data) setPublicaciones(pubRes.data as unknown as PublicacionCarga[]);
      
      // Sanctions and incidencias are admin-only tables, so for anon we use what we can from proveedores data
      // We'll derive sanctions from the provider flags directly
      setSanciones([]);
      setIncidencias([]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const scoringInput: ScoringInput = useMemo(() => ({
    origen, destino, fecha, volumen, modalidad, tipoServicio,
  }), [origen, destino, fecha, volumen, modalidad, tipoServicio]);

  const { selected } = useMemo(() => {
    if (proveedores.length === 0) return { selected: [], discarded: [] };
    return scoreProveedores(proveedores, publicaciones, sanciones, incidencias, scoringInput);
  }, [proveedores, publicaciones, sanciones, incidencias, scoringInput]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Analizando proveedores disponibles...
      </div>
    );
  }

  if (selected.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-neon-orange/10 border border-neon-orange/30 text-sm">
        <p className="font-bold text-neon-orange mb-1">Sin proveedores disponibles para esta ruta</p>
        <p className="text-xs text-muted-foreground">Contacta a un asesor para asignación manual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Proveedores recomendados ({selected.length})
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          Ordenados por compatibilidad
        </div>
      </div>

      <AnimatePresence>
        {selected.map((p, i) => (
          <ProveedorCard
            key={p.id}
            prov={p}
            index={i}
            isSelected={selectedId === p.id}
            pagado={pagado}
            modalidad={modalidad}
            onSelect={() => onSelect(p.id, p.nombre_comercial)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────

function ProveedorCard({ prov, index, isSelected, pagado, modalidad, onSelect }: {
  prov: ScoredProveedor;
  index: number;
  isSelected: boolean;
  pagado?: boolean;
  modalidad: string;
  onSelect: () => void;
}) {
  const uniqueBadges = [...new Set(prov.badges)];

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        isSelected
          ? 'bg-neon-cyan/10 border-neon-cyan/40 ring-1 ring-neon-cyan/30'
          : 'bg-surface border-border hover:border-neon-cyan/30 hover:bg-surface/80'
      }`}
    >
      {/* Badges row */}
      {uniqueBadges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {uniqueBadges.map(badge => {
            const cfg = BADGE_CONFIG[badge];
            return (
              <span key={badge} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                {cfg.emoji} {cfg.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar / Logo */}
        <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {pagado && prov.logo_url ? (
            <img src={prov.logo_url} alt={prov.nombre_comercial} className="w-full h-full object-cover" />
          ) : (
            <Truck className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-foreground truncate">
              {pagado ? prov.nombre_comercial : `Proveedor ${index + 1}`}
            </span>
            {prov.premium_activo && (
              <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            )}
          </div>

          {/* Rating + modalidad */}
          <div className="flex items-center gap-2 mt-0.5">
            {prov.calificacion != null && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-foreground">{prov.calificacion.toFixed(1)}</span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground capitalize">{modalidad}</span>
            {/* Score indicator */}
            <span className="text-[10px] text-muted-foreground/60 ml-auto">
              {prov.score.total}pts
            </span>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected ? (
          <CheckCircle2 className="w-5 h-5 text-neon-cyan flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
        )}
      </div>

      {/* Opportunity indicator */}
      {prov.isOpportunity && prov.opportunityDetail && (
        <div className="mt-2.5 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
          <p className="text-[11px] text-green-400 font-medium">
            🛣️ Servicio de oportunidad — {prov.opportunityDetail}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Aprovecha espacio en ruta con posible precio especial
          </p>
        </div>
      )}

      {/* After payment: show more details */}
      {pagado && isSelected && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-neon-green" />
          <span className="text-xs text-neon-green font-medium">Proveedor asignado · Datos desbloqueados</span>
        </div>
      )}
    </motion.button>
  );
}
