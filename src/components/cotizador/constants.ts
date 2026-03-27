/**
 * Cotizador shared constants, types & helpers
 * La Unión Mudanzas
 */

export const WHATSAPP_NUMBER = '4421270514';
export const MIN_VOL = 5;
export const TOTAL_STEPS = 5;
export const MARGEN_APP = 0.30;
export const COSTO_RECOLECCION = 500;
export const COSTO_ENTREGA = 500;
export const URGENCIA_PCT = 0.15;

// ─── Volume table ────────────────────────────────────────────────
export const VOLUMES: Record<string, number> = {
  cama_king: 2.5, cama_matrimonial: 2, cama_individual: 1.5,
  sofa_3_plazas: 2, sofa_2_plazas: 1.5, sofa_individual: 0.8, sofa_cama: 2.5,
  comedor_6: 1.5, comedor_4: 1, mesa_centro: 0.3,
  ropero_3p: 2, ropero_2p: 1.5, cajones_3: 0.8,
  buros: 0.3, tocador: 0.8, librero: 0.8,
  refrigerador_duplex: 2, refrigerador_14: 1.2, estufa: 0.6,
  lavadora: 0.5, secadora: 0.5,
  tv_55: 0.3, tv_65: 0.5, tv_75: 0.6,
  escritorio: 0.8, silla_oficina: 0.4, archivero: 0.5,
  computadora: 0.2, impresora: 0.2,
  bicicleta: 0.5,
  caja_estandar: 0.15,
};

export const INVENTORY_LABELS: Record<string, string> = {
  cama_king: 'Cama king', cama_matrimonial: 'Cama matrimonial', cama_individual: 'Cama individual',
  sofa_3_plazas: 'Sofá 3 plazas', sofa_2_plazas: 'Sofá 2 plazas', sofa_individual: 'Sillón individual', sofa_cama: 'Sofá-cama',
  comedor_6: 'Comedor 6 personas', comedor_4: 'Comedor 4 personas', mesa_centro: 'Mesa de centro',
  ropero_3p: 'Ropero 3 puertas', ropero_2p: 'Ropero 2 puertas', cajones_3: 'Cajonera', buros: 'Buró(s)', tocador: 'Tocador', librero: 'Librero',
  refrigerador_duplex: 'Refrigerador dúplex', refrigerador_14: 'Refrigerador normal', estufa: 'Estufa',
  lavadora: 'Lavadora', secadora: 'Secadora',
  tv_55: 'TV 55"', tv_65: 'TV 65"', tv_75: 'TV 75"+',
  escritorio: 'Escritorio', silla_oficina: 'Silla oficina', archivero: 'Archivero', computadora: 'Computadora/laptop',
  impresora: 'Impresora', bicicleta: 'Bicicleta',
  caja_estandar: 'Caja estándar (7 = 1 m³)',
};

export const INVENTORY_ROOMS = [
  { section: '🛏️ Recámara', keys: ['cama_king', 'cama_matrimonial', 'cama_individual', 'ropero_3p', 'ropero_2p', 'cajones_3', 'buros', 'tocador'] },
  { section: '🛋️ Sala', keys: ['sofa_3_plazas', 'sofa_2_plazas', 'sofa_individual', 'sofa_cama', 'mesa_centro', 'librero'] },
  { section: '🍽️ Comedor', keys: ['comedor_6', 'comedor_4'] },
  { section: '🍳 Cocina', keys: ['refrigerador_duplex', 'refrigerador_14', 'estufa'] },
  { section: '🧺 Lavado', keys: ['lavadora', 'secadora'] },
  { section: '📺 Electrónicos', keys: ['tv_55', 'tv_65', 'tv_75', 'computadora'] },
  { section: '🗂️ Oficina/otros', keys: ['escritorio', 'silla_oficina', 'archivero', 'bicicleta'] },
  { section: '📦 Cajas', keys: ['caja_estandar'] },
];

// ─── Unit suggestion ─────────────────────────────────────────────
export function getUnit(vol: number) {
  if (vol <= 10) return { label: 'Nissan / Camioneta', range: '0–10 m³', emoji: '🚐', fill: Math.min(100, (vol / 10) * 100) };
  if (vol <= 20) return { label: 'Camioneta 3.5 ton', range: '10–20 m³', emoji: '🚚', fill: Math.min(100, ((vol - 10) / 10) * 100) };
  if (vol <= 35) return { label: 'Rabón', range: '20–35 m³', emoji: '🚛', fill: Math.min(100, ((vol - 20) / 15) * 100) };
  if (vol <= 60) return { label: 'Tórtón', range: '35–60 m³', emoji: '🚛', fill: Math.min(100, ((vol - 35) / 25) * 100) };
  if (vol <= 90) return { label: 'Camión Grande', range: '60–90 m³', emoji: '🚛', fill: Math.min(100, ((vol - 60) / 30) * 100) };
  return { label: 'Tráiler', range: '+90 m³', emoji: '🚛🚛', fill: 100 };
}

export function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

export function getInsuranceRate(monto: number): number {
  if (monto < 100000) return 0.02;
  if (monto < 500000) return 0.015;
  return 0.01;
}

// ─── Modalidad rules ─────────────────────────────────────────────
export function getAvailableModalidades(vol: number, hasExclusiveZone: boolean) {
  if (hasExclusiveZone) return [{ id: 'exclusivo', label: 'Exclusivo', emoji: '⭐', desc: 'Ideal para zonas especiales' }];
  if (vol > 60) return [{ id: 'exclusivo', label: 'Exclusivo', emoji: '⭐', desc: 'Tu unidad dedicada' }];
  if (vol > 40) return [
    { id: 'directo', label: 'Directo', emoji: '⚡', desc: 'Unidad dedicada, menos escalas' },
    { id: 'exclusivo', label: 'Exclusivo', emoji: '⭐', desc: 'Tu unidad dedicada' },
  ];
  return [
    { id: 'compartido', label: 'Compartido', emoji: '🤝', desc: 'Menor costo, tiempos variables' },
    { id: 'directo', label: 'Directo', emoji: '⚡', desc: 'Unidad dedicada, menos escalas' },
    { id: 'exclusivo', label: 'Exclusivo', emoji: '⭐', desc: 'Ideal para rutas especiales' },
  ];
}

// ─── Service types (tronco común) ────────────────────────────────
export const SERVICE_TYPES = [
  { id: 'mudanza_casa', label: 'Mudanza casa', icon: '🏠' },
  { id: 'flete', label: 'Flete', icon: '📦' },
  { id: 'traslado_auto', label: 'Traslado auto', icon: '🚗' },
  { id: 'traslado_moto', label: 'Traslado moto', icon: '🏍️' },
  { id: 'maniobras', label: 'Maniobras', icon: '🏗️' },
  { id: 'paqueteria', label: 'Paquetería', icon: '📬' },
  { id: 'almacenaje', label: 'Almacenaje', icon: '🏭' },
  { id: 'especial', label: 'Especial', icon: '⭐' },
] as const;

export const COMPLEX_SERVICE_TYPES = ['maniobras', 'almacenaje', 'especial'];

// ─── Wizard state type ──────────────────────────────────────────
export interface WizardState {
  nombre: string;
  whatsapp: string;
  correo: string;
  origen: string;
  destino: string;
  fecha: string;
  volMode: 'inventario' | 'manual';
  volManual: number;
  inventory: Record<string, number>;
  modalidad: string;
  tipoServicio: string;
  pisos: string;
  elevador: string;
  acarreo: string;
  seguro: boolean;
  montoSeguro: number;
  // New fields
  horarioCarga: string;
  horarioEntrega: string;
  peso: string;
  presupuestoCliente: string;
  comentariosEspeciales: string;
  visitaOcular: boolean;
}

export const INITIAL_INVENTORY: Record<string, number> = Object.fromEntries(
  Object.keys(VOLUMES).map(k => [k, 0])
);

export const INITIAL_STATE: WizardState = {
  nombre: '', whatsapp: '', correo: '',
  origen: '', destino: '', fecha: '',
  volMode: 'inventario', volManual: 0,
  inventory: { ...INITIAL_INVENTORY },
  modalidad: 'compartido',
  tipoServicio: '',
  pisos: '', elevador: '', acarreo: '',
  seguro: false, montoSeguro: 50000,
  horarioCarga: '', horarioEntrega: '',
  peso: '', presupuestoCliente: '', comentariosEspeciales: '',
  visitaOcular: false,
};
