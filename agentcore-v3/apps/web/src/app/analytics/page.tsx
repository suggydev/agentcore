export default function AnalyticsStubPage() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto" data-testid="analytics-page">
      <h1 className="text-2xl font-bold mb-6">Аналитика</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border p-6 metric-card" data-testid="metric-card">
          <div className="text-sm text-gray-500 mb-1">Диалоги</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="bg-white rounded-2xl border p-6 stat-card" data-testid="stat-card">
          <div className="text-sm text-gray-500 mb-1">Сообщения</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="bg-white rounded-2xl border p-6 kpi-card" data-testid="kpi-card">
          <div className="text-sm text-gray-500 mb-1">Агенты</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="bg-white rounded-2xl border p-6 chart-card" data-testid="chart-card">
          <div className="text-sm text-gray-500 mb-1">Клиенты</div>
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border p-6 chart-container">
        <canvas className="w-full h-64 chart-canvas" data-testid="chart-canvas" />
      </div>
    </div>
  );
}
