import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'owner' }> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  if (requiredRole && profile && profile.role !== requiredRole) {
    // Redirect to the appropriate dashboard if the role doesn't match
    const target = profile.role === 'admin' ? '/dashboard' : '/owner-dashboard';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};
