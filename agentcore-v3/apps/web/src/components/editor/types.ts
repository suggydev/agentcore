export interface AgentData {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  createdAt: string;
  workspaceId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: 'file' | 'url' | 'qa';
  content: string;
  size?: number;
  createdAt: string;
  agentId: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  icon: string;
  category: 'messengers' | 'crm' | 'email' | 'automation' | 'payments';
  status: 'connected' | 'available' | 'coming_soon';
  description: string;
  features: string[];
  authType: 'oauth' | 'token' | 'none';
  authUrl?: string;
  tokenHint?: string;
}

export interface IntegrationConnection {
  id: string;
  providerId: string;
  agentId: string;
  status: 'active' | 'error';
  connectedAt: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  channel: string;
  status: 'new' | 'in_progress' | 'closed';
  createdAt: string;
  messageCount: number;
  lastMessageAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'operator';
  content: string;
  createdAt: string;
}

export interface MetricData {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  sparkline?: number[];
}

export interface ModelOption {
  id: string;
  name: string;
}
