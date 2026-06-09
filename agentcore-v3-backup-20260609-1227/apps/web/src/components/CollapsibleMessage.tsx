'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

interface CollapsibleMessageProps {
  msg: ChatMessage;
}

export default function CollapsibleMessage({ msg }: CollapsibleMessageProps) {
  const [expanded, setExpanded] = useState(msg.role === 'user' || msg.content.length < 250);
  const isLong = msg.content.length > 250 && msg.role === 'assistant' && !msg.isStreaming;
  const display = isLong && !expanded ? msg.content.slice(0, 250) + '...' : msg.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
        msg.role === 'assistant' ? 'bg-brand/10 text-brand' : msg.role === 'system' ? 'bg-danger/10 text-danger' : 'bg-surface-3 text-text'
      }`}>
        {msg.role === 'assistant' ? <Bot size={16} /> : msg.role === 'system' ? <AlertCircle size={16} /> : <User size={16} />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap ${
        msg.role === 'user' ? 'bg-brand text-white rounded-br-md' :
        msg.role === 'system' ? 'bg-danger/10 border border-danger/20 text-danger rounded-bl-md' :
        'bg-surface-2 text-text rounded-bl-md border border-[var(--border)]'
      }`}>
        {display}
        {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-brand animate-pulse align-middle rounded-full" />}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-[11px] text-text-muted hover:text-brand transition-colors"
          >
            {expanded ? <><ChevronUp size={12} /> Скрыть</> : <><ChevronDown size={12} /> Показать полностью</>}
          </button>
        )}
      </div>
    </motion.div>
  );
}
