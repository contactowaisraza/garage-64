
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, Search, X } from 'lucide-react';
import { LISTING_CATEGORIES } from '@/utils/categories';
import { translateBatch } from '@/utils/translate';

const BrowseListingsPage = () => {
  const { t, td, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [translationsMap, setTranslationsMap] = useState({});

  const initialCategory = () => {
    const param = new URLSearchParams(location.search).get('category');
    return param && LISTING_CATEGORIES.includes(param) ? param : 'all';
  };

  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    const param = new URLSearchParams(location.search).get('category');
    const next = param && LISTING_CATEGORIES.includes(param) ? param : 'all';
    setCategory(next);
    setSearchQuery('');
  }, [location.search]);

  useEffect(() => {
    fetchListings();
  }, [category]);

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

  const fetchListings = async () => {
    setLoading(true);
    try {
      let filterStr = 'status="Approved"';
      if (category !== 'all') filterStr += ` && category="${category}"`;

      const records = await pb.collection('listings').getList(1, 50, {
        filter: filterStr,
        sort: '-created',
        $autoCancel: false,
      });
      setListings(records.items);

      if (currentUser && records.items.length > 0) {
        const ids = records.items.map(l => `listing_id="${l.id}"`).join(' || ');
        const likesResult = await pb.collection('likes').getList(1, 200, {
          filter: `user_id="${currentUser.id}" && (${ids})`,
          $autoCancel: false,
        });
        const map = {};
        for (const like of likesResult.items) {
          map[like.listing_id] = like.id;
        }
        setLikedMap(map);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = useCallback(async (listingId) => {
    if (!currentUser) return;
    const existingId = likedMap[listingId];

    if (existingId) {
      setLikedMap(prev => { const next = { ...prev }; delete next[listingId]; return next; });
      try {
        await pb.collection('likes').delete(existingId, { $autoCancel: false });
      } catch {
        setLikedMap(prev => ({ ...prev, [listingId]: existingId }));
      }
    } else {
      const tempId = `temp_${listingId}`;
      setLikedMap(prev => ({ ...prev, [listingId]: tempId }));
      try {
        const record = await pb.collection('likes').create(
          { user_id: currentUser.id, listing_id: listingId },
          { $autoCancel: false }
        );
        setLikedMap(prev => ({ ...prev, [listingId]: record.id }));
      } catch {
        setLikedMap(prev => { const next = { ...prev }; delete next[listingId]; return next; });
      }
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

  return (
    <>
      <Helmet>
        <title>{`${t('listings.browseTitle')} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 pt-28 pb-24">

          {/* Page header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-5">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground leading-none">
                {t('listings.browseTitle')}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {loading ? ' ' : `${filteredListings.length} listing${filteredListings.length !== 1 ? 's' : ''} available`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('common.search') || 'Search listings…'}
                  className="h-9 pl-8 pr-8 w-full sm:w-56 text-sm bg-card border-white/8 focus-visible:ring-0 focus-visible:border-primary/40"
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

              {/* Category filter */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 w-full sm:w-52 text-sm bg-card border-white/8 text-muted-foreground focus:ring-0 focus:border-primary/40 transition-colors">
                  <SelectValue placeholder={t('listings.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('listings.allCategories')}</SelectItem>
                  {LISTING_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{td(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px bg-white/5 mb-10" />

          {/* Grid */}
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
                  isOwnListing={!!currentUser && listing.user_id === currentUser.id}
                  displayTitle={translationsMap[listing.id]?.title}
                  displayDescription={translationsMap[listing.id]?.description}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-36 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? t('common.noResults') : t('listings.noListings')}
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  {searchQuery ? t('common.tryDifferentSearch') : 'Try a different category filter'}
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

export default BrowseListingsPage;
