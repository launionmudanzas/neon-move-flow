import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Truck, Phone } from 'lucide-react';

const WHATSAPP_NUMBER = '4421270514';

export default function CierreSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[400px] rounded-full bg-neon-cyan/6 blur-[120px]" />
      </div>

      <div className="relative container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange text-xs font-bold tracking-widest uppercase mb-6">
            Empieza hoy
          </span>
          <h2 className="font-display text-4xl md:text-6xl font-black text-foreground mb-5 leading-tight">
            Tu mudanza en{' '}
            <span className="text-neon-cyan text-glow-cyan">manos profesionales</span>
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed mb-4 max-w-2xl mx-auto">
            Cotiza hoy y recibe atención rápida, clara y personalizada. Tu nueva historia merece el mejor inicio.
          </p>

          {/* Leyenda de marca prominente */}
          <div className="inline-flex flex-col items-center gap-1 mb-10 px-6 py-3 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20">
            <p className="text-neon-cyan font-bold text-lg">#LaUnionMudanzas 🚛❤️</p>
            <p className="text-muted-foreground text-sm">Salidas todas las semanas · Servicios compartidos · Más de 28 rutas activas</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20quiero%20cotizar%20mi%20mudanza`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-neon-green text-background font-bold text-lg hover:shadow-glow-green transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Cotizar por WhatsApp
            </a>
            <a
              href={`tel:${WHATSAPP_NUMBER}`}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-neon-cyan/40 text-neon-cyan font-bold text-lg hover:bg-neon-cyan/10 hover:border-neon-cyan hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Phone className="w-5 h-5" />
              Llamar ahora
            </a>
            <a
              href="#cotizador"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-cta text-background font-bold text-lg hover:shadow-glow-orange transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cotizar en línea
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            {['Sin costos ocultos', 'Respuesta en minutos', 'Cobertura nacional', 'Servicio garantizado'].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                {t}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
