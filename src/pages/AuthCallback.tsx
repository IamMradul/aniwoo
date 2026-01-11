import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Wait a bit for the session to be processed by Supabase
    const timer = setTimeout(() => {
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}
