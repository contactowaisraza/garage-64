
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import CategoryBadge from './CategoryBadge';
import ConditionBadge from './ConditionBadge';
import CarsPriceBadge from './CarsPriceBadge';
import { Image as ImageIcon } from 'lucide-react';

const ListingCard = ({ listing }) => {
  const { isRTL } = useLanguage();
  const { currentUser } = useAuth();
  
  const imageUrl = listing.images && listing.images.length > 0 
    ? pb.files.getUrl(listing, listing.images[0], { thumb: '400x400' })
    : null;

  const userTier = currentUser?.tier || currentUser?.subscription_tier;

  return (
    <Link to={`/listings/${listing.id}`} className="group block h-full">
      <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full relative">
        
        {/* Cars Price Badge */}
        <CarsPriceBadge price={listing.price} tier={userTier} />

        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 opacity-20" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            <CategoryBadge category={listing.category} />
            <ConditionBadge condition={listing.condition} />
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors" dir="auto">
            {listing.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1" dir="auto">
            {listing.description || (isRTL ? 'لا يوجد وصف' : 'No description provided.')}
          </p>
          
          <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
            <span className="text-xs text-muted-foreground">
              {new Date(listing.created).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
              {listing.listingType === 'sell' ? (isRTL ? 'للبيع' : 'For Sale') : (isRTL ? 'للعرض' : 'Showcase')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
