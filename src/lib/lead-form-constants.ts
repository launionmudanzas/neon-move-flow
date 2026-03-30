/**
 * Constantes para el formulario público de captura de leads.
 * Alineado con el catálogo real de servicios de LA UNIÓN MUDANZAS.
 */

export const TIPOS_SERVICIO = [
  'Compartido',
  'Directo',
  'Exclusivo',
  'Flete',
  'Traslado de auto',
  'Traslado de moto',
  'Maniobras',
  'Paquetería',
  'Almacenaje',
  'Especial',
] as const;

export const TIPOS_INMUEBLE = [
  'Casa',
  'Departamento',
  'Oficina',
  'Bodega',
  'Otro',
] as const;

export const TIPOS_CARGA = [
  'Mudanza residencial',
  'Mudanza de oficina',
  'Muebles y enseres',
  'Electrodomésticos',
  'Cajas y documentos',
  'Carga frágil',
  'Maquinaria / pesado',
  'Mixta',
  'Otro',
] as const;

export type TipoServicio = (typeof TIPOS_SERVICIO)[number];
export type TipoInmueble = (typeof TIPOS_INMUEBLE)[number];
export type TipoCarga = (typeof TIPOS_CARGA)[number];
