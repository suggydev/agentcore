/**
 * Кастомные ошибки агентного фреймворка
 * 
 * Иерархия ошибок для обработки сбоев на разных этапах работы агента.
 */

export enum AgentErrorCode {
  // Ошибки планирования
  PLANNING_FAILED = 'PLANNING_FAILED',
  INVALID_TASK = 'INVALID_TASK',
  CYCLIC_DEPENDENCY = 'CYCLIC_DEPENDENCY',
  MAX_STEPS_EXCEEDED = 'MAX_STEPS_EXCEEDED',
  DEPENDENCY_DEPTH_EXCEEDED = 'DEPENDENCY_DEPTH_EXCEEDED',

  // Ошибки выполнения
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  STEP_TIMEOUT = 'STEP_TIMEOUT',
  STEP_EXECUTION_ERROR = 'STEP_EXECUTION_ERROR',
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
  EXECUTION_CANCELLED = 'EXECUTION_CANCELLED',
  CONCURRENT_LIMIT_EXCEEDED = 'CONCURRENT_LIMIT_EXCEEDED',

  // Ошибки памяти
  MEMORY_ERROR = 'MEMORY_ERROR',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  ENTRY_NOT_FOUND = 'ENTRY_NOT_FOUND',
  ENTRY_SIZE_EXCEEDED = 'ENTRY_SIZE_EXCEEDED',
  SNAPSHOT_ERROR = 'SNAPSHOT_ERROR',

  // Общие ошибки
  CONFIG_ERROR = 'CONFIG_ERROR',
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Базовый класс ошибок агентного фреймворка
 */
export class AgentFrameworkError extends Error {
  public readonly code: AgentErrorCode;
  public readonly retryable: boolean;
  public readonly context: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    code: AgentErrorCode,
    message: string,
    retryable: boolean = false,
    context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'AgentFrameworkError';
    this.code = code;
    this.retryable = retryable;
    this.context = context;
    this.timestamp = new Date();

    // Поддержка правильного прототипа в TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Ошибка планирования агента
 */
export class AgentPlanningError extends AgentFrameworkError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(AgentErrorCode.PLANNING_FAILED, message, false, context);
    this.name = 'AgentPlanningError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static invalidTask(description: string, context: Record<string, unknown> = {}): AgentPlanningError {
    return new AgentPlanningError(
      `Invalid task: ${description}`,
      { ...context, code: AgentErrorCode.INVALID_TASK }
    );
  }

  static cyclicDependency(cyclePath: string[], context: Record<string, unknown> = {}): AgentPlanningError {
    return new AgentPlanningError(
      `Cyclic dependency detected: ${cyclePath.join(' -> ')}`,
      { ...context, code: AgentErrorCode.CYCLIC_DEPENDENCY, cyclePath }
    );
  }

  static maxStepsExceeded(maxSteps: number, context: Record<string, unknown> = {}): AgentPlanningError {
    return new AgentPlanningError(
      `Maximum steps exceeded: ${maxSteps}`,
      { ...context, code: AgentErrorCode.MAX_STEPS_EXCEEDED, maxSteps }
    );
  }

  static dependencyDepthExceeded(maxDepth: number, context: Record<string, unknown> = {}): AgentPlanningError {
    return new AgentPlanningError(
      `Dependency depth exceeded: ${maxDepth}`,
      { ...context, code: AgentErrorCode.DEPENDENCY_DEPTH_EXCEEDED, maxDepth }
    );
  }
}

/**
 * Ошибка выполнения агента
 */
export class AgentExecutionError extends AgentFrameworkError {
  public readonly stepId?: string;

