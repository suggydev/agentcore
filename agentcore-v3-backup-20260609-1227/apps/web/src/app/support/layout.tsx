import NewDashboardLayout from '@/components/NewDashboardLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/design/components/Toast';
import { ThemeProvider } from '@/design/ThemeProvider';

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NewDashboardLayout><ErrorBoundary>{children}</ErrorBoundary></NewDashboardLayout>
      </ToastProvider>
    </ThemeProvider>
  );
}
