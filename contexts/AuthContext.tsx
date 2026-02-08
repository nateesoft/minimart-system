'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  login as apiLogin,
  getAuthToken,
  setAuthToken,
  getCurrentUser,
} from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname);

      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/pos');
      }
    }
  }, [user, isLoading, pathname, router]);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch current user info
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    setUser(result.user);
  };

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.role === 'ADMIN') return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      if (!user) return false;
      if (user.role === 'ADMIN') return true;
      return permissions.some((p) => user.permissions.includes(p));
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string) => {
      return user?.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
