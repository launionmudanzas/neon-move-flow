/**
 * AsesorBanner — Shows "Este servicio requiere asesor" for complex quotes
 * Triggers when: volume > 90m³, incomplete data, or desconocida routes
 */
import { AlertTriangle, MessageSquare, Phone } from 'lucide-react';

import { siteConfig } from '@/lib/site-config';
const WHATSAPP_NUMBER = siteConfig.whatsApp;

interface Props {
  reason: string;
  nombre?: string;
  origen?: string;
  destino?: string;
  volumen?: number;
}

export default function AsesorBanner({ reason, nombre, origen, destino, volumen }: Props) {
  const waMsg = encodeURIComponent(
    `Hola, necesito asesoría para mi mudanza 🚛\n\n` +
    `👤 Nombre: ${nombre || 'No proporcionado'}\n` +
    `📍 Ruta: ${origen || '?'} → ${destino || '?'}\n` +
    `📦 Volumen: ${volumen ? `${volumen} m³` : 'Por confirmar'}\n` +
    `📋 Motivo: ${reason}\n\n` +
    `_#LaUnionMudanzas_`
  );

  return (
    <div className="p-5 rounded-2xl bg-neon-orange/10 border-2 border-neon-orange/30 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-neon-orange/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-neon-orange" />
        </div>
        <div>
          <h4 className="font-display font-black text-foreground text-base">
            Este servicio requiere asesor
          </h4>
          <p className="text-xs text-muted-foreground mt-1">{reason}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neon-green text-background font-bold text-sm hover:shadow-glow-green hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          👉 Contactar asesor
        </a>
        <a
          href={`tel:${WHATSAPP_NUMBER}`}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-border text-foreground font-bold text-sm hover:border-neon-cyan/50 transition-all"
        >
          <Phone className="w-4 h-4" />
          Llamar
        </a>
      </div>
    </div>
  );
}
