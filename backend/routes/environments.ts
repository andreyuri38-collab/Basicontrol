import { Router } from 'express';
import { EnvironmentController } from '../controllers/EnvironmentController';

const router = Router();

router.get('/', EnvironmentController.index);
router.get('/flowchart', EnvironmentController.getFlowchart);
router.post('/', EnvironmentController.store);
router.put('/:id', EnvironmentController.update);

export default router;
