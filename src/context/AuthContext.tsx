import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type User = {
  id: string;
  name: string;
  email: string;
  role?: 'vet' | 'pet_owner';
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'vet' | 'pet_owner') => Promise<void>;
  register: (name: string, email: string, password: string, role: 'vet' | 'pet_owner') => Promise<void>;
  loginWithGoogle: (role: 'vet' | 'pet_owner') => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialised, setInitialised] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Debug: Log initialization state
  useEffect(() => {
    console.log('AuthProvider: initialised =', initialised, 'user =', user);
  }, [initialised, user]);

  const fetchUserProfile = async (userId: string, email: string, metadataName?: string) => {
    try {
      // Try to get profile from profiles table first
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (profile && !error) {
        return {
          id: profile.id,
          name: profile.name || metadataName || email.split('@')[0] || 'Aniwoo user',
          email: profile.email || email,
          role: profile.role as 'vet' | 'pet_owner' | undefined
        };
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Continue to fallback
    }
    
    // Fallback to auth metadata if profile doesn't exist or query fails
    return {
      id: userId,
      name: metadataName || email.split('@')[0] || 'Aniwoo user',
      email: email,
      role: undefined
    };
  };

  useEffect(() => {
    let mounted = true;

    // Wrap in try-catch to prevent errors from blocking render
    try {
      // Set up auth state change listener FIRST - this handles session restoration
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        // Handle different auth events
        if (event === 'SIGNED_OUT' || !session) {
          if (mounted) {
            setUser(null);
            setInitialised(true);
          }
          return;
        }

        const u = session?.user;
        if (!u) {
          if (mounted) {
            setUser(null);
            setInitialised(true);
          }
          return;
        }

        // For TOKEN_REFRESHED events, don't refetch everything - just keep current user
        if (event === 'TOKEN_REFRESHED') {
          // Session refreshed, but user is still the same - don't refetch
          return;
        }

        // Handle INITIAL_SESSION and SIGNED_IN - restore user on page load/refresh
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          try {
            const userData = await fetchUserProfile(
              u.id,
              u.email || '',
              (u.user_metadata as { name?: string; full_name?: string } | null)?.name || 
              (u.user_metadata as { name?: string; full_name?: string } | null)?.full_name
            );
            if (mounted) {
              setUser(userData);
              setInitialised(true);
            }
          } catch (error) {
            console.error('Error fetching user profile on initial session:', error);
            // Set user with basic info even if profile fetch fails
            if (mounted) {
              setUser({
                id: u.id,
                name: (u.user_metadata as { name?: string } | null)?.name || u.email?.split('@')[0] || 'User',
                email: u.email || '',
                role: undefined
              });
              setInitialised(true);
            }
          }
          return;
        }

        // On sign up or sign in, ensure profile exists
        if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
          try {
            const metadataName = (u.user_metadata as { name?: string; full_name?: string } | null)?.name || 
                                (u.user_metadata as { name?: string; full_name?: string } | null)?.full_name;
            const name = metadataName || u.email?.split('@')[0] || 'Aniwoo user';
            
            // Check if there's a pending OAuth role from Google sign-in
            const pendingRole = localStorage.getItem('pending_oauth_role') as 'vet' | 'pet_owner' | null;
            
            // Upsert profile to ensure it exists (preserve existing role if set, use pending role for new OAuth users)
            const { data: existingProfile } = await supabase.from('profiles').select('role').eq('id', u.id).maybeSingle();
            const roleToUse = existingProfile?.role || pendingRole || null;
            
            await supabase.from('profiles').upsert({
              id: u.id,
              name: name,
              email: u.email || '',
              role: roleToUse,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
            
            // Clear pending role after using it
            if (pendingRole) {
              localStorage.removeItem('pending_oauth_role');
            }
          } catch (error) {
            console.error('Error upserting profile:', error);
            // Continue even if profile upsert fails
          }
        }

        // Handle SIGNED_UP events
        if (event === 'SIGNED_UP') {
          try {
            const userData = await fetchUserProfile(
              u.id,
              u.email || '',
              (u.user_metadata as { name?: string; full_name?: string } | null)?.name || 
              (u.user_metadata as { name?: string; full_name?: string } | null)?.full_name
            );
            if (mounted) {
              setUser(userData);
            }
          } catch (error) {
            console.error('Error fetching user profile in auth state change:', error);
            // Set user with basic info even if profile fetch fails
            if (mounted) {
              setUser({
                id: u.id,
                name: (u.user_metadata as { name?: string } | null)?.name || u.email?.split('@')[0] || 'User',
                email: u.email || '',
                role: undefined
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Don't clear user on error - keep current state
        if (mounted) {
          setInitialised(true);
        }
      }
    });

    // Initialize - check current session after listener is set up
    const init = async () => {
      try {
        // Get current session - this will trigger INITIAL_SESSION event
        const { data: { session } } = await supabase.auth.getSession();
        
        // If no session, mark as initialized (user is logged out)
        if (!session && mounted) {
          setInitialised(true);
          return;
        }
        
        // If session exists, INITIAL_SESSION event should handle user restoration
        // But set a shorter timeout as backup (safety timeout will also catch this)
        if (session && mounted) {
          setTimeout(() => {
            if (mounted && !initialised) {
              // Fallback: if INITIAL_SESSION didn't fire, initialize anyway
              const u = session.user;
              setUser({
                id: u.id,
                name: (u.user_metadata as { name?: string } | null)?.name || u.email?.split('@')[0] || 'User',
                email: u.email || '',
                role: undefined
              });
              setInitialised(true);
            }
          }, 500); // Shorter timeout - safety timeout will catch if this doesn't
        }
      } catch (error) {
        console.error('Error in init:', error);
        if (mounted) {
          setInitialised(true);
        }
      }
    };

    // Small delay to ensure listener is set up first
    setTimeout(() => {
      void init();
    }, 50);
    
    // Safety timeout - always initialize after 1000ms max for faster loading
    // Increased timeout to give Supabase more time to respond
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initialised) {
        console.warn('Auth initialization timeout - forcing initialization');
        setInitialised(true);
      }
    }, 1000);

      return () => {
        mounted = false;
        subscription.unsubscribe();
        clearTimeout(safetyTimeout);
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      // Even if auth setup fails, mark as initialized so app can render
      if (mounted) {
        setInitialised(true);
      }
      return () => {
        mounted = false;
      };
    }
  }, []);

  const login = async (email: string, password: string, role: 'vet' | 'pet_owner') => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    const u = data.user;
    if (u) {
      // Update profile with role if not already set
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', u.id).single();
      if (!profile?.role) {
        await supabase.from('profiles').upsert({
          id: u.id,
          role: role,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      }
      
      // Fetch profile from database
      const userData = await fetchUserProfile(
        u.id,
        u.email || '',
        (u.user_metadata as { name?: string } | null)?.name
      );
      setUser({ ...userData, role });
    }
  };

  const register = async (name: string, email: string, password: string, role: 'vet' | 'pet_owner') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) {
      throw error;
    }
    const u = data.user;
    if (u) {
      // Create profile in profiles table with role
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: u.id,
        name: name,
        email: u.email || email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Still set user even if profile creation fails
      }

      setUser({
        id: u.id,
        name,
        email: u.email || email,
        role: role
      });
    }
  };

  const loginWithGoogle = async (role: 'vet' | 'pet_owner') => {
    try {
      // Store the role in localStorage so we can use it after OAuth callback
      localStorage.setItem('pending_oauth_role', role);
      
      // Use Supabase's built-in OAuth
      // This will redirect to Google, then back to Supabase's callback, then to our redirectTo URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
          options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
        });

      if (error) {
        localStorage.removeItem('pending_oauth_role');
        throw error;
        }

      // The OAuth flow will redirect to Google, then back to our callback
      // The session will be handled by the auth state change listener
      // No need to do anything else here - the redirect happens automatically
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
      localStorage.removeItem('pending_oauth_role');
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('pending_oauth_role');
      }
      
      // Clear user state
      setUser(null);
      console.log('Logout complete');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear user state even if signOut fails
      setUser(null);
    }
  };

  // Always render children immediately - don't block on auth initialization
  // Auth will update in the background
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout
      }}
    >
      {initError ? (
        <div className="min-h-screen flex items-center justify-center bg-light p-4">
          <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-lg text-center">
            <p className="text-slate-600 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

