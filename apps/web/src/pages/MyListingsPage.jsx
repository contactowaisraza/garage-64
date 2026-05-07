import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import { translateBatch } from '@/utils/translate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Eye, ShieldAlert, RefreshCw, Image as ImageIcon, ChevronLeft, ChevronRight, LayoutGrid, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const PER_PAGE = 12;

const TIER_LIMITS = {
  observer: 3,
  hobbyist: 3,
  collector: 7,
  dealer: 21
};

const MyListingsPage = () => {
  const { t, td, isRTL } = useLanguage();
  const { currentUser } = useAuth();

  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage]           = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [translationsMap, setTranslationsMap] = useState({});

  const userTier      = currentUser?.subscription_tier?.toLowerCase() || 'observer';
  const adLimit       = TIER_LIMITS[userTier] || 3;
  const totalPages    = Math.ceil(totalItems / PER_PAGE);
  const isLimitReached = totalItems >= adLimit;

  const fetchMyListings = useCallback(async (p = 1, query = '') => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let filter = `user_id="${currentUser.id}"`;
      if (query.trim()) {
        const q = query.trim().replace(/"/g, '');
        filter += ` && (title~"${q}" || description~"${q}")`;
      }
      const records = await pb.collection('listings').getList(p, PER_PAGE, {
        filter,
        sort: '-created',
        $autoCancel: false
      });
      setListings(records.items);
      setTotalItems(records.totalItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMyListings(page, searchQuery);
  }, [fetchMyListings, page]);

  // Debounced search: reset to page 1 and re-fetch when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchMyListings(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.delete') + '?')) return;
    try {
      await pb.collection('listings').delete(id, { $autoCancel: false });
      toast.success(t('common.success'));
      // stay on same page but refresh; if last item on page go back
      const newTotal = totalItems - 1;
      const safePage = page > Math.ceil(newTotal / PER_PAGE) ? Math.max(1, page - 1) : page;
      setPage(safePage);
      if (safePage === page) fetchMyListings(page);
    } catch {
      toast.error(t('common.error'));
    }
  };

  /* ── helpers ──────────────────────────────── */
  const statusConfig = {
    Approved: { label: t('listings.approved'), className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    Rejected: { label: t('listings.rejected'), className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    Pending:  { label: t('listings.pending'),  className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  };

  const tierConfig = {
    dealer:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
    collector: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
    hobbyist:  'text-amber-600 bg-amber-500/10 border-amber-500/20',
    observer:  'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  };

  const locale = isRTL ? 'ar-EG' : 'en-US';
  const fn = (n) => n.toLocaleString(locale);
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric', month: 'short', year: 'numeric'
    });

  const getImageUrl = (listing) =>
    listing.images?.length
      ? pb.files.getUrl(listing, listing.images[0], { thumb: '400x300' })
      : null;

  /* ── card ─────────────────────────────────── */
  const ListingCard = ({ listing }) => {
    const imgUrl = getImageUrl(listing);
    const status = statusConfig[listing.status] ?? statusConfig.Pending;
    const isSell = listing.listingType === 'sell';
    const displayTitle = translationsMap[listing.id]?.title || listing.title;
    const displayDescription = translationsMap[listing.id]?.description || listing.description;

    return (
      <div className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden flex flex-col hover:border-white/10 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 group">

        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-[#111]">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
              <ImageIcon className="w-10 h-10" />
            </div>
          )}

          {/* Type pill */}
          <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'}`}>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isSell
                ? 'bg-primary/90 text-black'
                : 'bg-white/10 text-white/70 backdrop-blur-sm'
            }`}>
              {isSell ? t('listings.forSale') : t('listings.showcaseOnly')}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 gap-3">

          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 leading-snug" dir="auto">
            {displayTitle}
          </h3>

          {/* Description */}
          {displayDescription && (
            <p className="text-[11px] text-muted-foreground/60 line-clamp-2 leading-relaxed -mt-1" dir="auto">
              {displayDescription}
            </p>
          )}

          {/* Category + Status */}
          <div className="flex items-center gap-2 flex-wrap">
            {listing.category && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground border-white/10">
                {td(listing.category)}
              </Badge>
            )}
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${status.className}`}>
              {status.label}
            </Badge>
          </div>

          {/* Rejection reason */}
          {listing.status === 'Rejected' && listing.rejection_reason && (
            <p className="text-[11px] text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 leading-relaxed" dir="auto">
              {listing.rejection_reason}
            </p>
          )}

          {/* Date */}
          <p className="text-[11px] text-muted-foreground/50 mt-auto">
            {formatDate(listing.created)}
          </p>

          {/* Actions */}
          <div className={`flex items-center gap-2 pt-3 border-t border-white/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button size="sm" variant="ghost" asChild className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 flex-1">
              <Link to={`/listing/${listing.id}`}>
                <Eye className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('common.view')}
              </Link>
            </Button>

            {listing.status === 'Rejected' && (
              <Button size="sm" variant="ghost" asChild className="h-8 px-3 text-xs text-primary hover:bg-primary flex-1">
                <Link to={`/edit-listing/${listing.id}`}>
                  <RefreshCw className={`w-3.5 h-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('listings.resubmit')}
                </Link>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(listing.id)}
              className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /* ── skeleton card ─────────────────────────── */
  const CardSkeleton = () => (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full bg-white/4 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 bg-white/4" />
        <Skeleton className="h-3 w-1/2 bg-white/4" />
        <Skeleton className="h-8 w-full bg-white/4 mt-4" />
      </div>
    </div>
  );

  /* ── pagination ────────────────────────────── */
  const Pagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div className={`flex items-center justify-center gap-2 mt-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span className={isRTL ? 'mr-1' : 'ml-1'}>{t('common.previous')}</span>
        </Button>

        <div className="flex items-center gap-1">
          {pages.map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-black'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {fn(p)}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <span className={isRTL ? 'ml-1' : 'mr-1'}>{t('common.next')}</span>
          {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    );
  };

  /* ── render ────────────────────────────────── */
  return (
    <>
      <Helmet>
        <title>{`${t('listings.myListingsTitle')} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 pt-28 pb-24">

          {/* Page header */}
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-5 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-4xl font-bold tracking-tight text-foreground leading-none">
                  {t('listings.myListingsTitle')}
                </h1>
                <Badge variant="outline" className={`capitalize text-xs px-2.5 py-1 border ${tierConfig[userTier]}`}>
                  {td(userTier)}
                </Badge>
              </div>
              <p className={`mt-2 text-sm text-muted-foreground flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className={isLimitReached ? 'text-red-400 font-semibold' : 'text-foreground font-semibold'}>
                  {fn(totalItems)}
                </span>
                <span>/</span>
                <span className="font-semibold">{fn(adLimit)}</span>
                <span className="text-muted-foreground/60">
                  {t('common.adsUsed')}
                </span>
                {isLimitReached && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('common.search') || 'Search listings…'}
                  className="h-9 pl-8 pr-8 w-48 text-sm bg-card border-white/8 focus-visible:ring-0 focus-visible:border-primary/40"
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

              <Button
                asChild={!isLimitReached}
                disabled={isLimitReached}
                className="h-10 px-5 text-sm font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLimitReached ? (
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {t('listings.createListing')}
                  </span>
                ) : (
                  <Link to="/create-listing" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {t('listings.createListing')}
                  </Link>
                )}
              </Button>
            </div>
          </div>

          <div className="h-px bg-white/5 mb-10" />

          {/* Cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-36 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('listings.noListings')}</p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  {t('common.createFirstListing')}
                </p>
              </div>
              <Button asChild size="sm" className="mt-2 h-9 px-5 text-xs">
                <Link to="/create-listing">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {t('listings.createListing')}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination />
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MyListingsPage;
