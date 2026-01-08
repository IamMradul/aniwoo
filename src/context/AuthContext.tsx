import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialised, setInitialised] = useState(false);

  const fetchUserProfile = async (userId: string, email: string, metadataName?: string) => {
    // Try to get profile from profiles table first
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    if (profile) {
      return {
        id: profile.id,
        name: profile.name || metadataName || email.split('@')[0] || 'Aniwoo user',
        email: profile.email || email
      };
    }
    
    // Fallback to auth metadata if profile doesn't exist
    return {
      id: userId,
      name: metadataName || email.split('@')[0] || 'Aniwoo user',
      email: email
    };
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u) {
        const userData = await fetchUserProfile(
          u.id,
          u.email || '',
          (u.user_metadata as { name?: string } | null)?.name
        );
        setUser(userData);
      }
      setInitialised(true);
    };
    void init();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user;
      if (!u) {
        setUser(null);
        return;
      }

      // On sign up or sign in, ensure profile exists
      if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
        const metadataName = (u.user_metadata as { name?: string; full_name?: string } | null)?.name || 
                            (u.user_metadata as { name?: string; full_name?: string } | null)?.full_name;
        const name = metadataName || u.email?.split('@')[0] || 'Aniwoo user';
        
        // Upsert profile to ensure it exists
        await supabase.from('profiles').upsert({
          id: u.id,
          name: name,
          email: u.email || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      }

      const userData = await fetchUserProfile(
        u.id,
        u.email || '',
        (u.user_metadata as { name?: string; full_name?: string } | null)?.name || 
        (u.user_metadata as { name?: string; full_name?: string } | null)?.full_name
      );
      setUser(userData);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    const u = data.user;
    if (u) {
      // Fetch profile from database
      const userData = await fetchUserProfile(
        u.id,
        u.email || '',
        (u.user_metadata as { name?: string } | null)?.name
      );
      setUser(userData);
    }
  };

  const register = async (name: string, email: string, password: string) => {
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
      // Create profile in profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: u.id,
        name: name,
        email: u.email || email,
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
        email: u.email || email
      });
    }
  };

  const logout = () => {
    void supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout
      }}
    >
      {initialised ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

