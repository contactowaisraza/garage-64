
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

const Footer = () => {
  const { t, isRTL } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] border-t border-[#2a2a2a] py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#ff8c00] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl font-bold text-[#1a1a1a]">64</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                GARAGE<span className="text-[#ff8c00]">64</span>
              </span>
            </div>
            <p className="text-[#a0a0a0] text-sm max-w-sm leading-relaxed">
              {isRTL 
                ? 'المجتمع الأول في العراق لمقتني السيارات المصغرة والكلاسيكية. تواصل، تداول، وابنِ مجموعتك.' 
                : "Iraq's premier community for diecast and classic car collectors. Connect, trade, and build your collection."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {isRTL ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <div className="flex flex-col gap-2">
              <Link to="/browse" className="text-sm text-[#808080] hover:text-[#ff8c00] transition-colors w-fit">
                {t('nav.browse')}
              </Link>
              <Link to="/bazaar" className="text-sm text-[#808080] hover:text-[#ff8c00] transition-colors w-fit">
                {t('nav.bazaar')}
              </Link>
              <Link to="/login" className="text-sm text-[#808080] hover:text-[#ff8c00] transition-colors w-fit">
                {t('nav.login')}
              </Link>
            </div>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {isRTL ? 'تواصل معنا' : 'Contact Us'}
            </h4>
            <div className="flex flex-col gap-2">
              <a href="mailto:support@garage64.com" className="text-sm text-[#808080] hover:text-[#ff8c00] transition-colors w-fit">
                support@garage64.com
              </a>
              <div className="flex gap-4 mt-2">
                <Link to="/privacy" className="text-xs text-[#606060] hover:text-[#c0c0c0] transition-colors">
                  {t('footer.privacy')}
                </Link>
                <Link to="/terms" className="text-xs text-[#606060] hover:text-[#c0c0c0] transition-colors">
                  {t('footer.terms')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#2a2a2a] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#606060]">
            {t('footer.copyright').replace('{year}', currentYear)}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
