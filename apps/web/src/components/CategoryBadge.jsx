import React from 'react';
import { Car, Truck, Plane, Wrench, Box, Package } from 'lucide-react';

const CategoryBadge = ({ category, className = '' }) => {
  const getIcon = () => {
    switch (category) {
      case 'Hot Wheels': return <Car className="w-4 h-4" />;
      case 'Matchbox': return <Truck className="w-4 h-4" />;
      case 'RC Cars': return <Box className="w-4 h-4" />;
      case 'DIY Garages': return <Wrench className="w-4 h-4" />;
      case 'Planes': return <Plane className="w-4 h-4" />;
      case 'Miniatures': return <Package className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2d2d2d]/90 backdrop-blur-sm premium-border text-primary text-xs font-medium shadow-sm ${className}`}>
      {getIcon()}
      <span className="bilingual-body">{category}</span>
    </div>
  );
};

export default CategoryBadge;