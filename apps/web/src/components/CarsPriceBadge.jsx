
import React from 'react';

const CarsPriceBadge = ({ price, tier }) => {
  const normalizedTier = tier?.toLowerCase();
  
  if (!normalizedTier || normalizedTier === 'observer') {
    return null;
  }

  return (
    <div className="absolute top-3 right-12 z-20 bg-[#ff8c00] text-black px-3 py-1.5 rounded-md shadow-lg font-bold tracking-tight flex items-center gap-1.5 border border-[#ff8c00]/50 backdrop-blur-sm">
      <span className="text-xs opacity-80 font-medium">QI</span>
      <span className="text-base leading-none">{price ? price.toLocaleString() : '---'}</span>
    </div>
  );
};

export default CarsPriceBadge;
