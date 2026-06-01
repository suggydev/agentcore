'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BrainMapRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agentParam = params.get('agent');
    const target = agentParam ? `/dashboard/brain-map?agent=${agentParam}` : '/dashboard/brain-map';
    router.replace(target);
  }, [router]);
  return null;
}
