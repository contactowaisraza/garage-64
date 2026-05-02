
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SubscriptionGuard from '@/components/SubscriptionGuard.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialLoading, currentUser } = useAuth();
  const location = useLocation();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has a pending tier request
  if (currentUser?.pending_tier_request) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Routes that require active subscription
  const requiresSubscription = ['/bazar', '/listings', '/messages', '/create-listing'].some(path => location.pathname.startsWith(path));

  if (requiresSubscription) {
    return (
      <SubscriptionGuard requireActive={true}>
        {children}
      </SubscriptionGuard>
    );
  }

  return (
    <SubscriptionGuard requireActive={false}>
      {children}
    </SubscriptionGuard>
  );
};

export default ProtectedRoute;
