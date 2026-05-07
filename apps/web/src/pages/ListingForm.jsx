import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/utils/categories';
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
import { BadgeInfo as InfoIcon, Upload } from 'lucide-react';

const TIER_LIMITS = {
  observer: 3,
  hobbyist: 3,
  collector: 7,
  dealer: 21
};

const ListingForm = () => {
  const { t, td } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [adCount, setAdCount] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(!isEditMode);
  const [existingImages, setExistingImages] = useState([]);

  const userTier = currentUser?.subscription_tier?.toLowerCase();
  const adLimit = TIER_LIMITS[userTier] || 3;
  const isObserver = userTier === 'observer';
  const isLimitReached = !isEditMode && adCount >= adLimit;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    listingType: 'showcase',
    price: '',
    condition: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const MAX_IMAGES = 7;


  useEffect(() => {
    if (isEditMode) {
      const loadListing = async () => {
        try {
          const record = await pb.collection('listings').getOne(id, { $autoCancel: false });
          setFormData({
            title: record.title || '',
            description: record.description || '',
            category: record.category || '',
            listingType: record.listingType || 'showcase',
            price: record.price || '',
            condition: record.condition || ''
          });
          setExistingImages(record.images || []);
        } catch (error) {
          console.error('Error loading listing:', error);
          toast.error(t('common.error') || 'Failed to load listing');
          navigate('/my-listings');
        } finally {
          setInitialLoading(false);
        }
      };
      loadListing();
      return;
    }

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
  }, [currentUser, id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, MAX_IMAGES);
    setImages(selected);
    const urls = selected.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => { prev.forEach(u => URL.revokeObjectURL(u)); return urls; });
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditMode && isLimitReached) {
      toast.error(`Ad limit reached for your tier (${adLimit} ads max).`);
      return;
    }

    if (formData.title.trim().length < 10) {
      toast.error(t('listings.titleMinError') || 'Title must be at least 10 characters.');
      return;
    }
    if (formData.title.trim().length > 60) {
      toast.error(t('listings.titleMaxError') || 'Title must be at most 60 characters.');
      return;
    }
    if (!formData.description.trim()) {
      toast.error(t('listings.descriptionRequired') || 'Description is required.');
      return;
    }
    if (formData.description.trim().length < 30) {
      toast.error(t('listings.descriptionMinError') || 'Description must be at least 30 characters.');
      return;
    }
    if (formData.description.trim().length > 300) {
      toast.error(t('listings.descriptionMaxError') || 'Description must be at most 300 characters.');
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
      data.append('status', 'Pending');
      data.append('isDealerAd', userTier === 'dealer');

      if (images.length > 0) {
        images.forEach(file => data.append('images', file));
      }

      if (isEditMode) {
        data.append('rejection_reason', '');
        await pb.collection('listings').update(id, data, { $autoCancel: false });
        toast.success(t('listings.resubmitSuccess') || 'Listing resubmitted for review');
      } else {
        data.append('user_id', currentUser.id);
        await pb.collection('listings').create(data, { $autoCancel: false });
        toast.success(t('listings.successCreated') || 'Listing created successfully');
      }

      navigate('/my-listings');
    } catch (error) {
      console.error(error);
      toast.error(t('common.error') || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${isEditMode ? (t('listings.editListing') || 'Edit Listing') : (t('listings.createListing') || 'Create Listing')} - ${t('brand.name') || 'App'}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-32 max-w-3xl">
          <Card className="shadow-lg border-border">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl font-bold tracking-tight">
                {isEditMode ? (t('listings.editListing') || 'Edit & Resubmit Listing') : (t('listings.createListing') || 'Create New Listing')}
              </CardTitle>
              {!isEditMode && !checkingLimit && (
                <CardDescription className="flex items-center gap-2 text-base">
                  <span className="font-medium text-foreground capitalize">{userTier} {t('tiers.tierLabel') || 'Tier'}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className={`${isLimitReached ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                    {adCount} / {adLimit}
                  </span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLimitReached && (
                <Alert variant="destructive" className="mb-6">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    {t('listings.adLimitReached')?.replace('{limit}', adLimit) || `Ad limit reached (${adLimit} ads). Please upgrade your tier to post more listings.`}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="text-sm font-semibold">
                      {t('listings.title')} <span className="text-destructive">*</span>
                    </Label>
                    <span className={`text-xs tabular-nums ${formData.title.length > 60 ? 'text-destructive' : formData.title.length < 10 ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                      {formData.title.length}/60
                    </span>
                  </div>
                  <Input
                    id="title"
                    name="title"
                    required
                    maxLength={60}
                    placeholder={t('listings.titlePlaceholder')}
                    value={formData.title}
                    onChange={handleChange}
                    disabled={isLimitReached}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">{t('listings.titleHelper')}</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-sm font-semibold">
                      {t('listings.description')} <span className="text-destructive">*</span>
                    </Label>
                    <span className={`text-xs tabular-nums ${formData.description.length > 300 ? 'text-destructive' : formData.description.length < 30 ? 'text-muted-foreground/50' : 'text-emerald-500'}`}>
                      {formData.description.length}/300
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    maxLength={300}
                    placeholder={t('listings.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={handleChange}
                    disabled={isLimitReached}
                    className="bg-background resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{t('listings.descriptionHelper')} &nbsp;·&nbsp; min 30, max 300</p>
                </div>

                {/* Category & Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t('listings.category')} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      required
                      value={formData.category}
                      onValueChange={(v) => setFormData({...formData, category: v})}
                      disabled={isLimitReached}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={t('listings.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTING_CATEGORIES.map(c => <SelectItem key={c} value={c}>{td(c)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t('listings.categoryHelper')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t('listings.condition')} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      required
                      value={formData.condition}
                      onValueChange={(v) => setFormData({...formData, condition: v})}
                      disabled={isLimitReached}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={t('listings.conditionPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTING_CONDITIONS.map(c => <SelectItem key={c} value={c}>{td(c)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t('listings.conditionHelper')}</p>
                  </div>
                </div>

                {/* Listing Type */}
                <div className="space-y-3 bg-muted/50 p-5 rounded-xl border border-border/50">
                  <div>
                    <Label className="text-sm font-semibold">
                      {t('listings.type')} <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('listings.listingTypeQuestion')}</p>
                  </div>
                  <RadioGroup
                    value={isObserver ? 'showcase' : formData.listingType}
                    onValueChange={(v) => setFormData({...formData, listingType: v})}
                    disabled={isObserver || isLimitReached}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <label htmlFor="type-showcase" className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${(isObserver ? 'showcase' : formData.listingType) === 'showcase' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/40'}`}>
                      <RadioGroupItem value="showcase" id="type-showcase" className="mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{t('listings.showcaseOnly')}</p>
                        <p className="text-xs text-muted-foreground">{t('listings.showcaseDescription')}</p>
                      </div>
                    </label>
                    <label htmlFor="type-sell" className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${isObserver || isLimitReached ? 'cursor-not-allowed opacity-50 border-border bg-background' : `cursor-pointer ${formData.listingType === 'sell' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/40'}`}`}>
                      <RadioGroupItem value="sell" id="type-sell" disabled={isObserver || isLimitReached} className="mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{t('listings.forSale')}</p>
                        <p className="text-xs text-muted-foreground">{t('listings.forSaleDescription')}</p>
                      </div>
                    </label>
                  </RadioGroup>

                  {isObserver && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <InfoIcon className="w-3.5 h-3.5" />
                      {t('listings.observerUpgradeHint')}
                    </p>
                  )}
                </div>

                {/* Price */}
                {formData.listingType === 'sell' && !isObserver && (
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-semibold">
                      {t('listings.price')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">SAR</span>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder={t('listings.pricePlaceholder')}
                        value={formData.price}
                        onChange={handleChange}
                        disabled={isLimitReached}
                        className="bg-background pl-12"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t('listings.priceHelper')}</p>
                  </div>
                )}

                {/* Images */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{t('listings.images')}</Label>
                    <span className="text-xs text-muted-foreground/60">{images.length}/{MAX_IMAGES}</span>
                  </div>

                  {isEditMode && existingImages.length > 0 && images.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {existingImages.length} {existingImages.length === 1 ? 'photo' : 'photos'} currently attached — upload new photos to replace them
                    </p>
                  )}

                  {/* Upload zone */}
                  {images.length < MAX_IMAGES && (
                    <label
                      htmlFor="images"
                      className={`flex flex-col items-center justify-center gap-2 w-full py-7 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${isLimitReached ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{t('listings.uploadPhotos')}</span>
                      <span className="text-xs text-muted-foreground">{t('listings.uploadFormats')} &nbsp;·&nbsp; max {MAX_IMAGES} photos</span>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isLimitReached}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                      {imagePreviews.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/8 bg-[#111]">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
                          >
                            ✕
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-primary text-black px-1.5 py-0.5 rounded">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">{t('listings.imagesHelper')}</p>
                </div>

                <div className="pt-6 flex justify-end gap-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={loading || isLimitReached || checkingLimit}>
                    {loading
                      ? t('listings.submitting')
                      : isEditMode
                        ? (t('listings.resubmit') || 'Resubmit')
                        : t('listings.submit')}
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