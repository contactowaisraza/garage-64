import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';

const DiecastCategoryPage = () => {
  const { isRTL } = useLanguage();

  const brands = [
    {
      id: 'Hot Wheels',
      titleAr: 'هوت ويلز',
      titleEn: 'Hot Wheels',
      image: 'https://images.unsplash.com/photo-1672529275329-8e1b8659fb99?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 'Matchbox',
      titleAr: 'ماتش بوكس',
      titleEn: 'Matchbox',
      image: 'https://images.unsplash.com/photo-1633282688052-c525dd6639c3?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 'Corgi',
      titleAr: 'كورجي',
      titleEn: 'Corgi',
      image: 'https://images.unsplash.com/photo-1612940960267-4549a58fb257?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 'Majorette',
      titleAr: 'ماجوريت',
      titleEn: 'Majorette',
      image: 'https://images.unsplash.com/photo-1671028878209-1b2066525ff7?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 'Miniatures',
      titleAr: 'أخرى',
      titleEn: 'Others',
      image: 'https://images.unsplash.com/photo-1672529275329-8e1b8659fb99?q=80&w=1000&auto=format&fit=crop'
    }
  ];

  return (
    <>
      <Helmet>
        <title>{isRTL ? 'سيارات مصغرة - كراج 64' : 'Diecast Cars - Garage64'}</title>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-20">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10 bilingual-body">
            <Link to="/" className="hover:text-primary premium-transition flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span>{isRTL ? 'الرئيسية' : 'Home'}</span>
            </Link>
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-foreground">{isRTL ? 'سيارات مصغرة' : 'Diecast Cars'}</span>
          </nav>

          {/* Page Title */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <h1 className="text-4xl md:text-5xl bilingual-heading text-white mb-4">
              {isRTL ? 'سيارات مصغرة' : 'Diecast Cars'}
            </h1>
            <div className="w-16 h-1 bg-primary rounded-full"></div>
          </motion.div>

          {/* Brand Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative rounded-[16px] md:rounded-[20px] overflow-hidden aspect-[4/5] md:aspect-[3/4] border border-white/10 cursor-pointer active:scale-[0.98] md:active:scale-100 premium-transition md:hover:scale-[1.02] md:hover:-translate-y-1"
              >
                <Link to={`/diecast/${encodeURIComponent(brand.id)}`} className="block w-full h-full">
                  <img 
                    src={brand.image} 
                    alt={isRTL ? brand.titleAr : brand.titleEn} 
                    className="absolute inset-0 w-full h-full object-cover premium-transition md:group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                    <h3 className="text-2xl text-white bilingual-heading drop-shadow-lg premium-transition md:group-hover:-translate-y-1">
                      {isRTL ? brand.titleAr : brand.titleEn}
                    </h3>
                  </div>
                  
                  {/* Hover Glow Overlay */}
                  <div className="absolute inset-0 opacity-0 md:group-hover:opacity-100 premium-transition shadow-[inset_0_0_20px_rgba(255,107,53,0.3)] pointer-events-none"></div>
                </Link>
              </motion.div>
            ))}
          </div>

        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default DiecastCategoryPage;