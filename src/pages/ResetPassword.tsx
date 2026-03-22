import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logoOficial from '@/assets/logo-oficial.png';

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres').max(128),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] });

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Detect recovery event from URL hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => { errs[err.path[0]] = err.message; });
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Contraseña actualizada ✅', description: 'Ya puedes iniciar sesión con tu nueva contraseña.' });
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Iniciar sesión
          </Link>
          <img src={logoOficial} alt="La Unión Mudanzas" className="h-10 w-auto object-contain" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-foreground mb-1">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isRecovery ? 'Elige una contraseña segura para tu cuenta.' : 'Cargando enlace de recuperación...'}
          </p>

          {isRecovery && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordField label="Nueva contraseña" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(!showPw)} error={errors.password} />
              <PasswordField label="Confirmar contraseña" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} error={errors.confirm} />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, error }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          maxLength={128}
          className="w-full pl-10 pr-10 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
