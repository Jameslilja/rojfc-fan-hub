import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const initialLinkType = typeof window === 'undefined' ? null : new URLSearchParams(window.location.hash.slice(1)).get('type');
const AuthContext = createContext<{ user: User | null; ready: boolean; passwordLink: boolean }>({ user: null, ready: false, passwordLink: false });
export const useAdminAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [passwordLink, setPasswordLink] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    let active = true;
    setPasswordLink(initialLinkType === 'recovery' || initialLinkType === 'invite');
    const refresh = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) { setUser(data.user); setReady(true); }
    };
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'PASSWORD_RECOVERY'].includes(event)) return;
      if (event === 'PASSWORD_RECOVERY') setPasswordLink(true);
      if (event === 'SIGNED_OUT') { setUser(null); setPasswordLink(false); qc.removeQueries({ queryKey: ['admin'] }); }
      setTimeout(() => {
        if (!active) return;
        if (event !== 'SIGNED_OUT') { void refresh(); void qc.invalidateQueries({ queryKey: ['admin'] }); }
        void router.invalidate();
      }, 0);
    });
    void refresh();
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [router, qc]);
  return <AuthContext.Provider value={{ user, ready, passwordLink }}>{children}</AuthContext.Provider>;
}