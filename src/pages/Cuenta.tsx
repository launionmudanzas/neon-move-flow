import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, Truck, ClipboardList, Link2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logoOficial from '@/assets/logo-oficial.png';

export default function Cuenta() {
  const { user, identity, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Cargando cuenta...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const emailMasked = user.email ?? '';
  const isLinkedCliente = !!identity?.cliente_id;
  const isLinkedProveedor = !!identity?.proveedor_id;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>
          <img src={logoOficial} alt="La Unión Mudanzas" className="h-10 w-auto object-contain" />
        </div>

        {/* Welcome card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-xl"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-base">{emailMasked}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? '⚡ Administrador' : isLinkedCliente ? '👤 Cliente registrado' : isLinkedProveedor ? '🚛 Proveedor' : '✨ Cuenta activa'}
              </p>
            </div>
            {isAdmin && <ShieldCheck className="ml-auto w-5 h-5 text-primary" />}
          </div>

          {/* Identity status */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className={`rounded-xl p-3 border text-center text-xs font-medium ${isLinkedCliente ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-border text-muted-foreground'}`}>
              <User className="w-4 h-4 mx-auto mb-1" />
              {isLinkedCliente ? 'Cliente vinculado ✓' : 'Sin cliente vinculado'}
            </div>
            <div className={`rounded-xl p-3 border text-center text-xs font-medium ${isLinkedProveedor ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-border text-muted-foreground'}`}>
              <Truck className="w-4 h-4 mx-auto mb-1" />
              {isLinkedProveedor ? 'Proveedor vinculado ✓' : 'Sin proveedor vinculado'}
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-xl space-y-3"
        >
          <p className="text-sm font-semibold text-foreground mb-4">Accesos rápidos</p>

          <Link
            to="/#cotizador"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/20 transition-all"
          >
            <ClipboardList className="w-4 h-4" />
            Ir al cotizador
          </Link>

          {!isLinkedCliente && !isLinkedProveedor && (
            <div className="rounded-xl bg-muted/20 border border-border p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Link2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs mb-1">Vincula tu cuenta</p>
                  <p className="text-xs">Para ver tus cotizaciones y órdenes de servicio, pide a La Unión Mudanzas que vincule tu expediente a esta cuenta.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </motion.div>
      </div>
    </div>
  );
}
