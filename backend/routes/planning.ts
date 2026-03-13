import { Router } from 'express';
import { PlanningController } from '../controllers/PlanningController';

const router = Router();

router.get('/', PlanningController.index);
router.post('/', PlanningController.store);
router.put('/:id', PlanningController.update);
router.delete('/:id', PlanningController.destroy);
router.get('/forecasts', PlanningController.forecasts);

export default router;
