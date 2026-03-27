/**
 * routing-data.ts
 * La Unión Mudanzas — complete operational route network
 *
 * Data structure:
 *   - ROUTES: 20 numbered operational routes with cities, detours & extensions
 *   - RESTRICTED_ZONES: cities that only allow exclusive service
 *   - DESVIO_CITIES: cities that apply a detour surcharge
 *   - classifyCity(): classifies any input city against the network
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CityStatus =
  | 'en_ruta'       // city is on a main route → normal service
  | 'desvio'        // city is a detour → surcharge applies
  | 'extension'     // city is a route extension → normal/ask ops
  | 'exclusivo'     // restricted zone → exclusive service only
  | 'desconocida';  // not in system → needs manual review

export interface CityClassification {
  status: CityStatus;
  routeNames: string[];   // which routes this city belongs to
  message: string;
  allowsCompartido: boolean;
}

export interface RouteDefinition {
  id: number;
  name: string;
  cities: string[];
  detours: string[];
  extensions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONAL ROUTES (20 routes)
// ─────────────────────────────────────────────────────────────────────────────

export const ROUTES: RouteDefinition[] = [
  {
    id: 1,
    name: 'Sureste',
    cities: [
      'Ciudad de México', 'Puebla', 'Orizaba', 'Córdoba', 'Veracruz',
      'Coatzacoalcos', 'Villahermosa', 'Ciudad del Carmen', 'Campeche',
      'Mérida', 'Playa del Carmen', 'Tulum', 'Cancún',
    ],
    detours: ['Cárdenas', 'Xalapa', 'Cozumel', 'Chetumal'],
    extensions: [],
  },
  {
    id: 2,
    name: 'CDMX–Monterrey',
    cities: [
      'Ciudad de México', 'San Juan del Río', 'Querétaro',
      'San Luis Potosí', 'Matehuala', 'Saltillo', 'Monterrey',
    ],
    detours: ['San Miguel de Allende'],
    extensions: ['Nuevo Laredo', 'Reynosa', 'Matamoros', 'Tampico'],
  },
  {
    id: 3,
    name: 'CDMX–Tijuana',
    cities: [
      'Ciudad de México', 'Querétaro', 'Guadalajara', 'Vallarta', 'Tepic',
      'Mazatlán', 'Culiacán', 'Los Mochis', 'Ciudad Obregón', 'Hermosillo', 'Tijuana',
    ],
    detours: ['León', 'Aguascalientes'],
    extensions: ['Nogales', 'Mexicali', 'Tecate', 'Ensenada'],
  },
  {
    id: 4,
    name: 'CDMX–GDL',
    cities: [
      'Ciudad de México', 'Querétaro', 'San Juan del Río', 'San Miguel de Allende',
      'León', 'Irapuato', 'Salamanca', 'Morelia', 'Guadalajara',
    ],
    detours: ['Aguascalientes', 'Celaya'],
    extensions: ['Colima'],
  },
  {
    id: 5,
    name: 'CDMX–Acapulco',
    cities: ['Ciudad de México', 'Cuernavaca', 'Chilpancingo', 'Acapulco'],
    detours: [],
    extensions: ['Zihuatanejo', 'Ixtapa', 'Lázaro Cárdenas'],
  },
  {
    id: 6,
    name: 'CDMX–Juárez',
    cities: [
      'Ciudad de México', 'Querétaro', 'San Juan del Río', 'San Luis Potosí',
      'Matehuala', 'Saltillo', 'Torreón', 'Gómez Palacio', 'Durango',
      'Parral', 'Delicias', 'Chihuahua', 'Cd. Juárez',
    ],
    detours: [],
    extensions: [],
  },
  {
    id: 7,
    name: 'GDL–Juárez',
    cities: [
      'Guadalajara', 'Aguascalientes', 'Zacatecas', 'Durango',
      'Parral', 'Delicias', 'Chihuahua', 'Cd. Juárez',
    ],
    detours: ['León', 'San Luis Potosí'],
    extensions: [],
  },
  {
    id: 8,
    name: 'CDMX–Oaxaca',
    cities: ['Ciudad de México', 'Puebla', 'Tehuacán', 'Oaxaca'],
    detours: [],
    extensions: ['Puerto Escondido', 'Huatulco'],
  },
  {
    id: 9,
    name: 'Veracruz (regional)',
    cities: [
      'Perote', 'Xalapa', 'Coatepec', 'Emiliano Zapata', 'Actopan', 'Cardel',
      'Veracruz', 'Boca del Río', 'Medellín', 'Alvarado', 'La Tinaja',
      'Tierra Blanca', 'Tres Valles', 'Cosamaloapan', 'Isla', 'Rodríguez Clara',
      'Acayucan', 'Coatzacoalcos', 'Minatitlán', 'Cosoleacaque',
    ],
    detours: ['Tuxpan', 'Poza Rica', 'Papantla', 'Martínez de la Torre'],
    extensions: [],
  },
  {
    id: 10,
    name: 'CDMX–Puebla',
    cities: [
      'Ciudad de México', 'San Martín Texmelucan', 'Huejotzingo', 'Puebla',
    ],
    detours: ['Cholula', 'Atlixco', 'Tehuacán'],
    extensions: [],
  },
  {
    id: 11,
    name: 'CDMX–Tabasco',
    cities: [
      'Ciudad de México', 'Puebla', 'Orizaba', 'Córdoba', 'Veracruz',
      'Coatzacoalcos', 'Villahermosa',
    ],
    detours: ['Cárdenas', 'Paraíso', 'Comalcalco'],
    extensions: [],
  },
  {
    id: 12,
    name: 'Chiapas',
    cities: [
      'Tuxtla', 'Chiapa de Corzo', 'Berriozábal', 'Ocozocoautla',
      'San Cristóbal', 'Comitán', 'Palenque', 'Tapachula',
    ],
    detours: ['Tonalá', 'Arriaga'],
    extensions: [],
  },
  {
    id: 13,
    name: 'Tijuana–Monterrey',
    cities: [
      'Tijuana', 'Tecate', 'Mexicali', 'San Luis Río Colorado', 'Caborca',
      'Santa Ana', 'Hermosillo', 'Ciudad Obregón', 'Navojoa', 'Los Mochis',
      'Culiacán', 'Mazatlán', 'Durango', 'Torreón', 'Saltillo', 'Monterrey',
    ],
    detours: ['Nogales', 'Parral'],
    extensions: [],
  },
  {
    id: 14,
    name: 'Monterrey–Culiacán',
    cities: [
      'Monterrey', 'Saltillo', 'Torreón', 'Gómez Palacio', 'Durango', 'Mazatlán', 'Culiacán',
    ],
    detours: [],
    extensions: [],
  },
  {
    id: 17,
    name: 'Mérida–Chiapas',
    cities: ['Mérida', 'Campeche', 'Ciudad del Carmen', 'Villahermosa', 'Tuxtla'],
    detours: [],
    extensions: [],
  },
  {
    id: 18,
    name: 'Tijuana–Los Cabos',
    cities: [
      'Tijuana', 'Ensenada', 'Guerrero Negro', 'Santa Rosalía', 'Mulegé',
      'Loreto', 'Constitución', 'La Paz', 'Los Cabos',
    ],
    detours: [],
    extensions: [],
  },
  {
    id: 19,
    name: 'MTY–Cancún (Golfo)',
    cities: [
      'Monterrey', 'Ciudad Victoria', 'Tampico', 'Tuxpan', 'Poza Rica',
      'Veracruz', 'Coatzacoalcos', 'Villahermosa', 'Ciudad del Carmen',
      'Campeche', 'Mérida', 'Cancún',
    ],
    detours: [],
    extensions: [],
  },
  {
    id: 20,
    name: 'Reynosa–MTY',
    cities: ['Reynosa', 'Bravo', 'China', 'Cadereyta', 'Monterrey'],
    detours: [],
    extensions: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RESTRICTED ZONES — exclusive service only (no compartido)
// ─────────────────────────────────────────────────────────────────────────────

export const RESTRICTED_ZONES: string[] = [
  // Sierra / mountain / difficult access
  'Creel', 'Urique', 'Batopilas', 'Divisadero', 'Sierra Tarahumara',
  'Hidalgo del Parral', 'Madera', 'Casas Grandes',
  // Guerrero high-risk
  'Iguala', 'Chilapa', 'Tlapa', 'Ayutla',
  // Michoacán conflictive
  'Aguililla', 'Apatzingán', 'Nueva Italia', 'Buenavista',
  // Oaxaca remote
  'Tlaxiaco', 'Juxtlahuaca', 'Putla', 'Pinotepa Nacional',
  // Veracruz remote
  'Zongolica', 'Tehuipango',
  // Chiapas remote
  'Ocosingo', 'Altamirano', 'Las Margaritas',
];

// ─────────────────────────────────────────────────────────────────────────────
// ALL DETOUR CITIES (flat list from all routes + legacy)
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_DETOUR_CITIES: string[] = [
  // Route detours
  'Cárdenas', 'Xalapa', 'Cozumel', 'Chetumal',
  'San Miguel de Allende',
  'León', 'Aguascalientes',
  'Celaya',
  'Zihuatanejo', 'Ixtapa', 'Lázaro Cárdenas',
  'Tuxpan', 'Poza Rica', 'Papantla', 'Martínez de la Torre',
  'Cholula', 'Atlixco', 'Tehuacán',
  'Paraíso', 'Comalcalco',
  'Tonalá', 'Arriaga',
  'Nogales', 'Parral',
  'San Luis Potosí',
  // Legacy detour cities
  'Piedras Negras', 'Tampico', 'Toluca', 'Valle de Bravo', 'Lerma',
  'Metepec', 'Bacalar', 'Ciudad del Carmen',
];

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZER
// ─────────────────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Check if two city strings match (normalized, partial) */
function cityMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Resolve an alias (e.g. "cdmx") to its canonical city name */
function resolveAlias(input: string): string | null {
  const n = norm(input);
  // Lazy import: CITY_ALIASES is defined below but hoisted
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some(a => a === n || n.includes(a) || a.includes(n))) {
      return canonical;
    }
    if (norm(canonical) === n) return canonical;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY CLASSIFICATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function classifyCity(cityInput: string): CityClassification {
  if (!cityInput.trim()) {
    return {
      status: 'desconocida',
      routeNames: [],
      message: '',
      allowsCompartido: true,
    };
  }

  // Resolve alias to canonical name first
  const resolved = resolveAlias(cityInput) || cityInput;

  // 1. Check restricted zones first
  if (RESTRICTED_ZONES.some(r => cityMatch(resolved, r))) {
    return {
      status: 'exclusivo',
      routeNames: [],
      message: '⛔ Esta zona no aplica para servicio compartido. Solo se ofrece servicio exclusivo.',
      allowsCompartido: false,
    };
  }

  // 2. Check main route cities
  const inRoutes: string[] = [];
  for (const route of ROUTES) {
    if (route.cities.some(c => cityMatch(resolved, c))) {
      inRoutes.push(route.name);
    }
  }
  if (inRoutes.length > 0) {
    return {
      status: 'en_ruta',
      routeNames: inRoutes,
      message: `✅ Ciudad en ruta: ${inRoutes.join(', ')}`,
      allowsCompartido: true,
    };
  }

  // 3. Check extension cities
  const inExtRoutes: string[] = [];
  for (const route of ROUTES) {
    if (route.extensions.some(c => cityMatch(resolved, c))) {
      inExtRoutes.push(route.name);
    }
  }
  if (inExtRoutes.length > 0) {
    return {
      status: 'extension',
      routeNames: inExtRoutes,
      message: `📍 Extensión de ruta: ${inExtRoutes.join(', ')}. Consultar disponibilidad con operaciones.`,
      allowsCompartido: true,
    };
  }

  // 4. Check detour cities
  const inDesvioRoutes: string[] = [];
  for (const route of ROUTES) {
    if (route.detours.some(c => cityMatch(resolved, c))) {
      inDesvioRoutes.push(route.name);
    }
  }
  // Also check flat detour list
  const inFlatDesvio = ALL_DETOUR_CITIES.some(c => cityMatch(resolved, c));

  if (inDesvioRoutes.length > 0 || inFlatDesvio) {
    const routes = inDesvioRoutes.length > 0 ? inDesvioRoutes : [];
    return {
      status: 'desvio',
      routeNames: routes,
      message: `⚠️ Ciudad con desvío${routes.length > 0 ? ` (${routes.join(', ')})` : ''}. Se aplica cargo adicional por volumen.`,
      allowsCompartido: true,
    };
  }

  // 5. Unknown city
  return {
    status: 'desconocida',
    routeNames: [],
    message: '❓ Ciudad no encontrada en el sistema. Verificar con operaciones si aplica servicio.',
    allowsCompartido: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY ALIASES (for autocomplete search)
// ─────────────────────────────────────────────────────────────────────────────

export const CITY_ALIASES: Record<string, string[]> = {
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
  'Tijuana': ['tj', 'tijuana'],
  'Querétaro': ['queretaro', 'qro'],
  'Aguascalientes': ['ags', 'aguascalientes'],
  'Mérida': ['merida'],
  'Cancún': ['cancun'],
  'Puebla': ['puebla', 'pue'],
  'Veracruz': ['veracruz', 'ver'],
  'Oaxaca': ['oaxaca', 'oax'],
  'Tuxtla Gutiérrez': ['tuxtla', 'tuxtla gutierrez'],
  'Hermosillo': ['hermosillo', 'hmo'],
  'Chihuahua': ['chihuahua', 'chih'],
  'Culiacán': ['culiacan'],
  'Mazatlán': ['mazatlan'],
  'Morelia': ['morelia'],
  'Toluca': ['toluca'],
  'Tampico': ['tampico'],
  'Coatzacoalcos': ['coatza', 'coatzacoalcos'],
  'Playa del Carmen': ['playa del carmen', 'playa'],
};

/** Given a search term, find canonical cities matching by name OR alias */
export function searchCities(query: string): string[] {
  if (query.length < 2) return [];
  const q = norm(query);
  const results = new Set<string>();

  // 1. Match against ALL_CITIES by substring
  for (const city of ALL_CITIES) {
    if (norm(city).includes(q)) results.add(city);
  }

  // 2. Match against aliases → return canonical name
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some(a => a.includes(q) || q.includes(a))) {
      results.add(canonical);
    }
  }

  return Array.from(results).sort().slice(0, 8);
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL CITY LIST for autocomplete
// ─────────────────────────────────────────────────────────────────────────────

function buildCityList(): string[] {
  const set = new Set<string>();
  for (const route of ROUTES) {
    route.cities.forEach(c => set.add(c));
    route.detours.forEach(c => set.add(c));
    route.extensions.forEach(c => set.add(c));
  }
  ALL_DETOUR_CITIES.forEach(c => set.add(c));
  return Array.from(set).sort();
}

export const ALL_CITIES = buildCityList();
