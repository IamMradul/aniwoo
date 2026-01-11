'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign in...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple calls
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = async () => {
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;

      try {
        console.log('Auth callback starting...');
        setMessage('Verifying authentication...');

        // Wait a moment for the OAuth flow to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setStatus('error');
          setMessage('Authentication failed. Redirecting...');
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        if (!session) {
          console.log('No session found in callback');
          setStatus('error');
          setMessage('No session found. Redirecting...');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log('Session found for user:', session.user.email);
        setMessage('Loading your profile...');

        // Ensure profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        // If profile doesn't exist, the trigger should create it, but let's ensure it
        if (!profile) {
          console.log('Profile not found, creating...');
          const metadataName = (session.user.user_metadata as { name?: string; full_name?: string } | null)?.name || 
                              (session.user.user_metadata as { name?: string; full_name?: string } | null)?.full_name;
          const name = metadataName || session.user.email?.split('@')[0] || 'Aniwoo user';
          const pendingRole = typeof window !== 'undefined' ? localStorage.getItem('pending_oauth_role') as 'vet' | 'pet_owner' | null : null;
          
          await supabase.from('profiles').insert({
            id: session.user.id,
            name: name,
            email: session.user.email || '',
            role: pendingRole || null
          });

          if (pendingRole && typeof window !== 'undefined') {
            localStorage.removeItem('pending_oauth_role');
          }
        }

        const role = profile?.role || null;
        console.log('User role:', role, '- redirecting now');

        setStatus('redirecting');
        setMessage('Redirecting to your dashboard...');

        // Use window.location for a more reliable redirect
        const redirectPath = role === 'vet' ? '/vet-dashboard' : '/profile';
        console.log('Redirecting to:', redirectPath);
        
        // Try both methods
        window.location.href = redirectPath;
        router.replace(redirectPath);
        
      } catch (error) {
        console.error('Error in auth callback:', error);
        setStatus('error');
        setMessage('An error occurred. Redirecting...');
        setTimeout(() => {
          window.location.href = '/login?error=callback_error';
        }, 2000);
      }
    };

    // Start immediately
    handleCallback();
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
            <p className="text-xs text-slate-400">
              {status === 'redirecting' ? 'Almost there...' : 'Please wait'}
            </p>
            {status === 'loading' && (
              <p className="text-xs text-slate-400 mt-4">
                If this takes too long, <button onClick={() => window.location.href = '/profile'} className="text-primary underline">click here</button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
