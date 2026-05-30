'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  Blocks,
  Zap,
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';

const API_BASE = 'http://31.76.102.116:4000';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  comingSoon?: boolean;
  icon: string;
  color: string;
}

interface Category {
  name: string;
  icon: React.ElementType;
  items: Omit<Integration, 'id' | 'connected' | 'category'>[];
}

const categories: Category[] = [
  {
    name: 'CRM',
    icon: Blocks,
    items: [
      { name: 'HubSpot', description: 'Sync contacts, deals & tickets', icon: 'hubspot', color: '#FF7A59', comingSoon: false },
      { name: 'Salesforce', description: 'Enterprise CRM integration', icon: 'salesforce', color: '#00A1E0', comingSoon: false },
      { name: 'Pipedrive', description: 'Sales pipeline management', icon: 'pipedrive', color: '#203232', comingSoon: false },
      { name: 'Zoho', description: 'Zoho CRM synchronization', icon: 'zoho', color: '#F0483E', comingSoon: true },
      { name: 'Bitrix24', description: 'Full CRM & collaboration', icon: 'bitrix', color: '#2FC6F6', comingSoon: true },
      { name: 'AmoCRM', description: 'Messenger-based CRM', icon: 'amo', color: '#3550DE', comingSoon: true },
    ],
  },
  {
    name: 'Communication',
    icon: Zap,
    items: [
      { name: 'Telegram', description: 'Bot & channel integration', icon: 'telegram', color: '#26A5E4', comingSoon: false },
      { name: 'WhatsApp', description: 'Business API messaging', icon: 'whatsapp', color: '#25D366', comingSoon: false },
      { name: 'Slack', description: 'Workspace notifications', icon: 'slack', color: '#4A154B', comingSoon: false },
      { name: 'Discord', description: 'Server bot integration', icon: 'discord', color: '#5865F2', comingSoon: true },
      { name: 'Instagram DM', description: 'Direct message handling', icon: 'instagram', color: '#E4405F', comingSoon: true },
      { name: 'Facebook Messenger', description: 'Page messaging', icon: 'messenger', color: '#0084FF', comingSoon: true },
    ],
  },
  {
    name: 'Email',
    icon: Blocks,
    items: [
      { name: 'Gmail', description: 'Email sync & triggers', icon: 'gmail', color: '#EA4335', comingSoon: false },
      { name: 'Outlook', description: 'Microsoft 365 email', icon: 'outlook', color: '#0078D4', comingSoon: false },
      { name: 'SendGrid', description: 'Transactional email API', icon: 'sendgrid', color: '#1A82E2', comingSoon: true },
    ],
  },
  {
    name: 'Documents',
    icon: Blocks,
    items: [
      { name: 'Notion', description: 'Knowledge sync & pages', icon: 'notion', color: '#000000', comingSoon: false },
      { name: 'Google Drive', description: 'File storage & access', icon: 'gdrive', color: '#4285F4', comingSoon: false },
      { name: 'Dropbox', description: 'Cloud file integration', icon: 'dropbox', color: '#0061FF', comingSoon: true },
      { name: 'Airtable', description: 'Spreadsheet-database hybrid', icon: 'airtable', color: '#18BFFF', comingSoon: true },
    ],
  },
  {
    name: 'Automation',
    icon: Zap,
    items: [
      { name: 'Zapier', description: 'Connect 5000+ apps', icon: 'zapier', color: '#FF4A00', comingSoon: false },
      { name: 'Make (Integromat)', description: 'Visual workflow builder', icon: 'make', color: '#673AB7', comingSoon: false },
      { name: 'Webhooks', description: 'Custom HTTP callbacks', icon: 'webhooks', color: '#6366F1', comingSoon: false },
      { name: 'REST API', description: 'Full programmatic access', icon: 'restapi', color: '#10B981', comingSoon: false },
    ],
  },
  {
    name: 'Payments',
    icon: Blocks,
    items: [
      { name: 'Stripe', description: 'Payment processing', icon: 'stripe', color: '#635BFF', comingSoon: false },
      { name: 'Shopify', description: 'E-commerce store sync', icon: 'shopify', color: '#96BF48', comingSoon: true },
      { name: 'WooCommerce', description: 'WordPress e-commerce', icon: 'woo', color: '#96588A', comingSoon: true },
    ],
  },
  {
    name: 'Calendar',
    icon: Blocks,
    items: [
      { name: 'Google Calendar', description: 'Schedule & meeting sync', icon: 'gcal', color: '#4285F4', comingSoon: false },
      { name: 'Calendly', description: 'Automated scheduling', icon: 'calendly', color: '#006BFF', comingSoon: true },
    ],
  },
];

const iconGradients: Record<string, string> = {
  hubspot: 'from-orange-100 to-orange-200',
  salesforce: 'from-sky-100 to-sky-200',
  pipedrive: 'from-emerald-100 to-teal-200',
  zoho: 'from-red-100 to-red-200',
  bitrix: 'from-cyan-100 to-cyan-200',
  amo: 'from-indigo-100 to-indigo-200',
  telegram: 'from-blue-100 to-blue-200',
  whatsapp: 'from-green-100 to-green-200',
  slack: 'from-purple-100 to-violet-200',
  discord: 'from-indigo-100 to-blue-200',
  instagram: 'from-pink-100 to-rose-200',
  messenger: 'from-blue-100 to-sky-200',
  gmail: 'from-red-100 to-orange-200',
  outlook: 'from-blue-100 to-sky-200',
  sendgrid: 'from-blue-100 to-indigo-200',
  notion: 'from-gray-100 to-gray-200',
  gdrive: 'from-blue-100 to-sky-200',
  dropbox: 'from-blue-100 to-indigo-200',
  airtable: 'from-sky-100 to-cyan-200',
  zapier: 'from-orange-100 to-amber-200',
  make: 'from-violet-100 to-purple-200',
  webhooks: 'from-indigo-100 to-violet-200',
  restapi: 'from-emerald-100 to-teal-200',
  stripe: 'from-indigo-100 to-blue-200',
  shopify: 'from-lime-100 to-green-200',
  woo: 'from-violet-100 to-fuchsia-200',
  gcal: 'from-blue-100 to-sky-200',
  calendly: 'from-blue-100 to-indigo-200',
};

