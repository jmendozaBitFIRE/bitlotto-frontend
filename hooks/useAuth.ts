'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, saveAuthData, clearAuthData, getUserData, isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const data = getUserData();
    if (data && isAuthenticated()) {
      setUser(data);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { access_token, refresh_token, user: userData } = data;
      saveAuthData(access_token, refresh_token, userData);
      setUser(userData);
      
      router.push('/dashboard/rifas');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    router.push('/login');
  }, [router]);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
