import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: 'superadmin' | 'admin' | 'manager' | 'barber' | 'affiliate';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isSuperAdmin, isAdmin, isManager, isActiveManager, isApprovedBarber, isAffiliate, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-4">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = (() => {
    switch (requiredRole) {
      case 'superadmin':
        return isSuperAdmin;
      case 'admin':
        // Admin or manager or superadmin can access admin routes
        return isAdmin || (isManager && isActiveManager) || isSuperAdmin;
      case 'manager':
        return isManager && isActiveManager;
      case 'barber':
        return isApprovedBarber;
      case 'affiliate':
        return isAffiliate;
      default:
        return false;
    }
  })();

  if (!hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
