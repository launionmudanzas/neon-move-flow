/**
 * Motor de cotización para servicios locales multi-zona
 * La Unión Mudanzas
 */

// ─── Tipos base ──────────────────────────────────────────────────
export interface UnidadLocal {
  id: string;
  nombre: string;
  capacidadMin: number;
  capacidadMax: number;
  precioBase: number;       // precio fijo (o promedio si hay rango)
  precioMin: number;
  precioMax: number;
  personal: number;
  emoji: string;
}

export interface ExtraItem {
  id: string;
  label: string;
  activo: boolean;
  monto: number;
  observaciones: string;
}

export interface PisosConfig {
  pisosOrigen: number;
  pisosDestino: number;
  elevadorOrigen: boolean;
  elevadorDestino: boolean;
  escaleras: boolean;
  tipo: 'sencillo' | 'complejo';
}

// ─── Configuración de zona ───────────────────────────────────────
export interface ZonaLocalConfig {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  ciudades: string[];                    // para validación de cobertura
  unidades: UnidadLocal[];
  extras: ExtraItem[];
  piezasEspeciales: readonly string[];
  pisos: {
    modelo: 'cdmx' | 'fijo';            // cdmx = sencillo/complejo, fijo = tarifa única
    costoPorPiso?: number;               // solo para modelo 'fijo'
    costoSencillo?: number;              // solo para modelo 'cdmx'
    costoComplejo?: number;              // solo para modelo 'cdmx'
  };
  volumenExtra: boolean;                 // ¿calcula volumen extra proporcional?
  maxVolumen: number;                    // límite superior para la zona
  validacionMsg: string;
}

// ═══════════════════════════════════════════════════════════════════
// ZONA: CDMX Y ZONA METROPOLITANA
// ═══════════════════════════════════════════════════════════════════
const CDMX_CONFIG: ZonaLocalConfig = {
  id: 'cdmx',
  nombre: 'CDMX y Zona Metropolitana',
  emoji: '🏙️',
  descripcion: 'Ciudad de México, Naucalpan, Atizapán, Huixquilucan, Tlalpan, Coyoacán',
  ciudades: [
    'CDMX', 'Ciudad de México',
    'Naucalpan', 'Atizapán', 'Huixquilucan',
    'Tlalpan', 'Coyoacán',
    'Naucalpan de Juárez', 'Atizapán de Zaragoza',
  ],
  unidades: [
    { id: 'saveiro', nombre: 'Saveiro', capacidadMin: 0, capacidadMax: 4, precioBase: 1900, precioMin: 1800, precioMax: 2000, personal: 2, emoji: '🚗' },
    { id: 'nissan', nombre: 'Nissan', capacidadMin: 4.01, capacidadMax: 13, precioBase: 3600, precioMin: 3400, precioMax: 3800, personal: 2, emoji: '🚐' },
    { id: '3_5_chica', nombre: 'Camioneta 3.5 chica', capacidadMin: 13.01, capacidadMax: 24, precioBase: 7350, precioMin: 7200, precioMax: 7500, personal: 3, emoji: '🚚' },
    { id: '3_5_grande', nombre: 'Camioneta 3.5 grande', capacidadMin: 24.01, capacidadMax: 45, precioBase: 10800, precioMin: 10800, precioMax: 10800, personal: 4, emoji: '🚛' },
  ],
  extras: [
    { id: 'acarreos', label: 'Acarreos', activo: false, monto: 0, observaciones: '' },
    { id: 'volados', label: 'Volados', activo: false, monto: 0, observaciones: '' },
    { id: 'maniobras_especiales', label: 'Maniobras especiales', activo: false, monto: 0, observaciones: '' },
    { id: 'zona_sin_acceso', label: 'Zona sin acceso', activo: false, monto: 0, observaciones: '' },
    { id: 'piezas_especiales', label: 'Piezas especiales', activo: false, monto: 0, observaciones: '' },
  ],
  piezasEspeciales: [
    'Cristales / Espejos',
    'Madera de Parota',
    'Mármol / Piedra',
    'Piano / Teclado pesado',
    'Pantalla >80"',
    'Macetones grandes',
    'Caja fuerte',
    'Esculturas',
    'Mueble con peso fuera de lo regular',
  ],
  pisos: {
    modelo: 'cdmx',
    costoSencillo: 250,
    costoComplejo: 450,
  },
  volumenExtra: true,
  maxVolumen: 45,
  validacionMsg: 'Sujeto a validación por fotos o visita virtual.',
};

