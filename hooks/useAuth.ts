'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isLoaded: boolean;
  isAuthenticated: boolean;
}

function toUser(u: SupabaseUser | null): User | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? '',
    name:
      u.user_metadata?.full_name ??
      u.user_metadata?.name ??
      u.email?.split('@')[0] ??
      'User',
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(toUser(session?.user ?? null));
      setIsLoaded(true);
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(toUser(session?.user ?? null));
        setIsLoaded(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /** Email + password sign-in */
  const login = useCallback(async (email: string, password: string, _name: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return toUser(data.user);
  }, []);

  /** Email + password sign-up */
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    return toUser(data.user);
  }, []);

  /** Google OAuth — redirects to Google then back to the app */
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return {
    user,
    isLoaded,
    isAuthenticated: user !== null,
    login,
    signUp,
    loginWithGoogle,
    logout,
  };
}

