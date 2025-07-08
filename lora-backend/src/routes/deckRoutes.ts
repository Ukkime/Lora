// src/routes/deckRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getUserDecks, getDeckById, createDeck, updateDeck, deleteDeck } from '../controllers/deckController';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserDecks); // GET /api/decks
router.get('/:id', getDeckById); // GET /api/decks/:id
router.post('/', createDeck); // POST /api/decks
router.put('/:id', updateDeck); // PUT /api/decks/:id
router.delete('/:id', deleteDeck); // DELETE /api/decks/:id

export default router;
