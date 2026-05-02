import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const HeroSection = () => {
  const { isRTL } = useLanguage();

  const scrollToMarketplace = () => {
    const element = document.getElementById('marketplace');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1677662327622-b04d178282bf?q=80&w=2070&auto=format&fit=crop" 
          alt="Diecast Cars Collection" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 mx-auto text-center flex flex-col items-center justify-center h-full">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 
            className="text-fluid-h1 font-heading text-white drop-shadow-lg"
            style={{ fontWeight: 900 }}
          >
            كراج 64 - مجتمع مقتني السيارات الأول في العراق
          </h1>
          
          <p 
            className="text-xl md:text-3xl text-white max-w-3xl mx-auto"
            style={{ fontWeight: 300, letterSpacing: '0.1em' }}
          >
            Iraq's Premier Diecast Collector Community
          </p>

          <div className="pt-8">
            <button 
              onClick={scrollToMarketplace}
              className="btn-premium px-10 py-5 text-xl inline-flex items-center gap-2"
            >
              {isRTL ? 'ابدأ الآن' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;