'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function useSubscription() {
  const { user, isLoaded } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setIsPro(false);
      setIsLoading(false);
      return;
    }

    // Admin is always treated as Pro
    if (ADMIN_EMAIL && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
      setIsPro(true);
      setIsLoading(false);
      return;
    }

    supabase
      .from('user_plans')
      .select('is_pro, pro_until')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) { setIsPro(false); setIsLoading(false); return; }
        // Check expiry for monthly/yearly plans
        const notExpired = !data.pro_until || new Date(data.pro_until) > new Date();
        setIsPro(data.is_pro && notExpired);
        setIsLoading(false);
      });
  }, [isLoaded, user]);

  return { isPro, isLoading };
}