// ═══════════════════════════════════════════════════════════════════
// ZONA: TIJUANA
// ═══════════════════════════════════════════════════════════════════
const TIJUANA_CONFIG: ZonaLocalConfig = {
  id: 'tijuana',
  nombre: 'Tijuana',
  emoji: '🌉',
  descripcion: 'Tijuana y zona urbana',
  ciudades: ['Tijuana'],
  unidades: [
    { id: 'tj_10', nombre: 'Unidad 10 m³', capacidadMin: 0, capacidadMax: 10, precioBase: 2500, precioMin: 2500, precioMax: 2500, personal: 2, emoji: '🚐' },
    { id: 'tj_15', nombre: 'Unidad 15 m³', capacidadMin: 10.01, capacidadMax: 15, precioBase: 3000, precioMin: 3000, precioMax: 3000, personal: 2, emoji: '🚚' },
    { id: 'tj_20', nombre: 'Unidad 20 m³', capacidadMin: 15.01, capacidadMax: 20, precioBase: 5000, precioMin: 5000, precioMax: 5000, personal: 3, emoji: '🚚' },
    { id: 'tj_30', nombre: 'Unidad 30 m³', capacidadMin: 20.01, capacidadMax: 30, precioBase: 6000, precioMin: 6000, precioMax: 6000, personal: 3, emoji: '🚛' },
  ],
  extras: [
    { id: 'piezas_pesadas', label: 'Piezas pesadas', activo: false, monto: 0, observaciones: '' },
    { id: 'maniobras', label: 'Maniobras', activo: false, monto: 0, observaciones: '' },
    { id: 'accesos_complicados', label: 'Accesos complicados', activo: false, monto: 0, observaciones: '' },
    { id: 'acarreos', label: 'Acarreos', activo: false, monto: 0, observaciones: '' },
  ],
  piezasEspeciales: [],  // Tijuana no usa piezas especiales detalladas
  pisos: {
    modelo: 'fijo',
    costoPorPiso: 500,
  },
  volumenExtra: false,   // modelo simple: base + pisos + extras
  maxVolumen: 30,
  validacionMsg: 'Sujeto a validación según condiciones reales del servicio.',
};

// ═══════════════════════════════════════════════════════════════════
// REGISTRO DE ZONAS
// ═══════════════════════════════════════════════════════════════════
export const ZONAS_LOCALES: ZonaLocalConfig[] = [CDMX_CONFIG, TIJUANA_CONFIG];

export function getZonaConfig(zonaId: string): ZonaLocalConfig | undefined {
  return ZONAS_LOCALES.find(z => z.id === zonaId);
}

// ─── Selección de unidad por zona ────────────────────────────────
export function seleccionarUnidadZona(zonaId: string, volumen: number): UnidadLocal | null {
  const zona = getZonaConfig(zonaId);
  if (!zona) return null;
  return zona.unidades.find(u => volumen >= u.capacidadMin && volumen <= u.capacidadMax) || null;
}

// ─── Cálculo de pisos por zona ───────────────────────────────────
export function calcularCostoPisosZona(
  zonaId: string,
  config: PisosConfig
): { total: number; porPiso: number; pisosTotal: number } {
  const zona = getZonaConfig(zonaId);
  if (!zona) return { total: 0, porPiso: 0, pisosTotal: 0 };

  let pisosOrigen = Math.max(0, config.pisosOrigen - 1);
  let pisosDestino = Math.max(0, config.pisosDestino - 1);

  if (config.elevadorOrigen) pisosOrigen = 0;
  if (config.elevadorDestino) pisosDestino = 0;

  const pisosTotal = pisosOrigen + pisosDestino;

  let porPiso = 0;
  if (zona.pisos.modelo === 'fijo') {
    porPiso = zona.pisos.costoPorPiso ?? 0;
  } else {
    porPiso = config.tipo === 'complejo'
      ? (zona.pisos.costoComplejo ?? 450)
      : (zona.pisos.costoSencillo ?? 250);
  }

  return { total: pisosTotal * porPiso, porPiso, pisosTotal };
}

