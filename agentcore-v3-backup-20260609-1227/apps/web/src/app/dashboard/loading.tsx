'use client';

import { useEffect } from 'react';

export default function DashboardLoading() {
 return (
 <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
 <div className="flex flex-col items-center gap-4">
 <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] animate-spin" />
 <p className="text-[var(--text-muted)] text-sm">Загрузка панели управления...</p>
 </div>
 </div>
 );
}
