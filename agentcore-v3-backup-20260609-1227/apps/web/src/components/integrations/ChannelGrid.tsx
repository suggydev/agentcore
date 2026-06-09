'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import IntegrationCard from './IntegrationCard';
import ConnectModal from './ConnectModal';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  PROVIDER_CATEGORIES,
} from './types';
import type { Provider, AgentIntegration, CategoryKey } from './types';

interface ChannelGridProps {
  providers: Provider[];
  integrations: AgentIntegration[];
  agentId: string;
  onConnect: (providerId: string, mode: string | null, config: Record<string, unknown>) => Promise<void>;
  onDisconnect: (integrationId: string) => Promise<void>;
  onUpdate: (integrationId: string, config: Record<string, unknown>) => Promise<void>;
  onHealthCheck: (integrationId: string) => Promise<void>;
}

export default function ChannelGrid({
  providers,
  integrations,
  agentId,
  onConnect,
  onDisconnect,
  onUpdate,
  onHealthCheck,
}: ChannelGridProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<AgentIntegration | null>(null);

  function getCategory(provider: Provider): CategoryKey {
    return provider.category || PROVIDER_CATEGORIES[provider.id] || 'automation';
  }

  const grouped = React.useMemo(() => {
    const map: Record<CategoryKey, Provider[]> = {
      messengers: [],
      crm: [],
      email: [],
      automation: [],
      payments: [],
    };
    for (const p of providers) {
      const cat = getCategory(p);
      map[cat].push(p);
    }
    return map;
  }, [providers]);

  function handleConnect(provider: Provider) {
    setSelectedProvider(provider);
    setSelectedIntegration(null);
    setModalOpen(true);
  }

  function handleConfigure(integration: AgentIntegration, provider: Provider) {
    setSelectedProvider(provider);
    setSelectedIntegration(integration);
    setModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-12">
      {CATEGORY_ORDER.map((cat) => {
        const list = grouped[cat];
        if (!list || list.length === 0) return null;
        return (
          <section key={cat}>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="heading-3 mb-6 text-text dark:text-white"
            >
              {(CATEGORY_LABELS as Record<CategoryKey, string>)[cat]}
            </motion.h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((provider) => {
                const integration = integrations.find(
                  (i) => i.providerId === provider.id && i.agentId === agentId
                );
                return (
                  <IntegrationCard
                    key={provider.id}
                    provider={provider}
                    integration={integration}
                    onConnect={handleConnect}
                    onConfigure={handleConfigure}
                    onDisconnect={onDisconnect}
                    onHealthCheck={onHealthCheck}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        provider={selectedProvider}
        integration={selectedIntegration}
        agentId={agentId}
        onConnect={onConnect}
        onUpdate={onUpdate}
        onDisconnect={onDisconnect}
      />
    </div>
  );
}
