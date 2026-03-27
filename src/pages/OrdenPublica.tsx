/**
 * OrdenPublica — Public order page accessible via /orden/:folio
 * Shows order details, contract, terms, privacy links, documents & evidence
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, MapPin, Truck, Package, Calendar, CreditCard, Shield, CheckCircle2,
  AlertTriangle, ExternalLink, Loader2, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrdenData {
  folio: string;
  origen: string | null;
  destino: string | null;
  fecha_salida: string | null;
  fecha_llegada: string | null;
  tipo_servicio: string | null;
  modalidad: string | null;
  unidad_sugerida: string | null;
  volumen_total: number | null;
  volumen_cobrable: number | null;
  precio_total: number | null;
  precio_base: number | null;
  estatus: string | null;
  cliente_acepto: boolean;
  horario_carga: string | null;
  horario_entrega: string | null;
  peso: number | null;
  comentarios_especiales: string | null;
  clientes: { nombre_completo: string } | null;
}

interface OrdenServicio {
  folio: string | null;
  pdf_url: string | null;
  estatus: string | null;
}

interface Evidencia {
  id: string;
  tipo: string;
  url: string;
  descripcion: string | null;
  created_at: string;
}

function formatDate(d: string | null): string {
  if (!d) return 'Por confirmar';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return d; }
}

function fmxn(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  cotizado: 'bg-muted text-muted-foreground',
  confirmado: 'bg-neon-green/15 text-neon-green border-neon-green/30',
  en_ruta: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30',
  finalizado: 'bg-foreground/10 text-foreground',
  cancelado: 'bg-destructive/15 text-destructive',
};

export default function OrdenPublica() {
  const { folio } = useParams<{ folio: string }>();
  const [loading, setLoading] = useState(true);
  const [orden, setOrden] = useState<OrdenData | null>(null);
  const [ordenServicio, setOrdenServicio] = useState<OrdenServicio | null>(null);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folio) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch cotización by folio
        const { data: cot, error: cotErr } = await supabase
          .from('cotizaciones')
          .select(`
            folio, origen, destino, fecha_salida, fecha_llegada,
            tipo_servicio, modalidad, unidad_sugerida, volumen_total,
            volumen_cobrable, precio_total, precio_base, estatus,
            cliente_acepto, horario_carga, horario_entrega, peso,
            comentarios_especiales,
            clientes!cotizaciones_cliente_id_fkey(nombre_completo)
          `)
          .eq('folio', folio)
          .maybeSingle();

        if (cotErr || !cot) {
          setError('Orden no encontrada');
          setLoading(false);
          return;
        }

        setOrden(cot as unknown as OrdenData);

        // Fetch orden_servicio
        const { data: os } = await supabase
          .from('ordenes_servicio')
          .select('folio, pdf_url, estatus')
          .eq('cotizacion_id', (cot as any).id || '')
          .maybeSingle();
        if (os) setOrdenServicio(os as OrdenServicio);

        // Fetch evidencias
        const { data: evs } = await supabase
          .from('evidencias_servicio')
          .select('id, tipo, url, descripcion, created_at')
          .eq('cotizacion_id', (cot as any).id || '')
          .order('created_at', { ascending: false });
        if (evs) setEvidencias(evs as Evidencia[]);
      } catch {
        setError('Error cargando la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-neon-orange mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{error || 'Orden no encontrada'}</h1>
          <p className="text-muted-foreground mb-6">Verifica el folio e intenta de nuevo.</p>
          <Link to="/" className="text-neon-cyan hover:underline flex items-center gap-2 justify-center">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[orden.estatus || ''] || STATUS_COLORS.cotizado;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-surface to-background border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link to="/" className="text-neon-cyan hover:underline text-sm flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-black text-foreground">Orden de Servicio</h1>
              <p className="text-neon-cyan font-mono font-bold text-lg mt-1">{orden.folio}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize ${statusColor}`}>
              {orden.estatus || 'cotizado'}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Service details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-neon-cyan" /> Detalle del servicio
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Cliente', value: orden.clientes?.nombre_completo, icon: '👤' },
              { label: 'Ruta', value: `${orden.origen || '—'} → ${orden.destino || '—'}`, icon: '🗺️' },
              { label: 'Fecha de carga', value: formatDate(orden.fecha_salida), icon: '📅' },
              { label: 'Fecha estimada de entrega', value: formatDate(orden.fecha_llegada), icon: '📦' },
              { label: 'Tipo de servicio', value: orden.tipo_servicio || '—', icon: '📋' },
              { label: 'Modalidad', value: orden.modalidad || '—', icon: '🚛' },
              { label: 'Unidad', value: orden.unidad_sugerida || '—', icon: '🚚' },
              { label: 'Volumen', value: orden.volumen_cobrable ? `${orden.volumen_cobrable} m³` : '—', icon: '📐' },
              ...(orden.peso ? [{ label: 'Peso', value: `${orden.peso} kg`, icon: '⚖️' }] : []),
              ...(orden.horario_carga ? [{ label: 'Horario de carga', value: orden.horario_carga, icon: '🕐' }] : []),
              ...(orden.horario_entrega ? [{ label: 'Horario de entrega', value: orden.horario_entrega, icon: '🕕' }] : []),
            ].map(({ label, value, icon }) => (
              <div key={label} className="p-3 rounded-xl bg-background border border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{icon} {label}</p>
                <p className="text-sm font-semibold text-foreground">{value || '—'}</p>
              </div>
            ))}
          </div>

          {orden.comentarios_especiales && (
            <div className="mt-4 p-3 rounded-xl bg-neon-orange/5 border border-neon-orange/20">
              <p className="text-xs font-bold text-neon-orange mb-1">Comentarios especiales</p>
              <p className="text-sm text-foreground">{orden.comentarios_especiales}</p>
            </div>
          )}
        </motion.div>

        {/* Pricing */}
        {orden.precio_total && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-neon-green" /> Precio del servicio
            </h2>
            <div className="text-center">
              <p className="font-display text-4xl font-black text-foreground">{fmxn(orden.precio_total)}</p>
              <p className="text-sm text-muted-foreground mt-1">Precio total del servicio</p>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 text-xs text-muted-foreground">
              <p><strong className="text-neon-orange">Forma de pago:</strong> Apartado inicial → 50% al cargar → Resto antes de la descarga</p>
            </div>
          </motion.div>
        )}

        {/* Documents */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-purple" /> Documentos y legal
          </h2>

          <div className="space-y-3">
            {ordenServicio?.pdf_url && (
              <a href={ordenServicio.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 hover:bg-neon-cyan/10 transition-colors">
                <FileText className="w-5 h-5 text-neon-cyan" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Orden de servicio (PDF)</p>
                  <p className="text-xs text-muted-foreground">Descarga o visualiza tu orden</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Link to="/terminos-y-condiciones" target="_blank"
                className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-neon-cyan/30 transition-colors">
                <FileText className="w-4 h-4 text-neon-cyan" />
                <span className="text-xs font-medium text-foreground">Términos y Condiciones</span>
              </Link>
              <Link to="/aviso-de-privacidad" target="_blank"
                className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border hover:border-neon-purple/30 transition-colors">
                <Shield className="w-4 h-4 text-neon-purple" />
                <span className="text-xs font-medium text-foreground">Aviso de Privacidad</span>
              </Link>
            </div>

            {orden.cliente_acepto && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/10 border border-neon-green/30">
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                <span className="text-xs font-bold text-neon-green">Términos aceptados digitalmente por el cliente</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Evidence */}
        {evidencias.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-neon-orange" /> Evidencias ({evidencias.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {evidencias.map(ev => (
                <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                  className="rounded-xl border border-border overflow-hidden hover:border-neon-cyan/30 transition-colors">
                  <img src={ev.url} alt={ev.descripcion || ev.tipo} className="w-full h-24 object-cover" />
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{ev.tipo}</p>
                    {ev.descripcion && <p className="text-xs text-foreground truncate">{ev.descripcion}</p>}
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Institutional footer */}
        <div className="p-6 rounded-2xl bg-surface border border-border text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
            <strong className="text-foreground">LA UNIÓN MUDANZAS</strong> opera como una red nacional de transporte consolidada y confiable,
            integrada por proveedores previamente evaluados, verificados y aprobados por su Consejo de Coordinación Nacional.
            La plataforma coordina, respalda y vincula la operación logística del servicio,
            siendo el proveedor asignado quien ejecuta directamente el traslado.
          </p>
        </div>
      </div>
    </div>
  );
}