/**
 * Proveedor Scoring Engine — "Modo Uber de Mudanzas"
 * Evaluates and ranks providers based on route match, unit capacity,
 * rating, sanctions, availability, modalidad/service compatibility,
 * and route opportunities.
 */

export interface ProveedorRaw {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  calificacion: number | null;
  ciudades_cobertura: string[] | null;
  rutas_frecuentes: string[] | null;
  premium_activo: boolean;
  activo: boolean;
  estatus: string | null;
  supervision_especial: boolean;
  adeudo_cliente_pendiente: number;
  servicios_sin_anticipo_restantes: number;
  // Extended profile fields
  anios_experiencia: number | null;
  modalidades: string[] | null;
  tipos_servicio: string[] | null;
  descripcion: string | null;
}

export interface ProveedorUnidad {
  id: string;
  proveedor_id: string;
  tipo_unidad: string | null;
  capacidad_m3: number | null;
  capacidad_peso: number | null;
  activa: boolean;
}

export interface PublicacionCarga {
  id: string;
  proveedor_id: string;
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
  estatus: string | null;
  expira_at: string | null;
}

export interface SancionRow {
  proveedor_id: string;
  bloqueado: boolean;
  supervision_especial: boolean;
  fecha_fin: string | null;
}

export interface IncidenciaCount {
  proveedor_id: string;
  count: number;
}

export interface ScoreBreakdown {
  routeMatch: number;       // 0-30
  unitFit: number;          // 0-15
  rating: number;           // 0-20
  availability: number;     // 0-10
  opportunity: number;      // 0-15  (has published space on this route)
  penalties: number;        // negative adjustments
  total: number;
}

export interface ScoredProveedor {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  calificacion: number | null;
  premium_activo: boolean;
  anios_experiencia: number | null;
  modalidades: string[] | null;
  tipos_servicio: string[] | null;
  descripcion: string | null;
  ciudades_cobertura: string[] | null;
  unidades_tipos: string[];          // unique unit types from their fleet
  score: ScoreBreakdown;
  badges: ProveedorBadge[];
  isOpportunity: boolean;
  opportunityDetail: string | null;
  discardReason: string | null;  // null = not discarded
}

export type ProveedorBadge =
  | 'mejor_opcion'
  | 'mas_rapido'
  | 'mejor_calificado'
  | 'oportunidad_ruta'
  | 'oportunidad_espacio'
  | 'oportunidad_compartida'
  | 'oportunidad_paso'
  | 'precio_especial'
  | 'premium'
  | 'red_aprobada';

export type TipoOportunidad = 'espacio_vacio' | 'carga_compartida' | 'proveedor_paso' | 'salida_cercana';

// ─── Helpers ──────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function cityMatch(haystack: string[], needle: string): boolean {
  const n = norm(needle);
  return haystack.some(c => {
    const h = norm(c);
    return h.includes(n) || n.includes(h);
  });
}

function routeCovers(prov: ProveedorRaw, origen: string, destino: string): { covers: boolean; strength: number } {
  const cities = prov.ciudades_cobertura ?? [];
  const routes = prov.rutas_frecuentes ?? [];

  const coversOrigen = cityMatch(cities, origen);
  const coversDestino = cityMatch(cities, destino);

  // Check frequent routes for exact match
  const o = norm(origen);
  const d = norm(destino);
  const exactRoute = routes.some(r => {
    const rn = norm(r);
    return (rn.includes(o) && rn.includes(d));
  });

  if (exactRoute) return { covers: true, strength: 1.0 };
  if (coversOrigen && coversDestino) return { covers: true, strength: 0.7 };
  if (coversOrigen || coversDestino) return { covers: true, strength: 0.3 };
  return { covers: false, strength: 0 };
}

/** Map volume to expected unit type keywords */
function getExpectedUnitKeywords(volumen: number): string[] {
  if (volumen <= 10) return ['nissan', 'camioneta'];
  if (volumen <= 20) return ['nissan', '3.5', 'camioneta'];
  if (volumen <= 50) return ['3.5', 'rabon'];
  if (volumen <= 60) return ['rabon', 'torton'];
  if (volumen <= 90) return ['torton', 'camion', 'grande'];
  return ['trailer', 'camion', 'grande'];
}

