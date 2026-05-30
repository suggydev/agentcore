'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Clock,
  Loader2,
  AlertCircle,
  ChevronDown,
  Filter,
  X,
  User,
  Bot,
  Trash2,
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

interface Conversation {
  id: string;
  title: string;
  agentName: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
  status: 'active' | 'resolved' | 'pending';
}

const PAGE_SIZE = 15;

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'active' | 'resolved'>('all');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.conversations ?? [];
        setConversations(list.slice(0, PAGE_SIZE));
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchConversations();
  }, [fetchConversations]);

  const loadMore = async () => {
    setLoadingMore(true);
    await new Promise((r) => setTimeout(r, 600));
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/conversations?page=${page + 1}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.conversations ?? [];
        setConversations((prev) => [...prev, ...list]);
        setPage((p) => p + 1);
      }
    } catch {} finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  const filtered = useMemo(() => {
    let list = conversations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.agentName?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
      );
    }
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    switch (filter) {
      case 'today':
        list = list.filter((c) => now - new Date(c.updatedAt).getTime() < dayMs);
        break;
      case 'week':
        list = list.filter((c) => now - new Date(c.updatedAt).getTime() < weekMs);
        break;
      case 'active':
        list = list.filter((c) => c.status === 'active');
        break;
      case 'resolved':
        list = list.filter((c) => c.status === 'resolved');
        break;
    }
    return list;
  }, [conversations, search, filter]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'today' as const, label: 'Today' },
    { key: 'week' as const, label: 'This Week' },
    { key: 'active' as const, label: 'Active' },
    { key: 'resolved' as const, label: 'Resolved' },
  ];

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
          <motion.div variants={item}>
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Conversations</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">All Conversations</h1>
            <p className="text-ink-500 mt-1 text-sm">Track and manage agent conversations across all channels.</p>
          </motion.div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-6">
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search by title, agent, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-white rounded-xl border border-mauve-100 shadow-sm text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-ink-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-ink-400" />
                </button>
              )}
            </div>
          </motion.div>
          <motion.div variants={item} className="flex flex-wrap gap-2 mt-4">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  filter === f.key
                    ? 'bg-mauve-600 text-white shadow-sm'
                    : 'bg-white text-ink-600 border border-mauve-100 hover:border-mauve-300 hover:bg-mauve-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Conversations List */}
        <motion.div variants={container} initial="hidden" animate="show">
          {filtered.length === 0 ? (
            <motion.div
              variants={item}
              className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-mauve-100"
            >
              <div className="w-16 h-16 rounded-2xl bg-mauve-50 flex items-center justify-center mb-5 ring-1 ring-mauve-100/60">
                <MessageSquare className="w-7 h-7 text-mauve-400" />
              </div>
              <p className="text-ink-500 font-medium text-lg mb-1">
                {search || filter !== 'all' ? 'No conversations match your filters' : 'No conversations yet'}
              </p>
              <p className="text-ink-400 text-sm">
                {search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'Your agent conversations will appear here.'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((conv) => {
                const isExpanded = expandedId === conv.id;
                return (
                  <motion.div
                    key={conv.id}
                    variants={item}
                    className="bg-white rounded-2xl border border-mauve-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300"
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : conv.id)}
                      className="flex items-center gap-4 p-4 cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        conv.status === 'active'
                          ? 'bg-emerald-50'
                          : conv.status === 'resolved'
                          ? 'bg-mauve-50'
                          : 'bg-amber-50'
                      }`}>
                        <MessageSquare className={`w-5 h-5 ${
                          conv.status === 'active'
                            ? 'text-emerald-600'
                            : conv.status === 'resolved'
                            ? 'text-mauve-600'
                            : 'text-amber-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-0.5">
                          <h3 className="font-semibold text-ink-900 text-sm truncate">{conv.title || 'Untitled'}</h3>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex-shrink-0 ${
                            conv.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : conv.status === 'resolved'
                              ? 'bg-mauve-50 text-mauve-600 border-mauve-200'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            {conv.status}
                          </span>
                        </div>
                        <p className="text-sm text-ink-500 truncate">{conv.lastMessage || '—'}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-ink-700">{conv.agentName || 'Agent'}</p>
                          <p className="text-xs text-ink-400">{conv.messageCount ?? 0} messages</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-ink-400 w-16 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(conv.updatedAt)}</span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-ink-400 flex-shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-ink-50 pt-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-mauve-50 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-mauve-600" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-ink-700">{conv.agentName || 'Agent'}</p>
                                <p className="text-[10px] text-ink-400">Last active {formatTimeAgo(conv.updatedAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={`/chat?id=${conv.id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mauve-600 text-white text-xs font-semibold hover:bg-mauve-700 transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Open Chat
                              </a>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Load More */}
        {filtered.length >= PAGE_SIZE && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex justify-center"
          >
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-xl border border-mauve-200 bg-white text-ink-700 text-sm font-medium hover:bg-mauve-50 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </motion.div>
        )}

        <div className="h-8" />
      </div>
    </DashboardLayout>
  );
}
