import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';

export const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isPreview } = useAuth();
  if (!isAuthenticated && !isPreview) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/dashboard/teacher" replace />;
  return <Navigate to="/dashboard/student" replace />;
};
