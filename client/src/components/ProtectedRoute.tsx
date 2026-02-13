import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('buyer' | 'publisher')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, currentRole, loading } = useAuth();

  // Check if registration or login is in progress
  const isRegistering = typeof window !== 'undefined' && localStorage.getItem('isRegistering') === 'true';
  const isLoggingIn = typeof window !== 'undefined' && localStorage.getItem('isLoggingIn') === 'true';

  // Show loading state while checking authentication, during registration, or during login
  if (loading || isRegistering || isLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4 [stroke-width:1.5]" />
          <p className="text-muted-foreground">
            {isRegistering ? 'Setting up your account...' : isLoggingIn ? 'Logging you in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Check if user's current role is in the allowed roles
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole as 'buyer' | 'publisher')) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
