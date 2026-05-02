import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const PaymentHistoryPage = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser]);

  const fetchHistory = async () => {
    try {
      const records = await pb.collection('payments').getList(1, 50, {
        filter: `user_id="${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setPayments(records.items);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">{t('payments.confirmed')}</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">{t('payments.rejected')}</Badge>;
      default:
        return <Badge className="bg-primary text-primary-foreground">{t('payments.pending')}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${t('payments.historyTitle')} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-balance" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {t('payments.historyTitle')}
          </h1>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>{t('payments.date')}</TableHead>
                  <TableHead>{t('payments.tierRequested')}</TableHead>
                  <TableHead>{t('payments.status')}</TableHead>
                  <TableHead>{t('payments.notes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.loading')}</TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('payments.noHistory')}</TableCell>
                  </TableRow>
                ) : (
                  payments.map(payment => (
                    <TableRow key={payment.id} className="border-border">
                      <TableCell className="font-medium text-card-foreground">
                        {format(new Date(payment.created), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-card-foreground">{payment.tier_requested}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {payment.admin_notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PaymentHistoryPage;