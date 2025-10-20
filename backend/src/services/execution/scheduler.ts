import { logger } from '../../logger/logger';

type ScheduledTask = {
  runId: string;
  nodeId: string;
  callback: () => void;
};

class Scheduler {
  private timers = new Map<string, NodeJS.Timeout>();

  schedule(runId: string, nodeId: string, delayMs: number, callback: () => void): void {
    const key = `${runId}:${nodeId}`;
    
    logger.info(`Scheduling node ${nodeId} in ${delayMs}ms`);
    
    const timer = setTimeout(() => {
      this.timers.delete(key);
      callback();
    }, delayMs);

    this.timers.set(key, timer);
  }

  cancel(runId: string, nodeId: string): void {
    const key = `${runId}:${nodeId}`;
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  cancelAll(runId: string): void {
    for (const [key, timer] of this.timers.entries()) {
      if (key.startsWith(`${runId}:`)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }
}

export const scheduler = new Scheduler();
