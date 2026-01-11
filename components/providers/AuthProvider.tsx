'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
      // Try to get profile from profiles table first - use maybeSingle to handle missing profiles
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (profile && !error) {
        return {
          id: profile.id,
          name: profile.name || metadataName || email.split('@')[0] || 'Aniwoo user',
          email: profile.email || email,
          role: profile.role as 'vet' | 'pet_owner' | undefined
        };
      }
      
      // If profile doesn't exist, try to create it
      if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating it...');
        const name = metadataName || email.split('@')[0] || 'Aniwoo user';
        const { data: newProfile, error: createError } = await supabase.from('profiles').insert({
          id: userId,
          name: name,
          email: email,
          role: null
        }).select().single();
        
        if (newProfile && !createError) {
          return {
            id: newProfile.id,
            name: newProfile.name || name,
            email: newProfile.email || email,
            role: newProfile.role as 'vet' | 'pet_owner' | undefined
          };
        }
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
            const pendingRole = typeof window !== 'undefined' ? localStorage.getItem('pending_oauth_role') as 'vet' | 'pet_owner' | null : null;
            
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
            if (pendingRole && typeof window !== 'undefined') {
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Failed to log in. Please check your credentials.');
      }

      if (!data.user) {
        throw new Error('No user data returned from login');
      }

      const u = data.user;

      // Wait a moment for the session to be fully established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify session exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error after login:', sessionError);
        throw new Error('Failed to establish session. Please try again.');
      }

      // Update profile with role if not already set
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        if (!profile?.role) {
          const { error: upsertError } = await supabase.from('profiles').upsert({
            id: u.id,
            role: role,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

          if (upsertError) {
            console.error('Error updating profile role:', upsertError);
            // Don't throw - role update is optional
          }
        }
      } catch (profileErr) {
        console.error('Error handling profile:', profileErr);
        // Continue even if profile update fails
      }
      
      // Fetch profile from database
      const userData = await fetchUserProfile(
        u.id,
        u.email || '',
        (u.user_metadata as { name?: string } | null)?.name
      );
      
      // Use role from profile if available, otherwise use the role passed in
      const finalRole = userData.role || role;
      setUser({ ...userData, role: finalRole });

      // Verify user was set
      if (!userData.id) {
        throw new Error('Failed to load user profile');
      }
    } catch (error: any) {
      console.error('Login function error:', error);
      // Re-throw with better error message
      throw error instanceof Error ? error : new Error('An unexpected error occurred during login');
    }
  };

  const register = async (name: string, email: string, password: string, role: 'vet' | 'pet_owner') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            name: name,
            full_name: name,
            role: role
          } 
        }
      });
      
      if (error) {
        console.error('Supabase signup error:', error);
        throw new Error(error.message || 'Failed to create account');
      }

      if (!data.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const u = data.user;

      // Wait for the database trigger to create the profile automatically
      // The trigger runs with SECURITY DEFINER, so it bypasses RLS
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if profile was created by trigger
      let { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, name, email, role, created_at')
        .eq('id', u.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile:', checkError);
      }

      const now = new Date().toISOString();

      if (!existingProfile) {
        // Profile wasn't created by trigger - try to create it manually
        console.log('Profile not found, attempting to create manually...');
        const { error: insertError } = await supabase.from('profiles').insert({
          id: u.id,
          name: name,
          email: u.email || email,
          role: role,
          created_at: now,
          updated_at: now
        });

        if (insertError) {
          console.error('Error inserting profile:', insertError);
          // Wait a bit more and check again (trigger might be delayed)
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: retryCheck } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();
          
          if (!retryCheck) {
            throw new Error(`Failed to create profile: ${insertError.message}. Please check database trigger setup.`);
          }
          existingProfile = retryCheck;
        }
      } else {
        // Profile exists - update it with role and name
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: name,
            email: u.email || email,
            role: role,
            updated_at: now
          })
          .eq('id', u.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }
      }

      // Verify profile was created/updated
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single();

      if (verifyError || !verifyProfile) {
        console.error('Error verifying profile:', verifyError);
        throw new Error('Profile verification failed. Please try logging in.');
      }

      // Fetch the complete profile
      const userData = await fetchUserProfile(u.id, u.email || email, name);
      
      setUser({
        ...userData,
        role: verifyProfile.role || role
      });

      console.log('Registration successful, profile created:', verifyProfile);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error instanceof Error ? error : new Error('Registration failed');
    }
  };

  const loginWithGoogle = async (role: 'vet' | 'pet_owner') => {
    try {
      // Store the role in localStorage so we can use it after OAuth callback
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_oauth_role', role);
      }
      
      // Use Supabase's built-in OAuth
      // This will redirect to Google, then back to Supabase's callback, then to our redirectTo URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pending_oauth_role');
        }
        throw error;
      }

      // The OAuth flow will redirect to Google, then back to our callback
      // The session will be handled by the auth state change listener
      // No need to do anything else here - the redirect happens automatically
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_oauth_role');
      }
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
