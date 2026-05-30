'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Building2,
  Globe,
  Bot,
  Bell,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle2,
  MessageSquare,
  PhoneIcon,
  Mail,
  User,
  ChevronDown,
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

interface WorkspaceData {
  name: string;
  companySize: string;
  industry: string;
  geography: string;
  website: string;
  crm: string;
  channels: {
    webChat: boolean;
    telegram: boolean;
    whatsapp: boolean;
    slack: boolean;
    discord: boolean;
    email: boolean;
  };
  agentDefaults: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  notifications: {
    emailNotifications: boolean;
    weeklyReport: boolean;
  };
}

const defaultWorkspace: WorkspaceData = {
  name: '',
  companySize: '',
  industry: '',
  geography: '',
  website: '',
  crm: '',
  channels: {
    webChat: true,
    telegram: false,
    whatsapp: false,
    slack: false,
    discord: false,
    email: false,
  },
  agentDefaults: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
  },
  notifications: {
    emailNotifications: true,
    weeklyReport: true,
  },
};

const companySizes = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'];
const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Real Estate', 'Marketing', 'Legal', 'Other'];
const geographies = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'Global'];
const crms = ['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Bitrix24', 'AmoCRM', 'None'];
const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet', 'gemini-2.0-flash'];

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  saved: boolean;
  onSave: () => void;
}

