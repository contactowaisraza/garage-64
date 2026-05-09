
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Loader2, Coins } from 'lucide-react';

const DepositRequestModal = ({ isOpen, onClose, conversationId, currentUserId, otherUserId }) => {
  const { isRTL } = useLanguage();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error(isRTL ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Seller (currentUser) requests a deposit from the buyer (otherUser)
      const deposit = await pb.collection('deposits').create({
        conversation_id: conversationId,
        seller_id: currentUserId,
        buyer_id: otherUserId,
        amount: Number(amount),
        status: 'pending',
        notes: notes.trim()
      }, { $autoCancel: false });

      // Encode deposit ID so the message card can look up the record
      const depositContent = `DEPOSIT_REQ|${deposit.id}|${amount}`;
      await pb.collection('messages').create({
        conversation_id: conversationId,
        sender_id: currentUserId,
        recipient_id: otherUserId,
        content: depositContent,
      }, { $autoCancel: false });

      // Update conversation last_message
      pb.collection('conversations').update(conversationId, {
        last_message: depositContent,
        last_message_sender_id: currentUserId,
      }, { $autoCancel: false }).catch(() => {});

      toast.success(isRTL ? 'تم إرسال طلب العربون بنجاح' : 'Deposit request sent successfully');
      setAmount('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Deposit request error:', err);
      toast.error(err.message || (isRTL ? 'حدث خطأ أثناء إرسال الطلب' : 'An error occurred while sending the request'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="w-5 h-5 text-primary" />
            {isRTL ? 'طلب إيداع' : 'Request Deposit'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? 'أدخل مبلغ الإيداع المطلوب وملاحظات إضافية.' 
              : 'Enter the requested deposit amount and optional notes.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount" className="text-foreground">
              {isRTL ? 'المبلغ (QI)' : 'Amount (QI)'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deposit-amount"
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isRTL ? 'مثال: 50' : 'e.g. 50'}
              disabled={loading}
              required
              className="text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit-notes" className="text-foreground">
              {isRTL ? 'ملاحظات' : 'Notes'} <span className="text-muted-foreground font-normal text-xs">({isRTL ? 'اختياري' : 'Optional'})</span>
            </Label>
            <Textarea
              id="deposit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRTL ? 'اكتب ملاحظاتك هنا...' : 'Write your notes here...'}
              disabled={loading}
              rows={3}
              className="resize-none text-foreground"
            />
          </div>

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading || !amount} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />}
              {isRTL ? 'إرسال الطلب' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepositRequestModal;
