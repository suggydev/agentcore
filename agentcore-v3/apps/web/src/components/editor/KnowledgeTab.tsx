'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileText, Link, HelpCircle, Plus, Search, Trash2, Upload, Globe } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { Card } from '@/design/components/Card';
import { Skeleton } from '@/design/components/Skeleton';
import { t } from '@/design/i18n';
import { useToast } from '@/design/components/Toast';
import type { KnowledgeItem } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface KnowledgeTabProps {
  agentId: string;
  token: string;
}

const typeIcons: Record<KnowledgeItem['type'], typeof FileText> = {
  file: FileText,
  url: Globe,
  qa: HelpCircle,
};

const typeLabels: Record<KnowledgeItem['type'], string> = {
  file: t('knowledge.typeFile'),
  url: t('knowledge.typeUrl'),
  qa: t('knowledge.typeQa'),
};

export default function KnowledgeTab({ agentId, token }: KnowledgeTabProps) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { addToast } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge?agentId=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.items ?? []);
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setLoading(false);
  }, [agentId, token, addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('agentId', agentId);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        addToast({ variant: 'success', message: t('toast.success') });
        fetchItems();
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [agentId, token, addToast, fetchItems]);

  const handleParseUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    setParsing(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: urlInput.trim(), agentId }),
      });
      if (res.ok) {
        addToast({ variant: 'success', message: t('toast.success') });
        setUrlInput('');
        fetchItems();
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
    setParsing(false);
  }, [urlInput, agentId, token, addToast, fetchItems]);

  const handleAddQa = useCallback(async () => {
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId, type: 'qa', title: qaQuestion.trim(), content: qaAnswer.trim() }),
      });
      if (res.ok) {
        addToast({ variant: 'success', message: t('toast.success') });
        setQaQuestion('');
        setQaAnswer('');
        fetchItems();
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [qaQuestion, qaAnswer, agentId, token, addToast, fetchItems]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      addToast({ variant: 'error', message: t('toast.error') });
    }
  }, [token, addToast]);

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-5 flex flex-col gap-3">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold text-[var(--text)]">{t('knowledge.title')}</h2>
      </div>

      <Input
        placeholder={t('knowledge.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label={t('knowledge.search')}
      />

      <div
        className={`border-2 border-dashed rounded-[var(--radius-card)] p-8 text-center transition-colors ${dragOver ? 'border-[var(--brand)] bg-[var(--accent-soft)]' : 'border-[var(--border)]'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        aria-label={t('knowledge.dragDrop')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('knowledge-file-input')?.click(); } }}
      >
        <Upload size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
        <p className="text-[14px] text-[var(--text-muted)]">{t('knowledge.dragDrop')}</p>
        <p className="text-[12px] text-[var(--text-muted)] mt-1">{t('knowledge.uploadHint')}</p>
        <input
          id="knowledge-file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          aria-label={t('knowledge.upload')}
        />
      </div>

      <div className="flex items-end gap-2">
        <Input
          placeholder={t('knowledge.parseUrl')}
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          aria-label={t('knowledge.parseUrl')}
          className="flex-1"
        />
        <Button variant="secondary" size="md" onClick={handleParseUrl} loading={parsing} aria-label={t('knowledge.parseBtn')}>
          <Link size={14} />
          {t('knowledge.parseBtn')}
        </Button>
      </div>

      <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-card)]">
        <h3 className="text-[14px] font-medium text-[var(--text)] mb-3">{t('knowledge.qaPairs')}</h3>
        <div className="flex flex-col gap-2">
          <Input
            placeholder={t('knowledge.question')}
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
            aria-label={t('knowledge.question')}
          />
          <Input
            placeholder={t('knowledge.answer')}
            value={qaAnswer}
            onChange={(e) => setQaAnswer(e.target.value)}
            aria-label={t('knowledge.answer')}
          />
          <Button variant="secondary" size="sm" onClick={handleAddQa} aria-label={t('knowledge.addQa')}>
            <Plus size={14} />
            {t('knowledge.addQa')}
          </Button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-[14px] text-[var(--text-muted)] text-center py-8">{t('knowledge.noItems')}</p>
      )}

      {filtered.map((item) => {
        const Icon = typeIcons[item.type];
        return (
          <Card key={item.id} className="flex items-center gap-3">
            <Icon size={18} className="text-[var(--brand)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[var(--text)] truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[var(--text-muted)]">{typeLabels[item.type]}</span>
                {item.size != null && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {(item.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <span className="text-[11px] text-[var(--text-muted)]">
                  {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          </Card>
        );
      })}
    </div>
  );
}
