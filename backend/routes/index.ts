import express from 'express';
import planningRoutes from './planning.ts';
import financialRoutes from './financial.ts';
import diaryRoutes from './diary.ts';
import employeeRoutes from './employees.ts';
import attendanceRoutes from './attendance.ts';
import environmentRoutes from './environments.ts';
import serviceRoutes from './services.ts';
import { MaterialController } from '../controllers/MaterialController.ts';

const router = express.Router();

router.use('/planning', planningRoutes);
router.use('/financial', financialRoutes);
router.use('/diary', diaryRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/environments', environmentRoutes);
router.use('/services', serviceRoutes);
router.get('/material/requirements', MaterialController.requirements);

export default router;
