// src/routes/cardRoutes.ts
import { Router } from 'express';
import * as cardController from '../controllers/cardController';

const router = Router();

router.get('/', cardController.getAllCards);
router.get('/:id', cardController.getCardById);
router.post('/', cardController.createCard);

export default router;
