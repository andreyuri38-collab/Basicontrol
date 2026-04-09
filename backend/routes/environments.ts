import express from 'express';
import { EnvironmentController } from '../controllers/EnvironmentController.ts';

const router = express.Router();

router.get('/', EnvironmentController.index);
router.get('/flowchart', EnvironmentController.getFlowchart);
router.post('/', EnvironmentController.store);
router.put('/:id', EnvironmentController.update);

export default router;