function SectionHeader({ icon: Icon, title, description, saved, onSave }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-ink-100">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-mauve-50 flex items-center justify-center ring-1 ring-mauve-100/60 flex-shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-mauve-600" />
        </div>
        <div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saved}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
          saved
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
            : 'bg-mauve-600 text-white hover:bg-mauve-700 shadow-sm shadow-mauve-600/10'
        }`}
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save
          </>
        )}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(defaultWorkspace);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          if (user.workspace) {
            setWorkspace((prev) => ({
              ...prev,
              ...user.workspace,
              channels: { ...prev.channels, ...user.workspace?.channels },
              agentDefaults: { ...prev.agentDefaults, ...user.workspace?.agentDefaults },
              notifications: { ...prev.notifications, ...user.workspace?.notifications },
            }));
          } else if (user.workspaceName) {
            setWorkspace((prev) => ({ ...prev, name: user.workspaceName }));
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateWorkspace = useCallback(<K extends keyof WorkspaceData>(key: K, value: WorkspaceData[K]) => {
    setWorkspace((prev) => ({ ...prev, [key]: value }));
    setSavedSections((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const updateNested = useCallback(
    <K extends keyof WorkspaceData>(parent: K, child: string, value: unknown) => {
      setWorkspace((prev) => ({
        ...prev,
        [parent]: { ...(prev[parent] as object), [child]: value },
      }));
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.delete(parent);
        return next;
      });
    },
    []
  );

  const saveSection = async (sectionKey: string) => {
    setGlobalSaving(true);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/workspace/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(workspace),
      });
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.add(sectionKey);
        return next;
      });
    } catch {} finally {
      setGlobalSaving(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/workspace`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      window.location.href = '/login';
    } catch {}
  };

  const channelItems = [
    { key: 'webChat' as const, label: 'Web Chat', icon: MessageSquare },
    { key: 'telegram' as const, label: 'Telegram', icon: MessageSquare },
    { key: 'whatsapp' as const, label: 'WhatsApp', icon: PhoneIcon },
    { key: 'slack' as const, label: 'Slack', icon: MessageSquare },
    { key: 'discord' as const, label: 'Discord', icon: MessageSquare },
    { key: 'email' as const, label: 'Email', icon: Mail },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
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
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Settings</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Workspace Settings</h1>
            <p className="text-ink-500 mt-1 text-sm">Manage your workspace configuration and preferences.</p>
          </motion.div>
        </motion.div>

        <div className="space-y-6">
          {/* Workspace Info */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Settings}
              title="Workspace Info"
              description="Basic workspace identification."
              saved={savedSections.has('name')}
              onSave={() => saveSection('name')}
            />
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">Workspace Name</label>
              <input
                type="text"
                value={workspace.name}
                onChange={(e) => updateWorkspace('name', e.target.value)}
                placeholder="My Workspace"
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
              />
            </div>
          </motion.div>

          {/* Company Details */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Building2}
              title="Company Details"
              description="Information about your company for agent context."
              saved={savedSections.has('company')}
              onSave={() => saveSection('company')}
            />
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Company Size</label>
                <div className="relative">
                  <select
                    value={workspace.companySize}
                    onChange={(e) => updateWorkspace('companySize', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">Select size...</option>
                    {companySizes.map((s) => (
                      <option key={s} value={s}>{s} employees</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Industry</label>
                <div className="relative">
                  <select
                    value={workspace.industry}
                    onChange={(e) => updateWorkspace('industry', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">Select industry...</option>
                    {industries.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Geography</label>
                <div className="relative">
                  <select
                    value={workspace.geography}
                    onChange={(e) => updateWorkspace('geography', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">Select region...</option>
                    {geographies.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Website</label>
                <input
                  type="url"
                  value={workspace.website}
                  onChange={(e) => updateWorkspace('website', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">CRM</label>
                <div className="relative">
                  <select
                    value={workspace.crm}
                    onChange={(e) => updateWorkspace('crm', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    <option value="">None</option>
                    {crms.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Communication Channels */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Globe}
              title="Communication Channels"
              description="Choose which channels your agents operate on."
              saved={savedSections.has('channels')}
              onSave={() => saveSection('channels')}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {channelItems.map((ch) => {
                const isChecked = workspace.channels[ch.key];
                return (
                  <label
                    key={ch.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isChecked
                        ? 'border-mauve-300 bg-mauve-50/50'
                        : 'border-mauve-100 bg-white hover:bg-mauve-50/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => updateNested('channels', ch.key, e.target.checked)}
                      className="w-4 h-4 rounded border-mauve-300 text-mauve-600 focus:ring-mauve-500"
                    />
                    <ch.icon className={`w-4 h-4 ${isChecked ? 'text-mauve-600' : 'text-ink-400'}`} />
                    <span className={`text-sm font-medium ${isChecked ? 'text-ink-900' : 'text-ink-500'}`}>
                      {ch.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </motion.div>

          {/* Agent Defaults */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Bot}
              title="Agent Defaults"
              description="Default settings applied to new agents."
              saved={savedSections.has('agentDefaults')}
              onSave={() => saveSection('agentDefaults')}
            />
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Default Model</label>
                <div className="relative">
                  <select
                    value={workspace.agentDefaults.model}
                    onChange={(e) => updateNested('agentDefaults', 'model', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                  Temperature <span className="font-mono text-ink-400">{workspace.agentDefaults.temperature}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={workspace.agentDefaults.temperature}
                  onChange={(e) => updateNested('agentDefaults', 'temperature', parseFloat(e.target.value))}
                  className="w-full accent-mauve-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1.5">Max Tokens</label>
                <div className="relative">
                  <select
                    value={workspace.agentDefaults.maxTokens}
                    onChange={(e) => updateNested('agentDefaults', 'maxTokens', parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-mauve-100 text-sm text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200 pr-10"
                  >
                    {[256, 512, 1024, 2048, 4096, 8192, 16384].map((t) => (
                      <option key={t} value={t}>{t.toLocaleString()}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-mauve-100 shadow-sm p-6">
            <SectionHeader
              icon={Bell}
              title="Notifications"
              description="Configure notification preferences for your workspace."
              saved={savedSections.has('notifications')}
              onSave={() => saveSection('notifications')}
            />
            <div className="space-y-4 max-w-md">
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Email Notifications</p>
                  <p className="text-xs text-ink-500 mt-0.5">Receive updates about conversations and agent activity.</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={workspace.notifications.emailNotifications}
                    onChange={(e) => updateNested('notifications', 'emailNotifications', e.target.checked)}
                    className="sr-only peer"
                    id="email-notif"
                  />
                  <label
                    htmlFor="email-notif"
                    className={`block w-10 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                      workspace.notifications.emailNotifications ? 'bg-mauve-600' : 'bg-ink-200'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-1 ${
                        workspace.notifications.emailNotifications ? 'translate-x-5 ml-0.5' : 'translate-x-1'
                      }`}
                    />
                  </label>
                </div>
              </label>
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Weekly Report</p>
                  <p className="text-xs text-ink-500 mt-0.5">Receive a weekly analytics summary every Monday.</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={workspace.notifications.weeklyReport}
                    onChange={(e) => updateNested('notifications', 'weeklyReport', e.target.checked)}
                    className="sr-only peer"
                    id="weekly-report"
                  />
                  <label
                    htmlFor="weekly-report"
                    className={`block w-10 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                      workspace.notifications.weeklyReport ? 'bg-mauve-600' : 'bg-ink-200'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-1 ${
                        workspace.notifications.weeklyReport ? 'translate-x-5 ml-0.5' : 'translate-x-1'
                      }`}
                    />
                  </label>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            variants={item}
            className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center ring-1 ring-red-200 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">Danger Zone</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Permanently delete your workspace and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-all duration-200"
              >
                Delete Workspace
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
                    <p className="text-sm text-red-700 font-semibold mb-2">Are you absolutely sure?</p>
                    <p className="text-xs text-red-600 mb-3">
                      This will permanently delete your workspace, all agents, conversations, knowledge base, and settings.
                      Type <strong className="select-none">DELETE</strong> below to confirm.
                    </p>
                    <input
                      type="text"
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      placeholder='Type "DELETE" to confirm'
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-red-200 text-sm text-ink-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 transition-all duration-200 mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={deleteText !== 'DELETE'}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete Forever
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                        className="px-4 py-2 rounded-xl border border-ink-200 bg-white text-ink-700 text-sm font-medium hover:bg-ink-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        <div className="h-8" />
      </div>
    </DashboardLayout>
  );
}
