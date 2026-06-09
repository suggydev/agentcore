'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

const STALE_TIME = 30 * 1000;
const GC_TIME = 5 * 60 * 1000;
const RETRY_COUNT = 2;
const RETRY_DELAY = 1000;

function retryDelayFn(attemptIndex: number) {
  return Math.min(RETRY_DELAY * 2 ** attemptIndex, 30 * 1000);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME,
            gcTime: GC_TIME,
            retry: RETRY_COUNT,
            retryDelay: retryDelayFn,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
            retryDelay: retryDelayFn,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
