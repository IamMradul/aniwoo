'use client';

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { generateGoogleAuthURL } from '@/src/lib/googleAuth';

type User = {
  id: string;
  name: string;
  email: string;
  role?: 'vet' | 'pet_owner' | 'admin';
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: 'vet' | 'pet_owner') => Promise<void>;
  register: (name: string, email: string, password: string, role: 'vet' | 'pet_owner') => Promise<void>;
  loginWithGoogle: (role: 'vet' | 'pet_owner') => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialised, setInitialised] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initialisedRef = useRef(false);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    initialisedRef.current = initialised;
  }, [initialised]);

  // Debug: Log initialization state
  useEffect(() => {
    console.log('AuthProvider: initialised =', initialised, 'user =', user);
  }, [initialised, user]);

  const fetchUserProfile = async (
    userId: string,
    email: string,
    metadataName?: string,
    preferredRole?: 'vet' | 'pet_owner' | 'admin' | null
  ) => {
    const normalizedPreferredRole = preferredRole === 'vet' || preferredRole === 'pet_owner' || preferredRole === 'admin'
      ? preferredRole
      : undefined;

    try {
      // Try to get profile from profiles table first - use maybeSingle to handle missing profiles
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

      if (profile && !error) {
        let resolvedRole = profile.role as 'vet' | 'pet_owner' | 'admin' | undefined;

        // Only apply a preferred role when no role exists yet.
        if (normalizedPreferredRole && !resolvedRole) {
          const { error: repairError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: profile.name || metadataName || email.split('@')[0] || 'Aniwoo user',
              email: profile.email || email,
              role: normalizedPreferredRole,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (!repairError) {
            resolvedRole = normalizedPreferredRole;
          } else {
            console.error('Failed to self-heal profile role:', repairError);
          }
        }

        return {
          id: profile.id,
          name: profile.name || metadataName || email.split('@')[0] || 'Aniwoo user',
          email: profile.email || email,
          role: resolvedRole
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
      role: normalizedPreferredRole
    };
  };

  useEffect(() => {
    let mounted = true;

    // Check for Custom Direct Google Session in localStorage FIRST
    if (typeof window !== 'undefined') {
      const googleSessionStr = localStorage.getItem('googleUserSession');
      if (googleSessionStr) {
        try {
          const googleUser = JSON.parse(googleSessionStr);
          console.log('Found custom Google session:', googleUser.email);

          const baseRole = googleUser.role === 'vet' || googleUser.role === 'pet_owner' || googleUser.role === 'admin'
            ? googleUser.role
            : 'pet_owner';

          if (mounted) {
            setUser({
              id: googleUser.id,
              name: googleUser.name || googleUser.email?.split('@')[0] || 'Aniwoo user',
              email: googleUser.email,
              role: baseRole
            });
            setInitialised(true);
          }

          // Bootstrap signed server session cookie for API routes.
          fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              id: googleUser.id,
              email: googleUser.email,
              role: baseRole
            })
          })
            .then(async () => {
              const response = await fetch('/api/profile', {
                method: 'GET',
                credentials: 'include'
              });

              if (!response.ok) {
                return;
              }

              const payload = await response.json().catch(() => ({}));
              const profile = payload?.data;
              if (!profile?.id) {
                return;
              }

              const syncedRole = profile.role === 'vet' || profile.role === 'pet_owner' || profile.role === 'admin'
                ? profile.role
                : baseRole;

              const syncedUser = {
                id: profile.id,
                name: profile.name || googleUser.name || googleUser.email?.split('@')[0] || 'Aniwoo user',
                email: profile.email || googleUser.email,
                role: syncedRole
              };

              if (mounted) {
                setUser(syncedUser);
              }

              if (typeof window !== 'undefined') {
                localStorage.setItem('googleUserSession', JSON.stringify({
                  ...googleUser,
                  id: syncedUser.id,
                  email: syncedUser.email,
                  name: syncedUser.name,
                  role: syncedUser.role
                }));
              }
            })
            .catch(() => undefined);
        } catch (err) {
          console.error('Error parsing Google session:', err);
          localStorage.removeItem('googleUserSession');
        }
      }
    }

    // Wrap in try-catch to prevent errors from blocking render
    try {
      // Set up auth state change listener FIRST - this handles session restoration
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          const persistedGoogleSession = typeof window !== 'undefined'
            ? localStorage.getItem('googleUserSession')
            : null;

          // Handle different auth events
          if (event === 'SIGNED_OUT' || !session) {
            if (isLoggingOutRef.current) {
              if (mounted) {
                setUser(null);
                setInitialised(true);
              }
              return;
            }

            if (persistedGoogleSession) {
              try {
                const googleUser = JSON.parse(persistedGoogleSession);
                if (mounted) {
                  setUser({
                    id: googleUser.id,
                    name: googleUser.name || googleUser.email?.split('@')[0] || 'Aniwoo user',
                    email: googleUser.email || '',
                    role: googleUser.role === 'vet' || googleUser.role === 'pet_owner' || googleUser.role === 'admin' ? googleUser.role : 'pet_owner'
                  });
                  setInitialised(true);
                }
                return;
              } catch {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('googleUserSession');
                }
              }
            }

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

          // Handle auth hydration and ensure role persistence for OAuth/email flows
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || (event as any) === 'SIGNED_UP') {
            try {
              const metadata = u.user_metadata as { name?: string; full_name?: string; role?: string } | null;
              const pendingRole = typeof window !== 'undefined'
                ? localStorage.getItem('pending_oauth_role') as 'vet' | 'pet_owner' | 'admin' | null
                : null;
              const metadataRole = metadata?.role === 'vet' || metadata?.role === 'pet_owner' || metadata?.role === 'admin'
                ? metadata.role
                : null;
              const roleToApply = pendingRole || metadataRole;
              const resolvedName = metadata?.name || metadata?.full_name || u.email?.split('@')[0] || 'Aniwoo user';

              if (roleToApply) {
                const { data: existingProfile, error: existingProfileError } = await supabase
                  .from('profiles')
                  .select('id, role')
                  .eq('id', u.id)
                  .maybeSingle();

                // Never overwrite an existing persisted role (e.g. admin).
                if (!existingProfileError && (!existingProfile || !existingProfile.role)) {
                  const { error: roleUpsertError } = await supabase.from('profiles').upsert({
                    id: u.id,
                    name: resolvedName,
                    email: u.email || '',
                    role: roleToApply,
                    updated_at: new Date().toISOString()
                  }, {
                    onConflict: 'id'
                  });

                  if (roleUpsertError) {
                    console.error('Error applying role during auth hydration:', roleUpsertError);
                  }
                }
              }

              const userData = await fetchUserProfile(
                u.id,
                u.email || '',
                resolvedName,
                roleToApply
              );

              const finalRole = userData.role || roleToApply || undefined;

              if (mounted) {
                console.log('AuthProvider: Fetched user data:', { ...userData, role: finalRole });
                setUser({ ...userData, role: finalRole });
                setInitialised(true);
              }

              if (pendingRole && typeof window !== 'undefined') {
                localStorage.removeItem('pending_oauth_role');
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
              if (mounted && !initialisedRef.current) {
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
        if (mounted && !initialisedRef.current) {
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

  const login = async (email: string, password: string, role?: 'vet' | 'pet_owner') => {
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
          const fallbackRole = role || 'pet_owner';
          const { error: upsertError } = await supabase.from('profiles').upsert({
            id: u.id,
            role: fallbackRole,
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
      const finalRole = userData.role || role || 'pet_owner';
      setUser({ ...userData, role: finalRole });

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: u.id,
          email: u.email || email,
          role: finalRole || 'pet_owner'
        })
      }).catch(() => undefined);

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
        throw new Error('Profile verification failed. Please try logging in.');
      }

      // Fetch the complete profile
      const userData = await fetchUserProfile(u.id, u.email || email, name);

      setUser({
        ...userData,
        role: verifyProfile.role || role
      });

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: u.id,
          email: u.email || email,
          role: (verifyProfile.role || role) as 'vet' | 'pet_owner' | 'admin'
        })
      }).catch(() => undefined);

      console.log('Registration successful, profile created:', verifyProfile);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error instanceof Error ? error : new Error('Registration failed');
    }
  };

  const loginWithGoogle = async (role: 'vet' | 'pet_owner') => {
    try {
      console.log('Starting custom Google sign in for role:', role);

      // Store the role locally just in case
      if (typeof window !== 'undefined') {
        localStorage.setItem('pending_oauth_role', role);
      }

      const redirectUri = `${window.location.origin}/api/auth/google/callback`;

      // Create state parameter with role + redirect URI (goes to Google and comes back to our API callback)
      const state = encodeURIComponent(JSON.stringify({ role, redirectUri }));

      // Build direct Google OAuth URL and redirect
      const authUrl = generateGoogleAuthURL(state, redirectUri);
      window.location.href = authUrl;

    } catch (error: any) {
      console.error('Error initiating Google OAuth URL:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_oauth_role');
      }
      throw error;
    }
  };

  const logout = async () => {
    isLoggingOutRef.current = true;

    try {
      console.log('Logging out...');

      // Clear local persistence first to avoid SIGNED_OUT rehydrating a stale Google session.
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('pending_oauth_role');
        localStorage.removeItem('googleUserSession');
      }

      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include'
      }).catch(() => undefined);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }

      // Clear user state
      setUser(null);
      console.log('Logout complete');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear user state even if signOut fails
      setUser(null);
    } finally {
      isLoggingOutRef.current = false;
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
