'use client';

import { ComponentProps, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

function ReactFlowLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
    </div>
  );
}

export const ReactFlow = dynamic<ComponentProps<typeof import('reactflow').default>>(
  () => import('reactflow').then((mod) => mod.default),
  { ssr: false, loading: ReactFlowLoader }
);

export const Background = dynamic<ComponentProps<typeof import('reactflow').Background>>(
  () => import('reactflow').then((mod) => mod.Background),
  { ssr: false }
);

export const Controls = dynamic<ComponentProps<typeof import('reactflow').Controls>>(
  () => import('reactflow').then((mod) => mod.Controls),
  { ssr: false }
);

export const MiniMap = dynamic<ComponentProps<typeof import('reactflow').MiniMap>>(
  () => import('reactflow').then((mod) => mod.MiniMap),
  { ssr: false }
);
