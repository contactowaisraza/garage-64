
import React from 'react';
import { Camera, DollarSign, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const RulesSection = () => {
  const { isRTL } = useLanguage();

  return (
    <section className="py-[40px] bg-[var(--rules-bg)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
          
          {/* Rule 1: Clear Photos */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center mb-[16px]">
              <Camera className="w-12 h-12 text-[var(--rules-icon-color)]" />
            </div>
            <h3 className="text-[18px] font-bold text-[var(--rules-icon-color)] mb-[12px] uppercase tracking-wide">
              {isRTL ? 'صور واضحة' : 'Clear Photos'}
            </h3>
            <p className="text-[14px] text-[var(--rules-text)] max-w-xs leading-relaxed">
              {isRTL ? 'يجب أن تكون الصور واضحة وتوضح تفاصيل دقيقة' : 'Images must be clear and show exact details of the item.'}
            </p>
          </div>

          {/* Rule 2: Clear Price */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center mb-[16px]">
              <DollarSign className="w-12 h-12 text-[var(--rules-icon-color)]" />
            </div>
            <h3 className="text-[18px] font-bold text-[var(--rules-icon-color)] mb-[12px] uppercase tracking-wide">
              {isRTL ? 'سعر واضح' : 'Clear Price'}
            </h3>
            <p className="text-[14px] text-[var(--rules-text)] max-w-xs leading-relaxed">
              {isRTL ? 'يجب إدراج السعر الفعلي والسعر الخاص' : 'The actual and specific price must be clearly listed.'}
            </p>
          </div>

          {/* Rule 3: Admin Approval */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center mb-[16px]">
              <CheckCircle className="w-12 h-12 text-[var(--rules-icon-color)]" />
            </div>
            <h3 className="text-[18px] font-bold text-[var(--rules-icon-color)] mb-[12px] uppercase tracking-wide">
              {isRTL ? 'موافقة الإدارة' : 'Admin Approval'}
            </h3>
            <p className="text-[14px] text-[var(--rules-text)] max-w-xs leading-relaxed">
              {isRTL ? 'جميع الإعلانات تخضع لموافقة الإدارة قبل النشر' : 'All ads are subject to admin approval before publishing.'}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default RulesSection;
