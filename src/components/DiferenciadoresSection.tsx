import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ShieldCheck, UserCheck, Eye, CircleOff } from 'lucide-react';

const items = [
  {
    icon: ShieldCheck,
    title: 'Control total del servicio',
    desc: 'Seguimiento en tiempo real, confirmación en cada etapa y comunicación directa con tu asesor. Tu mudanza siempre bajo control.',
    color: 'cyan',
    num: '01',
  },
  {
    icon: UserCheck,
    title: 'Proveedores verificados',
    desc: 'Solo trabajamos con operadores certificados, con unidades en buen estado y antecedentes comprobados.',
    color: 'blue',
    num: '02',
  },
  {
    icon: Eye,
    title: 'Evidencia en tiempo real',
    desc: 'Fotos, actualizaciones y confirmaciones durante el proceso. Transparencia total, sin sorpresas.',
    color: 'cyan',
    num: '03',
  },
  {
    icon: CircleOff,
    title: 'Sin intermediarios ocultos',
    desc: 'Trato directo, precio claro desde el inicio. Lo que cotizas es lo que pagas. Sin cargos ocultos.',
    color: 'orange',
    num: '04',
  },
];

const colors: Record<string, string> = {
  cyan: 'from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/30 text-neon-cyan',
  blue: 'from-neon-blue/20 to-neon-blue/5 border-neon-blue/30 text-neon-blue',
  orange: 'from-neon-orange/20 to-neon-orange/5 border-neon-orange/30 text-neon-orange',
};

export default function DiferenciadoresSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="diferenciadores" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-surface/20" />
      <div className="absolute right-0 top-0 w-[600px] h-[600px] rounded-full bg-neon-cyan/4 blur-[120px]" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange text-xs font-bold tracking-widest uppercase mb-4">
            Diferenciadores
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Lo que nos hace{' '}
            <span className="text-neon-orange" style={{ textShadow: '0 0 20px hsl(24,100%,50%/0.5)' }}>
              diferentes
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No somos una empresa más. Somos el equipo que entiende que detrás de cada mudanza hay una historia que merece cuidado.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative glass-card rounded-2xl p-7 border bg-gradient-to-br ${colors[item.color]} border-opacity-30 hover:scale-[1.01] transition-all duration-300`}
            >
              <div className="flex items-start gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border bg-gradient-to-br flex-shrink-0 ${colors[item.color]} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div>
                  <div className={`text-xs font-black opacity-30 mb-1 font-display ${colors[item.color]}`}>{item.num}</div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
