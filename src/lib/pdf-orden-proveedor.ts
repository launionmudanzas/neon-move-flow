/**
 * pdf-orden-proveedor.ts — La Unión Mudanzas
 * Generates the PROVIDER-facing order PDF with full operational details.
 */
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

const NAVY   = [11, 31, 58]   as const;
const ORANGE = [255, 107, 0]  as const;
const GREY   = [100, 120, 145] as const;
const LIGHT  = [230, 238, 248] as const;
const WHITE  = [255, 255, 255] as const;
const RED    = [220, 50, 50]   as const;

export interface OrdenProveedorData {
  folio: string;
  // Client info
  nombre: string;
  whatsapp: string;
  correo?: string;
  // Route
  origen: string;
  destino: string;
  fecha: string;
  fechaEntrega?: string;
  horarioCarga?: string;
  horarioEntrega?: string;
  // Service
  serviceLabel: string;
  tipoServicio?: string;
  modalidad?: string;
  vol: string;
  peso?: string;
  unitLabel: string;
  // Provider
  proveedorNombre?: string;
  // Pricing
  precioTotal: number;
  precioBase?: number;
  // Inventory
  inventario?: Record<string, number>;
  inventarioLabels?: Record<string, string>;
  // Extra
  comentariosEspeciales?: string;
  observaciones?: string;
}