// ─── Volumen extra (solo si la zona lo soporta) ──────────────────
export function calcularVolumenExtra(
  m3Cotizados: number,
  m3Reales: number,
  costoBase: number
): { m3Extra: number; costoM3: number; costoExtra: number } {
  const m3Extra = Math.max(0, m3Reales - m3Cotizados);
  const costoM3 = m3Cotizados > 0 ? costoBase / m3Cotizados : 0;
  const costoExtra = m3Extra * costoM3;
  return { m3Extra, costoM3, costoExtra };
}

// ─── Resultado ───────────────────────────────────────────────────
export interface ResultadoLocal {
  unidad: UnidadLocal;
  costoBase: number;
  costoPisos: number;
  costoVolumenExtra: number;
  costoExtras: number;
  detalleExtras: { label: string; monto: number }[];
  total: number;
  zonaValida: boolean;
  requiereValidacion: boolean;
  desglosePisos: { total: number; porPiso: number; pisosTotal: number };
  desgloseVolumen: { m3Extra: number; costoM3: number; costoExtra: number };
}

export function calcularServicioZona(params: {
  zonaId: string;
  volumen: number;
  pisos: PisosConfig;
  m3Reales: number;
  extras: ExtraItem[];
  piezasEspeciales: string[];
}): ResultadoLocal | null {
  const zona = getZonaConfig(params.zonaId);
  if (!zona) return null;

  const unidad = seleccionarUnidadZona(params.zonaId, params.volumen);
  if (!unidad) return null;

  const costoBase = unidad.precioBase;

  const desglosePisos = calcularCostoPisosZona(params.zonaId, params.pisos);

  let desgloseVolumen = { m3Extra: 0, costoM3: 0, costoExtra: 0 };
  if (zona.volumenExtra) {
    desgloseVolumen = calcularVolumenExtra(params.volumen, params.m3Reales, costoBase);
  }

  const detalleExtras = params.extras
    .filter(e => e.activo && e.monto > 0)
    .map(e => ({ label: e.label, monto: e.monto }));
  const costoExtras = detalleExtras.reduce((sum, e) => sum + e.monto, 0);

  const total = costoBase + desglosePisos.total + desgloseVolumen.costoExtra + costoExtras;

  return {
    unidad,
    costoBase,
    costoPisos: desglosePisos.total,
    costoVolumenExtra: desgloseVolumen.costoExtra,
    costoExtras,
    detalleExtras,
    total,
    zonaValida: true,
    requiereValidacion: (zona.volumenExtra && params.m3Reales > params.volumen) || params.piezasEspeciales.length > 0,
    desglosePisos,
    desgloseVolumen,
  };
}

// ─── Legacy exports (backwards compat) ───────────────────────────
export const UNIDADES_LOCALES = CDMX_CONFIG.unidades;
export const PIEZAS_ESPECIALES = CDMX_CONFIG.piezasEspeciales;
export const EXTRAS_INICIALES = CDMX_CONFIG.extras;
export const ZONAS_COBERTURA_LOCAL = CDMX_CONFIG.ciudades;

export function seleccionarUnidad(volumen: number): UnidadLocal | null {
  return seleccionarUnidadZona('cdmx', volumen);
}

export function calcularCostoPisos(config: PisosConfig) {
  return calcularCostoPisosZona('cdmx', config);
}

export function isZonaLocal(ciudad: string): boolean {
  const n = ciudad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return ZONAS_COBERTURA_LOCAL.some(z => {
    const nz = z.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return nz === n || n.includes(nz) || nz.includes(n);
  });
}

export function calcularServicioLocal(params: {
  volumen: number;
  pisos: PisosConfig;
  m3Reales: number;
  extras: ExtraItem[];
  piezasEspeciales: string[];
}): ResultadoLocal | null {
  return calcularServicioZona({ ...params, zonaId: 'cdmx' });
}
