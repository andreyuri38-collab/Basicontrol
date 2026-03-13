import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController';

const router = Router();

router.get('/expenses', FinancialController.index);
router.post('/expenses', FinancialController.store);
router.get('/dashboard', FinancialController.dashboard);

export default router;
