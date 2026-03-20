import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import gallery1 from '@/assets/gallery-1.jpg';
import gallery2 from '@/assets/gallery-2.jpg';
import gallery3 from '@/assets/gallery-3.jpg';
import truckHero from '@/assets/truck-hero.jpg';

const images = [
  { src: gallery1, alt: 'Empaque profesional de muebles', label: 'Empaque Profesional', span: 'lg:col-span-1 lg:row-span-2' },
  { src: truckHero, alt: 'Unidades de transporte La Unión', label: 'Unidades Modernas', span: 'lg:col-span-2' },
  { src: gallery2, alt: 'Carga segura de camión', label: 'Carga Segura', span: 'lg:col-span-1' },
  { src: gallery3, alt: 'Traslado de vehículos', label: 'Traslado de Vehículos', span: 'lg:col-span-1' },
];

export default function GaleriaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="galeria" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute left-0 bottom-0 w-[500px] h-[500px] rounded-full bg-neon-blue/5 blur-[100px]" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold tracking-widest uppercase mb-4">
            En acción
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Nuestro equipo{' '}
            <span className="text-neon-blue" style={{ textShadow: '0 0 20px hsl(210,100%,56%/0.6)' }}>
              en movimiento
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Profesionalismo real. Cada mudanza documentada, cuidada y ejecutada con precisión.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[220px]">
          {images.map((img, i) => (
            <motion.div
              key={img.alt}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl overflow-hidden group border border-neon-cyan/10 hover:border-neon-cyan/40 transition-all duration-300 ${img.span}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <span className="text-foreground font-semibold text-sm">{img.label}</span>
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
