import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Clock, Calculator } from 'lucide-react';

const WHATSAPP_NUMBER = '4421270514';

const cubre = [
  { icon: '🔒', label: 'Robo de unidad', desc: 'Cubre los bienes asegurados contra la falta de entrega del contenido por extravío o robo' },
  { icon: '🚗', label: 'Riesgos ordinarios de tránsito', desc: 'Daños causados a consecuencia de un accidente, colisión o volcadura' },
  { icon: '🔥', label: 'Incendio, rayos y explosión', desc: 'Daños materiales causados por incendio, rayos y explosión' },
  { icon: '✈️', label: 'Caída de aviones y auto ignición', desc: 'Daños por caída de aviones, auto ignición del vehículo' },
  { icon: '🌊', label: 'Hundimiento o rotura de puentes', desc: 'Daños por hundimiento o descarrilamiento del medio de transporte' },
];

const noCubre = [
  { icon: '⚙️', label: 'Retraso por compostura' },
  { icon: '🔧', label: 'Pinchadura de llanta' },
  { icon: '📦', label: 'Maniobra de carga y descarga' },
  { icon: '🏚️', label: 'Daños por mal empaque del cliente' },
];

// Tabla de tasas escalonadas (sin 2.5%)
function getInsuranceRate(monto: number): number {
  if (monto < 100000) return 0.02;   // 2.0%
  if (monto < 500000) return 0.015;  // 1.5%
  return 0.01;                        // 1.0%
}

const MIN_AMOUNT = 50000;

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);
}

export default function SeguroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [montoAsegurado, setMontoAsegurado] = useState(50000);
  const [inputValue, setInputValue] = useState('50000');

  const rate = getInsuranceRate(montoAsegurado);
  const costoSeguro = montoAsegurado * rate;
  const porcentaje = (rate * 100).toFixed(1);

  const handleInput = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    setInputValue(raw);
    const num = parseInt(raw || '0', 10);
    setMontoAsegurado(Math.max(MIN_AMOUNT, num));
  };

  const handleBlur = () => {
    if (montoAsegurado < MIN_AMOUNT) {
      setMontoAsegurado(MIN_AMOUNT);
      setInputValue(String(MIN_AMOUNT));
    }
  };

  const presets = [50000, 100000, 200000, 500000];

  return (
    <section id="seguro" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/20 to-background" />
      <div className="absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full bg-neon-blue/5 blur-[120px]" />

      <div className="relative container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold tracking-widest uppercase mb-4">
            <Shield className="w-3.5 h-3.5" />
            Protección garantizada
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Seguro en{' '}
            <span className="text-neon-blue" style={{ textShadow: '0 0 20px hsl(220,100%,60%/0.5)' }}>
              riesgos ordinarios
            </span>{' '}
            de transporte
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Al realizar una mudanza es importante conocer que puedes asegurar tu patrimonio mediante una póliza de seguro.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* CUBRE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-card rounded-2xl border border-neon-green/20 p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-lg">Sí cubre</h3>
                <p className="text-muted-foreground text-xs">Eventos protegidos por la póliza</p>
              </div>
            </div>
            <ul className="space-y-3">
              {cubre.map((item) => (
                <li key={item.label} className="py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <CheckCircle2 className="w-4 h-4 text-neon-green ml-auto flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground pl-8 leading-relaxed">{item.desc}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* NO CUBRE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-2xl border border-destructive/20 p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-lg">No cubre</h3>
                <p className="text-muted-foreground text-xs">Eventos excluidos de la cobertura</p>
              </div>
            </div>
            <ul className="space-y-3">
              {noCubre.map((item) => (
                <li key={item.label} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-foreground">{item.label}</span>
                  <XCircle className="w-4 h-4 text-destructive ml-auto flex-shrink-0" />
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* 72h warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-start gap-4 p-5 rounded-2xl bg-neon-orange/10 border border-neon-orange/30 mb-10"
        >
          <div className="w-10 h-10 rounded-xl bg-neon-orange/20 border border-neon-orange/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5 text-neon-orange" />
          </div>
          <div>
            <p className="font-bold text-foreground text-base mb-1">
              El seguro debe contratarse con anticipación mínima de 72 horas
            </p>
            <p className="text-muted-foreground text-sm">
              Asegúrate de solicitar tu póliza con tiempo suficiente antes de la fecha de tu mudanza para garantizar cobertura completa.
            </p>
          </div>
        </motion.div>

        {/* Dynamic insurance calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-card rounded-2xl border border-neon-cyan/20 overflow-hidden"
        >
          <div className="p-1.5 bg-gradient-to-r from-neon-cyan/20 via-neon-blue/20 to-neon-cyan/20" />
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-lg">Calculadora de Seguro</h3>
                <p className="text-muted-foreground text-xs">Calcula el costo de tu póliza en tiempo real</p>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setMontoAsegurado(preset); setInputValue(String(preset)); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    montoAsegurado === preset
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-glow-cyan'
                      : 'border-border text-muted-foreground hover:border-neon-cyan/40 hover:text-foreground'
                  }`}
                >
                  {formatMXN(preset)}
                </button>
              ))}
            </div>

            {/* Input + result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Valor declarado de tus bienes (MXN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInput(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full pl-8 pr-4 py-4 bg-surface border border-border rounded-xl text-foreground text-base font-semibold focus:outline-none focus:border-neon-cyan/60 focus:shadow-glow-cyan transition-all"
                    placeholder="50000"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Mínimo asegurable: {formatMXN(MIN_AMOUNT)}</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                  <p className="text-xs text-muted-foreground mb-1">Tasa aplicada</p>
                  <p className="font-display font-black text-2xl text-neon-cyan">{porcentaje}%</p>
                </div>
                <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
                  <p className="text-xs text-muted-foreground mb-1">Costo del seguro</p>
                  <p className="font-display font-black text-2xl text-neon-green">{formatMXN(costoSeguro)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Por {formatMXN(montoAsegurado)} asegurados</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20quiero%20contratar%20un%20seguro%20para%20mi%20mudanza%20por%20un%20valor%20de%20${formatMXN(montoAsegurado)}.%20El%20costo%20calculado%20es%20de%20${formatMXN(costoSeguro)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full px-6 py-4 rounded-xl bg-neon-green text-background font-bold text-base hover:shadow-glow-green transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contratar seguro por WhatsApp · {formatMXN(costoSeguro)}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
