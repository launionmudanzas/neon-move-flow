import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, User, ArrowRight, CheckCircle2, Loader2, Calendar, Home, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { siteConfig } from '@/lib/site-config';

const TIPOS_SERVICIO = ['Compartida', 'Exclusiva'] as const;
const TIPOS_INMUEBLE = ['Casa', 'Departamento', 'Oficina', 'Bodega', 'Otro'] as const;

function buildWAMessage(folio: string, nombre: string, origen: string, destino: string, tipo: string) {
  const lines = [
    `Hola, quiero cotizar una mudanza.`,
    ``,
    `📋 *Folio:* ${folio}`,
    `👤 *Nombre:* ${nombre}`,
    `📍 *Origen:* ${origen}`,
    `📍 *Destino:* ${destino}`,
    `🚛 *Tipo:* ${tipo}`,
    ``,
    `_${siteConfig.brandName} · ${siteConfig.phone}_`,
  ];
  return encodeURIComponent(lines.join('\n'));
}

export default function LeadFormPublic() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fechaTentativa, setFechaTentativa] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [tipoInmueble, setTipoInmueble] = useState('');
  const [pisoElevador, setPisoElevador] = useState('');
  const [mensajeAdicional, setMensajeAdicional] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [folio, setFolio] = useState('');
  const [error, setError] = useState('');

  const isValid = nombre.trim() && telefono.trim().length >= 10 && origen.trim() && destino.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setLoading(true);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('submit-public-lead', {
        body: {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          origen: origen.trim(),
          destino: destino.trim(),
          fecha_tentativa: fechaTentativa || null,
          tipo_servicio: tipoServicio || null,
          tipo_inmueble: tipoInmueble || null,
          piso_elevador: pisoElevador || null,
          mensaje_adicional: mensajeAdicional.trim() || null,
        },
      });

      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setFolio(data.folio);
      setDone(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const waLink = `https://wa.me/${siteConfig.whatsApp}?text=${buildWAMessage(
    folio || 'pendiente',
    nombre || 'Cliente',
    origen || 'origen',
    destino || 'destino',
    tipoServicio || 'Por definir'
  )}`;

  const inputClass = "w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all";
  const labelClass = "flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

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
          <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
            Cotiza tu mudanza{' '}
            <span className="text-neon-cyan text-glow-cyan">gratis</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Llena el formulario y recibe tu folio. Te contactamos por WhatsApp al instante.
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
              <div className="px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tu folio</p>
                <p className="text-lg font-mono font-bold text-neon-cyan">{folio}</p>
              </div>
              <p className="text-muted-foreground max-w-sm text-sm">
                Tu solicitud fue registrada. Escríbenos por WhatsApp con tu folio para continuar.
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
                Continuar por WhatsApp
              </a>
              <button
                onClick={() => { setDone(false); setNombre(''); setTelefono(''); setOrigen(''); setDestino(''); setFechaTentativa(''); setTipoServicio(''); setTipoInmueble(''); setPisoElevador(''); setMensajeAdicional(''); setFolio(''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Enviar otra cotización
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}><User className="w-3 h-3" /> Nombre</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" maxLength={100} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><Phone className="w-3 h-3" /> Teléfono</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="10 dígitos" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><MapPin className="w-3 h-3 text-neon-cyan" /> Ciudad de origen</label>
                  <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} placeholder="Ej. CDMX" maxLength={80} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><MapPin className="w-3 h-3 text-neon-green" /> Ciudad de destino</label>
                  <input type="text" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ej. Monterrey" maxLength={80} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><Calendar className="w-3 h-3" /> Fecha tentativa</label>
                  <input type="date" value={fechaTentativa} onChange={e => setFechaTentativa(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>🚛 Tipo de servicio</label>
                  <select value={tipoServicio} onChange={e => setTipoServicio(e.target.value)} className={inputClass}>
                    <option value="">Selecciona...</option>
                    {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}><Home className="w-3 h-3" /> Tipo de inmueble</label>
                  <select value={tipoInmueble} onChange={e => setTipoInmueble(e.target.value)} className={inputClass}>
                    <option value="">Selecciona...</option>
                    {TIPOS_INMUEBLE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>🏢 Piso / elevador</label>
                  <input type="text" value={pisoElevador} onChange={e => setPisoElevador(e.target.value)} placeholder="Ej. Piso 3 sin elevador" maxLength={60} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}><MessageSquare className="w-3 h-3" /> Mensaje adicional</label>
                <textarea value={mensajeAdicional} onChange={e => setMensajeAdicional(e.target.value)} placeholder="¿Algo que debamos saber?" maxLength={500} rows={2} className={inputClass + ' resize-none'} />
              </div>

              {error && <p className="text-destructive text-sm font-medium">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-neon-cyan text-background font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    <>👉 Cotizar ahora <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <a
                  href={`https://wa.me/${siteConfig.whatsApp}?text=${encodeURIComponent('Hola, quiero cotizar una mudanza')}`}
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
                Sin compromisos · Respuesta rápida por WhatsApp · {siteConfig.brandName}
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
