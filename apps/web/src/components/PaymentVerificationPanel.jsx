import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Search, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const PaymentVerificationPanel = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    let filtered = payments;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.expand?.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.expand?.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('payments').getFullList({
        sort: '-created',
        expand: 'user_id',
        $autoCancel: false
      });
      setPayments(records);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      let data = { status: action === 'approve' ? 'Confirmed' : 'Rejected' };
      if (action === 'reject') {
        const reason = window.prompt(t('admin.rejectionReason'));
        if (reason === null) return;
        data.admin_notes = reason;
      }
      
      await pb.collection('payments').update(id, data, { $autoCancel: false });
      toast.success(action === 'approve' ? t('admin.paymentConfirmed') : t('admin.tierUpdated'));
      fetchPayments();
    } catch (error) {
      console.error('Action failed', error);
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.searchUsers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('common.filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allTiers')}</SelectItem>
            <SelectItem value="Pending">{t('payments.pending')}</SelectItem>
            <SelectItem value="Confirmed">{t('payments.confirmed')}</SelectItem>
            <SelectItem value="Rejected">{t('payments.rejected')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>{t('admin.email')}</TableHead>
              <TableHead>{t('payments.tierRequested')}</TableHead>
              <TableHead>{t('payments.date')}</TableHead>
              <TableHead>{t('payments.status')}</TableHead>
              <TableHead className="text-right">{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6">{t('common.loading')}</TableCell></TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">{t('admin.noPaymentRequests')}</TableCell></TableRow>
            ) : (
              filteredPayments.map(payment => (
                <TableRow key={payment.id} className="border-border">
                  <TableCell>
                    <div className="font-medium text-card-foreground">{payment.expand?.user_id?.name || 'User'}</div>
                    <div className="text-sm text-muted-foreground">{payment.expand?.user_id?.email}</div>
                  </TableCell>
                  <TableCell className="text-card-foreground font-medium">{payment.tier_requested}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(payment.created), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'Confirmed' ? 'default' : payment.status === 'Rejected' ? 'destructive' : 'secondary'}
                           className={payment.status === 'Confirmed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                      {payment.status === 'Confirmed' ? t('payments.confirmed') : payment.status === 'Rejected' ? t('payments.rejected') : t('payments.pending')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.receipt_image && (
                        <Button size="sm" variant="outline" onClick={() => setSelectedImage(pb.files.getUrl(payment, payment.receipt_image))} title={t('admin.viewReceipt')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {payment.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={() => handleAction(payment.id, 'approve')}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleAction(payment.id, 'reject')}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl bg-transparent border-none shadow-none">
          {selectedImage && (
            <img src={selectedImage} alt="Receipt" className="w-full rounded-xl object-contain max-h-[80vh]" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentVerificationPanel;