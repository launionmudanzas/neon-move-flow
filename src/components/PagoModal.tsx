import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Building2, CheckCircle2, AlertTriangle, Copy, Check, Loader2, Download } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { sendServiceEmail } from '@/lib/email-service';
import { generateAndSaveOrden, type OrdenPDFData } from '@/lib/pdf-orden-service';
import OrdenGeneradaModal from '@/components/OrdenGeneradaModal';

const stripePromise = loadStripe('pk_live_51SiBhiQ3g3KekYqfcy0gdKzvjqgX8XaPcouSARuyGA1ABjEqJwpZ7Yfxl3zZXZaNBnRycpJTrFaOqVBoY779lNZw00JY4R1b7K');

const SPEI_DATA = {
  banco: 'BBVA México',
  clabe: '012 320 0123456789 01',
  titular: 'LA UNION MUDANZAS SA DE CV',
  concepto: 'Folio del servicio',
};

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPagoExitoso?: (tipo: string) => void;
  data: {
    folio: string;
    nombre: string;
    monto: number;
    origen: string;
    destino: string;
    serviceLabel?: string;
    cotizacionId?: string;
  };
}

// ─── Stripe Checkout Form ──────────────────────────────────────────────────
function StripeCheckoutForm({
  clientSecret,
  monto,
  folio,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  monto: number;
  folio: string;
  onSuccess: (tipo: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message || 'Error al procesar el pago');
      setLoading(false);
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}?pago=exitoso&folio=${folio}`,
      },
      redirect: 'if_required',
    });

    if (confirmErr) {
      setError(confirmErr.message || 'Error al confirmar el pago');
      setLoading(false);
    } else {
      onSuccess('tarjeta');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-xl bg-surface border border-border">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: { billingDetails: { name: '' } },
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-black text-sm disabled:opacity-50 hover:shadow-glow-cyan transition-all"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Procesando…</>
          ) : (
            <>Pagar ${(monto / 100).toLocaleString('es-MX')} MXN</>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── SPEI Info Panel ───────────────────────────────────────────────────────
function SpeiPanel({ folio, monto }: { folio: string; monto: number }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ value, id }: { value: string; id: string }) => (
    <button
      onClick={() => copy(value, id)}
      className="ml-auto p-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
    >
      {copied === id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
        <p className="text-xs font-bold text-neon-blue mb-3 flex items-center gap-1.5">
          <Building2 className="w-4 h-4" />
          Datos para transferencia SPEI
        </p>
        {[
          { label: 'Banco', value: SPEI_DATA.banco, id: 'banco' },
          { label: 'CLABE', value: SPEI_DATA.clabe, id: 'clabe' },
          { label: 'Titular', value: SPEI_DATA.titular, id: 'titular' },
          { label: 'Concepto', value: `${SPEI_DATA.concepto}: ${folio}`, id: 'concepto' },
        ].map(({ label, value, id }) => (
          <div key={id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
              <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
            <CopyBtn value={value} id={id} />
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 text-xs text-muted-foreground">
        <p className="font-bold text-neon-orange mb-1">⚠️ Importante</p>
        <p>Envía el <strong className="text-foreground">comprobante de pago</strong> por WhatsApp con tu folio <strong className="text-neon-cyan">{folio}</strong> para confirmar el servicio.</p>
      </div>

      <div className="p-3 rounded-xl bg-neon-green/5 border border-neon-green/20 text-xs text-center">
        <p className="text-muted-foreground">Monto a transferir:</p>
        <p className="font-black text-2xl text-neon-green">${(monto).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN</p>
        <p className="text-muted-foreground mt-0.5">Anticipo 50% del servicio</p>
      </div>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────
export default function PagoModal({ isOpen, onClose, onPagoExitoso, data }: PagoModalProps) {
  const [tab, setTab] = useState<'tarjeta' | 'spei'>('tarjeta');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingPI, setLoadingPI] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);
  const [exitoso, setExitoso] = useState(false);

  const montoAnticipo = Math.ceil(data.monto * 0.5);

  const initStripe = async () => {
    if (clientSecret) return;
    setLoadingPI(true);
    setPiError(null);
    try {
      const { data: fnData, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: montoAnticipo,
          folio: data.folio,
          nombre: data.nombre,
          descripcion: `Anticipo 50% - ${data.origen} → ${data.destino}`,
          tipo: 'anticipo',
        },
      });
      if (error) throw error;
      setClientSecret(fnData.clientSecret);
    } catch (err) {
      setPiError('No se pudo iniciar el pago. Usa transferencia SPEI.');
    } finally {
      setLoadingPI(false);
    }
  };

  const handleTabChange = (t: 'tarjeta' | 'spei') => {
    setTab(t);
    if (t === 'tarjeta') initStripe();
  };

  // Init stripe on open
  if (isOpen && !clientSecret && !loadingPI && !piError && tab === 'tarjeta') {
    initStripe();
  }

  // After successful payment: update cotizacion status + send email
  const handlePaymentSuccess = async (tipoPago: string) => {
    // Update cotizacion to confirmado
    if (data.cotizacionId) {
      await supabase.from('cotizaciones')
        .update({ estatus: 'confirmado', cliente_acepto: true })
        .eq('id', data.cotizacionId);
      // Update calendar event to confirmado
      await supabase.from('eventos_calendario')
        .update({ estatus: 'confirmado', color: '#22c55e' })
        .eq('cotizacion_id', data.cotizacionId);
    }
    // Fire email — confirmacion_pago (non-blocking)
    void sendServiceEmail({
      type: 'confirmacion_pago',
      folio: data.folio,
      customer_name: data.nombre,
      route: `${data.origen} → ${data.destino}`,
      service_type: data.serviceLabel ?? 'Mudanza',
      amount: data.monto,
    });
    setExitoso(true);
  };

  if (!isOpen) return null;

  if (exitoso) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative glass-card rounded-3xl border border-neon-green/40 p-10 text-center max-w-sm w-full shadow-glow-green"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-neon-green/10 border-2 border-neon-green flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle2 className="w-10 h-10 text-neon-green" />
          </motion.div>
          <h3 className="font-display font-black text-2xl text-foreground mb-2">¡Pago exitoso!</h3>
          <p className="text-muted-foreground text-sm mb-1">Folio: <span className="text-neon-cyan font-mono font-bold">{data.folio}</span></p>
          <p className="text-xs text-muted-foreground mb-6">Recibirás confirmación por WhatsApp</p>
          <button
            onClick={() => { setExitoso(false); onPagoExitoso?.('tarjeta'); onClose(); }}
            className="w-full py-3.5 rounded-xl bg-neon-green text-background font-black hover:shadow-glow-green transition-all"
          >
            Continuar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="relative w-full sm:max-w-md max-h-[95vh] overflow-y-auto glass-card rounded-t-3xl sm:rounded-2xl border border-neon-cyan/20 shadow-glow-cyan"
        >
          <div className="h-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-cyan" />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-black text-xl text-foreground">Anticipo del servicio</h2>
                <p className="text-xs text-neon-cyan font-mono">{data.folio}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen */}
            <div className="p-4 rounded-xl bg-surface border border-border mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Ruta</span>
                <span className="text-xs font-bold text-foreground">{data.origen} → {data.destino}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Monto total</span>
                <span className="text-xs font-bold text-foreground">${data.monto.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="neon-line my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Anticipo 50%</span>
                <span className="font-black text-xl text-neon-cyan">${montoAnticipo.toLocaleString('es-MX')} MXN</span>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-muted/30 rounded-xl p-1 mb-5 gap-1">
              {([
                { id: 'tarjeta', label: '💳 Tarjeta', icon: CreditCard },
                { id: 'spei', label: '🏦 Transferencia SPEI', icon: Building2 },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    tab === t.id
                      ? 'bg-primary text-primary-foreground shadow-glow-cyan'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'tarjeta' && (
              <div>
                {loadingPI && (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando pago seguro…
                  </div>
                )}
                {piError && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive mb-4">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {piError}
                  </div>
                )}
                {clientSecret && !loadingPI && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#00f5ff',
                          colorBackground: '#0b1f3a',
                          colorText: '#f0f8ff',
                          colorDanger: '#ef4444',
                          fontFamily: 'Inter, sans-serif',
                          borderRadius: '12px',
                        },
                      },
                    }}
                  >
                  <StripeCheckoutForm
                      clientSecret={clientSecret}
                      monto={montoAnticipo * 100}
                      folio={data.folio}
                      onSuccess={(tipo) => handlePaymentSuccess(tipo)}
                      onCancel={onClose}
                    />
                  </Elements>
                )}
              </div>
            )}

            {tab === 'spei' && (
              <SpeiPanel folio={data.folio} monto={montoAnticipo} />
            )}

            <p className="text-[10px] text-muted-foreground text-center mt-4">
              🔒 Pagos seguros · SSL · La Unión Mudanzas SA de CV
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
