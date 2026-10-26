import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ---------- helpers ---------- */

function sanitize(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLen);
}

function isValidPhone(v: string): boolean {
  return /^\d{10,15}$/.test(v);
}

function toBool(val: unknown): boolean {
  return val === true || val === "true";
}

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  if (isNaN(n) || n < 0 || n > 500000) return null;
  return n;
}

/* ---------- rate-limit map (per IP, in-memory) ---------- */
const ipBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipBucket.get(ip);
  if (!entry || now > entry.resetAt) {
    ipBucket.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ---------- handler ---------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Validate & sanitize required fields ---
  const nombre = sanitize(body.nombre, 100);
  const telefono = sanitize(body.telefono, 15).replace(/\D/g, "");
  const origen = sanitize(body.origen, 80);
  const destino = sanitize(body.destino, 80);

  const errors: string[] = [];
  if (!nombre) errors.push("nombre es requerido");
  if (!isValidPhone(telefono)) errors.push("teléfono inválido (10-15 dígitos)");
  if (!origen) errors.push("origen es requerido");
  if (!destino) errors.push("destino es requerido");

  if (errors.length) {
    return new Response(JSON.stringify({ error: errors.join(", ") }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Optional fields ---
  const fechaTentativa = sanitize(body.fecha_tentativa, 10) || null;
  const tipoServicio = sanitize(body.tipo_servicio, 40) || null;
  const tipoInmueble = sanitize(body.tipo_inmueble, 30) || null;
  const tipoCarga = sanitize(body.tipo_carga, 40) || null;
  const pisoElevador = sanitize(body.piso_elevador, 60) || null;
  const mensajeAdicional = sanitize(body.mensaje_adicional, 350) || null;
  const tipoSolicitante = sanitize(body.tipo_solicitante, 30);
  const fuenteConsulta = sanitize(body.fuente_consulta, 60).replace(/[^a-zA-Z0-9_-]/g, '') || 'sitio_web';
  const permitidos = ['particular', 'empresa_directa', 'encargado_autorizado'];
  const presupuestoEstimado = toNumber(body.presupuesto_estimado);
  const requiereAsesor = toBool(body.requiere_asesor);
  const requiereManiobras = toBool(body.requiere_maniobras);
  const aceptaPrivacidad = toBool(body.acepta_privacidad);

  if (!aceptaPrivacidad) {
    return new Response(JSON.stringify({ error: 'Es necesario aceptar el aviso de privacidad' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!permitidos.includes(tipoSolicitante)) {
    return new Response(JSON.stringify({ error: 'Formulario exclusivo para clientes finales' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate fecha_tentativa format if provided
  if (fechaTentativa && !/^\d{4}-\d{2}-\d{2}$/.test(fechaTentativa)) {
    return new Response(JSON.stringify({ error: "fecha_tentativa formato inválido (YYYY-MM-DD)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Insert with service role ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("leads_v3g")
    .insert({
      folio: "TEMP",
      nombre,
      telefono,
      origen,
      destino,
      fecha_tentativa: fechaTentativa,
      tipo_servicio: tipoServicio,
      tipo_inmueble: tipoInmueble,
      tipo_carga: tipoCarga,
      piso_elevador: pisoElevador,
      mensaje_adicional: mensajeAdicional,
      tipo_solicitante: tipoSolicitante,
      fuente_consulta: fuenteConsulta,
      presupuesto_estimado: presupuestoEstimado,
      requiere_asesor: requiereAsesor,
      requiere_maniobras: requiereManiobras,
      acepta_privacidad: aceptaPrivacidad,
    })
    .select("folio")
    .single();

  if (error) {
    console.error("Insert lead error:", error);
    return new Response(JSON.stringify({ error: "Error al registrar solicitud" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, folio: data.folio }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
