import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import fleetTrailer from '@/assets/fleet-trailer.png';
import fleetColorful from '@/assets/fleet-colorful.png';
import fleetVan from '@/assets/fleet-van.png';
import fleetCrane from '@/assets/fleet-crane.png';
import fleetBeach from '@/assets/fleet-beach.png';
import fleetGdl from '@/assets/fleet-gdl.png';
import fleetTj from '@/assets/fleet-tj.png';
import fleetEagle from '@/assets/fleet-eagle.png';

const images = [
  { src: fleetBeach, alt: 'Unidad La Unión en playa', label: 'Cobertura Costera', span: 'sm:col-span-2 lg:col-span-2 lg:row-span-2' },
  { src: fleetGdl, alt: 'Unidad La Unión en Guadalajara', label: 'Guadalajara', span: '' },
  { src: fleetEagle, alt: 'Camión La Unión con águila', label: '#LaUnionMudanzas', span: '' },
  { src: fleetTrailer, alt: 'Tráiler La Unión arte mexicano', label: 'Tráiler Premium', span: 'sm:col-span-2' },
  { src: fleetVan, alt: 'Van La Unión nocturna', label: 'Servicio Urbano', span: '' },
  { src: fleetCrane, alt: 'Unidad con grúa La Unión', label: 'Maniobras Especiales', span: '' },
  { src: fleetColorful, alt: 'Camión colorido La Unión', label: 'Identidad Mexicana', span: '' },
  { src: fleetTj, alt: 'Unidad La Unión en Tijuana', label: 'Ruta Fronteriza', span: '' },
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
            Nuestro equipo
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Flota{' '}
            <span className="text-neon-blue" style={{ textShadow: '0 0 20px hsl(210,100%,56%/0.6)' }}>
              en movimiento
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Salidas todas las semanas · Servicios compartidos · Más de 28 rutas activas
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {images.map((img, i) => (
            <motion.div
              key={img.alt}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
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
