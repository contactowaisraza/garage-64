
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';

const SubscriptionGuard = ({ children, requireActive = true }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState({ isValid: true, daysRemaining: 999 });

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.subscription_end_date) {
      const endDate = new Date(currentUser.subscription_end_date);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setStatus({
        isValid: diffDays >= 0,
        daysRemaining: diffDays
      });

      if (requireActive && diffDays < 0) {
        navigate('/memberships', { 
          state: { message: 'Your subscription has expired. Please upgrade to continue.' },
          replace: true
        });
      }
    } else if (requireActive && currentUser.tier !== 'observer') {
      // If no end date but they should have one
      setStatus({ isValid: false, daysRemaining: -1 });
      navigate('/memberships', { 
        state: { message: 'Valid subscription required. Please upgrade to continue.' },
        replace: true
      });
    }
  }, [currentUser, navigate, requireActive, location.pathname]);

  if (!currentUser) return null;

  // If expired and we require active, we are redirecting, so render nothing
  if (requireActive && !status.isValid) return null;

  return (
    <>
      {status.isValid && status.daysRemaining < 5 && status.daysRemaining >= 0 && (
        <div className="bg-[hsl(var(--subscription-expiring))] text-white px-4 py-3 text-center font-medium flex items-center justify-center gap-2">
          <Clock className="w-5 h-5" />
          <span>Your subscription expires in {status.daysRemaining} days. Upgrade now to avoid interruption.</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4 bg-white/20 border-white/40 hover:bg-white/30 text-white"
            onClick={() => navigate('/memberships')}
          >
            Upgrade Now
          </Button>
        </div>
      )}
      {children}
    </>
  );
};

export default SubscriptionGuard;
