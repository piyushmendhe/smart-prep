'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Infinity, ArrowRight, Sparkles } from 'lucide-react';
import Script from 'next/script';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹199',
    period: '/month',
    badge: null,
    icon: Zap,
    iconColor: 'text-cyan-400',
    gradFrom: 'from-cyan-500/20',
    gradTo: 'to-blue-600/10',
    border: 'border-cyan-500/30',
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '₹999',
    period: '/year',
    badge: 'Save 58%',
    icon: Crown,
    iconColor: 'text-amber-400',
    gradFrom: 'from-amber-500/20',
    gradTo: 'to-orange-600/10',
    border: 'border-amber-500/40',
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: '₹1,999',
    period: 'one-time',
    badge: 'Best Value',
    icon: Infinity,
    iconColor: 'text-purple-400',
    gradFrom: 'from-purple-500/20',
    gradTo: 'to-pink-600/10',
    border: 'border-purple-500/40',
  },
] as const;

const PRO_FEATURES = [
  'Full DE Roadmap with LeetCode SQL problems',
  'AI Interview Coach (Claude-powered)',
  'Unlimited Behavioral question practice',
  'System Design deep dives',
  'Weekly review & progress analytics',
  'Session notes & history',
  'Priority support',
];

const FREE_FEATURES = [
  'Dashboard & streak tracking',
  'DSA Track (all topics)',
  'Basic System Design',
  'Core Behavioral questions',
];

export default function PricingPage() {
  const { user, isLoaded } = useAuth();
  const { isPro } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !user) router.push('/login');
  }, [isLoaded, user, router]);

  async function handleCheckout(planId: typeof PLANS[number]['id']) {
    if (!user) return;
    setLoading(planId);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planType: planId }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId } = await res.json();

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Smart Prep',
        description: `Pro Plan — ${planId}`,
        order_id: orderId,
        prefill: {
          email: user.email,
          name: user.name,
        },
        theme: { color: '#00d4ff' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Verify payment on server
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ ...response, planType: planId }),
          });

          if (verifyRes.ok) {
            router.push('/?upgraded=1');
          } else {
            setError('Payment succeeded but verification failed. Contact support.');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  if (!isLoaded) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="p-6 max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Unlock everything
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-bold text-foreground"
          >
            Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Pro</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted max-w-md mx-auto"
          >
            Get full access to the AI coach, DE Roadmap, and all advanced features.
          </motion.p>
        </div>

        {isPro && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 text-center"
          >
            <p className="text-green-400 font-semibold">🎉 You already have Pro access!</p>
          </motion.div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isActive = loading === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={`relative bg-gradient-to-br ${plan.gradFrom} ${plan.gradTo} border ${plan.border} rounded-2xl p-6 flex flex-col gap-5`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <span className="font-semibold text-foreground">{plan.label}</span>
                </div>

                <div>
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted text-sm ml-1">{plan.period}</span>
                </div>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isActive || isPro}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isPro
                      ? 'bg-neutral-800 text-muted cursor-not-allowed'
                      : `bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/25 ${isActive ? 'opacity-60 cursor-wait' : ''}`
                  }`}
                >
                  {isActive ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPro ? (
                    'Already Pro'
                  ) : (
                    <>Get Pro <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-neutral-800 rounded-2xl p-6 space-y-4"
          >
            <h3 className="font-semibold text-foreground">Free</h3>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted">
                  <Check className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/25 rounded-2xl p-6 space-y-4"
          >
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Pro <Crown className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-muted">Everything in Free, plus:</p>
            <ul className="space-y-2.5">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <p className="text-center text-xs text-muted">
          Secure payments via Razorpay · UPI, Cards, Net Banking accepted
        </p>
      </div>
    </>
  );
}
