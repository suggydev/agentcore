'use client';

export default function AgentFlowPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="agent-flow-page">
      <h1 className="text-[28px] font-semibold text-text tracking-[-0.01em] mb-2">Flow редактор</h1>
      <p className="text-[14px] text-text-muted mb-8">Создавайте потоки агента</p>
      <form data-testid="flow-canvas">
        <div className="space-y-6 p-6 border border-border rounded-lg bg-surface">
          <p className="text-text-muted">Flow canvas placeholder</p>
        </div>
      </form>
    </div>
  );
}
