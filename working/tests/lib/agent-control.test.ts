import { describe, it, expect } from 'vitest'

interface Agent { id: string; name: string; status: 'idle' | 'working' | 'error' }

class AgentControl {
  private agents: Map<string, Agent> = new Map()
  register(agent: Agent): void { this.agents.set(agent.id, agent) }
  getAgent(id: string): Agent | undefined { return this.agents.get(id) }
  listAgents(): Agent[] { return Array.from(this.agents.values()) }
  stop(id: string): boolean { const a = this.agents.get(id); if (a) { a.status = 'idle'; return true; } return false; }
  remove(id: string): boolean { return this.agents.delete(id) }
}

describe('AgentControl', () => {
  it('should register and retrieve agents', () => {
    const control = new AgentControl()
    control.register({ id: '1', name: 'TestAgent', status: 'idle' })
    expect(control.getAgent('1')).toBeDefined()
    expect(control.getAgent('1')?.name).toBe('TestAgent')
  })

  it('should list all agents', () => {
    const control = new AgentControl()
    control.register({ id: '1', name: 'A1', status: 'idle' })
    control.register({ id: '2', name: 'A2', status: 'working' })
    expect(control.listAgents()).toHaveLength(2)
  })

  it('should stop an agent', () => {
    const control = new AgentControl()
    control.register({ id: '1', name: 'Test', status: 'working' })
    expect(control.stop('1')).toBe(true)
    expect(control.getAgent('1')?.status).toBe('idle')
  })

  it('should remove an agent', () => {
    const control = new AgentControl()
    control.register({ id: '1', name: 'Test', status: 'idle' })
    expect(control.remove('1')).toBe(true)
    expect(control.getAgent('1')).toBeUndefined()
  })
})