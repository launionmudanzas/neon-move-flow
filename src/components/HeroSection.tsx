import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Shield, Clock, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import truckHero from '@/assets/truck-hero.jpg';
import mexicoMap from '@/assets/mexico-neon-map.jpg';

import { siteConfig } from '@/lib/site-config';
const WHATSAPP_NUMBER = siteConfig.whatsApp;

const badges = [
  { icon: MapPin, label: 'Cobertura nacional' },
  { icon: Clock, label: 'Atención rápida' },
  { icon: Building2, label: 'Residencial y corporativo' },
  { icon: Shield, label: 'Servicio asegurado' },
];

const trustItems = [
  'Proveedores verificados',
  'Seguimiento en tiempo real',
  'Contrato formal incluido',
  'Evidencias del servicio',
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background layers */}
      <div className="absolute inset-0">
        <img
          src={mexicoMap}
          alt="Red logística México"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-neon-blue/8 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 max-w-7xl grid lg:grid-cols-2 gap-12 items-center py-16">
        {/* Left content */}
        <div className="order-2 lg:order-1">
          {/* Urgency badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap gap-2 mb-5"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-semibold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse-glow" />
              Logística Premium · México
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" />
              Espacios limitados por ruta
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-6xl xl:text-7xl font-black leading-[1.05] text-foreground mb-4"
          >
            Mudarte no tiene
            <br />
            <span className="text-glow-cyan text-neon-cyan">que ser complicado</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-6 max-w-lg"
          >
            Cotiza tu mudanza en menos de 1 minuto.{' '}
            <span className="text-foreground font-semibold">Atención real y cobertura nacional.</span>
          </motion.p>

          {/* Route example pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm text-muted-foreground mb-7"
          >
            <MapPin className="w-3.5 h-3.5 text-neon-cyan flex-shrink-0" />
            <span>Ej. <strong className="text-foreground">CDMX → Monterrey</strong> · ~15 m³ · Rabón · desde</span>
            <span className="text-neon-green font-black text-base">$8,500</span>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-glow" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <a
              href="#lead-form"
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-neon-cyan text-background font-bold text-base hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              👉 Cotizar ahora
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20quiero%20cotizar%20mi%20mudanza`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-neon-green text-background font-bold text-base hover:shadow-glow-green transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp {WHATSAPP_NUMBER}
            </a>
          </motion.div>

          {/* Trust items */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6"
          >
            {trustItems.map(item => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
                {item}
              </div>
            ))}
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap gap-2"
          >
            {badges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-muted-foreground font-medium"
              >
                <Icon className="w-3.5 h-3.5 text-neon-cyan" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="order-1 lg:order-2 relative"
        >
          <div className="relative rounded-2xl overflow-hidden border border-neon-cyan/20 shadow-glow-cyan">
            <img
              src={truckHero}
              alt="Camión de logística La Unión Mudanzas"
              className="w-full h-[320px] md:h-[420px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

            {/* Urgency overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-orange/90 text-background text-xs font-bold shadow-lg">
              <AlertTriangle className="w-3 h-3" />
              Salimos todas las semanas
            </div>

            {/* Stats overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              <div className="flex-1 bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-neon-cyan/20">
                <div className="text-neon-cyan font-display font-black text-2xl">+500</div>
                <div className="text-muted-foreground text-xs">Mudanzas realizadas</div>
              </div>
              <div className="flex-1 bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-neon-blue/20">
                <div className="text-neon-blue font-display font-black text-2xl">32</div>
                <div className="text-muted-foreground text-xs">Estados cubiertos</div>
              </div>
              <div className="flex-1 bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-neon-green/20">
                <div className="text-neon-green font-display font-black text-2xl">98%</div>
                <div className="text-muted-foreground text-xs">Satisfacción</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom neon line */}
      <div className="absolute bottom-0 left-0 right-0 neon-line" />
    </section>
  );
}
