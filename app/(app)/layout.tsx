'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoaded, isAuthenticated]);

  if (!isLoaded || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Animated aurora blobs — sit behind all content */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div className="aurora-blob absolute" style={{
          width: '55vw', height: '55vh',
          top: '-15%', left: '-8%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
        }} />
        <div className="aurora-blob absolute" style={{
          width: '50vw', height: '50vh',
          bottom: '-15%', right: '-8%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)',
          animationDelay: '4s',
        }} />
        <div className="aurora-blob absolute" style={{
          width: '30vw', height: '30vh',
          top: '20%', right: '10%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
          animationDelay: '8s',
        }} />
      </div>
      <Sidebar />
      <div className="flex flex-col h-screen ml-64 overflow-hidden" style={{ position: 'relative', zIndex: 2 }}>
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
