'use client';

import { ReactNode } from 'react';

interface EditorLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export default function EditorLayout({ leftPanel, rightPanel }: EditorLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
      <div className="flex-1 lg:w-[55%] lg:min-w-0 overflow-y-auto border-r border-[var(--border)]">
        {leftPanel}
      </div>
      <div className="hidden lg:flex lg:w-[45%] lg:min-w-0 flex-col overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}
