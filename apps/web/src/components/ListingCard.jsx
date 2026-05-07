
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import CategoryBadge from './CategoryBadge';
import ConditionBadge from './ConditionBadge';
import CarsPriceBadge from './CarsPriceBadge';
import { Heart, Image as ImageIcon } from 'lucide-react';

const ListingCard = ({ listing, isLiked = false, onToggleLike, isOwnListing = false, displayTitle, displayDescription }) => {
  const { isRTL, td, t } = useLanguage();
  const { currentUser } = useAuth();

  const imageUrl = listing.images && listing.images.length > 0
    ? pb.files.getUrl(listing, listing.images[0], { thumb: '400x400' })
    : null;

  const userTier = currentUser?.tier || currentUser?.subscription_tier;
  const isSale = listing.listingType === 'sell' || listing.listing_type === 'sell';

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || !onToggleLike) return;
    onToggleLike(listing.id);
  };

  return (
    <Link to={`/listing/${listing.id}`} className="group block h-full">
      <div className="bg-[#0d0d0d] rounded-xl overflow-hidden border border-white/5 hover:border-white/12 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 flex flex-col h-full relative">

        {isSale && <CarsPriceBadge price={listing.price} tier={userTier} />}

        {/* Own listing badge / Like button */}
        {isOwnListing ? (
          <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm text-[10px] font-semibold text-white tracking-wide">
            {t('listings.yourListing') || 'Yours'}
          </div>
        ) : currentUser && (
          <button
            onClick={handleLike}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-black/70"
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white/70'}`}
            />
          </button>
        )}

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
            {displayTitle || listing.title}
          </h3>

          <p className="mt-1.5 text-xs text-muted-foreground/70 line-clamp-2 flex-1 leading-relaxed" dir="auto">
            {displayDescription || listing.description || t('listings.noDescription')}
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
              {td(listing.listingType === 'sell' ? 'sell' : 'showcase')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
