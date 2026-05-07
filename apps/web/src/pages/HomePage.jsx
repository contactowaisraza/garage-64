
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RulesSection from '@/components/RulesSection.jsx';
import MembershipTiersSection from '@/components/MembershipTiersSection.jsx';
import { motion } from 'framer-motion';

const CATEGORY_CARDS = [
  {
    key: 'Hot Wheels',
    titleAr: 'هوت ويلز',
    titleEn: 'Hot Wheels',
    image: 'https://images.unsplash.com/photo-1700236824333-e50905528eb2?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'Matchbox',
    titleAr: 'ماتشبوكس',
    titleEn: 'Matchbox',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'RC Cars',
    titleAr: 'سيارات تحكم',
    titleEn: 'RC Cars',
    image: 'https://images.unsplash.com/photo-1667141595746-956a6a115ac5?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'DIY Garages',
    titleAr: 'كراجات وورش',
    titleEn: 'DIY Garages',
    image: 'https://images.unsplash.com/photo-1624561194207-fca26d55de5a?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'Planes',
    titleAr: 'طائرات',
    titleEn: 'Planes',
    image: 'https://images.unsplash.com/photo-1695927521778-6e0579cbe9ad?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'Miniatures',
    titleAr: 'مجسمات',
    titleEn: 'Miniatures',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'Bazaar',
    titleAr: 'البازار',
    titleEn: 'Bazaar',
    image: 'https://images.unsplash.com/photo-1647637462337-79788a284a51?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'Others',
    titleAr: 'أخرى',
    titleEn: 'Others',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1000&auto=format&fit=crop',
  },
];

const HomePage = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const scrollToTiers = () => {
    const element = document.getElementById('membership-tiers');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/register');
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('brand.name')} - {t('brand.tagline')}</title>
        <meta name="description" content={t('brand.tagline')} />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1">
          {/* HERO SECTION */}
          <section className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1618847018112-89f9b910b537?q=80&w=2070&auto=format&fit=crop" 
                alt="Garage64 Hero" 
                className="w-full h-full object-cover object-center animate-ken-burns"
              />
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <div className="container relative z-10 px-4 mx-auto text-center flex flex-col items-center justify-center h-full">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="max-w-4xl mx-auto space-y-6 mt-[60px]"
              >
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl tracking-tighter">
                  {isRTL ? 'كراج 64' : 'GARAGE 64'}
                </h1>
                
                <p className="text-xl md:text-2xl text-[#ff8c00] drop-shadow-md font-medium tracking-wide">
                  {isRTL ? 'المجتمع الأول في العراق' : "Iraq's Premier Community"}
                </p>

                <div className="pt-12">
                  <button 
                    onClick={scrollToTiers}
                    className="bg-[#ff8c00] text-[#1a1a1a] rounded-lg px-10 py-4 text-lg font-bold uppercase tracking-wider transition-all duration-300 hover:bg-[#e67e00] hover:scale-105 active:scale-95 shadow-lg"
                  >
                    {isRTL ? 'انضم الآن' : 'Join Now'}
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* RULES SECTION */}
          <RulesSection />

          {/* SECTION 1: EXPLORE CARS & GEAR */}
          <section id="categories" className="py-24 container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16 space-y-4"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">
                {isRTL ? 'استكشف السيارات والمعدات' : 'Explore Cars & Gear'}
              </h2>
              <p className="text-[#c0c0c0] text-[16px] max-w-2xl mx-auto leading-[1.6]">
                {isRTL
                  ? 'المعرض: اكتشف الكلاسيكيات النادرة، والترميمات اللامعة، والقطع التي تبقيها تعمل.'
                  : 'The Showroom: Discover rare classics, shiny restorations, and the parts that keep them running.'}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {CATEGORY_CARDS.map((cat, index) => (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group relative rounded-[12px] overflow-hidden aspect-video md:aspect-auto md:h-[280px] cursor-pointer active:scale-[0.98] md:active:scale-100 transition-all duration-300 md:hover:scale-[1.02] md:hover:-translate-y-1 border border-white/10"
                  onClick={() => navigate(`/browse?category=${encodeURIComponent(cat.key)}`)}
                >
                  <img
                    src={cat.image}
                    alt={isRTL ? cat.titleAr : cat.titleEn}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full transition-transform duration-300 md:group-hover:-translate-y-2">
                    <h3 className="text-2xl md:text-3xl text-white font-bold drop-shadow-lg tracking-wide uppercase">
                      {isRTL ? cat.titleAr : cat.titleEn}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* SECTION 2: BAZAR PORTAL */}
          {/* <section className="pb-24 container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <h2 className="text-[36px] font-bold text-white mb-[16px] text-center">
                استكشف البازار
              </h2>
              
              <p className="text-[14px] md:text-[16px] text-[#c0c0c0] text-center leading-[1.6] mb-[32px]">
                البازار: سُوكنا الرقمي لكل شي. عندك غرض بالبيت زايد وما تحتاجه؟ أو أنت تاجر وعندك بضاعة جديدة ومغلفة؟ إن كان الغرض أنتيك، مستعمل، أو جديد باكيت.. إذا حاب تبيع أو تشتري، مكانه هنا. مباشر، بسيط، ومفتوح للكل.
              </p>

              <div
                onClick={() => navigate('/bazar')}
                className="bazar-portal-card h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] group"
              >
                <img
                  src="https://images.unsplash.com/photo-1647637462337-79788a284a51"
                  alt="Bazar Marketplace"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-0 right-0 bg-[rgba(0,0,0,0.3)] p-[16px] backdrop-blur-sm rounded-tl-[8px]">
                  <span className="text-white text-[24px] font-bold">البازار</span>
                </div>
              </div>
            </motion.div>
          </section> */}

          {/* THE TIERS SECTION */}
          <MembershipTiersSection />

        </main>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;
