import { Router } from 'express';
import * as flowsController from '../controllers/flows.controller';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.get('/', flowsController.getAllFlows);
router.get('/:id', flowsController.getFlowById);
router.post('/', flowsController.createFlow);
router.put('/:id', flowsController.updateFlow);
router.delete('/:id', flowsController.deleteFlow);
router.post('/:id/activate', flowsController.activateFlow);
router.post('/:id/deactivate', flowsController.deactivateFlow);
router.post('/:id/validate', flowsController.validateFlow);
router.get('/:id/analytics', analyticsController.getFlowAnalytics);

export default router;
