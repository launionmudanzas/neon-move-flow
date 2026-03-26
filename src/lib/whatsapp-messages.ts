/**
 * WhatsApp automatic message templates for La Unión Mudanzas
 * Each event generates a pre-filled wa.me link
 */

const WA_NUMBER = '524421270514';

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
};

const MENSAJE_EXTRA: Record<WAEvent, string> = {
  cotizacion_generada: 'Tu cotización está lista. Por favor confírmala para apartar el servicio.',
  pago_recibido: '¡Anticipo recibido con éxito! Tu servicio está confirmado en agenda.',
  orden_generada: 'Tu orden de servicio ha sido generada y guardada. Puedes descargarla desde el enlace.',
  servicio_programado: 'Tu mudanza está en agenda. Te contactaremos un día antes para confirmar logística.',
  inicio_carga: '🚨 El equipo ya está en tu domicilio iniciando la carga. Por favor mantente disponible.',
  en_ruta: '🚛 ¡Tu mudanza ya está en camino! Te avisamos al llegar al destino.',
  entrega_realizada: '✅ ¡Entrega realizada! Por favor confirma la recepción y firma de conformidad.',
  incidencia: '⚠️ Se registró una incidencia. Nuestro equipo te contactará de inmediato para resolverla.',
  reagendacion: 'Tu servicio ha sido reagendado. Revisa la nueva fecha y confírmanos.',
  confirmacion_apartado: '🔐 Servicio confirmado en agenda.\n\n💳 Recuerda el esquema de pagos:\n  • Apartado: ya pagado ✅\n  • 50% del total: al momento de la carga\n  • Resto: antes de la descarga\n\nGuarda este mensaje como comprobante.',
};

export function buildWhatsAppMessage(event: WAEvent, data: ServiceData): string {
  const emoji = EMOJI[event];
  const titulo = TITULO[event];
  const extra = MENSAJE_EXTRA[event];

  const lines = [
    `${emoji} *LA UNIÓN MUDANZAS*`,
    `*${titulo}*`,
    ``,
    `📋 *Folio:* ${data.folio}`,
    `👤 *Cliente:* ${data.nombre}`,
    `🗺️ *Ruta:* ${data.origen} → ${data.destino}`,
  ];

  if (data.fecha) lines.push(`📅 *Fecha:* ${data.fecha}`);
  if (data.vol)   lines.push(`📦 *Volumen:* ${data.vol} m³`);
  if (data.unidad) lines.push(`🚛 *Unidad:* ${data.unidad}`);
  if (data.tipoServicio) lines.push(`🏷️ *Servicio:* ${data.tipoServicio}`);
  if (data.total) lines.push(`💰 *Total:* $${data.total.toLocaleString('es-MX')} MXN`);
  if (data.proveedor) lines.push(`🤝 *Proveedor:* ${data.proveedor}`);

  lines.push(``, extra, ``, `_#LaUnionMudanzas · 4421270514_`);

  return lines.join('\n');
}

export function buildWhatsAppLink(event: WAEvent, data: ServiceData, targetNumber?: string): string {
  const msg = buildWhatsAppMessage(event, data);
  const number = targetNumber ?? WA_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

/** Opens WhatsApp in a new tab */
export function openWhatsApp(event: WAEvent, data: ServiceData, targetNumber?: string): void {
  window.open(buildWhatsAppLink(event, data, targetNumber), '_blank');
}
