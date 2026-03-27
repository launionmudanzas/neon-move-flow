import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const CHECKBOXES = [
  { id: 'terminos', label: 'He leído y acepto los Términos y Condiciones del servicio' },
  { id: 'privacidad', label: 'He leído y acepto el Aviso de Privacidad' },
  { id: 'volumen', label: 'Entiendo que si cambia el volumen, accesos o maniobras, el costo puede ajustarse' },
  { id: 'cancelacion', label: 'Entiendo que no hay reembolso en cancelaciones con menos de 24 horas' },
  { id: 'descarga', label: 'Entiendo que no se realiza descarga sin liquidación total del servicio' },
] as const;

function getLegalFinal(proveedorNombre?: string) {
  const prov = proveedorNombre || 'EL PROVEEDOR ASIGNADO';
  return `CONFIRMO DE RECIBIDO Y ACEPTO LOS TÉRMINOS Y CONDICIONES DEL SERVICIO, AUTORIZANDO EXPRESAMENTE A ${prov} A TRAVÉS DE LA UNIÓN MUDANZAS, PARA REALIZAR EL SERVICIO CONTRATADO. RECONOZCO QUE LA UNIÓN MUDANZAS ACTÚA COMO COORDINADOR LOGÍSTICO Y VÍNCULO ENTRE LAS PARTES, Y QUE EL PROVEEDOR ASIGNADO ES EL RESPONSABLE DIRECTO DE LA EJECUCIÓN DEL SERVICIO.`;
}

const BRIEF_POINTS = [
  'El servicio está sujeto a volumen declarado',
  'Si el volumen real cambia, el costo se ajusta',
  'Si la unidad no entra, pueden generarse cargos adicionales',
  'La empresa actúa como intermediario logístico',
  'El servicio es ejecutado por el proveedor asignado',
  'No hay reembolso en cancelaciones con menos de 24 horas',
  'No se descarga sin pago total del servicio',
];

interface LegalAcceptanceBlockProps {
  accepted: boolean;
  onAcceptedChange: (val: boolean) => void;
  compact?: boolean;
  proveedorNombre?: string;
}

export default function LegalAcceptanceBlock({ accepted, onAcceptedChange, compact = false, proveedorNombre }: LegalAcceptanceBlockProps) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [finalCheck, setFinalCheck] = useState(false);

  const allChecked = CHECKBOXES.every(c => checks[c.id]) && finalCheck;

  useEffect(() => {
    onAcceptedChange(allChecked);
  }, [allChecked, onAcceptedChange]);

  // Reset on mount
  useEffect(() => {
    setChecks({});
    setFinalCheck(false);
  }, []);

  const toggle = (id: string) => setChecks(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {/* Brief summary */}
      {!compact && (
        <div className="p-4 rounded-xl bg-neon-orange/5 border border-neon-orange/20">
          <p className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-neon-orange" />
            Antes de continuar
          </p>
          <ul className="space-y-1.5">
            {BRIEF_POINTS.map(p => (
              <li key={p} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-neon-orange mt-1.5 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
          <div className="flex gap-4 mt-3">
            <Link
              to="/terminos-y-condiciones"
              target="_blank"
              className="text-xs text-neon-cyan hover:underline flex items-center gap-1"
            >
              Ver términos y condiciones <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              to="/aviso-de-privacidad"
              target="_blank"
              className="text-xs text-neon-purple hover:underline flex items-center gap-1"
            >
              Ver aviso de privacidad <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Checkboxes */}
      <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
        {CHECKBOXES.map(c => (
          <label key={c.id} className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={!!checks[c.id]}
              onCheckedChange={() => toggle(c.id)}
              className="mt-0.5 border-muted-foreground data-[state=checked]:border-neon-green data-[state=checked]:bg-neon-green"
            />
            <span className={`text-sm transition-colors ${checks[c.id] ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {c.label}
            </span>
          </label>
        ))}
      </div>

      {/* Final acceptance */}
      <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 italic">
          "{getLegalFinal(proveedorNombre)}"
        </p>
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={finalCheck}
            onCheckedChange={() => setFinalCheck(!finalCheck)}
            className="mt-0.5 border-muted-foreground data-[state=checked]:border-neon-cyan data-[state=checked]:bg-neon-cyan"
          />
          <span className={`text-sm font-semibold transition-colors ${finalCheck ? 'text-neon-cyan' : 'text-muted-foreground group-hover:text-foreground'}`}>
            Acepto los términos, condiciones y aviso de privacidad de La Unión Mudanzas
          </span>
        </label>
      </div>

      {/* Links always visible */}
      {compact && (
        <div className="flex gap-4 justify-center">
          <Link to="/terminos-y-condiciones" target="_blank" className="text-xs text-neon-cyan hover:underline flex items-center gap-1">
            Términos y condiciones <ExternalLink className="w-3 h-3" />
          </Link>
          <Link to="/aviso-de-privacidad" target="_blank" className="text-xs text-neon-purple hover:underline flex items-center gap-1">
            Aviso de privacidad <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {!allChecked && (
        <p className="text-xs text-neon-orange text-center flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Debes aceptar todos los puntos para continuar
        </p>
      )}
    </div>
  );
}
