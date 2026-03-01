'use client';

import { useState } from 'react';
import { Chrome, Stethoscope, User, X } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface GoogleSignInProps {
  role: 'vet' | 'pet_owner';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  disabled?: boolean;
  requireRoleSelection?: boolean;
  hasSelectedRole?: boolean;
  onRoleSelected?: (role: 'vet' | 'pet_owner') => void;
}

export function GoogleSignIn({
  role,
  text = 'signin_with',
  disabled = false,
  requireRoleSelection = false,
  hasSelectedRole = false
}: GoogleSignInProps) {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Safety check
  if (!auth || !auth.loginWithGoogle) {
    console.error('GoogleSignIn: useAuth hook not available or loginWithGoogle missing');
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
        Authentication system not available. Please refresh the page.
      </div>
    );
  }

  const { loginWithGoogle } = auth;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || loading) {
      console.log('GoogleSignIn: Button disabled or loading', { disabled, loading });
      return;
    }

    if (requireRoleSelection && !hasSelectedRole) {
      setShowRoleModal(true);
      return;
    }

    executeGoogleLogin(role);
  };

  const executeGoogleLogin = async (selectedRole: 'vet' | 'pet_owner') => {
    console.log('GoogleSignIn: Initiating OAuth for role:', selectedRole);
    setLoading(true);
    setError(null);
    setShowRoleModal(false);

    try {
      await loginWithGoogle(selectedRole);
      // The OAuth flow will redirect automatically
      // No need to do anything else here
    } catch (err: any) {
      console.error('Error initiating Google OAuth:', err);
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-slate-300"
        style={{ cursor: disabled || loading ? 'not-allowed' : 'pointer' }}
      >
        <Chrome className="h-5 w-5" />
        {loading ? 'Connecting to Google...' : text === 'signin_with' ? 'Sign in with Google' : text === 'signup_with' ? 'Sign up with Google' : 'Continue with Google'}
      </button>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-dark">Select Account Type</h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Please let us know how you will be using Aniwoo so we can set up your experience correctly.
            </p>

            <div className="grid gap-3">
              <button
                onClick={() => executeGoogleLogin('vet')}
                className="group flex w-full items-center justify-start rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-dark group-hover:text-primary transition-colors">Veterinarian</div>
                  <div className="text-xs text-slate-500">Manage your clinic, accept appointments</div>
                </div>
              </button>

              <button
                onClick={() => executeGoogleLogin('pet_owner')}
                className="group flex w-full items-center justify-start rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-dark transition-colors">Pet Owner</div>
                  <div className="text-xs text-slate-500">Book vets, manage pet health</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
