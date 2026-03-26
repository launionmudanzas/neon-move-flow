/**
 * OrdenGeneradaModal — La Unión Mudanzas
 * Shown after a successful apartado + PDF generation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, MessageSquare, FileText, X, Loader2, AlertTriangle } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/whatsapp-messages';

const WHATSAPP_NUMBER = '4421270514';

interface OrdenGeneradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  folio: string;
  pdfUrl?: string | null;
  loading?: boolean;
  error?: string | null;
  apartado?: number;
  metodoPago?: string;
  data: {
    nombre: string;
    origen: string;
    destino: string;
    fecha: string;
    unitLabel: string;
    vol: string;
    precioTotal: number;
    tipoServicio?: string;
    whatsapp?: string;
  };
}

export default function OrdenGeneradaModal({
  isOpen, onClose, folio, pdfUrl, loading, error, apartado, metodoPago, data,
}: OrdenGeneradaModalProps) {
  if (!isOpen) return null;

  const apartadoPagado = apartado ?? Math.ceil(data.precioTotal * 0.3);
  const alCargar = Math.ceil(data.precioTotal * 0.5);
  const antesDescargar = data.precioTotal - apartadoPagado - alCargar;

  const waMessage = encodeURIComponent(
    `¡Hola! Confirmé mi servicio con *La Unión Mudanzas* 🚛\n\n` +
    `📋 *Folio:* ${folio}\n` +
    `👤 *Cliente:* ${data.nombre}\n` +
    `📍 *Ruta:* ${data.origen} → ${data.destino}\n` +
    `📅 *Fecha:* ${data.fecha}\n` +
    `🚚 *Unidad:* ${data.unitLabel}\n` +
    `📐 *Volumen:* ${data.vol} m³\n` +
    `💰 *Apartado pagado:* $${apartadoPagado.toLocaleString('es-MX')} MXN\n` +
    `📊 *50% del total al cargar:* $${alCargar.toLocaleString('es-MX')} MXN\n` +
    `📊 *Resto antes de descargar:* $${antesDescargar.toLocaleString('es-MX')} MXN\n\n` +
    `Mi orden de servicio fue generada automáticamente. ¡Quedo en contacto!`
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/90 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative glass-card rounded-3xl border border-neon-green/40 p-8 max-w-sm w-full shadow-glow-green text-center"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
            className="w-20 h-20 rounded-full bg-neon-green/10 border-2 border-neon-green flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle2 className="w-10 h-10 text-neon-green" />
          </motion.div>

          <h3 className="font-display font-black text-2xl text-foreground mb-1">¡Servicio apartado!</h3>
          <p className="text-neon-cyan font-mono font-bold text-sm mb-1">{folio}</p>
          <p className="text-muted-foreground text-xs mb-5">
            Tu orden de servicio fue creada y guardada automáticamente.
          </p>

          {loading && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface border border-border mb-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
              Generando tu PDF…
            </div>
          )}
          {error && !loading && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive mb-4 text-left">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={`${folio}.pdf`}
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-background font-black text-sm hover:shadow-glow-cyan hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                Descargar Orden de Servicio PDF
              </a>
            )}

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-neon-green text-background font-bold text-sm hover:shadow-glow-green hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
            >
              <MessageSquare className="w-4 h-4" />
              Seguimiento por WhatsApp
            </a>

            {/* Payment breakdown summary */}
            <div className="p-3 rounded-xl bg-surface border border-border text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Desglose de pagos
              </p>
              {[
                ['Precio total', `$${data.precioTotal.toLocaleString('es-MX')} MXN`],
                ['Apartado pagado', `$${apartadoPagado.toLocaleString('es-MX')} MXN`],
                ['50% del total al cargar', `$${alCargar.toLocaleString('es-MX')} MXN`],
                ['Resto antes de descargar', `$${antesDescargar.toLocaleString('es-MX')} MXN`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                No se permiten pagos posteriores a la descarga.
              </p>
            </div>

            <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
