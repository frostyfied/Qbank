import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { UserRole } from '../../types/auth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isPreview, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Verifying Authentication State...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated and not in development preview, redirect to login
  if (!isAuthenticated && !isPreview) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles specified, verify permissions
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
          Your active account role is <strong className="text-slate-900 uppercase font-mono">{user.role}</strong>.
          This route requires elevated permissions ({allowedRoles.join(', ')}).
        </p>
        <Link to={`/dashboard/${user.role}`}>
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to {user.role.toUpperCase()} Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
