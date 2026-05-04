import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  User, Tag, Layers, Calendar, ShieldCheck,
  MessageCircle, Image as ImageIcon
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────── */
const conditionColor = (c) => {
  const map = {
    Mint: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'Near Mint': 'bg-green-500/10 text-green-600 border-green-500/20',
    Excellent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    Good: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    Fair: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    Poor: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return map[c] || 'bg-muted text-muted-foreground border-border';
};

const statusBadge = (status) => {
  if (status === 'Approved') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Approved</Badge>;
  if (status === 'Rejected') return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Rejected</Badge>;
  return <Badge variant="secondary" className="text-xs">Pending</Badge>;
};

/* ── skeleton ─────────────────────────────────────────── */
const LoadingSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 container mx-auto px-4 py-32 max-w-6xl">
      <Skeleton className="h-9 w-28 mb-8 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
        <div className="space-y-3">
          <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-20 h-20 rounded-xl flex-shrink-0" />)}
          </div>
        </div>
        <div className="space-y-5">
          <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /></div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

/* ── main component ───────────────────────────────────── */
const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const isObserver = currentUser?.subscription_tier?.toLowerCase() === 'observer' || !currentUser;

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => { fetchListing(); }, [id]);

  const fetchListing = async () => {
    try {
      const record = await pb.collection('listings').getOne(id, { $autoCancel: false });
      setListing(record);
      if (record.user_id) {
        try {
          const user = await pb.collection('users').getOne(record.user_id, { $autoCancel: false });
          setSeller(user);
        } catch { /* seller stays null */ }
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (!listing) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2">
          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-40" />
        </div>
        <h2 className="text-2xl font-bold">{t('common.error') || 'Listing not found'}</h2>
        <p className="text-muted-foreground text-sm">This listing may have been removed.</p>
        <Button onClick={() => navigate('/browse')} className="mt-2">{t('common.back') || 'Back to Browse'}</Button>
      </main>
      <Footer />
    </div>
  );

  const images = listing.images?.length > 0
    ? listing.images.map(img => pb.files.getUrl(listing, img))
    : null;

  const prevImage = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveImage(i => (i + 1) % images.length);
  const isSale = listing.listingType === 'sell' || listing.listing_type === 'sell';

  return (
    <>
      <Helmet>
        <title>{`${listing.title} - ${t('brand.name') || 'Garage64'}`}</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-32 max-w-6xl">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-0.5 ${isRTL ? 'rotate-180' : ''}`} />
            {t('common.back') || 'Back'}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">

            {/* ── Left: Image Gallery ─────────────────────── */}
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border group">
                {images ? (
                  <img
                    key={activeImage}
                    src={images[activeImage]}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 opacity-20" />
                    <p className="text-sm">No photos</p>
                  </div>
                )}

                {/* Nav arrows */}
                {images?.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {/* Counter */}
                    <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm border border-border text-xs font-medium px-2.5 py-1 rounded-full">
                      {activeImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeImage
                          ? 'border-primary shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Details panel ────────────────────── */}
            <div className="space-y-6 lg:sticky lg:top-28">

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium bg-background">
                  {listing.category}
                </Badge>
                {isSale ? (
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20">For Sale</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Showcase</Badge>
                )}
                {statusBadge(listing.status)}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold tracking-tight leading-tight">{listing.title}</h1>

              {/* Price */}
              {isSale && listing.price && !isObserver && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-muted-foreground font-medium">SAR</span>
                  <span className="text-4xl font-bold text-primary">{Number(listing.price).toLocaleString()}</span>
                </div>
              )}

              <Separator />

              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{t('listings.condition') || 'Condition'}</p>
                    <Badge variant="outline" className={`text-xs font-semibold ${conditionColor(listing.condition)}`}>
                      {listing.condition || '—'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <Layers className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{t('listings.type') || 'Type'}</p>
                    <p className="text-sm font-semibold capitalize">{isSale ? 'For Sale' : 'Showcase'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{t('listings.category') || 'Category'}</p>
                    <p className="text-sm font-semibold truncate">{listing.category || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{t('listings.date') || 'Posted'}</p>
                    <p className="text-sm font-semibold">{new Date(listing.created).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('listings.description') || 'Description'}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border border-border/50 rounded-xl p-4 bg-muted/20">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Seller card */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {seller?.name ? (
                    <span className="text-lg font-bold text-primary">
                      {seller.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">{t('listings.seller') || 'Listed by'}</p>
                  <p className="font-semibold text-sm truncate">{seller?.name || 'Unknown User'}</p>
                  {seller?.subscription_tier && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{seller.subscription_tier} member</p>
                  )}
                </div>
              </div>

              {/* CTA */}
              {isSale && (
                <Button asChild className="w-full h-12 text-base font-semibold shadow-sm">
                  <Link to={`/messages`} state={{ listingId: id, sellerId: listing.user_id }}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('listings.contactSeller') || 'Contact Seller'}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ListingDetailPage;
