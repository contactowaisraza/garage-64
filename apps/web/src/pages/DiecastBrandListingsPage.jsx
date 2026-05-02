import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, ChevronLeft, Home, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';

const DiecastBrandListingsPage = () => {
  const { brand } = useParams();
  const decodedBrand = decodeURIComponent(brand);
  const { isRTL } = useLanguage();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('-created');

  // Simple mapping for display titles (assuming English matches decodedBrand for simplicity in this demo)
  const displayBrand = decodedBrand;

  useEffect(() => {
    fetchListings();
  }, [decodedBrand, sort]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      // In PocketBase, these categories represent the "brands" in our context.
      // We map the requested brand to the category field.
      const filterStr = `status="Approved" && category="${decodedBrand.replace(/"/g, '\\"')}"`;
      
      const records = await pb.collection('listings').getList(1, 50, {
        filter: filterStr,
        sort: sort,
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
        <title>{`${displayBrand} - ${isRTL ? 'كراج 64' : 'Garage64'}`}</title>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-20">
          
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-10 bilingual-body">
            <Link to="/" className="hover:text-primary premium-transition flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span>{isRTL ? 'الرئيسية' : 'Home'}</span>
            </Link>
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Link to="/diecast" className="hover:text-primary premium-transition">
              {isRTL ? 'سيارات مصغرة' : 'Diecast Cars'}
            </Link>
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-foreground">{displayBrand}</span>
          </nav>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl bilingual-heading text-white">
                {displayBrand}
              </h1>
            </motion.div>
            
            <div className="w-full md:w-64">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-12 bg-card text-white border-white/10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created">{isRTL ? 'الأحدث' : 'Newest'}</SelectItem>
                  <SelectItem value="price">{isRTL ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</SelectItem>
                  <SelectItem value="-price">{isRTL ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-[14px]" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-card/50"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <SearchX className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-2xl text-white bilingual-heading mb-4">
                {isRTL ? 'لا توجد قوائم لهذه العلامة التجارية' : 'No listings for this brand'}
              </p>
              <p className="text-muted-foreground bilingual-body">
                {isRTL ? 'كن أول من ينشر إعلاناً في هذا القسم!' : 'Be the first to post a listing in this category!'}
              </p>
              <Link to="/create-listing" className="mt-8">
                <button className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-[1.02] premium-transition">
                  {isRTL ? 'أضف إعلانك' : 'Create Listing'}
                </button>
              </Link>
            </motion.div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default DiecastBrandListingsPage;