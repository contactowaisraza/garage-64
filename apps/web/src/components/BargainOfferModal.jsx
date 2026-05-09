
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Loader2, TrendingDown } from 'lucide-react';

const BargainOfferModal = ({ isOpen, onClose, deposit, conversationId, currentUserId, otherUserId }) => {
  const { isRTL } = useLanguage();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const originalAmount = deposit?.amount || 0;

  const handleClose = () => {
    if (loading) return;
    setAmount('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error(isRTL ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }
    if (num >= originalAmount) {
      toast.error(
        isRTL
          ? `يجب أن يكون عرضك أقل من ${originalAmount} QI`
          : `Your offer must be less than ${originalAmount} QI`
      );
      return;
    }
    setLoading(true);
    try {
      await pb.collection('deposits').update(deposit.id, {
        bargain_amount: num,
        status: 'bargaining',
      }, { $autoCancel: false });

      await pb.collection('messages').create({
        conversation_id: conversationId,
        sender_id: currentUserId,
        recipient_id: otherUserId,
        content: `BARGAIN_OFFER|${deposit.id}|${num}`,
      }, { $autoCancel: false });

      pb.collection('conversations').update(conversationId, {
        last_message: `BARGAIN_OFFER|${deposit.id}|${num}`,
        last_message_sender_id: currentUserId,
      }, { $autoCancel: false }).catch(() => {});

      toast.success(isRTL ? 'تم إرسال عرض التفاوض' : 'Bargain offer sent');
      setAmount('');
      onClose();
    } catch (err) {
      console.error('Bargain offer error:', err);
      toast.error(err.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingDown className="w-5 h-5 text-primary" />
            {isRTL ? 'طلب تفاوض على السعر' : 'Request Price Negotiation'}
          </DialogTitle>
          <DialogDescription>
            {isRTL
              ? `المبلغ المطلوب: ${originalAmount} QI — أدخل عرضك المضاد`
              : `Requested: ${originalAmount} QI — Enter your counter-offer`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bargain-amount" className="text-foreground">
              {isRTL ? 'مبلغ عرضك (QI)' : 'Your Offer (QI)'}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bargain-amount"
              type="number"
              min="1"
              max={originalAmount - 1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isRTL ? `مثال: ${Math.floor(originalAmount * 0.8)}` : `e.g. ${Math.floor(originalAmount * 0.8)}`}
              disabled={loading}
              required
              className="text-foreground"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading || !amount} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />}
              {isRTL ? 'إرسال العرض' : 'Send Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BargainOfferModal;
