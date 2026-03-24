/**
 * CalendarioOperativo — Full operational calendar for La Unión Mudanzas
 * Views: monthly / weekly / daily
 * Color-coded by service status
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, List,
  MapPin, Package, Truck, Clock, AlertTriangle,
  CheckCircle2, Circle, Edit2, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { openWhatsApp } from '@/lib/whatsapp-messages';

interface EventoCalendario {
  id: string;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estatus: string | null;
  color: string | null;
  cotizacion_id: string | null;
  cliente_id: string | null;
  observaciones: string | null;
  proveedor_id: string | null;
  created_at: string;
  // Joined
  cotizaciones?: {
    origen: string | null; destino: string | null;
    precio_total: number | null; modalidad: string | null;
    volumen_cobrable: number | null; unidad_sugerida: string | null;
    folio: string | null;
  } | null;
  clientes?: { nombre_completo: string; whatsapp: string | null } | null;
  proveedores?: { nombre_comercial: string } | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  cotizado:   { bg: 'bg-muted/30',         text: 'text-muted-foreground', border: 'border-border',         dot: '#6b7280' },
  confirmado: { bg: 'bg-green-500/15',      text: 'text-green-400',        border: 'border-green-500/30',   dot: '#22c55e' },
  programado: { bg: 'bg-blue-400/15',       text: 'text-blue-400',         border: 'border-blue-400/30',    dot: '#60a5fa' },
  cargando:   { bg: 'bg-yellow-500/15',     text: 'text-yellow-400',       border: 'border-yellow-500/30',  dot: '#facc15' },
  en_ruta:    { bg: 'bg-cyan-500/15',       text: 'text-cyan-400',         border: 'border-cyan-500/30',    dot: '#22d3ee' },
  entregado:  { bg: 'bg-primary/15',        text: 'text-primary',          border: 'border-primary/30',     dot: '#00f5ff' },
  finalizado: { bg: 'bg-muted/20',          text: 'text-foreground/60',    border: 'border-border/40',      dot: '#374151' },
  cancelado:  { bg: 'bg-destructive/15',    text: 'text-destructive',      border: 'border-destructive/30', dot: '#ef4444' },
  incidencia: { bg: 'bg-orange-500/15',     text: 'text-orange-400',       border: 'border-orange-500/30',  dot: '#f97316' },
};

const STATUS_LIST = ['cotizado','confirmado','programado','cargando','en_ruta','entregado','finalizado','cancelado','incidencia'];

function statusStyle(s: string | null) {
  return STATUS_COLORS[s ?? 'cotizado'] ?? STATUS_COLORS.cotizado;
}

type CalView = 'month' | 'week' | 'day';

function pad(n: number) { return n.toString().padStart(2, '0'); }
function isoDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

interface Props {
  eventos: EventoCalendario[];
  onRefresh: () => void;
}

export default function CalendarioOperativo({ eventos, onRefresh }: Props) {
  const [view, setView] = useState<CalView>('month');
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<EventoCalendario | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── calendar grid helpers ────────────────────────────────────────────────
  const monthStart = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor]);
  const monthEnd   = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), [cursor]);

  const weekStart = useMemo(() => {
    const d = new Date(cursor);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [cursor]);

  const days: Date[] = useMemo(() => {
    if (view === 'day') return [new Date(cursor)];
    if (view === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      });
    }
    // month view — pad to full weeks
    const start = new Date(monthStart);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(monthEnd);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const result: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) { result.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    return result;
  }, [view, cursor, monthStart, monthEnd, weekStart]);

  function eventsForDay(d: Date): EventoCalendario[] {
    const key = isoDate(d);
    return eventos.filter(e => {
      if (!e.fecha_inicio) return false;
      return isoDate(new Date(e.fecha_inicio)) === key;
    });
  }

  function navigate(dir: 1 | -1) {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  }

  function headerLabel() {
    if (view === 'month') return monthStart.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    if (view === 'week') {
      const end = new Date(weekStart); end.setDate(end.getDate() + 6);
      return `${weekStart.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    return cursor.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ── update status ────────────────────────────────────────────────────────
  const updateEstatus = async (id: string, estatus: string) => {
    setUpdatingId(id);
    const dotColor = STATUS_COLORS[estatus]?.dot ?? '#6b7280';
    await supabase.from('eventos_calendario').update({ estatus, color: dotColor }).eq('id', id);
    // Also sync ordenes_servicio
    const evento = eventos.find(e => e.id === id);
    if (evento?.cotizacion_id) {
      await supabase.from('ordenes_servicio').update({ estatus }).eq('cotizacion_id', evento.cotizacion_id);
    }
    setUpdatingId(null);
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, estatus } : null);
    onRefresh();
  };

  // ── legend ───────────────────────────────────────────────────────────────
  const legend = [
    { key: 'cotizado',   label: 'Cotizado' },
    { key: 'confirmado', label: 'Confirmado' },
    { key: 'en_ruta',    label: 'En ruta' },
    { key: 'finalizado', label: 'Finalizado' },
    { key: 'incidencia', label: 'Incidencia' },
    { key: 'cancelado',  label: 'Cancelado' },
  ];

  const today = isoDate(new Date());

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-bold text-foreground text-sm min-w-[220px] text-center capitalize">{headerLabel()}</span>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())} className="text-xs h-7 px-2 border-border text-muted-foreground">
            Hoy
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex bg-card border border-border rounded-lg p-0.5 gap-0.5">
          {(['month','week','day'] as CalView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view===v ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {legend.map(l => {
          const s = statusStyle(l.key);
          return (
            <div key={l.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[l.key].dot }} />
              <span className="text-[11px] text-muted-foreground">{l.label}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {view === 'month' && (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const evs = eventsForDay(day);
                const isCurrentMonth = day.getMonth() === cursor.getMonth();
                const isToday = isoDate(day) === today;
                return (
                  <div key={idx}
                    className={`min-h-[90px] border-b border-r border-border/50 p-1.5 ${!isCurrentMonth ? 'opacity-40 bg-muted/5' : ''}`}>
                    <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground/70'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {evs.slice(0, 3).map(ev => {
                        const s = statusStyle(ev.estatus);
                        return (
                          <button key={ev.id} onClick={() => setSelected(ev)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${s.bg} ${s.text} border ${s.border} hover:opacity-80 transition-opacity`}>
                            {ev.titulo ?? ev.cotizaciones?.folio ?? '—'}
                          </button>
                        );
                      })}
                      {evs.length > 3 && (
                        <span className="text-[9px] text-muted-foreground pl-1">+{evs.length - 3} más</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'week' && (
          <>
            <div className="grid grid-cols-7 border-b border-border">
              {days.map((day, idx) => {
                const isToday = isoDate(day) === today;
                return (
                  <div key={idx} className={`text-center py-2 border-r border-border/50 last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}>
                    <p className="text-[11px] text-muted-foreground">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][day.getDay()]}</p>
                    <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{day.getDate()}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 min-h-[300px]">
              {days.map((day, idx) => {
                const evs = eventsForDay(day);
                return (
                  <div key={idx} className="border-r border-border/50 last:border-r-0 p-1.5 space-y-1">
                    {evs.map(ev => {
                      const s = statusStyle(ev.estatus);
                      return (
                        <button key={ev.id} onClick={() => setSelected(ev)}
                          className={`w-full text-left p-1.5 rounded-lg text-[10px] ${s.bg} ${s.text} border ${s.border} hover:opacity-80 transition-opacity`}>
                          <p className="font-bold truncate">{ev.cotizaciones?.folio ?? ev.titulo ?? '—'}</p>
                          {ev.cotizaciones && (
                            <p className="opacity-75 truncate">{ev.cotizaciones.origen} → {ev.cotizaciones.destino}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'day' && (
          <div className="p-4 space-y-3 min-h-[300px]">
            {eventsForDay(cursor).length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <Calendar className="w-8 h-8 opacity-30" />
                <p className="text-sm">Sin servicios programados para este día</p>
              </div>
            )}
            {eventsForDay(cursor).map(ev => {
              const s = statusStyle(ev.estatus);
              return (
                <motion.button key={ev.id} onClick={() => setSelected(ev)}
                  whileHover={{ scale: 1.005 }}
                  className={`w-full text-left p-4 rounded-xl ${s.bg} border ${s.border} transition-all hover:opacity-90`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${s.text}`}>{ev.cotizaciones?.folio ?? ev.titulo ?? '—'}</p>
                      {ev.cotizaciones && (
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {ev.cotizaciones.origen} → {ev.cotizaciones.destino}
                        </p>
                      )}
                      {ev.clientes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.clientes.nombre_completo}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border} flex-shrink-0`}>
                      {(ev.estatus ?? 'cotizado').replace(/_/g, ' ')}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Confirmados', value: eventos.filter(e => e.estatus === 'confirmado').length, color: 'text-green-400' },
          { label: 'En ruta',    value: eventos.filter(e => e.estatus === 'en_ruta').length,    color: 'text-cyan-400' },
          { label: 'Incidencias',value: eventos.filter(e => e.estatus === 'incidencia').length, color: 'text-orange-400' },
          { label: 'Total mes',  value: eventos.filter(e => {
            if (!e.fecha_inicio) return false;
            const d = new Date(e.fecha_inicio);
            return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
          }).length, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Event Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  {selected.cotizaciones?.folio ?? selected.titulo ?? 'Evento'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Estatus:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle(selected.estatus).bg} ${statusStyle(selected.estatus).text} ${statusStyle(selected.estatus).border}`}>
                    {(selected.estatus ?? 'cotizado').replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Details */}
                {selected.cotizaciones && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Ruta', value: `${selected.cotizaciones.origen} → ${selected.cotizaciones.destino}` },
                      { label: 'Modalidad', value: selected.cotizaciones.modalidad },
                      { label: 'Volumen', value: selected.cotizaciones.volumen_cobrable ? `${selected.cotizaciones.volumen_cobrable} m³` : null },
                      { label: 'Unidad', value: selected.cotizaciones.unidad_sugerida },
                      { label: 'Total', value: selected.cotizaciones.precio_total ? `$${selected.cotizaciones.precio_total.toLocaleString('es-MX')}` : null },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className="bg-background border border-border rounded-xl p-2.5">
                        <p className="text-[10px] text-muted-foreground">{f.label}</p>
                        <p className="text-sm font-medium text-foreground">{f.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  {selected.fecha_inicio && (
                    <div className="bg-background border border-border rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground">Fecha inicio</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selected.fecha_inicio).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}
                      </p>
                    </div>
                  )}
                  {selected.fecha_fin && (
                    <div className="bg-background border border-border rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground">Fecha fin / entrega</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selected.fecha_fin).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                {selected.observaciones && (
                  <div className="bg-background border border-border rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">Observaciones</p>
                    <p className="text-sm text-foreground">{selected.observaciones}</p>
                  </div>
                )}

                {/* Update status */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">Actualizar estatus:</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_LIST.map(s => {
                      const st = statusStyle(s);
                      const isActive = selected.estatus === s;
                      return (
                        <button key={s} onClick={() => updateEstatus(selected.id, s)}
                          disabled={updatingId === selected.id}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            isActive ? `${st.bg} ${st.text} ${st.border} opacity-100` : `bg-muted/10 text-muted-foreground border-border hover:${st.bg} hover:${st.text}`
                          } disabled:opacity-50`}>
                          {s.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* WhatsApp quick-send */}
                {selected.clientes && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 gap-2"
                    onClick={() => {
                      const cot = selected.cotizaciones;
                      openWhatsApp('servicio_programado', {
                        folio: cot?.folio ?? selected.id.slice(0,8),
                        nombre: selected.clientes!.nombre_completo,
                        origen: cot?.origen ?? '—',
                        destino: cot?.destino ?? '—',
                        vol: cot?.volumen_cobrable?.toString(),
                        unidad: cot?.unidad_sugerida ?? undefined,
                        total: cot?.precio_total ?? undefined,
                      }, selected.clientes!.whatsapp?.replace(/\D/g,'') ? `52${selected.clientes!.whatsapp!.replace(/\D/g,'')}` : undefined);
                    }}>
                    <MessageCircle className="w-4 h-4" />
                    Enviar WhatsApp al cliente
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
