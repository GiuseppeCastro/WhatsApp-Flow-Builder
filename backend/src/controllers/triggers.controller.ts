import type { Request, Response } from 'express';
import { TriggerPayloadSchema } from '../types/schemas';
import { asyncHandler } from '../utils/http';
import { flowsService } from '../services/flows.service';
import { executionEngine } from '../services/execution/engine';
import { BadRequestError } from '../utils/errors';

export const triggerFlow = asyncHandler(async (req: Request, res: Response) => {
  const flowId = req.params.flowId;
  
  // Validate payload
  const parseResult = TriggerPayloadSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError('Invalid trigger payload', parseResult.error.errors);
  }

  const flow = flowsService.getFlowById(flowId);
  
  if (!flow.active) {
    throw new BadRequestError('Flow is not active');
  }

  const runId = await executionEngine.startRun(flow, parseResult.data);
  
  res.json({ data: { runId } });
});
