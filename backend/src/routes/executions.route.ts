import { Router } from 'express';
import * as executionsController from '../controllers/executions.controller';

const router = Router();

router.get('/:runId', executionsController.getExecutionById);
router.get('/flow/:flowId', executionsController.getExecutionsByFlowId);

export default router;
