import NewDashboardLayout from '@/components/NewDashboardLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <NewDashboardLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </NewDashboardLayout>
  );
}
