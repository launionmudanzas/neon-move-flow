import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Home, Building2, Share2, ArrowRight, Package, Car, Warehouse, Boxes } from 'lucide-react';

const WHATSAPP_NUMBER = '5215512345678';

const servicios = [
  {
    icon: Home,
    title: 'Mudanza Residencial',
    desc: 'Tu hogar merece trato especial. Empacamos, protegemos y trasladamos todo con cuidado profesional.',
    tag: 'Más popular',
    color: 'cyan',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20cotizar%20una%20mudanza%20residencial`,
  },
  {
    icon: Building2,
    title: 'Mudanza de Oficina',
    desc: 'Reubicaciones corporativas sin interrumpir tu operación. Maniobras profesionales y puntualidad total.',
    tag: 'Corporativo',
    color: 'blue',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20cotizar%20una%20mudanza%20de%20oficina`,
  },
  {
    icon: Share2,
    title: 'Servicio Compartido',
    desc: 'Paga solo por el espacio que ocupas. Ideal para pocas cosas o distancias largas con presupuesto ajustado.',
    tag: 'Ahorro',
    color: 'cyan',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20me%20interesa%20el%20servicio%20compartido`,
  },
  {
    icon: ArrowRight,
    title: 'Servicio Directo',
    desc: 'Una unidad exclusiva para ti, sin paradas. Máxima velocidad y control total de tu carga.',
    tag: 'Premium',
    color: 'orange',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20un%20servicio%20directo`,
  },
  {
    icon: Boxes,
    title: 'Paquetería',
    desc: 'Envíos de paquetes y artículos sueltos a cualquier estado. Rapidez y seguridad garantizadas.',
    tag: 'Express',
    color: 'blue',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20quiero%20enviar%20paquetería`,
  },
  {
    icon: Car,
    title: 'Traslado de Vehículos',
    desc: 'Tu auto, camioneta o moto viajan seguros en plataformas especializadas. Sin kilometraje.',
    tag: 'Especializado',
    color: 'cyan',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20trasladar%20un%20vehículo`,
  },
  {
    icon: Warehouse,
    title: 'Almacenaje',
    desc: 'Guarda tus pertenencias en nuestras bodegas seguras mientras coordinamos tu mudanza.',
    tag: 'Adicional',
    color: 'blue',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20información%20sobre%20almacenaje`,
  },
  {
    icon: Package,
    title: 'Artículos de Estética',
    desc: 'Especialistas en traslado de sillones, lavacabezas, camillas y equipos de salón de belleza.',
    tag: 'Especial',
    color: 'orange',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20mover%20artículos%20de%20estética`,
  },
];

const colorVariants: Record<string, string> = {
  cyan: 'border-neon-cyan/20 hover:border-neon-cyan/50 hover:shadow-glow-cyan',
  blue: 'border-neon-blue/20 hover:border-neon-blue/50 hover:shadow-glow-blue',
  orange: 'border-neon-orange/20 hover:border-neon-orange/40',
};
const iconVariants: Record<string, string> = {
  cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
  orange: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
};
const tagVariants: Record<string, string> = {
  cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
  orange: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
};

export default function ServiciosSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="servicios" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 w-[500px] h-[500px] rounded-full bg-neon-blue/5 blur-[100px] -translate-y-1/2" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold tracking-widest uppercase mb-4">
            Nuestros servicios
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Soluciones para{' '}
            <span className="text-neon-blue" style={{ textShadow: '0 0 20px hsl(210,100%,56%/0.6)' }}>
              cada historia
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Residencial, corporativo, vehículos, paquetería y más. Tenemos el servicio exacto que necesitas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {servicios.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={`glass-card rounded-2xl p-5 group border transition-all duration-300 flex flex-col ${colorVariants[s.color]}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconVariants[s.color]} group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tagVariants[s.color]}`}>
                  {s.tag}
                </span>
              </div>
              <h3 className="font-display font-bold text-foreground text-base mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed flex-1">{s.desc}</p>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-neon-cyan hover:gap-3 transition-all duration-200"
              >
                Cotizar ahora <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
