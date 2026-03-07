'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const googleSession = searchParams.get('google_session');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Authentication failed. Redirecting to login...');
      setTimeout(() => router.replace(`/login?error=${encodeURIComponent(error)}`), 1200);
      return;
    }

    if (googleSession) {
      localStorage.setItem('googleUserSession', googleSession);
      localStorage.removeItem('pending_oauth_role');
      router.replace('/profile');
      return;
    }

    // This route is no longer used for Supabase OAuth exchange.
    // Keep a safe fallback for old bookmarks.
    setMessage('Redirecting...');
    router.replace('/profile');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light p-4">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-lg text-center">
        {status === 'error' ? (
          <>
            <p className="text-red-600 mb-4">{message}</p>
          </>
        ) : (
          <>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-slate-600 mb-2">{message}</p>
            <p className="text-xs text-slate-400">Please wait</p>
          </>
        )}
      </div>
    </div>
  );
}
