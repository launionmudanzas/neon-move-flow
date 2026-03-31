import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: '¿Cómo cotizo mi mudanza?',
    a: 'Puedes cotizar directamente desde nuestro formulario en esta página, o enviándonos un mensaje por WhatsApp. Un asesor te responde a la brevedad.',
  },
  {
    q: '¿Qué incluye el servicio?',
    a: 'Dependiendo del plan elegido, incluye: transporte en unidad adecuada, operadores capacitados, materiales de protección básica, carga y descarga. El embalaje completo es un servicio adicional.',
  },
  {
    q: '¿Cuáles son las formas de pago?',
    a: 'Aceptamos transferencia bancaria, tarjeta de crédito/débito y efectivo. Puedes apartar tu fecha con un anticipo y liquidar el resto al momento del servicio.',
  },
  {
    q: '¿Cuánto tarda mi mudanza en llegar?',
    a: 'En servicio directo, el tiempo depende de la ruta. En servicio compartido, los tiempos son más amplios. Te damos una ventana de entrega específica al confirmar tu servicio.',
  },
  {
    q: '¿Manejan servicio compartido?',
    a: 'Sí. El servicio compartido es ideal para pocas cosas o presupuestos ajustados. Tu carga viaja junto con otras en la misma unidad, pagando solo por el volumen que ocupas.',
  },
  {
    q: '¿Pueden trasladar vehículos?',
    a: 'Sí, trasladamos autos, camionetas, pickups, vans y motocicletas. Contamos con plataformas especializadas y operadores certificados para garantizar que tu vehículo llegue sin daños.',
  },
  {
    q: '¿Facturan?',
    a: 'Sí, emitimos factura electrónica CFDI a personas físicas y morales. Solo necesitamos tus datos fiscales al momento de contratar el servicio.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="faq" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 to-background" />

      <div className="relative container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase mb-4">
            FAQ
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Preguntas{' '}
            <span className="text-neon-cyan text-glow-cyan">frecuentes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Respondemos las dudas más comunes para que tomes la mejor decisión.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={`glass-card rounded-xl border transition-all duration-300 overflow-hidden ${
                open === i ? 'border-neon-cyan/40 shadow-glow-cyan' : 'border-border hover:border-neon-cyan/30'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left gap-4"
              >
                <span className={`font-semibold text-base transition-colors duration-200 ${open === i ? 'text-neon-cyan' : 'text-foreground'}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                    open === i ? 'rotate-180 text-neon-cyan' : 'text-muted-foreground'
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-border pt-4">
                  {faq.a}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
