import { AgentMessage } from './types'

export class AgentMemory {
  private messages: AgentMessage[] = []
  private maxMessages: number

  constructor(maxMessages: number = 100) {
    this.maxMessages = maxMessages
  }

  add(message: AgentMessage): void {
    this.messages.push(message)
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }
  }

  getRecent(count: number = 10): AgentMessage[] {
    return this.messages.slice(-count)
  }

  getContext(maxTokens: number = 4000): AgentMessage[] {
    let totalLength = 0
    const context: AgentMessage[] = []
    for (const msg of [...this.messages].reverse()) {
      totalLength += msg.content.length
      if (totalLength > maxTokens) break
      context.unshift(msg)
    }
    return context
  }

  clear(): void {
    this.messages = []
  }

  get size(): number {
    return this.messages.length
  }
}