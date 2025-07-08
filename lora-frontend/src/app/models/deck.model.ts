// src/app/models/deck.model.ts
import { Card } from './card.model';

export interface Deck {
  id?: number;
  name: string;
  cards: Card[];
  created_at?: string;
  updated_at?: string;
}
