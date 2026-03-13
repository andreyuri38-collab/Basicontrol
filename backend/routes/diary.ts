import { Router } from 'express';
import { DiaryController } from '../controllers/DiaryController';

const router = Router();

router.get('/', DiaryController.index);
router.post('/', DiaryController.store);
router.get('/:date', DiaryController.show);

export default router;
