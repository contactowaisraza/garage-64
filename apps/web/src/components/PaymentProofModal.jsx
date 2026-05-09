
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Loader2, Upload, X } from 'lucide-react';

const PaymentProofModal = ({ isOpen, onClose, deposit, conversationId, currentUserId, otherUserId }) => {
  const { isRTL } = useLanguage();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleClose = () => {
    if (loading) return;
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !deposit) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('payment_proof', file);
      formData.append('status', 'proof_submitted');
      await pb.collection('deposits').update(deposit.id, formData, { $autoCancel: false });

      await pb.collection('messages').create({
        conversation_id: conversationId,
        sender_id: currentUserId,
        recipient_id: otherUserId,
        content: `PAYMENT_PROOF|${deposit.id}`,
      }, { $autoCancel: false });

      pb.collection('conversations').update(conversationId, {
        last_message: `PAYMENT_PROOF|${deposit.id}`,
        last_message_sender_id: currentUserId,
      }, { $autoCancel: false }).catch(() => {});

      toast.success(isRTL ? 'تم رفع إثبات الدفع بنجاح' : 'Payment proof uploaded successfully');
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      onClose();
    } catch (err) {
      console.error('Payment proof error:', err);
      toast.error(err.message || (isRTL ? 'حدث خطأ أثناء الرفع' : 'An error occurred while uploading'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-5 h-5 text-primary" />
            {isRTL ? 'رفع إثبات الدفع' : 'Upload Payment Proof'}
          </DialogTitle>
          <DialogDescription>
            {isRTL
              ? 'ارفع صورة إيصال الدفع ليراجعها البائع'
              : 'Upload an image of your payment receipt for the seller to review'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {preview ? (
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <img
                src={preview}
                alt={isRTL ? 'معاينة' : 'Preview'}
                className="w-full max-h-48 object-contain bg-black/40"
              />
              <button
                type="button"
                onClick={() => { setFile(null); URL.revokeObjectURL(preview); setPreview(null); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Label
              htmlFor="proof-file"
              className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/15 rounded-lg cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {isRTL ? 'انقر لاختيار صورة' : 'Click to select an image'}
              </span>
              <input
                id="proof-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </Label>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading || !file} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />}
              {isRTL ? 'رفع الإثبات' : 'Upload Proof'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentProofModal;
