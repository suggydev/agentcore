import { AgentConfig, PlanStep } from './types'

export class AgentPlanner {
  private config: AgentConfig
  private plan: PlanStep[] = []

  constructor(config: AgentConfig) {
    this.config = config
  }

  async createPlan(goal: string): Promise<PlanStep[]> {
    this.plan = this.decomposeGoal(goal)
    return this.plan
  }

  private decomposeGoal(goal: string): PlanStep[] {
    return [
      { id: '1', description: 'Analyze: ' + goal, status: 'pending', priority: 1 },
      { id: '2', description: 'Plan implementation for: ' + goal, status: 'pending', priority: 2 },
      { id: '3', description: 'Execute implementation: ' + goal, status: 'pending', priority: 3 },
      { id: '4', description: 'Validate results for: ' + goal, status: 'pending', priority: 4 },
    ]
  }

  getCurrentPlan(): PlanStep[] {
    return this.plan
  }

  updateStep(stepId: string, status: PlanStep['status']): void {
    const step = this.plan.find(s => s.id === stepId)
    if (step) {
      step.status = status
    }
  }

  getNextStep(): PlanStep | undefined {
    return this.plan.find(s => s.status === 'pending')
  }
}