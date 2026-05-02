
import React, { createContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      setCurrentUser(pb.authStore.model);
    }
    setInitialLoading(false);

    // Listen for auth store changes to keep state in sync across tabs
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    setCurrentUser(authData.record);
    return authData;
  };

  const register = async (userData) => {
    const record = await pb.collection('users').create(userData, { $autoCancel: false });
    
    try {
      await pb.collection('users').requestVerification(userData.email, { $autoCancel: false });
    } catch (e) {
      console.warn("Verification email request failed, but user was created:", e);
    }
    
    return record;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const resendVerification = async () => {
    if (currentUser?.email) {
      await pb.collection('users').requestVerification(currentUser.email, { $autoCancel: false });
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    resendVerification,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.is_admin === true,
    initialLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
