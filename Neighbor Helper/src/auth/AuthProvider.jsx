import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthCtx.Provider value={{ session, loading }}>{children}</AuthCtx.Provider>;
}

export function useAuthCtx() {
  return useContext(AuthCtx);
}
