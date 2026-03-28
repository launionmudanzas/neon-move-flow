/**
 * Motor de cotización para servicios locales CDMX
 * La Unión Mudanzas
 */

// ─── Zonas de cobertura básica (hasta 50 km) ─────────────────────
export const ZONAS_COBERTURA_LOCAL = [
  'CDMX', 'Ciudad de México',
  'Naucalpan', 'Atizapán', 'Huixquilucan',
  'Tlalpan', 'Coyoacán',
  // Aliases
  'Naucalpan de Juárez', 'Atizapán de Zaragoza',
];

function normLocal(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function isZonaLocal(ciudad: string): boolean {
  const n = normLocal(ciudad);
  return ZONAS_COBERTURA_LOCAL.some(z => {
    const nz = normLocal(z);
    return nz === n || n.includes(nz) || nz.includes(n);
  });
}

// ─── Unidades locales ────────────────────────────────────────────
export interface UnidadLocal {
  id: string;
  nombre: string;
  capacidadMin: number;
  capacidadMax: number;
  precioMin: number;
  precioMax: number;
  personal: number;
  emoji: string;
}

export const UNIDADES_LOCALES: UnidadLocal[] = [
  { id: 'saveiro', nombre: 'Saveiro', capacidadMin: 0, capacidadMax: 4, precioMin: 1800, precioMax: 2000, personal: 2, emoji: '🚗' },
  { id: 'nissan', nombre: 'Nissan', capacidadMin: 4.01, capacidadMax: 13, precioMin: 3400, precioMax: 3800, personal: 2, emoji: '🚐' },
  { id: '3_5_chica', nombre: 'Camioneta 3.5 chica', capacidadMin: 13.01, capacidadMax: 24, precioMin: 7200, precioMax: 7500, personal: 3, emoji: '🚚' },
  { id: '3_5_grande', nombre: 'Camioneta 3.5 grande', capacidadMin: 24.01, capacidadMax: 45, precioMin: 10800, precioMax: 10800, personal: 4, emoji: '🚛' },
];

export function seleccionarUnidad(volumen: number): UnidadLocal | null {
  return UNIDADES_LOCALES.find(u => volumen >= u.capacidadMin && volumen <= u.capacidadMax) || null;
}

// ─── Piezas especiales ───────────────────────────────────────────
export const PIEZAS_ESPECIALES = [
  'Cristales / Espejos',
  'Madera de Parota',
  'Mármol / Piedra',
  'Piano / Teclado pesado',
  'Pantalla >80"',
  'Macetones grandes',
  'Caja fuerte',
  'Esculturas',
  'Mueble con peso fuera de lo regular',
] as const;

// ─── Extras ──────────────────────────────────────────────────────
export interface ExtraItem {
  id: string;
  label: string;
  activo: boolean;
  monto: number;
  observaciones: string;
}

export const EXTRAS_INICIALES: ExtraItem[] = [
  { id: 'acarreos', label: 'Acarreos', activo: false, monto: 0, observaciones: '' },
  { id: 'volados', label: 'Volados', activo: false, monto: 0, observaciones: '' },
  { id: 'maniobras_especiales', label: 'Maniobras especiales', activo: false, monto: 0, observaciones: '' },
  { id: 'zona_sin_acceso', label: 'Zona sin acceso', activo: false, monto: 0, observaciones: '' },
  { id: 'piezas_especiales', label: 'Piezas especiales', activo: false, monto: 0, observaciones: '' },
];

// ─── Pisos ───────────────────────────────────────────────────────
export interface PisosConfig {
  pisosOrigen: number;
  pisosDestino: number;
  elevadorOrigen: boolean;
  elevadorDestino: boolean;
  escaleras: boolean;
  tipo: 'sencillo' | 'complejo';
}

// Costo por piso ranges (por piso adicional al PB)
const COSTO_POR_PISO_SENCILLO = 250;
const COSTO_POR_PISO_COMPLEJO = 450;

export function calcularCostoPisos(config: PisosConfig): { total: number; porPiso: number; pisosTotal: number } {
  let pisosOrigen = Math.max(0, config.pisosOrigen - 1); // PB no cuenta
  let pisosDestino = Math.max(0, config.pisosDestino - 1);

  // Si hay elevador, no se cobra piso
  if (config.elevadorOrigen) pisosOrigen = 0;
  if (config.elevadorDestino) pisosDestino = 0;

  const pisosTotal = pisosOrigen + pisosDestino;
  const porPiso = config.tipo === 'complejo' ? COSTO_POR_PISO_COMPLEJO : COSTO_POR_PISO_SENCILLO;
  const total = pisosTotal * porPiso;

  return { total, porPiso, pisosTotal };
}

// ─── Volumen extra ───────────────────────────────────────────────
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

// ─── Resultado del cotizador local ───────────────────────────────
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

export function calcularServicioLocal(params: {
  volumen: number;
  pisos: PisosConfig;
  m3Reales: number;
  extras: ExtraItem[];
  piezasEspeciales: string[];
}): ResultadoLocal | null {
  const unidad = seleccionarUnidad(params.volumen);
  if (!unidad) return null;

  // Usar el promedio del rango como base
  const costoBase = Math.round((unidad.precioMin + unidad.precioMax) / 2);

  const desglosePisos = calcularCostoPisos(params.pisos);
  const desgloseVolumen = calcularVolumenExtra(params.volumen, params.m3Reales, costoBase);

  const detalleExtras = params.extras.filter(e => e.activo && e.monto > 0).map(e => ({ label: e.label, monto: e.monto }));
  if (params.piezasEspeciales.length > 0) {
    // Piezas especiales ya están incluidas en extras si se activó el bloque
  }
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
    requiereValidacion: params.m3Reales > params.volumen || params.piezasEspeciales.length > 0,
    desglosePisos,
    desgloseVolumen,
  };
}
