import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, CheckCircle2, MessageSquare, AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { sendServiceEmail } from '@/lib/email-service';
import LegalAcceptanceBlock from '@/components/LegalAcceptanceBlock';

import { siteConfig } from '@/lib/site-config';
const WHATSAPP_NUMBER = siteConfig.whatsApp;

interface OrdenServicioProps {
  isOpen: boolean;
  onClose: () => void;
  onPagar?: () => void;
  data: {
    nombre: string;
    whatsapp: string;
    origen: string;
    destino: string;
    fecha: string;
    serviceLabel: string;
    vol: string;
    unitLabel: string;
    unitIcon: string;
    folio?: string;
    precioTotal?: number;
    cotizacionId?: string;
  };
}

function generateFolio(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `LUM-${year}${month}${day}-${rand}`;
}

function getDeliveryDate(fecha: string): string {
  if (!fecha) return 'Por confirmar';
  try {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return 'Por confirmar';
  }
}

function formatDate(fecha: string): string {
  if (!fecha) return 'Por confirmar';
  try {
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return fecha;
  }
}

const INCLUDES = [
  'Carga y descarga de artículos (a criterio del equipo)',
  'Embalaje básico de protección',
  'Mano de obra de operadores',
  'Seguimiento en ruta',
  'Orden de servicio digital',
];

const NOT_INCLUDES = [
  'Maniobras especiales no cotizadas',
  'Pisos adicionales no informados',
  'Volumen extra al cotizado',
  'Materiales de embalaje especializados',
  'Acarreos de larga distancia no pactados',
];

export default function OrdenServicioModal({ isOpen, onClose, onPagar, data }: OrdenServicioProps) {
  const [accepted, setAccepted] = useState(false);
  const [folio] = useState(() => data.folio || generateFolio());
  const emisionDate = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleAcceptedChange = useCallback((val: boolean) => setAccepted(val), []);

  const waMessage = encodeURIComponent(
    `¡Hola! Confirmo mi servicio con *La Unión Mudanzas* 🚛\n\n` +
    `📋 *Folio:* ${folio}\n` +
    `👤 *Cliente:* ${data.nombre}\n` +
    `📍 *Origen:* ${data.origen}\n` +
    `🎯 *Destino:* ${data.destino}\n` +
    `📅 *Fecha de carga:* ${formatDate(data.fecha)}\n` +
    `📦 *Servicio:* ${data.serviceLabel}\n` +
    `📐 *Volumen:* ${data.vol} m³\n` +
    `🚚 *Unidad sugerida:* ${data.unitIcon} ${data.unitLabel}\n\n` +
    `He aceptado los términos y condiciones del servicio.\n` +
    `¡Quedamos en contacto!`
  );

  if (!isOpen) return null;

  // Remove fixed-anticipo references; apartado is chosen in PagoModal

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto glass-card rounded-t-3xl sm:rounded-2xl border border-neon-cyan/20 shadow-glow-cyan"
        >
          {/* Top bar */}
          <div className="p-1.5 bg-gradient-to-r from-neon-cyan/20 via-neon-blue/20 to-neon-cyan/20 rounded-t-3xl sm:rounded-t-2xl" />

          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl text-foreground">Orden de Servicio</h2>
                  <p className="text-neon-cyan text-xs font-mono font-bold">{folio}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Service details */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Fecha de emisión', value: emisionDate },
                { label: 'Cliente', value: data.nombre },
                { label: 'WhatsApp', value: data.whatsapp },
                { label: 'Origen', value: data.origen },
                { label: 'Destino', value: data.destino },
                { label: 'Servicio', value: data.serviceLabel },
                { label: 'Fecha de carga', value: formatDate(data.fecha) },
                { label: 'Fecha estimada de entrega', value: getDeliveryDate(data.fecha) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-surface border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{value || '—'}</p>
                </div>
              ))}
            </div>

            {/* Volume + unit */}
            <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 mb-6 flex items-center gap-4">
              <div className="text-3xl">{data.unitIcon}</div>
              <div>
                <p className="font-display font-black text-foreground text-lg">{data.unitLabel}</p>
                <p className="text-muted-foreground text-sm">Volumen estimado: <span className="text-neon-cyan font-bold">{data.vol} m³</span></p>
              </div>
              {data.precioTotal && (
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Precio total</p>
                  <p className="font-black text-xl text-neon-green">${data.precioTotal.toLocaleString('es-MX')}</p>
                </div>
              )}
            </div>

            {/* Includes / Not includes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
                <p className="font-bold text-neon-green text-sm mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Incluye
                </p>
                <ul className="space-y-1.5">
                  {INCLUDES.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-neon-green mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="font-bold text-destructive text-sm mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> No incluye / Costos extra
                </p>
                <ul className="space-y-1.5">
                  {NOT_INCLUDES.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Payment note */}
            <div className="p-4 rounded-xl bg-neon-orange/10 border border-neon-orange/30 mb-6 text-sm text-foreground">
              <p className="font-bold text-neon-orange mb-2">Forma de pago</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                El apartado asegura tu servicio. El saldo restante se liquida:{' '}
                <strong className="text-foreground">50% al cargar</strong> y{' '}
                <strong className="text-foreground">50% antes de la descarga</strong>.{' '}
                <strong className="text-neon-orange">No se permiten pagos posteriores a la descarga.</strong>
              </p>
            </div>

            {/* Legal acceptance block */}
            <div className="mb-6">
              <LegalAcceptanceBlock accepted={accepted} onAcceptedChange={handleAcceptedChange} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {/* Pay button - primary CTA */}
              {onPagar && data.precioTotal && (
                <button
                  onClick={() => {
                    if (!accepted) return;
                    void sendServiceEmail({
                      type: 'orden_servicio',
                      folio: folio,
                      customer_name: data.nombre,
                      route: `${data.origen} → ${data.destino}`,
                      service_date: formatDate(data.fecha),
                      delivery_date: getDeliveryDate(data.fecha),
                      service_type: data.serviceLabel,
                      volume: data.vol,
                      unit: data.unitLabel,
                      amount: data.precioTotal,
                    });
                    onPagar();
                  }}
                  disabled={!accepted}
                  className={`flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl font-black text-base transition-all duration-300 ${
                    accepted
                      ? 'bg-gradient-to-r from-neon-orange to-yellow-500 text-background hover:shadow-glow-orange hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Apartar mi servicio
                </button>
              )}

              {/* WhatsApp confirm */}
              <a
                href={accepted ? `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}` : '#'}
                target={accepted ? '_blank' : '_self'}
                rel="noopener noreferrer"
                onClick={(e) => { if (!accepted) e.preventDefault(); }}
                className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  accepted
                    ? 'bg-neon-green text-background hover:shadow-glow-green hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Confirmar por WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
