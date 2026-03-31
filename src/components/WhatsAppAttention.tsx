/**
 * WhatsAppAttention — Smart business-hours widget
 * Shows online/offline status and captures info outside hours
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Clock, CheckCircle2, Send, X, ChevronDown } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';

const SCHEDULE = [
  { day: 1, open: 9, close: 22, label: 'Lunes' },
  { day: 2, open: 9, close: 22, label: 'Martes' },
  { day: 3, open: 9, close: 22, label: 'Miércoles' },
  { day: 4, open: 9, close: 22, label: 'Jueves' },
  { day: 5, open: 9, close: 22, label: 'Viernes' },
  { day: 6, open: 9, close: 19, label: 'Sábado' },
  { day: 0, open: 9, close: 17, label: 'Domingo' },
];

function formatHour(h: number) {
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:00 ${suffix}`;
}

function isOnline(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const sched = SCHEDULE.find(s => s.day === day);
  if (!sched) return false;
  return hour >= sched.open && hour < sched.close;
}

function getNextOpen(): string {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const sched = SCHEDULE.find(s => s.day === day);
  if (sched && hour < sched.open) return `hoy a las ${formatHour(sched.open)}`;
  // Find next day with schedule
  for (let i = 1; i <= 7; i++) {
    const nextDay = (day + i) % 7;
    const nextSched = SCHEDULE.find(s => s.day === nextDay);
    if (nextSched) {
      return `${nextSched.label} a las ${formatHour(nextSched.open)}`;
    }
  }
  return 'pronto';
}

export default function WhatsAppAttention() {
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [showSchedule, setShowSchedule] = useState(false);

  // Offline form state
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setOnline(isOnline()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const waLink = useMemo(() => {
    const text = nombre
      ? `Hola, soy ${nombre}. ${mensaje || 'Quiero cotizar un servicio.'}`
      : 'Hola, quiero cotizar mi mudanza';
    return `https://wa.me/${siteConfig.whatsApp}?text=${encodeURIComponent(text)}`;
  }, [nombre, mensaje]);

  const handleOfflineSend = () => {
    if (!nombre.trim() || !telefono.trim()) return;
    // Open WhatsApp with the message
    const text = [
      `Hola, escribo fuera de horario.`,
      `👤 ${nombre}`,
      `📱 ${telefono}`,
      mensaje ? `💬 ${mensaje}` : '',
      `Quedo al pendiente de su respuesta.`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${siteConfig.whatsApp}?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
  };

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-5 z-50 md:bottom-5 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-neon-green text-background font-bold shadow-glow-green hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background ${online ? 'bg-neon-cyan animate-pulse' : 'bg-neon-orange'}`} />
            </div>
            <span className="text-sm">{online ? 'En línea' : 'Escríbenos'}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-neon-green/30 bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-neon-green/10 border-b border-neon-green/20 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neon-green/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-neon-green" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">LA UNIÓN MUDANZAS</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${online ? 'bg-neon-cyan animate-pulse' : 'bg-neon-orange'}`} />
                    <span className="text-xs text-muted-foreground">
                      {online ? 'En línea · Respuesta inmediata' : `Fuera de horario · Regresamos ${getNextOpen()}`}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {online ? (
                /* ═══ ONLINE MODE ═══ */
                <div className="space-y-4">
                  <div className="bg-neon-green/5 border border-neon-green/15 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-neon-green" />
                      <p className="text-sm font-bold text-foreground">¡Estamos en línea!</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nuestro equipo está listo para atenderte. Escríbenos por WhatsApp y te respondemos al instante.
                    </p>
                  </div>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-neon-green text-background font-bold text-sm hover:shadow-glow-green transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Iniciar conversación
                  </a>

                  <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mx-auto transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    Ver horarios de atención
                    <ChevronDown className={`w-3 h-3 transition-transform ${showSchedule ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showSchedule && <ScheduleTable />}
                  </AnimatePresence>
                </div>
              ) : sent ? (
                /* ═══ OFFLINE - SENT ═══ */
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-neon-green/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-neon-green" />
                  </div>
                  <p className="text-sm font-bold text-foreground">¡Mensaje enviado!</p>
                  <p className="text-xs text-muted-foreground max-w-[260px]">
                    Gracias por escribirnos. Ya recibimos tu solicitud y te responderemos al iniciar atención ({getNextOpen()}).
                  </p>
                  <button onClick={() => { setSent(false); setNombre(''); setTelefono(''); setMensaje(''); }} className="text-xs text-neon-cyan hover:underline">
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                /* ═══ OFFLINE MODE ═══ */
                <div className="space-y-3">
                  <div className="bg-neon-orange/5 border border-neon-orange/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="w-4 h-4 text-neon-orange" />
                      <p className="text-sm font-bold text-foreground">Fuera de horario</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Déjanos tus datos y te contactamos al iniciar atención ({getNextOpen()}).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      maxLength={80}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all"
                    />
                    <input
                      value={telefono}
                      onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="WhatsApp (10 dígitos)"
                      type="tel"
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all"
                    />
                    <textarea
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                      placeholder="¿En qué te podemos ayudar?"
                      maxLength={300}
                      rows={2}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    onClick={handleOfflineSend}
                    disabled={!nombre.trim() || !telefono.trim()}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-neon-green text-background font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-green transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Enviar mensaje
                  </button>

                  <ScheduleTable />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ScheduleTable() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-surface border border-border rounded-xl p-3 space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Horarios de atención</p>
        {SCHEDULE.map(s => (
          <div key={s.day} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="text-foreground font-medium">{formatHour(s.open)} – {formatHour(s.close)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
