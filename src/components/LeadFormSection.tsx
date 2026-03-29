import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MapPin, Phone, User, ArrowRight, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { siteConfig } from '@/lib/site-config';

function buildWAMessage(nombre: string, origen: string, destino: string) {
  const lines = [
    `Hola, necesito cotización 👋`,
    ``,
    `👤 *Nombre:* ${nombre}`,
    `📍 *Origen:* ${origen}`,
    `📍 *Destino:* ${destino}`,
    ``,
    `_${siteConfig.hashtag} · ${siteConfig.phone}_`,
  ];
  return encodeURIComponent(lines.join('\n'));
}

export default function LeadFormSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const isValid = nombre.trim() && whatsapp.trim().length >= 10 && origen.trim() && destino.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setLoading(true);

    try {
      // Save lead via secure Edge Function
      const { data, error: fnErr } = await supabase.functions.invoke('submit-public-lead', {
        body: {
          nombre: nombre.trim(),
          telefono: whatsapp.trim(),
          origen: origen.trim(),
          destino: destino.trim(),
        },
      });

      if (fnErr) console.warn('Lead save warning:', fnErr.message);
      if (data?.error) console.warn('Lead save warning:', data.error);

      setDone(true);
    } catch (err) {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const waLink = `https://wa.me/${siteConfig.whatsApp}?text=${buildWAMessage(
    nombre || 'Cliente',
    origen || 'origen',
    destino || 'destino'
  )}`;

  return (
    <section id="lead-form" ref={ref} className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/40 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-neon-cyan/5 blur-[80px]" />

      <div className="relative container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange text-xs font-bold tracking-widest uppercase mb-4">
            <AlertTriangle className="w-3 h-3" />
            Espacios limitados esta semana
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
            ¿A dónde te mudas?{' '}
            <span className="text-neon-cyan text-glow-cyan">Cuéntanos</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Déjanos tus datos y recibe un precio estimado en segundos — sin compromisos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-card rounded-2xl border border-neon-cyan/20 p-6 md:p-8 shadow-glow-cyan"
        >
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-neon-green" />
              </div>
              <h3 className="font-display text-2xl font-black text-foreground">¡Gracias, {nombre}!</h3>
              <p className="text-muted-foreground max-w-sm">
                Recibimos tu solicitud. Un asesor te contactará pronto por WhatsApp al <strong className="text-foreground">{whatsapp}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                También puedes escribirnos directamente ahora mismo:
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-green text-background font-bold hover:shadow-glow-green transition-all duration-300 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Escribir por WhatsApp ahora
              </a>
              <button
                onClick={() => { setDone(false); setNombre(''); setWhatsapp(''); setOrigen(''); setDestino(''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Enviar otra consulta
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <User className="w-3 h-3" /> Nombre
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    maxLength={100}
                    required
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <Phone className="w-3 h-3" /> WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="10 dígitos"
                    required
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all"
                  />
                </div>

                {/* Origen */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3 h-3 text-neon-cyan" /> Ciudad de origen
                  </label>
                  <input
                    type="text"
                    value={origen}
                    onChange={e => setOrigen(e.target.value)}
                    placeholder="Ej. Ciudad de México"
                    maxLength={80}
                    required
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all"
                  />
                </div>

                {/* Destino */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3 h-3 text-neon-green" /> Ciudad de destino
                  </label>
                  <input
                    type="text"
                    value={destino}
                    onChange={e => setDestino(e.target.value)}
                    placeholder="Ej. Monterrey"
                    maxLength={80}
                    required
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm font-medium">{error}</p>
              )}

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-neon-cyan text-background font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    <>👉 Ver precio estimado <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-neon-green/40 text-neon-green font-bold text-sm hover:bg-neon-green/10 hover:border-neon-green hover:shadow-glow-green transition-all duration-300"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  O escríbenos directo
                </a>
              </div>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Sin compromisos · Respuesta en minutos · ⚠️ Salimos todas las semanas
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
