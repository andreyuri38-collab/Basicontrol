import express from 'express';
import { DiaryController } from '../controllers/DiaryController.ts';

const router = express.Router();

router.get('/', DiaryController.index);
router.post('/', DiaryController.store);
router.get('/:date', DiaryController.show);

export default router;
