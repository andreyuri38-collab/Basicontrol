import { Router } from 'express';
import { EmployeeController } from '../controllers/EmployeeController';

const router = Router();

router.get('/', EmployeeController.index);
router.get('/next-code', EmployeeController.getNextCode);
router.post('/import', EmployeeController.import);
router.post('/:id/terminate', EmployeeController.terminate);

export default router;
