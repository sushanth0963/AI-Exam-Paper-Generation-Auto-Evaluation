import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

// ── Protected Route (any logged-in user) ───────────────────────────────────
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ── Admin-only Route ────────────────────────────────────────────────────────
export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/student-dashboard" replace />;
  return <>{children}</>;
};

// ── Student-only Route ──────────────────────────────────────────────────────
export const StudentRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (isAdmin) return <Navigate to="/admin-dashboard" replace />;
  return <>{children}</>;
};
