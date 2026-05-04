
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
    <Link to={`/listing/${listing.id}`} className="group block h-full">
      <div className="bg-[#0d0d0d] rounded-xl overflow-hidden border border-white/5 hover:border-white/12 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 flex flex-col h-full relative">

        <CarsPriceBadge price={listing.price} tier={userTier} />

        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-[#111]">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
              {/* Subtle gradient so badges are always readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
              <ImageIcon className="w-10 h-10" />
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            <CategoryBadge category={listing.category} />
            <ConditionBadge condition={listing.condition} />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200" dir="auto">
            {listing.title}
          </h3>

          <p className="mt-1.5 text-xs text-muted-foreground/70 line-clamp-2 flex-1 leading-relaxed" dir="auto">
            {listing.description || (isRTL ? 'لا يوجد وصف' : 'No description provided.')}
          </p>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/50 tabular-nums">
              {new Date(listing.created).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
              listing.listingType === 'sell'
                ? 'text-primary/80 bg-primary/8'
                : 'text-muted-foreground/60 bg-white/4'
            }`}>
              {listing.listingType === 'sell'
                ? (isRTL ? 'للبيع' : 'For Sale')
                : (isRTL ? 'للعرض' : 'Showcase')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
