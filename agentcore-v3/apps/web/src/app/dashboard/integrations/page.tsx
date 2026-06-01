'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IntegrationsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/agents');
  }, [router]);
  return null;
}
