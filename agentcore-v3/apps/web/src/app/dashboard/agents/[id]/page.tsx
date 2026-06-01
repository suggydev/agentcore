'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function OldAgentDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    router.replace(`/agents/${id}`);
  }, [router, id]);

  return null;
}
