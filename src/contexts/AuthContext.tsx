import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserIdentity {
  user_id: string;
  is_admin: boolean;
  cliente_id: string | null;
  proveedor_id: string | null;
  created_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  identity: UserIdentity | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIdentity = async (userId: string) => {
    const { data } = await supabase
      .from('user_identities')
      .select('user_id, is_admin, cliente_id, proveedor_id, created_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setIdentity({
        user_id: data.user_id,
        is_admin: data.is_admin,
        cliente_id: data.cliente_id ?? null,
        proveedor_id: data.proveedor_id ?? null,
        created_at: data.created_at,
      });
    } else {
      setIdentity(null);
    }
  };

  const initAndFetchIdentity = async (userId: string) => {
    // Ensure a user_identities row exists (idempotent)
    await supabase.rpc('init_user_identity' as never);
    await fetchIdentity(userId);
  };

  const refreshIdentity = async () => {
    if (session?.user) {
      await fetchIdentity(session.user.id);
    }
  };

  useEffect(() => {
    // Set up auth listener BEFORE calling getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Defer Supabase calls to avoid deadlock inside the callback
            setTimeout(() => initAndFetchIdentity(newSession.user.id), 0);
          }
        } else {
          setIdentity(null);
        }
        setIsLoading(false);
      }
    );

    // Restore existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        initAndFetchIdentity(existingSession.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIdentity(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        identity,
        isLoading,
        isAdmin: identity?.is_admin ?? false,
        signOut,
        refreshIdentity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
