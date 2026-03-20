import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Users, Truck, MessageSquare, ClipboardCheck, CalendarCheck,
  PackageCheck, MapPin, FileSignature, CheckCircle2,
  Shield, Eye, Clock,
} from 'lucide-react';

const processSteps = [
  {
    num: '01',
    icon: Users,
    title: 'Se crea grupo de WhatsApp',
    desc: 'Un asesor abre un grupo privado contigo para coordinar todo el proceso de forma directa y clara.',
    color: 'cyan',
  },
  {
    num: '02',
    icon: ClipboardCheck,
    title: 'Se solicitan datos',
    desc: 'Recopilamos origen, destino, inventario, fechas y todos los detalles del servicio.',
    color: 'blue',
  },
  {
    num: '03',
    icon: FileSignature,
    title: 'Se firma aceptación',
    desc: 'El cliente revisa y acepta la orden de servicio digital con todos los términos acordados.',
    color: 'cyan',
  },
  {
    num: '04',
    icon: MessageSquare,
    title: 'Se realiza anticipo',
    desc: '50% de anticipo confirma el servicio y asegura tu fecha de mudanza.',
    color: 'orange',
  },
  {
    num: '05',
    icon: Truck,
    title: 'Se asigna unidad',
    desc: 'Se designa la unidad adecuada para tu volumen y ruta específica.',
    color: 'blue',
  },
  {
    num: '06',
    icon: PackageCheck,
    title: 'Se realiza recolección',
    desc: 'El equipo se presenta en el origen para cargar con profesionalismo y cuidado.',
    color: 'cyan',
  },
  {
    num: '07',
    icon: MapPin,
    title: 'Seguimiento en ruta',
    desc: 'Te mantenemos informado durante el trayecto. Control total del servicio.',
    color: 'blue',
  },
  {
    num: '08',
    icon: CalendarCheck,
    title: 'Se realiza entrega',
    desc: 'Descarga en destino. Revisión de inventario y verificación de condiciones.',
    color: 'green',
  },
  {
    num: '09',
    icon: CheckCircle2,
    title: 'Se firma conformidad',
    desc: 'Cierre formal del servicio con firma digital de conformidad del cliente.',
    color: 'green',
  },
];

const colorMap: Record<string, { border: string; icon: string; num: string }> = {
  cyan:   { border: 'border-neon-cyan/30 hover:border-neon-cyan/60',   icon: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan',   num: 'text-neon-cyan' },
  blue:   { border: 'border-neon-blue/30 hover:border-neon-blue/60',   icon: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue',   num: 'text-neon-blue' },
  orange: { border: 'border-neon-orange/30 hover:border-neon-orange/60',icon: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange',num: 'text-neon-orange'},
  green:  { border: 'border-neon-green/30 hover:border-neon-green/60', icon: 'bg-neon-green/10 border-neon-green/30 text-neon-green', num: 'text-neon-green' },
};

const trustPhrases = [
  { icon: Shield, text: 'No se descarga sin liquidación del servicio', color: 'text-neon-orange' },
  { icon: FileSignature, text: 'Toda mudanza se valida con orden de servicio', color: 'text-neon-cyan' },
  { icon: Eye, text: 'Cada servicio tiene seguimiento en tiempo real', color: 'text-neon-blue' },
  { icon: Clock, text: 'Tu mercancía viaja bajo condiciones claras y documentadas', color: 'text-neon-green' },
];

export default function ComoFuncionaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="como-funciona" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-background to-surface/20" />
      <div className="absolute left-0 top-1/2 w-[400px] h-[400px] rounded-full bg-neon-cyan/5 blur-[100px] -translate-y-1/2" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase mb-4">
            Proceso real · 9 pasos
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Así funciona{' '}
            <span className="text-neon-cyan text-glow-cyan">La Unión</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Un proceso estructurado, transparente y documentado de principio a fin.
          </p>
        </motion.div>

        {/* 9-step grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {processSteps.map((step, i) => {
            const c = colorMap[step.color];
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className={`glass-card rounded-2xl border p-5 transition-all duration-300 ${c.border}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-display font-black text-xs ${c.num}`}>{step.num}</span>
                      <h3 className="font-display font-bold text-foreground text-sm leading-tight">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust phrases strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {trustPhrases.map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-start gap-3 p-4 rounded-xl bg-surface/60 border border-border">
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} />
              <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
