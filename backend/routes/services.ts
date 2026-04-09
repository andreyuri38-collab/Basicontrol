import express from 'express';
import { ServiceController } from '../controllers/ServiceController.ts';

const router = express.Router();

router.get('/', ServiceController.index);
router.post('/', ServiceController.store);
router.put('/:id', ServiceController.update);
router.delete('/:id', ServiceController.destroy);

export default router;
