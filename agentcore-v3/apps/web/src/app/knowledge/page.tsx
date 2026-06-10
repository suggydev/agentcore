'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Upload,
 FileText,
 Globe,
 BookOpen,
 HardDrive,
 Trash2,
 Plus,
 Search,
 Loader2,
 AlertCircle,
 ChevronDown,
 HelpCircle,
 Sparkles,
 FileSpreadsheet,
 FileType,
 Clock,
 BarChart3,
 X,
 MessageSquare,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Document {
 id: string;
 title: string;
 type: 'pdf' | 'txt' | 'md' | 'html' | 'url' | 'notion' | 'gdrive';
 wordCount: number;
 createdAt: string;
 source?: string;
}

interface FAQ {
 id: string;
 question: string;
 answer: string;
}

const typeBadge: Record<string, { label: string; color: string }> = {
  pdf: { label: 'PDF', color: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-soft)]' },
  txt: { label: 'TXT', color: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]' },
  md: { label: 'Markdown', color: 'bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--brand-soft)]' },
  html: { label: 'HTML', color: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-soft)]' },
  url: { label: 'URL', color: 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand-soft)]' },
  notion: { label: 'Notion', color: 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]' },
  gdrive: { label: 'Drive', color: 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand-soft)]' },
};

const typeIcon: Record<string, React.ElementType> = {
 pdf: FileText,
 txt: FileType,
 md: FileText,
 html: Globe,
 url: Globe,
 notion: BookOpen,
 gdrive: HardDrive,
};

