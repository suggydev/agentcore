/**
 * Типы агентного фреймворка AgentCore
 * 
 * Определяет интерфейсы и типы для планировщика, исполнителя и памяти агентов.
 */

/** Статус выполнения задачи агента */
export type AgentTaskStatus = 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled';

/** Приоритет шага в плане выполнения */
export type StepPriority = 'critical' | 'high' | 'medium' | 'low';

/** Тип шага выполнения */
export type StepType = 'action' | 'decision' | 'observation' | 'communication' | 'data_retrieval';

/** Результат выполнения шага */
export interface StepResult {
  stepId: string;
  success: boolean;
  data: unknown;
  error?: string;
  duration: number;
  timestamp: Date;
}

/** Шаг плана выполнения */
export interface PlanStep {
  id: string;
  type: StepType;
  priority: StepPriority;
  description: string;
  dependencies: string[];
  params: Record<string, unknown>;
  retryConfig?: RetryConfig;
  timeout?: number;
}

/** План выполнения задачи */
export interface ExecutionPlan {
  id: string;
  taskId: string;
  steps: PlanStep[];
  createdAt: Date;
  estimatedDuration?: number;
  metadata: Record<string, unknown>;
}

/** Конфигурация повторных попыток */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/** Контекст выполнения агента */
export interface AgentContext {
  agentId: string;
  userId: string;
  sessionId: string;
  config: AgentConfig;
  startTime: Date;
  parentTaskId?: string;
}

/** Конфигурация агента */
export interface AgentConfig {
  maxConcurrentSteps: number;
  defaultTimeout: number;
  retryConfig: RetryConfig;
  memoryLimit: number;
  allowedActions: string[];
  metadata: Record<string, unknown>;
}

/** Запись в памяти агента */
export interface MemoryEntry {
  id: string;
  agentId: string;
  sessionId: string;
  type: 'context' | 'observation' | 'decision' | 'result';
  content: unknown;
  timestamp: Date;
  ttl?: number;
  metadata: Record<string, unknown>;
}

/** Снимок состояния памяти */
export interface MemorySnapshot {
  agentId: string;
  sessionId: string;
  entries: MemoryEntry[];
  createdAt: Date;
  totalSize: number;
}

/** Результат выполнения задачи */
export interface TaskResult {
  taskId: string;
  status: AgentTaskStatus;
  stepsCompleted: number;
  stepsTotal: number;
  results: StepResult[];
  error?: AgentErrorInfo;
  startTime: Date;
  endTime?: Date;
  metadata: Record<string, unknown>;
}

/** Информация об ошибке агента */
export interface AgentErrorInfo {
  code: string;
  message: string;
  stepId?: string;
  retryable: boolean;
  context: Record<string, unknown>;
}

/** Конфигурация фреймворка */
export interface FrameworkConfig {
  planner: PlannerConfig;
  executor: ExecutorConfig;
  memory: MemoryConfig;
}

/** Конфигурация планировщика */
export interface PlannerConfig {
  maxStepsPerPlan: number;
  maxDependencyDepth: number;
  allowCyclicDependencies: boolean;
  defaultPriority: StepPriority;
}

/** Конфигурация исполнителя */
export interface ExecutorConfig {
  maxConcurrentSteps: number;
  defaultTimeout: number;
  retryConfig: RetryConfig;
  gracefulShutdownTimeout: number;
}

/** Конфигурация памяти */
export interface MemoryConfig {
  maxEntries: number;
  maxEntrySize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

/** Значения конфигурации по умолчанию */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT'],
};

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxConcurrentSteps: 5,
  defaultTimeout: 30000,
  retryConfig: DEFAULT_RETRY_CONFIG,
  memoryLimit: 1000,
  allowedActions: ['action', 'decision', 'observation', 'communication', 'data_retrieval'],
  metadata: {},
};

export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  maxStepsPerPlan: 50,
  maxDependencyDepth: 10,
  allowCyclicDependencies: false,
  defaultPriority: 'medium',
};

export const DEFAULT_EXECUTOR_CONFIG: ExecutorConfig = {
  maxConcurrentSteps: 5,
  defaultTimeout: 30000,
  retryConfig: DEFAULT_RETRY_CONFIG,
  gracefulShutdownTimeout: 5000,
};

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxEntries: 10000,
  maxEntrySize: 1024 * 1024, // 1MB
  defaultTTL: 3600000, // 1 hour
  cleanupInterval: 300000, // 5 minutes
};

export const DEFAULT_FRAMEWORK_CONFIG: FrameworkConfig = {
  planner: DEFAULT_PLANNER_CONFIG,
  executor: DEFAULT_EXECUTOR_CONFIG,
  memory: DEFAULT_MEMORY_CONFIG,
};
