// src/controllers/deckController.ts
import { Request, Response } from 'express';
import { query, run } from '../db';

// Get all decks for the authenticated user
export const getUserDecks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const decks = await query('SELECT id, name, cards_json, created_at, updated_at FROM decks WHERE user_id = ?', [userId]);
    // Mapea cada mazo para devolver cards como array
    const decksMapped = decks.map((deck: any) => ({
      ...deck,
      cards: deck.cards_json ? JSON.parse(deck.cards_json) : [],
      cards_json: undefined
    }));
    res.json(decksMapped);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los mazos', error: err });
  }
};

// Get a specific deck by id (only if belongs to user)
export const getDeckById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = req.params.id;
    const decks = await query('SELECT id, name, cards_json, created_at, updated_at FROM decks WHERE id = ? AND user_id = ?', [deckId, userId]);
    if (decks.length === 0) {
      return res.status(404).json({ message: 'Mazo no encontrado' });
    }
    const deck = decks[0];
    res.json({
      ...deck,
      cards: deck.cards_json ? JSON.parse(deck.cards_json) : [],
      cards_json: undefined
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el mazo', error: err });
  }
};

// Create a new deck
export const createDeck = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, cards } = req.body;
    if (!name || !Array.isArray(cards)) {
      return res.status(400).json({ message: 'Nombre y cartas requeridos' });
    }
    const cardsJson = JSON.stringify(cards);
    const result = await run('INSERT INTO decks (user_id, name, cards_json) VALUES (?, ?, ?)', [userId, name, cardsJson]);
    res.status(201).json({
      id: result.insertId || result.lastID,
      name,
      cards,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear el mazo', error: err });
  }
};

// Update an existing deck
export const updateDeck = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = req.params.id;
    const { name, cards } = req.body;
    if (!name || !Array.isArray(cards)) {
      return res.status(400).json({ message: 'Nombre y cartas requeridos' });
    }
    // Only update if deck belongs to user
    const decks = await query('SELECT id FROM decks WHERE id = ? AND user_id = ?', [deckId, userId]);
    if (decks.length === 0) {
      return res.status(404).json({ message: 'Mazo no encontrado' });
    }
    const cardsJson = JSON.stringify(cards);
    await run('UPDATE decks SET name = ?, cards_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, cardsJson, deckId]);
    res.json({ id: deckId, name, cards });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el mazo', error: err });
  }
};

// Delete a deck
export const deleteDeck = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deckId = req.params.id;
    // Only delete if deck belongs to user
    const decks = await query('SELECT id FROM decks WHERE id = ? AND user_id = ?', [deckId, userId]);
    if (decks.length === 0) {
      return res.status(404).json({ message: 'Mazo no encontrado' });
    }
    await run('DELETE FROM decks WHERE id = ?', [deckId]);
    res.json({ message: 'Mazo eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el mazo', error: err });
  }
};
