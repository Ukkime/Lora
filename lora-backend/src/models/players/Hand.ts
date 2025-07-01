// src/players/Hand.ts
import { Card } from "../cards/Card";
import { Zone } from "../../types/enums";

/**
 * Representa la mano de un jugador.
 */
export class Hand {
  private cards: Card[];

  constructor() {
    this.cards = [];
  }

  public addCard(card: Card): void {
    this.cards.push(card);
    card.moveTo(Zone.Hand);
    console.log(`Carta "${card.name}" añadida a la mano.`);
  }

  public removeCard(cardToRemove: Card): Card | undefined {
    const index = this.cards.findIndex((card) => card.id === cardToRemove.id);
    if (index > -1) {
      const removedCard = this.cards.splice(index, 1)[0];
      console.log(`Carta "${removedCard.name}" removida de la mano.`);
      return removedCard;
    }
    console.warn(`Carta "${cardToRemove.name}" no encontrada en la mano.`);
    return undefined;
  }

  public get cardsInHand(): Card[] {
    return [...this.cards]; // Devuelve una copia para evitar modificaciones externas directas
  }

  public get size(): number {
    return this.cards.length;
  }
}
