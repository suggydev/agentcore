'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Loader2,
  Phone,
  Mail,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Save,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface ContactsResponse {
  data: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export default function CustomersPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadContacts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/crm`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json: ContactsResponse = await res.json();
        setContacts(Array.isArray(json.data) ? json.data : []);
      } else {
        setError('Не удалось загрузить контакты');
      }
    } catch (err) {
      console.error('[CustomersPage]', err);
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadContacts();
  }, [token, loadContacts]);

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '' });
    setShowAddForm(false);
    setEditingId(null);
    setError('');
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSave = async () => {
    if (!token) return;
    if (!form.name.trim()) {
      setError('Введите имя');
      return;
    }
    setSaving(true);
    setError('');

    const isEditing = editingId !== null;
    const url = isEditing ? `${API_BASE}/api/crm/${editingId}` : `${API_BASE}/api/crm`;
    const method = isEditing ? 'PATCH' : 'POST';

    // Optimistic update
    const optimisticContact: Contact = {
      id: editingId || `temp-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      createdAt: new Date().toISOString(),
    };

    if (!isEditing) {
      setContacts((prev) => [optimisticContact, ...prev]);
    } else {
      setContacts((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...optimisticContact } : c))
      );
    }
    resetForm();

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || 'Ошибка сохранения');
        showToast('error', data.error || data.message || 'Ошибка сохранения');
        // Revert optimistic
        await loadContacts();
      } else {
        const saved = await res.json();
        if (!isEditing) {
          setContacts((prev) =>
            prev.map((c) => (c.id === optimisticContact.id ? saved : c))
          );
        }
        showToast('success', isEditing ? 'Контакт обновлен' : 'Контакт создан');
      }
    } catch (err) {
      console.error('[CustomersPage] save:', err);
      setError('Ошибка соединения');
      await loadContacts();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeleteId(null);
    try {
      const res = await fetch(`${API_BASE}/api/crm/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        await loadContacts();
        showToast('error', 'Не удалось удалить контакт');
      } else {
        showToast('success', 'Контакт удален');
      }
    } catch (err) {
      console.error('[CustomersPage] delete:', err);
      await loadContacts();
      showToast('error', 'Ошибка удаления контакта');
    }
  };

  const startEdit = (contact: Contact) => {
    setForm({ name: contact.name, email: contact.email, phone: contact.phone });
    setEditingId(contact.id);
    setShowAddForm(true);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]" role="status">
        <Loader2 className="w-8 h-8 text-brand animate-spin" aria-hidden="true" />
        <span className="sr-only">Загрузка CRM...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto" data-testid="crm-contacts">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-success-soft border-success-soft text-success'
                : 'bg-danger-soft border-danger-soft text-danger'
            }`}
            data-testid="toast-success"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
        <motion.div variants={item}>
          <p className="text-[11px] font-semibold uppercase tracking-label text-brand mb-2">CRM</p>
          <h1 className="font-display font-bold text-3xl text-text tracking-tight">Клиенты</h1>
          <p className="text-text-muted mt-1 text-sm">Управление контактами и клиентской базой.</p>
        </motion.div>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={item} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск контактов..."
            data-testid="search-contacts"
            className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-all duration-200"
          />
        </div>
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            if (showAddForm) resetForm();
          }}
          data-testid="add-contact"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Отменить' : 'Добавить контакт'}
        </button>
      </motion.div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-text mb-4">
                {editingId ? 'Редактировать контакт' : 'Новый контакт'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Имя</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Имя контакта"
                    data-testid="contact-name"
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    data-testid="contact-email"
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+7 ..."
                    data-testid="contact-phone"
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-all duration-200"
                  />
                </div>
              </div>
              {error && <p className="text-xs text-danger mb-3">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  data-testid="save-contact"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent transition-all duration-200 shadow-sm disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-sm font-semibold hover:bg-surface transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                >
                  <X className="w-4 h-4" />
                  Отмена
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contacts List */}
      <motion.div variants={container} initial="hidden" animate="show">
        {filteredContacts.length === 0 ? (
          <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4 ring-1 ring-border/60">
              <Users className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-text-muted font-medium mb-1">
              {search ? 'Ничего не найдено' : 'Нет контактов'}
            </p>
            <p className="text-text-muted text-sm max-w-xs">
              {search
                ? 'Попробуйте изменить запрос поиска'
                : 'Добавьте первый контакт, чтобы начать работу с CRM'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                variants={item}
                data-testid="contact-item"
                className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0 ring-1 ring-border/60">
                    <span className="text-sm font-semibold text-brand">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{contact.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{contact.email || '—'}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{contact.phone || '—'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <button
                    onClick={() => startEdit(contact)}
                    data-testid="contact-edit"
                    className="p-2 rounded-lg hover:bg-accent-soft text-text-muted hover:text-brand transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                    aria-label="Редактировать"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(contact.id)}
                    data-testid="contact-delete"
                    className="p-2 rounded-lg hover:bg-danger-soft text-text-muted hover:text-danger transition-all focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-1"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-text/20 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div
              className="relative w-full max-w-sm bg-surface rounded-card shadow-lg p-6"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <h3 className="text-lg font-semibold text-text mb-2">Удалить контакт?</h3>
              <p className="text-sm text-text-muted mb-6">
                Это действие нельзя отменить. Контакт будет удалён навсегда.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text hover:bg-surface transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  data-testid="confirm-delete"
                  className="px-4 py-2 rounded-xl bg-danger text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-8" />
    </div>
  );
}
