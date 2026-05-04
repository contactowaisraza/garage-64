import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, Eye, ShieldAlert, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const TIER_LIMITS = {
  observer: 3,
  hobbyist: 3,
  collector: 7,
  dealer: 21
};

const MyListingsPage = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAds, setTotalAds] = useState(0);

  const userTier = currentUser?.subscription_tier?.toLowerCase() || 'observer';
  const adLimit = TIER_LIMITS[userTier] || 3;
  const isLimitReached = totalAds >= adLimit;

  useEffect(() => {
    if (currentUser) {
      fetchMyListings();
    }
  }, [currentUser]);

  const fetchMyListings = async () => {
    try {
      const records = await pb.collection('listings').getList(1, 50, {
        filter: `user_id="${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setListings(records.items);
      setTotalAds(records.totalItems);
    } catch (error) {
      console.error('Error fetching my listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.delete') + '?')) {
      try {
        await pb.collection('listings').delete(id, { $autoCancel: false });
        toast.success(t('common.success') || 'Deleted successfully');
        fetchMyListings();
      } catch (error) {
        toast.error(t('common.error') || 'Failed to delete');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved': return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">{t('listings.approved') || 'Approved'}</Badge>;
      case 'Rejected': return <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">{t('listings.rejected') || 'Rejected'}</Badge>;
      default: return <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{t('listings.pending') || 'Pending'}</Badge>;
    }
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'dealer': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'collector': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'hobbyist': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('listings.myListingsTitle') || 'My Listings'} - ${t('brand.name') || 'App'}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-32 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {t('listings.myListingsTitle') || 'My Listings'}
                </h1>
                <Badge variant="outline" className={`capitalize px-3 py-1 text-sm font-medium ${getTierColor(userTier)}`}>
                  {userTier} Tier
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                You have <strong className={isLimitReached ? 'text-destructive' : 'text-foreground'}>{totalAds}</strong> of <strong>{adLimit}</strong> ads
                {isLimitReached && <ShieldAlert className="w-4 h-4 text-destructive" />}
              </p>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button 
                      asChild={!isLimitReached}
                      disabled={isLimitReached}
                      className="px-6 py-5 text-base shadow-sm"
                    >
                      {isLimitReached ? (
                        <span className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                          <Plus className="w-5 h-5" />
                          {t('listings.createListing') || 'Create New Listing'}
                        </span>
                      ) : (
                        <Link to="/create-listing" className="flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          {t('listings.createListing') || 'Create New Listing'}
                        </Link>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {isLimitReached && (
                  <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground font-medium">
                    <p>Ad limit reached for your tier</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="text-sm font-semibold py-4">Listing</TableHead>
                  <TableHead className="text-sm font-semibold py-4">Category</TableHead>
                  <TableHead className="text-sm font-semibold py-4">Type</TableHead>
                  <TableHead className="text-sm font-semibold py-4">Status</TableHead>
                  <TableHead className="text-right text-sm font-semibold py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {t('common.loading') || 'Loading...'}
                    </TableCell>
                  </TableRow>
                ) : listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Plus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground">{t('listings.noListings') || 'No listings found'}</p>
                        <p className="text-sm text-muted-foreground">Create your first listing to get started.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  listings.map(listing => (
                    <TableRow key={listing.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">{listing.title}</span>
                          <span className="text-xs text-muted-foreground capitalize">{userTier} Ad</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">{listing.category}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="capitalize bg-background">
                          {listing.listingType || listing.listing_type || 'Showcase'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(listing.status)}
                          {listing.status === 'Rejected' && listing.rejection_reason && (
                            <span className="text-xs text-destructive max-w-[220px]" title={listing.rejection_reason}>
                              {listing.rejection_reason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {listing.status === 'Rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="h-8 gap-1.5 text-xs border-primary/30 text-primary"
                            >
                              <Link to={`/edit-listing/${listing.id}`}>
                                <RefreshCw className="w-3.5 h-3.5" />
                                {t('listings.resubmit') || 'Resubmit'}
                              </Link>
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" asChild className="hover:bg-primary/10 hover:text-primary">
                            <Link to={`/listing/${listing.id}`}>
                              <Eye className="w-4 h-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(listing.id)} className="hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MyListingsPage;