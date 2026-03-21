'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AuthCheckerProps {
  children: React.ReactNode;
}

export function AuthChecker({ children }: AuthCheckerProps) {
  const { isAuthenticated, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded) {
      // Redirect to login if not authenticated and not on login page
      if (!isAuthenticated && !pathname.startsWith('/login')) {
        router.push('/login');
      }
    }
  }, [isLoaded, isAuthenticated, pathname, router]);

  // Show nothing while checking auth
  if (!isLoaded) {
    return null;
  }

  // If not authenticated and not on login page, render nothing (will redirect)
  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return null;
  }

  return <>{children}</>;
}

