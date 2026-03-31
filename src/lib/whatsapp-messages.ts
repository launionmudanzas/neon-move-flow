/**
 * Plantillas de mensajes WhatsApp — LA UNIÓN MUDANZAS
 * Todos los textos consumen siteConfig. Cero hardcodes.
 */

import { siteConfig } from '@/lib/site-config';

/* ───────────────────── Constantes ───────────────────── */

const WA_NUMBER = siteConfig.whatsAppFull;

const FIRMA = `_${siteConfig.hashtag} · ${siteConfig.whatsAppDisplay}_`;

/* ───────────────────── Tipos ───────────────────── */

export interface ServiceData {
  folio: string;
  nombre: string;
  origen: string;
  destino: string;
  fecha?: string;
  unidad?: string;
  vol?: string;
  tipoServicio?: string;
  total?: number;
  proveedor?: string;
}

export type WAEvent =
  | 'cotizacion_generada'
  | 'pago_recibido'
  | 'orden_generada'
  | 'servicio_programado'
  | 'inicio_carga'
  | 'en_ruta'
  | 'entrega_realizada'
  | 'incidencia'
  | 'reagendacion'
  | 'confirmacion_apartado'
  | 'seguimiento_1'
  | 'seguimiento_2'
  | 'seguimiento_3';

/* ───────────────────── Catálogos de evento ───────────────────── */

const EMOJI: Record<WAEvent, string> = {
  cotizacion_generada: '📋',
  pago_recibido: '✅',
  orden_generada: '📄',
  servicio_programado: '📅',
  inicio_carga: '📦',
  en_ruta: '🚛',
  entrega_realizada: '🏠',
  incidencia: '⚠️',
  reagendacion: '🔄',
  confirmacion_apartado: '🔐',
  seguimiento_1: '👋',
  seguimiento_2: '📌',
  seguimiento_3: '⏰',
};

const TITULO: Record<WAEvent, string> = {
  cotizacion_generada: 'Cotización Lista',
  pago_recibido: 'Pago Recibido',
  orden_generada: 'Orden de Servicio Generada',
  servicio_programado: 'Servicio Programado',
  inicio_carga: 'Inicio de Carga',
  en_ruta: 'Tu Mudanza Está En Ruta',
  entrega_realizada: 'Entrega Realizada',
  incidencia: 'Reporte de Incidencia',
  reagendacion: 'Reagendación de Servicio',
  confirmacion_apartado: 'Servicio Apartado',
  seguimiento_1: 'Seguimiento de Cotización',
  seguimiento_2: 'Seguimiento de Cotización',
  seguimiento_3: 'Última Oportunidad',
};

const MENSAJE_EXTRA: Record<WAEvent, string> = {
  cotizacion_generada:
    'Tu cotización está lista. Por favor confírmala para apartar el servicio.',
  pago_recibido:
    '¡Anticipo recibido con éxito! Tu servicio está confirmado en agenda.',
  orden_generada:
    'Tu orden de servicio ha sido generada y guardada. Puedes descargarla desde el enlace.',
  servicio_programado:
    'Tu mudanza está en agenda. Te contactaremos un día antes para confirmar logística.',
  inicio_carga:
    '🚨 El equipo ya está en tu domicilio iniciando la carga. Por favor mantente disponible.',
  en_ruta:
    '🚛 ¡Tu mudanza ya está en camino! Te avisamos al llegar al destino.',
  entrega_realizada:
    '✅ ¡Entrega realizada! Por favor confirma la recepción y firma de conformidad.',
  incidencia:
    '⚠️ Se registró una incidencia. Nuestro equipo te contactará de inmediato para resolverla.',
  reagendacion:
    'Tu servicio ha sido reagendado. Revisa la nueva fecha y confírmanos.',
  confirmacion_apartado: [
    '🔐 Servicio confirmado en agenda.',
    '',
    '💳 Recuerda el esquema de pagos:',
    '  • Apartado: ya pagado ✅',
    '  • 50% del total: al momento de la carga',
    '  • Resto: antes de la descarga',
    '',
    'Guarda este mensaje como comprobante.',
  ].join('\n'),
  seguimiento_1: `Te escribimos de ${siteConfig.brandName} para dar seguimiento a tu cotización. Quedamos atentos para ayudarte a cerrar tu servicio. 🚛`,
  seguimiento_2:
    'Seguimos pendientes de tu cotización. Si deseas asegurar espacio o resolver dudas, estamos a tus órdenes. 📦',
  seguimiento_3:
    'Aún tenemos disponibilidad para tu servicio. Si gustas, podemos ayudarte a confirmar tu mudanza hoy mismo. ⏰',
};

/* ───────────────────── Mensaje genérico por evento ───────────────────── */

