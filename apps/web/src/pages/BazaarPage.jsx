import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

const BazaarPage = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  const categories = ['Used Electronics', 'Restoration Tools', 'Hobby/Camera Gear'];
  const isObserver = currentUser?.tier === 'Observer';

  useEffect(() => {
    if (!isObserver) {
      fetchListings();
    } else {
      setLoading(false);
    }
  }, [category, isObserver]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let filterStr = 'status="Approved"';
      if (category !== 'all') {
        filterStr += ` && bazaar_category="${category}"`;
      }
      
      const records = await pb.collection('bazaar_listings').getList(1, 50, {
        filter: filterStr,
        sort: '-created',
        $autoCancel: false
      });
      setListings(records.items);
    } catch (error) {
      console.error('Error fetching bazaar listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('listings.bazaarTitle')} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto premium-section mt-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <h1 className="text-4xl bilingual-heading">
              {t('listings.bazaarTitle')}
            </h1>
            
            {!isObserver && (
              <div className="w-full md:w-72">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder={t('listings.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('listings.allCategories')}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isObserver ? (
            <Alert className="max-w-3xl mx-auto mt-16 premium-border bg-card p-8">
              <Lock className="h-6 w-6 text-primary" />
              <AlertTitle className="text-xl bilingual-heading mt-4 mb-2">{t('common.error')}</AlertTitle>
              <AlertDescription className="text-lg bilingual-body text-muted-foreground">
                {t('listings.observerBazaarRestricted')}
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 premium-gap">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 premium-gap">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} isBazaar={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 text-muted-foreground bilingual-body text-xl">
              <p>{t('listings.noListings')}</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BazaarPage;