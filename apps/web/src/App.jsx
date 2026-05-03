
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedSubscriptionRoute from '@/components/ProtectedSubscriptionRoute.jsx';
import AdminProtectedRoute from '@/components/AdminProtectedRoute.jsx';
import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import UserProfilePage from '@/pages/UserProfilePage.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import BrowseListingsPage from '@/pages/BrowseListingsPage.jsx';
import BazarPage from '@/pages/BazarPage.jsx';
import ListingDetailPage from '@/pages/ListingDetailPage.jsx';
import MyListingsPage from '@/pages/MyListingsPage.jsx';
import ListingForm from '@/pages/ListingForm.jsx';
import MessagesPage from '@/pages/MessagesPage.jsx';
import ChatDetailPage from '@/pages/ChatDetailPage.jsx';
import PaymentHistoryPage from '@/pages/PaymentHistoryPage.jsx';
import DiecastCategoryPage from '@/pages/DiecastCategoryPage.jsx';
import DiecastBrandListingsPage from '@/pages/DiecastBrandListingsPage.jsx';
import MembershipsPage from '@/pages/MembershipsPage.jsx';
import PendingApprovalPage from '@/pages/PendingApprovalPage.jsx';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/memberships" element={<MembershipsPage />} />
              <Route path="/upgrade" element={<MembershipsPage />} />
              
              {/* Access controlled routes wrapped in ProtectedSubscriptionRoute */}
              <Route path="/pending-approval" element={<ProtectedSubscriptionRoute><PendingApprovalPage /></ProtectedSubscriptionRoute>} />
              <Route path="/profile" element={<ProtectedSubscriptionRoute><UserProfilePage /></ProtectedSubscriptionRoute>} />
              
              <Route path="/bazar" element={<ProtectedSubscriptionRoute><BazarPage /></ProtectedSubscriptionRoute>} />
              <Route path="/listings" element={<ProtectedSubscriptionRoute><BrowseListingsPage /></ProtectedSubscriptionRoute>} />
              <Route path="/browse" element={<ProtectedSubscriptionRoute><BrowseListingsPage /></ProtectedSubscriptionRoute>} />
              <Route path="/listing/:id" element={<ProtectedSubscriptionRoute><ListingDetailPage /></ProtectedSubscriptionRoute>} />
              <Route path="/diecast" element={<ProtectedSubscriptionRoute><DiecastCategoryPage /></ProtectedSubscriptionRoute>} />
              <Route path="/diecast/:brand" element={<ProtectedSubscriptionRoute><DiecastBrandListingsPage /></ProtectedSubscriptionRoute>} />
              <Route path="/my-listings" element={<ProtectedSubscriptionRoute><MyListingsPage /></ProtectedSubscriptionRoute>} />
              <Route path="/create-listing" element={<ProtectedSubscriptionRoute><ListingForm /></ProtectedSubscriptionRoute>} />
              <Route path="/edit-listing/:id" element={<ProtectedSubscriptionRoute><ListingForm /></ProtectedSubscriptionRoute>} />
              <Route path="/messages" element={<ProtectedSubscriptionRoute><MessagesPage /></ProtectedSubscriptionRoute>} />
              <Route path="/messages/:conversationId" element={<ProtectedSubscriptionRoute><ChatDetailPage /></ProtectedSubscriptionRoute>} />
              <Route path="/payment-history" element={<ProtectedSubscriptionRoute><PaymentHistoryPage /></ProtectedSubscriptionRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin-dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            </Routes>
            <Toaster />
          </Router>
        </AdminAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
