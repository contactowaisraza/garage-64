import React, { createContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model?.collectionName === 'admin') {
      setCurrentAdmin(pb.authStore.model);
    }
    setInitialLoading(false);
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('admin').authWithPassword(email, password, { $autoCancel: false });
    setCurrentAdmin(authData.record);
    return authData;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentAdmin(null);
  };

  const value = {
    currentAdmin,
    login,
    logout,
    isAdmin: !!currentAdmin && currentAdmin.admin_flag === true,
    initialLoading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};