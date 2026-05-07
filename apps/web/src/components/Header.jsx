
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { LogOut, Menu, MessageSquare, Heart, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { t, toggleLanguage, language, isRTL } = useLanguage();
  const { isAuthenticated, currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && (currentUser?.tier === 'Hobbyist' || currentUser?.tier === 'Collector' || currentUser?.tier === 'Dealer')) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, currentUser]);

  const fetchUnreadCount = async () => {
    try {
      const records = await pb.collection('messages').getList(1, 1, {
        filter: `recipient_id="${currentUser.id}" && read_at=""`,
        $autoCancel: false
      });
      setUnreadCount(records.totalItems);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleJoinNow = () => {
    setMobileMenuOpen(false);
    if (isHomePage) {
      const el = document.getElementById('membership-tiers');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/register');
  };

  const isActive = (path) => location.pathname === path;
  const showMessagesLink = isAuthenticated && !isAdmin && (currentUser?.tier === 'Hobbyist' || currentUser?.tier === 'Collector' || currentUser?.tier === 'Dealer');

  const headerBg = scrolled || !isHomePage || mobileMenuOpen
    ? 'bg-[#1a1a1a] shadow-md border-b border-[#2a2a2a]' 
    : 'bg-transparent border-b border-transparent';

  const NavLinks = ({ mobile = false }) => (
    <>
      <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`bilingual-heading uppercase font-medium premium-transition ${mobile ? 'text-xl py-2' : 'text-xs'} ${isActive('/') ? 'text-[#ff8c00]' : 'text-white/80 hover:text-white'}`}>
        {t('nav.home')}
      </Link>
      {/* <Link to="/browse" onClick={() => setMobileMenuOpen(false)} className={`bilingual-heading uppercase font-medium premium-transition ${mobile ? 'text-xl py-2' : 'text-xs'} ${isActive('/browse') ? 'text-[#ff8c00]' : 'text-white/80 hover:text-white'}`}>
        {t('nav.browse')}
      </Link>
      <Link to="/bazar" onClick={() => setMobileMenuOpen(false)} className={`bilingual-heading uppercase font-medium premium-transition ${mobile ? 'text-xl py-2' : 'text-xs'} ${isActive('/bazaar') ? 'text-[#ff8c00]' : 'text-white/80 hover:text-white'}`}>
        {t('nav.bazaar')}
      </Link> */}

      {isAuthenticated && !isAdmin && (
        <>
          <Link to="/my-listings" onClick={() => setMobileMenuOpen(false)} className={`bilingual-heading uppercase font-medium premium-transition ${mobile ? 'text-xl py-2' : 'text-xs'} ${isActive('/my-listings') ? 'text-[#ff8c00]' : 'text-white/80 hover:text-white'}`}>
            {t('nav.myListings')}
          </Link>
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={`bilingual-heading uppercase font-medium premium-transition ${mobile ? 'text-xl py-2' : 'text-xs'} ${isActive('/profile') ? 'text-[#ff8c00]' : 'text-white/80 hover:text-white'}`}>
            {t('nav.profile')}
          </Link>
          <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className={`bilingual-heading uppercase font-medium premium-transition ${mobile ? 'text-xl py-2' : 'text-xs'} ${isActive('/messages') ? 'text-[#ff8c00]' : 'text-white/80 hover:text-white'}`}>
            {t('nav.messages')}
          </Link>
        </>
      )}

      {isAuthenticated && isAdmin && (
        <Link to="/admin-dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-1.5 bilingual-heading uppercase font-medium premium-transition ${mobile ? 'text-xl py-2' : 'text-xs'} ${isActive('/admin-dashboard') ? 'text-[#ff8c00]' : 'text-[#ff8c00]/80 hover:text-[#ff8c00]'}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          {isRTL ? 'لوحة التحكم' : 'Admin'}
        </Link>
      )}
    </>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${headerBg}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between">
          
          {/* Compact Logo */}
          <Link to="/" className="flex items-center gap-3 z-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 bg-[#ff8c00] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-[#1a1a1a]">64</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block tracking-tight">
              GARAGE<span className="text-[#ff8c00]">64</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className={`hidden md:flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <NavLinks />

            <div className="flex items-center gap-4 border-l border-[#404040] pl-4 ml-1">
              {showMessagesLink && (
                <Link to="/messages" className="relative group">
                  <button className="p-1.5 text-white/80 hover:text-white premium-transition">
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-[#ff8c00] text-[10px] font-bold text-[#1a1a1a] rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </Link>
              )}

              {isAuthenticated && !isAdmin && (
                <Link to="/favorites" className={`p-1.5 premium-transition ${isActive('/favorites') ? 'text-[#ff8c00]' : 'text-white/80 hover:text-white'}`} title={t('nav.favorites')}>
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              <button onClick={toggleLanguage} className="text-xs font-bold text-white/80 hover:text-white uppercase transition-colors">
                {language === 'en' ? 'عربي' : 'EN'}
              </button>

              {!isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-xs font-bold text-white hover:text-[#c0c0c0] transition-colors uppercase">
                    {t('nav.login')}
                  </Link>
                  <button 
                    onClick={handleJoinNow} 
                    className="bg-[#ff8c00] hover:bg-[#e67e00] text-[#1a1a1a] px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-colors"
                  >
                    {isRTL ? 'انضم الآن' : 'Join Now'}
                  </button>
                </div>
              ) : (
                <button onClick={handleLogout} className="text-white/80 hover:text-white p-1.5 transition-colors" title={t('nav.logout')}>
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Toggle */}
          <div className="flex md:hidden items-center gap-3 z-50">
            {showMessagesLink && (
              <Link to="/messages" className="relative">
                <button className="p-1.5 text-white">
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-[#ff8c00] text-[10px] font-bold text-[#1a1a1a] rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </Link>
            )}
            {isAuthenticated && !isAdmin && (
              <Link to="/favorites" className={`p-1.5 ${isActive('/favorites') ? 'text-[#ff8c00]' : 'text-white'}`}>
                <Heart className="w-5 h-5" />
              </Link>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[60px] bg-[#1a1a1a] z-40 flex flex-col p-6 overflow-y-auto border-t border-[#2a2a2a]"
          >
            <div className="flex flex-col gap-6 mt-4">
              <NavLinks mobile={true} />
              
              <div className="h-px bg-[#2a2a2a] w-full my-2"></div>
              
              <button onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} className="text-left font-bold text-lg text-white/80 hover:text-white uppercase">
                {language === 'en' ? 'عربي' : 'English'}
              </button>

              {!isAuthenticated ? (
                <div className="flex flex-col gap-4 mt-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-3 text-sm font-bold uppercase border border-[#ff8c00] text-[#ff8c00] hover:bg-[#ff8c00]/10 rounded-md transition-colors">
                      {t('nav.login')}
                    </button>
                  </Link>
                  <button 
                    onClick={handleJoinNow} 
                    className="w-full py-3 text-sm font-bold uppercase bg-[#ff8c00] text-[#1a1a1a] hover:bg-[#e67e00] rounded-md transition-colors"
                  >
                    {isRTL ? 'انضم الآن' : 'Join Now'}
                  </button>
                </div>
              ) : (
                <button onClick={handleLogout} className="mt-4 flex items-center gap-3 text-[#dc143c] font-bold text-lg">
                  <LogOut className="w-6 h-6" />
                  {t('nav.logout')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
