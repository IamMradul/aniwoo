import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Check if we just came from our custom Google Auth API Route
    const searchParams = new URLSearchParams(window.location.search);
    const googleSession = searchParams.get('google_session');

    if (googleSession) {
      try {
        const parsedSession = JSON.parse(decodeURIComponent(googleSession));
        localStorage.setItem('googleUserSession', JSON.stringify(parsedSession));

        // We do a manual window.location redirect to bypass React Router's state
        // and force the newly hydrated AuthContext to pick up the localStorage session instantly.
        setTimeout(() => {
          if (parsedSession.role === 'vet') {
            window.location.href = '/vet-dashboard';
          } else {
            window.location.href = '/profile';
          }
        }, 100);
        return;
      } catch (err) {
        console.error('Failed to parse google session:', err);
      }
    }

    // Only proceed when auth has finished initializing (for legacy/email flows)
    if (!isLoading) {
      if (user) {
        // Redirect based on role
        if (user.role === 'vet') {
          navigate('/vet-dashboard', { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      } else {
        // If no user, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}
