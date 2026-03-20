import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import mexicoMap from '@/assets/mexico-neon-map.jpg';

const cities = [
  { name: 'CDMX', x: '42%', y: '57%' },
  { name: 'Guadalajara', x: '30%', y: '48%' },
  { name: 'Monterrey', x: '48%', y: '33%' },
  { name: 'Tijuana', x: '8%', y: '22%' },
  { name: 'Cancún', x: '74%', y: '62%' },
  { name: 'Puebla', x: '47%', y: '60%' },
  { name: 'Hermosillo', x: '18%', y: '23%' },
  { name: 'Mérida', x: '67%', y: '58%' },
  { name: 'Veracruz', x: '55%', y: '57%' },
];

const stats = [
  { value: '32', label: 'Estados cubiertos' },
  { value: '+120', label: 'Ciudades activas' },
  { value: '+500', label: 'Rutas completadas' },
  { value: '24/7', label: 'Monitoreo de rutas' },
];

export default function CoberturaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="cobertura" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/20 to-background" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase mb-4">
            Red logística
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Cobertura en toda la{' '}
            <span className="text-neon-cyan text-glow-cyan">República Mexicana</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Red de rutas activas con monitoreo en tiempo real. De la CDMX a Cancún, de Tijuana a Mérida — tu mudanza llega.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-5 text-center border border-neon-cyan/15 hover:border-neon-cyan/40 transition-all duration-300">
                <div className="font-display text-3xl font-black text-neon-cyan text-glow-cyan mb-1">{s.value}</div>
                <div className="text-muted-foreground text-xs">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-2 relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-neon-cyan/20 shadow-glow-cyan">
              <img
                src={mexicoMap}
                alt="Red logística México"
                className="w-full h-[300px] md:h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />

              {/* City dots */}
              {cities.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
                  className="absolute group"
                  style={{ left: c.x, top: c.y, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse-glow cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-background/90 border border-neon-cyan/40 rounded text-neon-cyan text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {c.name}
                  </div>
                </motion.div>
              ))}

              {/* Label */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-neon-cyan/30">
                <span className="text-neon-cyan text-xs font-bold">● Red activa · 32 estados</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