function providerHasFittingUnit(unidades: ProveedorUnidad[], volumen: number): { fits: boolean; strength: number } {
  if (unidades.length === 0) return { fits: false, strength: 0 };
  
  const activeUnits = unidades.filter(u => u.activa);
  if (activeUnits.length === 0) return { fits: false, strength: 0 };

  // Check capacity
  const hasCapacity = activeUnits.some(u => u.capacidad_m3 != null && u.capacidad_m3 >= volumen);
  
  // Check type match
  const keywords = getExpectedUnitKeywords(volumen);
  const hasType = activeUnits.some(u => {
    if (!u.tipo_unidad) return false;
    const t = norm(u.tipo_unidad);
    return keywords.some(k => t.includes(k));
  });

  if (hasCapacity && hasType) return { fits: true, strength: 1.0 };
  if (hasCapacity || hasType) return { fits: true, strength: 0.6 };
  // Has active units but no clear match — partial credit
  return { fits: true, strength: 0.3 };
}

// ─── Main scoring function ────────────────────────────────────────

export interface ScoringInput {
  origen: string;
  destino: string;
  fecha?: string;
  volumen: number;
  modalidad: string;
  tipoServicio?: string;
}

export function scoreProveedores(
  proveedores: ProveedorRaw[],
  publicaciones: PublicacionCarga[],
  sanciones: SancionRow[],
  incidenciaCounts: IncidenciaCount[],
  input: ScoringInput,
  unidades: ProveedorUnidad[] = [],
  maxResults: number = 3,
): { selected: ScoredProveedor[]; discarded: ScoredProveedor[] } {
  const now = new Date();
  const sancionMap = new Map<string, SancionRow[]>();
  sanciones.forEach(s => {
    const arr = sancionMap.get(s.proveedor_id) || [];
    arr.push(s);
    sancionMap.set(s.proveedor_id, arr);
  });
  const incMap = new Map<string, number>();
  incidenciaCounts.forEach(i => incMap.set(i.proveedor_id, i.count));

  // Group units by provider
  const unitMap = new Map<string, ProveedorUnidad[]>();
  unidades.forEach(u => {
    const arr = unitMap.get(u.proveedor_id) || [];
    arr.push(u);
    unitMap.set(u.proveedor_id, arr);
  });

  // Find opportunity publications matching this route
  const opportunityPubs = publicaciones.filter(p => {
    if (p.estatus !== 'activa' && p.estatus !== 'publicada') return false;
    if (!p.origen || !p.destino) return false;
    // Check expiration
    if (p.expira_at && new Date(p.expira_at) <= now) return false;
    const matchO = norm(p.origen).includes(norm(input.origen)) || norm(input.origen).includes(norm(p.origen));
    const matchD = norm(p.destino).includes(norm(input.destino)) || norm(input.destino).includes(norm(p.destino));
    if (!matchO || !matchD) return false;
    if (p.volumen_disponible != null && p.volumen_disponible < input.volumen) return false;
    // Check modalidad compatibility if specified
    if (input.modalidad && p.modalidad_disponible) {
      const modNorm = norm(input.modalidad);
      const pubMod = norm(p.modalidad_disponible);
      if (!pubMod.includes(modNorm) && !modNorm.includes(pubMod)) return false;
    }
    // Check date compatibility (within 3 days)
    if (input.fecha && p.fecha_salida) {
      const diff = Math.abs(new Date(input.fecha).getTime() - new Date(p.fecha_salida).getTime()) / 86400000;
      if (diff > 3) return false;
    }
    return true;
  });
  const oppProvIds = new Set(opportunityPubs.map(p => p.proveedor_id));

  const all: ScoredProveedor[] = proveedores.map(prov => {
    let discardReason: string | null = null;

    // Hard disqualifiers
    if (!prov.activo) discardReason = 'Proveedor inactivo';
    if (prov.estatus && !['aprobado', 'activo'].includes(prov.estatus)) {
      discardReason = discardReason || `Estatus: ${prov.estatus}`;
    }

    // Check active sanctions
    const provSanciones = sancionMap.get(prov.id) || [];
    const activeSanctions = provSanciones.filter(s =>
      s.bloqueado || (s.fecha_fin && new Date(s.fecha_fin) > now)
    );
    if (activeSanctions.some(s => s.bloqueado)) {
      discardReason = discardReason || 'Proveedor bloqueado por sanción';
    }

    // Modalidad compatibility
    if (input.modalidad && prov.modalidades && prov.modalidades.length > 0) {
      const modalidadNorm = norm(input.modalidad);
      const supportsModalidad = prov.modalidades.some(m => norm(m).includes(modalidadNorm) || modalidadNorm.includes(norm(m)));
      if (!supportsModalidad && !discardReason) {
        discardReason = `No maneja modalidad: ${input.modalidad}`;
      }
    }

    // Service type compatibility
    if (input.tipoServicio && prov.tipos_servicio && prov.tipos_servicio.length > 0) {
      const tipoNorm = norm(input.tipoServicio);
      const supportsType = prov.tipos_servicio.some(t => norm(t).includes(tipoNorm) || tipoNorm.includes(norm(t)));
      if (!supportsType && !discardReason) {
        discardReason = `No presta servicio: ${input.tipoServicio}`;
      }
    }

    // Route match
    const rm = routeCovers(prov, input.origen, input.destino);
    if (!rm.covers && !discardReason) {
      discardReason = 'No cubre la ruta solicitada';
    }

    const routeMatch = Math.round(rm.strength * 30);

    // Unit fit (use real units if available)
    const provUnits = unitMap.get(prov.id) || [];
    let unitFit = 0;
    if (provUnits.length > 0) {
      const fit = providerHasFittingUnit(provUnits, input.volumen);
      unitFit = Math.round(fit.strength * 15);
      if (!fit.fits && !discardReason) {
        discardReason = 'Sin unidad adecuada para el volumen';
      }
    } else {
      // No units data — give base credit if route matches
      unitFit = rm.covers ? 8 : 0;
    }

    // Rating (0-20)
    const rawRating = prov.calificacion ?? 3.0;
    const rating = Math.round((rawRating / 5) * 20);

    // Availability (date proximity bonus)
    let availability = 5; // base
    if (input.fecha) {
      const daysDiff = Math.abs((new Date(input.fecha).getTime() - now.getTime()) / 86400000);
      if (daysDiff > 3) availability = 10; // more planning time = more availability
    }

    // Opportunity bonus
    const isOpp = oppProvIds.has(prov.id);
    const opportunity = isOpp ? 15 : 0;

    // Penalties
    let penalties = 0;
    if (prov.supervision_especial) penalties -= 10;
    if (activeSanctions.length > 0 && !activeSanctions.some(s => s.bloqueado)) penalties -= 8;
    const openInc = incMap.get(prov.id) || 0;
    if (openInc > 0) penalties -= Math.min(openInc * 3, 12);
    if (prov.adeudo_cliente_pendiente > 0) penalties -= 5;
    if (prov.servicios_sin_anticipo_restantes > 0) penalties -= 3;

    // Premium bonus
    if (prov.premium_activo) penalties += 5; // positive bonus for premium

    // Experience bonus
    if (prov.anios_experiencia && prov.anios_experiencia >= 5) penalties += 3;

    const total = Math.max(0, routeMatch + unitFit + rating + availability + opportunity + penalties);

    const score: ScoreBreakdown = { routeMatch, unitFit, rating, availability, opportunity, penalties, total };

    // Badges
    const badges: ProveedorBadge[] = [];
    if (prov.premium_activo) badges.push('premium');
    if (rawRating >= 4.5) badges.push('mejor_calificado');
    if (['aprobado', 'activo'].includes(prov.estatus ?? '')) badges.push('red_aprobada');

    const oppPub = opportunityPubs.find(p => p.proveedor_id === prov.id);
    if (isOpp && oppPub) {
      badges.push('oportunidad_ruta');
      const tipo = oppPub.tipo_oportunidad ?? oppPub.tipo_unidad ? 'espacio_vacio' : 'proveedor_paso';
      if (tipo === 'espacio_vacio') badges.push('oportunidad_espacio');
      else if (tipo === 'carga_compartida') badges.push('oportunidad_compartida');
      else badges.push('oportunidad_paso');
      badges.push('precio_especial');
    }

    // Unique unit types
    const unidadesTipos = [...new Set(provUnits.filter(u => u.activa && u.tipo_unidad).map(u => u.tipo_unidad!))];

    return {
      id: prov.id,
      nombre_comercial: prov.nombre_comercial,
      logo_url: prov.logo_url,
      calificacion: prov.calificacion,
      premium_activo: prov.premium_activo,
      anios_experiencia: prov.anios_experiencia,
      modalidades: prov.modalidades,
      tipos_servicio: prov.tipos_servicio,
      descripcion: prov.descripcion,
      ciudades_cobertura: prov.ciudades_cobertura,
      unidades_tipos: unidadesTipos,
      score,
      badges,
      isOpportunity: isOpp,
      opportunityDetail: isOpp && oppPub
        ? buildOpportunityDetail(oppPub)
        : null,
      opportunityType: isOpp && oppPub ? (oppPub.tipo_oportunidad as TipoOportunidad | null) : null,
      opportunityPub: isOpp ? oppPub ?? null : null,
      discardReason,
    };
  });

  // Separate discarded vs eligible
  const eligible = all.filter(p => !p.discardReason);
  const discarded = all.filter(p => p.discardReason);

  // Sort eligible by score desc
  eligible.sort((a, b) => b.score.total - a.score.total);

  // Assign "mejor_opcion" badge to top
  if (eligible.length > 0) {
    eligible[0].badges.push('mejor_opcion');
    // "mas_rapido" to an opportunity provider if exists and not already #1
    const fastOpp = eligible.find((p, i) => i > 0 && p.isOpportunity);
    if (fastOpp) fastOpp.badges.push('mas_rapido');
  }

  // Determine max results (3 normal, 5 for special cases)
  const limit = input.volumen > 60 || input.modalidad === 'exclusivo' ? 5 : maxResults;

  return {
    selected: eligible.slice(0, limit),
    discarded: [...discarded, ...eligible.slice(limit)].sort((a, b) => b.score.total - a.score.total),
  };
}

