
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Loader2, Image as ImageIcon, Upload, LayoutList, Eye } from 'lucide-react';
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
    dashboard: 'Admin Control Panel',
    // Users tab
    usersTab: 'Users',
    tierLabel: 'Tier',
    subscriptionStatus: 'Sub. Status',
    joined: 'Joined',
    noUsers: 'No users found',
    // Listings tab
    listingsTab: 'Listings',
    allListings: 'All Listings',
    pendingListings: 'Pending',
    listingTitle: 'Listing',
    postedBy: 'Posted By',
    category: 'Category',
    type: 'Type',
    status: 'Status',
    noListings: 'No listings found',
    noPendingListings: 'No pending listings',
    approveListing: 'Approve',
    rejectListing: 'Reject',
    listingApproved: 'Listing approved',
    listingRejected: 'Listing rejected',
    errorApprovingListing: 'Error approving listing',
    errorRejectingListing: 'Error rejecting listing',
    confirmListingApproval: 'Approve Listing',
    areYouSureApproveListing: 'This listing will be published and visible to all users.',
    confirmListingRejection: 'Reject Listing',
    rejectionReasonRequired: 'Rejection reason (shown to the user)',
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
    dashboard: 'لوحة تحكم المسؤول',
    // Users tab
    usersTab: 'المستخدمون',
    tierLabel: 'الباقة',
    subscriptionStatus: 'حالة الاشتراك',
    joined: 'تاريخ الانضمام',
    noUsers: 'لا يوجد مستخدمون',
    // Listings tab
    listingsTab: 'الإعلانات',
    allListings: 'جميع الإعلانات',
    pendingListings: 'قيد الانتظار',
    listingTitle: 'الإعلان',
    postedBy: 'بواسطة',
    category: 'الفئة',
    type: 'النوع',
    status: 'الحالة',
    noListings: 'لا توجد إعلانات',
    noPendingListings: 'لا توجد إعلانات معلقة',
    approveListing: 'موافقة',
    rejectListing: 'رفض',
    listingApproved: 'تمت الموافقة على الإعلان',
    listingRejected: 'تم رفض الإعلان',
    errorApprovingListing: 'خطأ في الموافقة على الإعلان',
    errorRejectingListing: 'خطأ في رفض الإعلان',
    confirmListingApproval: 'موافقة على الإعلان',
    areYouSureApproveListing: 'سيتم نشر هذا الإعلان وسيكون مرئيًا لجميع المستخدمين.',
    confirmListingRejection: 'رفض الإعلان',
    rejectionReasonRequired: 'سبب الرفض (سيظهر للمستخدم)',
  }
};

