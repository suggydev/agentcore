'use client';

export default function AgentSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="agent-settings-page">
      <h1 className="text-[28px] font-semibold text-text tracking-[-0.01em] mb-2">Настройки агента</h1>
      <p className="text-[14px] text-text-muted mb-8">Настройте параметры агента</p>
      <form data-testid="agent-settings-form">
        <div className="space-y-6 p-6 border border-border rounded-lg bg-surface">
          <div>
            <label className="text-[14px] font-medium text-text mb-1.5 block">Модель</label>
            <select data-testid="model-select" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-text">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
