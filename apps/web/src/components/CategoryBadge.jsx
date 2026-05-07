import React from 'react';
import { Car } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { CATEGORY_ICONS } from '@/utils/categories';

const CategoryBadge = ({ category, className = '' }) => {
  const { td } = useLanguage();
  const IconComponent = CATEGORY_ICONS[category] ?? Car;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2d2d2d]/90 backdrop-blur-sm premium-border text-primary text-xs font-medium shadow-sm ${className}`}>
      <IconComponent className="w-4 h-4" />
      <span>{td(category)}</span>
    </div>
  );
};

export default CategoryBadge;
