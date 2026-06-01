'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UpgradeRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    const params = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/dashboard/billing/upgrade${params}`);
  }, [router]);
  return null;
}
