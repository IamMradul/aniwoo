import { useState } from 'react';
import { Chrome } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GoogleSignInProps {
  role: 'vet' | 'pet_owner';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  disabled?: boolean;
}

export function GoogleSignIn({ role, text = 'signin_with', disabled = false }: GoogleSignInProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await loginWithGoogle(role);
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
      <button
      onClick={handleClick}
      disabled={disabled || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Chrome className="h-5 w-5" />
      {loading ? 'Connecting to Google...' : text === 'signin_with' ? 'Sign in with Google' : text === 'signup_with' ? 'Sign up with Google' : 'Continue with Google'}
      </button>
  );
}
