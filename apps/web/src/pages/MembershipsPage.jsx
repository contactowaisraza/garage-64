
import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MembershipTiersSection from '@/components/MembershipTiersSection.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const MembershipsPage = () => {
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  const message = location.state?.message;

  return (
    <>
      <Helmet>
        <title>{`Memberships - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 pt-24">
          {message && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 text-destructive-foreground">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2 font-medium">
                  {message}
                </AlertDescription>
              </Alert>
            </div>
          )}
          <MembershipTiersSection />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MembershipsPage;
