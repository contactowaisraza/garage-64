
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid } from 'lucide-react';

const BrowseListingsPage = () => {
  const { t } = useLanguage();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  const categories = ['Hot Wheels', 'Matchbox', 'RC Cars', 'DIY Garages', 'Planes', 'Miniatures'];

  useEffect(() => {
    fetchListings();
  }, [category]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let filterStr = 'status="Approved"';
      if (category !== 'all') {
        filterStr += ` && category="${category}"`;
      }
      const records = await pb.collection('listings').getList(1, 50, {
        filter: filterStr,
        sort: '-created',
        $autoCancel: false
      });
      setListings(records.items);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

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
                {loading ? ' ' : `${listings.length} listing${listings.length !== 1 ? 's' : ''} available`}
              </p>
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-full md:w-52 text-sm bg-card border-white/8 text-muted-foreground focus:ring-0 focus:border-primary/40 transition-colors">
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
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-36 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('listings.noListings')}</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Try a different category filter</p>
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
