import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Zap, HeartHandshake, Map, ShieldCheck, Package, Star } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    color: 'neon-cyan',
    title: 'Respuesta Inmediata',
    desc: 'Cotización en menos de 60 segundos. Sin esperas, sin burocracia. Tu historia comienza hoy.',
  },
  {
    icon: HeartHandshake,
    color: 'neon-blue',
    title: 'Atención Personalizada',
    desc: 'Un asesor dedicado te acompaña en cada paso. Comunicación directa, clara y humana.',
  },
  {
    icon: Map,
    color: 'neon-cyan',
    title: 'Cobertura Nacional',
    desc: 'Red logística activa en los 32 estados de México. Tu mudanza llega a donde sea.',
  },
  {
    icon: ShieldCheck,
    color: 'neon-blue',
    title: 'Servicios Asegurados',
    desc: 'Tus pertenencias protegidas en todo momento. Operamos con responsabilidad real.',
  },
  {
    icon: Package,
    color: 'neon-cyan',
    title: 'Logística Profesional',
    desc: 'Unidades modernas, operadores verificados y procesos controlados de inicio a fin.',
  },
  {
    icon: Star,
    color: 'neon-orange',
    title: 'Calidad Comprobada',
    desc: 'Más de 500 familias y empresas que confiaron en nosotros. Resultados que hablan solos.',
  },
];

const colorMap: Record<string, string> = {
  'neon-cyan': 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10 shadow-glow-cyan',
  'neon-blue': 'text-neon-blue border-neon-blue/30 bg-neon-blue/10 shadow-glow-blue',
  'neon-orange': 'text-neon-orange border-neon-orange/30 bg-neon-orange/10',
};

const cardBorder: Record<string, string> = {
  'neon-cyan': 'hover:border-neon-cyan/50 hover:shadow-glow-cyan',
  'neon-blue': 'hover:border-neon-blue/50 hover:shadow-glow-blue',
  'neon-orange': 'hover:border-neon-orange/50',
};

export default function BenefitsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="beneficios" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/30 to-background" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase mb-4">
            Por qué elegirnos
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Tu mudanza en{' '}
            <span className="text-neon-cyan text-glow-cyan">buenas manos</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Más que un servicio de transporte. Somos el equipo que cuida cada detalle de tu nueva historia.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`glass-card rounded-2xl p-6 group cursor-default border transition-all duration-300 ${cardBorder[b.color]}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 transition-all duration-300 group-hover:scale-110 ${colorMap[b.color]}`}
              >
                <b.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{b.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
