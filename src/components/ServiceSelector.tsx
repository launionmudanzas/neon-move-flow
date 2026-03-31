/**
 * ServiceSelector — Visual card grid for choosing service type
 * First step in the unified quotation flow
 */
import { motion } from 'framer-motion';
import {
  Home, Building2, Users, Truck, Package, Car,
  Warehouse, Sparkles,
} from 'lucide-react';

export interface ServiceOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const SERVICES: ServiceOption[] = [
  { id: 'residencial', label: 'Mudanza Residencial', icon: <Home className="w-6 h-6" />, description: 'Casa o departamento' },
  { id: 'oficina', label: 'Mudanza de Oficina', icon: <Building2 className="w-6 h-6" />, description: 'Corporativo y comercial' },
  { id: 'compartido', label: 'Servicio Compartido', icon: <Users className="w-6 h-6" />, description: 'Comparte espacio, ahorra más' },
  { id: 'directo', label: 'Servicio Directo', icon: <Truck className="w-6 h-6" />, description: 'Camión exclusivo para ti' },
  { id: 'paqueteria', label: 'Paquetería', icon: <Package className="w-6 h-6" />, description: 'Envío de cajas y paquetes' },
  { id: 'vehiculos', label: 'Traslado de Vehículos', icon: <Car className="w-6 h-6" />, description: 'Autos y motos' },
  { id: 'almacenaje', label: 'Almacenaje', icon: <Warehouse className="w-6 h-6" />, description: 'Guarda temporal segura' },
  { id: 'especial', label: 'Servicio Especial', icon: <Sparkles className="w-6 h-6" />, description: 'Maniobras, grúa, volados' },
];

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export default function ServiceSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {SERVICES.map((svc, i) => {
        const isActive = selected === svc.id;
        return (
          <motion.button
            key={svc.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            onClick={() => onSelect(svc.id)}
            className={`group relative flex flex-col items-center text-center gap-2 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-neon-cyan/10 border-neon-cyan/50 shadow-[0_0_20px_hsl(180_100%_50%/0.1)]'
                : 'bg-surface border-border hover:border-neon-cyan/30 hover:bg-surface/80'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isActive
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'bg-muted text-muted-foreground group-hover:text-neon-cyan group-hover:bg-neon-cyan/10'
            }`}>
              {svc.icon}
            </div>
            <div>
              <p className={`text-sm font-bold leading-tight ${isActive ? 'text-neon-cyan' : 'text-foreground'}`}>
                {svc.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{svc.description}</p>
            </div>
            {isActive && (
              <motion.div
                layoutId="service-indicator"
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
