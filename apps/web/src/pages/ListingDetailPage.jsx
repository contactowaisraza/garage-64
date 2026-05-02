import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ArrowLeft, User } from 'lucide-react';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const record = await pb.collection('listings').getOne(id, {
        expand: 'user_id',
        $autoCancel: false
      });
      setListing(record);
      if (record.expand?.user_id) {
        setSeller(record.expand.user_id);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto premium-section mt-20">
          <Skeleton className="h-12 w-40 mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 premium-gap">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-14 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto premium-section mt-20 text-center">
          <h2 className="text-3xl bilingual-heading mb-6">{t('common.error')}</h2>
          <Button onClick={() => navigate('/browse')} className="btn-premium px-8 py-3 text-lg">{t('common.back')}</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = listing.images?.length > 0 
    ? listing.images.map(img => pb.files.getUrl(listing, img))
    : ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80'];

  return (
    <>
      <Helmet>
        <title>{`${listing.title} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto premium-section mt-20">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-10 gap-3 text-lg hover:bg-muted/50 premium-transition">
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t('common.back')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 premium-gap">
            {/* Image Gallery */}
            <div className="space-y-6">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted premium-border">
                <img 
                  src={images[activeImage]} 
                  alt={listing.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0 premium-transition ${activeImage === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="px-4 py-1.5 text-sm">{listing.category}</Badge>
                  {listing.listing_type === 'Sale' && (
                    <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm">{t('listings.sale')}</Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl bilingual-heading mb-4">
                  {listing.title}
                </h1>
                {listing.listing_type === 'Sale' && listing.price && (
                  <p className="text-4xl bilingual-heading text-primary mt-6">${listing.price}</p>
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-2xl bilingual-heading mb-4">{t('listings.description')}</h3>
                <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed bilingual-body">
                  {listing.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 py-8 border-y premium-border">
                <div>
                  <p className="text-base text-muted-foreground mb-2 bilingual-body">{t('listings.condition')}</p>
                  <p className="text-xl bilingual-heading">{listing.condition || '-'}</p>
                </div>
                <div>
                  <p className="text-base text-muted-foreground mb-2 bilingual-body">{t('listings.date')}</p>
                  <p className="text-xl bilingual-heading">{new Date(listing.created).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-card premium-border rounded-2xl p-8 flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base text-muted-foreground mb-1 bilingual-body">{t('listings.seller')}</p>
                  <p className="text-2xl bilingual-heading">{seller?.name || 'Unknown User'}</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ListingDetailPage;