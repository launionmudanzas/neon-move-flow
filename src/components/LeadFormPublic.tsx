/**
 * LeadFormPublic — Unified quotation flow with service selector + calendar
 * Single entry point for all client-facing quotation requests.
 */
import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MapPin, Phone, User, ArrowRight, CheckCircle2, Loader2,
  CalendarIcon, Home, MessageSquare, DollarSign, Package, ChevronRight,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { siteConfig } from '@/lib/site-config';
import { TIPOS_INMUEBLE, TIPOS_CARGA } from '@/lib/lead-form-constants';
import { buildLeadWALink, isLeadFormValid } from '@/lib/lead-form-utils';
import ServiceSelector, { SERVICES } from '@/components/ServiceSelector';

const inputClass =
  'w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all';
const labelClass =
  'flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5';

export default function LeadFormPublic() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  // Step: 'select' (service) → 'form' (details)
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedService, setSelectedService] = useState('');

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fechaTentativa, setFechaTentativa] = useState<Date>();
  const [tipoInmueble, setTipoInmueble] = useState('');
  const [tipoCarga, setTipoCarga] = useState('');
  const [pisoElevador, setPisoElevador] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [requiereAsesor, setRequiereAsesor] = useState(false);
  const [requiereManiobras, setRequiereManiobras] = useState(false);
  const [mensajeAdicional, setMensajeAdicional] = useState('');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [folio, setFolio] = useState('');
  const [error, setError] = useState('');

  const isValid = isLeadFormValid({ nombre, telefono, origen, destino, aceptaPrivacidad });

  const handleServiceSelect = (id: string) => {
    setSelectedService(id);
  };

  const goToForm = () => {
    if (selectedService) setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setLoading(true);

    const serviceLabel = SERVICES.find(s => s.id === selectedService)?.label || selectedService;

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('submit-public-lead', {
        body: {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          origen: origen.trim(),
          destino: destino.trim(),
          fecha_tentativa: fechaTentativa ? format(fechaTentativa, 'yyyy-MM-dd') : null,
          tipo_servicio: serviceLabel,
          tipo_inmueble: tipoInmueble || null,
          tipo_carga: tipoCarga || null,
          piso_elevador: pisoElevador || null,
          presupuesto_estimado: presupuesto ? Number(presupuesto) : null,
          requiere_asesor: requiereAsesor,
          requiere_maniobras: requiereManiobras,
          mensaje_adicional: mensajeAdicional.trim() || null,
          acepta_privacidad: aceptaPrivacidad,
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

  const waLink = buildLeadWALink({
    folio: folio || undefined,
    nombre: nombre || 'Cliente',
    origen: origen || 'origen',
    destino: destino || 'destino',
    tipoServicio: SERVICES.find(s => s.id === selectedService)?.label || undefined,
  });

  const resetForm = () => {
    setDone(false); setStep('select'); setSelectedService('');
    setNombre(''); setTelefono(''); setOrigen(''); setDestino('');
    setFechaTentativa(undefined); setTipoInmueble('');
    setTipoCarga(''); setPisoElevador(''); setPresupuesto('');
    setRequiereAsesor(false); setRequiereManiobras(false);
    setMensajeAdicional(''); setAceptaPrivacidad(false); setFolio('');
  };

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
            {step === 'select' ? (
              <>¿Qué servicio deseas <span className="text-neon-cyan text-glow-cyan">cotizar</span>?</>
            ) : (
              <>Cuéntanos tu <span className="text-neon-cyan text-glow-cyan">servicio</span></>
            )}
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            {step === 'select'
              ? 'Selecciona una opción para mostrarte la cotización adecuada.'
              : `${SERVICES.find(s => s.id === selectedService)?.label || 'Servicio'} · Llena los datos y te contactamos.`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-card rounded-2xl border border-neon-cyan/20 p-6 md:p-8 shadow-glow-cyan"
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <SuccessView nombre={nombre} folio={folio} waLink={waLink} onReset={resetForm} />
              </motion.div>
            ) : step === 'select' ? (
              <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ServiceSelector selected={selectedService} onSelect={handleServiceSelect} />
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={goToForm}
                    disabled={!selectedService}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-neon-cyan text-background font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Continuar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {/* Back button */}
                <button
                  onClick={() => setStep('select')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors"
                >
                  ← Cambiar servicio
                </button>

                {/* Selected service badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold mb-5">
                  {SERVICES.find(s => s.id === selectedService)?.icon}
                  {SERVICES.find(s => s.id === selectedService)?.label}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Required fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}><User className="w-3 h-3" /> Nombre *</label>
                      <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" maxLength={100} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}><Phone className="w-3 h-3" /> Teléfono *</label>
                      <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="10 dígitos" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}><MapPin className="w-3 h-3 text-neon-cyan" /> Ciudad de origen *</label>
                      <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} placeholder="Ej. Ciudad de México" maxLength={80} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}><MapPin className="w-3 h-3 text-neon-green" /> Ciudad de destino *</label>
                      <input type="text" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ej. Monterrey" maxLength={80} required className={inputClass} />
                    </div>
                  </div>

                  {/* Date with calendar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}><CalendarIcon className="w-3 h-3" /> Fecha tentativa</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal rounded-xl h-12 bg-surface border-border',
                              !fechaTentativa && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaTentativa ? format(fechaTentativa, 'PPP', { locale: es }) : 'Selecciona fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fechaTentativa}
                            onSelect={setFechaTentativa}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn('p-3 pointer-events-auto')}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className={labelClass}><Home className="w-3 h-3" /> Tipo de inmueble</label>
                      <select value={tipoInmueble} onChange={e => setTipoInmueble(e.target.value)} className={inputClass}>
                        <option value="">Selecciona...</option>
                        {TIPOS_INMUEBLE.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Conditional fields based on service */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!['vehiculos', 'paqueteria', 'almacenaje'].includes(selectedService) && (
                      <div>
                        <label className={labelClass}><Package className="w-3 h-3" /> Tipo de carga</label>
                        <select value={tipoCarga} onChange={e => setTipoCarga(e.target.value)} className={inputClass}>
                          <option value="">Selecciona...</option>
                          {TIPOS_CARGA.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>🏢 Piso / elevador</label>
                      <input type="text" value={pisoElevador} onChange={e => setPisoElevador(e.target.value)} placeholder="Ej. Piso 3 sin elevador" maxLength={60} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}><DollarSign className="w-3 h-3" /> Presupuesto estimado</label>
                      <input type="number" value={presupuesto} onChange={e => setPresupuesto(e.target.value)} placeholder="Ej. 15000" min={0} max={500000} className={inputClass} />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={requiereAsesor} onChange={e => setRequiereAsesor(e.target.checked)} className="accent-neon-cyan w-4 h-4" />
                      Necesito asesoría personalizada
                    </label>
                    {!['paqueteria', 'almacenaje'].includes(selectedService) && (
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={requiereManiobras} onChange={e => setRequiereManiobras(e.target.checked)} className="accent-neon-cyan w-4 h-4" />
                        Requiere maniobras especiales
                      </label>
                    )}
                  </div>

                  {/* Comments */}
                  <div>
                    <label className={labelClass}><MessageSquare className="w-3 h-3" /> Comentarios adicionales</label>
                    <textarea value={mensajeAdicional} onChange={e => setMensajeAdicional(e.target.value)} placeholder="¿Algo que debamos saber? (aduanas, ferry, grúas, objetos frágiles...)" maxLength={500} rows={2} className={inputClass + ' resize-none'} />
                  </div>

                  {/* Privacy */}
                  <div className="border border-border/50 rounded-xl p-3 bg-surface/50">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aceptaPrivacidad}
                        onChange={e => setAceptaPrivacidad(e.target.checked)}
                        className="accent-neon-cyan w-4 h-4 mt-0.5 shrink-0"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        Acepto el{' '}
                        <a href={siteConfig.privacyUrl} target="_blank" rel="noopener noreferrer" className="text-neon-cyan underline hover:text-neon-cyan/80">
                          Aviso de Privacidad
                        </a>{' '}
                        y los{' '}
                        <a href={siteConfig.termsUrl} target="_blank" rel="noopener noreferrer" className="text-neon-cyan underline hover:text-neon-cyan/80">
                          Términos y Condiciones
                        </a>{' '}
                        de {siteConfig.brandName}. Autorizo el contacto vía WhatsApp y/o llamada telefónica.
                      </span>
                    </label>
                  </div>

                  {error && <p className="text-destructive text-sm font-medium">{error}</p>}

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!isValid || loading}
                      className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-neon-cyan text-background font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      ) : (
                        <>👉 Solicitar cotización <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/${siteConfig.whatsApp}?text=${encodeURIComponent('Hola, quiero cotizar una mudanza')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-neon-green/40 text-neon-green font-bold text-sm hover:bg-neon-green/10 hover:border-neon-green hover:shadow-glow-green transition-all duration-300"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      O escríbenos directo
                    </a>
                  </div>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Sin compromisos · Respuesta rápida por WhatsApp · {siteConfig.brandName}
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Sub-components ---------- */

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function SuccessView({ nombre, folio, waLink, onReset }: {
  nombre: string;
  folio: string;
  waLink: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
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
        <WhatsAppIcon className="w-5 h-5" />
        Continuar por WhatsApp
      </a>
      <button onClick={onReset} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors">
        Enviar otra cotización
      </button>
    </div>
  );
}
