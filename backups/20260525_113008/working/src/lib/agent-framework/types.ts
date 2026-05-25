/**
 * Core types for the AI Agent Framework.
 *
 * Implements ReAct (Reasoning + Acting) pattern with tool support
 * and multi-file context management.
 */
import { z } from "zod";

// ═══════════════════════════════════════════════════════════
// ReAct Step Types
// ═══════════════════════════════════════════════════════════

export type ReActStepType = "thought" | "action" | "observation" | "final_answer";

export interface ReActThought {
  type: "thought";
  content: string;
  /** Optional reasoning chain for transparency */
  reasoning?: string;
  timestamp: string;
}

export interface ReActAction {
  type: "action";
  tool: string;
  args: Record<string, unknown>;
  timestamp: string;
}

export interface ReActObservation {
  type: "observation";
  tool: string;
  result: unknown;
  error?: string;
  durationMs: number;
  timestamp: string;
}

export interface ReActFinalAnswer {
  type: "final_answer";
  content: string;
  confidence?: number;
  sources?: string[];
  timestamp: string;
}

export type ReActStep = ReActThought | ReActAction | ReActObservation | ReActFinalAnswer;

// ═══════════════════════════════════════════════════════════
// Tool Types
// ═══════════════════════════════════════════════════════════

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
  items?: ToolParameter; // For array type
  properties?: Record<string, ToolParameter>; // For object type
}

export interface ToolDefinition {
  /** Unique tool identifier */
  name: string;
  /** Human-readable description used by LLM for tool selection */
  description: string;
  /** Parameter schema */
  parameters: ToolParameter[];
  /** Zod schema for runtime validation */
  parameterSchema?: z.ZodType;
  /** Tool category for filtering */
  category: "search" | "file" | "compute" | "api" | "communication" | "custom";
  /** Whether this tool requires user confirmation before execution */
  requiresConfirmation?: boolean;
  /** Whether this tool has side effects (writes, deletes, etc.) */
  hasSideEffects?: boolean;
  /** Maximum execution time in milliseconds */
  timeoutMs?: number;
  /** Rate limit: max calls per agent execution */
  maxCallsPerExecution?: number;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    durationMs: number;
    tokensUsed?: number;
    filesAccessed?: string[];
    apiCallsMade?: number;
  };
}

export type ToolExecutor = (
  args: Record<string, unknown>,
  context: ToolExecutionContext,
) => Promise<ToolResult>;

export interface ToolExecutionContext {
  agentId: string;
  companyId: string;
  userId: string;
  executionId: string;
  /** Files currently in context */
  fileContext: FileContextEntry[];
  /** Track resource usage */
  resourceUsage: ResourceUsage;
  /** Abort signal for cancellation */
  signal: AbortSignal;
}

export interface RegisteredTool {
  definition: ToolDefinition;
  executor: ToolExecutor;
}

// ═══════════════════════════════════════════════════════════
// Multi-File Types
// ═══════════════════════════════════════════════════════════

export interface FileReference {
  /** Unique file identifier */
  id: string;
  /** Original filename */
  name: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Storage path or URL */
  path: string;
  /** Timestamp of last modification */
  lastModified: string;
  /** Optional checksum for integrity verification */
  checksum?: string;
}

export interface FileContextEntry {
  reference: FileReference;
  /** Extracted content (may be chunked) */
  content: string;
  /** Chunk index if file is split */
  chunkIndex?: number;
  /** Total chunks for this file */
  totalChunks?: number;
  /** Token count for this content */
  tokenCount: number;
  /** Relevance score for current query (0-1) */
  relevanceScore?: number;
  /** Metadata extracted from file */
  metadata?: Record<string, unknown>;
}

export interface FileChunkStrategy {
  /** Maximum tokens per chunk */
  maxTokensPerChunk: number;
  /** Overlap tokens between chunks */
  overlapTokens: number;
  /** Whether to respect line boundaries */
  respectLineBoundaries: boolean;
  /** Whether to respect paragraph boundaries */
  respectParagraphBoundaries: boolean;
}

// ═══════════════════════════════════════════════════════════
// Execution Types
// ═══════════════════════════════════════════════════════════

export interface AgentExecutionConfig {
  /** Agent ID from database */
  agentId: string;
  /** Company ID for auth/billing */
  companyId: string;
  /** User who initiated execution */
  userId: string;
  /** LLM model to use */
  model: string;
  /** System prompt / instructions */
  systemPrompt: string;
  /** User input / task */
  input: string;
  /** Maximum ReAct iterations */
  maxIterations: number;
  /** Maximum total tokens */
  maxTokens: number;
  /** Maximum execution time in ms */
  timeoutMs: number;
  /** Available tool names (filtered by permissions) */
  allowedTools: string[];
  /** File references to include in context */
  fileReferences: FileReference[];
  /** Chunk strategy for multi-file */
  chunkStrategy: FileChunkStrategy;
  /** Agent-specific restrictions */
  restrictions: string[];
  /** Forbidden topics */
  forbiddenTopics: string[];
  /** Temperature for LLM calls */
  temperature: number;
}

export interface ResourceUsage {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  llmCalls: number;
  toolCalls: number;
  filesRead: number;
  filesWritten: number;
  apiCallsMade: number;
  estimatedCostUsd: number;
}

export interface AgentExecutionResult {
  /** Execution ID */
  executionId: string;
  /** Final answer from agent */
  answer: string;
  /** Complete ReAct trace */
  steps: ReActStep[];
  /** Resource usage summary */
  usage: ResourceUsage;
  /** Files that were accessed */
  filesAccessed: string[];
  /** Duration in ms */
  durationMs: number;
  /** Whether execution completed normally */
  completed: boolean;
  /** Reason if not completed normally */
  terminationReason?: "max_iterations" | "timeout" | "token_budget" | "error" | "cancelled";
  /** Confidence score (0-1) */
  confidence?: number;
}

// ═══════════════════════════════════════════════════════════
// LLM Provider Types
// ═══════════════════════════════════════════════════════════

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: LLMToolCall[];
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMResponse {
  content: string | null;
  toolCalls?: LLMToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "tool_calls" | "length" | "content_filter";
}

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMResponse>;
  estimateTokens(text: string): number;
}

export interface LLMChatOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  stopSequences?: string[];
  tools?: LLMToolDefinition[];
  signal?: AbortSignal;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

// ═══════════════════════════════════════════════════════════
// Event Types (for streaming / observability)
// ═══════════════════════════════════════════════════════════

export type AgentEventType =
  | "execution_start"
  | "thought"
  | "action_start"
  | "action_complete"
  | "observation"
  | "final_answer"
  | "error"
  | "execution_end";

export interface AgentEvent {
  type: AgentEventType;
  executionId: string;
  agentId: string;
  timestamp: string;
  data: unknown;
}

export type AgentEventHandler = (event: AgentEvent) => void;
