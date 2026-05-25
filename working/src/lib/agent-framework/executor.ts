import { AgentConfig, AgentMessage, AgentResult, AgentState } from './types'

export class AgentExecutor {
  private state: AgentState = AgentState.IDLE
  private messages: AgentMessage[] = []
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
  }

  get currentState(): AgentState {
    return this.state
  }

  async execute(task: string, context?: Record<string, unknown>): Promise<AgentResult> {
    this.state = AgentState.WORKING
    this.messages.push({ role: 'user', content: task, timestamp: Date.now() })

    try {
      const result = await this.processTask(task, context)
      this.state = AgentState.IDLE
      return { success: true, data: result, error: null }
    } catch (err) {
      this.state = AgentState.ERROR
      const error = err instanceof Error ? err.message : String(err)
      return { success: false, data: null, error }
    }
  }

  private async processTask(task: string, context?: Record<string, unknown>): Promise<unknown> {
    const timeout = this.config.timeout || 30000
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const result = { task, context, processed: true, timestamp: Date.now() }
      clearTimeout(timer)
      return result
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  }

  getState(): { state: AgentState; messageCount: number } {
    return { state: this.state, messageCount: this.messages.length }
  }

  reset(): void {
    this.state = AgentState.IDLE
    this.messages = []
  }
}