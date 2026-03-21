'use client';

import { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Only renders the ad if the AdSense Publisher ID is configured
export function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const { isPro } = useSubscription();
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    if (!publisherId || isPro) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet — safe to ignore
    }
  }, [publisherId, isPro]);

  // Don't show ads to Pro users or if AdSense isn't configured
  if (!publisherId || isPro) return null;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
