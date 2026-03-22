import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logoOficial from '@/assets/logo-oficial.png';

// ─── Validation schemas ───────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().trim().email('Correo inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(128),
});

const signupSchema = z.object({
  email: z.string().trim().email('Correo inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type Tab = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();

  const clearErrors = () => setFieldErrors({});

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => { errs[err.path[0]] = err.message; });
      setFieldErrors(errs);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error al iniciar sesión', description: 'Correo o contraseña incorrectos.', variant: 'destructive' });
    } else {
      toast({ title: '¡Bienvenido de vuelta! 🚛', description: 'Sesión iniciada correctamente.' });
      navigate('/cuenta');
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const parsed = signupSchema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => { errs[err.path[0]] = err.message; });
      setFieldErrors(errs);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin },
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error al registrarse', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: '¡Registro exitoso! 📧',
        description: 'Revisa tu correo para confirmar tu cuenta.',
      });
      setTab('login');
    }
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const emailParsed = z.string().trim().email('Correo inválido').safeParse(email);
    if (!emailParsed.success) { setFieldErrors({ email: emailParsed.error.errors[0].message }); return; }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailParsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Correo enviado 📩', description: 'Revisa tu bandeja para restablecer tu contraseña.' });
      setTab('login');
    }
  };

  const handleTabChange = (t: Tab) => { setTab(t); clearErrors(); setPassword(''); setConfirmPassword(''); };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo + back */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Inicio
          </Link>
          <img src={logoOficial} alt="La Unión Mudanzas" className="h-10 w-auto object-contain" />
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">

          {/* Tabs */}
          {tab !== 'forgot' && (
            <div className="flex rounded-xl overflow-hidden border border-border mb-8">
              {(['login', 'signup'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    tab === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <p className="text-xl font-bold text-foreground mb-1">Bienvenido de vuelta 👋</p>
                  <p className="text-sm text-muted-foreground">Accede a tu cotización y órdenes de servicio.</p>
                </div>
                <EmailField value={email} onChange={setEmail} error={fieldErrors.email} />
                <PasswordField label="Contraseña" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} error={fieldErrors.password} />
                <div className="text-right">
                  <button type="button" onClick={() => handleTabChange('forgot')} className="text-xs text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <SubmitButton label="Iniciar sesión" isLoading={isLoading} />
              </motion.form>
            )}

            {/* ── SIGNUP ── */}
            {tab === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignup}
                className="space-y-5"
              >
                <div>
                  <p className="text-xl font-bold text-foreground mb-1">Crea tu cuenta 🚛</p>
                  <p className="text-sm text-muted-foreground">Accede a tu historial de cotizaciones y órdenes.</p>
                </div>
                <EmailField value={email} onChange={setEmail} error={fieldErrors.email} />
                <PasswordField label="Contraseña" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} error={fieldErrors.password} />
                <PasswordField label="Confirmar contraseña" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} error={fieldErrors.confirmPassword} />
                <SubmitButton label="Crear cuenta" isLoading={isLoading} />
                <p className="text-xs text-muted-foreground text-center">
                  Al registrarte aceptas nuestros términos de servicio y política de privacidad.
                </p>
              </motion.form>
            )}

            {/* ── FORGOT ── */}
            {tab === 'forgot' && (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleForgot}
                className="space-y-5"
              >
                <div>
                  <button type="button" onClick={() => handleTabChange('login')} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>
                  <p className="text-xl font-bold text-foreground mb-1">Restablecer contraseña</p>
                  <p className="text-sm text-muted-foreground">Te enviaremos un enlace a tu correo.</p>
                </div>
                <EmailField value={email} onChange={setEmail} error={fieldErrors.email} />
                <SubmitButton label="Enviar enlace" isLoading={isLoading} />
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground text-xs">
          <Truck className="w-4 h-4 text-primary" />
          <span>#LaUnionMudanzas · Salimos todas las semanas</span>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EmailField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Correo electrónico</label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          maxLength={255}
          className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
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
          autoComplete="current-password"
          maxLength={128}
          className="w-full pl-10 pr-10 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SubmitButton({ label, isLoading }: { label: string; isLoading: boolean }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Procesando...
        </span>
      ) : label}
    </button>
  );
}
