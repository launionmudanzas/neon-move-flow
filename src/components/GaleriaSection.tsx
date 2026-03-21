import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown, Image as ImageIcon } from 'lucide-react';

// Team photos
import team1 from '@/assets/team-1.png';
import team2 from '@/assets/team-2.png';
import team3 from '@/assets/team-3.png';
import team4 from '@/assets/team-4.png';
import team5 from '@/assets/team-5.png';
import team6 from '@/assets/team-6.png';
import team7 from '@/assets/team-7.png';

// Fleet photos
import fleetTrailer from '@/assets/fleet-trailer.png';
import fleetColorful from '@/assets/fleet-colorful.png';
import fleetVan from '@/assets/fleet-van.png';
import fleetCrane from '@/assets/fleet-crane.png';
import fleetBeach from '@/assets/fleet-beach.png';
import fleetGdl from '@/assets/fleet-gdl.png';
import fleetTj from '@/assets/fleet-tj.png';
import fleetEagle from '@/assets/fleet-eagle.png';

// General gallery
import gallery1 from '@/assets/gallery-1.jpg';
import gallery2 from '@/assets/gallery-2.jpg';
import gallery3 from '@/assets/gallery-3.jpg';

const teamPhotos = [
  { src: team1, label: 'Coordinación operativa', tag: 'Equipo' },
  { src: team2, label: 'Maniobras profesionales', tag: 'Operaciones' },
  { src: team3, label: 'Carga y protección', tag: 'Carga' },
  { src: team4, label: 'Flota en ruta', tag: 'Logística' },
  { src: team5, label: 'Seguimiento en tiempo real', tag: 'Coordinación' },
  { src: team6, label: 'Atención personalizada', tag: 'Clientes' },
  { src: team7, label: 'Unidades especializadas', tag: 'Flota' },
  { src: gallery1, label: 'Mudanza residencial', tag: 'Residencial' },
  { src: gallery2, label: 'Servicio de calidad', tag: 'Servicio' },
  { src: gallery3, label: 'Equipo completo', tag: 'Personal' },
];

const serviceCategories = [
  {
    id: 'residencial',
    label: '🏠 Mudanza Residencial',
    photos: [
      { src: fleetBeach, label: 'Traslado costera' },
      { src: fleetGdl, label: 'Guadalajara' },
      { src: team1, label: 'Coordinación carga' },
    ],
  },
  {
    id: 'oficina',
    label: '🏢 Mudanza de Oficina',
    photos: [
      { src: fleetTrailer, label: 'Tráiler corporativo' },
      { src: team2, label: 'Maniobras especiales' },
      { src: gallery2, label: 'Embalaje profesional' },
    ],
  },
  {
    id: 'compartido',
    label: '🤝 Servicio Compartido',
    photos: [
      { src: fleetColorful, label: 'Unidad compartida' },
      { src: fleetEagle, label: '#LaUnionMudanzas' },
      { src: team4, label: 'Carga segura' },
    ],
  },
  {
    id: 'directo',
    label: '⚡ Servicio Directo',
    photos: [
      { src: fleetTj, label: 'Ruta fronteriza' },
      { src: fleetGdl, label: 'Servicio nacional' },
      { src: team5, label: 'Seguimiento ruta' },
    ],
  },
  {
    id: 'exclusivo',
    label: '⭐ Servicio Exclusivo',
    photos: [
      { src: fleetTrailer, label: 'Tráiler exclusivo' },
      { src: fleetVan, label: 'Van nocturna' },
      { src: team6, label: 'Atención VIP' },
    ],
  },
  {
    id: 'maniobras',
    label: '💪 Maniobras',
    photos: [
      { src: fleetCrane, label: 'Grúa especializada' },
      { src: team2, label: 'Maniobras profesionales' },
      { src: team3, label: 'Carga compleja' },
    ],
  },
  {
    id: 'auto',
    label: '🚗 Traslado de Auto',
    photos: [
      { src: fleetBeach, label: 'Traslado en plataforma' },
      { src: fleetTj, label: 'Ruta segura' },
      { src: team7, label: 'Unidad especializada' },
    ],
  },
  {
    id: 'almacenaje',
    label: '📦 Almacenaje',
    photos: [
      { src: gallery3, label: 'Bodega segura' },
      { src: gallery1, label: 'Control de inventario' },
      { src: team6, label: 'Atención al cliente' },
    ],
  },
];