function formatDate(d: string): string {
  if (!d) return 'Por confirmar';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function fmxn(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`;
}

export function generateOrdenProveedorPDF(data: OrdenProveedorData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  let y = 0;

  // ── HEADER ──
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE SERVICIO — PROVEEDOR', 14, 14);
  doc.setFontSize(8);
  doc.setTextColor(180, 210, 240);
  doc.text('DOCUMENTO CONFIDENCIAL · USO INTERNO', 14, 20);
  
  doc.setFillColor(...ORANGE);
  doc.roundedRect(150, 5, 48, 28, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLIO', 174, 13, { align: 'center' });
  doc.setFontSize(10);
  doc.text(data.folio, 174, 20, { align: 'center' });
  doc.setFontSize(7);
  doc.text(new Date().toLocaleDateString('es-MX'), 174, 27, { align: 'center' });

  y = 46;

  // Section helper
  function section(title: string) {
    doc.setFillColor(...NAVY);
    doc.roundedRect(12, y, W - 24, 7, 1.5, 1.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(title.toUpperCase(), 16, y + 4.8);
    y += 11;
  }

  function row(label: string, value: string) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(label.toUpperCase(), 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(value || '—', W - 32);
    doc.text(lines, 14, y + 4);
    y += lines.length * 4 + 7;
  }

  function twoCol(l1: string, v1: string, l2: string, v2: string) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(l1.toUpperCase(), 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(v1 || '—', 14, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(l2.toUpperCase(), W / 2 + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(v2 || '—', W / 2 + 4, y + 4);
    y += 12;
  }

  // ── 1. CLIENT DATA ──
  section('1. Datos completos del cliente');
  twoCol('Nombre completo', data.nombre, 'WhatsApp / Teléfono', data.whatsapp);
  if (data.correo) row('Correo', data.correo);
  twoCol('Dirección de origen', data.origen, 'Dirección de destino', data.destino);

  // ── 2. SERVICE DETAILS ──
  section('2. Detalle operativo del servicio');
  twoCol('Ruta', `${data.origen} → ${data.destino}`, 'Tipo de servicio', data.tipoServicio || data.serviceLabel);
  twoCol('Modalidad', data.modalidad || '—', 'Unidad asignada', data.unitLabel);
  twoCol('Fecha de carga', formatDate(data.fecha), 'Fecha estimada entrega', data.fechaEntrega ? formatDate(data.fechaEntrega) : 'Carga + 1 día');
  twoCol('Horario de carga', data.horarioCarga || 'Por confirmar', 'Horario de entrega', data.horarioEntrega || 'Por confirmar');
  twoCol('Volumen', `${data.vol} m³`, 'Peso', data.peso ? `${data.peso} kg` : 'No aplica');

  // ── 3. INVENTORY ──
  if (data.inventario && data.inventarioLabels) {
    const items = Object.entries(data.inventario).filter(([, v]) => v > 0);
    if (items.length > 0) {
      section('3. Inventario completo');
      items.forEach(([k, v]) => {
        const label = data.inventarioLabels![k] || k;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 20, 20);
        doc.text(`• ${label}: ${v}`, 16, y);
        y += 4.5;
        if (y > 265) { doc.addPage(); y = 20; }
      });
      y += 4;
    }
  }

  // ── 4. SPECIAL COMMENTS ──
  if (data.comentariosEspeciales) {
    section('4. Maniobras, accesos y observaciones');
    row('Comentarios especiales', data.comentariosEspeciales);
  }

  // ── 5. PAYMENT EXPECTED ──
  if (y > 230) { doc.addPage(); y = 20; }
  section('5. Pagos esperados');
  const apartado = Math.ceil(data.precioTotal * 0.3);
  const carga50 = Math.ceil(data.precioTotal * 0.5);
  const resto = data.precioTotal - apartado - carga50;
  twoCol('Precio total servicio', fmxn(data.precioTotal), 'Apartado (mín 30%)', fmxn(apartado));
  twoCol('50% al cargar', fmxn(carga50), 'Resto antes de descarga', fmxn(Math.max(0, resto)));

  // ── 6. COBRO INSTRUCTIONS ──
  if (y > 230) { doc.addPage(); y = 20; }
  section('6. Instrucciones de cobro');
  const instrucciones = [
    '• Verificar el inventario antes de cargar.',
    '• Cobrar 50% del precio TOTAL al momento de la carga.',
    '• Cobrar el saldo restante ANTES de iniciar la descarga.',
    '• NO se realiza descarga sin liquidación total.',
    '• Documentar todo pago recibido con comprobante.',
  ];
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  instrucciones.forEach(line => {
    doc.text(line, 16, y);
    y += 5;
  });
  y += 4;

  // ── 7. PROTOCOL ──
  if (y > 220) { doc.addPage(); y = 20; }
  section('7. Protocolo operativo obligatorio');
  const protocol = [
    '• Subir evidencias fotográficas de carga y descarga en la plataforma.',
    '• Reportar cualquier incidencia inmediatamente en la app.',
    '• Mantener comunicación con el cliente y central de operaciones.',
    '• Seguir ruta programada — notificar desvíos o retrasos.',
    '• Firmar la conformidad del cliente al entregar.',
  ];
  doc.setFontSize(7.5);
  protocol.forEach(line => {
    doc.text(line, 16, y);
    y += 5;
  });
  y += 4;

  // ── 8. WARNINGS ──
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFillColor(255, 240, 240);
  doc.setDrawColor(...RED);
  doc.roundedRect(12, y, W - 24, 30, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...RED);
  doc.text('⚠️ ADVERTENCIAS IMPORTANTES', 16, y + 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 20, 20);
  const warnings = [
    '• Está prohibido negociar directamente con el cliente fuera de la plataforma.',
    '• Todo debe reportarse en la app. Sin reporte = sin respaldo.',
    '• El incumplimiento puede resultar en sanciones, suspensiones o bloqueo.',
  ];
  warnings.forEach((w, i) => {
    doc.text(w, 16, y + 13 + i * 5);
  });
  y += 36;

  // ── FOOTER ──
  doc.setFillColor(...NAVY);
  doc.rect(0, 280, W, 17, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ORANGE);
  doc.text('DOCUMENTO CONFIDENCIAL — LA UNIÓN MUDANZAS', W / 2, 287, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 240);
  doc.text(`Folio: ${data.folio}  |  Generado: ${new Date().toLocaleDateString('es-MX')}`, W / 2, 293, { align: 'center' });

  return doc;
}

export async function generateAndSaveOrdenProveedor(
  data: OrdenProveedorData,
  cotizacionId: string,
): Promise<string> {
  const doc = generateOrdenProveedorPDF(data);
  const pdfBlob = doc.output('blob');
  const fileName = `proveedor_${data.folio}.pdf`;

  const { error: uploadErr } = await supabase.storage
    .from('ordenes-servicio')
    .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });
  if (uploadErr) throw new Error(`Upload falló: ${uploadErr.message}`);

  const { data: urlData } = supabase.storage
    .from('ordenes-servicio')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}