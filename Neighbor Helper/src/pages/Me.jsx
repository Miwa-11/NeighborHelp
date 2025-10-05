// src/pages/Me.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Me() {
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setTarget(`/users/${encodeURIComponent(user.email)}`);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!target) return <div className="p-6">Please log in.</div>;
  return <Navigate to={target} replace />;
}
