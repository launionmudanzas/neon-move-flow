/**
 * CalificacionServicio — Client rating form for post-service evaluation
 * 5 dimensions: puntualidad, trato, cuidado_carga, cumplimiento, experiencia_general
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { registrarBitacora } from '@/lib/bitacora-service';

interface Props {
  ordenId: string;
  proveedorId: string;
  cotizacionId?: string;
  clienteId?: string;
  onComplete?: () => void;
}

const DIMENSIONES = [
  { key: 'puntualidad', label: 'Puntualidad', emoji: '⏰', desc: '¿Llegaron a tiempo?' },
  { key: 'trato', label: 'Trato', emoji: '🤝', desc: '¿Fueron amables y profesionales?' },
  { key: 'cuidado_carga', label: 'Cuidado de la carga', emoji: '📦', desc: '¿Cuidaron tus pertenencias?' },
  { key: 'cumplimiento', label: 'Cumplimiento', emoji: '✅', desc: '¿Cumplieron lo acordado?' },
  { key: 'experiencia_general', label: 'Experiencia general', emoji: '⭐', desc: '¿Cómo fue tu experiencia?' },
] as const;

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              i <= (hover || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function CalificacionServicio({ ordenId, proveedorId, cotizacionId, clienteId, onComplete }: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const allRated = DIMENSIONES.every(d => (ratings[d.key] ?? 0) > 0);
  const promedio = allRated
    ? +(DIMENSIONES.reduce((sum, d) => sum + (ratings[d.key] ?? 0), 0) / DIMENSIONES.length).toFixed(2)
    : 0;

  const handleSubmit = async () => {
    if (!allRated) return;
    setSending(true);
    try {
      await supabase.from('calificaciones_servicio').insert({
        orden_id: ordenId,
        proveedor_id: proveedorId,
        cotizacion_id: cotizacionId ?? null,
        cliente_id: clienteId ?? null,
        puntualidad: ratings.puntualidad,
        trato: ratings.trato,
        cuidado_carga: ratings.cuidado_carga,
        cumplimiento: ratings.cumplimiento,
        experiencia_general: ratings.experiencia_general,
        promedio,
        comentario: comentario.trim() || null,
      });
      await registrarBitacora({
        ordenId,
        cotizacionId,
        evento: 'calificacion_enviada',
        descripcion: `Promedio: ${promedio} ★`,
      });
      setSent(true);
      onComplete?.();
    } catch {
      console.error('Error saving rating');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center"
      >
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-foreground mb-1">¡Gracias por tu calificación!</h3>
        <p className="text-sm text-muted-foreground">Tu opinión nos ayuda a mejorar el servicio</p>
        <p className="mt-3 text-2xl font-black text-yellow-400">{promedio.toFixed(1)} ★</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 space-y-5"
    >
      <div>
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" /> Califica tu servicio
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Tu calificación ayuda a mantener la calidad de la red</p>
      </div>

      <div className="space-y-4">
        {DIMENSIONES.map(d => (
          <div key={d.key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{d.emoji} {d.label}</p>
              <p className="text-[10px] text-muted-foreground">{d.desc}</p>
            </div>
            <StarRating value={ratings[d.key] ?? 0} onChange={v => setRatings(prev => ({ ...prev, [d.key]: v }))} />
          </div>
        ))}
      </div>

      {allRated && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-xs text-muted-foreground">Promedio</p>
          <p className="text-2xl font-black text-yellow-400">{promedio.toFixed(1)} ★</p>
        </motion.div>
      )}

      <Textarea
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="¿Algo que quieras agregar? (opcional)"
        className="bg-background border-border min-h-[80px]"
      />

      <Button onClick={handleSubmit} disabled={!allRated || sending} className="w-full gap-2">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Enviar calificación
      </Button>
    </motion.div>
  );
}
