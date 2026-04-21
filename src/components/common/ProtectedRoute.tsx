import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Any of these roles is enough to grant access. */
  anyOf?: AppRole[];
}

/**
 * Client-side route guard.
 * Server-side enforcement still happens via RLS — this is UX-only to avoid
 * loading dashboards a user has no rights to.
 */
const ProtectedRoute = ({ children, anyOf }: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (anyOf && anyOf.length > 0) {
    const has = anyOf.some((r) => roles.includes(r));
    if (!has) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
