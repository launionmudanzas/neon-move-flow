/**
 * VisitaOcularSection — Module for scheduling virtual & physical inspections
 */
import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Video, MapPin, CalendarIcon, Clock, Upload, Camera,
  Mic, AlertTriangle, CheckCircle2, ChevronRight, Info,
  Phone, User, DollarSign, Eye,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/site-config';

const PROPOSITOS = [
  { id: 'cotizacion', label: 'Cotización sencilla', icon: '📦' },
  { id: 'empaque', label: 'Empaque especial', icon: '📋' },
  { id: 'pieza_especial', label: 'Pieza especial', icon: '🎨' },
  { id: 'volado', label: 'Volado (subir/bajar por ventana)', icon: '🏗️' },
] as const;

const HORARIOS = [
  '09:00 - 11:00',
  '11:00 - 13:00',
  '13:00 - 15:00',
  '15:00 - 17:00',
  '17:00 - 19:00',
];

const inputClass =
  'w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/60 transition-all';

export default function VisitaOcularSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const [tipo, setTipo] = useState<'virtual' | 'fisica' | ''>('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [proposito, setProposito] = useState('');
  const [fecha, setFecha] = useState<Date>();
  const [horario, setHorario] = useState('');
  const [flexible, setFlexible] = useState(false);
  const [rangoHoras, setRangoHoras] = useState('');
  const [direccion, setDireccion] = useState('');
  const [googleMaps, setGoogleMaps] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);
  const [audios, setAudios] = useState<File[]>([]);
  const [sent, setSent] = useState(false);

  const isValid = nombre.trim() && telefono.trim().length >= 10 && ciudad.trim() && tipo && proposito && fecha;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'foto' | 'audio') => {
    const files = Array.from(e.target.files || []);
    if (type === 'foto') setFotos(prev => [...prev, ...files].slice(0, 10));
    else setAudios(prev => [...prev, ...files].slice(0, 3));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    const lines = [
      `Hola, quiero agendar una visita ocular 📸`,
      ``,
      `👤 *Nombre:* ${nombre}`,
      `📱 *Teléfono:* ${telefono}`,
      `📍 *Ciudad:* ${ciudad}`,
      `🔍 *Tipo:* ${tipo === 'virtual' ? 'Virtual' : 'Física ($500 reembolsables)'}`,
      `📋 *Propósito:* ${PROPOSITOS.find(p => p.id === proposito)?.label || proposito}`,
      fecha ? `📅 *Fecha:* ${format(fecha, 'PPP', { locale: es })}` : '',
      horario ? `⏰ *Horario:* ${horario}` : '',
      flexible ? `🔄 *Horario flexible:* Sí${rangoHoras ? ` (${rangoHoras})` : ''}` : '',
      tipo === 'fisica' && direccion ? `🏠 *Dirección:* ${direccion}` : '',
      tipo === 'fisica' && googleMaps ? `📍 *Maps:* ${googleMaps}` : '',
      fotos.length > 0 ? `📷 *Fotos adjuntas:* ${fotos.length}` : '',
      audios.length > 0 ? `🎤 *Audios adjuntos:* ${audios.length}` : '',
      ``,
      `_${siteConfig.brandName} · Visita ocular_`,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${siteConfig.whatsApp}?text=${encodeURIComponent(lines)}`, '_blank');
    setSent(true);
  };

  return (
    <section id="visita-ocular" ref={ref} className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/30 to-background" />

      <div className="relative container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold tracking-widest uppercase mb-4">
            <Eye className="w-3.5 h-3.5" />
            Visita Ocular
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
            Agenda tu{' '}
            <span className="text-neon-cyan text-glow-cyan">inspección</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Validamos tu carga antes del servicio. Elige entre visita virtual o física.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-card rounded-2xl border border-neon-cyan/20 p-6 md:p-8"
        >
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-neon-green" />
              </div>
              <h3 className="font-display text-2xl font-black text-foreground">¡Solicitud enviada!</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Te contactaremos para confirmar tu visita. Si tienes fotos o audios, envíalos en la conversación de WhatsApp.
              </p>
              <button onClick={() => setSent(false)} className="text-xs text-neon-cyan hover:underline">
                Agendar otra visita
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Type selection */}
              <div>
                <p className="text-sm font-bold text-foreground mb-3">¿Qué tipo de visita necesitas?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTipo('virtual')}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all ${
                      tipo === 'virtual'
                        ? 'bg-neon-cyan/10 border-neon-cyan/50'
                        : 'bg-surface border-border hover:border-neon-cyan/30'
                    }`}
                  >
                    <Video className={`w-8 h-8 ${tipo === 'virtual' ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-bold ${tipo === 'virtual' ? 'text-neon-cyan' : 'text-foreground'}`}>Virtual</span>
                    <span className="text-[10px] text-muted-foreground text-center">Videollamada o fotos</span>
                    <span className="text-xs text-neon-green font-bold">Gratis</span>
                  </button>
                  <button
                    onClick={() => setTipo('fisica')}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all ${
                      tipo === 'fisica'
                        ? 'bg-neon-orange/10 border-neon-orange/50'
                        : 'bg-surface border-border hover:border-neon-orange/30'
                    }`}
                  >
                    <MapPin className={`w-8 h-8 ${tipo === 'fisica' ? 'text-neon-orange' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-bold ${tipo === 'fisica' ? 'text-neon-orange' : 'text-foreground'}`}>Física</span>
                    <span className="text-[10px] text-muted-foreground text-center">Visitamos tu domicilio</span>
                    <span className="text-xs text-neon-orange font-bold">$500 MXN*</span>
                  </button>
                </div>
              </div>

              {tipo === 'fisica' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-neon-orange/5 border border-neon-orange/20">
                  <DollarSign className="w-4 h-4 text-neon-orange flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    La visita física tiene un costo de <strong className="text-neon-orange">$500 MXN</strong>, reembolsables si contrata el servicio con nosotros.
                  </p>
                </div>
              )}

              <AnimatePresence>
                {tipo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    {/* Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          <User className="w-3 h-3" /> Nombre *
                        </label>
                        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" maxLength={80} className={inputClass} />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          <Phone className="w-3 h-3" /> Teléfono *
                        </label>
                        <input value={telefono} onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="10 dígitos" type="tel" className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          <MapPin className="w-3 h-3" /> Ciudad *
                        </label>
                        <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ej. Ciudad de México" maxLength={80} className={inputClass} />
                      </div>
                    </div>

                    {/* Purpose */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Propósito de la visita *</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PROPOSITOS.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setProposito(p.id)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all text-sm ${
                              proposito === p.id
                                ? 'bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan font-bold'
                                : 'bg-surface border-border text-foreground hover:border-neon-cyan/20'
                            }`}
                          >
                            <span>{p.icon}</span>
                            <span className="text-xs">{p.label}</span>
                          </button>
                        ))}
                      </div>
                      {proposito === 'volado' && (
                        <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
                          <Info className="w-4 h-4 text-neon-blue flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Los volados normalmente se revisan primero por <strong className="text-foreground">visita virtual</strong> (fotos + video del espacio y la pieza). Si se requiere presencia física, se agenda después.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Date picker */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        <CalendarIcon className="w-3 h-3 inline mr-1" /> Fecha preferida *
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal rounded-xl h-12 bg-surface border-border',
                              !fecha && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fecha ? format(fecha, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fecha}
                            onSelect={setFecha}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn('p-3 pointer-events-auto')}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time slot */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        <Clock className="w-3 h-3 inline mr-1" /> Horario preferido
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {HORARIOS.map(h => (
                          <button
                            key={h}
                            onClick={() => setHorario(h)}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              horario === h
                                ? 'bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan'
                                : 'bg-surface border-border text-muted-foreground hover:border-neon-cyan/20'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 mt-3 text-sm text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={flexible} onChange={e => setFlexible(e.target.checked)} className="accent-neon-cyan w-4 h-4" />
                        Tengo flexibilidad horaria
                      </label>
                      {flexible && (
                        <input
                          value={rangoHoras}
                          onChange={e => setRangoHoras(e.target.value)}
                          placeholder="Ej. Entre 10am y 4pm"
                          maxLength={60}
                          className={cn(inputClass, 'mt-2')}
                        />
                      )}
                    </div>

                    {/* Address (physical only) */}
                    {tipo === 'fisica' && (
                      <div className="space-y-3">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            <MapPin className="w-3 h-3" /> Dirección completa
                          </label>
                          <textarea
                            value={direccion}
                            onChange={e => setDireccion(e.target.value)}
                            placeholder="Calle, número ext., número int., colonia, alcaldía/municipio, ciudad, estado, C.P."
                            maxLength={300}
                            rows={2}
                            className={cn(inputClass, 'resize-none')}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Escribe la dirección completa para que Google Maps la reconozca correctamente.
                          </p>
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            📍 Enlace de Google Maps
                          </label>
                          <input
                            value={googleMaps}
                            onChange={e => setGoogleMaps(e.target.value)}
                            placeholder="https://maps.google.com/..."
                            maxLength={300}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}

                    {/* File uploads */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Archivos de apoyo</p>
                      <p className="text-[10px] text-muted-foreground -mt-2">
                        Sube fotos de la fachada, accesos, piezas especiales o graba un audio explicando detalles.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border hover:border-neon-cyan/30 cursor-pointer transition-all bg-surface">
                          <Camera className="w-6 h-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Fotos</span>
                          <span className="text-[10px] text-muted-foreground/60">{fotos.length}/10 archivos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={e => handleFileUpload(e, 'foto')}
                            className="hidden"
                          />
                        </label>
                        <label className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border hover:border-neon-cyan/30 cursor-pointer transition-all bg-surface">
                          <Mic className="w-6 h-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Audios</span>
                          <span className="text-[10px] text-muted-foreground/60">{audios.length}/3 archivos</span>
                          <input
                            type="file"
                            accept="audio/*"
                            multiple
                            onChange={e => handleFileUpload(e, 'audio')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {(fotos.length > 0 || audios.length > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {fotos.map((f, i) => (
                            <span key={`f${i}`} className="text-[10px] px-2 py-1 rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                              📷 {f.name.slice(0, 20)}
                            </span>
                          ))}
                          {audios.map((f, i) => (
                            <span key={`a${i}`} className="text-[10px] px-2 py-1 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
                              🎤 {f.name.slice(0, 20)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid}
                      className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-neon-cyan text-background font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CalendarIcon className="w-5 h-5" />
                      Agendar visita por WhatsApp
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <p className="text-center text-[10px] text-muted-foreground">
                      Al enviar, se abrirá WhatsApp con tus datos. Envía fotos y audios directamente en la conversación.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
