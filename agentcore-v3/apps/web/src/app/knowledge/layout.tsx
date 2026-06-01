'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewDashboardLayout from '@/components/NewDashboardLayout';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const ls = localStorage.getItem('token');
  if (ls) return ls;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const token = getToken();
    if (!token) router.push('/login');
  }, [router]);
  return <NewDashboardLayout>{children}</NewDashboardLayout>;
}
