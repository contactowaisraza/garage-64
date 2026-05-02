
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReceiptImageModal from '@/components/ReceiptImageModal.jsx';
import BulkUserImport from '@/components/BulkUserImport.jsx';
import { calculateEndDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { formatTierName } from '@/utils/subscriptionUtils';

const translations = {
  en: {
    pendingApprovals: 'Pending Approvals',
    user: 'User Name',
    email: 'Email',
    requestedTier: 'Requested Tier',
    requestDate: 'Request Date',
    receipt: 'Receipt Image',
    actions: 'Actions',
    approve: 'Approve',
    reject: 'Reject',
    rejectionReason: 'Rejection Reason',
    confirmRejection: 'Confirm Rejection',
    noPendingRequests: 'No pending requests',
    approvalSuccessful: 'Approval successful',
    rejectionSuccessful: 'Rejection successful',
    errorApproving: 'Error approving request',
    errorRejecting: 'Error rejecting request',
    errorFetching: 'Failed to fetch pending requests',
    confirmApproval: 'Confirm Approval',
    areYouSureApprove: 'Are you sure you want to approve this request?',
    cancel: 'Cancel',
    optional: 'Optional',
    retry: 'Retry',
    allUsers: 'All Users',
    importUsers: 'Import Users',
    totalUsers: 'Total Users',
    dashboard: 'Admin Control Panel'
  },
  ar: {
    pendingApprovals: 'الطلبات المعلقة',
    user: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    requestedTier: 'الباقة المطلوبة',
    requestDate: 'تاريخ الطلب',
    receipt: 'صورة الإيصال',
    actions: 'الإجراءات',
    approve: 'موافقة',
    reject: 'رفض',
    rejectionReason: 'سبب الرفض',
    confirmRejection: 'تأكيد الرفض',
    noPendingRequests: 'لا توجد طلبات معلقة',
    approvalSuccessful: 'تمت الموافقة بنجاح',
    rejectionSuccessful: 'تم الرفض بنجاح',
    errorApproving: 'خطأ في الموافقة على الطلب',
    errorRejecting: 'خطأ في رفض الطلب',
    errorFetching: 'فشل في جلب الطلبات المعلقة',
    confirmApproval: 'تأكيد الموافقة',
    areYouSureApprove: 'هل أنت متأكد من الموافقة على هذا الطلب؟',
    cancel: 'إلغاء',
    optional: 'اختياري',
    retry: 'إعادة المحاولة',
    allUsers: 'جميع المستخدمين',
    importUsers: 'استيراد مستخدمين',
    totalUsers: 'إجمالي المستخدمين',
    dashboard: 'لوحة تحكم المسؤول'
  }
};

const getTierBadgeStyle = (tier) => {
  const normalizedTier = tier?.toLowerCase();
  switch (normalizedTier) {
    case 'dealer':
      return 'bg-red-500/10 text-red-500 border-red-500/50';
    case 'collector':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
    case 'hobbyist':
      return 'bg-slate-300/10 text-slate-300 border-slate-300/50';
    case 'observer':
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const AdminDashboard = () => {
  const { language, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await pb.collection('requests').getList(1, 50, { 
        filter: 'status="pending"', 
        expand: 'user_id',
        sort: '-created',
        $autoCancel: false 
      });
      setPendingRequests(res.items);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setErrorMsg(t.errorFetching);
      toast.error(t.errorFetching);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const openReceiptModal = (request) => {
    if (!request.receipt_image) return;
    const url = request.receipt_image.startsWith('http') 
      ? request.receipt_image 
      : pb.files.getUrl(request, request.receipt_image);
    setModalImageUrl(url);
    setShowReceiptModal(true);
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const endDate = calculateEndDate();
      
      await Promise.all([
        pb.collection('requests').update(selectedRequest.id, { 
          status: 'approved' 
        }, { $autoCancel: false }),
        
        pb.collection('users').update(selectedRequest.user_id, {
          subscription_tier: selectedRequest.tier,
          subscription_status: 'active',
          subscription_end_date: endDate
        }, { $autoCancel: false })
      ]);

      toast.success(t.approvalSuccessful);
      setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setShowApproveDialog(false);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(t.errorApproving);
    } finally {
      setActionLoading(false);
      setSelectedRequest(null);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await pb.collection('requests').update(selectedRequest.id, {
        status: 'rejected',
        rejection_reason: rejectionReason.trim()
      }, { $autoCancel: false });

      toast.success(t.rejectionSuccessful);
      setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setShowRejectDialog(false);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t.errorRejecting);
    } finally {
      setActionLoading(false);
      setSelectedRequest(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t.dashboard} - Garage 64</title>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              {t.dashboard}
            </h1>
            <p className="text-muted-foreground mt-2">
              {currentUser?.name}
            </p>
          </div>

          <Tabs defaultValue="pending" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="bg-muted border border-border mb-6 p-1 flex-wrap h-auto">
              <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-6 py-2">
                {t.pendingApprovals} ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-6 py-2">
                {t.allUsers}
              </TabsTrigger>
              <TabsTrigger value="import" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-6 py-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t.importUsers}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card className="bg-card shadow-lg border-border">
                <CardHeader>
                  <CardTitle>{t.pendingApprovals}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border overflow-hidden bg-background">
                    <Table dir={isRTL ? 'rtl' : 'ltr'}>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="border-border">
                          <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t.user}</TableHead>
                          <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t.email}</TableHead>
                          <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t.requestedTier}</TableHead>
                          <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t.requestDate}</TableHead>
                          <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t.receipt}</TableHead>
                          <TableHead className="text-center">{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <TableRow key={idx} className="border-border">
                              <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                              <TableCell><Skeleton className="h-[100px] w-[100px] rounded-lg" /></TableCell>
                              <TableCell><Skeleton className="h-10 w-[140px] mx-auto" /></TableCell>
                            </TableRow>
                          ))
                        ) : errorMsg ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3 text-destructive">
                                <AlertTriangle className="w-8 h-8 opacity-80" />
                                <p className="font-medium">{errorMsg}</p>
                                <Button variant="outline" size="sm" onClick={fetchPendingRequests}>
                                  <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.retry}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : pendingRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <CheckCircle className="w-12 h-12 text-muted-foreground/30" />
                                <p className="text-lg font-medium">{t.noPendingRequests}</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendingRequests.map((req) => {
                            const user = req.expand?.user_id || {};
                            // Use thumbnail for table display
                            const thumbUrl = req.receipt_image?.startsWith('http') 
                              ? req.receipt_image 
                              : (req.receipt_image ? pb.files.getUrl(req, req.receipt_image, { thumb: '100x100' }) : null);

                            return (
                              <TableRow key={req.id} className="border-border hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium text-foreground">
                                  {user.name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {user.email || 'No email'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`uppercase font-bold tracking-wider ${getTierBadgeStyle(req.tier)}`}>
                                    {formatTierName(req.tier)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm font-medium text-foreground">
                                  {new Date(req.created).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {thumbUrl ? (
                                    <div 
                                      className="w-[80px] h-[80px] rounded-lg bg-secondary overflow-hidden cursor-pointer border border-border hover:opacity-80 transition-all hover:shadow-md hover:ring-2 ring-primary relative group"
                                      onClick={() => openReceiptModal(req)}
                                    >
                                      <img 
                                        src={thumbUrl} 
                                        alt={t.receipt} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="hidden flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted">
                                        <ImageIcon className="w-6 h-6 opacity-50" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-[80px] h-[80px] rounded-lg bg-muted flex flex-col items-center justify-center border border-border/50 text-muted-foreground">
                                      <AlertTriangle className="w-6 h-6 mb-2 opacity-30" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center items-center gap-2">
                                    <Button 
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-medium transition-all"
                                      onClick={() => handleApproveClick(req)}
                                      disabled={actionLoading}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                                      {t.approve}
                                    </Button>
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                                      onClick={() => handleRejectClick(req)}
                                      disabled={actionLoading}
                                    >
                                      <XCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                                      {t.reject}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="bg-card shadow-lg border-border">
                <CardHeader>
                  <CardTitle>{t.allUsers}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-16 text-muted-foreground border border-border border-dashed rounded-xl bg-background">
                    Coming soon.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="import">
              <BulkUserImport onImportComplete={() => {}} />
            </TabsContent>
          </Tabs>
        </main>
        
        <Footer />
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={(open) => !actionLoading && setShowApproveDialog(open)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t.confirmApproval}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">{t.areYouSureApprove}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={actionLoading}>
              {t.cancel}
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />}
              {t.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => !actionLoading && setShowRejectDialog(open)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">{t.confirmRejection}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t.rejectionReason} <span className="text-muted-foreground font-normal">({t.optional})</span></Label>
              <Input 
                id="reason" 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                placeholder="..."
                disabled={actionLoading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />}
              {t.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Image Modal */}
      <ReceiptImageModal 
        isOpen={showReceiptModal} 
        onClose={() => setShowReceiptModal(false)} 
        imageUrl={modalImageUrl} 
      />
    </>
  );
};

export default AdminDashboard;
