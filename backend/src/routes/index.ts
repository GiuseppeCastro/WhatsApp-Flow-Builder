import { Router } from 'express';
import flowsRoute from './flows.route';
import triggersRoute from './triggers.route';
import executionsRoute from './executions.route';

const router = Router();

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

router.use('/flows', flowsRoute);
router.use('/triggers', triggersRoute);
router.use('/executions', executionsRoute);

export default router;
