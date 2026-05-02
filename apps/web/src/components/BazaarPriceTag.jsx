
import React from 'react';

const BazaarPriceTag = ({ price, tier }) => {
  const normalizedTier = tier?.toLowerCase();
  
  if (!normalizedTier || normalizedTier === 'observer') {
    return null;
  }

  return (
    <div className="absolute top-2 right-4 z-20 transform rotate-[6deg] hover:rotate-[12deg] transition-transform duration-300 origin-top drop-shadow-xl pointer-events-none">
      {/* String Graphic */}
      <svg 
        className="absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 text-white/40 drop-shadow-sm z-10" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20 32 C20 20, 10 10, 0 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
        <path d="M20 32 C20 20, 30 10, 40 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
      </svg>

      {/* Tag Body */}
      <div 
        className="w-[72px] h-[90px] bg-[#ff8c00] relative flex flex-col items-center justify-center rounded-b-md overflow-hidden"
        style={{ 
          clipPath: 'polygon(25% 0, 75% 0, 100% 20%, 100% 100%, 0 100%, 0 20%)',
        }}
      >
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>

        {/* Hole */}
        <div className="w-3 h-3 rounded-full bg-[#1a1a1a] absolute top-3 shadow-inner z-10 ring-1 ring-black/20"></div>
        
        {/* Price Text */}
        <div className="mt-5 text-black font-mono font-extrabold text-center z-10 flex flex-col items-center">
          <span className="text-[10px] leading-none mb-1 opacity-80 tracking-widest">QI</span>
          <span className="text-lg leading-none tracking-tighter">
            {price ? price.toLocaleString() : '---'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BazaarPriceTag;
