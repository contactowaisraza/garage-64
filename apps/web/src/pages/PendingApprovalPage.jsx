
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, CheckCircle, FileCheck, ArrowRight } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { formatTierName } from '@/utils/subscriptionUtils';
import PaymentModal from '@/components/PaymentModal.jsx';

const PendingApprovalPage = () => {
  const { isRTL } = useLanguage();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchLatestRequest = async () => {
    try {
      setLoading(true);
      const requests = await pb.collection('requests').getFullList({
        filter: `user_id = "${currentUser?.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      
      if (requests.length > 0) {
        setRequestData(requests[0]);
      }
    } catch (err) {
      console.error('Error fetching request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const status = currentUser.subscription_status;
    console.log("currentUser", currentUser);
    
    if (status === 'approved' || status === 'active') {
      navigate('/bazar');
      return;
    } else if (status !== 'pending' && !currentUser.pending_tier_request) {
      navigate('/memberships');
      return;
    }

    fetchLatestRequest();
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayDate = requestData?.created || currentUser?.pending_request_date;
  const requestDateStr = displayDate 
    ? new Date(displayDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) 
    : (isRTL ? 'تاريخ غير معروف' : 'Unknown Date');
    
  const requestedTier = formatTierName(requestData?.tier || currentUser?.pending_tier_request);
  const hasReceipt = !!(requestData?.receipt_image || currentUser?.receipt_image);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${isRTL ? 'الطلب قيد المراجعة' : 'Request Pending'} - Garage 64`}</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-xl w-full bg-card rounded-2xl p-8 sm:p-12 text-center relative z-10 shadow-2xl border border-border">
          <div className="w-24 h-24 bg-[#ff8c00]/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-[#ff8c00]/20">
            <Clock className="w-12 h-12 text-[#ff8c00] animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
            {requestData?.status === 'rejected' 
              ? (isRTL ? 'تم رفض الطلب' : 'Request Rejected')
              : (isRTL ? 'الطلب قيد المراجعة' : 'Request Pending')}
          </h1>
          
          <p className="text-muted-foreground mb-4 leading-relaxed text-balance max-w-md mx-auto">
            {requestData?.status === 'rejected'
              ? (isRTL 
                  ? 'عذراً، تم رفض طلب الترقية الخاص بك. يرجى التحقق من السبب وإعادة رفع الإيصال.' 
                  : 'Sorry, your upgrade request was rejected. Please check the reason and re-upload your receipt.')
              : (isRTL 
                  ? 'طلبك قيد المراجعة. تم استلام وصلك وجاري التحقق منه.' 
                  : 'Your request is under review. Your receipt has been received and is being verified.')}
          </p>

          <p className={`text-sm font-medium mb-8 inline-block px-4 py-2 rounded-full border ${requestData?.status === 'rejected' ? 'text-destructive bg-destructive/10 border-destructive/20' : 'text-primary bg-primary/10 border-primary/20'}`}>
            {requestData?.status === 'rejected'
              ? (isRTL 
                  ? 'يرجى تقديم إيصال صحيح للمتابعة' 
                  : 'Please provide a valid receipt to continue')
              : (isRTL 
                  ? 'سيتم التحقق من طلبك خلال 24 ساعة' 
                  : 'Your request will be verified within 24 hours')}
          </p>

          <div className="bg-secondary/40 rounded-xl p-6 mb-8 text-left border border-border shadow-inner" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground text-sm font-medium">{isRTL ? 'المستوى المطلوب' : 'Requested Tier'}</span>
              <span className="text-foreground font-bold bg-[#ff8c00]/20 text-[#ff8c00] px-3 py-1 rounded-md text-sm border border-[#ff8c00]/30 uppercase tracking-wider">
                {requestedTier}
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
              <span className="text-muted-foreground text-sm font-medium">{isRTL ? 'تاريخ الطلب' : 'Request Date'}</span>
              <span className="text-foreground font-medium text-sm">{requestDateStr}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> 
                {isRTL ? 'حالة الإيصال' : 'Receipt Status'}
              </span>
              
              {hasReceipt ? (
                <span className="text-[#4CAF50] font-[700] text-sm flex items-center gap-1.5 bg-[#4CAF50]/10 px-3 py-1.5 rounded-md border border-[#4CAF50]/20 shadow-sm">
                  <CheckCircle className="w-4 h-4" />
                  {isRTL ? 'تم الرفع' : 'Uploaded'}
                </span>
              ) : (
                <span className="text-[#ff8c00] font-[700] text-sm flex items-center gap-1.5 bg-[#ff8c00]/10 px-3 py-1.5 rounded-md border border-[#ff8c00]/20 shadow-sm">
                  <Clock className="w-4 h-4" />
                  {isRTL ? 'قيد الانتظار' : 'Pending'}
                </span>
              )}
            </div>
            
            {requestData?.status === 'rejected' && requestData?.rejection_reason && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="text-red-500 font-bold block mb-1">{isRTL ? 'سبب الرفض:' : 'Rejection Reason:'}</span>
                <span className="text-foreground text-sm">{requestData.rejection_reason}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 max-w-sm mx-auto flex flex-col items-center">
            {requestData?.status === 'rejected' ? (
              <Button 
                onClick={() => setShowPaymentModal(true)} 
                className="w-full h-12 text-base font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md"
              >
                {isRTL ? 'إعادة رفع الإيصال' : 'Re-upload Receipt'}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/profile')} 
                className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                {isRTL ? 'الذهاب إلى الملف الشخصي' : 'Go to Profile'}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            )}
            
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full h-12 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isRTL ? 'تسجيل الخروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
      
      {showPaymentModal && (
        <PaymentModal 
          selectedTier={requestData?.tier || currentUser?.pending_tier_request}
          showModal={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          currentUser={currentUser}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchLatestRequest();
          }}
        />
      )}
    </>
  );
};

export default PendingApprovalPage;
