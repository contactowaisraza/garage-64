import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const ConditionBadge = ({ condition, className = '' }) => {
  const { td } = useLanguage();

  const getColor = () => {
    switch (condition) {
      case 'Mint': return 'bg-emerald-500/10 text-emerald-500';
      case 'Near Mint': return 'bg-teal-500/10 text-teal-500';
      case 'Excellent': return 'bg-blue-500/10 text-blue-500';
      case 'Good': return 'bg-yellow-500/10 text-yellow-500';
      case 'Fair': return 'bg-orange-500/10 text-orange-500';
      case 'Poor': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold premium-border ${getColor()} ${className}`}>
      <span>{td(condition)}</span>
    </div>
  );
};

export default ConditionBadge;
