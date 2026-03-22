import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────

export interface RutaRow {
  origen: string;
  destino: string;
  costo_m3: number;
  notas: string | null;
  es_directa: boolean;
}

export interface TramoResult {
  tipo: 'directa' | 'espejo' | 'tramos' | 'no_disponible';
  costoM3: number;
  tramos: { desde: string; hasta: string; costo: number }[];
  observaciones: string[];
  advertencias: string[];
}

interface CotizacionInput {
  nombre: string;
  whatsapp: string;
  origen: string;
  destino: string;
  fecha: string;
  tipoServicio: string;
  modalidad: string;
  volumenTotal: number;
  volumenCobrable: number;
  unidadSugerida: string;
  seguro: boolean;
  montoSeguro: number;
  costoPisos: number;
  costoAcarreo: number;
  urgente: boolean;
}

export interface CotizacionResult {
  cotizacionId: string;
  clienteId: string;
  folio: string;
  precioBase: number;
  precioTotal: number;
  costoRuta: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────

const MARGEN_APP = 0.30;
const URGENCIA_PCT = 0.15;
const COSTO_RECOLECCION = 500;
const COSTO_ENTREGA = 500;

// Primary routing hubs (order matters: prefer cheapest)
const HUBS = ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Tijuana'];

// Cities requiring a detour surcharge
const DESVIO_CITIES = [
  'Piedras Negras', 'Tampico', 'Toluca', 'Valle de Bravo', 'Lerma',
  'Metepec', 'Morelos', 'Hidalgo', 'Bacalar', 'Chetumal', 'Ciudad del Carmen',
];

// Detour surcharge table (flat fee by volume range, NOT per m³)
const DESVIO_RATES: { min: number; max: number; costo: number }[] = [
  { min: 5,  max: 15,  costo: 3000 },
  { min: 16, max: 20,  costo: 5000 },
  { min: 21, max: 30,  costo: 6000 },
  { min: 31, max: 50,  costo: 7000 },
  { min: 51, max: Infinity, costo: 8000 },
];

// Special service notes per city
const SPECIAL_NOTES: Record<string, string> = {
  'Cozumel': '⚠️ Requiere traslado en ferry. Costo y logística especial.',
  'Lázaro Cárdenas': '⏳ Servicio con hasta 20 días hábiles de entrega.',
  'Ixtapa': '⏳ Servicio con hasta 20 días hábiles de entrega.',
  'Zihuatanejo': '⏳ Servicio con hasta 20 días hábiles de entrega.',
};

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Match a search string against a city name (including aliases) */
const ALIASES: Record<string, string[]> = {
  'Ciudad de México': ['cdmx', 'ciudad de mexico', 'df', 'distrito federal', 'mexico city'],
  'Guadalajara': ['gdl', 'guadalajara', 'perla tapatio'],
  'Monterrey': ['mty', 'monterrey', 'regio'],
  'León': ['leon', 'leon guanajuato', 'bajio'],
  'San Luis Potosí': ['san luis potosi', 'slp'],
  'San Miguel de Allende': ['san miguel', 'san miguel de allende'],
  'Cd. Juárez': ['cd juarez', 'ciudad juarez', 'juarez'],
  'Lázaro Cárdenas': ['lazaro cardenas', 'lcardenasport'],
  'Los Cabos': ['los cabos', 'cabo san lucas', 'san jose del cabo'],
  'La Paz': ['la paz', 'la paz bcs'],
  'Nuevo Laredo': ['nuevo laredo'],
  'Villahermosa': ['villahermosa', 'tabasco'],
};

function canonicalize(input: string): string {
  const n = norm(input);
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    if (aliases.some(a => norm(a) === n || n.includes(norm(a)) || norm(a).includes(n))) {
      return canonical;
    }
  }
  // Fuzzy partial match against canonical names
  for (const canonical of Object.keys(ALIASES)) {
    if (norm(canonical).includes(n) || n.includes(norm(canonical).split(' ')[0])) {
      return canonical;
    }
  }
  // Return capitalized input as-is
  return input.trim().replace(/\b\w/g, c => c.toUpperCase());
}

function findRoute(rutas: RutaRow[], from: string, to: string): RutaRow | undefined {
  const fn = norm(from);
  const tn = norm(to);
  // Exact match first
  let found = rutas.find(r => norm(r.origen) === fn && norm(r.destino) === tn);
  if (found) return found;
  // Partial / alias match
  found = rutas.find(r =>
    (norm(r.origen).includes(fn) || fn.includes(norm(r.origen).split(',')[0])) &&
    (norm(r.destino).includes(tn) || tn.includes(norm(r.destino).split(',')[0]))
  );
  return found;
}

