/**
 * send-service-email — La Unión Mudanzas
 * Handles 6 email types: cotizacion, confirmacion_pago, orden_servicio,
 * incidencia, reembolso, reagendacion.
 * Falls back silently if RESEND_API_KEY is not set.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ADMIN_EMAIL = 'admin@launionmudanzas.com';
const BRAND_COLOR = '#00f5ff';
const WA_NUMBER = '4421270514';

type EmailType =
  | 'cotizacion'
  | 'confirmacion_pago'
  | 'orden_servicio'
  | 'incidencia'
  | 'reembolso'
  | 'reagendacion';

interface EmailPayload {
  type: EmailType;
  to?: string;         // client email (optional)
  folio?: string;
  customer_name?: string;
  route?: string;      // "Origen → Destino"
  service_date?: string;
  delivery_date?: string;
  service_type?: string;
  volume?: string;
  unit?: string;
  amount?: number;
  html?: string;       // custom html override
  pdf_url?: string;    // link to generated PDF
  // Legacy fields (keep backward compat)
  nombre?: string;
  whatsapp?: string;
  origen?: string;
  destino?: string;
  fecha?: string;
  serviceLabel?: string;
  vol?: string;
  unitLabel?: string;
  precioTotal?: number;
  precioAnticipo?: number;
  tipoPago?: string;
}

// ─── HTML builders ────────────────────────────────────────────────

const BASE_STYLES = `
  body { margin:0; padding:0; background:#0a1628; font-family:Inter,Arial,sans-serif; color:#f0f8ff; }
  .wrap { max-width:600px; margin:0 auto; padding:32px 16px; }
  .header { text-align:center; margin-bottom:28px; }
  .brand { display:inline-block; background:linear-gradient(135deg,#00f5ff22,#0066ff22); border:1px solid ${BRAND_COLOR}33; border-radius:16px; padding:10px 22px; }
  .brand p { font-size:20px; font-weight:900; color:${BRAND_COLOR}; margin:0; letter-spacing:-0.5px; }
  .hero { background:#0d2040; border:1px solid ${BRAND_COLOR}33; border-radius:16px; padding:24px; margin-bottom:18px; text-align:center; }
  .hero h1 { font-size:22px; font-weight:900; color:#f0f8ff; margin:0 0 6px; }
  .hero p { color:#7fa8cc; font-size:13px; margin:0; }
  .folio { text-align:center; margin-bottom:18px; }
  .folio span { background:${BRAND_COLOR}22; border:1px solid ${BRAND_COLOR}44; border-radius:999px; padding:5px 16px; font-size:12px; font-weight:700; color:${BRAND_COLOR}; font-family:monospace; }
  .details { background:#0d2040; border:1px solid #1e3a5f; border-radius:16px; padding:18px; margin-bottom:18px; }
  .details table { width:100%; border-collapse:collapse; }
  .details td { padding:7px 0; border-bottom:1px solid #1e3a5f22; }
  .details td:first-child { color:#7fa8cc; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; width:40%; }
  .details td:last-child { color:#f0f8ff; font-size:12px; font-weight:600; }
  .price { background:linear-gradient(135deg,#00f5ff11,#0066ff11); border:1px solid ${BRAND_COLOR}44; border-radius:16px; padding:18px; margin-bottom:18px; }
  .alert-warn { background:#ff6b0011; border:1px solid #ff6b0033; border-radius:12px; padding:14px; margin-bottom:20px; }
  .alert-warn p { margin:0; font-size:11px; color:#ff9055; font-weight:700; }
  .alert-warn ul { margin:6px 0 0; padding-left:14px; font-size:11px; color:#7fa8cc; line-height:1.8; }
  .alert-info { background:#00f5ff11; border:1px solid #00f5ff33; border-radius:12px; padding:14px; margin-bottom:20px; }
  .alert-info p { margin:0; font-size:12px; color:#7fa8cc; line-height:1.6; }
  .cta { text-align:center; margin-bottom:28px; }
  .cta a { display:inline-block; background:linear-gradient(135deg,${BRAND_COLOR},#0066ff); color:#0a1628; font-weight:900; font-size:13px; padding:13px 28px; border-radius:12px; text-decoration:none; }
  .footer { text-align:center; font-size:10px; color:#4a6a8a; margin:0; }
  .footer a { color:${BRAND_COLOR}; text-decoration:none; }
`;

function wrap(content: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_STYLES}</style></head><body><div class="wrap">
  <div class="header"><div class="brand"><p>🚛 LA UNIÓN MUDANZAS</p><p style="font-size:10px;color:#7fa8cc;margin:2px 0 0;font-style:italic;">Cada mudanza es una historia</p></div></div>
  ${content}
  <p class="footer">La Unión Mudanzas SA de CV · Querétaro, México<br><a href="https://wa.me/${WA_NUMBER}">WhatsApp: ${WA_NUMBER}</a> · #LaUnionMudanzas</p>
</div></body></html>`;
}

function detailRows(rows: [string, string][]): string {
  return `<div class="details"><table>${rows.map(([l, v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join('')}</table></div>`;
}

function buildCotizacionHTML(p: EmailPayload): string {
  const nombre = p.customer_name || p.nombre || 'Cliente';
  const ruta = p.route || `${p.origen || '?'} → ${p.destino || '?'}`;
  const fecha = p.service_date || p.fecha || 'Por confirmar';
  const vol = p.volume || p.vol || '—';
  const unidad = p.unit || p.unitLabel || '—';
  const tipo = p.service_type || p.serviceLabel || 'Mudanza';
  const folio = p.folio || '—';
  return wrap(`
    <div class="hero"><h1>Tu cotización está lista</h1><p>Hola <strong>${nombre}</strong>, aquí tienes el resumen de tu solicitud.</p></div>
    <div class="folio"><span>📋 Folio: ${folio}</span></div>
    ${detailRows([['Cliente', nombre], ['Ruta', ruta], ['Fecha estimada', fecha], ['Tipo de servicio', tipo], ['Volumen estimado', `${vol} m³`], ['Unidad sugerida', unidad]])}
    <div class="alert-info"><p>⏳ Un asesor confirmará precio y disponibilidad por WhatsApp en breve. Recuerda que los precios son estimados y pueden ajustarse según volumen real.</p></div>
    <div class="cta"><a href="https://wa.me/${WA_NUMBER}?text=Hola%2C+mi+folio+es+${folio}">💬 Confirmar por WhatsApp</a></div>
  `);
}

function buildConfirmacionPagoHTML(p: EmailPayload): string {
  const nombre = p.customer_name || p.nombre || 'Cliente';
  const ruta = p.route || `${p.origen || '?'} → ${p.destino || '?'}`;
  const folio = p.folio || '—';
  const total = p.amount || p.precioTotal || 0;
  const anticipo = p.precioAnticipo || Math.ceil(total * 0.5);
  const tipoPago = p.tipoPago === 'completo' ? 'Pago completo' : 'Anticipo 50%';
  return wrap(`
    <div class="hero"><h1>¡Pago recibido!</h1><p>Hola <strong>${nombre}</strong>, tu servicio está confirmado.</p></div>
    <div class="folio"><span>📋 Folio: ${folio}</span></div>
    ${detailRows([['Cliente', nombre], ['Ruta', ruta], ['Tipo de pago', tipoPago]])}
    <div class="price">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#7fa8cc;font-size:12px;">Total del servicio</span>
        <span style="color:#f0f8ff;font-size:13px;font-weight:700;">$${total.toLocaleString('es-MX')} MXN</span>
      </div>
      <div style="border-top:1px solid ${BRAND_COLOR}22;padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#f0f8ff;font-size:13px;font-weight:700;">Anticipo pagado</span>
        <span style="color:${BRAND_COLOR};font-size:19px;font-weight:900;">$${anticipo.toLocaleString('es-MX')} MXN</span>
      </div>
    </div>
    <div class="alert-warn"><p>⚠️ Reglas importantes:</p><ul><li>El restante se liquida al <strong style="color:#f0f8ff;">momento de la carga</strong></li><li>No se descarga sin liquidación del servicio</li><li>Cancelaciones con menos de 24 hrs: sin reembolso</li></ul></div>
    <div class="cta"><a href="https://wa.me/${WA_NUMBER}?text=Hola%2C+mi+folio+es+${folio}">💬 Seguimiento por WhatsApp</a></div>
  `);
}

function buildOrdenServicioHTML(p: EmailPayload): string {
  const nombre = p.customer_name || p.nombre || 'Cliente';
  const ruta = p.route || `${p.origen || '?'} → ${p.destino || '?'}`;
  const folio = p.folio || '—';
  const fechaCarga = p.service_date || p.fecha || 'Por confirmar';
  const fechaEntrega = p.delivery_date || 'Al día siguiente';
  const vol = p.volume || p.vol || '—';
  const unidad = p.unit || p.unitLabel || '—';
  const tipo = p.service_type || p.serviceLabel || 'Mudanza';
  return wrap(`
    <div class="hero"><h1>Tu Orden de Servicio</h1><p>Hola <strong>${nombre}</strong>, tu servicio está apartado y documentado.</p></div>
    <div class="folio"><span>📋 Folio: ${folio}</span></div>
    ${detailRows([['Cliente', nombre], ['Ruta', ruta], ['Tipo de servicio', tipo], ['Volumen', `${vol} m³`], ['Unidad asignada', unidad], ['Fecha de carga', fechaCarga], ['Fecha estimada de entrega', fechaEntrega]])}
    <div class="alert-warn"><p>⚠️ Reglas del servicio:</p><ul><li>El 50% restante se paga al momento de la carga</li><li>No se descarga sin liquidación total</li><li>Reporta cualquier anomalía antes de firmar</li><li>Cancelaciones con menos de 24 hrs: sin reembolso</li></ul></div>
    <div class="cta"><a href="https://wa.me/${WA_NUMBER}?text=Hola%2C+confirmo+mi+orden+folio+${folio}">✅ Confirmar por WhatsApp</a></div>
  `);
}

function buildIncidenciaHTML(p: EmailPayload): string {
  const nombre = p.customer_name || p.nombre || 'Cliente';
  const ruta = p.route || `${p.origen || '?'} → ${p.destino || '?'}`;
  const folio = p.folio || '—';
  const tipo = p.service_type || 'Incidencia reportada';
  return wrap(`
    <div class="hero" style="border-color:#ff6b0033;"><h1 style="color:#ff9055;">Actualización de tu servicio</h1><p>Hola <strong>${nombre}</strong>, se registró una incidencia en tu servicio.</p></div>
    <div class="folio"><span>📋 Folio: ${folio}</span></div>
    ${detailRows([['Cliente', nombre], ['Ruta', ruta], ['Tipo de incidencia', tipo]])}
    <div class="alert-warn"><p>ℹ️ Información importante:</p><ul><li>Nuestro equipo de operaciones fue notificado</li><li>Te contactaremos por WhatsApp en breve</li><li>Si hubo negligencia del proveedor: puedes reagendar o recibir reembolso en 7 días hábiles</li></ul></div>
    <div class="cta"><a href="https://wa.me/${WA_NUMBER}?text=Hola%2C+mi+folio+es+${folio}+tengo+una+incidencia">💬 Hablar con operaciones</a></div>
  `);
}

function buildReembolsoHTML(p: EmailPayload): string {
  const nombre = p.customer_name || p.nombre || 'Cliente';
  const folio = p.folio || '—';
  const monto = p.amount || p.precioTotal;
  return wrap(`
    <div class="hero" style="border-color:#22c55e33;"><h1 style="color:#22c55e;">Actualización de reembolso</h1><p>Hola <strong>${nombre}</strong>, hay una actualización sobre tu reembolso.</p></div>
    <div class="folio"><span>📋 Folio: ${folio}</span></div>
    ${detailRows([['Cliente', nombre], ...(monto ? [['Monto', `$${monto.toLocaleString('es-MX')} MXN`] as [string,string]] : [])])}
    <div class="alert-info"><p>ℹ️ El reembolso se procesa en un plazo máximo de <strong style="color:#f0f8ff;">7 días hábiles</strong> una vez confirmado. Para cualquier duda, contáctanos por WhatsApp.</p></div>
    <div class="cta"><a href="https://wa.me/${WA_NUMBER}?text=Hola%2C+mi+folio+es+${folio}+pregunta+sobre+reembolso">💬 Contactar soporte</a></div>
  `);
}

function buildReagendacionHTML(p: EmailPayload): string {
  const nombre = p.customer_name || p.nombre || 'Cliente';
  const ruta = p.route || `${p.origen || '?'} → ${p.destino || '?'}`;
  const folio = p.folio || '—';
  const nuevaFecha = p.service_date || p.fecha || 'Por confirmar';
  const nuevaEntrega = p.delivery_date || 'Al día siguiente';
  return wrap(`
    <div class="hero" style="border-color:#0066ff33;"><h1>Nueva fecha de servicio</h1><p>Hola <strong>${nombre}</strong>, tu servicio fue reagendado.</p></div>
    <div class="folio"><span>📋 Folio: ${folio}</span></div>
    ${detailRows([['Cliente', nombre], ['Ruta', ruta], ['Nueva fecha de carga', nuevaFecha], ['Nueva fecha de entrega', nuevaEntrega]])}
    <div class="alert-info"><p>ℹ️ Confirma la nueva fecha por WhatsApp. Si tienes algún problema con la reprogramación, contáctanos lo antes posible.</p></div>
    <div class="cta"><a href="https://wa.me/${WA_NUMBER}?text=Hola%2C+confirmo+mi+reagendacion+folio+${folio}">✅ Confirmar nueva fecha</a></div>
  `);
}

function buildHTML(p: EmailPayload, isAdmin: boolean): { subject: string; html: string } {
  // If caller provides custom html, use it
  if (p.html) return { subject: p.type || 'Notificación - La Unión Mudanzas', html: p.html };

  const folio = p.folio || '—';
  const nombre = p.customer_name || p.nombre || 'Cliente';

  switch (p.type) {
    case 'cotizacion':
      return {
        subject: isAdmin ? `📦 Nueva cotización — ${folio}` : `Tu cotización - La Unión Mudanzas (${folio})`,
        html: buildCotizacionHTML(p),
      };
    case 'confirmacion_pago':
      return {
        subject: isAdmin ? `✅ Pago recibido — ${folio}` : `Pago recibido - La Unión Mudanzas (${folio})`,
        html: buildConfirmacionPagoHTML(p),
      };
    case 'orden_servicio':
      return {
        subject: isAdmin ? `📄 Orden generada — ${folio}` : `Tu orden de servicio - La Unión Mudanzas (${folio})`,
        html: buildOrdenServicioHTML(p),
      };
    case 'incidencia':
      return {
        subject: isAdmin ? `⚠️ Incidencia registrada — ${folio}` : `Actualización de tu servicio - La Unión Mudanzas`,
        html: buildIncidenciaHTML(p),
      };
    case 'reembolso':
      return {
        subject: isAdmin ? `💸 Reembolso actualizado — ${folio}` : `Actualización de reembolso - La Unión Mudanzas`,
        html: buildReembolsoHTML(p),
      };
    case 'reagendacion':
      return {
        subject: isAdmin ? `📅 Reagendación — ${folio}` : `Nueva fecha de servicio - La Unión Mudanzas (${folio})`,
        html: buildReagendacionHTML(p),
      };
    default:
      return {
        subject: isAdmin ? `📦 Nuevo servicio — ${folio}` : `Tu servicio - La Unión Mudanzas`,
        html: buildConfirmacionPagoHTML(p),
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping email send');
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: 'RESEND_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const payload: EmailPayload = await req.json();

    if (!payload.type) {
      return new Response(
        JSON.stringify({ error: 'Falta el campo "type"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const adminContent = buildHTML(payload, true);
    const clientContent = buildHTML(payload, false);

    const sends: Promise<Response>[] = [];

    // Always send to admin
    sends.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'La Unión Mudanzas <noreply@launionmudanzas.com>',
          to: [ADMIN_EMAIL],
          subject: adminContent.subject,
          html: adminContent.html,
        }),
      })
    );

    // Send to client only if email provided
    const clientEmail = payload.to;
    if (clientEmail && clientEmail.includes('@')) {
      sends.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'La Unión Mudanzas <noreply@launionmudanzas.com>',
            to: [clientEmail],
            subject: clientContent.subject,
            html: clientContent.html,
          }),
        })
      );
    }

    await Promise.allSettled(sends);

    return new Response(
      JSON.stringify({ success: true, folio: payload.folio, type: payload.type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('send-service-email error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
