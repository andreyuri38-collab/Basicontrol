import { Router } from 'express';
import planningRoutes from './planning';
import financialRoutes from './financial';
import diaryRoutes from './diary';
import employeeRoutes from './employees';
import attendanceRoutes from './attendance';
import environmentRoutes from './environments';
import serviceRoutes from './services';
import { MaterialController } from '../controllers/MaterialController';

const router = Router();

router.use('/planning', planningRoutes);
router.use('/financial', financialRoutes);
router.use('/diary', diaryRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/environments', environmentRoutes);
router.use('/services', serviceRoutes);
router.get('/material/requirements', MaterialController.requirements);

export default router;
