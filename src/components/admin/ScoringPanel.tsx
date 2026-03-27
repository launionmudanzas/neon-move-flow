/**
 * ScoringPanel — Admin view for provider scoring analysis
 * Shows internal scores, priority reasons, and discarded providers.
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, Shield, AlertTriangle, Star, Crown, XCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  scoreProveedores,
  BADGE_CONFIG,
  type ProveedorRaw,
  type PublicacionCarga,
  type SancionRow,
  type IncidenciaCount,
  type ScoredProveedor,
  type ScoringInput,
} from '@/lib/proveedor-scoring';

interface Props {
  proveedores: ProveedorRaw[];
  publicaciones: PublicacionCarga[];
  sanciones: SancionRow[];
  incidencias: IncidenciaCount[];
}

export default function ScoringPanel({ proveedores, publicaciones, sanciones, incidencias }: Props) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [volumen, setVolumen] = useState(10);
  const [modalidad, setModalidad] = useState('compartido');
  const [simulated, setSimulated] = useState(false);

  const input: ScoringInput = useMemo(() => ({
    origen, destino, volumen, modalidad,
  }), [origen, destino, volumen, modalidad]);

  const result = useMemo(() => {
    if (!simulated || !origen || !destino) return null;
    return scoreProveedores(proveedores, publicaciones, sanciones, incidencias, input, [], 5);
  }, [simulated, proveedores, publicaciones, sanciones, incidencias, input, origen, destino]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground">Motor de Scoring</h3>
          <p className="text-xs text-muted-foreground">Simula una solicitud para ver cómo el sistema prioriza proveedores</p>
        </div>
      </div>

      {/* Simulation inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-card border border-border">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Origen</label>
          <Input value={origen} onChange={e => { setOrigen(e.target.value); setSimulated(false); }} placeholder="Ej: CDMX" className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Destino</label>
          <Input value={destino} onChange={e => { setDestino(e.target.value); setSimulated(false); }} placeholder="Ej: Guadalajara" className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Volumen (m³)</label>
          <Input type="number" value={volumen} onChange={e => { setVolumen(Number(e.target.value)); setSimulated(false); }} className="h-9 text-sm" />
        </div>
        <div className="flex items-end">
          <Button onClick={() => setSimulated(true)} disabled={!origen || !destino} className="w-full h-9 text-sm gap-1">
            <Search className="w-3.5 h-3.5" />
            Simular
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Selected providers */}
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Seleccionados ({result.selected.length})
            </h4>
            <div className="space-y-2">
              {result.selected.map((p, i) => (
                <ScoreCard key={p.id} prov={p} rank={i + 1} type="selected" />
              ))}
            </div>
          </div>

          {/* Discarded */}
          {result.discarded.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-destructive/60" />
                Descartados ({result.discarded.length})
              </h4>
              <div className="space-y-2">
                {result.discarded.slice(0, 10).map((p, i) => (
                  <ScoreCard key={p.id} prov={p} rank={i + 1} type="discarded" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Score Card ───────────────────────────────────────────────────

function ScoreCard({ prov, rank, type }: { prov: ScoredProveedor; rank: number; type: 'selected' | 'discarded' }) {
  const [expanded, setExpanded] = useState(false);
  const s = prov.score;

  return (
    <motion.div
      layout
      className={`p-3 rounded-xl border transition-all ${
        type === 'selected'
          ? 'bg-card border-green-500/20'
          : 'bg-card/50 border-border/50 opacity-70'
      }`}
    >
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center gap-3">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
            type === 'selected' ? 'bg-green-500/15 text-green-400' : 'bg-muted/30 text-muted-foreground'
          }`}>
            #{rank}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground truncate">{prov.nombre_comercial}</span>
              {prov.premium_activo && <Crown className="w-3 h-3 text-yellow-400" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {prov.badges.filter((b, i, arr) => arr.indexOf(b) === i).slice(0, 3).map(badge => {
                const cfg = BADGE_CONFIG[badge];
                return (
                  <span key={badge} className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[9px] font-bold border ${cfg.color}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Score */}
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-black ${s.total >= 50 ? 'text-green-400' : s.total >= 30 ? 'text-yellow-400' : 'text-destructive'}`}>
              {s.total}
            </p>
            <p className="text-[9px] text-muted-foreground">puntos</p>
          </div>
        </div>

        {type === 'discarded' && prov.discardReason && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-destructive/80">
            <AlertTriangle className="w-3 h-3" />
            {prov.discardReason}
          </div>
        )}
      </button>

      {/* Expanded score breakdown */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 pt-3 border-t border-border/30 space-y-1.5"
        >
          <ScoreBar label="Ruta" value={s.routeMatch} max={30} />
          <ScoreBar label="Unidad" value={s.unitFit} max={15} />
          <ScoreBar label="Calificación" value={s.rating} max={20} />
          <ScoreBar label="Disponibilidad" value={s.availability} max={10} />
          <ScoreBar label="Oportunidad" value={s.opportunity} max={15} />
          {s.penalties !== 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Penalizaciones
              </span>
              <span className={`font-bold ${s.penalties < 0 ? 'text-destructive' : 'text-green-400'}`}>
                {s.penalties > 0 ? '+' : ''}{s.penalties}
              </span>
            </div>
          )}
          {prov.isOpportunity && prov.opportunityDetail && (
            <div className="mt-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20 text-[10px] text-green-400">
              🛣️ {prov.opportunityDetail}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-green-400' : pct >= 40 ? 'bg-yellow-400' : 'bg-destructive/60'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-foreground font-bold w-8 text-right">{value}/{max}</span>
    </div>
  );
}
