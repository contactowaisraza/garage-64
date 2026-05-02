
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import BazaarPriceTag from '@/components/BazaarPriceTag.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const BazarPage = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('bazaar_listings').getList(1, 50, {
        filter: 'status="Approved"',
        expand: 'user_id',
        sort: '-created',
        $autoCancel: false
      });
      setItems(records.items);
    } catch (err) {
      console.error('Error fetching bazar items:', err);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  const userTier = currentUser?.tier || currentUser?.subscription_tier;

  return (
    <>
      <Helmet>
        <title>Bazar - The Market</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 pt-24 md:pt-32 pb-24 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl font-bold text-white mb-6 text-center uppercase tracking-wide">
              Bazar / البازار
            </h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#808080] w-5 h-5" />
              <Input
                type="text"
                placeholder="Search Bazar items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 py-6 bg-[#1a1a1a] border-[#404040] text-white placeholder:text-[#808080] focus-visible:ring-1 focus-visible:ring-[#ff8c00] focus-visible:border-[#ff8c00] rounded-xl text-lg transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
                  <Skeleton className="w-full aspect-square bg-[#2a2a2a]" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4 bg-[#2a2a2a]" />
                    <Skeleton className="h-4 w-full bg-[#2a2a2a]" />
                    <Skeleton className="h-4 w-1/2 bg-[#2a2a2a]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
              <AlertCircle className="w-12 h-12 text-[#dc143c] mb-4" />
              <p className="text-[#c0c0c0] mb-6">{error}</p>
              <Button onClick={fetchItems} className="bg-[#ff8c00] hover:bg-[#e67e00] text-[#1a1a1a] font-bold">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
              <p className="text-[#c0c0c0] text-lg">No items found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-[#ff8c00]/50 transition-colors group relative flex flex-col">
                  
                  {/* Physical Price Tag */}
                  <BazaarPriceTag price={item.price} tier={userTier} />
                  
                  {/* Image */}
                  <div className="aspect-square bg-[#0f0f0f] relative overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={pb.files.getUrl(item, item.images[0], { thumb: '400x400' })}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#404040]">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-[#a0a0a0] text-sm mb-4 line-clamp-2 flex-1" title={item.description}>
                      {item.description || 'No description provided.'}
                    </p>
                    
                    <div className="pt-4 border-t border-[#2a2a2a] mt-auto">
                      <p className="text-xs text-[#808080]">
                        Seller: <span className="text-[#c0c0c0] font-medium">{item.expand?.user_id?.name || 'Unknown'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BazarPage;
