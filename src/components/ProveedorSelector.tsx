/**
 * ProveedorSelector — Smart provider matching "Uber mode"
 * Intelligent funnel: filters, scores, and displays only the best providers.
 * Shows rich cards with experience, coverage, unit types, and badges.
 * Never shows contact info. Feels like a curated logistics network.
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Star, Crown, CheckCircle2, Shield, Loader2, TrendingUp,
  MapPin, Briefcase, BadgeCheck, MessageSquare,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  scoreProveedores,
  BADGE_CONFIG,
  type ProveedorRaw,
  type ProveedorUnidad,
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
  /** Called when no providers are available */
  onNoProviders?: () => void;
}

const WHATSAPP_NUMBER = '4421270514';

export default function ProveedorSelector({
  origen, destino, fecha, volumen, modalidad, tipoServicio,
  onSelect, selectedId, pagado, onNoProviders,
}: Props) {
  const [proveedores, setProveedores] = useState<ProveedorRaw[]>([]);
  const [unidades, setUnidades] = useState<ProveedorUnidad[]>([]);
  const [publicaciones, setPublicaciones] = useState<PublicacionCarga[]>([]);
  const [sanciones, setSanciones] = useState<SancionRow[]>([]);
  const [incidencias, setIncidencias] = useState<IncidenciaCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [provRes, unitRes, pubRes] = await Promise.all([
        supabase
          .from('proveedores')
          .select('id,nombre_comercial,logo_url,calificacion,ciudades_cobertura,rutas_frecuentes,premium_activo,activo,estatus,supervision_especial,adeudo_cliente_pendiente,servicios_sin_anticipo_restantes,anios_experiencia,modalidades,tipos_servicio,descripcion')
          .eq('activo', true),
        supabase
          .from('proveedor_unidades')
          .select('id,proveedor_id,tipo_unidad,capacidad_m3,capacidad_peso,activa')
          .eq('activa', true),
        supabase
          .from('publicaciones_carga')
          .select('id,proveedor_id,origen,destino,fecha_salida,volumen_disponible,estatus')
          .in('estatus', ['activa', 'publicada']),
      ]);

      if (provRes.data) setProveedores(provRes.data as unknown as ProveedorRaw[]);
      if (unitRes.data) setUnidades(unitRes.data as unknown as ProveedorUnidad[]);
      if (pubRes.data) setPublicaciones(pubRes.data as unknown as PublicacionCarga[]);

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
    return scoreProveedores(proveedores, publicaciones, sanciones, incidencias, scoringInput, unidades);
  }, [proveedores, publicaciones, sanciones, incidencias, scoringInput, unidades]);

  // Notify parent when no providers
  useEffect(() => {
    if (!loading && selected.length === 0 && onNoProviders) {
      onNoProviders();
    }
  }, [loading, selected.length, onNoProviders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-1">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm font-bold text-foreground">Analizando proveedores</p>
        <p className="text-[11px] text-muted-foreground">Filtrando por ruta, capacidad y disponibilidad...</p>
      </div>
    );
  }

  if (selected.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-full bg-muted/30 flex items-center justify-center">
          <Truck className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm mb-1">Tu servicio requiere revisión personalizada</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            No encontramos proveedores compatibles con todos los parámetros de tu solicitud.
            Un asesor puede asignarte la mejor opción.
          </p>
        </div>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, necesito ayuda con mi cotización:\n📍 ${origen} → ${destino}\n📦 ${volumen} m³\n🏷️ ${modalidad}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <MessageSquare className="w-4 h-4" />
          Contactar asesor
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Proveedores seleccionados ({selected.length})
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Filtrados y verificados para tu servicio
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-card px-2 py-1 rounded-full border border-border">
          <TrendingUp className="w-3 h-3" />
          Por compatibilidad
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

      {/* Trust footer */}
      <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
        Todos los proveedores son evaluados, verificados y aprobados por La Unión Mudanzas
      </p>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30 shadow-lg'
          : 'bg-card border-border hover:border-primary/30 hover:shadow-md'
      }`}
    >
      {/* Top accent for best option */}
      {uniqueBadges.includes('mejor_opcion') && (
        <div className="h-1 bg-gradient-to-r from-yellow-500/60 via-yellow-400/80 to-yellow-500/60" />
      )}

      <div className="p-4">
        {/* Badges row */}
        {uniqueBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
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

        <div className="flex items-start gap-3">
          {/* Avatar / Logo */}
          <div className="w-12 h-12 rounded-xl bg-muted/20 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
            {pagado && prov.logo_url ? (
              <img src={prov.logo_url} alt={prov.nombre_comercial} className="w-full h-full object-cover" />
            ) : (
              <Truck className="w-6 h-6 text-muted-foreground/60" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + Premium */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-bold text-sm text-foreground truncate">
                {pagado ? prov.nombre_comercial : `Proveedor ${index + 1}`}
              </span>
              {prov.premium_activo && (
                <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              )}
            </div>

            {/* Rating + Experience */}
            <div className="flex items-center gap-2.5 mb-2">
              {prov.calificacion != null && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-foreground">{prov.calificacion.toFixed(1)}</span>
                </div>
              )}
              {prov.anios_experiencia != null && prov.anios_experiencia > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {prov.anios_experiencia} año{prov.anios_experiencia !== 1 ? 's' : ''} exp.
                </span>
              )}
              <span className="text-[10px] text-muted-foreground capitalize">{modalidad}</span>
            </div>

            {/* Rich info chips */}
            <div className="flex flex-wrap gap-1">
              {/* Unit types */}
              {prov.unidades_tipos.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded border border-border/50">
                  <Truck className="w-2.5 h-2.5" />
                  {prov.unidades_tipos.slice(0, 2).join(', ')}
                  {prov.unidades_tipos.length > 2 && ` +${prov.unidades_tipos.length - 2}`}
                </span>
              )}
              {/* Coverage */}
              {prov.ciudades_cobertura && prov.ciudades_cobertura.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded border border-border/50">
                  <MapPin className="w-2.5 h-2.5" />
                  {prov.ciudades_cobertura.length} ciudad{prov.ciudades_cobertura.length !== 1 ? 'es' : ''}
                </span>
              )}
              {/* Modalidades */}
              {prov.modalidades && prov.modalidades.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded border border-border/50">
                  <Briefcase className="w-2.5 h-2.5" />
                  {prov.modalidades.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Selection indicator */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
            {isSelected ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-border" />
            )}
            <span className="text-[9px] text-muted-foreground/50 tabular-nums">
              {prov.score.total}pts
            </span>
          </div>
        </div>

        {/* Opportunity indicator */}
        {prov.isOpportunity && prov.opportunityDetail && (
          <div className="mt-3 p-2.5 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-[11px] text-green-400 font-bold">
              🛣️ Servicio de oportunidad
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {prov.opportunityDetail}
            </p>
            <p className="text-[10px] text-green-400/70 mt-0.5">
              Posible precio especial por espacio disponible en ruta
            </p>
          </div>
        )}

        {/* After payment: show more details */}
        {pagado && isSelected && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-bold">Proveedor asignado · Datos desbloqueados</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}
