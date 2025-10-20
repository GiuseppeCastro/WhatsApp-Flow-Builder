import type { Request, Response } from 'express';
import { flowsService } from '../services/flows.service';
import { asyncHandler } from '../utils/http';

export const getAllFlows = asyncHandler(async (req: Request, res: Response) => {
  const activeParam = req.query.active as string | undefined;
  let activeFilter: boolean | undefined;

  if (activeParam === 'true') {
    activeFilter = true;
  } else if (activeParam === 'false') {
    activeFilter = false;
  }

  const flows = flowsService.getAllFlows(activeFilter);
  res.json({ data: flows });
});

export const getFlowById = asyncHandler(async (req: Request, res: Response) => {
  const flow = flowsService.getFlowById(req.params.id);
  res.json({ data: flow });
});

export const createFlow = asyncHandler(async (req: Request, res: Response) => {
  const flow = flowsService.createFlow(req.body as { name: string });
  res.status(201).json({ data: flow });
});

export const updateFlow = asyncHandler(async (req: Request, res: Response) => {
  const flow = flowsService.updateFlow(req.params.id, req.body);
  res.json({ data: flow });
});

export const deleteFlow = asyncHandler(async (req: Request, res: Response) => {
  flowsService.deleteFlow(req.params.id);
  res.status(204).send();
});

export const activateFlow = asyncHandler(async (req: Request, res: Response) => {
  const flow = flowsService.activateFlow(req.params.id);
  res.json({ data: flow });
});

export const deactivateFlow = asyncHandler(async (req: Request, res: Response) => {
  const flow = flowsService.deactivateFlow(req.params.id);
  res.json({ data: flow });
});

export const validateFlow = asyncHandler(async (req: Request, res: Response) => {
  const result = flowsService.validateFlow(req.params.id);
  res.json({ data: result });
});
