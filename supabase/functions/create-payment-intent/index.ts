/**
 * create-payment-intent — La Unión Mudanzas
 * Hardened payment endpoint with input validation.
 */
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/* ---------- helpers ---------- */

function sanitize(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim().slice(0, maxLen);
}

/* ---------- rate-limit (per IP, in-memory) ---------- */
const ipBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;

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

/* ---------- valid payment types ---------- */
const VALID_TIPOS = ['anticipo', 'carga', 'final', 'completo'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Rate limit
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown';

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Demasiadas solicitudes. Intenta en un momento.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Authenticate caller ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o sesión expirada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Parse & validate body ---
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'JSON inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = typeof body.amount === 'number' ? body.amount : 0;
    const currency = sanitize(body.currency, 5) || 'mxn';
    const folio = sanitize(body.folio, 30);
    const nombre = sanitize(body.nombre, 100);
    const descripcion = sanitize(body.descripcion, 200);
    const tipo = sanitize(body.tipo, 20);

    // Validate amount (min $10 MXN)
    if (!amount || amount < 10 || amount > 500000) {
      return new Response(
        JSON.stringify({ error: 'Monto inválido. Debe ser entre $10 y $500,000 MXN.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate folio exists
    if (!folio) {
      return new Response(
        JSON.stringify({ error: 'Folio requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tipo
    if (tipo && !VALID_TIPOS.includes(tipo as any)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de pago inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency,
      metadata: {
        folio,
        cliente: nombre || 'cliente',
        tipo: tipo || 'anticipo',
        descripcion: descripcion || 'Servicio La Unión Mudanzas',
        user_id: user.id,
      },
      description: `${tipo === 'completo' ? 'Pago completo' : 'Anticipo'} - ${folio} - La Unión Mudanzas`,
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('Error creating payment intent:', err);
    return new Response(
      JSON.stringify({ error: 'Error al procesar el pago' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
