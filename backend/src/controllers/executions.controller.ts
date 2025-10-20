import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/http';
import { memoryStore } from '../repositories/memoryStore';
import { NotFoundError } from '../utils/errors';

export const getExecutionById = asyncHandler(async (req: Request, res: Response) => {
  const execution = memoryStore.getExecutionById(req.params.runId);
  
  if (!execution) {
    throw new NotFoundError(`Execution with id '${req.params.runId}' not found`);
  }
  
  res.json({ data: execution });
});

export const getExecutionsByFlowId = asyncHandler(async (req: Request, res: Response) => {
  const executions = memoryStore.getExecutionsByFlowId(req.params.flowId);
  res.json({ data: executions });
});
