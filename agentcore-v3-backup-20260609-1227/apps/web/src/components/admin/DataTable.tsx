'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  searchable = true,
  searchKeys,
  pageSize = 10,
  emptyMessage = 'Данные не найдены',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (searchable && search.trim()) {
      const q = search.toLowerCase();
      const keys = searchKeys || columns.map((c) => c.key);
      rows = rows.filter((row) =>
        keys.some((k) => {
          const r = row as unknown as Record<string, unknown>;
          const val = r[k];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const ra = a as unknown as Record<string, unknown>;
        const rb = b as unknown as Record<string, unknown>;
        const av = ra[sortKey];
        const bv = rb[sortKey];
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        const as = String(av ?? '').toLowerCase();
        const bs = String(bv ?? '').toLowerCase();
        return sortDir === 'asc' ? (as > bs ? 1 : -1) : as > bs ? -1 : 1;
      });
    }
    return rows;
  }, [data, search, sortKey, sortDir, columns, searchable, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      {searchable && (
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
          />
          <span className="text-xs text-text-muted">{filtered.length} строк</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted ${col.width ? `w-[${col.width}]` : ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-text transition-colors"
                    >
                      {col.header}
                      {sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-surface-3 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-border last:border-b-0 hover:bg-surface-2/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {col.render ? col.render(row as T) : String((row as unknown as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Страница {page} из {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Предыдущая страница"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Следующая страница"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
