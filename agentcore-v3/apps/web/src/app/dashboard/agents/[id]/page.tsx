'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Brain, Loader2, Trash2, Settings, Eye, EyeOff,
  Code, Cpu, Zap, Image as ImageIcon, Activity, Thermometer,
  Calendar, Building2, Check, X, Edit3, Save
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Agent {
  id: string; name: string; description: string | null; model: string;
  systemPrompt: string; temperature: number; isActive: boolean;
  createdAt: string; workspaceId: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTemperature, setEditTemperature] = useState(0.7);
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    loadAgent(t);
  }, [id]);

  const loadAgent = async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/${id}`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!res.ok) throw new Error('Agent not found');
      const data = await res.json();
      setAgent(data);
      setEditName(data.name);
      setEditDescription(data.description || '');
      setEditModel(data.model);
      setEditTemperature(data.temperature);
      setEditSystemPrompt(data.systemPrompt);
      setEditIsActive(data.isActive);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          model: editModel,
          temperature: editTemperature,
          systemPrompt: editSystemPrompt,
          isActive: editIsActive,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setAgent(updated);
      setEditing(false);
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE}/api/agents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push('/dashboard/agents');
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : err);
    }
  };

  const handleToggleActive = async () => {
    try {
      const newActive = !agent!.isActive;
      const res = await fetch(`${API_BASE}/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAgent(updated);
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : err);
    }
  };

  const getModelIcon = (model: string) => {
    if (model.includes('deepseek')) return <Code className="w-5 h-5" />;
    if (model.includes('flux')) return <ImageIcon className="w-5 h-5" />;
    if (model.includes('kimi')) return <Zap className="w-5 h-5" />;
    return <Cpu className="w-5 h-5" />;
  };

  if (loading) return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-mauve-500 animate-spin" />
      </div>
    </div>
  );

  if (error || !agent) return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="text-center py-16">
        <Brain className="w-12 h-12 text-mauve-300 mx-auto mb-4" />
        <p className="text-ink-500">{error || 'Агент не найден'}</p>
        <button onClick={() => router.push('/dashboard/agents')} className="btn-secondary text-sm mt-4">
          К списку агентов
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <button onClick={() => router.push('/dashboard/agents')} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> К списку агентов
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center flex-shrink-0">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                {editing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-xl font-display font-bold text-ink-900 bg-[#F8F9FB] border border-mauve-200 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-mauve-400/30"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-display font-bold text-ink-900">{agent.name}</h1>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                      agent.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-ink-100 text-ink-500 ring-1 ring-ink-200/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-ink-400'}`} />
                      {agent.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                )}
                {editing ? (
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={2}
                    className="mt-2 w-full text-sm text-ink-600 bg-[#F8F9FB] border border-mauve-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-mauve-400/30 resize-none"
                    placeholder="Описание агента..."
                  />
                ) : (
                  <p className="text-ink-400 text-sm mt-1">{agent.description || 'Нет описания'}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (editing) handleSave(); else { setEditing(true); setShowPrompt(true); } }}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-mauve-50 text-mauve-600 hover:bg-mauve-100 transition-colors disabled:opacity-50"
              >
                {editing ? (
                  saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />
                ) : (
                  <Edit3 className="w-4 h-4" />
                )}
                {editing ? 'Сохранить' : 'Редактировать'}
              </button>
              {editing && (
                <button onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-ink-50 text-ink-400 hover:text-ink-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mauve-500 to-mauve-300 flex items-center justify-center">
                {getModelIcon(agent.model)}
              </div>
              <p className="text-[11px] text-mauve-400 uppercase tracking-wider">Модель</p>
            </div>
            {editing ? (
              <input
                value={editModel}
                onChange={e => setEditModel(e.target.value)}
                className="text-sm font-bold text-ink-900 bg-[#F8F9FB] border border-mauve-200 rounded-lg px-2 py-1 w-full outline-none focus:ring-1 focus:ring-mauve-400/30"
              />
            ) : (
              <p className="text-sm font-mono font-medium text-ink-800 truncate">{agent.model.split('/').pop()}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-[11px] text-mauve-400 uppercase tracking-wider">Температура</p>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={editTemperature}
                  onChange={e => setEditTemperature(parseFloat(e.target.value))}
                  className="flex-1 accent-mauve-600"
                />
                <span className="text-sm font-bold text-ink-900 w-8">{editTemperature.toFixed(1)}</span>
              </div>
            ) : (
              <p className="text-sm font-mono font-bold text-ink-800">{agent.temperature}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-[11px] text-mauve-400 uppercase tracking-wider">Создан</p>
            </div>
            <p className="text-sm font-medium text-ink-800">
              {new Date(agent.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-mauve-400 uppercase tracking-wider">Статус</p>
            </div>
            {editing ? (
              <button
                onClick={() => setEditIsActive(!editIsActive)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${editIsActive ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}
              >
                {editIsActive ? 'Активен' : 'Неактивен'}
              </button>
            ) : (
              <button
                onClick={handleToggleActive}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${agent.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}
              >
                {agent.isActive ? 'Активен' : 'Неактивен'}
              </button>
            )}
          </div>
        </div>

        {/* System prompt */}
        <div className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-mauve-600" />
              <span className="font-semibold text-ink-900">Системный промпт</span>
            </div>
            {showPrompt ? <EyeOff className="w-4 h-4 text-ink-400" /> : <Eye className="w-4 h-4 text-ink-400" />}
          </button>
          {(showPrompt || editing) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 overflow-hidden">
              {editing ? (
                <textarea
                  value={editSystemPrompt}
                  onChange={e => setEditSystemPrompt(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl border border-mauve-200 bg-[#F8F9FB] focus:ring-2 focus:ring-mauve-400/30 focus:border-mauve-400 text-xs font-mono text-ink-700 outline-none resize-none"
                />
              ) : (
                <pre className="p-4 rounded-xl bg-ink-50 border border-ink-100 text-xs text-ink-600 whitespace-pre-wrap max-h-64 overflow-y-auto">{agent.systemPrompt}</pre>
              )}
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/dashboard/brain-map?agent=${agent.id}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mauve-50 text-mauve-700 text-sm font-medium hover:bg-mauve-100 transition-colors"
          >
            <Brain className="w-4 h-4" /> Brain Map
          </button>
          <button
            onClick={() => router.push(`/dashboard/brain-map/test?agent=${agent.id}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-50 text-ink-600 text-sm font-medium hover:bg-ink-100 transition-colors"
          >
            <Activity className="w-4 h-4" /> Тестировать
          </button>
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              agent.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {agent.isActive ? 'Деактивировать' : 'Активировать'}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" /> Удалить
          </button>
        </div>
      </motion.div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-ink-900 text-center mb-2">Удалить агента?</h3>
            <p className="text-sm text-ink-500 text-center mb-6">Это действие нельзя отменить. Агент «{agent.name}» будет удалён навсегда.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-mauve-200 text-ink-600 text-sm font-medium hover:bg-mauve-50 transition-colors">Отмена</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Удалить</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
