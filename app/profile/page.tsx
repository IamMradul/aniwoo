'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { PetOwnerProfile } from '@/components/profile/PetOwnerProfile';
import { VetProfile } from '@/components/profile/VetProfile';

type ActiveTab = 'dashboard' | 'account' | 'security';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [displayName, setDisplayName] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [resetEmailMessage, setResetEmailMessage] = useState<string | null>(null);
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);

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
        try {
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
        } catch (error: any) {
          // Supabase auth lock can throw AbortError during rapid auth state changes.
          if (error?.name === 'AbortError') {
            setCheckingSession(false);
            return;
          }

          console.error('Session check failed:', error);
          setCheckingSession(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    };

    checkSession().catch((error) => {
      if ((error as any)?.name === 'AbortError') {
        setCheckingSession(false);
        return;
      }
      console.error('Profile session initialization failed:', error);
      setCheckingSession(false);
    });
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  const handleNameUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName || !user?.id) {
      setAccountError('Name cannot be empty.');
      setAccountMessage(null);
      return;
    }

    setAccountLoading(true);
    setAccountError(null);
    setAccountMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update name.');
      }

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          name: trimmedName,
          full_name: trimmedName
        }
      });

      if (authUpdateError) {
        console.warn('Auth metadata name update failed:', authUpdateError.message);
      }

      if (typeof window !== 'undefined') {
        const googleSessionStr = localStorage.getItem('googleUserSession');
        if (googleSessionStr) {
          try {
            const googleSession = JSON.parse(googleSessionStr);
            localStorage.setItem('googleUserSession', JSON.stringify({
              ...googleSession,
              name: trimmedName
            }));
          } catch {
            localStorage.removeItem('googleUserSession');
          }
        }
      }

      setAccountMessage('Name updated successfully.');
      router.refresh();
    } catch (error: any) {
      setAccountError(error.message || 'Failed to update name.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters.');
      setSecurityMessage(null);
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match.');
      setSecurityMessage(null);
      return;
    }

    setSecurityLoading(true);
    setSecurityError(null);
    setSecurityMessage(null);

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          password: newPassword
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update password.');
      }

      setNewPassword('');
      setConfirmPassword('');
      setSecurityMessage('Password updated successfully.');
    } catch (error: any) {
      setSecurityError(error.message || 'Failed to update password.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email || typeof window === 'undefined') {
      setResetEmailError('No account email found for password reset.');
      setResetEmailMessage(null);
      return;
    }

    setResetEmailLoading(true);
    setResetEmailError(null);
    setResetEmailMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/profile`
      });

      if (error) {
        throw new Error(error.message);
      }

      setResetEmailMessage('Password reset link sent to your email.');
    } catch (error: any) {
      setResetEmailError(error.message || 'Failed to send reset link.');
    } finally {
      setResetEmailLoading(false);
    }
  };

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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Profile Center</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Manage your account details, security, and your Aniwoo profile tools in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p><span className="font-semibold">Signed in as:</span> {user?.email}</p>
            <p className="mt-1"><span className="font-semibold">Role:</span> {user?.role || 'pet_owner'}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'dashboard' ? 'bg-primary text-white' : 'border border-slate-300 text-slate-700 hover:border-primary hover:text-primary'}`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'account' ? 'bg-primary text-white' : 'border border-slate-300 text-slate-700 hover:border-primary hover:text-primary'}`}
          >
            Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'security' ? 'bg-primary text-white' : 'border border-slate-300 text-slate-700 hover:border-primary hover:text-primary'}`}
          >
            Security
          </button>
        </div>
      </section>

      {activeTab === 'dashboard' && (
        <section className="mt-8">
          {user?.role === 'admin' ? (
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <h2 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Admin account</h2>
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
        </section>
      )}

      {activeTab === 'account' && (
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-dark sm:text-2xl">Account Details</h2>
          <p className="mt-2 text-sm text-slate-600">Update your display name used across Aniwoo.</p>

          <form onSubmit={handleNameUpdate} className="mt-6 max-w-xl space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Full name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Enter your name"
              />
            </div>

            {accountError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{accountError}</p>}
            {accountMessage && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{accountMessage}</p>}

            <button
              type="submit"
              disabled={accountLoading}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {accountLoading ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'security' && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-dark sm:text-2xl">Change Password</h2>
            <p className="mt-2 text-sm text-slate-600">Set a new strong password for your account.</p>

            <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="Repeat new password"
                />
              </div>

              {securityError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{securityError}</p>}
              {securityMessage && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{securityMessage}</p>}

              <button
                type="submit"
                disabled={securityLoading}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {securityLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-dark sm:text-2xl">Forgot Password</h2>
            <p className="mt-2 text-sm text-slate-600">
              Send a recovery link to <span className="font-semibold">{user?.email}</span> in case you lose access.
            </p>

            <div className="mt-6">
              {resetEmailError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{resetEmailError}</p>}
              {resetEmailMessage && <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{resetEmailMessage}</p>}

              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={resetEmailLoading}
                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {resetEmailLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Session</h3>
              <p className="mt-2 text-sm text-slate-600">Use secure logout when switching devices or shared systems.</p>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  window.location.href = '/';
                }}
                className="mt-4 rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-500 hover:bg-red-50 hover:text-red-600"
              >
                Log out securely
              </button>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
