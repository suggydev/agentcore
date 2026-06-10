'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Mail, Shield, User } from 'lucide-react';

const TEAM_MEMBERS = [
  { id: '1', name: 'Алексей Иванов', email: 'alex@agentcore.work', role: 'Владелец', status: 'active' },
  { id: '2', name: 'Мария Петрова', email: 'maria@agentcore.work', role: 'Администратор', status: 'active' },
  { id: '3', name: 'Дмитрий Сидоров', email: 'dmitry@agentcore.work', role: 'Разработчик', status: 'active' },
];

export default function TeamPage() {
  const [members] = useState(TEAM_MEMBERS);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto" data-testid="team-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-label text-[var(--brand)] mb-2">Команда</p>
        <h1 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">Участники команды</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Управление участниками и доступами.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center ring-1 ring-[var(--border)]/60">
              <Users className="w-[18px] h-[18px] text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Список участников</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{members.length} участников</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)] transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1" data-testid="invite-button">
            <Plus className="w-4 h-4" />
            Пригласить
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="team-table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Участник</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Роль</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Статус</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="member-list">
              {members.map((member) => (
                <tr key={member.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--accent-soft)]/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--brand)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text)]">{member.name}</p>
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span className="text-[var(--text)]">{member.role}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success)] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                      Активен
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
