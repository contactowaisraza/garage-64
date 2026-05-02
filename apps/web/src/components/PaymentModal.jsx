
import React, { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Copy, UploadCloud, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

const PaymentModal = ({ selectedTier, showModal, onClose, currentUser, isSignUp = false, userData = null, onSuccess, onCancel }) => {
  const { language, isRTL } = useLanguage();
  const { login } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentLang = language === 'ar' ? 'ar' : 'en';
  const t = currentLang === 'ar' ? arTranslations : enTranslations;

  const qiCardNumber = '1234-5678-9012-3456';

  const getTierPrice = (tier) => {
    if (!tier) return '0';
    const tierData = t.signup?.tiers?.[tier] || t[tier];
    return tierData?.price || '0';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qiCardNumber);
    toast.success(isRTL ? 'تم النسخ' : 'Copied');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError(isRTL ? 'يجب أن يكون الملف صورة' : 'File must be an image');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(isRTL ? 'حجم الملف يجب أن يكون أقل من 5MB' : 'File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const handleConfirm = async () => {
    if (!file) {
      setError(isRTL ? 'وصل الدفع مطلوب' : 'Payment receipt is required');
      return;
    }

    if (isSignUp && (!userData || !userData.email || !userData.password || !userData.name || !userData.tier)) {
      setError(isRTL ? 'البيانات غير مكتملة' : 'Incomplete user data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // 1. Sign up with payment and receipt
        const formData = new FormData();
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        formData.append('name', userData.name);
        formData.append('phone', userData.phone);
        formData.append('tier', userData.tier);
        formData.append('receipt', file);

        const signupRes = await apiServerClient.fetch('http://localhost:3001/auth/signup-with-payment', {
          method: 'POST',
          body: formData,
        });

        const signupData = await signupRes.json();
        if (!signupRes.ok || !signupData.success) {
          throw new Error(signupData.error || (isRTL ? 'فشل إنشاء الحساب. حاول مرة أخرى.' : 'Failed to create account. Try again.'));
        }

        // Success - login and proceed
        await login(userData.email, userData.password);
        toast.success(isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
        if (onSuccess) onSuccess();
        onClose();

      } else {
        // Upgrade flow
        const formData = new FormData();
        formData.append('user_id', currentUser.id);
        formData.append('tier', selectedTier);
        formData.append('receipt', file);

        const requestRes = await apiServerClient.fetch('http://localhost:3001/users/create-upgrade-request', {
          method: 'POST',
          body: formData,
        });

        const requestData = await requestRes.json();
        if (!requestRes.ok || !requestData.success) {
          throw new Error(requestData.error || (isRTL ? 'فشل حفظ الطلب. حاول مرة أخرى.' : 'Failed to save request. Try again.'));
        }

        await pb.collection('users').update(currentUser.id, {
          subscription_status: 'pending',
          pending_tier_request: selectedTier,
          pending_request_date: new Date().toISOString()
        }, { $autoCancel: false });

        toast.success(isRTL ? 'تم إرسال الطلب بنجاح' : 'Request submitted successfully');
        if (onSuccess) onSuccess();
        onClose();
      }

    } catch (err) {
      console.error('Payment flow error:', err);
      setError(err.message || (isRTL ? 'خطأ في الاتصال. تحقق من الاتصال.' : 'Network error. Check connection.'));
    } finally {
      setLoading(false);
    }
  };

  const titleText = isSignUp
    ? (isRTL ? 'إكمال التسجيل' : 'Complete Registration')
    : (isRTL ? 'تأكيد الترقية' : 'Confirm Upgrade');

  const displayTier = isSignUp ? userData?.tier : selectedTier;

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && !loading && handleModalClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {titleText}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            {isRTL ? 'اختر طريقة الدفع' : 'Choose Payment Method'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[calc(100vh-15rem)] overflow-y-auto">
          {/* Qi Card Section */}
          <div className="bg-secondary/30 rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#ff8c00]/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#ff8c00]" />
              </div>
              <h3 className="font-bold text-lg">{isRTL ? 'بطاقة كيو' : 'Qi Card'}</h3>
            </div>

            <div className="bg-background rounded-lg p-4 flex items-center justify-between border border-border">
              <span className="text-xl font-bold tracking-wider font-mono text-foreground">
                {qiCardNumber}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-[#ff8c00] border-[#ff8c00]/30 hover:bg-[#ff8c00]/10"
              >
                <Copy className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {isRTL ? 'نسخ' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Instructions & Amount */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground">{isRTL ? 'تعليمات الدفع' : 'Payment Instructions'}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRTL
                ? 'قم بتحويل مبلغ الاشتراك إلى رمز بطاقة كيو أعلاه. احتفظ بإيصالك للتحقق.'
                : 'Transfer the subscription amount to the Qi Card code above. Keep your receipt for verification.'}
            </p>
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg mt-2">
              <span className="font-medium">{isRTL ? 'المبلغ' : 'Amount'}</span>
              <span className="font-bold text-lg text-foreground">{getTierPrice(displayTier)}</span>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-3">
            <label className="font-bold text-foreground flex items-center gap-1">
              {isRTL ? 'ارفع وصل الدفع' : 'Upload Payment Receipt'}
              <span className="text-destructive">*</span>
            </label>

            {!file ? (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-[#cccccc]/10 hover:bg-[#cccccc]/20 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {isRTL ? 'انقر للتحميل أو اسحب وأفلت' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, GIF (Max 5MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-secondary/20 relative">
                <div className="w-[100px] h-[100px] rounded-lg overflow-hidden bg-black/5 shrink-0 border border-border/50">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="flex items-center gap-1 mt-2 text-[#4CAF50] text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    {isRTL ? 'جاهز للرفع' : 'Ready to upload'}
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  disabled={loading}
                  className="absolute top-2 right-2 rtl:left-2 rtl:right-auto p-1.5 bg-background/80 backdrop-blur rounded-full text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive font-medium mt-2">{error}</p>
            )}
          </div>
        </div>

        <div className="p-6 pt-0 mt-2">
          <Button
            onClick={handleConfirm}
            disabled={!file || loading}
            className={`w-full h-12 text-base font-bold transition-all ${!file ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg cursor-pointer'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                {isRTL ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              isRTL ? 'تأكيد الطلب' : 'Confirm Request'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