function PhotoGrid({ photos, cols = 3 }: { photos: { src: string; label: string }[]; cols?: number }) {
  return (
    <div className={`grid gap-3 ${cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5'}`}>
      {photos.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          className="relative rounded-xl overflow-hidden group border border-neon-cyan/10 hover:border-neon-cyan/40 transition-all duration-300 aspect-[4/3]"
        >
          <img
            src={p.src}
            alt={p.label}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <span className="text-foreground font-semibold text-xs leading-tight line-clamp-1">{p.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AccordionGallery({
  title,
  subtitle,
  badge,
  badgeColor,
  children,
}: {
  title: React.ReactNode;
  subtitle: string;
  badge: string;
  badgeColor: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-2xl border border-neon-cyan/15 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left hover:bg-surface/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${badgeColor} flex-shrink-0`}>
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-base md:text-lg">{title}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`hidden sm:block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeColor}`}>{badge}</span>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 md:px-6">
              <div className="h-px bg-neon-cyan/10 mb-5" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GaleriaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="galeria" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute left-0 bottom-0 w-[500px] h-[500px] rounded-full bg-neon-blue/5 blur-[100px]" />
      <div className="absolute right-0 top-0 w-[400px] h-[400px] rounded-full bg-neon-cyan/4 blur-[120px]" />

      <div className="relative container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold tracking-widest uppercase mb-4">
            Galería
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Nuestro trabajo{' '}
            <span className="text-neon-blue" style={{ textShadow: '0 0 20px hsl(210,100%,56%/0.6)' }}>
              real
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Fotos reales de nuestro equipo, flota y servicios en acción.
          </p>
        </motion.div>

        <div className="space-y-4">
          {/* ── NUESTRO EQUIPO ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AccordionGallery
              title={<>Nuestro <span className="text-neon-cyan">Equipo</span></>}
              subtitle="Personal, maniobras, coordinación y atención al cliente"
              badge="10 fotos"
              badgeColor="bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
            >
              <PhotoGrid photos={teamPhotos} cols={4} />
            </AccordionGallery>
          </motion.div>

          {/* ── TIPOS DE SERVICIOS ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AccordionGallery
              title={<>Tipos de <span className="text-neon-orange">Servicios</span></>}
              subtitle="Galería por tipo de servicio — da clic en cada categoría"
              badge={`${serviceCategories.length} categorías`}
              badgeColor="bg-neon-orange/10 border-neon-orange/30 text-neon-orange"
            >
              <div className="space-y-5">
                {serviceCategories.map((cat, ci) => (
                  <ServiceCategoryBlock key={cat.id} cat={cat} delay={ci * 0.05} />
                ))}
              </div>
            </AccordionGallery>
          </motion.div>

          {/* ── FLOTA EN MOVIMIENTO (always visible grid) ──────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AccordionGallery
              title={<>Flota en <span className="text-neon-green">movimiento</span></>}
              subtitle="Nuestras unidades en ruta — cobertura nacional"
              badge="8 fotos"
              badgeColor="bg-neon-green/10 border-neon-green/30 text-neon-green"
            >
              <PhotoGrid
                photos={[
                  { src: fleetBeach, label: 'Cobertura costera' },
                  { src: fleetGdl, label: 'Guadalajara' },
                  { src: fleetEagle, label: '#LaUnionMudanzas' },
                  { src: fleetTrailer, label: 'Tráiler premium' },
                  { src: fleetVan, label: 'Van urbana' },
                  { src: fleetCrane, label: 'Maniobras especiales' },
                  { src: fleetColorful, label: 'Identidad mexicana' },
                  { src: fleetTj, label: 'Ruta fronteriza' },
                ]}
                cols={4}
              />
            </AccordionGallery>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ServiceCategoryBlock({
  cat,
  delay,
}: {
  cat: (typeof serviceCategories)[0];
  delay: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-xl border border-border/60 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-surface/50 transition-colors"
      >
        <span className="font-semibold text-sm text-foreground">{cat.label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <PhotoGrid photos={cat.photos} cols={3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
