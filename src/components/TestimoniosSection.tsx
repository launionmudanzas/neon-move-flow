import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star } from 'lucide-react';

const testimonios = [
  {
    nombre: 'Gabriela Ramírez',
    ciudad: 'CDMX → Guadalajara',
    texto: 'Increíble servicio. Llegaron puntual, empacaron todo con cuidado y entregaron sin ningún daño. El equipo fue muy profesional y amable durante todo el proceso.',
    estrellas: 5,
    tipo: 'Mudanza residencial',
  },
  {
    nombre: 'Carlos Mendoza',
    ciudad: 'Monterrey → CDMX',
    texto: 'Trasladamos toda la oficina en un fin de semana sin interrumpir nuestras operaciones el lunes. La coordinación fue impecable. 100% recomendados.',
    estrellas: 5,
    tipo: 'Mudanza corporativa',
  },
  {
    nombre: 'Patricia Soto',
    ciudad: 'Puebla → Cancún',
    texto: 'Servicio compartido muy bien organizado. Excelente precio y mis cosas llegaron en perfecto estado. La comunicación fue constante durante el traslado.',
    estrellas: 5,
    tipo: 'Servicio compartido',
  },
  {
    nombre: 'Roberto Fuentes',
    ciudad: 'Tijuana → Hermosillo',
    texto: 'Necesitaba mover mi Ford Ranger y quedé muy satisfecho. La plataforma llegó puntual, el vehículo llegó sin un rasguño. Profesionalismo de nivel.',
    estrellas: 5,
    tipo: 'Traslado de vehículo',
  },
  {
    nombre: 'Ana Gutiérrez',
    ciudad: 'CDMX → Mérida',
    texto: 'Mudanza completa de casa grande. Todo perfectamente empacado y etiquetado. Llegaron antes del tiempo estimado. Sin duda los volvería a contratar.',
    estrellas: 5,
    tipo: 'Mudanza residencial',
  },
  {
    nombre: 'Miguel Torres',
    ciudad: 'León → Querétaro',
    texto: 'Muy buena experiencia desde la cotización. Rápida, clara y sin sorpresas. El día de la mudanza todo salió exactamente como lo prometieron.',
    estrellas: 5,
    tipo: 'Mudanza residencial',
  },
];

export default function TestimoniosSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="testimonios" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 via-background to-surface/10" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase mb-4">
            Clientes satisfechos
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Sus historias,{' '}
            <span className="text-neon-cyan text-glow-cyan">nuestra reputación</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Más de 500 familias y empresas que confiaron en nosotros. Estas son algunas de sus historias.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonios.map((t, i) => (
            <motion.div
              key={t.nombre}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass-card rounded-2xl p-6 border border-neon-cyan/10 hover:border-neon-cyan/30 transition-all duration-300 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.estrellas }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-neon-orange text-neon-orange" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
                "{t.texto}"
              </p>

              {/* Author */}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground text-sm">{t.nombre}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{t.ciudad}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-semibold">
                  {t.tipo}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
