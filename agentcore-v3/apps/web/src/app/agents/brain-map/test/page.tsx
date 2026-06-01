'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BrainMapTestRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    const params = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/dashboard/brain-map/test${params}`);
  }, [router]);
  return null;
}
