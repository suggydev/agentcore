'use client';

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
 children: React.ReactNode;
 fallback?: React.ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  if (process.env.NODE_ENV === 'development') {
  console.error('ErrorBoundary caught:', error, errorInfo);
  }
  }

 render() {
 if (this.state.hasError) {
 if (this.props.fallback) return this.props.fallback;
 return (
 <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
 <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5 ring-1 ring-red-100">
 <AlertTriangle className="w-8 h-8 text-red-500" />
 </div>
 <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Что-то пошло не так</h2>
 <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">
 {process.env.NODE_ENV === 'development' ? this.state.error?.message : `Ошибка отображения компонента: ${this.state.error?.name || 'сбой рендеринга'}. Попробуйте обновить страницу. Если проблема повторяется, сообщите в поддержку.`}
 </p>
 <button
 onClick={() => window.location.reload()}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all shadow-sm"
 >
 <RefreshCw className="w-4 h-4" />
 Попробовать снова
 </button>
 </div>
 );
 }
  return this.props.children;
  }
}