function getDesvioSurcharge(vol: number): number {
  const tier = DESVIO_RATES.find(t => vol >= t.min && vol <= t.max);
  return tier ? tier.costo : 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN ROUTING ENGINE
// ──────────────────────────────────────────────────────────────────────────────

export function calcularRuta(
  rutas: RutaRow[],
  origenRaw: string,
  destinoRaw: string,
  volumen: number,
  tieneDesvio: boolean,
  ciudadDesvio?: string
): TramoResult & {
  costoDesvio: number;
  costoTotalM3: number;
} {
  const origen = canonicalize(origenRaw);
  const destino = canonicalize(destinoRaw);
  const observaciones: string[] = [];
  const advertencias: string[] = [];

  // Special notes
  if (SPECIAL_NOTES[origen]) observaciones.push(SPECIAL_NOTES[origen]);
  if (SPECIAL_NOTES[destino]) observaciones.push(SPECIAL_NOTES[destino]);

  // ── 1. Try direct route ─────────────────────────────────────────────────────
  const directa = findRoute(rutas, origen, destino);
  if (directa) {
    const costoDesvio = tieneDesvio && ciudadDesvio
      ? getDesvioSurcharge(volumen)
      : 0;
    if (costoDesvio > 0) {
      advertencias.push(`Cargo por desvío a ${ciudadDesvio}: $${costoDesvio.toLocaleString('es-MX')} adicionales (fijo por volumen)`);
    }
    return {
      tipo: 'directa',
      costoM3: directa.costo_m3,
      tramos: [{ desde: origen, hasta: destino, costo: directa.costo_m3 }],
      observaciones: [
        ...observaciones,
        ...(directa.notas ? [`Ruta: ${directa.notas}`] : []),
      ],
      advertencias,
      costoDesvio,
      costoTotalM3: directa.costo_m3,
    };
  }

  // ── 2. Try via hub (sum of two legs, pick cheapest valid combo) ──────────────
  let mejorTramo: { hub: string; leg1: RutaRow; leg2: RutaRow; total: number } | null = null;

  for (const hub of HUBS) {
    if (norm(hub) === norm(origen) || norm(hub) === norm(destino)) continue;
    const leg1 = findRoute(rutas, origen, hub);
    const leg2 = findRoute(rutas, hub, destino);
    if (leg1 && leg2) {
      const total = leg1.costo_m3 + leg2.costo_m3;
      if (!mejorTramo || total < mejorTramo.total) {
        mejorTramo = { hub, leg1, leg2, total };
      }
    }
  }

  if (mejorTramo) {
    const { hub, leg1, leg2, total } = mejorTramo;
    advertencias.push(`No hay ruta directa. Costo calculado por tramos vía ${hub}.`);

    // Inconsistency check: warn if tramo cost < any single direct tariff
    const allDirectCosts = rutas
      .filter(r => norm(r.origen) === norm(origen) || norm(r.destino) === norm(destino))
      .map(r => r.costo_m3);
    if (allDirectCosts.length > 0 && total > Math.max(...allDirectCosts) * 2.5) {
      advertencias.push(`⚠️ Discrepancia detectada: costo por tramos ($${total}) parece elevado. Verificar con operaciones.`);
    }

    const costoDesvio = tieneDesvio && ciudadDesvio
      ? getDesvioSurcharge(volumen)
      : 0;
    if (costoDesvio > 0) {
      advertencias.push(`Cargo por desvío a ${ciudadDesvio}: $${costoDesvio.toLocaleString('es-MX')} adicionales (fijo por volumen)`);
    }

    return {
      tipo: 'tramos',
      costoM3: total,
      tramos: [
        { desde: origen, hasta: hub, costo: leg1.costo_m3 },
        { desde: hub, hasta: destino, costo: leg2.costo_m3 },
      ],
      observaciones,
      advertencias,
      costoDesvio,
      costoTotalM3: total,
    };
  }

  // ── 3. No route found ────────────────────────────────────────────────────────
  advertencias.push(`No se encontró ruta para ${origen} → ${destino}. Se aplicará tarifa estimada de $800/m³.`);
  const costoDesvio = tieneDesvio && ciudadDesvio ? getDesvioSurcharge(volumen) : 0;
  return {
    tipo: 'no_disponible',
    costoM3: 800,
    tramos: [],
    observaciones,
    advertencias,
    costoDesvio,
    costoTotalM3: 800,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// HOOK
// ──────────────────────────────────────────────────────────────────────────────

export function useCotizacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Load all active routes from Supabase */
  const cargarRutas = useCallback(async (): Promise<RutaRow[]> => {
    const { data } = await supabase
      .from('rutas')
      .select('origen,destino,costo_m3,notas,es_directa')
      .eq('activa', true);
    return (data as RutaRow[]) || [];
  }, []);

  /** Legacy helper kept for backward compatibility with CotizadorSection */
  const buscarRuta = useCallback(async (
    origen: string,
    destino: string
  ): Promise<{ costo_m3: number; notas: string | null; es_directa: boolean } | null> => {
    const rutas = await cargarRutas();
    const result = calcularRuta(rutas, origen, destino, 5, false);
    if (result.tipo === 'no_disponible') return null;
    return {
      costo_m3: result.costoM3,
      notas: result.observaciones.join(' | ') || null,
      es_directa: result.tipo === 'directa',
    };
  }, [cargarRutas]);

  const guardarCotizacion = useCallback(async (input: CotizacionInput): Promise<CotizacionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Find or create cliente
      let clienteId: string;
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('whatsapp', input.whatsapp)
        .maybeSingle();

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const { data: nuevoCliente, error: errCliente } = await supabase
          .from('clientes')
          .insert({ nombre_completo: input.nombre, whatsapp: input.whatsapp })
          .select('id')
          .single();
        if (errCliente || !nuevoCliente) throw new Error('Error creando cliente');
        clienteId = nuevoCliente.id;
      }

      // 2. Look up route price via motor
      const rutas = await cargarRutas();
      const rutaResult = calcularRuta(rutas, input.origen, input.destino, input.volumenCobrable, false);
      const costoM3 = rutaResult.costoM3;
      const precioBase = input.volumenCobrable * costoM3;

      // 3. Calculate totals
      const costoAdicionales = input.costoPisos + input.costoAcarreo;
      const subtotal = precioBase + COSTO_RECOLECCION + COSTO_ENTREGA + costoAdicionales;
      const conMargen = subtotal * (1 + MARGEN_APP);
      const conUrgencia = input.urgente ? conMargen * (1 + URGENCIA_PCT) : conMargen;
      const seguroCosto = input.seguro ? input.montoSeguro * 0.025 : 0;
      const precioTotal = Math.round(conUrgencia + seguroCosto);

      // 4. Get folio
      const { data: folioData } = await supabase.rpc('next_folio');
      const folio = folioData || `LUM-${Date.now()}`;

      // 5. Save cotizacion
      const { data: cot, error: errCot } = await supabase
        .from('cotizaciones')
        .insert({
          cliente_id: clienteId,
          folio,
          origen: input.origen,
          destino: input.destino,
          fecha_salida: input.fecha || null,
          tipo_servicio: input.tipoServicio,
          modalidad: input.modalidad,
          volumen_total: input.volumenTotal,
          volumen_cobrable: input.volumenCobrable,
          unidad_sugerida: input.unidadSugerida,
          precio_base: precioBase,
          costo_recoleccion: COSTO_RECOLECCION,
          costo_entrega: COSTO_ENTREGA,
          costo_adicionales: costoAdicionales,
          margen_negocio: MARGEN_APP * 100,
          precio_total: precioTotal,
          urgencia: input.urgente,
          porcentaje_urgencia: input.urgente ? URGENCIA_PCT * 100 : 0,
          seguro_monto: input.seguro ? input.montoSeguro : null,
          seguro_costo: input.seguro ? seguroCosto : null,
          seguro_porcentaje: input.seguro ? 2.5 : null,
          estatus: 'borrador',
          cliente_acepto: false,
        })
        .select('id')
        .single();

      if (errCot || !cot) throw new Error('Error guardando cotización');

      return { cotizacionId: cot.id, clienteId, folio, precioBase, precioTotal, costoRuta: costoM3 };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cargarRutas]);

  const crearOrdenServicio = useCallback(async (cotizacionId: string): Promise<string | null> => {
    const { data: orden, error } = await supabase
      .from('ordenes_servicio')
      .insert({ cotizacion_id: cotizacionId, estatus: 'generada' })
      .select('id,folio')
      .single();
    if (error || !orden) return null;
    return orden.id;
  }, []);

  return {
    loading,
    error,
    guardarCotizacion,
    crearOrdenServicio,
    buscarRuta,
    cargarRutas,
    calcularRuta,
    DESVIO_CITIES,
    canonicalize,
  };
}

// Re-export helpers for use in components
export { DESVIO_CITIES, getDesvioSurcharge, canonicalize, calcularRuta };
