/**
 * pdf-orden-service.ts — La Unión Mudanzas
 * Generates, uploads, and registers the Orden de Servicio PDF.
 */

import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

// Brand colours
const NAVY   = [11, 31, 58]   as const;  // #0B1F3A
const ORANGE = [255, 107, 0]  as const;  // #FF6B00
const GREY   = [100, 120, 145] as const;
const LIGHT  = [230, 238, 248] as const;
const WHITE  = [255, 255, 255] as const;

export interface OrdenPDFData {
  folio: string;
  nombre: string;
  whatsapp: string;
  correo?: string;
  origen: string;
  destino: string;
  fecha: string;           // ISO date string
  serviceLabel: string;
  tipoServicio?: string;
  modalidad?: string;
  vol: string;
  unitLabel: string;
  precioTotal: number;
  precioBase?: number;
  costoRecoleccion?: number;
  costoEntrega?: number;
  costoAdicionales?: number;
  seguroMonto?: number;
  seguroCosto?: number;
  inventario?: Record<string, number>;
  inventarioLabels?: Record<string, string>;
  observaciones?: string;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return 'Por confirmar';
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return isoDate; }
}

function getDeliveryDate(isoDate: string): string {
  if (!isoDate) return 'Por confirmar';
  try {
    const d = new Date(isoDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return 'Por confirmar'; }
}

function fmxn(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`;
}

export function generateOrdenPDF(data: OrdenPDFData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  let y = 0;

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 42, 'F');

  // Brand name
  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LA UNION MUDANZAS', 14, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(180, 210, 240);
  doc.text('Cada mudanza es una historia', 14, 23);

  // Truck emoji fallback — simple truck shape
  doc.setFillColor(...ORANGE);
  doc.roundedRect(150, 5, 48, 32, 4, 4, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLIO', 174, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text(data.folio, 174, 21, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-MX')}`, 174, 28, { align: 'center' });

  y = 50;

  // ── SECTION HELPER ────────────────────────────────────────────────────────
  function sectionTitle(title: string) {
    doc.setFillColor(...NAVY);
    doc.roundedRect(12, y, W - 24, 7, 1.5, 1.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(title.toUpperCase(), 16, y + 4.8);
    y += 11;
  }

  function fieldRow(label: string, value: string, col2 = false) {
    const x = col2 ? W / 2 + 4 : 14;
    const maxW = W / 2 - 20;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(value || '—', maxW);
    doc.text(lines, x, y + 4);
    return lines.length;
  }

  function twoCol(l1: string, v1: string, l2: string, v2: string) {
    const linesL = fieldRow(l1, v1, false);
    const linesR = fieldRow(l2, v2, true);
    y += Math.max(linesL, linesR) * 4 + 8;
  }

  function oneCol(label: string, value: string) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(label.toUpperCase(), 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(value || '—', W - 32);
    doc.text(lines, 14, y + 4);
    y += lines.length * 4 + 8;
  }

  // ── 1. DATOS DEL CLIENTE ─────────────────────────────────────────────────
  sectionTitle('1. Datos del Cliente');
  twoCol('Nombre completo', data.nombre, 'WhatsApp / Teléfono', data.whatsapp);
  twoCol('Dirección de origen', data.origen, 'Dirección de destino', data.destino);
  if (data.correo) oneCol('Correo electrónico', data.correo);

  // ── 2. DETALLE DEL SERVICIO ──────────────────────────────────────────────
  sectionTitle('2. Detalle del Servicio');
  twoCol('Ruta', `${data.origen}  →  ${data.destino}`, 'Modalidad', data.modalidad || data.serviceLabel || 'Compartido');
  twoCol('Fecha de carga', formatDate(data.fecha), 'Fecha estimada de entrega', getDeliveryDate(data.fecha));
  twoCol('Tipo de servicio', data.tipoServicio || data.serviceLabel || 'Mudanza', 'Unidad asignada', data.unitLabel);
  twoCol('Volumen total', `${data.vol} m³`, 'Seguro de carga', data.seguroMonto ? fmxn(data.seguroMonto) : 'No contratado');

  // ── 3. INVENTARIO RESUMIDO ───────────────────────────────────────────────
  if (data.inventario && data.inventarioLabels) {
    const items = Object.entries(data.inventario)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${data.inventarioLabels![k] || k}: ${v}`)
      .join('  ·  ');

    if (items) {
      sectionTitle('3. Inventario Resumido');
      const lines = doc.splitTextToSize(items || '—', W - 32);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 8;
    }
  }

  // ── 4. SEGURO ──────────────────────────────────────────────────────────
  if (data.seguroMonto && data.seguroCosto) {
    sectionTitle('4. Seguro de Carga');
    twoCol('Monto asegurado', fmxn(data.seguroMonto), 'Costo del seguro', fmxn(data.seguroCosto));
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GREY);
    doc.text('El seguro cubre daños derivados del traslado bajo condiciones normales de operación.', 14, y - 3);
    y += 4;
  }

  // ── 5. COSTO DEL SERVICIO ───────────────────────────────────────────────
  sectionTitle('5. Desglose del Servicio');

  const rowsDesglose: [string, string][] = [];
  if (data.precioBase)         rowsDesglose.push(['Flete base', fmxn(data.precioBase)]);
  if (data.costoRecoleccion)   rowsDesglose.push(['Recolección', fmxn(data.costoRecoleccion)]);
  if (data.costoEntrega)       rowsDesglose.push(['Entrega', fmxn(data.costoEntrega)]);
  if (data.costoAdicionales)   rowsDesglose.push(['Adicionales (pisos/acarreo)', fmxn(data.costoAdicionales)]);
  if (data.seguroCosto)        rowsDesglose.push(['Seguro de carga', fmxn(data.seguroCosto)]);

  const tableX = 14;
  const tableW = W - 28;
  rowsDesglose.forEach(([label, val]) => {
    doc.setFillColor(...LIGHT);
    doc.rect(tableX, y - 3, tableW, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(label, tableX + 3, y + 1.5);
    doc.setFont('helvetica', 'bold');
    doc.text(val, tableX + tableW - 3, y + 1.5, { align: 'right' });
    y += 8;
  });

  // TOTAL row
  doc.setFillColor(...NAVY);
  doc.rect(tableX, y - 2, tableW, 10, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('PRECIO TOTAL DEL SERVICIO', tableX + 4, y + 4.5);
  doc.setFontSize(12);
  doc.setTextColor(...ORANGE);
  doc.text(fmxn(data.precioTotal), tableX + tableW - 3, y + 4.5, { align: 'right' });
  y += 14;

  // Anticipo note
  const anticipo = Math.ceil(data.precioTotal * 0.5);
  doc.setFillColor(255, 107, 0, 30);
  doc.setDrawColor(...ORANGE);
  doc.roundedRect(tableX, y, tableW, 10, 2, 2, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ORANGE);
  doc.text(`Anticipo requerido (50%): ${fmxn(anticipo)}`, tableX + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('50% restante se liquida al momento de la carga.', tableX + tableW - 3, y + 6.5, { align: 'right' });
  y += 14;

  // ── 6. OBSERVACIONES ────────────────────────────────────────────────────
  sectionTitle('6. Observaciones y Condiciones');
  const obs = (data.observaciones || '') +
    '\n• Sujeto a condiciones del inmueble.' +
    '\n• Cambios en volumen generan ajuste de precio.' +
    '\n• Maniobras no especificadas se cotizan aparte.' +
    '\n• Si la unidad no entra se aplican cargos adicionales.';
  const obsLines = doc.splitTextToSize(obs.trim(), W - 32);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(obsLines, 14, y);
  y += obsLines.length * 4 + 8;

  // ── 7. TÉRMINOS RESUMIDOS ────────────────────────────────────────────────
  sectionTitle('7. Términos y Condiciones (Resumen)');
  const terms = [
    '• No hay reembolso con cancelación menor a 24 horas.',
    '• El cliente debe declarar correctamente el volumen.',
    '• El proveedor puede ajustar costos si hay diferencias.',
    '• No se descarga sin liquidación total del servicio.',
    '• El servicio puede presentar demoras por causas externas.',
    '• La empresa actúa como intermediario logístico.',
    '• El servicio es ejecutado por el proveedor asignado.',
  ];
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(terms, 14, y);
  y += terms.length * 5 + 4;

  // Legal URLs
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...ORANGE);
  doc.text('Términos completos: launionmudanzas.com/terminos-y-condiciones', 14, y);
  y += 4;
  doc.text('Aviso de privacidad: launionmudanzas.com/aviso-de-privacidad', 14, y);
  y += 8;

  // ── 8. LEYENDA LEGAL ─────────────────────────────────────────────────────
  // Check if we need a new page
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFillColor(...NAVY);
  doc.roundedRect(12, y, W - 24, 30, 3, 3, 'F');
  doc.setDrawColor(...ORANGE);
  doc.roundedRect(12, y, W - 24, 30, 3, 3, 'S');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ORANGE);
  doc.text('LEYENDA DE ACEPTACIÓN', 16, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 225, 255);
  const leyenda = 'CONFIRMO DE RECIBIDO Y ESTOY DE ACUERDO CON LOS TÉRMINOS Y CONDICIONES DEL SERVICIO, ACEPTANDO EL CIERRE DE MI SERVICIO CON LA UNIÓN MUDANZAS';
  const leyendaLines = doc.splitTextToSize(leyenda, W - 32);
  doc.text(leyendaLines, 16, y + 11);
  // Acceptance metadata
  doc.setFontSize(6.5);
  doc.setTextColor(160, 190, 220);
  doc.text(`Cliente: ${data.nombre}  |  Fecha de aceptación: ${new Date().toLocaleDateString('es-MX')}  |  Estatus: Aceptado digitalmente`, 16, y + 24);
  y += 36;

  // ── 9. FIRMA ─────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREY);

  // Client signature
  doc.text('FIRMA DEL CLIENTE', 20, y);
  doc.line(14, y + 12, 90, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.nombre, 14, y + 17);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 14, y + 22);

  // Admin signature
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBIDO POR LA UNIÓN MUDANZAS', W - 100, y);
  doc.line(W - 106, y + 12, W - 18, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Nombre y sello del representante', W - 106, y + 17);

  y += 30;

  // ── 10. FOOTER ────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 280, W, 17, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ORANGE);
  doc.text('#LaUnionMudanzas 🚛', W / 2, 286, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 240);
  doc.text('Salimos todas las semanas · Servicio compartido disponible', W / 2, 291, { align: 'center' });
  doc.text('WhatsApp: 4421270514  |  launionmudanzas.com', W / 2, 295, { align: 'center' });

  return doc;
}

// ── Upload + DB registration ───────────────────────────────────────────────

export interface OrdenPDFResult {
  pdfUrl: string;
  ordenId: string;
}

export async function generateAndSaveOrden(
  data: OrdenPDFData,
  cotizacionId: string,
): Promise<OrdenPDFResult> {
  // 1. Generate PDF
  const doc = generateOrdenPDF(data);
  const pdfBlob = doc.output('blob');
  const fileName = `${data.folio}.pdf`;

  // 2. Upload to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from('ordenes-servicio')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadErr) throw new Error(`Upload falló: ${uploadErr.message}`);

  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from('ordenes-servicio')
    .getPublicUrl(fileName);
  const pdfUrl = urlData.publicUrl;

  // 4. Upsert ordenes_servicio record
  const { data: orden, error: ordenErr } = await supabase
    .from('ordenes_servicio')
    .upsert(
      { cotizacion_id: cotizacionId, folio: data.folio, pdf_url: pdfUrl, estatus: 'generada' },
      { onConflict: 'cotizacion_id' }
    )
    .select('id')
    .single();
  if (ordenErr || !orden) throw new Error(`DB error: ${ordenErr?.message}`);

  return { pdfUrl, ordenId: orden.id };
}
