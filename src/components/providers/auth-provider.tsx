'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { getCurrentAdminServer, logoutAdmin } from '@/lib/auth/admin-auth';
import { useRouter } from 'next/navigation';

import { SplashScreen } from '@/components/ui/splash-screen';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const profile = await getCurrentAdminServer();
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutAdmin();
    setUser(null);
    setIsLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout: handleLogout,
        setUser,
      }}
    >
      {isLoading ? <SplashScreen /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
