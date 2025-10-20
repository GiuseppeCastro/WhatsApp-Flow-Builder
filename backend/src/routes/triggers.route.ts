import { Router } from 'express';
import * as triggersController from '../controllers/triggers.controller';

const router = Router();

router.post('/:flowId', triggersController.triggerFlow);

export default router;
