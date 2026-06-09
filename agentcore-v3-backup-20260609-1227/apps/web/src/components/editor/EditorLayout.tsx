'use client';

import { ReactNode } from 'react';

interface EditorLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  mobileView?: 'left' | 'right';
}

export default function EditorLayout({ leftPanel, rightPanel, mobileView = 'left' }: EditorLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
      {/* Left panel - chat preview */}
      <div className={`
        flex-1 lg:w-[55%] lg:min-w-0 overflow-y-auto border-r border-[var(--border)]
        ${mobileView === 'right' ? 'hidden lg:block' : 'block'}
      `}>
        {leftPanel}
      </div>

      {/* Right panel - editor tabs */}
      <div className={`
        flex-1 lg:w-[45%] lg:min-w-0 flex-col overflow-hidden
        ${mobileView === 'left' ? 'hidden lg:flex' : 'flex'}
      `}>
        {rightPanel}
      </div>
    </div>
  );
}
