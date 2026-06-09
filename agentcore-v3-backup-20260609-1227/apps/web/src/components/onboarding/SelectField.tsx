'use client';

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}

export default function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className="relative p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] transition-all focus-within:ring-2 focus-within:ring-[var(--brand)] focus-within:border-[var(--brand)] focus-within:bg-surface">
      <label className="block text-xs font-semibold uppercase tracking-label text-[var(--brand)] mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent text-[var(--text)] text-sm outline-none cursor-pointer appearance-none pr-8"
          suppressHydrationWarning
        >
          <option value="">
            {placeholder}
          </option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {value && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]/30" />
          </div>
        )}
      </div>
    </div>
  );
}
