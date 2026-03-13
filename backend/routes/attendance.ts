import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController';

const router = Router();

router.get('/', AttendanceController.index);
router.post('/medical-certificate', AttendanceController.registerMedicalCertificate);

export default router;
