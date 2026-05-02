
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isSubscriptionExpired } from '@/utils/subscriptionUtils';
import { useLanguage } from '@/hooks/useLanguage';

const ProtectedSubscriptionRoute = ({ children }) => {
  const { isAuthenticated, initialLoading, currentUser } = useAuth();
  const location = useLocation();
  const { isRTL } = useLanguage();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const status = currentUser?.subscription_status;
  const isPending = status === 'pending' || currentUser?.pending_tier_request;
  const isApproved = status === 'approved' || status === 'active'; // Backend might return 'active'

  // Define allowed routes for specific states
  const allowedForPending = ['/pending-approval', '/profile', '/logout'];
  const allowedForInactive = ['/memberships', '/upgrade', '/profile', '/logout'];

  // Handle Pending Users
  if (isPending) {
    if (!allowedForPending.some(path => location.pathname.startsWith(path))) {
      return <Navigate to="/pending-approval" replace />;
    }
    return children;
  }

  // Handle Active/Approved Users
  if (isApproved && !isSubscriptionExpired(currentUser)) {
    if (location.pathname.startsWith('/pending-approval')) {
      return <Navigate to="/bazar" replace />;
    }
    return children;
  }

  // Handle Inactive/Expired/Rejected Users
  if (!isApproved || isSubscriptionExpired(currentUser)) {
    if (!allowedForInactive.some(path => location.pathname.startsWith(path))) {
      return <Navigate to="/upgrade" state={{ message: isRTL ? 'اشتراكك انتهى' : 'Your subscription has expired' }} replace />;
    }
  }

  return children;
};

export default ProtectedSubscriptionRoute;