const iconLetters: Record<string, string> = {
  hubspot: 'H', salesforce: 'S', pipedrive: 'P', zoho: 'Z',
  bitrix: 'B', amo: 'A', telegram: 'T', whatsapp: 'W',
  slack: 'Sl', discord: 'D', instagram: 'In', messenger: 'M',
  gmail: 'G', outlook: 'O', sendgrid: 'Sg',
  notion: 'N', gdrive: 'Gd', dropbox: 'Db', airtable: 'At',
  zapier: 'Z', make: 'Mk', webhooks: 'Wh', restapi: 'API',
  stripe: 'St', shopify: 'Sh', woo: 'Wc',
  gcal: 'Gc', calendly: 'Ca',
};

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const loadIntegrations = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/integrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const connected = new Set<string>();
          (Array.isArray(data) ? data : data.integrations ?? []).forEach((i: { name?: string; id?: string; connected?: boolean }) => {
            if (i.connected) connected.add((i.name || i.id || '').toLowerCase());
          });
          setConnectedIds(connected);
        }
      } catch {
        setError('Failed to load integrations');
      } finally {
        setLoading(false);
      }
    };
    loadIntegrations();
  }, []);

  const handleToggle = async (name: string) => {
    setConnecting(name);
    await new Promise((r) => setTimeout(r, 800));
    setConnectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(name.toLowerCase())) {
        next.delete(name.toLowerCase());
      } else {
        next.add(name.toLowerCase());
      }
      return next;
    });
    setConnecting(null);
  };

  const flattenedIntegrations = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        category: cat.name,
        isConnected: connectedIds.has(item.name.toLowerCase()),
      }))
    );
  }, [connectedIds]);

  const filtered = useMemo(() => {
    let list = flattenedIntegrations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      list = list.filter((i) => i.category === activeCategory);
    }
    return list;
  }, [flattenedIntegrations, search, activeCategory]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
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
            <p className="text-[11px] font-semibold uppercase tracking-label text-mauve-500 mb-2">Integrations</p>
            <h1 className="font-display font-bold text-3xl text-ink-900 tracking-tight">Connect Your Stack</h1>
            <p className="text-ink-500 mt-1 text-sm">Integrate your tools and services to power your AI agents.</p>
          </motion.div>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-mauve-100 shadow-sm text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-mauve-500/20 focus:border-mauve-300 transition-all duration-200"
            />
          </div>
          {!search && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat.name
                      ? 'bg-mauve-600 text-white shadow-sm'
                      : 'bg-white text-ink-600 border border-mauve-100 hover:border-mauve-300 hover:bg-mauve-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-mauve-50 flex items-center justify-center mb-5 ring-1 ring-mauve-100/60">
              <Blocks className="w-7 h-7 text-mauve-400" />
            </div>
            <p className="text-ink-500 font-medium text-lg mb-1">No integrations found</p>
            <p className="text-ink-400 text-sm">Try a different search term or clear filters.</p>
          </motion.div>
        ) : (
          categories
            .filter((cat) => !activeCategory || activeCategory === cat.name)
            .map((cat) => {
              const catItems = filtered.filter((i) => i.category === cat.name);
              if (catItems.length === 0) return null;
              return (
                <motion.div
                  key={cat.name}
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="mb-10"
                >
                  <motion.h2 variants={item} className="font-display font-semibold text-lg text-ink-900 mb-5 flex items-center gap-2.5">
                    <cat.icon className="w-5 h-5 text-mauve-600" />
                    {cat.name}
                    <span className="text-xs font-normal text-ink-400">({catItems.length})</span>
                  </motion.h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catItems.map((integration) => {
                      const isConnected = integration.isConnected;
                      const isConnecting = connecting === integration.name;
                      return (
                        <motion.div
                          key={integration.name}
                          variants={item}
                          whileHover={{ y: -3, transition: { duration: 0.2 } }}
                          className="relative bg-white rounded-2xl border border-mauve-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 group overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mauve-400/0 via-mauve-400/30 to-mauve-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="flex items-start gap-4">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradients[integration.icon] || 'from-mauve-100 to-mauve-200'} flex items-center justify-center text-sm font-bold text-ink-700 flex-shrink-0 shadow-sm`}>
                              {iconLetters[integration.icon] || integration.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-semibold text-ink-900 text-sm truncate">{integration.name}</h3>
                                {isConnected && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Connected
                                  </span>
                                )}
                                {integration.comingSoon && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200/60 flex-shrink-0">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-500 line-clamp-2">{integration.description}</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-ink-50">
                            {integration.comingSoon ? (
                              <button
                                disabled
                                className="w-full py-2 rounded-xl text-xs font-medium border border-ink-100 bg-ink-50 text-ink-400 cursor-not-allowed"
                              >
                                Coming Soon
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggle(integration.name)}
                                disabled={isConnecting}
                                className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                  isConnected
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-mauve-600 text-white hover:bg-mauve-700 shadow-sm shadow-mauve-600/10'
                                }`}
                              >
                                {isConnecting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isConnected ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Connected
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Connect
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
        )}

        <div className="h-8" />
      </div>
    </DashboardLayout>
  );
}
