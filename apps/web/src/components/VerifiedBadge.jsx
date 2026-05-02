import React from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const VerifiedBadge = ({ className = '' }) => {
  const { isRTL } = useLanguage();
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 premium-border text-secondary text-[11px] font-bold uppercase tracking-wider ${className}`}>
      <Star className="w-3.5 h-3.5 fill-secondary" />
      <span className="bilingual-body">{isRTL ? 'تاجر معتمد' : 'Verified Dealer'}</span>
    </div>
  );
};

export default VerifiedBadge;