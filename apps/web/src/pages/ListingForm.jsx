import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BadgeInfo as InfoIcon } from 'lucide-react';

const TIER_LIMITS = {
  observer: 3,
  hobbyist: 10,
  collector: 50,
  dealer: 9999
};

const ListingForm = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adCount, setAdCount] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(true);
  
  const userTier = currentUser?.tier?.toLowerCase() || 'observer';
  const adLimit = TIER_LIMITS[userTier] || 3;
  const isObserver = userTier === 'observer';
  const isLimitReached = adCount >= adLimit;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    listingType: 'showcase',
    price: '',
    condition: ''
  });
  const [images, setImages] = useState([]);

  const categories = ['Hot Wheels', 'Matchbox', 'RC Cars', 'DIY Garages', 'Planes', 'Miniatures'];
  const conditions = ['Mint', 'Near Mint', 'Excellent', 'Good', 'Fair', 'Poor'];

  useEffect(() => {
    const checkAdLimit = async () => {
      if (!currentUser) return;
      try {
        const records = await pb.collection('listings').getList(1, 1, {
          filter: `user_id="${currentUser.id}"`,
          $autoCancel: false
        });
        setAdCount(records.totalItems);
      } catch (error) {
        console.error('Error fetching ad count:', error);
      } finally {
        setCheckingLimit(false);
      }
    };
    checkAdLimit();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLimitReached) {
      toast.error(`Ad limit reached for your tier (${adLimit} ads max).`);
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      
      const finalListingType = isObserver ? 'showcase' : formData.listingType;
      data.append('listingType', finalListingType);
      
      if (finalListingType === 'sell' && !isObserver) {
        data.append('price', formData.price);
      }
      
      data.append('condition', formData.condition);
      data.append('user_id', currentUser.id);
      data.append('status', 'Pending');
      data.append('isDealerAd', userTier === 'dealer');

      images.forEach(file => {
        data.append('images', file);
      });

      await pb.collection('listings').create(data, { $autoCancel: false });
      toast.success(t('listings.successCreated') || 'Listing created successfully');
      navigate('/my-listings');
    } catch (error) {
      console.error(error);
      toast.error(t('common.error') || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('listings.createListing') || 'Create Listing'} - ${t('brand.name') || 'App'}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <Card className="shadow-lg border-border">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl font-bold tracking-tight">
                {t('listings.createListing') || 'Create New Listing'}
              </CardTitle>
              {!checkingLimit && (
                <CardDescription className="flex items-center gap-2 text-base">
                  <span className="font-medium text-foreground capitalize">{userTier} Tier</span>
                  <span className="text-muted-foreground">•</span>
                  <span className={`${isLimitReached ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                    You have {adCount} of {adLimit} ads
                  </span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLimitReached && (
                <Alert variant="destructive" className="mb-6">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    You have reached your tier's ad limit ({adLimit} ads). Please upgrade your tier to post more listings.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('listings.title') || 'Title'}</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    required 
                    value={formData.title} 
                    onChange={handleChange} 
                    disabled={isLimitReached}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('listings.description') || 'Description'}</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    rows={4} 
                    value={formData.description} 
                    onChange={handleChange} 
                    disabled={isLimitReached}
                    className="bg-background resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('listings.category') || 'Category'}</Label>
                    <Select 
                      required 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({...formData, category: v})}
                      disabled={isLimitReached}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={t('common.select') || 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('listings.condition') || 'Condition'}</Label>
                    <Select 
                      required 
                      value={formData.condition} 
                      onValueChange={(v) => setFormData({...formData, condition: v})}
                      disabled={isLimitReached}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={t('common.select') || 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 bg-muted/50 p-4 rounded-xl border border-border/50">
                  <Label className="text-base">{t('listings.type') || 'Listing Type'}</Label>
                  <RadioGroup 
                    value={isObserver ? 'showcase' : formData.listingType} 
                    onValueChange={(v) => setFormData({...formData, listingType: v})}
                    disabled={isObserver || isLimitReached}
                    className="flex flex-col sm:flex-row gap-6"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="showcase" id="type-showcase" />
                      <Label htmlFor="type-showcase" className="cursor-pointer font-medium">Showcase Only</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="sell" id="type-sell" disabled={isObserver || isLimitReached} />
                      <Label htmlFor="type-sell" className={`cursor-pointer font-medium ${isObserver ? 'text-muted-foreground' : ''}`}>
                        For Sale
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {isObserver && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                      <InfoIcon className="w-4 h-4" />
                      Observer tier can only showcase cars. Upgrade to sell.
                    </p>
                  )}
                </div>

                {formData.listingType === 'sell' && !isObserver && (
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('listings.price') || 'Price'}</Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      required 
                      value={formData.price} 
                      onChange={handleChange} 
                      disabled={isLimitReached}
                      className="bg-background"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="images">{t('listings.images') || 'Images'}</Label>
                  <Input 
                    id="images" 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={isLimitReached}
                    className="cursor-pointer bg-background file:text-foreground file:bg-muted file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md hover:file:bg-muted/80" 
                  />
                </div>

                <div className="pt-6 flex justify-end gap-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                  <Button type="submit" disabled={loading || isLimitReached || checkingLimit}>
                    {loading ? (t('common.loading') || 'Loading...') : (t('listings.submit') || 'Create Listing')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ListingForm;