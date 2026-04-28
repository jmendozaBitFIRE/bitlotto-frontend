'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveAuthData } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userStr = searchParams.get('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        saveAuthData(accessToken, refreshToken, user);
        router.push('/dashboard/rifas');
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login?error=OauthCallbackError');
      }
    } else {
      router.push('/login?error=MissingTokens');
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-white">
      <Loader2 className="h-10 w-10 animate-spin text-brand mb-4" />
      <p className="text-lg font-medium">Procesando inicio de sesión...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
