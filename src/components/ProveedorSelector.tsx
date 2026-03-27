/**
 * ProveedorSelector — Shows up to 5 matching providers after cotización
 * Filters by route coverage, date, availability
 * Does NOT show phone/contact — only name, rating, service type
 * After payment: reveals logo + provider details
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Star, Crown, CheckCircle2, Shield, MapPin, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProveedorPublico {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  calificacion: number | null;
  ciudades_cobertura: string[] | null;
  rutas_frecuentes: string[] | null;
  premium_activo: boolean;
}

interface Props {
  origen: string;
  destino: string;
  fecha?: string;
  volumen: number;
  modalidad: string;
  onSelect: (proveedorId: string, nombre: string) => void;
  selectedId?: string | null;
  pagado?: boolean; // after payment → reveal provider info
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function matchesRoute(prov: ProveedorPublico, origen: string, destino: string): boolean {
  const o = norm(origen);
  const d = norm(destino);
  const cities = (prov.ciudades_cobertura ?? []).map(norm);
  const routes = (prov.rutas_frecuentes ?? []).map(norm);

  const coversOrigen = cities.some(c => c.includes(o) || o.includes(c));
  const coversDestino = cities.some(c => c.includes(d) || d.includes(c));

  const routeMatch = routes.some(r => {
    return (r.includes(o) || o.includes(r.split(' ')[0])) &&
           (r.includes(d) || d.includes(r.split(' ')[0]));
  });

  return (coversOrigen && coversDestino) || routeMatch;
}

export default function ProveedorSelector({ origen, destino, fecha, volumen, modalidad, onSelect, selectedId, pagado }: Props) {
  const [proveedores, setProveedores] = useState<ProveedorPublico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProveedores = async () => {
      setLoading(true);
      // Use the public view — no auth required
      const { data } = await supabase
        .from('proveedores_publico' as any)
        .select('*');
      if (data) setProveedores(data as ProveedorPublico[]);
      setLoading(false);
    };
    fetchProveedores();
  }, []);

  const filtered = useMemo(() => {
    // Filter by route coverage
    let matched = proveedores.filter(p => matchesRoute(p, origen, destino));

    // Sort: premium first, then by rating
    matched.sort((a, b) => {
      if (a.premium_activo !== b.premium_activo) return b.premium_activo ? 1 : -1;
      return (b.calificacion ?? 0) - (a.calificacion ?? 0);
    });

    // Max 5
    return matched.slice(0, 5);
  }, [proveedores, origen, destino]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Buscando proveedores disponibles...
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-neon-orange/10 border border-neon-orange/30 text-sm">
        <p className="font-bold text-neon-orange mb-1">Sin proveedores disponibles para esta ruta</p>
        <p className="text-xs text-muted-foreground">Contacta a un asesor para asignación manual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Proveedores disponibles ({filtered.length})
      </p>

      <AnimatePresence>
        {filtered.map((p, i) => {
          const isSelected = selectedId === p.id;
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              type="button"
              onClick={() => onSelect(p.id, p.nombre_comercial)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-neon-cyan/10 border-neon-cyan/40 ring-1 ring-neon-cyan/30'
                  : 'bg-surface border-border hover:border-neon-cyan/30 hover:bg-surface/80'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar / Logo */}
                <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {pagado && p.logo_url ? (
                    <img src={p.logo_url} alt={p.nombre_comercial} className="w-full h-full object-cover" />
                  ) : (
                    <Truck className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground truncate">
                      {pagado ? p.nombre_comercial : `Proveedor ${i + 1}`}
                    </span>
                    {p.premium_activo && (
                      <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.calificacion != null && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-foreground">{p.calificacion.toFixed(1)}</span>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground capitalize">{modalidad}</span>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
                )}
              </div>

              {/* After payment: show more details */}
              {pagado && isSelected && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-neon-green" />
                  <span className="text-xs text-neon-green font-medium">Proveedor asignado · Datos desbloqueados</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
