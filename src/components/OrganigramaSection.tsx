import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Users,
  Truck,
  HeadphonesIcon,
  PackageOpen,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';

// Solo las 3 áreas reales de operación
const departments = [
  {
    id: 'ventas',
    icon: ShoppingBag,
    title: 'Ventas',
    color: 'cyan',
    desc: 'Cotizaciones, seguimiento de prospectos y cierre de servicios. Primer contacto con el cliente.',
    tasks: ['Cotizaciones express', 'Seguimiento de leads', 'Cierre de servicios', 'WhatsApp directo 442 127 0514'],
  },
  {
    id: 'clientes',
    icon: HeadphonesIcon,
    title: 'Atención a Clientes',
    color: 'green',
    desc: 'Soporte antes, durante y después del servicio. Resolución de dudas e incidencias.',
    tasks: ['Soporte pre y post mudanza', 'Seguimiento de órdenes', 'Resolución de incidencias', 'Confirmación de servicios'],
  },
  {
    id: 'operaciones',
    icon: Truck,
    title: 'Operaciones y Logística',
    color: 'orange',
    desc: 'Ejecutado directamente por Coordinación. Planeación de rutas, flota y seguimiento en tiempo real.',
    tasks: ['Asignación de unidades', 'Planificación de rutas', 'Seguimiento en ruta', 'Control de flota'],
    highlight: true,
  },
  {
    id: 'maniobras',
    icon: PackageOpen,
    title: 'Maniobras',
    color: 'blue',
    desc: 'Carga, descarga, embalaje profesional y manejo de artículos especiales en cada servicio.',
    tasks: ['Embalaje profesional', 'Carga y descarga', 'Montaje y desmontaje', 'Artículos frágiles'],
  },
];

const colorMap: Record<string, { card: string; icon: string; dot: string; line: string }> = {
  cyan:   { card: 'border-neon-cyan/25 hover:border-neon-cyan/60',    icon: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan',    dot: 'bg-neon-cyan',    line: 'bg-neon-cyan/30' },
  green:  { card: 'border-neon-green/25 hover:border-neon-green/60',  icon: 'bg-neon-green/10 border-neon-green/30 text-neon-green',  dot: 'bg-neon-green',   line: 'bg-neon-green/30' },
  orange: { card: 'border-neon-orange/25 hover:border-neon-orange/60',icon: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange',dot: 'bg-neon-orange', line: 'bg-neon-orange/30' },
  blue:   { card: 'border-neon-blue/25 hover:border-neon-blue/60',    icon: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue',    dot: 'bg-neon-blue',    line: 'bg-neon-blue/30' },
};

export default function OrganigramaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="organigrama" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/10 via-background to-surface/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-neon-blue/4 blur-[140px]" />

      <div className="relative container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold tracking-widest uppercase mb-4">
            <Users className="w-3.5 h-3.5" />
            Cómo operamos
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Estructura{' '}
            <span className="text-neon-cyan" style={{ textShadow: '0 0 20px hsl(180 100% 50% / 0.5)' }}>operativa</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Un equipo compacto y profesional. Coordinación dirige y ejecuta · Cada área tiene un rol claro.
          </p>
        </motion.div>

        {/* COORDINACIÓN */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="px-12 py-5 rounded-2xl bg-gradient-to-r from-neon-cyan/20 via-neon-blue/20 to-neon-cyan/20 border-2 border-neon-cyan/50 shadow-[0_0_30px_hsl(180_100%_50%/0.2)] text-center">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-neon-cyan mb-1">La Unión Mudanzas</p>
              <h3 className="font-display font-black text-2xl md:text-3xl text-foreground">COORDINACIÓN</h3>
              <p className="text-muted-foreground text-xs mt-1.5">Dirección general · Operaciones y Logística</p>
              {/* Badge: operaciones incluidas */}
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-neon-orange/15 border border-neon-orange/30 text-neon-orange text-[10px] font-bold tracking-wide">
                <Truck className="w-3 h-3" />
                Ejecuta Operaciones y Logística directamente
              </span>
            </div>
          </motion.div>

          {/* Line down */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ transformOrigin: 'top' }}
            className="w-0.5 h-10 bg-gradient-to-b from-neon-cyan/60 to-neon-cyan/20"
          />

          {/* Horizontal bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.45 }}
            style={{ transformOrigin: 'center' }}
            className="w-full max-w-3xl h-0.5 bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent"
          />
        </div>

        {/* Department cards — 2 columns on mobile, 4 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept, i) => {
            const colors = colorMap[dept.color];
            const isExpanded = expanded === dept.id;
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              >
                {/* Top connector line */}
                <div className="flex justify-center">
                  <div className={`w-0.5 h-6 ${colors.line}`} />
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : dept.id)}
                  className={`w-full text-left glass-card rounded-2xl border p-4 transition-all duration-300 group ${colors.card} ${dept.highlight ? 'ring-1 ring-neon-orange/20' : ''}`}
                >
                  <div className="flex flex-col items-center text-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                      <dept.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-foreground text-sm leading-tight mb-1">{dept.title}</h4>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">{dept.desc}</p>
                    </div>
                  </div>

                  <div className="flex justify-center mt-1">
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      className="mt-3 pt-3 border-t border-border text-left"
                    >
                      <ul className="space-y-1.5">
                        {dept.tasks.map((task) => (
                          <li key={task} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Trust phrase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground text-sm">
            <span className="text-neon-cyan font-semibold">Cada servicio tiene seguimiento en tiempo real</span> · Equipo profesional y verificado
          </p>
        </motion.div>
      </div>
    </section>
  );
}
