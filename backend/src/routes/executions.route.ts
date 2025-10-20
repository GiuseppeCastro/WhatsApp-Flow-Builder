import { Router } from 'express';
import * as executionsController from '../controllers/executions.controller';

const router = Router();

router.get('/:flowId', executionsController.getExecutionsByFlowId);

export default router;
