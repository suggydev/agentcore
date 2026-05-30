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
  ChevronUp,
  HelpCircle,
  MessageCircle,
  Sparkles,
  FileSpreadsheet,
  FileType,
  Clock,
  BarChart3,
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

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
  pdf: { label: 'PDF', color: 'bg-red-50 text-red-600 border-red-200' },
  txt: { label: 'TXT', color: 'bg-gray-50 text-gray-600 border-gray-200' },
  md: { label: 'Markdown', color: 'bg-violet-50 text-violet-600 border-violet-200' },
  html: { label: 'HTML', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  url: { label: 'URL', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  notion: { label: 'Notion', color: 'bg-ink-50 text-ink-600 border-ink-200' },
  gdrive: { label: 'Drive', color: 'bg-sky-50 text-sky-600 border-sky-200' },
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
  const [showFAQ, setShowFAQ] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDocuments(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      try {
        await fetchDocuments();
      } catch {
        setError('Failed to load knowledge base.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/knowledge/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  };

  const handleUrlParse = async () => {
    if (!urlInput.trim()) return;
    setParsingUrl(true);
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
      }
    } catch {} finally {
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
      }
    } catch {}
  };

  const addFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqs((prev) => [
      { id: `faq-${Date.now()}`, question: newQuestion.trim(), answer: newAnswer.trim() },
      ...prev,
    ]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const removeFaq = (id: string) => setFaqs((prev) => prev.filter((f) => f.id !== id));

  const filteredDocs = documents.filter(
    (d) =>
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.type?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords = documents.reduce((sum, d) => sum + (d.wordCount || 0), 0);
  const lastUpdated = documents.length > 0
    ? new Date(Math.max(...documents.map((d) => new Date(d.createdAt).getTime()))).toLocaleDateString('en-US', {
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-ink-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm px-6 py-2.5">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Knowledge Base</p>
              <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Knowledge</h1>
              <p className="text-ink-500 mt-1 text-sm">Manage documents and FAQs that power your agents.</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mauve-600 text-white text-sm font-semibold hover:bg-mauve-700 transition-all duration-200 shadow-sm shadow-mauve-600/10"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Documents', value: documents.length, icon: FileText },
            { label: 'Total Words', value: totalWords.toLocaleString(), icon: BarChart3 },
            { label: 'Last Updated', value: lastUpdated, icon: Clock },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                <stat.icon className="w-5 h-5 text-mauve-600" />
              </div>
              <div>
                <p className="font-mono font-semibold text-xl text-ink-900">{stat.value}</p>
                <p className="text-xs text-ink-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Upload Area */}
        <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-mauve-500 bg-mauve-50/50'
                : 'border-mauve-200 bg-white hover:border-mauve-400 hover:bg-mauve-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              accept=".pdf,.txt,.md,.html,.csv,.json,.xml"
            />
            <div className="w-14 h-14 rounded-2xl bg-mauve-50 flex items-center justify-center mx-auto mb-4 ring-1 ring-mauve-100/60">
              <Upload className="w-6 h-6 text-mauve-500" />
            </div>
            <p className="text-ink-900 font-semibold mb-1">Drop files here or click to browse</p>
            <p className="text-ink-400 text-sm">PDF, TXT, Markdown, HTML, CSV, JSON — up to 10MB each</p>
          </div>

          {/* Source buttons */}
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <div className="flex items-center gap-3 bg-white rounded-xl border border-mauve-100 p-3">
              <Globe className="w-5 h-5 text-mauve-500 flex-shrink-0" />
              <input
                type="url"
                placeholder="Paste URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlParse()}
                className="flex-1 bg-transparent text-sm text-ink-900 placeholder-ink-400 outline-none"
              />
              <button
                onClick={handleUrlParse}
                disabled={!urlInput.trim() || parsingUrl}
                className="px-3 py-1.5 rounded-lg bg-mauve-600 text-white text-xs font-semibold hover:bg-mauve-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {parsingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Parse
              </button>
            </div>
            <button className="flex items-center gap-3 bg-white rounded-xl border border-mauve-100 p-3 text-sm text-ink-700 hover:border-mauve-300 hover:bg-mauve-50 transition-all duration-200">
              <BookOpen className="w-5 h-5 text-mauve-500" />
              Connect Notion
            </button>
            <button className="flex items-center gap-3 bg-white rounded-xl border border-mauve-100 p-3 text-sm text-ink-700 hover:border-mauve-300 hover:bg-mauve-50 transition-all duration-200">
              <HardDrive className="w-5 h-5 text-mauve-500" />
              Connect Google Drive
            </button>
          </div>
        </motion.div>

        {/* Search */}
        {documents.length > 0 && (
          <motion.div variants={item} initial="hidden" animate="show" className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-mauve-100 shadow-sm text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
              />
            </div>
          </motion.div>
        )}

        {/* Document List */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-10">
          <h2 className="font-display font-semibold text-lg text-ink-900 mb-4">Documents</h2>
          {filteredDocs.length === 0 ? (
            <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-mauve-100">
              <div className="w-16 h-16 rounded-2xl bg-mauve-50 flex items-center justify-center mb-4 ring-1 ring-mauve-100/60">
                <FileText className="w-7 h-7 text-mauve-400" />
              </div>
              <p className="text-ink-500 font-medium text-lg mb-1">
                {search ? 'No matching documents' : 'No documents yet'}
              </p>
              <p className="text-ink-400 text-sm mb-5">
                {search ? 'Try a different search term.' : 'Upload your first document to train your agents.'}
              </p>
              {!search && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mauve-600 text-white text-sm font-semibold hover:bg-mauve-700 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
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
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl border border-mauve-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 group"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mauve-400/0 via-mauve-400/30 to-mauve-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                        <Icon className="w-5 h-5 text-mauve-600" />
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600 transition-colors" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-ink-900 text-sm mb-2 line-clamp-2">{doc.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {doc.source && (
                        <span className="text-[10px] text-ink-400">{doc.source}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-ink-400">
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3" />
                        {(doc.wordCount || 0).toLocaleString()} words
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* FAQ Builder */}
        <motion.div variants={container} initial="hidden" animate="show" className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60">
                <HelpCircle className="w-5 h-5 text-mauve-600" />
              </div>
              <div className="text-left">
                <h2 className="font-display font-semibold text-lg text-ink-900">FAQ Builder</h2>
                <p className="text-sm text-ink-500">{faqs.length} question{faqs.length !== 1 ? 's' : ''} added</p>
              </div>
            </div>
            {showFAQ ? <ChevronUp className="w-5 h-5 text-ink-400" /> : <ChevronDown className="w-5 h-5 text-ink-400" />}
          </button>

          <AnimatePresence>
            {showFAQ && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t border-ink-100">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1.5">Question</label>
                      <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="e.g. What are your business hours?"
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 mb-1.5">Answer</label>
                      <input
                        type="text"
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="e.g. We are open 9 AM – 6 PM Mon–Fri."
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addFaq}
                    disabled={!newQuestion.trim() || !newAnswer.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mauve-600 text-white text-sm font-semibold hover:bg-mauve-700 transition-all duration-200 shadow-sm shadow-mauve-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add FAQ
                  </button>

                  {faqs.length > 0 && (
                    <div className="mt-6 divide-y divide-ink-100">
                      {faqs.map((faq, i) => (
                        <motion.div
                          key={faq.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-4 py-3 group"
                        >
                          <Sparkles className="w-4 h-4 text-mauve-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink-900">{faq.question}</p>
                            <p className="text-sm text-ink-500 mt-0.5">{faq.answer}</p>
                          </div>
                          <button
                            onClick={() => removeFaq(faq.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="h-8" />
      </div>
    </DashboardLayout>
  );
}
