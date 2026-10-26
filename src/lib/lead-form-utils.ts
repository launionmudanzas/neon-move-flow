import { siteConfig } from '@/lib/site-config';

/**
 * Construye el mensaje de WhatsApp con los datos del lead.
 */
export function buildLeadWAMessage(params: {
  folio?: string;
  nombre: string;
  origen: string;
  destino: string;
  tipoServicio?: string;
}) {
  const { folio, nombre, origen, destino, tipoServicio } = params;
  const lines = [
    `Hola, quiero cotizar una mudanza.`,
    ``,
    ...(folio ? [`📋 *Folio:* ${folio}`] : []),
    `👤 *Nombre:* ${nombre}`,
    `📍 *Origen:* ${origen}`,
    `📍 *Destino:* ${destino}`,
    ...(tipoServicio ? [`🚛 *Tipo:* ${tipoServicio}`] : []),
    ``,
    `_${siteConfig.brandName} · ${siteConfig.phone}_`,
  ];
  return encodeURIComponent(lines.join('\n'));
}

/**
 * Genera el link de WhatsApp completo.
 */
export function buildLeadWALink(params: Parameters<typeof buildLeadWAMessage>[0]) {
  return `https://wa.me/${siteConfig.whatsApp}?text=${buildLeadWAMessage(params)}`;
}

/**
 * Valida los campos requeridos mínimos del formulario.
 */
export function isLeadFormValid(fields: {
  nombre: string;
  telefono: string;
  origen: string;
  destino: string;
  aceptaPrivacidad: boolean;
}): boolean {
  return (
    fields.nombre.trim().length > 0 &&
    /^\d{10,15}$/.test(fields.telefono.replace(/\D/g, '')) &&
    fields.origen.trim().length > 0 &&
    fields.destino.trim().length > 0 &&
    fields.aceptaPrivacidad
  );
}