export function buildWhatsAppMessage(event: WAEvent, data: ServiceData): string {
  const emoji = EMOJI[event];
  const titulo = TITULO[event];
  const extra = MENSAJE_EXTRA[event];

  const lines = [
    `${emoji} *${siteConfig.brandName}*`,
    `*${titulo}*`,
    '',
    `📋 *Folio:* ${data.folio}`,
    `👤 *Cliente:* ${data.nombre}`,
    `🗺️ *Ruta:* ${data.origen} → ${data.destino}`,
  ];

  if (data.fecha) lines.push(`📅 *Fecha:* ${data.fecha}`);
  if (data.vol) lines.push(`📦 *Volumen:* ${data.vol} m³`);
  if (data.unidad) lines.push(`🚛 *Unidad:* ${data.unidad}`);
  if (data.tipoServicio) lines.push(`🏷️ *Servicio:* ${data.tipoServicio}`);
  if (data.total) lines.push(`💰 *Total:* $${data.total.toLocaleString('es-MX')} MXN`);
  if (data.proveedor) lines.push(`🤝 *Proveedor:* ${data.proveedor}`);

  lines.push('', extra, '', FIRMA);

  return lines.join('\n');
}

/* ───────────────────── Link wa.me ───────────────────── */

export function buildWhatsAppLink(
  event: WAEvent,
  data: ServiceData,
  targetNumber?: string,
): string {
  const msg = buildWhatsAppMessage(event, data);
  const number = targetNumber ?? WA_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

/* ───────────────────── Cotización recibida ───────────────────── */

/** Mensaje de confirmación de cotización recibida */
export function buildCotizacionMessage({
  nombre,
  origen,
  destino,
  servicio,
  volumen,
}: {
  nombre: string;
  origen: string;
  destino: string;
  servicio: string;
  volumen: string;
}): string {
  return [
    `🚛 *${siteConfig.brandName}*`,
    `Hola ${nombre}, recibimos tu solicitud de cotización.`,
    '',
    `📍 Ruta: ${origen} → ${destino}`,
    `📦 Servicio: ${servicio}`,
    `📊 Volumen estimado: ${volumen}`,
    '',
    'En breve un asesor te contactará para darte opciones.',
    '',
    `📲 WhatsApp: ${siteConfig.whatsAppDisplay}`,
    '',
    `*${siteConfig.slogan}*`,
  ].join('\n');
}

/* ───────────────────── Orden de servicio ───────────────────── */

/** Mensaje de orden de servicio confirmada */
export function buildOrdenMessage({
  nombre,
  folio,
  proveedor,
  ruta,
}: {
  nombre: string;
  folio: string;
  proveedor: string;
  ruta: string;
}): string {
  return [
    `📄 *ORDEN DE SERVICIO*`,
    `🚛 *${siteConfig.brandName}*`,
    '',
    `Hola ${nombre},`,
    'Tu servicio ha sido confirmado.',
    '',
    `🔖 Folio: ${folio}`,
    `🚚 Proveedor: ${proveedor}`,
    `📍 Ruta: ${ruta}`,
    '',
    'Tu proveedor se pondrá en contacto contigo para coordinar detalles.',
    '',
    `📲 ${siteConfig.whatsAppDisplay}`,
    '',
    'Gracias por confiar en nosotros.',
    FIRMA,
  ].join('\n');
}

/* ───────────────────── Seguimiento ───────────────────── */

/** Mensaje de seguimiento / tracking de servicio */
export function buildTrackingMessage({
  folio,
  estatus,
}: {
  folio: string;
  estatus: string;
}): string {
  return [
    `📦 *SEGUIMIENTO DE SERVICIO*`,
    `🚛 *${siteConfig.brandName}*`,
    '',
    `🔖 Folio: ${folio}`,
    `📍 Estatus: ${estatus}`,
    '',
    'Para cualquier duda puedes escribirnos:',
    `📲 ${siteConfig.whatsAppDisplay}`,
    '',
    FIRMA,
  ].join('\n');
}

/* ───────────────────── Contacto inicial ───────────────────── */

/** Mensaje de primer contacto / bienvenida */
export function buildContactoInicialMessage({
  nombre,
}: {
  nombre: string;
}): string {
  return [
    `🚛 *${siteConfig.brandName}*`,
    '',
    `Hola ${nombre}, ¡bienvenido!`,
    '',
    'Somos tu aliado logístico para mudanzas, fletes y transporte en todo México.',
    '',
    '¿En qué podemos ayudarte?',
    '',
    `📲 ${siteConfig.whatsAppDisplay}`,
    `🌐 ${siteConfig.domain}`,
    '',
    `*${siteConfig.slogan}*`,
  ].join('\n');
}

/* ───────────────────── Abrir WhatsApp ───────────────────── */

/** Abre WhatsApp en nueva pestaña con mensaje pre-llenado */
export function openWhatsApp(
  event: WAEvent,
  data: ServiceData,
  targetNumber?: string,
): void {
  window.open(buildWhatsAppLink(event, data, targetNumber), '_blank');
}
