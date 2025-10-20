import type { ExecutionHistory } from '../../types/schemas';

class StateStore {
  private runs = new Map<string, ExecutionHistory>();

  get(runId: string): ExecutionHistory | undefined {
    return this.runs.get(runId);
  }

  set(runId: string, execution: ExecutionHistory): void {
    this.runs.set(runId, execution);
  }

  update(runId: string, updates: Partial<ExecutionHistory>): void {
    const existing = this.runs.get(runId);
    if (existing) {
      this.runs.set(runId, { ...existing, ...updates });
    }
  }

  delete(runId: string): void {
    this.runs.delete(runId);
  }
}

export const stateStore = new StateStore();
