import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Truck, Home, Building2, Scissors, Car, Bike, Package, LayoutGrid, HelpCircle, ChevronRight, Plus, Minus, ArrowRight, Calculator, FileText } from 'lucide-react';
import trucksSmall from '@/assets/trucks-small.png';
import trucksLarge from '@/assets/trucks-large.png';
import trucksTrailer from '@/assets/trucks-trailer.png';
import OrdenServicioModal from '@/components/OrdenServicioModal';

const WHATSAPP_NUMBER = '4421270514';

// Volume estimates in m³
const VOLUMES: Record<string, number> = {
  cama_king: 2.5, cama_matrimonial: 2, cama_individual: 1.5,
  sofa_3_plazas: 2, sofa_2_plazas: 1.5, sofa_individual: 0.8, sofa_cama: 2.5,
  comedor_6: 1.5, comedor_4: 1, mesa_centro: 0.3,
  ropero_3p: 2, ropero_2p: 1.5, cajones_3: 0.8,
  buros: 0.3, tocador: 0.8, librero: 0.8,
  refrigerador_duplex: 2, refrigerador_14: 1.2, estufa: 0.6,
  lavadora: 0.5, secadora: 0.5, lavadora_secadora: 0.8,
  tv_55: 0.3, tv_65: 0.5, tv_75: 0.6,
  escritorio: 0.8, silla_oficina: 0.4, archivero: 0.5,
  computadora: 0.2, impresora: 0.2,
  bicicleta: 0.5, moto_chica: 0.6,
  caja_estandar: 0.15,
};

const serviceTypes = [
  { id: 'mudanza_casa', label: 'Mudanza Casa', icon: Home, desc: 'Hogar completo o parcial' },
  { id: 'mudanza_oficina', label: 'Mudanza Oficina', icon: Building2, desc: 'Corporativo o local' },
  { id: 'articulos_estetica', label: 'Art. Estética', icon: Scissors, desc: 'Salón de belleza' },
  { id: 'vehiculo', label: 'Vehículo', icon: Car, desc: 'Auto, camioneta, van' },
  { id: 'moto', label: 'Moto', icon: Bike, desc: 'Motocicleta' },
  { id: 'pocas_cosas', label: 'Pocas Cosas', icon: Package, desc: 'Cajas y artículos' },
  { id: 'objetos_sueltos', label: 'Objetos Sueltos', icon: LayoutGrid, desc: 'Muebles individuales' },
  { id: 'otros', label: 'Otros', icon: HelpCircle, desc: 'Describir libremente' },
];

type ServiceType = typeof serviceTypes[number]['id'];

interface VehicleEntry { marca: string; modelo: string; anio: string; tipo: string; enciende: string; llaves: string; }
interface MotoEntry { marca: string; modelo: string; anio: string; cilindraje: string; enciende: string; llaves: string; }

function getUnitSuggestion(vol: number) {
  if (vol <= 10) return { label: 'Camioneta Chica', range: '0–10 m³', icon: '🚐' };
  if (vol <= 20) return { label: 'Camioneta 3.5 ton', range: '10–20 m³', icon: '🚚' };
  if (vol <= 35) return { label: 'Rabón', range: '20–35 m³', icon: '🚛' };
  if (vol <= 60) return { label: 'Tórtón', range: '35–60 m³', icon: '🚛' };
  if (vol <= 90) return { label: 'Camión Grande', range: '60–90 m³', icon: '🚛' };
  return { label: 'Múltiples Unidades', range: '+90 m³', icon: '🚛🚛' };
}

function NumberInput({ label, value, onChange, min = 0, max = 99 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-foreground flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/50 transition-all"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-8 text-center font-bold text-foreground text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/50 transition-all"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = 'text', placeholder = '' }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-cyan/60 focus:shadow-glow-cyan transition-all duration-200"
      />
    </div>
  );
}

