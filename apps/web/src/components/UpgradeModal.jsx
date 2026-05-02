
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UploadCloud, CreditCard, Loader2, X, Copy, CheckCircle } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, targetTier, onSuccess }) => {
  const { isRTL } = useLanguage();
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  
  // Task 2: (1) Create state for uploadedReceipt and selectedTier
  const [uploadedReceipt, setUploadedReceipt] = useState(null);
  const selectedTier = targetTier;
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const QI_CARD_NUMBER = "4000 1234 5678 9010";
  const AMOUNT_MAP = {
    hobbyist: '25,000 IQD / Month',
    collector: '50,000 IQD / Month',
    dealer: '100,000 IQD / Month'
  };

  useEffect(() => {
    if (!isOpen) {
      setUploadedReceipt(null);
      setPreviewUrl(null);
      setSuccessState(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(QI_CARD_NUMBER.replace(/\s/g, ''));
    setCopied(true);
    toast.success(isRTL ? 'تم نسخ رقم البطاقة' : 'Card number copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    
    // Task 2: (5) Validate file type and size, show exact error messages
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Only image files are allowed');
      return;
    }
    
    if (selectedFile.size > 5242880) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setUploadedReceipt(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedReceipt(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpgrade = async (e) => {
    e.preventDefault();
    
    if (!selectedTier || !['observer', 'hobbyist', 'collector', 'dealer'].includes(selectedTier.toLowerCase())) {
      toast.error(isRTL ? 'اختيار مستوى غير صالح.' : 'Invalid tier selection.');
      return;
    }

    setLoading(true);

    try {
      // Task 2: (6) Upload receipt to backend via apiServerClient
      if (uploadedReceipt) {
        const uploadFormData = new FormData();
        uploadFormData.append('receipt', uploadedReceipt);
        
        const uploadResponse = await apiServerClient.fetch('/users/upload-receipt', {
          method: 'POST',
          body: uploadFormData
        });

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload receipt image to server');
        }
        
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Upload was not successful');
        }
        // Backend returns receipt_image_url, but PocketBase file fields require Blob/File objects.
        // We pass the file itself to pb.collection.update to ensure data integrity in the DB.
      }

      // Task 2: (8) Save information to user record
      const userFormData = new FormData();
      if (uploadedReceipt) {
        // Appending the actual File object because PocketBase 'file' field requires it
        userFormData.append('receipt_image', uploadedReceipt);
        userFormData.append('receipt_file_name', uploadedReceipt.name);
        userFormData.append('receipt_upload_date', new Date().toISOString());
      }
      
      userFormData.append('pending_tier_request', selectedTier.toLowerCase());
      userFormData.append('subscription_status', 'pending');
      userFormData.append('pending_request_date', new Date().toISOString());

      const updatedUser = await pb.collection('users').update(currentUser.id, userFormData, { $autoCancel: false });

      // Task 2: (12) Verify receipt_image field is populated
      if (selectedTier.toLowerCase() !== 'observer' && !updatedUser.receipt_image) {
        throw new Error('Receipt image was not saved to database. Please try again.');
      }

      setSuccessState(true);
      toast.success(isRTL ? 'تم إرسال طلب الترقية بنجاح' : 'Upgrade request submitted successfully');
      
      if (setCurrentUser) {
        setCurrentUser(updatedUser);
      }

      onSuccess?.();
      
      // Task 2: (10) On success redirect to /pending-approval
      setTimeout(() => {
        onClose();
        navigate('/pending-approval');
      }, 1500);

    } catch (error) {
      console.error('Upgrade request error:', error);
      // Task 2: (11) On error show error message and keep modal open
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        toast.error(isRTL ? 'خطأ في الشبكة. يرجى التحقق من اتصالك.' : 'Network error. Please check your connection.');
      } else {
        toast.error(isRTL ? `فشل في حفظ الطلب: ${error.message}` : `Failed to save request: ${error.message}`);
      }
    } finally {
      if (!successState) {
        setLoading(false);
      }
    }
  };

  // Task 2: (4) Implement button disable logic
  const isFormValid = selectedTier?.toLowerCase() === 'observer' || (uploadedReceipt && selectedTier);
  
  let btnClass = "w-full sm:w-auto h-12 px-8 font-bold rounded-md transition-all duration-300 flex items-center justify-center text-base ";
  if (successState) {
    btnClass += "bg-green-600 text-white cursor-default";
  } else if (!isFormValid) {
    btnClass += "bg-[#cccccc] text-gray-500 cursor-not-allowed pointer-events-none";
  } else {
    btnClass += "bg-[#ff8c00] text-white hover:bg-[#e67e00] hover:shadow-lg cursor-pointer active:scale-95";
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && !successState && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl flex items-center gap-2 font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <CreditCard className="w-6 h-6 text-[#ff8c00]" />
              {isRTL ? 'ترقية المستوى' : 'Upgrade Tier'} - <span className="uppercase text-[#ff8c00]">{selectedTier}</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm pt-2">
              {isRTL 
                ? 'يرجى تحويل المبلغ المطلوب إلى بطاقة Qi Card الموضحة أدناه، ثم إرفاق صورة إيصال التحويل لتأكيد طلبك.' 
                : 'Please transfer the required amount to the Qi Card below, then upload a screenshot of the transfer receipt to confirm your request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedTier?.toLowerCase() !== 'observer' && (
            <div className="mb-6 bg-secondary/30 rounded-xl border border-border p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff8c00]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex flex-col gap-1 mb-4 relative z-10">
                <span className="text-[#999999] text-xs uppercase tracking-wider font-semibold">
                  {isRTL ? 'تعليمات الدفع (Qi Card)' : 'Payment Instructions (Qi Card)'}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {isRTL ? 'المبلغ المطلوب:' : 'Amount Required:'} <span className="text-[#ff8c00] font-bold">{AMOUNT_MAP[selectedTier?.toLowerCase()] || '0 IQD'}</span>
                </span>
              </div>
              
              <div className="bg-[#ff8c00] p-4 rounded-lg flex items-center justify-between shadow-inner relative z-10">
                <div className="flex flex-col">
                  <span className="text-white/80 text-[10px] uppercase font-bold tracking-widest mb-1">
                    {isRTL ? 'رقم البطاقة' : 'Card Number'}
                  </span>
                  <span className="text-white text-xl sm:text-2xl font-bold tracking-widest font-mono">
                    {QI_CARD_NUMBER}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={handleCopy}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  aria-label="Copy card number"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleConfirmUpgrade} className="space-y-6">
            {selectedTier?.toLowerCase() !== 'observer' && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">
                  {isRTL ? 'صورة إيصال التحويل *' : 'Transfer Receipt Image *'}
                </label>
                
                {/* Task 2: (2) Add file input for receipt image with validations */}
                {!previewUrl ? (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer bg-[#cccccc]/10
                      ${isDragging ? 'border-[#ff8c00] bg-[#ff8c00]/5' : 'border-[#cccccc] hover:border-[#ff8c00]/50 hover:bg-[#cccccc]/20'}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-[#ff8c00]' : 'text-[#999999]'}`} />
                    <p className="text-sm text-foreground font-medium mb-1">
                      {isRTL ? 'اضغط لاختيار ملف أو اسحب وأفلت هنا' : 'Click to select or drag and drop here'}
                    </p>
                    <p className="text-xs text-[#999999]">
                      {isRTL ? 'صيغ الصور فقط (JPG, PNG)، الحد الأقصى 5 ميجابايت' : 'Images only (JPG, PNG, WEBP), max 5MB'}
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/jpeg,image/png,image/gif,image/webp" 
                      onChange={handleFileChange} 
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-secondary/20">
                    <div className="w-[100px] h-[100px] rounded-lg overflow-hidden border border-border/50 shrink-0 bg-background">
                      <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{uploadedReceipt.name}</p>
                      <p className="text-xs text-[#999999]">{(uploadedReceipt.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeFile}
                      className="w-8 h-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading || successState} className="w-full sm:w-auto h-12 px-6">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <button 
                type="submit" 
                disabled={!isFormValid || loading || successState}
                className={btnClass}
              >
                {/* Task 2: (9) Show loading state on button during upload */}
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 ml-2 animate-spin" />
                    {isRTL ? 'جاري الحفظ...' : 'جاري الحفظ...'}
                  </>
                ) : successState ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2 ml-2" />
                    {isRTL ? 'تم الحفظ' : 'Saved'}
                  </>
                ) : (
                  isRTL ? 'تأكيد الطلب' : 'Confirm Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