const getTierBadgeStyle = (tier) => {
  const normalizedTier = tier?.toLowerCase();
  switch (normalizedTier) {
    case 'dealer':   return 'bg-red-500/10 text-red-500 border-red-500/50';
    case 'collector': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
    case 'hobbyist': return 'bg-slate-300/10 text-slate-300 border-slate-300/50';
    default:          return 'bg-muted text-muted-foreground border-border';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Approved':
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>;
    case 'Rejected':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
};

const TIER_PRIORITY = { dealer: 0, collector: 1, hobbyist: 2, observer: 3 };
const tierRank = (tier) => TIER_PRIORITY[tier?.toLowerCase()] ?? 4;

const AdminDashboard = () => {
  const { language, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const t = translations[language === 'ar' ? 'ar' : 'en'];

  // Payment requests state
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

  // Listings state
  const [allListings, setAllListings] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsFetched, setListingsFetched] = useState(false);
  const [listingsError, setListingsError] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showListingApproveDialog, setShowListingApproveDialog] = useState(false);
  const [showListingRejectDialog, setShowListingRejectDialog] = useState(false);
  const [listingRejectionReason, setListingRejectionReason] = useState('');
  const [usersMap, setUsersMap] = useState({});
  const [viewingListing, setViewingListing] = useState(null);
  const [viewImageIndex, setViewImageIndex] = useState(0);

  // All users state
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);

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
      setPendingRequests([...res.items].sort((a, b) => tierRank(a.tier) - tierRank(b.tier)));
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setErrorMsg(t.errorFetching);
      toast.error(t.errorFetching);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    setListingsLoading(true);
    setListingsError(null);
    try {
      const [all, pending] = await Promise.all([
        pb.collection('listings').getList(1, 200, {
          sort: '-created',
          $autoCancel: false
        }),
        pb.collection('listings').getList(1, 200, {
          filter: 'status="Pending"',
          sort: '-created',
          $autoCancel: false
        })
      ]);
      setAllListings(all.items);
      setPendingListings(pending.items);
      setListingsFetched(true);

      // Batch-fetch users for the "Posted By" column (user_id is a text field, not a relation)
      const uniqueUserIds = [...new Set(all.items.map(l => l.user_id).filter(Boolean))];
      if (uniqueUserIds.length > 0) {
        const filter = uniqueUserIds.map(id => `id="${id}"`).join('||');
        const usersRes = await pb.collection('users').getList(1, uniqueUserIds.length, {
          filter,
          $autoCancel: false
        });
        const map = {};
        usersRes.items.forEach(u => { map[u.id] = u; });
        setUsersMap(map);
        setPendingListings(prev =>
          [...prev].sort((a, b) => tierRank(map[a.user_id]?.subscription_tier) - tierRank(map[b.user_id]?.subscription_tier))
        );
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListingsError(error?.message || 'Failed to fetch listings');
    } finally {
      setListingsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await pb.collection('users').getList(1, 500, {
        sort: '-created',
        $autoCancel: false
      });
      setAllUsers(res.items);
      setUsersFetched(true);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
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

  // Payment request handlers
  const handleApproveClick = (request) => { setSelectedRequest(request); setShowApproveDialog(true); };
  const handleRejectClick  = (request) => { setSelectedRequest(request); setRejectionReason(''); setShowRejectDialog(true); };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const endDate = calculateEndDate();
      await Promise.all([
        pb.collection('requests').update(selectedRequest.id, { status: 'approved' }, { $autoCancel: false }),
        pb.collection('users').update(selectedRequest.user_id, {
          subscription_tier: selectedRequest.tier,
          subscription_status: 'active',
          subscription_end_date: endDate
        }, { $autoCancel: false })
      ]);
      toast.success(t.approvalSuccessful);
      setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
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
      setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setShowRejectDialog(false);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t.errorRejecting);
    } finally {
      setActionLoading(false);
      setSelectedRequest(null);
    }
  };

  // Listing handlers
  const handleListingApproveClick = (listing) => { setSelectedListing(listing); setShowListingApproveDialog(true); };
  const handleListingRejectClick  = (listing) => { setSelectedListing(listing); setListingRejectionReason(''); setShowListingRejectDialog(true); };
  const handleViewListing = (listing) => { setViewingListing(listing); setViewImageIndex(0); };

  const confirmListingApprove = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      await pb.collection('listings').update(selectedListing.id, {
        status: 'Approved',
        rejection_reason: ''
      }, { $autoCancel: false });
      toast.success(t.listingApproved);
      const updated = { ...selectedListing, status: 'Approved', rejection_reason: '' };
      setAllListings(prev => prev.map(l => l.id === selectedListing.id ? updated : l));
      setPendingListings(prev => prev.filter(l => l.id !== selectedListing.id));
      setShowListingApproveDialog(false);
    } catch (error) {
      console.error(error);
      toast.error(t.errorApprovingListing);
    } finally {
      setActionLoading(false);
      setSelectedListing(null);
    }
  };

  const confirmListingReject = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      await pb.collection('listings').update(selectedListing.id, {
        status: 'Rejected',
        rejection_reason: listingRejectionReason.trim()
      }, { $autoCancel: false });
      toast.success(t.listingRejected);
      const updated = { ...selectedListing, status: 'Rejected', rejection_reason: listingRejectionReason.trim() };
      setAllListings(prev => prev.map(l => l.id === selectedListing.id ? updated : l));
      setPendingListings(prev => prev.filter(l => l.id !== selectedListing.id));
      setShowListingRejectDialog(false);
    } catch (error) {
      console.error(error);
      toast.error(t.errorRejectingListing);
    } finally {
      setActionLoading(false);
      setSelectedListing(null);
    }
  };

  const renderListingsTable = (rows, isPendingView = false) => (
    <div className="rounded-xl border border-border overflow-hidden bg-background">
      {listingsError && (
        <div className="flex items-start gap-3 p-4 bg-destructive/5 border-b border-destructive/20 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Could not load listings: {listingsError}</p>
            <p className="text-muted-foreground text-xs">
              Make sure the <strong>listings</strong> collection List rule in PocketBase allows the admin collection:<br />
              <code className="bg-muted px-1 py-0.5 rounded text-foreground">@request.auth.collectionName = "admin" || user_id = @request.auth.id</code>
            </p>
            <Button variant="outline" size="sm" onClick={fetchListings} className="mt-2 h-7 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        </div>
      )}
      <Table dir={isRTL ? 'rtl' : 'ltr'}>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border">
            <TableHead className="py-4">{t.listingTitle}</TableHead>
            <TableHead className="py-4">{t.postedBy}</TableHead>
            <TableHead className="py-4">{t.tierLabel}</TableHead>
            <TableHead className="py-4">{t.category}</TableHead>
            <TableHead className="py-4">{t.type}</TableHead>
            {!isPendingView && <TableHead className="py-4">{t.status}</TableHead>}
            <TableHead className="text-center py-4">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listingsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell><div className="flex items-center gap-3"><Skeleton className="w-12 h-12 rounded-lg" /><Skeleton className="h-4 w-36" /></div></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                {!isPendingView && <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>}
                <TableCell><Skeleton className="h-8 w-32 mx-auto" /></TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isPendingView ? 6 : 7} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <LayoutList className="w-10 h-10 opacity-20" />
                  <p className="font-medium">{isPendingView ? t.noPendingListings : t.noListings}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map(listing => {
              const thumb = listing.images?.length > 0
                ? pb.files.getUrl(listing, listing.images[0], { thumb: '100x100' })
                : null;
              const user = usersMap[listing.user_id];
              const canAct = listing.status === 'Pending' || isPendingView;

              return (
                <TableRow key={listing.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden border border-border flex-shrink-0">
                        {thumb
                          ? <img src={thumb} alt={listing.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" /></div>
                        }
                      </div>
                      <span className="font-medium text-foreground line-clamp-1 max-w-[180px]">{listing.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {user?.name || user?.email || '—'}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={`text-xs font-semibold capitalize ${getTierBadgeStyle(user?.subscription_tier)}`}>
                      {formatTierName(user?.subscription_tier) || 'Observer'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">{listing.category}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="capitalize bg-background text-xs">
                      {listing.listingType || 'Showcase'}
                    </Badge>
                  </TableCell>
                  {!isPendingView && (
                    <TableCell className="py-3">{getStatusBadge(listing.status)}</TableCell>
                  )}
                  <TableCell className="py-3">
                    <div className="flex justify-center items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleViewListing(listing)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canAct ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            onClick={() => handleListingApproveClick(listing)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            {t.approveListing}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleListingRejectClick(listing)}
                            disabled={actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            {t.rejectListing}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{t.dashboard} - Garage 64</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground">{t.dashboard}</h1>
            <p className="text-muted-foreground mt-2">{currentUser?.name}</p>
          </div>

          <Tabs
            defaultValue="users"
            className="w-full"
            dir={isRTL ? 'rtl' : 'ltr'}
            onValueChange={(val) => {
              if (val === 'listings' && !listingsFetched) fetchListings();
            }}
          >
            <TabsList className="bg-muted border border-border mb-6 p-1 flex-wrap h-auto">
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-6 py-2 flex items-center gap-2">
                {t.usersTab}
                {pendingRequests.length > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="listings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-6 py-2 flex items-center gap-2">
                <LayoutList className="w-4 h-4" />
                {t.listingsTab}
                {pendingListings.length > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {pendingListings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="import" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-6 py-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t.importUsers}
              </TabsTrigger>
            </TabsList>

            {/* Users tab — Pending Requests + All Users */}
            <TabsContent value="users">
              <Tabs defaultValue="pending-requests" className="w-full" onValueChange={(val) => { if (val === 'all-users' && !usersFetched) fetchAllUsers(); }}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-muted border border-border p-1">
                    <TabsTrigger value="pending-requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-5 py-1.5 flex items-center gap-2">
                      {t.pendingApprovals}
                      {pendingRequests.length > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {pendingRequests.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all-users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-5 py-1.5">
                      {t.allUsers}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="pending-requests">
                  <Card className="bg-card shadow-lg border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {t.pendingApprovals}
                        {pendingRequests.length > 0 && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                            {pendingRequests.length}
                          </Badge>
                        )}
                      </CardTitle>
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
                                      <RefreshCw className="w-4 h-4 mr-2" /> {t.retry}
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
                                const thumbUrl = req.receipt_image?.startsWith('http')
                                  ? req.receipt_image
                                  : (req.receipt_image ? pb.files.getUrl(req, req.receipt_image, { thumb: '100x100' }) : null);
                                return (
                                  <TableRow key={req.id} className="border-border hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-foreground">{user.name || 'Unknown'}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.email || 'No email'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`uppercase font-bold tracking-wider ${getTierBadgeStyle(req.tier)}`}>
                                        {formatTierName(req.tier)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{new Date(req.created).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                      {thumbUrl ? (
                                        <div
                                          className="w-[80px] h-[80px] rounded-lg bg-secondary overflow-hidden cursor-pointer border border-border hover:opacity-80 transition-all hover:shadow-md hover:ring-2 ring-primary"
                                          onClick={() => openReceiptModal(req)}
                                        >
                                          <img src={thumbUrl} alt={t.receipt} className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }}
                                          />
                                          <div className="hidden flex-col items-center justify-center w-full h-full text-muted-foreground bg-muted">
                                            <ImageIcon className="w-6 h-6 opacity-50" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-[80px] h-[80px] rounded-lg bg-muted flex items-center justify-center border border-border/50 text-muted-foreground">
                                          <AlertTriangle className="w-6 h-6 opacity-30" />
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex justify-center items-center gap-2">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => handleApproveClick(req)} disabled={actionLoading}>
                                          <CheckCircle className="w-4 h-4 mr-2" />{t.approve}
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleRejectClick(req)} disabled={actionLoading}>
                                          <XCircle className="w-4 h-4 mr-2" />{t.reject}
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

                <TabsContent value="all-users">
                  <Card className="bg-card shadow-lg border-border">
                    <CardHeader>
                      <CardTitle>{t.allUsers} {!usersLoading && allUsers.length > 0 && <span className="text-muted-foreground font-normal text-sm">({allUsers.length})</span>}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl border border-border overflow-hidden bg-background">
                        <Table dir={isRTL ? 'rtl' : 'ltr'}>
                          <TableHeader className="bg-muted/50">
                            <TableRow className="border-border">
                              <TableHead className="py-4">{t.user}</TableHead>
                              <TableHead className="py-4">{t.email}</TableHead>
                              <TableHead className="py-4">{t.tierLabel}</TableHead>
                              <TableHead className="py-4">{t.subscriptionStatus}</TableHead>
                              <TableHead className="py-4">{t.joined}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {usersLoading ? (
                              Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="border-border">
                                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                  <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                </TableRow>
                              ))
                            ) : allUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                  <p className="font-medium">{t.noUsers}</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              allUsers.map(user => (
                                <TableRow key={user.id} className="border-border hover:bg-muted/30 transition-colors">
                                  <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-primary">
                                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                      </div>
                                      <span className="font-medium text-sm text-foreground">{user.name || '—'}</span>
                                      {user.is_admin && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Admin</Badge>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 text-sm text-muted-foreground">{user.email}</TableCell>
                                  <TableCell className="py-3">
                                    <Badge variant="outline" className={`text-xs font-semibold capitalize ${getTierBadgeStyle(user.subscription_tier)}`}>
                                      {formatTierName(user.subscription_tier) || 'Observer'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    {user.subscription_status === 'active'
                                      ? <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                                      : <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                    }
                                  </TableCell>
                                  <TableCell className="py-3 text-sm text-muted-foreground">
                                    {new Date(user.created).toLocaleDateString()}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Listings tab */}
            <TabsContent value="listings">
              <Tabs defaultValue="pending-listings" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-muted border border-border p-1">
                    <TabsTrigger value="pending-listings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-5 py-1.5 flex items-center gap-2">
                      {t.pendingListings}
                      {pendingListings.length > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {pendingListings.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all-listings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-5 py-1.5">
                      {t.allListings} ({allListings.length})
                    </TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="sm" onClick={fetchListings} disabled={listingsLoading} className="text-muted-foreground">
                    <RefreshCw className={`w-4 h-4 mr-2 ${listingsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <TabsContent value="pending-listings">
                  <Card className="bg-card shadow-lg border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {t.pendingListings}
                        {pendingListings.length > 0 && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                            {pendingListings.length}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderListingsTable(pendingListings, true)}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="all-listings">
                  <Card className="bg-card shadow-lg border-border">
                    <CardHeader>
                      <CardTitle>{t.allListings}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderListingsTable(allListings, false)}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="import">
              <BulkUserImport onImportComplete={() => {}} />
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>

      {/* Payment Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={(open) => !actionLoading && setShowApproveDialog(open)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t.confirmApproval}</DialogTitle>
          </DialogHeader>
          <div className="py-4"><p>{t.areYouSureApprove}</p></div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={actionLoading}>{t.cancel}</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => !actionLoading && setShowRejectDialog(open)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">{t.confirmRejection}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t.rejectionReason} <span className="text-muted-foreground font-normal">({t.optional})</span></Label>
              <Input id="reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="..." disabled={actionLoading} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>{t.cancel}</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Listing Approve Dialog */}
      <Dialog open={showListingApproveDialog} onOpenChange={(open) => !actionLoading && setShowListingApproveDialog(open)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t.confirmListingApproval}</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="py-4 space-y-3">
              <p className="text-muted-foreground">{t.areYouSureApproveListing}</p>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                {selectedListing.images?.length > 0 ? (
                  <img
                    src={pb.files.getUrl(selectedListing, selectedListing.images[0], { thumb: '80x80' })}
                    className="w-12 h-12 rounded-md object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{selectedListing.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedListing.category}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowListingApproveDialog(false)} disabled={actionLoading}>{t.cancel}</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmListingApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.approveListing}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Listing Reject Dialog */}
      <Dialog open={showListingRejectDialog} onOpenChange={(open) => !actionLoading && setShowListingRejectDialog(open)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">{t.confirmListingRejection}</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                {selectedListing.images?.length > 0 ? (
                  <img
                    src={pb.files.getUrl(selectedListing, selectedListing.images[0], { thumb: '80x80' })}
                    className="w-12 h-12 rounded-md object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{selectedListing.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedListing.category}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing-reason">{t.rejectionReasonRequired}</Label>
                <Textarea
                  id="listing-reason"
                  rows={3}
                  placeholder="e.g. Image quality is too low, please upload clearer photos."
                  value={listingRejectionReason}
                  onChange={(e) => setListingRejectionReason(e.target.value)}
                  disabled={actionLoading}
                  className="resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowListingRejectDialog(false)} disabled={actionLoading}>{t.cancel}</Button>
            <Button variant="destructive" onClick={confirmListingReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.rejectListing}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptImageModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        imageUrl={modalImageUrl}
      />

      {/* Listing Detail Modal */}
      <Dialog open={!!viewingListing} onOpenChange={(open) => !open && setViewingListing(null)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingListing && (() => {
            const poster = usersMap[viewingListing.user_id];
            const images = viewingListing.images || [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl pr-6">{viewingListing.title}</DialogTitle>
                </DialogHeader>

                {/* Image gallery */}
                {images.length > 0 && (
                  <div className="space-y-2">
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                      <img
                        src={pb.files.getUrl(viewingListing, images[viewImageIndex])}
                        alt={viewingListing.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setViewImageIndex(i)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === viewImageIndex ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                          >
                            <img
                              src={pb.files.getUrl(viewingListing, img, { thumb: '80x80' })}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Posted By</p>
                    <p className="font-medium">{poster?.name || poster?.email || '—'}</p>
                    {poster?.email && poster?.name && <p className="text-xs text-muted-foreground">{poster.email}</p>}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</p>
                    <div>{getStatusBadge(viewingListing.status)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Category</p>
                    <p className="font-medium">{viewingListing.category || '—'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Type</p>
                    <Badge variant="outline" className="capitalize text-xs">{viewingListing.listingType || 'Showcase'}</Badge>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Condition</p>
                    <p className="font-medium">{viewingListing.condition || '—'}</p>
                  </div>
                  {viewingListing.listingType === 'sell' && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Price</p>
                      <p className="font-medium">SAR {viewingListing.price || '—'}</p>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Posted On</p>
                    <p className="font-medium">{new Date(viewingListing.created).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Description */}
                {viewingListing.description && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Description</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap border border-border rounded-lg p-3 bg-muted/30">{viewingListing.description}</p>
                  </div>
                )}

                {/* Rejection reason */}
                {viewingListing.rejection_reason && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-destructive font-medium uppercase tracking-wide">Rejection Reason</p>
                    <p className="text-sm text-destructive leading-relaxed border border-destructive/20 rounded-lg p-3 bg-destructive/5">{viewingListing.rejection_reason}</p>
                  </div>
                )}

                <DialogFooter className="gap-2 pt-2">
                  {viewingListing.status === 'Pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => { setViewingListing(null); handleListingApproveClick(viewingListing); }}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        {t.approveListing}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => { setViewingListing(null); handleListingRejectClick(viewingListing); }}
                        disabled={actionLoading}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        {t.rejectListing}
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setViewingListing(null)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
