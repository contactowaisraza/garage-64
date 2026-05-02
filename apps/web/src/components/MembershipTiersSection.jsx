
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PaymentModal from '@/components/PaymentModal.jsx';

const MembershipTiersSection = () => {
  const { language, isRTL } = useLanguage();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const currentLang = language === 'ar' ? 'ar' : 'en';
  const t = currentLang === 'ar' ? arTranslations : enTranslations;

  const tierKeys = ['observer', 'hobbyist', 'collector', 'dealer'];

  const tierStyles = {
    observer: { bg: 'bg-[#4a4a4a]', border: 'border-white/10', text: 'text-white' },
    hobbyist: { bg: 'bg-[#b87333]', border: 'border-white/10', text: 'text-white' },
    collector: { bg: 'bg-[#c0c0c0]', border: 'border-white/10', text: 'text-[#1a1a1a]' },
    dealer: { bg: 'bg-primary', border: 'border-primary/50', text: 'text-primary-foreground' }
  };

  const handleTierClick = async (tierKey) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (tierKey === 'observer' && currentUser?.has_used_observer_trial) {
      return;
    }

    // Observer tier might be free, handle directly if needed, but for now use payment modal for all or skip if free
    if (tierKey === 'observer') {
      try {
        const today = new Date().toISOString();
        await pb.collection('users').update(currentUser.id, {
          pending_tier_request: tierKey,
          pending_request_date: today,
          subscription_status: 'pending'
        }, { $autoCancel: false });
        
        toast.success(currentLang === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Request submitted successfully');
        navigate('/pending-approval', { state: { tier: tierKey, date: today } });
      } catch (error) {
        console.error('Error requesting observer tier:', error);
        toast.error(currentLang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Error submitting request');
      }
      return;
    }

    setSelectedTier(tierKey);
    setShowPaymentModal(true);
  };

  return (
    <section id="membership-tiers" className="py-24 bg-card relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {currentLang === 'ar' ? 'اختر مستواك' : 'Choose Your Tier'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {currentLang === 'ar' 
              ? 'اختر الخطة المثالية لحجم مجموعتك واحتياجات البيع الخاصة بك.' 
              : 'Select the perfect plan for your collection size and selling needs.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 justify-items-center">
          <TooltipProvider>
            {tierKeys.map((key) => {
              const tier = t.signup?.tiers?.[key] || t[key];
              const style = tierStyles[key];
              const isDisabled = key === 'observer' && currentUser?.has_used_observer_trial;

              const CardContent = (
                <div
                  onClick={() => handleTierClick(key)}
                  className={`
                    relative flex flex-col h-full w-full max-w-[300px] p-8 rounded-2xl border transition-all duration-300 ease-out cursor-pointer
                    ${style.bg} ${style.border} ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-2 hover:shadow-xl'}
                  `}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {key === 'dealer' && (
                    <div className="absolute -top-3 right-6 bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                      Recommended
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{tier.icon}</span>
                      <h3 className={`text-xl font-bold uppercase tracking-wide ${style.text}`}>
                        {tier.name}
                      </h3>
                    </div>
                    <div className="mb-4">
                      <span className={`font-mono text-3xl font-bold tracking-tight ${style.text}`}>
                        {tier.price}
                      </span>
                    </div>
                    <p className={`text-sm min-h-[48px] opacity-90 leading-relaxed ${style.text}`}>
                      {tier.description}
                    </p>
                  </div>

                  <div className="flex-grow mb-8">
                    <ul className="space-y-4">
                      {[tier.adLimit, tier.listingType, tier.messaging].map((feature, idx) => (
                        <li key={idx} className={`flex items-start gap-3 text-sm font-medium leading-tight ${style.text}`}>
                          <span className="shrink-0 mt-0.5 opacity-80">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-6 border-t border-black/10">
                    <span className={`block w-full text-center font-bold uppercase tracking-wider text-sm ${style.text}`}>
                      {currentLang === 'ar' ? 'ترقية المستوى' : 'Upgrade Level'} →
                    </span>
                  </div>
                </div>
              );

              if (isDisabled) {
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div className="w-full max-w-[300px] h-full">{CardContent}</div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-secondary text-secondary-foreground border-border">
                      <p>{currentLang === 'ar' ? 'مستوى المراقب للمستخدمين الجدد فقط.' : 'Observer tier can only be used once.'}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={key}>{CardContent}</React.Fragment>;
            })}
          </TooltipProvider>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal 
          selectedTier={selectedTier}
          showModal={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          currentUser={currentUser}
        />
      )}
    </section>
  );
};

export default MembershipTiersSection;
