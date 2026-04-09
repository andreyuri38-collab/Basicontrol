import express from 'express';
import { EmployeeController } from '../controllers/EmployeeController.ts';

const router = express.Router();

router.get('/', EmployeeController.index);
router.get('/next-code', EmployeeController.getNextCode);
router.post('/import', EmployeeController.import);
router.post('/:id/terminate', EmployeeController.terminate);

export default router;
