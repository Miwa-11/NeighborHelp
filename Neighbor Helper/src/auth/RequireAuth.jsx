import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthCtx } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { session, loading } = useAuthCtx();
  const loc = useLocation();
  if (loading) return <div className="p-4">Loading…</div>;
  if (!session) return <Navigate to="/" state={{ from: loc }} replace />;
  return children;
}
