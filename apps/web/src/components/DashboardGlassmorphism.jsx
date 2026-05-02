import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { getTierName } from '@/utils/translations';
import { Package, Heart, MessageSquare, Edit3, ArrowUpCircle, List } from 'lucide-react';

const DashboardGlassmorphism = ({ user, stats }) => {
  const { t, language } = useLanguage();
  
  const tier = user?.tier || 'Observer';
  
  // Tier specific styling
  const getTierStyles = () => {
    switch(tier) {
      case 'Dealer':
        return {
          bg: 'bg-gradient-to-br from-secondary/20 via-background to-background',
          shadow: 'shadow-[0_0_40px_rgba(255,215,0,0.15)]',
          badge: 'bg-secondary text-secondary-foreground'
        };
      case 'Collector':
        return {
          bg: 'bg-gradient-to-br from-primary/20 via-background to-background',
          shadow: 'shadow-[0_0_40px_rgba(255,107,53,0.15)]',
          badge: 'bg-primary text-primary-foreground'
        };
      case 'Hobbyist':
        return {
          bg: 'bg-[url(https://www.transparenttextures.com/patterns/brick-wall.png)] bg-background',
          shadow: 'shadow-[0_0_30px_rgba(255,255,255,0.05)]',
          badge: 'bg-muted text-foreground'
        };
      default:
        return {
          bg: 'bg-background',
          shadow: 'shadow-lg',
          badge: 'bg-muted text-muted-foreground'
        };
    }
  };

  const styles = getTierStyles();

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden ${styles.bg} ${styles.shadow} premium-transition`}>
      {/* Glass Panel Overlay */}
      <div className={`relative z-10 glass-panel p-8 md:p-12 rounded-2xl premium-border`}>
        
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-muted premium-border flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl bilingual-heading text-muted-foreground">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider whitespace-nowrap ${styles.badge}`}>
                {getTierName(tier, language)}
              </div>
            </div>
            
            <div className="text-center md:text-start mt-4">
              <h2 className="text-3xl bilingual-heading text-foreground">{user?.name || 'User'}</h2>
              <p className="text-muted-foreground text-lg bilingual-body">{user?.email}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 w-full grid grid-cols-3 gap-6">
            <div className="bg-black/20 rounded-xl p-6 premium-border flex flex-col items-center justify-center text-center hover:bg-black/30 premium-transition">
              <Package className="w-8 h-8 text-primary mb-3" />
              <span className="text-3xl bilingual-heading text-foreground">{stats?.listings || 0}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{t('nav.myListings')}</span>
            </div>
            <div className="bg-black/20 rounded-xl p-6 premium-border flex flex-col items-center justify-center text-center hover:bg-black/30 premium-transition">
              <Heart className="w-8 h-8 text-destructive mb-3" />
              <span className="text-3xl bilingual-heading text-foreground">{stats?.likes || 0}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider mt-1">Likes</span>
            </div>
            <div className="bg-black/20 rounded-xl p-6 premium-border flex flex-col items-center justify-center text-center hover:bg-black/30 premium-transition">
              <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
              <span className="text-3xl bilingual-heading text-foreground">{stats?.messages || 0}</span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{t('nav.messages')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 pt-8 border-t premium-border flex flex-wrap gap-4 justify-center md:justify-start">
          <Link to="/my-listings">
            <button className="btn-premium px-8 py-3 text-base flex items-center gap-3">
              <List className="w-5 h-5" />
              {t('nav.myListings')}
            </button>
          </Link>
          {tier !== 'Dealer' && (
            <button className="btn-premium-secondary px-8 py-3 text-base flex items-center gap-3">
              <ArrowUpCircle className="w-5 h-5" />
              {t('tiers.upgradeTier')}
            </button>
          )}
          <button className="bg-muted text-foreground hover:bg-muted/80 px-8 py-3 rounded-xl text-base font-bold uppercase tracking-wider premium-transition flex items-center gap-3">
            <Edit3 className="w-5 h-5" />
            {t('common.edit')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardGlassmorphism;