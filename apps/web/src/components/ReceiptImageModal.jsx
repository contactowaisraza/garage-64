
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function ReceiptImageModal({ isOpen, onClose, imageUrl }) {
  const { isRTL } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl bg-[#0a0a0a] border-border p-0 overflow-hidden shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isRTL ? 'صورة الإيصال' : 'Receipt Image'}</DialogTitle>
          <DialogDescription>
            {isRTL ? 'عرض صورة إيصال الدفع بالحجم الكامل' : 'Full size view of the payment receipt'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-[80vh] flex items-center justify-center bg-black/90 group p-4">
          <button 
            onClick={onClose}
            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all z-10 backdrop-blur-sm ring-1 ring-white/10`}
            aria-label={isRTL ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
          
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={isRTL ? 'إيصال الدفع' : 'Payment Receipt'} 
              className="max-w-full max-h-full object-contain rounded-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback displayed if image fails to load or no URL provided */}
          <div className={`${imageUrl ? 'hidden' : 'flex'} flex-col items-center justify-center text-muted-foreground`}>
            <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>{isRTL ? 'تعذر تحميل الصورة' : 'Failed to load image'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
