
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { translateBatch } from '@/utils/translate';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Search, X } from 'lucide-react';

const FavoritesPage = () => {
  const { t, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [likedMap, setLikedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [translationsMap, setTranslationsMap] = useState({});

  useEffect(() => {
    if (currentUser) fetchFavorites();
    else setLoading(false);
  }, [currentUser]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const result = await pb.collection('likes').getList(1, 200, {
        filter: `user_id="${currentUser.id}"`,
        expand: 'listing_id',
        sort: '-created',
        $autoCancel: false,
      });
      const map = {};
      const items = [];
      for (const like of result.items) {
        if (like.expand?.listing_id) {
          map[like.listing_id] = like.id;
          items.push(like.expand.listing_id);
        }
      }
      setLikedMap(map);
      setListings(items);
    } catch (e) {
      console.error('Error fetching favorites:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = useCallback(async (listingId) => {
    if (!currentUser) return;
    const existingId = likedMap[listingId];
    if (!existingId) return;

    setLikedMap(prev => { const next = { ...prev }; delete next[listingId]; return next; });
    setListings(prev => prev.filter(l => l.id !== listingId));
    try {
      await pb.collection('likes').delete(existingId, { $autoCancel: false });
    } catch {
      setLikedMap(prev => ({ ...prev, [listingId]: existingId }));
      fetchFavorites();
    }
  }, [currentUser, likedMap]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(l =>
      l.title?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

  useEffect(() => {
    if (!isRTL || listings.length === 0) {
      setTranslationsMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      const texts = listings.flatMap(l => [l.title, l.description || '']);
      const translated = await translateBatch(texts);
      if (!cancelled) {
        const map = {};
        listings.forEach((l, i) => {
          map[l.id] = { title: translated[i * 2], description: translated[i * 2 + 1] };
        });
        setTranslationsMap(map);
      }
    })();
    return () => { cancelled = true; };
  }, [listings, isRTL]);

  return (
    <>
      <Helmet>
        <title>{`${t('nav.favorites')} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 pt-28 pb-24">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-5">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground leading-none">
                {t('nav.favorites')}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {loading ? ' ' : `${filteredListings.length} saved listing${filteredListings.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('common.search') || 'Search listings…'}
                className="h-9 pl-8 pr-8 w-full md:w-56 text-sm bg-card border-white/8 focus-visible:ring-0 focus-visible:border-primary/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-white/5 mb-10" />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl bg-white/4" />
                  <Skeleton className="h-4 w-2/3 bg-white/4" />
                  <Skeleton className="h-3 w-1/2 bg-white/4" />
                </div>
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isLiked={!!likedMap[listing.id]}
                  onToggleLike={handleToggleLike}
                  displayTitle={translationsMap[listing.id]?.title}
                  displayDescription={translationsMap[listing.id]?.description}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-36 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center">
                <Heart className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? t('common.noResults') : (t('favorites.noFavorites') || 'No saved listings yet')}
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  {searchQuery ? t('common.tryDifferentSearch') : 'Like listings to save them here'}
                </p>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FavoritesPage;
