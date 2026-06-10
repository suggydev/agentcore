export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <h1 className="text-[72px] font-bold text-[var(--brand)] mb-4">404</h1>
        <p className="text-[18px] text-[var(--text)] mb-2">Страница не найдена</p>
        <p className="text-[14px] text-[var(--text-muted)]">Not Found</p>
      </div>
    </div>
  );
}
