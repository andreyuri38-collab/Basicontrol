import express from 'express';
import { AttendanceController } from '../controllers/AttendanceController.ts';

const router = express.Router();

router.get('/', AttendanceController.index);
router.post('/medical-certificate', AttendanceController.registerMedicalCertificate);

export default router;
