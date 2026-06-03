'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Settings, Loader2 } from 'lucide-react';
import { Tabs } from '@/design/components/Tabs';
import { Button } from '@/design/components/Button';
import { StatusBadge } from '@/design/components/StatusBadge';
import { Skeleton } from '@/design/components/Skeleton';
import { Modal } from '@/design/components/Modal';
import { useToast } from '@/design/components/Toast';
import { t } from '@/design/i18n';
import { useAgentStore } from '@/store/agentStore';
import EditorLayout from '@/components/editor/EditorLayout';
import PromptTab from '@/components/editor/PromptTab';
import KnowledgeTab from '@/components/editor/KnowledgeTab';
import ChannelsTab from '@/components/editor/ChannelsTab';
import DialogsTab from '@/components/editor/DialogsTab';
import MetricsTab from '@/components/editor/MetricsTab';
import ChatPreview from '@/components/editor/ChatPreview';
import AgentEmojiPicker from '@/components/editor/AgentEmojiPicker';
import type { AgentData, ModelOption } from '@/components/editor/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const PROMPT_DEBOUNCE = 500;

const EDITOR_TABS = [
  { id: 'prompt', label: t('editor.tabs.prompt') },
  { id: 'knowledge', label: t('editor.tabs.knowledge') },
  { id: 'channels', label: t('editor.tabs.channels') },
  { id: 'dialogs', label: t('editor.tabs.dialogs') },
  { id: 'metrics', label: t('editor.tabs.metrics') },
];

export default function AgentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addToast } = useToast();
  const auth = useAgentStore((s) => s.auth);

  const [agent, setAgent] = useState<AgentData | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prompt');
  const [livePrompt, setLivePrompt] = useState('');
  const [brainMapOpen, setBrainMapOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [token, setToken] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tk = localStorage.getItem('token') || auth.token;
    if (!tk) { router.push('/login'); return; }
    setToken(tk);
  }, [auth.token, router]);

  const handleAuthError = useCallback((status: number) => {
    if (status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      return true;
    }
    return false;
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/agents/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) {
          if (handleAuthError(r.status)) return;
          addToast({ variant: 'error', message: `Ошибка ${r.status}: не удалось загрузить агента` });
          return;
        }
        const d = await r.json();
        const raw = d as unknown as Record<string, unknown>;
        const agentData: AgentData = {
          ...d,
          emoji: (raw.emoji as string) || '🤖',
          maxTokens: (raw.maxTokens as number) || 2000,
        };
        setAgent(agentData);
        setLivePrompt(agentData.systemPrompt);
      })
      .catch((err) => {
        console.error('[AgentEditorPage] load agent:', err);
        addToast({ variant: 'error', message: err instanceof Error ? err.message : 'Не удалось загрузить агента' });
      })
      .finally(() => setLoading(false));
  }, [id, token, addToast, handleAuthError]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/v1/models`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data || []) as ModelOption[];
        if (list.length === 0) {
          setModels([
            { id: 'glm-5p1', name: 'glm-5p1' },
            { id: 'deepseek-v4-pro', name: 'deepseek-v4-pro' },
          ]);
        } else {
          setModels(list.map((m: ModelOption) => ({ id: m.id, name: m.name || m.id.split('/').pop() || m.id })));
        }
      })
      .catch(() => {
        setModels([
          { id: 'glm-5p1', name: 'glm-5p1' },
          { id: 'deepseek-v4-pro', name: 'deepseek-v4-pro' },
        ]);
      });
  }, [token]);

  const handleUpdate = useCallback(async (updates: Partial<AgentData>) => {
    if (!agent || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        const raw = updated as unknown as Record<string, unknown>;
        const agentData: AgentData = {
          ...updated,
          emoji: (raw.emoji as string) || agent.emoji,
          maxTokens: (raw.maxTokens as number) || agent.maxTokens,
        };
        setAgent(agentData);
        if (updates.systemPrompt !== undefined) {
          setLivePrompt(updates.systemPrompt);
        }
      } else {
        if (handleAuthError(res.status)) return;
        const errData = await res.json().catch(() => ({}));
        addToast({ variant: 'error', message: errData.error || `Ошибка ${res.status}: не удалось сохранить изменения` });
      }
    } catch (err) {
      console.error('[AgentEditorPage] update:', err);
      addToast({ variant: 'error', message: err instanceof Error ? err.message : 'Не удалось сохранить изменения' });
    }
  }, [agent, id, token, addToast, handleAuthError]);

  const handlePromptLiveUpdate = useCallback((prompt: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLivePrompt(prompt);
      addToast({ variant: 'info', message: t('editor.promptUpdated') });
    }, PROMPT_DEBOUNCE);
  }, [addToast]);

  const handleEmojiChange = useCallback((emoji: string) => {
    if (!agent) return;
    handleUpdate({ emoji });
  }, [agent, handleUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[var(--brand)] animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[var(--text-muted)]">Агент не найден</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'prompt':
        return <PromptTab agent={agent} onUpdate={handleUpdate} models={models} onBrainMap={() => setBrainMapOpen(true)} />;
      case 'knowledge':
        return <KnowledgeTab agentId={agent.id} token={token} />;
      case 'channels':
        return <ChannelsTab agentId={agent.id} token={token} />;
      case 'dialogs':
        return <DialogsTab agentId={agent.id} token={token} />;
      case 'metrics':
        return <MetricsTab agentId={agent.id} token={token} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/agents')}
            className="p-2 rounded-[var(--radius-button)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={18} />
          </button>
          <AgentEmojiPicker value={agent.emoji} onChange={handleEmojiChange} />
          <div>
            <h1 className="text-[15px] font-semibold text-[var(--text)]">{agent.name}</h1>
            <StatusBadge
              variant={agent.isActive ? 'active' : 'draft'}
              className="mt-0.5"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileChatOpen(true)}
            className="lg:hidden p-2 rounded-[var(--radius-button)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            aria-label={t('editor.chat')}
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      <EditorLayout
        leftPanel={
          <div className="flex flex-col h-full">
            <Tabs tabs={EDITOR_TABS} activeTab={activeTab} onChange={setActiveTab} />
            <div className="flex-1 overflow-y-auto">
              {renderTabContent()}
            </div>
          </div>
        }
        rightPanel={
          <ChatPreview agent={agent} token={token} livePrompt={livePrompt} />
        }
      />

      <Modal
        open={mobileChatOpen}
        onClose={() => setMobileChatOpen(false)}
        title={t('chat.title')}
        size="lg"
      >
        <div className="h-[60vh]">
          <ChatPreview agent={agent} token={token} livePrompt={livePrompt} />
        </div>
      </Modal>

      <Modal
        open={brainMapOpen}
        onClose={() => setBrainMapOpen(false)}
        title={t('editor.brainMap')}
        size="lg"
      >
        <div className="h-[500px]">
          <iframe
            src={`/agents/brain-map?agent=${agent.id}`}
            className="w-full h-full border-0 rounded-[var(--radius-card)]"
            title={t('editor.brainMap')}
          />
        </div>
      </Modal>
    </div>
  );
}