export default function KnowledgePage() {
 const [documents, setDocuments] = useState<Document[]>([]);
 const [faqs, setFaqs] = useState<FAQ[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [search, setSearch] = useState('');
 const [urlInput, setUrlInput] = useState('');
 const [parsingUrl, setParsingUrl] = useState(false);
 const [urlError, setUrlError] = useState('');
 const [showFAQ, setShowFAQ] = useState(false);
 const [newQuestion, setNewQuestion] = useState('');
 const [newAnswer, setNewAnswer] = useState('');
 const [dragOver, setDragOver] = useState(false);
 const [faqSaving, setFaqSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; icon: 'notion' | 'drive' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

 const fetchDocuments = useCallback(async () => {
 const token = localStorage.getItem('token');
 if (!token) return;
 try {
  const res = await fetch(`${API_BASE}/api/knowledge/`, {
  headers: { Authorization: `Bearer ${token}` },
  });
 if (res.ok) {
 const data = await res.json();
 setDocuments(Array.isArray(data) ? data : (data.data || []));
 }
 } catch (err) { console.error('Failed to fetch documents:', err); setError('Не удалось загрузить документы. Проверьте подключение к серверу.'); }
 }, []);

 useEffect(() => {
 const token = localStorage.getItem('token');
 if (!token) { window.location.href = '/login'; return; }
 const load = async () => {
 try {
 await fetchDocuments();
 try {
 const faqRes = await fetch(`${API_BASE}/api/knowledge/faq`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 if (faqRes.ok) {
 const data = await faqRes.json();
 setFaqs(Array.isArray(data) ? data : (data.data || []));
 }
  } catch (err) { console.error('[KnowledgePage] FAQ fetch:', err); setError('Не удалось загрузить FAQ. Проверьте подключение к серверу.'); }
 } catch (err) {
 console.error('Failed to load knowledge base:', err);
 setError('Не удалось загрузить базу знаний');
 } finally {
 setLoading(false);
 }
 };
 load();
 }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
  const token = localStorage.getItem('token');
  if (!token) return;
   const previous = documents;
   setDocuments((prev) => prev.filter((d) => d.id !== id));
   try {
   const res = await fetch(`${API_BASE}/api/knowledge/documents/${id}`, {
   method: 'DELETE',
   headers: { Authorization: `Bearer ${token}` },
   });
   if (!res.ok) {
    console.error('[KnowledgePage] Delete failed:', res.status);
    setDocuments(previous);
    setError('Не удалось удалить документ. Попробуйте снова.');
   }
   } catch (err) { console.error('[KnowledgePage]', err); setDocuments(previous); setError('Не удалось удалить документ. Попробуйте снова.'); }
  };

 const handleUrlParse = async () => {
 if (!urlInput.trim()) return;
 setParsingUrl(true);
 setUrlError('');
 const token = localStorage.getItem('token');
 if (!token) return;
 try {
 const res = await fetch(`${API_BASE}/api/knowledge/documents`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ url: urlInput.trim(), type: 'url' }),
 });
 if (res.ok) {
 const doc = await res.json();
 setDocuments((prev) => [doc, ...prev]);
 setUrlInput('');
 } else {
 const errData = await res.json().catch(() => ({}));
 setUrlError(errData.message || 'Не удалось разобрать URL');
 }
 } catch (err) {
 console.error('Failed to parse URL:', err);
 setUrlError('Не удалось разобрать URL. Проверьте подключение.');
 } finally {
 setParsingUrl(false);
 }
 };

 const handleFileUpload = async (files: FileList | null) => {
 if (!files) return;
 const token = localStorage.getItem('token');
 if (!token) return;
 const formData = new FormData();
 Array.from(files).forEach((f) => formData.append('files', f));
 try {
 const res = await fetch(`${API_BASE}/api/knowledge/documents`, {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` },
 body: formData,
 });
   if (res.ok) {
   const data = await res.json();
   const newDocs = Array.isArray(data) ? data : data.documents ?? [data];
   setDocuments((prev) => [...newDocs, ...prev]);
   setToast({ message: 'Файлы загружены успешно', icon: 'notion' });
   setTimeout(() => setToast(null), 3000);
   } else {
   console.error('[KnowledgePage] Upload failed:', res.status);
   }
   } catch (err) { console.error('[KnowledgePage]', err); }
 };

  const addFaq = async () => {
  if (!newQuestion.trim() || !newAnswer.trim()) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  const newFaq = { id: `faq-${crypto.randomUUID()}`, question: newQuestion.trim(), answer: newAnswer.trim() };
  setFaqSaving(true);
  try {
  const res = await fetch(`${API_BASE}/api/knowledge/faq`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(newFaq),
  });
  if (res.ok) {
  const saved = await res.json();
  setFaqs((prev) => [saved, ...prev]);
  } else {
  console.error('[KnowledgePage] addFaq failed:', res.status);
  setFaqs((prev) => [newFaq, ...prev]);
  }
  } catch (err) {
  console.error('[KnowledgePage]', err);
  setFaqs((prev) => [newFaq, ...prev]);
  } finally {
 setFaqSaving(false);
 setNewQuestion('');
 setNewAnswer('');
 }
 };

  const removeFaq = async (id: string) => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
  const res = await fetch(`${API_BASE}/api/knowledge/faq/${id}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { console.error('[KnowledgePage] removeFaq failed:', res.status); }
  } catch (err) { console.error('[KnowledgePage]', err); setError('Не удалось удалить FAQ. Попробуйте снова.'); }
 setFaqs((prev) => prev.filter((f) => f.id !== id));
 };

 const showComingSoon = (service: 'notion' | 'drive') => {
 setToast({ message: `${service === 'notion' ? 'Notion' : 'Google Drive'} — интеграция в разработке`, icon: service });
 setTimeout(() => setToast(null), 3500);
 };

 const filteredDocs = documents.filter(
 (d) =>
 d.title?.toLowerCase().includes(search.toLowerCase()) ||
 d.type?.toLowerCase().includes(search.toLowerCase())
 );

 const totalWords = documents.reduce((sum, d) => sum + (d.wordCount || 0), 0);
 const lastUpdated = documents.length > 0
 ? new Date(Math.max(...documents.map((d) => new Date(d.createdAt).getTime()))).toLocaleDateString('ru-RU', {
 month: 'short', day: 'numeric', year: 'numeric',
 })
 : '—';

 const container = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
 };
 const item = {
 hidden: { opacity: 0, y: 16 },
 show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[80vh]" role="status" aria-label="Загрузка">
 <Loader2 className="w-8 h-8 text-[var(--brand)] animate-spin" aria-hidden="true" />
 <span className="sr-only">Загрузка базы знаний...</span>
 </div>
 );
 }

 if (error) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
 <AlertCircle className="w-10 h-10 text-[var(--danger)]" />
 <p className="text-[var(--text-muted)]">{error}</p>
 <button onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-2.5">Повторить</button>
 </div>
 );
 }

 return (
 <>
  <div className="p-6 lg:p-10 max-w-7xl mx-auto" data-testid="knowledge-page">
 <AnimatePresence>
 {toast && (
  <motion.div
  initial={{ opacity: 0, y: -20, scale: 0.96 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -10, scale: 0.96 }}
  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
  className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface border border-[var(--border)] shadow-lg"
  data-testid="upload-success"
  >
 <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
 {toast.icon === 'notion' ? <BookOpen className="w-4 h-4 text-[var(--brand)]" /> : <HardDrive className="w-4 h-4 text-[var(--brand)]" />}
 </div>
 <p className="text-sm font-medium text-[var(--text)]">{toast.message}</p>
 <button onClick={() => setToast(null)} className="ml-2 p-1 rounded-lg hover:bg-[var(--accent-soft)] transition-colors">
 <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
 <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">База знаний</p>
 <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Знания</h1>
 <p className="text-[var(--text-muted)] mt-1 text-sm">Управление документами и FAQ</p>
 </div>
  <button
  onClick={() => fileInputRef.current?.click()}
  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
  aria-label="Загрузить документ"
  data-testid="upload-button"
  >
 <Plus className="w-4 h-4" />
 Добавить документ
 </button>
 </motion.div>
 </motion.div>

 <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-3 gap-4 mb-8">
 {([
 { label: 'Всего документов', value: documents.length, icon: FileText },
 { label: 'Всего слов', value: totalWords.toLocaleString(), icon: BarChart3 },
 { label: 'Обновлено', value: lastUpdated, icon: Clock },
 ] as { label: string; value: string | number; icon: React.ElementType }[]).map((stat) => (
 <motion.div
 key={stat.label}
 variants={item}
 className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center gap-4"
 >
 <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
 <stat.icon className="w-5 h-5 text-[var(--brand)]" />
 </div>
 <div>
 <p className="font-mono font-semibold text-xl text-[var(--text)]">{stat.value}</p>
 <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
 </div>
 </motion.div>
 ))}
 </motion.div>

 <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
  <div
  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
  onDragLeave={() => setDragOver(false)}
  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
  onClick={() => fileInputRef.current?.click()}
  className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer group/upload ${
  dragOver
  ? 'border-[var(--brand)] bg-[var(--accent-soft)] scale-[1.01] shadow-lg '
  : 'border-[var(--border)] bg-surface hover:border-[var(--brand)]/40 hover:bg-[var(--accent-soft)]/30'
  } transition-all duration-300 ease-out`}
  role="button"
  aria-label="Зона загрузки файлов"
  data-testid="knowledge-dropzone"
  >
  <input
  ref={fileInputRef}
  type="file"
  multiple
  className="hidden"
  onChange={(e) => handleFileUpload(e.target.files)}
  accept=".pdf,.txt,.md,.html,.csv,.json,.xml"
  data-testid="file-input"
  />
 <div className={`transition-all duration-300 ${dragOver ? 'opacity-0 scale-95' : 'opacity-100'}`}>
 <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-4 ring-1 ring-[var(--border)]/60 group-hover/upload:scale-105 transition-transform duration-300">
 <Upload className="w-6 h-6 text-[var(--brand)] group-hover/upload:text-[var(--brand)] transition-colors" />
 </div>
 <p className="text-[var(--text)] font-semibold mb-1">
 {dragOver ? 'Отпустите файлы для загрузки' : 'Перетащите файлы или нажмите'}
 </p>
 <p className="text-[var(--text-muted)] text-sm">PDF, TXT, Markdown, HTML, CSV, JSON — до 10 МБ</p>
 </div>
 </div>

 <div className="grid sm:grid-cols-3 gap-3 mt-4">
 <div className="flex flex-col">
 <div className={`flex items-center gap-3 bg-surface rounded-xl border p-3 ${urlError ? 'border-red-300' : 'border-[var(--border)]'}`}>
 <Globe className="w-5 h-5 text-[var(--brand)] flex-shrink-0" />
  <input
  type="url"
  placeholder="Вставьте URL..."
  value={urlInput}
  onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
  onKeyDown={(e) => e.key === 'Enter' && handleUrlParse()}
  aria-label="URL для парсинга"
  data-testid="url-input"
  className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 rounded"
  />
  <button
  onClick={handleUrlParse}
  disabled={!urlInput.trim() || parsingUrl}
  data-testid="parse-url-button"
  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
  >
 {parsingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
 Разобрать
 </button>
 </div>
  {parsingUrl && <p className="mt-1 text-[11px] text-[var(--brand)]" data-testid="parse-loading">Парсинг...</p>}
  {urlError && <p className="mt-1 text-[11px] text-danger">{urlError}</p>}
 </div>
 <button
 onClick={() => showComingSoon('notion')}
 className="flex items-center gap-3 bg-surface rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--text)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)] transition-all duration-200 group/btn"
 >
 <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60 group-hover/btn:scale-105 transition-transform duration-200">
 <BookOpen className="w-4 h-4 text-[var(--brand)]" />
 </div>
 <div className="text-left">
 <span className="font-medium">Подключить Notion</span>
 <span className="block text-xs text-[var(--text-muted)] mt-0.5">Бета-интеграция</span>
 </div>
 </button>
 <button
 onClick={() => showComingSoon('drive')}
 className="flex items-center gap-3 bg-surface rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--text)] hover:border-[var(--brand)]/30 hover:bg-[var(--accent-soft)] transition-all duration-200 group/btn"
 >
 <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60 group-hover/btn:scale-105 transition-transform duration-200">
 <HardDrive className="w-4 h-4 text-[var(--brand)]" />
 </div>
 <div className="text-left">
 <span className="font-medium">Подключить Google Drive</span>
 <span className="block text-xs text-[var(--text-muted)] mt-0.5">Бета-интеграция</span>
 </div>
 </button>
 </div>
 </motion.div>

 {documents.length > 0 && (
 <motion.div variants={item} initial="hidden" animate="show" className="mb-6">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
  <input
  type="text"
  placeholder="Поиск документов..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  aria-label="Поиск документов"
  data-testid="search-knowledge"
  className="w-full pl-11 pr-4 py-2.5 bg-surface rounded-xl border border-[var(--border)] shadow-sm text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 transition-all duration-200"
  />
 </div>
 </motion.div>
 )}

 <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
 <h2 className="font-display font-semibold text-lg text-[var(--text)] mb-4">Документы</h2>
 {filteredDocs.length === 0 ? (
 <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-2xl border border-[var(--border)]">
 <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-4 ring-1 ring-[var(--border)]/60">
 <FileText className="w-7 h-7 text-[var(--text-muted)]" />
 </div>
 <p className="text-[var(--text-muted)] font-medium text-lg mb-1">
 {search ? 'Нет подходящих документов' : 'Пока нет документов'}
 </p>
 <p className="text-[var(--text-muted)] text-sm mb-5">
 {search ? 'Попробуйте другой запрос' : 'Загрузите первый документ'}
 </p>
 {!search && (
 <button
 onClick={() => fileInputRef.current?.click()}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all"
 >
 <Upload className="w-4 h-4" />
 Загрузить
 </button>
 )}
 </motion.div>
 ) : (
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredDocs.map((doc) => {
 const Icon = typeIcon[doc.type] || FileText;
 const badge = typeBadge[doc.type] || typeBadge.txt;
 return (
 <motion.div
 key={doc.id}
 variants={item}
 whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
 className="relative bg-surface rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-lg hover:border-[var(--border)] transition-all duration-300 p-5 group overflow-hidden"
 >
 <div className="flex items-start justify-between mb-3">
 <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60 group-hover:ring-[var(--brand)]/20 group-hover:scale-105 transition-all duration-300">
 <Icon className="w-5 h-5 text-[var(--brand)]" />
 </div>
   <motion.button
   onClick={() => setConfirmDelete(doc.id)}
   whileHover={{ scale: 1.15 }}
   whileTap={{ scale: 0.9 }}
   data-testid="delete-document"
   className="p-1.5 rounded-lg hover:bg-danger-soft transition-all duration-200 opacity-0 group-hover:opacity-100"
   aria-label={`Удалить документ ${doc.title}`}
   >
 <Trash2 className="w-4 h-4 text-[var(--danger)] hover:text-danger transition-colors" />
 </motion.button>
 </div>
 <h3 className="font-semibold text-[var(--text)] text-sm mb-2 line-clamp-2 group-hover:text-[var(--text)] transition-colors">{doc.title}</h3>
 <div className="flex items-center gap-2 mb-3">
 <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}>
 {badge.label}
 </span>
 {doc.source && (
 <span className="text-[10px] text-[var(--text-muted)]">{doc.source}</span>
 )}
 </div>
 <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
 <span className="flex items-center gap-1">
 <FileSpreadsheet className="w-3 h-3" />
 {(doc.wordCount || 0).toLocaleString()} слов
 </span>
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {new Date(doc.createdAt).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
 </span>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}
 </motion.div>

 <motion.div variants={container} initial="hidden" animate="show" className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
 <button
 onClick={() => setShowFAQ(!showFAQ)}
 className="flex items-center justify-between w-full group/faq-header"
 aria-expanded={showFAQ}
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60 group-hover/faq-header:ring-[var(--brand)]/20 group-hover/faq-header:scale-105 transition-all duration-300">
 <HelpCircle className="w-5 h-5 text-[var(--brand)]" />
 </div>
 <div className="text-left">
 <h2 className="font-display font-semibold text-lg text-[var(--text)]">Редактор FAQ</h2>
 <p className="text-sm text-[var(--text-muted)]">{faqs.length} вопросов добавлено</p>
 </div>
 </div>
 <motion.div
 animate={{ rotate: showFAQ ? 180 : 0 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center group-hover/faq-header:bg-[var(--accent-soft)] transition-colors"
 >
 <ChevronDown className="w-4 h-4 text-[var(--brand)]" />
 </motion.div>
 </button>

 <AnimatePresence mode="wait">
 {showFAQ && (
 <motion.div
 key="faq-content"
 initial={{ height: 0, opacity: 0, marginTop: 0 }}
 animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
 exit={{ height: 0, opacity: 0, marginTop: 0 }}
 transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
 className="overflow-hidden"
 >
 <div className="pt-6 border-t border-[var(--border)]">
 <div className="grid sm:grid-cols-2 gap-4 mb-4">
 <div>
 <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Вопрос</label>
  <input
  type="text"
  value={newQuestion}
  onChange={(e) => setNewQuestion(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && addFaq()}
  placeholder="например: Какой у вас график работы?"
  data-testid="faq-question"
  className="w-full px-3 py-2.5 bg-surface rounded-xl border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all duration-200 hover:border-[var(--brand)]/30"
  />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Ответ</label>
  <input
  type="text"
  value={newAnswer}
  onChange={(e) => setNewAnswer(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && addFaq()}
  placeholder="например: Мы работаем 9:00 – 18:00 Пн–Пт."
  data-testid="faq-answer"
  className="w-full px-3 py-2.5 bg-surface rounded-xl border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-all duration-200 hover:border-[var(--brand)]/30"
  />
 </div>
 </div>
 <div className="flex items-center gap-3">
  <motion.button
  onClick={addFaq}
  disabled={!newQuestion.trim() || !newAnswer.trim() || faqSaving}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  data-testid="add-faq-button"
  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
  >
 {faqSaving ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Plus className="w-4 h-4" />
 )}
 {faqSaving ? 'Добавление...' : 'Добавить FAQ'}
 </motion.button>
 </div>

 {faqs.length === 0 ? (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="mt-8 mb-2 flex flex-col items-center justify-center py-10 text-center"
 >
 <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)]/50 flex items-center justify-center mb-4 ring-1 ring-[var(--border)]/40">
 <MessageSquare className="w-6 h-6 text-[var(--text-muted)]" />
 </div>
 <p className="text-[var(--text-muted)] font-medium text-base mb-1">Нет вопросов FAQ</p>
 <p className="text-[var(--text-muted)] text-sm max-w-xs">
 Добавьте часто задаваемые вопросы и ответы, чтобы агент мог быстро отвечать клиентам
 </p>
 </motion.div>
 ) : (
 <div className="mt-6 divide-y divide-[var(--border)]">
 <AnimatePresence>
 {faqs.map((faq) => (
  <motion.div
  key={faq.id}
  initial={{ opacity: 0, x: -12 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
  className="flex items-start gap-4 py-3 group/faq"
  data-testid="faq-item"
  >
 <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center mt-0.5 flex-shrink-0 ring-1 ring-[var(--border)]/60">
 <Sparkles className="w-3.5 h-3.5 text-[var(--text-muted)]" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-[var(--text)]">{faq.question}</p>
 <p className="text-sm text-[var(--text-muted)] mt-0.5">{faq.answer}</p>
 </div>
 <motion.button
 onClick={() => removeFaq(faq.id)}
 whileHover={{ scale: 1.15 }}
 whileTap={{ scale: 0.9 }}
 className="p-1.5 rounded-lg hover:bg-danger-soft transition-all duration-200 opacity-0 group-hover/faq:opacity-100"
 aria-label={`Удалить FAQ: ${faq.question}`}
 >
 <Trash2 className="w-3.5 h-3.5 text-[var(--danger)] hover:text-danger transition-colors" />
 </motion.button>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>

  <div className="h-8" />
  </div>

  {confirmDelete && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="confirm-delete">
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Удалить документ?</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Это действие нельзя отменить.</p>
        <div className="flex items-center gap-3 justify-end">
          <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--accent-soft)] transition-colors">
            Отмена
          </button>
          <button onClick={() => { handleDelete(confirmDelete); setConfirmDelete(null); }} className="px-4 py-2 rounded-lg text-sm bg-[var(--danger)] text-white hover:bg-[var(--danger)] transition-colors">
            Удалить
          </button>
        </div>
      </div>
    </div>
  )}
  </>
  );
}
