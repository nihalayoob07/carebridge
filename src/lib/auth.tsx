import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type Profile, type Role } from "./supabase";

type Ctx = { session: Session | null; profile: Profile | null; loading: boolean; refresh: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ session: null, profile: null, loading: true, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (s: Session | null) => {
    setSession(s);
    if (!s) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", s.user.id).single();
    setProfile(data as Profile);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setTimeout(() => load(s), 0); });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider value={{ session, profile, loading, refresh: async () => load((await supabase.auth.getSession()).data.session) }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

export const homeFor = (role?: Role) =>
  role === "caregiver" ? "/care" : role === "admin" ? "/admin" : "/family";
