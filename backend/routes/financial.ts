import express from 'express';
import { FinancialController } from '../controllers/FinancialController.ts';

const router = express.Router();

router.get('/expenses', FinancialController.index);
router.post('/expenses', FinancialController.store);
router.get('/dashboard', FinancialController.dashboard);

export default router;
