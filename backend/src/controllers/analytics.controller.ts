import type { Request, Response } from 'express';
import { flowsService } from '../services/flows.service';
import { asyncHandler } from '../utils/http';

export const getFlowAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = flowsService.getFlowAnalytics(req.params.id);
  res.json({ data: analytics });
});
