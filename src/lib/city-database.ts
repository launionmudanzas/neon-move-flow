/**
 * city-database.ts
 * La Unión Mudanzas — Complete city database with state + country
 * 
 * Each city has: name, state, country, and operational type
 */

export type CityType = 'ruta_regular' | 'fuera_de_ruta' | 'internacional';

export interface CityEntry {
  city: string;
  state: string;
  country: 'MX' | 'USA';
  type: CityType;
  /** Pre-built display string: "City, State, CC" */
  display: string;
  /** Searchable normalized key (no accents, lowercase) */
  searchKey: string;
  /** Order priority (lower = appears first) */
  order: number;
  active: boolean;
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function makeEntry(
  city: string,
  state: string,
  country: 'MX' | 'USA',
  type: CityType,
  order: number = 100,
): CityEntry {
  const cc = country === 'MX' ? 'MX' : 'USA';
  const display = `${city}, ${state}, ${cc}`;
  const searchKey = norm(`${city} ${state} ${cc}`);
  return { city, state, country, type, display, searchKey, order, active: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEXICO — RUTA REGULAR (cities on operational routes)
// ─────────────────────────────────────────────────────────────────────────────

const MX_RUTA_REGULAR: CityEntry[] = [
  // CDMX & Estado de México
  makeEntry('Ciudad de México', 'CDMX', 'MX', 'ruta_regular', 1),
  makeEntry('Toluca', 'Estado de México', 'MX', 'ruta_regular', 10),

  // Ruta Sureste (R1)
  makeEntry('Puebla', 'Puebla', 'MX', 'ruta_regular', 5),
  makeEntry('Orizaba', 'Veracruz', 'MX', 'ruta_regular', 20),
  makeEntry('Córdoba', 'Veracruz', 'MX', 'ruta_regular', 20),
  makeEntry('Veracruz', 'Veracruz', 'MX', 'ruta_regular', 5),
  makeEntry('Coatzacoalcos', 'Veracruz', 'MX', 'ruta_regular', 15),
  makeEntry('Villahermosa', 'Tabasco', 'MX', 'ruta_regular', 10),
  makeEntry('Ciudad del Carmen', 'Campeche', 'MX', 'ruta_regular', 20),
  makeEntry('Campeche', 'Campeche', 'MX', 'ruta_regular', 20),
  makeEntry('Mérida', 'Yucatán', 'MX', 'ruta_regular', 5),
  makeEntry('Playa del Carmen', 'Quintana Roo', 'MX', 'ruta_regular', 10),
  makeEntry('Tulum', 'Quintana Roo', 'MX', 'ruta_regular', 15),
  makeEntry('Cancún', 'Quintana Roo', 'MX', 'ruta_regular', 3),

  // Ruta CDMX–Monterrey (R2)
  makeEntry('San Juan del Río', 'Querétaro', 'MX', 'ruta_regular', 25),
  makeEntry('Querétaro', 'Querétaro', 'MX', 'ruta_regular', 5),
  makeEntry('San Luis Potosí', 'San Luis Potosí', 'MX', 'ruta_regular', 10),
  makeEntry('Matehuala', 'San Luis Potosí', 'MX', 'ruta_regular', 30),
  makeEntry('Saltillo', 'Coahuila', 'MX', 'ruta_regular', 15),
  makeEntry('Monterrey', 'Nuevo León', 'MX', 'ruta_regular', 2),

  // Ruta CDMX–Tijuana (R3)
  makeEntry('Guadalajara', 'Jalisco', 'MX', 'ruta_regular', 3),
  makeEntry('Puerto Vallarta', 'Jalisco', 'MX', 'ruta_regular', 10),
  makeEntry('Tepic', 'Nayarit', 'MX', 'ruta_regular', 20),
  makeEntry('Mazatlán', 'Sinaloa', 'MX', 'ruta_regular', 10),
  makeEntry('Culiacán', 'Sinaloa', 'MX', 'ruta_regular', 15),
  makeEntry('Los Mochis', 'Sinaloa', 'MX', 'ruta_regular', 20),
  makeEntry('Ciudad Obregón', 'Sonora', 'MX', 'ruta_regular', 20),
  makeEntry('Hermosillo', 'Sonora', 'MX', 'ruta_regular', 10),
  makeEntry('Tijuana', 'Baja California', 'MX', 'ruta_regular', 3),

  // Ruta CDMX–GDL (R4)
  makeEntry('San Miguel de Allende', 'Guanajuato', 'MX', 'ruta_regular', 15),
  makeEntry('León', 'Guanajuato', 'MX', 'ruta_regular', 10),
  makeEntry('Irapuato', 'Guanajuato', 'MX', 'ruta_regular', 20),
  makeEntry('Salamanca', 'Guanajuato', 'MX', 'ruta_regular', 25),
  makeEntry('Morelia', 'Michoacán', 'MX', 'ruta_regular', 15),

  // Ruta CDMX–Acapulco (R5)
  makeEntry('Cuernavaca', 'Morelos', 'MX', 'ruta_regular', 10),
  makeEntry('Chilpancingo', 'Guerrero', 'MX', 'ruta_regular', 25),
  makeEntry('Acapulco', 'Guerrero', 'MX', 'ruta_regular', 10),

  // Ruta CDMX–Juárez (R6)
  makeEntry('Torreón', 'Coahuila', 'MX', 'ruta_regular', 15),
  makeEntry('Gómez Palacio', 'Durango', 'MX', 'ruta_regular', 25),
  makeEntry('Durango', 'Durango', 'MX', 'ruta_regular', 15),
  makeEntry('Parral', 'Chihuahua', 'MX', 'ruta_regular', 30),
  makeEntry('Delicias', 'Chihuahua', 'MX', 'ruta_regular', 25),
  makeEntry('Chihuahua', 'Chihuahua', 'MX', 'ruta_regular', 10),
  makeEntry('Cd. Juárez', 'Chihuahua', 'MX', 'ruta_regular', 10),

  // Ruta GDL–Juárez (R7)
  makeEntry('Aguascalientes', 'Aguascalientes', 'MX', 'ruta_regular', 10),
  makeEntry('Zacatecas', 'Zacatecas', 'MX', 'ruta_regular', 15),

  // Ruta CDMX–Oaxaca (R8)
  makeEntry('Tehuacán', 'Puebla', 'MX', 'ruta_regular', 25),
  makeEntry('Oaxaca', 'Oaxaca', 'MX', 'ruta_regular', 10),

  // Ruta Veracruz regional (R9)
  makeEntry('Xalapa', 'Veracruz', 'MX', 'ruta_regular', 15),
  makeEntry('Boca del Río', 'Veracruz', 'MX', 'ruta_regular', 20),
  makeEntry('Minatitlán', 'Veracruz', 'MX', 'ruta_regular', 25),
  makeEntry('Poza Rica', 'Veracruz', 'MX', 'ruta_regular', 20),

  // Ruta Chiapas (R12)
  makeEntry('Tuxtla Gutiérrez', 'Chiapas', 'MX', 'ruta_regular', 15),
  makeEntry('San Cristóbal de las Casas', 'Chiapas', 'MX', 'ruta_regular', 20),
  makeEntry('Tapachula', 'Chiapas', 'MX', 'ruta_regular', 20),
  makeEntry('Comitán', 'Chiapas', 'MX', 'ruta_regular', 25),
  makeEntry('Palenque', 'Chiapas', 'MX', 'ruta_regular', 25),

  // Extensions & frontier
  makeEntry('Nuevo Laredo', 'Tamaulipas', 'MX', 'ruta_regular', 20),
  makeEntry('Reynosa', 'Tamaulipas', 'MX', 'ruta_regular', 20),
  makeEntry('Matamoros', 'Tamaulipas', 'MX', 'ruta_regular', 25),
  makeEntry('Tampico', 'Tamaulipas', 'MX', 'ruta_regular', 15),
  makeEntry('Ciudad Victoria', 'Tamaulipas', 'MX', 'ruta_regular', 25),
  makeEntry('Nogales', 'Sonora', 'MX', 'ruta_regular', 20),
  makeEntry('Mexicali', 'Baja California', 'MX', 'ruta_regular', 15),
  makeEntry('Ensenada', 'Baja California', 'MX', 'ruta_regular', 20),
  makeEntry('Tecate', 'Baja California', 'MX', 'ruta_regular', 25),
  makeEntry('Colima', 'Colima', 'MX', 'ruta_regular', 20),

  // Baja California Sur (R18)
  makeEntry('La Paz', 'Baja California Sur', 'MX', 'ruta_regular', 15),
  makeEntry('Los Cabos', 'Baja California Sur', 'MX', 'ruta_regular', 10),
  makeEntry('Loreto', 'Baja California Sur', 'MX', 'ruta_regular', 30),

  // Ruta Reynosa–MTY (R20)
  makeEntry('Cadereyta', 'Nuevo León', 'MX', 'ruta_regular', 30),
];

// ─────────────────────────────────────────────────────────────────────────────
// MEXICO — FUERA DE RUTA (available but subject to validation)
// ─────────────────────────────────────────────────────────────────────────────

const MX_FUERA_DE_RUTA: CityEntry[] = [
  makeEntry('Celaya', 'Guanajuato', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Guanajuato', 'Guanajuato', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Pachuca', 'Hidalgo', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Tlaxcala', 'Tlaxcala', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Uruapan', 'Michoacán', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Zamora', 'Michoacán', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Lázaro Cárdenas', 'Michoacán', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Zihuatanejo', 'Guerrero', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Ixtapa', 'Guerrero', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Taxco', 'Guerrero', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Puerto Escondido', 'Oaxaca', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Huatulco', 'Oaxaca', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Chetumal', 'Quintana Roo', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Bacalar', 'Quintana Roo', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Cozumel', 'Quintana Roo', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Cholula', 'Puebla', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Atlixco', 'Puebla', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Valle de Bravo', 'Estado de México', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Metepec', 'Estado de México', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Lerma', 'Estado de México', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Piedras Negras', 'Coahuila', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Monclova', 'Coahuila', 'MX', 'fuera_de_ruta', 50),
  makeEntry('San Luis Río Colorado', 'Sonora', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Navojoa', 'Sonora', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Guaymas', 'Sonora', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Caborca', 'Sonora', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Comalcalco', 'Tabasco', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Cárdenas', 'Tabasco', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Paraíso', 'Tabasco', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Tonalá', 'Chiapas', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Arriaga', 'Chiapas', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Tuxpan', 'Veracruz', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Papantla', 'Veracruz', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Coatepec', 'Veracruz', 'MX', 'fuera_de_ruta', 50),
  makeEntry('Guerrero Negro', 'Baja California Sur', 'MX', 'fuera_de_ruta', 50),
];

// ─────────────────────────────────────────────────────────────────────────────
// ESTADOS UNIDOS — INTERNACIONAL
// ─────────────────────────────────────────────────────────────────────────────

const USA_CITIES: CityEntry[] = [
  // Texas
  makeEntry('Houston', 'Texas', 'USA', 'internacional', 40),
  makeEntry('Dallas', 'Texas', 'USA', 'internacional', 40),
  makeEntry('San Antonio', 'Texas', 'USA', 'internacional', 40),
  makeEntry('Austin', 'Texas', 'USA', 'internacional', 40),
  makeEntry('El Paso', 'Texas', 'USA', 'internacional', 40),
  makeEntry('McAllen', 'Texas', 'USA', 'internacional', 40),
  makeEntry('Laredo', 'Texas', 'USA', 'internacional', 40),
  makeEntry('Brownsville', 'Texas', 'USA', 'internacional', 45),
  makeEntry('Fort Worth', 'Texas', 'USA', 'internacional', 45),

  // California
  makeEntry('Los Angeles', 'California', 'USA', 'internacional', 40),
  makeEntry('San Diego', 'California', 'USA', 'internacional', 40),
  makeEntry('San Francisco', 'California', 'USA', 'internacional', 45),
  makeEntry('San Jose', 'California', 'USA', 'internacional', 45),
  makeEntry('Sacramento', 'California', 'USA', 'internacional', 45),
  makeEntry('Fresno', 'California', 'USA', 'internacional', 50),

  // Arizona
  makeEntry('Phoenix', 'Arizona', 'USA', 'internacional', 40),
  makeEntry('Tucson', 'Arizona', 'USA', 'internacional', 45),

  // Nevada
  makeEntry('Las Vegas', 'Nevada', 'USA', 'internacional', 40),

  // Florida
  makeEntry('Miami', 'Florida', 'USA', 'internacional', 40),
  makeEntry('Orlando', 'Florida', 'USA', 'internacional', 45),
  makeEntry('Tampa', 'Florida', 'USA', 'internacional', 50),

  // Illinois
  makeEntry('Chicago', 'Illinois', 'USA', 'internacional', 40),

  // Georgia
  makeEntry('Atlanta', 'Georgia', 'USA', 'internacional', 45),

  // New York
  makeEntry('New York', 'New York', 'USA', 'internacional', 45),

  // Colorado
  makeEntry('Denver', 'Colorado', 'USA', 'internacional', 45),

  // New Mexico
  makeEntry('Albuquerque', 'New Mexico', 'USA', 'internacional', 45),

  // North Carolina
  makeEntry('Charlotte', 'North Carolina', 'USA', 'internacional', 50),

  // Tennessee
  makeEntry('Nashville', 'Tennessee', 'USA', 'internacional', 50),

  // Washington
  makeEntry('Seattle', 'Washington', 'USA', 'internacional', 50),

  // Oregon  
  makeEntry('Portland', 'Oregon', 'USA', 'internacional', 50),
];

// ─────────────────────────────────────────────────────────────────────────────
// FULL DATABASE
// ─────────────────────────────────────────────────────────────────────────────

export const CITY_DATABASE: CityEntry[] = [
  ...MX_RUTA_REGULAR,
  ...MX_FUERA_DE_RUTA,
  ...USA_CITIES,
].sort((a, b) => a.order - b.order || a.city.localeCompare(b.city));

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const ALIASES: Record<string, string[]> = {
  'Ciudad de México': ['cdmx', 'df', 'distrito federal', 'mexico city'],
  'Guadalajara': ['gdl', 'perla tapatio'],
  'Monterrey': ['mty', 'regio'],
  'Tijuana': ['tj'],
  'Querétaro': ['qro'],
  'Aguascalientes': ['ags'],
  'San Luis Potosí': ['slp'],
  'Cd. Juárez': ['cd juarez', 'ciudad juarez', 'juarez'],
  'Los Cabos': ['cabo san lucas', 'san jose del cabo'],
  'La Paz': ['la paz bcs'],
  'Puerto Vallarta': ['vallarta'],
  'Tuxtla Gutiérrez': ['tuxtla'],
  'Playa del Carmen': ['playa'],
  'Coatzacoalcos': ['coatza'],
  'San Cristóbal de las Casas': ['san cristobal', 'sancris'],
  'Los Angeles': ['la', 'l.a.'],
  'New York': ['nyc', 'nueva york'],
};

/** Search cities by query, returns matching CityEntry[] sorted by relevance */
export function searchCityEntries(query: string): CityEntry[] {
  if (query.length < 2) return [];
  const q = norm(query);
  const results: { entry: CityEntry; score: number }[] = [];

  for (const entry of CITY_DATABASE) {
    if (!entry.active) continue;
    let score = 0;

    // Direct city name match
    const cityNorm = norm(entry.city);
    if (cityNorm === q) {
      score = 100;
    } else if (cityNorm.startsWith(q)) {
      score = 80;
    } else if (cityNorm.includes(q)) {
      score = 60;
    }

    // State match
    if (score === 0 && norm(entry.state).includes(q)) {
      score = 30;
    }

    // Full search key match
    if (score === 0 && entry.searchKey.includes(q)) {
      score = 20;
    }

    // Alias match
    if (score === 0) {
      const aliases = ALIASES[entry.city];
      if (aliases?.some(a => a.includes(q) || q.includes(a))) {
        score = 70;
      }
    }

    if (score > 0) {
      // Boost ruta_regular cities
      if (entry.type === 'ruta_regular') score += 10;
      // Boost by order (lower order = higher priority)
      score += Math.max(0, 50 - entry.order);
      results.push({ entry, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.entry);
}

/** Get a CityEntry by display string or city name */
export function findCityEntry(input: string): CityEntry | null {
  if (!input.trim()) return null;
  const q = norm(input);

  // Exact display match
  const exact = CITY_DATABASE.find(e => norm(e.display) === q);
  if (exact) return exact;

  // Exact city name match
  const byName = CITY_DATABASE.find(e => norm(e.city) === q);
  if (byName) return byName;

  // Alias match
  for (const entry of CITY_DATABASE) {
    const aliases = ALIASES[entry.city];
    if (aliases?.some(a => a === q)) return entry;
  }

  // Partial city match
  const partial = CITY_DATABASE.find(e => norm(e.city).includes(q) || q.includes(norm(e.city)));
  if (partial) return partial;

  return null;
}

/** Get the operational message for a city type */
export function getCityTypeMessage(type: CityType): string {
  switch (type) {
    case 'ruta_regular':
      return 'Ruta con cobertura frecuente';
    case 'fuera_de_ruta':
      return 'Servicio sujeto a validación operativa';
    case 'internacional':
      return 'Ruta internacional sujeta a validación logística y cobertura';
  }
}

/** Get the operational label for a city type */
export function getCityTypeLabel(type: CityType): string {
  switch (type) {
    case 'ruta_regular': return 'Ruta regular';
    case 'fuera_de_ruta': return 'Bajo validación';
    case 'internacional': return 'Internacional';
  }
}
