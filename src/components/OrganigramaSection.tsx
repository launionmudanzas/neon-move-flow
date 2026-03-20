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
  Star,
} from 'lucide-react';

const departments = [
  {
    id: 'operaciones',
    icon: Truck,
    title: 'Operaciones y Logística',
    color: 'cyan',
    desc: 'Planeación de rutas, asignación de unidades y seguimiento en tiempo real de cada servicio.',
    tasks: ['Planificación de rutas', 'Control de flota', 'Seguimiento GPS', 'Asignación de unidades'],
  },
  {
    id: 'administracion',
    icon: Calculator,
    title: 'Administración',
    color: 'blue',
    desc: 'Gestión financiera, facturación, pagos y control de costos operativos.',
    tasks: ['Facturación', 'Control de pagos', 'Nómina', 'Finanzas'],
  },
  {
    id: 'clientes',
    icon: HeadphonesIcon,
    title: 'Atención a Clientes',
    color: 'green',
    desc: 'Primer contacto, cotizaciones, seguimiento y satisfacción del cliente.',
    tasks: ['Cotizaciones express', 'Seguimiento de servicios', 'Resolución de incidencias', 'WhatsApp directo'],
  },
  {
    id: 'maniobras',
    icon: PackageOpen,
    title: 'Maniobras',
    color: 'orange',
    desc: 'Carga, descarga, embalaje profesional y manejo de artículos especiales.',
    tasks: ['Embalaje profesional', 'Carga especializada', 'Montaje y desmontaje', 'Artículos frágiles'],
  },
  {
    id: 'redes',
    icon: Share2,
    title: 'Redes Sociales',
    color: 'pink',
    desc: 'Comunicación digital, presencia de marca y gestión de reputación online.',
    tasks: ['Facebook / Instagram', 'Contenido digital', 'Reseñas y reputación', 'Campañas digitales'],
  },
  {
    id: 'bodega',
    icon: Warehouse,
    title: 'Bodega',
    color: 'cyan',
    desc: 'Almacenaje temporal, control de inventario y custodia de bienes.',
    tasks: ['Almacenaje temporal', 'Control de inventario', 'Custodia de bienes', 'Logística inversa'],
  },
];

const colorMap: Record<string, { card: string; icon: string; dot: string; line: string }> = {
  cyan:   { card: 'border-neon-cyan/25 hover:border-neon-cyan/60',   icon: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan',   dot: 'bg-neon-cyan',   line: 'bg-neon-cyan/30' },
  blue:   { card: 'border-neon-blue/25 hover:border-neon-blue/60',   icon: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue',   dot: 'bg-neon-blue',   line: 'bg-neon-blue/30' },
  green:  { card: 'border-neon-green/25 hover:border-neon-green/60', icon: 'bg-neon-green/10 border-neon-green/30 text-neon-green', dot: 'bg-neon-green', line: 'bg-neon-green/30' },
  orange: { card: 'border-neon-orange/25 hover:border-neon-orange/60',icon: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange',dot:'bg-neon-orange',line:'bg-neon-orange/30'},
  pink:   { card: 'border-neon-pink/25 hover:border-neon-pink/60',   icon: 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink',   dot: 'bg-neon-pink',   line: 'bg-neon-pink/30' },
};

export default function OrganigramaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="organigrama" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/10 via-background to-surface/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-neon-blue/4 blur-[140px]" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold tracking-widest uppercase mb-4">
            <Users className="w-3.5 h-3.5" />
            Equipo profesional
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Estructura{' '}
            <span className="text-neon-cyan text-glow-cyan">operativa</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Un equipo especializado en cada área para garantizar la excelencia en tu mudanza.
          </p>
        </motion.div>

        {/* Coordinación central */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="px-10 py-5 rounded-2xl bg-gradient-to-r from-neon-cyan/20 via-neon-blue/20 to-neon-cyan/20 border-2 border-neon-cyan/50 shadow-glow-cyan text-center">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-neon-cyan mb-1">Empresa</p>
              <h3 className="font-display font-black text-2xl md:text-3xl text-foreground">COORDINACIÓN</h3>
              <p className="text-muted-foreground text-xs mt-1">La Unión Mudanzas · Dirección General</p>
            </div>
          </motion.div>

          {/* Vertical line down */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ transformOrigin: 'top' }}
            className="w-0.5 h-10 bg-gradient-to-b from-neon-cyan/60 to-neon-cyan/20"
          />

          {/* Horizontal connector */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.45 }}
            style={{ transformOrigin: 'center' }}
            className="w-full max-w-5xl h-0.5 bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent"
          />
        </div>

        {/* Department cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => {
            const colors = colorMap[dept.color];
            const isExpanded = expanded === dept.id;
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
              >
                {/* Top connector */}
                <div className="flex justify-center">
                  <div className={`w-0.5 h-6 ${colors.line}`} />
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : dept.id)}
                  className={`w-full text-left glass-card rounded-2xl border p-5 transition-all duration-300 group ${colors.card}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                      <dept.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-foreground text-base mb-1 leading-tight">{dept.title}</h4>
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{dept.desc}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <ul className="space-y-2">
                        {dept.tasks.map((task) => (
                          <li key={task} className="flex items-center gap-2 text-sm text-muted-foreground">
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
          className="text-center mt-14"
        >
          <p className="text-muted-foreground text-sm">
            <span className="text-neon-cyan font-semibold">Cada servicio tiene seguimiento en tiempo real</span> · Equipo profesional y verificado en cada área
          </p>
        </motion.div>
      </div>
    </section>
  );
}