  constructor(
    message: string,
    retryable: boolean = false,
    stepId?: string,
    context: Record<string, unknown> = {}
  ) {
    super(AgentErrorCode.EXECUTION_FAILED, message, retryable, { ...context, stepId });
    this.name = 'AgentExecutionError';
    this.stepId = stepId;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static stepTimeout(stepId: string, timeout: number, context: Record<string, unknown> = {}): AgentExecutionError {
    return new AgentExecutionError(
      `Step ${stepId} timed out after ${timeout}ms`,
      true,
      stepId,
      { ...context, code: AgentErrorCode.STEP_TIMEOUT, timeout }
    );
  }

  static stepExecutionError(stepId: string, error: string, context: Record<string, unknown> = {}): AgentExecutionError {
    return new AgentExecutionError(
      `Step ${stepId} execution failed: ${error}`,
      true,
      stepId,
      { ...context, code: AgentErrorCode.STEP_EXECUTION_ERROR, originalError: error }
    );
  }

  static maxRetriesExceeded(stepId: string, attempts: number, context: Record<string, unknown> = {}): AgentExecutionError {
    return new AgentExecutionError(
      `Step ${stepId} max retries exceeded: ${attempts} attempts`,
      false,
      stepId,
      { ...context, code: AgentErrorCode.MAX_RETRIES_EXCEEDED, attempts }
    );
  }

  static executionCancelled(taskId: string, context: Record<string, unknown> = {}): AgentExecutionError {
    return new AgentExecutionError(
      `Execution cancelled for task ${taskId}`,
      false,
      undefined,
      { ...context, code: AgentErrorCode.EXECUTION_CANCELLED, taskId }
    );
  }

  static concurrentLimitExceeded(limit: number, context: Record<string, unknown> = {}): AgentExecutionError {
    return new AgentExecutionError(
      `Concurrent step limit exceeded: ${limit}`,
      true,
      undefined,
      { ...context, code: AgentErrorCode.CONCURRENT_LIMIT_EXCEEDED, limit }
    );
  }
}

/**
 * Ошибка памяти агента
 */
export class AgentMemoryError extends AgentFrameworkError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(AgentErrorCode.MEMORY_ERROR, message, false, context);
    this.name = 'AgentMemoryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static memoryLimitExceeded(limit: number, current: number, context: Record<string, unknown> = {}): AgentMemoryError {
    return new AgentMemoryError(
      `Memory limit exceeded: ${current}/${limit} entries`,
      { ...context, code: AgentErrorCode.MEMORY_LIMIT_EXCEEDED, limit, current }
    );
  }

  static entryNotFound(entryId: string, context: Record<string, unknown> = {}): AgentMemoryError {
    return new AgentMemoryError(
      `Memory entry not found: ${entryId}`,
      { ...context, code: AgentErrorCode.ENTRY_NOT_FOUND, entryId }
    );
  }

  static entrySizeExceeded(size: number, maxSize: number, context: Record<string, unknown> = {}): AgentMemoryError {
    return new AgentMemoryError(
      `Entry size exceeded: ${size}/${maxSize} bytes`,
      { ...context, code: AgentErrorCode.ENTRY_SIZE_EXCEEDED, size, maxSize }
    );
  }

  static snapshotError(reason: string, context: Record<string, unknown> = {}): AgentMemoryError {
    return new AgentMemoryError(
      `Snapshot error: ${reason}`,
      { ...context, code: AgentErrorCode.SNAPSHOT_ERROR, reason }
    );
  }
}

/**
 * Проверяет, является ли ошибка ошибкой агентного фреймворка
 */
export function isAgentError(error: unknown): error is AgentFrameworkError {
  return error instanceof AgentFrameworkError;
}

/**
 * Проверяет, можно ли повторить операцию после ошибки
 */
export function isRetryableError(error: unknown): boolean {
  if (isAgentError(error)) {
    return error.retryable;
  }
  // Для неизвестных ошибок считаем их повторяемыми
  return true;
}

/**
 * Получает код ошибки
 */
export function getErrorCode(error: unknown): AgentErrorCode | string {
  if (isAgentError(error)) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return AgentErrorCode.INTERNAL_ERROR;
}