export default function CotizadorSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [step, setStep] = useState<'info' | 'type' | 'details' | 'result'>('info');
  const [ordenOpen, setOrdenOpen] = useState(false);

  // Base fields
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState('');

  // pocas_cosas
  const [cajas, setCajas] = useState(0);
  const [maletaChica, setMaletaChica] = useState(0);
  const [maletaMediana, setMaletaMediana] = useState(0);
  const [maletaGrande, setMaletaGrande] = useState(0);
  const [bolsas, setBolsas] = useState(0);
  const [bultos, setBultos] = useState(0);
  const [comentariosPocas, setComentariosPocas] = useState('');

  // objetos_sueltos
  const [sillas, setSillas] = useState(0);
  const [mesas, setMesas] = useState(0);
  const [ventiladores, setVentiladores] = useState(0);
  const [herramientas, setHerramientas] = useState(0);
  const [otrosSueltos, setOtrosSueltos] = useState(0);
  const [comentariosSueltos, setComentariosSueltos] = useState('');

  // vehiculo
  const [vehiculos, setVehiculos] = useState<VehicleEntry[]>([{
    marca: '', modelo: '', anio: '', tipo: 'sedan_chico', enciende: 'si', llaves: 'si',
  }]);

  // moto
  const [motos, setMotos] = useState<MotoEntry[]>([{
    marca: '', modelo: '', anio: '', cilindraje: '', enciende: 'si', llaves: 'si',
  }]);

  // mudanza_casa — per-room counts
  const [casa, setCasa] = useState({
    cama_king: 0, cama_matrimonial: 0, cama_individual: 0,
    sofa_3_plazas: 0, sofa_2_plazas: 0, sofa_individual: 0, sofa_cama: 0,
    comedor_6: 0, comedor_4: 0, mesa_centro: 0,
    ropero_3p: 0, ropero_2p: 0, cajones_3: 0, buros: 0, tocador: 0, librero: 0,
    refrigerador_duplex: 0, refrigerador_14: 0, estufa: 0,
    lavadora: 0, secadora: 0,
    tv_55: 0, tv_65: 0, tv_75: 0,
    escritorio: 0, silla_oficina: 0, archivero: 0, computadora: 0,
    bicicleta: 0,
    caja_estandar: 0,
  });

  // mudanza_oficina
  const [oficina, setOficina] = useState({
    escritorios: 0, sillas_oficina: 0, archiveros: 0, computadoras: 0,
    impresoras: 0, racks: 0,
    hay_elevador: 'no', requiere_maniobras: 'no', desarme_armado: 'no',
  });

  // articulos_estetica
  const [estetica, setEstetica] = useState({
    silla_peluqueria: 0, lavacabezas: 0, camilla: 0,
    carrito_auxiliar: 0, espejos: 0, otros: 0,
  });

  // otros
  const [descripcionOtros, setDescripcionOtros] = useState('');

  // Volume calculation
  function calcVolume(): number {
    if (!serviceType) return 0;
    switch (serviceType) {
      case 'pocas_cosas':
        return cajas * 0.15 + maletaChica * 0.08 + maletaMediana * 0.15 + maletaGrande * 0.25 + bolsas * 0.05 + bultos * 0.2;
      case 'objetos_sueltos':
        return sillas * 0.3 + mesas * 0.5 + ventiladores * 0.15 + herramientas * 0.1 + otrosSueltos * 0.3;
      case 'vehiculo':
        return vehiculos.length * 8;
      case 'moto':
        return motos.length * 2;
      case 'mudanza_casa':
        return Object.entries(casa).reduce((acc, [key, val]) => acc + (VOLUMES[key] || 0) * val, 0);
      case 'mudanza_oficina':
        return oficina.escritorios * 0.8 + oficina.sillas_oficina * 0.4 + oficina.archiveros * 0.5 + oficina.computadoras * 0.2 + oficina.impresoras * 0.2 + oficina.racks * 1;
      case 'articulos_estetica':
        return estetica.silla_peluqueria * 0.6 + estetica.lavacabezas * 0.8 + estetica.camilla * 0.5 + estetica.carrito_auxiliar * 0.2 + estetica.espejos * 0.3 + estetica.otros * 0.3;
      default:
        return 0;
    }
  }

  function buildWhatsAppMessage(): string {
    const vol = calcVolume().toFixed(1);
    const unit = getUnitSuggestion(calcVolume());
    const serviceLabel = serviceTypes.find(s => s.id === serviceType)?.label || serviceType;

    let details = '';
    switch (serviceType) {
      case 'pocas_cosas':
        details = `📦 Cajas: ${cajas}, Maletas chicas: ${maletaChica}, Medianas: ${maletaMediana}, Grandes: ${maletaGrande}, Bolsas: ${bolsas}, Bultos: ${bultos}${comentariosPocas ? `\n📝 Notas: ${comentariosPocas}` : ''}`;
        break;
      case 'objetos_sueltos':
        details = `🪑 Sillas: ${sillas}, Mesas: ${mesas}, Ventiladores: ${ventiladores}, Herramientas: ${herramientas}, Otros: ${otrosSueltos}${comentariosSueltos ? `\n📝 Notas: ${comentariosSueltos}` : ''}`;
        break;
      case 'vehiculo':
        details = vehiculos.map((v, i) => `🚗 Vehículo ${i + 1}: ${v.marca} ${v.modelo} ${v.anio} (${v.tipo}) - Enciende: ${v.enciende} - Llaves: ${v.llaves}`).join('\n');
        break;
      case 'moto':
        details = motos.map((m, i) => `🏍️ Moto ${i + 1}: ${m.marca} ${m.modelo} ${m.anio} (${m.cilindraje}cc) - Enciende: ${m.enciende} - Llaves: ${m.llaves}`).join('\n');
        break;
      case 'mudanza_casa':
        details = Object.entries(casa).filter(([, v]) => v > 0).map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v}`).join('\n');
        break;
      case 'mudanza_oficina':
        details = `🖥️ Escritorios: ${oficina.escritorios}, Sillas: ${oficina.sillas_oficina}, Archiveros: ${oficina.archiveros}, Computadoras: ${oficina.computadoras}, Impresoras: ${oficina.impresoras}, Racks: ${oficina.racks}\nElevador: ${oficina.hay_elevador} | Maniobras: ${oficina.requiere_maniobras} | Desarme: ${oficina.desarme_armado}`;
        break;
      case 'articulos_estetica':
        details = `✂️ Sillas peluquería: ${estetica.silla_peluqueria}, Lavacabezas: ${estetica.lavacabezas}, Camillas: ${estetica.camilla}, Carritos: ${estetica.carrito_auxiliar}, Espejos: ${estetica.espejos}, Otros: ${estetica.otros}`;
        break;
      case 'otros':
        details = `📋 Descripción: ${descripcionOtros}`;
        break;
    }

    return encodeURIComponent(
      `¡Hola! Quiero cotizar mi mudanza con *La Unión Mudanzas* 🚛\n\n` +
      `👤 *Nombre:* ${nombre}\n` +
      `📍 *Origen:* ${origen}\n` +
      `🎯 *Destino:* ${destino}\n` +
      `📅 *Fecha estimada:* ${fecha}\n` +
      `📦 *Tipo de servicio:* ${serviceLabel}\n\n` +
      `${details}\n\n` +
      `📐 *Volumen estimado:* ${vol} m³\n` +
      `🚚 *Unidad sugerida:* ${unit.icon} ${unit.label}\n\n` +
      `Esperamos tu cotización. ¡Gracias!`
    );
  }

  const canProceedInfo = nombre.trim() && whatsapp.trim() && origen.trim() && destino.trim();
  const vol = calcVolume();
  const unit = getUnitSuggestion(vol);

  const casaRooms = [
    { section: '🛏️ Recámara', keys: ['cama_king', 'cama_matrimonial', 'cama_individual', 'ropero_3p', 'ropero_2p', 'cajones_3', 'buros', 'tocador'] as const },
    { section: '🛋️ Sala', keys: ['sofa_3_plazas', 'sofa_2_plazas', 'sofa_individual', 'sofa_cama', 'mesa_centro', 'librero'] as const },
    { section: '🍽️ Comedor', keys: ['comedor_6', 'comedor_4'] as const },
    { section: '🍳 Cocina', keys: ['refrigerador_duplex', 'refrigerador_14', 'estufa'] as const },
    { section: '🧺 Lavado', keys: ['lavadora', 'secadora'] as const },
    { section: '📺 Electrónicos', keys: ['tv_55', 'tv_65', 'tv_75', 'computadora'] as const },
    { section: '🗂️ Oficina', keys: ['escritorio', 'silla_oficina', 'archivero', 'impresora'] as const },
    { section: '📦 Cajas', keys: ['caja_estandar'] as const },
  ];

  const casaLabels: Record<string, string> = {
    cama_king: 'Cama king', cama_matrimonial: 'Cama matrimonial', cama_individual: 'Cama individual',
    sofa_3_plazas: 'Sofá 3 plazas', sofa_2_plazas: 'Sofá 2 plazas', sofa_individual: 'Sillón individual', sofa_cama: 'Sofá-cama',
    comedor_6: 'Comedor 6 p.', comedor_4: 'Comedor 4 p.', mesa_centro: 'Mesa de centro',
    ropero_3p: 'Ropero 3 puertas', ropero_2p: 'Ropero 2 puertas', cajones_3: 'Cajonera', buros: 'Buró(s)', tocador: 'Tocador', librero: 'Librero',
    refrigerador_duplex: 'Refrig. dúplex', refrigerador_14: 'Refrig. normal', estufa: 'Estufa',
    lavadora: 'Lavadora', secadora: 'Secadora',
    tv_55: 'TV 55"', tv_65: 'TV 65"', tv_75: 'TV 75"+',
    escritorio: 'Escritorio', silla_oficina: 'Silla de oficina', archivero: 'Archivero', impresora: 'Impresora',
    computadora: 'Computadora/laptop',
    bicicleta: 'Bicicleta',
    caja_estandar: 'Caja estándar (7 = 1m³)',
  };

  return (
    <section id="cotizador" ref={ref} className="py-24 relative overflow-hidden">
      {/* Glow bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 via-background to-surface/20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-neon-cyan/4 blur-[120px]" />

      <div className="relative container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-orange/10 border border-neon-orange/30 text-neon-orange text-xs font-bold tracking-widest uppercase mb-4">
            <Calculator className="w-3.5 h-3.5" />
            Cotizador Express
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            Cotiza en{' '}
            <span className="text-neon-orange" style={{ textShadow: '0 0 20px hsl(24,100%,50%/0.5)' }}>
              60 segundos
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Formulario inteligente que calcula el volumen de tu mudanza y genera un mensaje listo para WhatsApp.
          </p>
        </motion.div>

        {/* Fleet images gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-10"
        >
          <p className="text-center text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">
            Nuestra flota · La unidad correcta para cada historia
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { src: trucksSmall, alt: 'Camionetas pequeña, mediana y grande – hasta 40 m³', label: 'Camionetas · hasta 40 m³' },
              { src: trucksLarge, alt: 'Camión grande 60 m³ y Camión XL 90 m³', label: 'Camiones · 60–90 m³' },
              { src: trucksTrailer, alt: 'Tráilers 40 y 53 pies – hasta 25 tons', label: 'Tráilers · +90 m³' },
            ].map((img, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden border border-neon-cyan/15 hover:border-neon-cyan/40 transition-all duration-300 group shadow-card-dark"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                  <span className="text-xs font-bold text-neon-cyan tracking-wide">{img.label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['info', 'type', 'details', 'result'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                step === s
                  ? 'bg-neon-cyan text-background border-neon-cyan shadow-glow-cyan'
                  : ['info', 'type', 'details', 'result'].indexOf(step) > i
                  ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>{i + 1}</div>
              {i < 3 && <div className={`w-8 h-px transition-all duration-300 ${['info', 'type', 'details', 'result'].indexOf(step) > i ? 'bg-neon-cyan/50' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card rounded-2xl border border-neon-cyan/20 overflow-hidden"
        >
          <div className="p-1.5 bg-gradient-to-r from-neon-cyan/20 via-neon-blue/20 to-neon-cyan/20" />

          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">

              {/* STEP 1: Basic Info */}
              {step === 'info' && (
                <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">Tus datos de contacto</h3>
                  <p className="text-muted-foreground text-sm mb-6">Solo necesitamos lo esencial para preparar tu cotización personalizada.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <InputField label="Nombre completo" name="nombre" value={nombre} onChange={setNombre} placeholder="Tu nombre" />
                    <InputField label="WhatsApp" name="whatsapp" value={whatsapp} onChange={setWhatsapp} placeholder="55 1234 5678" type="tel" />
                    <InputField label="Ciudad de origen" name="origen" value={origen} onChange={setOrigen} placeholder="Ej: CDMX, Monterrey..." />
                    <InputField label="Ciudad destino" name="destino" value={destino} onChange={setDestino} placeholder="Ej: Guadalajara, Cancún..." />
                    <div className="sm:col-span-2">
                      <InputField label="Fecha estimada del servicio" name="fecha" value={fecha} onChange={setFecha} type="date" placeholder="" />
                    </div>
                  </div>
                  <button
                    onClick={() => canProceedInfo && setStep('type')}
                    disabled={!canProceedInfo}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all duration-300"
                  >
                    Continuar <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Service Type */}
              {step === 'type' && (
                <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">¿Qué vas a enviar?</h3>
                  <p className="text-muted-foreground text-sm mb-6">Selecciona el tipo de servicio para personalizar tu cotización.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {serviceTypes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setServiceType(s.id as ServiceType)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center ${
                          serviceType === s.id
                            ? 'border-neon-cyan bg-neon-cyan/10 shadow-glow-cyan'
                            : 'border-border hover:border-neon-cyan/40 hover:bg-surface-2'
                        }`}
                      >
                        <s.icon className={`w-6 h-6 ${serviceType === s.id ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-semibold leading-tight ${serviceType === s.id ? 'text-neon-cyan' : 'text-foreground'}`}>{s.label}</span>
                        <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('info')} className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground text-sm font-semibold hover:border-neon-cyan/30 transition-all">
                      Atrás
                    </button>
                    <button
                      onClick={() => serviceType && setStep('details')}
                      disabled={!serviceType}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow-cyan transition-all duration-300"
                    >
                      Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Details */}
              {step === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">
                    Detalla tu {serviceTypes.find(s => s.id === serviceType)?.label}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">Cuanta más info nos des, más exacta será la cotización.</p>

                  {/* pocas_cosas */}
                  {serviceType === 'pocas_cosas' && (
                    <div>
                      <div className="mb-3 p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 text-xs text-neon-cyan">
                        💡 Ropa, libros, juguetes y electrodomésticos pequeños. 7 cajas estándar = 1 m³
                      </div>
                      <NumberInput label="Cajas estándar" value={cajas} onChange={setCajas} />
                      <NumberInput label="Maleta chica" value={maletaChica} onChange={setMaletaChica} />
                      <NumberInput label="Maleta mediana" value={maletaMediana} onChange={setMaletaMediana} />
                      <NumberInput label="Maleta grande" value={maletaGrande} onChange={setMaletaGrande} />
                      <NumberInput label="Bolsas" value={bolsas} onChange={setBolsas} />
                      <NumberInput label="Bultos" value={bultos} onChange={setBultos} />
                      <div className="mt-3">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Notas adicionales</label>
                        <textarea
                          value={comentariosPocas}
                          onChange={(e) => setComentariosPocas(e.target.value)}
                          placeholder="Describe artículos especiales o frágiles..."
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-cyan/60 transition-all resize-none h-20"
                        />
                      </div>
                    </div>
                  )}

                  {/* objetos_sueltos */}
                  {serviceType === 'objetos_sueltos' && (
                    <div>
                      <NumberInput label="Sillas" value={sillas} onChange={setSillas} />
                      <NumberInput label="Mesas" value={mesas} onChange={setMesas} />
                      <NumberInput label="Ventiladores" value={ventiladores} onChange={setVentiladores} />
                      <NumberInput label="Herramientas / cajas de tools" value={herramientas} onChange={setHerramientas} />
                      <NumberInput label="Otros objetos sueltos" value={otrosSueltos} onChange={setOtrosSueltos} />
                      <div className="mt-3">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Describe los objetos</label>
                        <textarea
                          value={comentariosSueltos}
                          onChange={(e) => setComentariosSueltos(e.target.value)}
                          placeholder="Especifica qué objetos incluye 'otros'..."
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-cyan/60 transition-all resize-none h-20"
                        />
                      </div>
                    </div>
                  )}

                  {/* vehiculo */}
                  {serviceType === 'vehiculo' && (
                    <div className="space-y-5">
                      {vehiculos.map((v, i) => (
                        <div key={i} className="p-4 rounded-xl bg-surface border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-foreground text-sm">Vehículo {i + 1}</span>
                            {i > 0 && (
                              <button onClick={() => setVehiculos(vehiculos.filter((_, j) => j !== i))} className="text-destructive text-xs hover:underline">Eliminar</button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="Marca" name={`marca-${i}`} value={v.marca} onChange={(val) => setVehiculos(vehiculos.map((vv, j) => j === i ? { ...vv, marca: val } : vv))} placeholder="Toyota" />
                            <InputField label="Modelo" name={`modelo-${i}`} value={v.modelo} onChange={(val) => setVehiculos(vehiculos.map((vv, j) => j === i ? { ...vv, modelo: val } : vv))} placeholder="Corolla" />
                            <InputField label="Año" name={`anio-${i}`} value={v.anio} onChange={(val) => setVehiculos(vehiculos.map((vv, j) => j === i ? { ...vv, anio: val } : vv))} placeholder="2021" />
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</label>
                              <select value={v.tipo} onChange={(e) => setVehiculos(vehiculos.map((vv, j) => j === i ? { ...vv, tipo: e.target.value } : vv))} className="bg-surface border border-border rounded-xl px-3 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all">
                                <option value="sedan_chico">Sedán chico</option>
                                <option value="sedan_mediano">Sedán mediano</option>
                                <option value="sedan_grande">Sedán grande</option>
                                <option value="pickup_chica">Pickup chica</option>
                                <option value="pickup_grande">Pickup grande / Van</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">¿Enciende?</label>
                              <select value={v.enciende} onChange={(e) => setVehiculos(vehiculos.map((vv, j) => j === i ? { ...vv, enciende: e.target.value } : vv))} className="bg-surface border border-border rounded-xl px-3 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all">
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">¿Tiene llaves?</label>
                              <select value={v.llaves} onChange={(e) => setVehiculos(vehiculos.map((vv, j) => j === i ? { ...vv, llaves: e.target.value } : vv))} className="bg-surface border border-border rounded-xl px-3 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all">
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVehiculos([...vehiculos, { marca: '', modelo: '', anio: '', tipo: 'sedan_chico', enciende: 'si', llaves: 'si' }])}
                        className="flex items-center gap-2 text-neon-cyan text-sm font-semibold hover:gap-3 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" /> Agregar otro vehículo
                      </button>
                    </div>
                  )}

                  {/* moto */}
                  {serviceType === 'moto' && (
                    <div className="space-y-5">
                      {motos.map((m, i) => (
                        <div key={i} className="p-4 rounded-xl bg-surface border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-foreground text-sm">Moto {i + 1}</span>
                            {i > 0 && (
                              <button onClick={() => setMotos(motos.filter((_, j) => j !== i))} className="text-destructive text-xs hover:underline">Eliminar</button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <InputField label="Marca" name={`moto-marca-${i}`} value={m.marca} onChange={(val) => setMotos(motos.map((mm, j) => j === i ? { ...mm, marca: val } : mm))} placeholder="Honda" />
                            <InputField label="Modelo" name={`moto-modelo-${i}`} value={m.modelo} onChange={(val) => setMotos(motos.map((mm, j) => j === i ? { ...mm, modelo: val } : mm))} placeholder="CB150" />
                            <InputField label="Año" name={`moto-anio-${i}`} value={m.anio} onChange={(val) => setMotos(motos.map((mm, j) => j === i ? { ...mm, anio: val } : mm))} placeholder="2022" />
                            <InputField label="Cilindraje (cc)" name={`moto-cc-${i}`} value={m.cilindraje} onChange={(val) => setMotos(motos.map((mm, j) => j === i ? { ...mm, cilindraje: val } : mm))} placeholder="150" />
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">¿Enciende?</label>
                              <select value={m.enciende} onChange={(e) => setMotos(motos.map((mm, j) => j === i ? { ...mm, enciende: e.target.value } : mm))} className="bg-surface border border-border rounded-xl px-3 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all">
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">¿Tiene llaves?</label>
                              <select value={m.llaves} onChange={(e) => setMotos(motos.map((mm, j) => j === i ? { ...mm, llaves: e.target.value } : mm))} className="bg-surface border border-border rounded-xl px-3 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all">
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setMotos([...motos, { marca: '', modelo: '', anio: '', cilindraje: '', enciende: 'si', llaves: 'si' }])} className="flex items-center gap-2 text-neon-cyan text-sm font-semibold">
                        <Plus className="w-4 h-4" /> Agregar otra moto
                      </button>
                    </div>
                  )}

                  {/* mudanza_casa */}
                  {serviceType === 'mudanza_casa' && (
                    <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
                      {casaRooms.map((room) => (
                        <div key={room.section}>
                          <h4 className="font-display font-bold text-sm text-foreground mb-2">{room.section}</h4>
                          {room.keys.map((k) => (
                            <NumberInput
                              key={k}
                              label={casaLabels[k] || k}
                              value={casa[k as keyof typeof casa]}
                              onChange={(val) => setCasa({ ...casa, [k]: val })}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* mudanza_oficina */}
                  {serviceType === 'mudanza_oficina' && (
                    <div>
                      <NumberInput label="Escritorios" value={oficina.escritorios} onChange={(v) => setOficina({ ...oficina, escritorios: v })} />
                      <NumberInput label="Sillas de oficina" value={oficina.sillas_oficina} onChange={(v) => setOficina({ ...oficina, sillas_oficina: v })} />
                      <NumberInput label="Archiveros" value={oficina.archiveros} onChange={(v) => setOficina({ ...oficina, archiveros: v })} />
                      <NumberInput label="Computadoras" value={oficina.computadoras} onChange={(v) => setOficina({ ...oficina, computadoras: v })} />
                      <NumberInput label="Impresoras" value={oficina.impresoras} onChange={(v) => setOficina({ ...oficina, impresoras: v })} />
                      <NumberInput label="Racks / servidores" value={oficina.racks} onChange={(v) => setOficina({ ...oficina, racks: v })} />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        {[
                          { label: '¿Hay elevador?', key: 'hay_elevador' as const },
                          { label: '¿Requiere maniobras?', key: 'requiere_maniobras' as const },
                          { label: '¿Desarme/armado?', key: 'desarme_armado' as const },
                        ].map(({ label, key }) => (
                          <div key={key} className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                            <select value={oficina[key]} onChange={(e) => setOficina({ ...oficina, [key]: e.target.value })} className="bg-surface border border-border rounded-xl px-3 py-3 text-foreground text-sm focus:outline-none focus:border-neon-cyan/60 transition-all">
                              <option value="si">Sí</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* articulos_estetica */}
                  {serviceType === 'articulos_estetica' && (
                    <div>
                      <NumberInput label="Sillas de peluquería" value={estetica.silla_peluqueria} onChange={(v) => setEstetica({ ...estetica, silla_peluqueria: v })} />
                      <NumberInput label="Lavacabezas" value={estetica.lavacabezas} onChange={(v) => setEstetica({ ...estetica, lavacabezas: v })} />
                      <NumberInput label="Camillas" value={estetica.camilla} onChange={(v) => setEstetica({ ...estetica, camilla: v })} />
                      <NumberInput label="Carritos auxiliares" value={estetica.carrito_auxiliar} onChange={(v) => setEstetica({ ...estetica, carrito_auxiliar: v })} />
                      <NumberInput label="Espejos grandes" value={estetica.espejos} onChange={(v) => setEstetica({ ...estetica, espejos: v })} />
                      <NumberInput label="Otros artículos" value={estetica.otros} onChange={(v) => setEstetica({ ...estetica, otros: v })} />
                    </div>
                  )}

                  {/* otros */}
                  {serviceType === 'otros' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Descripción detallada</label>
                      <textarea
                        value={descripcionOtros}
                        onChange={(e) => setDescripcionOtros(e.target.value)}
                        placeholder="Describe qué necesitas mover, cuántos artículos aproximadamente, si hay algo especial o de gran tamaño..."
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-cyan/60 transition-all resize-none h-32"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep('type')} className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground text-sm font-semibold hover:border-neon-cyan/30 transition-all">
                      Atrás
                    </button>
                    <button
                      onClick={() => setStep('result')}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-bold text-sm hover:shadow-glow-cyan transition-all duration-300"
                    >
                      Ver resultado <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Result */}
              {step === 'result' && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan mb-4 shadow-glow-cyan">
                      <Truck className="w-8 h-8 text-neon-cyan" />
                    </div>
                    <h3 className="font-display text-2xl font-black text-foreground mb-1">¡Cotización lista!</h3>
                    <p className="text-muted-foreground text-sm">Hola <strong className="text-foreground">{nombre}</strong>, estimamos tu mudanza en:</p>
                  </div>

                  {/* Result card */}
                  <div className="rounded-2xl border border-neon-cyan/40 bg-neon-cyan/5 shadow-glow-cyan p-6 mb-5 text-center">
                    <div className="font-display text-5xl font-black text-neon-cyan text-glow-cyan mb-1">
                      {vol > 0 ? `${vol.toFixed(1)} m³` : '—'}
                    </div>
                    <div className="text-muted-foreground text-sm mb-4">Volumen estimado total</div>
                    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-background/60 border border-neon-cyan/20">
                      <span className="text-2xl">{unit.icon}</span>
                      <div className="text-left">
                        <div className="font-display font-bold text-foreground">{unit.label}</div>
                        <div className="text-muted-foreground text-xs">Unidad sugerida · {unit.range}</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-surface border border-border p-4 mb-5 text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servicio</span>
                      <span className="text-foreground font-medium">{serviceTypes.find(s => s.id === serviceType)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Origen → Destino</span>
                      <span className="text-foreground font-medium">{origen} → {destino}</span>
                    </div>
                    {fecha && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha estimada</span>
                        <span className="text-foreground font-medium">{fecha}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA buttons */}
                  <div className="space-y-3">
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-neon-green text-background font-bold text-base hover:shadow-glow-green transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Enviar cotización por WhatsApp
                    </a>
                    <button
                      onClick={() => { setStep('info'); setServiceType(null); }}
                      className="w-full px-6 py-3 rounded-xl border border-border text-muted-foreground text-sm font-semibold hover:border-neon-cyan/30 hover:text-foreground transition-all"
                    >
                      Nueva cotización
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
