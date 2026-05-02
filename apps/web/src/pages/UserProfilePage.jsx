
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileEditModal from '@/components/ProfileEditModal.jsx';
import { MessageSquare, Heart, ListPlus } from 'lucide-react';

const UserProfilePage = () => {
  const { t, isRTL } = useLanguage();
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stats, setStats] = useState({ listings: 0, likes: 0, messages: 0 });
  const [user, setUser] = useState(currentUser);

  const fetchUserData = async () => {
    if (!currentUser) return;
    try {
      const updatedUser = await pb.collection('users').getOne(currentUser.id, { $autoCancel: false });
      setUser(updatedUser);
      if (setCurrentUser) setCurrentUser(updatedUser);

      const [listingsRes, likesRes, messagesRes] = await Promise.all([
        pb.collection('listings').getList(1, 1, { filter: `user_id="${updatedUser.id}"`, $autoCancel: false }),
        pb.collection('likes').getList(1, 1, { filter: `user_id="${updatedUser.id}"`, $autoCancel: false }),
        pb.collection('messages').getList(1, 1, { filter: `recipient_id="${updatedUser.id}"`, $autoCancel: false })
      ]);
      
      setStats({
        listings: listingsRes.totalItems,
        likes: likesRes.totalItems,
        messages: messagesRes.totalItems
      });
    } catch (error) {
      console.error('Error fetching user data', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser?.id]);

  if (!user) return null;

  const renderDaysRemaining = () => {
    if (!user.subscription_end_date) return null;

    const endDate = new Date(user.subscription_end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let displayClass = "text-[14px] font-normal mt-1 ";
    let displayText = "";

    if (days > 5) {
      displayClass += "text-gray-400";
      displayText = isRTL ? `الأيام المتبقية: ${days}` : `Days Remaining: ${days}`;
    } else if (days > 0 && days <= 5) {
      displayClass += "text-[#ff4444]";
      displayText = isRTL ? `الأيام المتبقية: ${days}` : `Days Remaining: ${days}`;
    } else if (days === 0) {
      displayClass += "text-[#ff4444]";
      displayText = isRTL ? 'ينتهي اليوم' : 'Expires Today';
    } else {
      displayClass += "text-[#ff4444]";
      displayText = isRTL ? 'منتهي الصلاحية' : 'Expired';
    }

    return (
      <div className={displayClass}>
        {displayText}
      </div>
    );
  };

  const tierName = (user.subscription_tier || user.tier || 'observer').toUpperCase();

  return (
    <>
      <Helmet>
        <title>{`${isRTL ? 'الملف الشخصي' : 'Profile'} - Garage 64`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center px-4 py-24 mt-12">
          
          {/* Main Profile Card */}
          <div 
            className="w-full max-w-[450px] bg-[#1a1a1a] rounded-[8px] p-[24px] border border-white/5 shadow-2xl flex flex-col items-center text-center transition-all duration-300"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* 1. Avatar */}
            <div className="relative mb-3">
              {user.avatar ? (
                <img 
                  src={pb.files.getUrl(user, user.avatar)} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/10" 
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-[#2a2a2a] flex items-center justify-center text-3xl font-bold text-white ring-2 ring-white/10">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* 2. Observer Badge */}
            <div className="bg-black/30 text-[#ff8c00] px-[8px] py-[4px] rounded-[4px] text-[12px] font-bold tracking-wider mb-4 border border-[#ff8c00]/20">
              {tierName}
            </div>

            {/* 3. Name */}
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {user.name}
            </h1>

            {/* 4. Days Remaining */}
            {renderDaysRemaining()}

            {/* 5. Email */}
            <p className="text-muted-foreground text-sm mt-2 font-medium">
              {user.email}
            </p>

            {/* Divider */}
            <div className="w-full h-px bg-white/10 my-6"></div>

            {/* 6. Stats Grid */}
            <div className="flex justify-between w-full px-2 sm:px-6">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1 text-gray-300">
                  <ListPlus className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold font-mono text-white leading-none">{stats.listings}</span>
                <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                  {isRTL ? 'إعلانات' : 'Listings'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1 text-gray-300">
                  <Heart className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold font-mono text-white leading-none">{stats.likes}</span>
                <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                  {isRTL ? 'إعجابات' : 'Likes'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1 text-gray-300">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold font-mono text-white leading-none">{stats.messages}</span>
                <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                  {isRTL ? 'رسائل' : 'Messages'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/10 my-6"></div>

            {/* 7. Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-[12px] w-full">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-[12px] px-[16px] rounded-[6px] transition-colors duration-300 border border-white/5"
              >
                {isRTL ? 'تعديل' : 'Edit'}
              </button>
              
              <button 
                onClick={() => navigate('/my-listings')}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-[12px] px-[16px] rounded-[6px] transition-colors duration-300 border border-white/5"
              >
                {isRTL ? 'إعلاناتي' : 'My Listings'}
              </button>
            </div>
            
            <div className="w-full mt-[12px]">
              <button 
                onClick={() => navigate('/memberships')}
                className="w-full bg-[#ff8c00] hover:bg-[#e67e00] text-[#ffffff] font-bold py-[12px] px-[24px] rounded-[6px] shadow-[0_4px_14px_rgba(255,140,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,140,0,0.4)] transition-all duration-300 active:scale-[0.98]"
              >
                {isRTL ? 'ترقية المستوى' : 'Upgrade Level'}
              </button>
            </div>

          </div>

        </main>

        <Footer />
        
        <ProfileEditModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          user={user}
          onSuccess={fetchUserData}
        />
      </div>
    </>
  );
};

export default UserProfilePage;
