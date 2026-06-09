'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Trash2,
  Upload,
  Link,
  Search,
  BookOpen,
  X,
  Loader2,
  AlertTriangle,
  ExternalLink,
  FileDown,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'url' | 'file';
  createdAt: string;
  updatedAt: string;
  agentId: string | null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Unauthorized');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function getPreview(content: string, max = 120): string {
  const cleaned = content.replace(/<[^>]*>/g, '').trim();
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
}

function DocTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'url':
      return <Link size={16} className="text-info" />;
    case 'file':
      return <FileDown size={16} className="text-warning" />;
    default:
      return <FileText size={16} className="text-brand" />;
  }
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<'text' | 'url' | 'upload'>('text');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [viewDoc, setViewDoc] = useState<KnowledgeDoc | null>(null);

  const limit = 20;

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      const res = await apiFetch<{ data: KnowledgeDoc[]; total: number }>(
        `/api/knowledge?${params.toString()}`
      );
      setDocs(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить документы');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить документ? Это действие необратимо.')) return;
    try {
      await apiFetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить документ');
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (addTab === 'text') {
        if (!newTitle.trim() || !newContent.trim()) {
          setSubmitError('Заполните название и содержимое');
          setIsSubmitting(false);
          return;
        }
        await apiFetch('/api/knowledge', {
          method: 'POST',
          body: JSON.stringify({ title: newTitle.trim(), content: newContent, type: 'text' }),
        });
      } else if (addTab === 'url') {
        if (!newUrl.trim()) {
          setSubmitError('Введите URL');
          setIsSubmitting(false);
          return;
        }
        await apiFetch('/api/knowledge/parse', {
          method: 'POST',
          body: JSON.stringify({ url: newUrl.trim() }),
        });
      } else if (addTab === 'upload') {
        if (!uploadFile) {
          setSubmitError('Выберите файл');
          setIsSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append('files', uploadFile);
        await apiFetch('/api/knowledge/upload', {
          method: 'POST',
          body: formData,
        });
      }
      setShowAddModal(false);
      setNewTitle('');
      setNewContent('');
      setNewUrl('');
      setUploadFile(null);
      setAddTab('text');
      fetchDocs();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Не удалось добавить документ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-brand" />
          <h1 className="text-xl font-semibold text-text tracking-heading">База знаний</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-button text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          <Plus size={16} />
          Добавить документ
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-card bg-danger-soft border border-danger/10 text-sm text-danger flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button type="button" onClick={fetchDocs} className="ml-auto text-xs underline hover:no-underline">
            Повторить
          </button>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск документов..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface border border-border rounded-button text-text placeholder:text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-card bg-surface border border-border animate-pulse">
              <div className="h-4 bg-surface-3 rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-3 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto text-text-muted mb-4 opacity-40" />
          <p className="text-text-muted text-sm">
            {search ? 'Документы не найдены' : 'База знаний пуста'}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {search ? 'Попробуйте изменить поисковый запрос' : 'Добавьте документы, чтобы агент мог на них ссылаться'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-button text-sm text-text hover:bg-surface-2 transition-colors"
            >
              <Plus size={16} />
              Добавить документ
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {docs.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-card bg-surface border border-border hover:border-brand/20 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <DocTypeIcon type={doc.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setViewDoc(doc)}
                      className="text-sm font-medium text-text hover:text-brand transition-colors text-left w-full truncate"
                    >
                      {doc.title}
                    </button>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {getPreview(doc.content, 200)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">
                        {doc.type === 'url' ? 'URL' : doc.type === 'file' ? 'Файл' : 'Текст'}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(doc.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-button bg-surface border border-border text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Назад
              </button>
              <span className="text-xs text-text-muted">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-button bg-surface border border-border text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-surface-2/80 backdrop-blur-md"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-text">Добавить документ</h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-text transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex border-b border-border">
                {(['text', 'url', 'upload'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setAddTab(tab); setSubmitError(null); }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      addTab === tab
                        ? 'text-brand border-b-2 border-brand'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {tab === 'text' ? 'Текст' : tab === 'url' ? 'URL' : 'Файл'}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                {submitError && (
                  <div className="px-3 py-2 rounded-button bg-danger-soft border border-danger/10 text-sm text-danger">
                    {submitError}
                  </div>
                )}

                {addTab === 'text' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">Название</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Введите название документа"
                        className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-button text-text placeholder:text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">Содержимое</label>
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Введите текст документа"
                        rows={8}
                        className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-card text-text placeholder:text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand resize-y"
                      />
                    </div>
                  </>
                )}

                {addTab === 'url' && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">URL страницы</label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com/page"
                      className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-button text-text placeholder:text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    />
                    <p className="text-xs text-text-muted mt-1.5">
                      Содержимое страницы будет загружено автоматически
                    </p>
                  </div>
                )}

                {addTab === 'upload' && (
                  <div>
                    <label
                      className="block w-full p-8 border-2 border-dashed border-border rounded-xl text-center cursor-pointer hover:border-brand/40 transition-colors"
                    >
                      <input
                        type="file"
                        accept=".txt,.md,.csv,.json,.html,.htm,.xml"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setUploadFile(f);
                        }}
                        className="hidden"
                      />
                      <Upload size={28} className="mx-auto text-text-muted mb-2" />
                      <p className="text-sm text-text-muted">
                        {uploadFile ? uploadFile.name : 'Выберите файл или перетащите его сюда'}
                      </p>
                      <p className="text-xs text-text-muted mt-1">TXT, MD, CSV, JSON, HTML</p>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-button text-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                    Добавить
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewDoc && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-surface-2/80 backdrop-blur-md"
              onClick={() => setViewDoc(null)}
            />
            <motion.div
              className="relative w-full max-w-2xl max-h-[80vh] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <DocTypeIcon type={viewDoc.type} />
                  <h2 className="text-base font-semibold text-text truncate">{viewDoc.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {viewDoc.type === 'url' && (
                    <a
                      href={viewDoc.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-brand transition-colors"
                      title="Открыть URL"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewDoc(null)}
                    className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-text transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                  {viewDoc.content}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
