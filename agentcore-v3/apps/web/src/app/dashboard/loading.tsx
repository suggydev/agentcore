'use client';

import { useEffect } from 'react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#faf8fb] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-mauve-200 border-t-mauve-500 animate-spin" />
        <p className="text-mauve-400 text-sm">Загрузка панели управления...</p>
      </div>
    </div>
  );
}
