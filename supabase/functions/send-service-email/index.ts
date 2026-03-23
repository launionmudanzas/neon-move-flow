/**
 * send-service-email — La Unión Mudanzas
 * Sends order confirmation to the client and admin via Resend.
 * Falls back silently if RESEND_API_KEY is not set (so payment flow never breaks).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ADMIN_EMAIL = 'admin@launionmudanzas.com';
const BRAND_COLOR = '#00f5ff';

interface EmailPayload {
  folio: string;
  nombre: string;
  correo?: string;
  whatsapp: string;
  origen: string;
  destino: string;
  fecha: string;
  serviceLabel: string;
  vol: string;
  unitLabel: string;
  precioTotal: number;
  precioAnticipo: number;
  tipoPago: string; // 'tarjeta' | 'spei' | 'completo'
}

function buildHTML(d: EmailPayload, isAdmin: boolean): string {
  const subject = isAdmin
    ? `📦 Nuevo servicio confirmado — ${d.folio}`
    : `✅ Tu servicio está apartado — ${d.folio}`;
  const headline = isAdmin
    ? `Nuevo servicio registrado`
    : `¡Tu mudanza está apartada!`;
  const subline = isAdmin
    ? `El cliente <strong>${d.nombre}</strong> ha confirmado su servicio.`
    : `Hola <strong>${d.nombre}</strong>, aquí está el resumen de tu servicio.`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Inter,Arial,sans-serif;color:#f0f8ff;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#00f5ff22,#0066ff22);border:1px solid ${BRAND_COLOR}33;border-radius:16px;padding:12px 24px;">
        <p style="font-size:22px;font-weight:900;color:${BRAND_COLOR};margin:0;letter-spacing:-0.5px;">🚛 LA UNIÓN MUDANZAS</p>
      </div>
    </div>

    <!-- Hero -->
    <div style="background:#0d2040;border:1px solid ${BRAND_COLOR}33;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center;">
      <h1 style="font-size:24px;font-weight:900;color:#f0f8ff;margin:0 0 8px;">${headline}</h1>
      <p style="color:#7fa8cc;font-size:14px;margin:0;">${subline}</p>
    </div>

    <!-- Folio chip -->
    <div style="text-align:center;margin-bottom:20px;">
      <span style="background:${BRAND_COLOR}22;border:1px solid ${BRAND_COLOR}44;border-radius:999px;padding:6px 18px;font-size:13px;font-weight:700;color:${BRAND_COLOR};font-family:monospace;">
        📋 Folio: ${d.folio}
      </span>
    </div>

    <!-- Details grid -->
    <div style="background:#0d2040;border:1px solid #1e3a5f;border-radius:16px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        ${[
          ['Cliente', d.nombre],
          ['WhatsApp', d.whatsapp],
          ['Origen', d.origen],
          ['Destino', d.destino],
          ['Fecha de carga', d.fecha || 'Por confirmar'],
          ['Servicio', d.serviceLabel],
          ['Volumen', `${d.vol} m³`],
          ['Unidad sugerida', d.unitLabel],
          ['Tipo de pago', d.tipoPago === 'completo' ? 'Pago completo' : 'Anticipo 50%'],
        ].map(([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#7fa8cc;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1e3a5f22;width:40%;">${label}</td>
          <td style="padding:8px 0;color:#f0f8ff;font-size:13px;font-weight:600;border-bottom:1px solid #1e3a5f22;">${value}</td>
        </tr>`).join('')}
      </table>
    </div>

    <!-- Pricing -->
    <div style="background:linear-gradient(135deg,#00f5ff11,#0066ff11);border:1px solid ${BRAND_COLOR}44;border-radius:16px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#7fa8cc;font-size:12px;">Precio total del servicio</span>
        <span style="color:#f0f8ff;font-size:14px;font-weight:700;">$${d.precioTotal.toLocaleString('es-MX')} MXN</span>
      </div>
      <div style="border-top:1px solid ${BRAND_COLOR}22;padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#f0f8ff;font-size:14px;font-weight:700;">Anticipo 50%</span>
        <span style="color:${BRAND_COLOR};font-size:20px;font-weight:900;">$${d.precioAnticipo.toLocaleString('es-MX')} MXN</span>
      </div>
    </div>

    <!-- Important note -->
    <div style="background:#ff6b0011;border:1px solid #ff6b0033;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#ff9055;font-weight:700;">⚠️ Reglas importantes:</p>
      <ul style="margin:8px 0 0;padding-left:16px;font-size:12px;color:#7fa8cc;line-height:1.8;">
        <li>El restante 50% se liquida al <strong style="color:#f0f8ff;">momento de la carga</strong></li>
        <li>No se descarga sin liquidación del servicio</li>
        <li>Cancelaciones con menos de 24 hrs: <strong style="color:#f0f8ff;">sin reembolso</strong></li>
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://wa.me/524421270514?text=Hola%2C+mi+folio+es+${d.folio}" 
         style="display:inline-block;background:linear-gradient(135deg,${BRAND_COLOR},#0066ff);color:#0a1628;font-weight:900;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        💬 Confirmar por WhatsApp
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#4a6a8a;margin:0;">
      La Unión Mudanzas SA de CV · Querétaro, México<br>
      <a href="https://wa.me/524421270514" style="color:${BRAND_COLOR};text-decoration:none;">WhatsApp: 442 127 0514</a>
    </p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      // Graceful fallback — email service not configured yet
      console.warn('RESEND_API_KEY not set — skipping email send');
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: 'RESEND_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const payload: EmailPayload = await req.json();

    if (!payload.folio || !payload.nombre) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos (folio, nombre)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const adminHTML = buildHTML(payload, true);
    const clientHTML = buildHTML(payload, false);

    const sends: Promise<Response>[] = [];

    // Always send to admin
    sends.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'La Unión Mudanzas <noreply@launionmudanzas.com>',
          to: [ADMIN_EMAIL],
          subject: `📦 Nuevo servicio confirmado — ${payload.folio}`,
          html: adminHTML,
        }),
      })
    );

    // Send to client only if email provided
    if (payload.correo && payload.correo.includes('@')) {
      sends.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'La Unión Mudanzas <noreply@launionmudanzas.com>',
            to: [payload.correo],
            subject: `✅ Tu servicio está apartado — ${payload.folio}`,
            html: clientHTML,
          }),
        })
      );
    }

    await Promise.allSettled(sends);

    return new Response(
      JSON.stringify({ success: true, folio: payload.folio }),
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
