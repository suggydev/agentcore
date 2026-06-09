'use client';

import { motion } from 'framer-motion';
import { Link2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  type: string;
  connected: boolean;
}

interface IntegrationsTabProps {
  integrations: Integration[];
  integrationsLoading: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function IntegrationsTab({ integrations, integrationsLoading }: IntegrationsTabProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="bg-surface rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Link2 size={20} className="text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-text">Подключенные интеграции</h3>
            <p className="text-xs text-text-muted">Управление внешними сервисами</p>
          </div>
        </div>

        {integrationsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : (
          <>
            {integrations.length === 0 ? (
              <p className="text-sm text-text-muted py-3">Нет подключенных интеграций</p>
            ) : (
              <div className="space-y-2 mb-5">
                {integrations.map((intg) => (
                  <div key={intg.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
                    <div>
                      <div className="text-sm text-text">{intg.name}</div>
                      <div className="text-xs text-text-muted">{intg.type}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${intg.connected ? 'bg-success/15 text-success' : 'bg-text-muted/15 text-text-muted'}`}>
                      {intg.connected ? 'Подключено' : 'Отключено'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/agents"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
            >
              Перейти к редактору агентов
            </Link>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
