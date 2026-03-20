import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MessageSquare, ClipboardCheck, CalendarCheck, Truck } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: MessageSquare,
    title: 'Cotiza',
    desc: 'Llena el formulario express o contáctanos por WhatsApp. En menos de 60 segundos tenemos tu perfil de mudanza listo.',
    color: 'cyan',
  },
  {
    num: '02',
    icon: ClipboardCheck,
    title: 'Validamos',
    desc: 'Un asesor revisa tu solicitud, confirma detalles y te envía una cotización clara, sin letra chica.',
    color: 'blue',
  },
  {
    num: '03',
    icon: CalendarCheck,
    title: 'Programamos',
    desc: 'Acordamos fecha, hora y condiciones. Coordinación total para que el día de tu mudanza todo fluya.',
    color: 'cyan',
  },
  {
    num: '04',
    icon: Truck,
    title: 'Ejecutamos',
    desc: 'Nuestro equipo se presenta puntual, profesional y listo. Tu nueva historia comienza aquí.',
    color: 'orange',
  },
];

const colorMap: Record<string, { icon: string; num: string; line: string }> = {
  cyan: {
    icon: 'bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan shadow-glow-cyan',
    num: 'text-neon-cyan',
    line: 'bg-neon-cyan/30',
  },
  blue: {
    icon: 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue shadow-glow-blue',
    num: 'text-neon-blue',
    line: 'bg-neon-blue/30',
  },
  orange: {
    icon: 'bg-neon-orange/10 border-neon-orange/40 text-neon-orange',
    num: 'text-neon-orange',
    line: 'bg-neon-orange/30',
  },
};

export default function ComoFuncionaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="como-funciona" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-background to-surface/20" />
      <div className="absolute left-0 top-1/2 w-[400px] h-[400px] rounded-full bg-neon-cyan/5 blur-[100px] -translate-y-1/2" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-bold tracking-widest uppercase mb-4">
            Proceso claro
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Así funciona{' '}
            <span className="text-neon-cyan text-glow-cyan">La Unión</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            4 pasos simples para que tu mudanza sea una experiencia organizada, tranquila y sin sorpresas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line desktop */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-neon-cyan/20 via-neon-blue/40 to-neon-orange/20" />

          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step circle */}
              <div className={`relative w-[104px] h-[104px] rounded-full flex items-center justify-center border-2 mb-6 ${colorMap[s.color].icon} z-10`}>
                <s.icon className="w-9 h-9" />
                <span className={`absolute -top-2 -right-2 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center bg-background border ${colorMap[s.color].icon}`}>
                  {i + 1}
                </span>
              </div>

              <div className={`font-display text-5xl font-black opacity-10 mb-2 ${colorMap[s.color].num}`}>
                {s.num}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
