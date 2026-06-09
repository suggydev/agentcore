import NewDashboardLayout from '@/components/NewDashboardLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <NewDashboardLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </NewDashboardLayout>
  );
}
