'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { PetOwnerProfile } from '@/components/profile/PetOwnerProfile';
import { VetProfile } from '@/components/profile/VetProfile';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  // Handle Google Direct OAuth Session Hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const googleSession = urlParams.get('google_session');
      if (googleSession) {
        try {
          // Save to local storage for AuthProvider to pick up
          localStorage.setItem('googleUserSession', googleSession);

          // Clean the URL without triggering a full page reload immediately
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Force a hard reload so AuthProvider re-reads localStorage and initializes
          window.location.reload();
        } catch (e) {
          console.error('Failed to parse google session:', e);
        }
      }
    }
  }, []);

  // Check session directly if AuthProvider hasn't loaded yet
  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        if (typeof window !== 'undefined' && user?.id && user?.email) {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              role: user.role || 'pet_owner'
            })
          }).catch(() => undefined);
        }

        setCheckingSession(false);
        return;
      }

      // Wait a bit for AuthProvider to initialize
      const timer = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setCheckingSession(false);
        } else {
          // Session exists but AuthProvider hasn't loaded yet
          // Wait a bit more
          setTimeout(() => {
            setCheckingSession(false);
          }, 1000);
        }
      }, 500);

      return () => clearTimeout(timer);
    };

    checkSession();
  }, [isAuthenticated, user]);

  if (checkingSession) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/90 p-8 text-center shadow-md ring-1 ring-slate-100">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/90 p-8 text-center shadow-md ring-1 ring-slate-100">
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">You&apos;re not logged in</h1>
          <p className="mt-3 text-sm text-slate-600">
            Log in or create an Aniwoo account to view your profile and pet details.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {user?.role === 'admin' ? (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Admin account</h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            You are signed in as an administrator. Open the admin portal to manage users, products, and platform operations.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Open Admin Portal
          </Link>
        </section>
      ) : user?.role === 'vet' ? (
        <VetProfile user={user} />
      ) : (
        <PetOwnerProfile user={user} />
      )}

      <div className="mt-12 flex justify-center border-t border-slate-200 pt-8">
        <button
          type="button"
          onClick={async () => {
            await logout();
            window.location.href = '/';
          }}
          className="rounded-full border border-slate-300 px-8 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-500 hover:bg-red-50 hover:text-red-600"
        >
          Log out securely
        </button>
      </div>
    </main>
  );
}