// ─── Badge display config ─────────────────────────────────────────

// ─── Opportunity detail builder ───────────────────────────────────
function buildOpportunityDetail(pub: PublicacionCarga): string {
  const parts: string[] = [];
  parts.push(`Ruta ${pub.origen} → ${pub.destino}`);
  if (pub.volumen_disponible) parts.push(`${pub.volumen_disponible} m³ disponibles`);
  if (pub.tipo_unidad) parts.push(`Unidad: ${pub.tipo_unidad}`);
  if (pub.fecha_salida) {
    const d = new Date(pub.fecha_salida);
    parts.push(`Sale: ${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`);
  }
  if (pub.modalidad_disponible) parts.push(`Modalidad: ${pub.modalidad_disponible}`);
  return parts.join(' · ');
}

export const BADGE_CONFIG: Record<ProveedorBadge, { label: string; emoji: string; color: string }> = {
  mejor_opcion:          { label: 'Mejor opción',           emoji: '🏆', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  mas_rapido:            { label: 'Más rápido',             emoji: '⚡', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  mejor_calificado:      { label: 'Mejor calificado',       emoji: '⭐', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  oportunidad_ruta:      { label: 'Oportunidad en ruta',    emoji: '🛣️', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  oportunidad_espacio:   { label: 'Espacio disponible',     emoji: '📦', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  oportunidad_compartida:{ label: 'Carga compartida',       emoji: '🤝', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  oportunidad_paso:      { label: 'Proveedor de paso',      emoji: '🚛', color: 'bg-lime-500/15 text-lime-400 border-lime-500/30' },
  precio_especial:       { label: 'Precio especial',        emoji: '💰', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  premium:               { label: 'Premium',                 emoji: '👑', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  red_aprobada:          { label: 'Red verificada',          emoji: '✅', color: 'bg-primary/15 text-primary border-primary/30' },
};
