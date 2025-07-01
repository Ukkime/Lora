// src/players/Deck.ts
import { Card } from "../cards/Card";
import { Zone } from "../../types/enums";
import { Player } from "./Player"; // Import Player for typing the owner

/**
 * Representa el mazo de un jugador.
 */
export class Deck {
  private cards: Card[];

  // When the Deck is created, cards might initially have a dummy owner.
  // The real owner is assigned later when the actual Player object exists.
  constructor(cards: Card[]) {
    this.cards = cards;
    this.shuffle(); // A deck is always shuffled at the start
    // Initially, cards are in the library zone, but their owner might still be dummy.
    this.cards.forEach((card) => (card.currentZone = Zone.Library));
  }

  /**
   * Baraja las cartas del mazo.
   */
  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    console.log("Mazo barajado.");
  }

  /**
   * Roba una carta del mazo.
   * @returns La carta robada, o undefined si el mazo está vacío.
   */
  public drawCard(): Card | undefined {
    if (this.cards.length === 0) {
      console.log("El mazo está vacío.");
      return undefined;
    }
    const drawnCard = this.cards.shift(); // Quita la primera carta
    if (drawnCard) {
      drawnCard.moveTo(Zone.Hand); // Mueve la carta a la mano
    }
    return drawnCard;
  }

  public get size(): number {
    return this.cards.length;
  }

  public addCard(card: Card, toBottom: boolean = false): void {
    if (toBottom) {
      this.cards.push(card);
    } else {
      this.cards.unshift(card); // Añadir arriba
    }
    card.moveTo(Zone.Library);
  }

  /**
   * NEW METHOD: Assigns the actual Player owner to all cards currently in this deck.
   * This is called after the Player object itself has been fully created.
   * @param actualOwner The Player object that is the true owner of these cards.
   */
  public assignCardOwners(actualOwner: Player): void {
    this.cards.forEach((card) => {
      card.owner = actualOwner;
    });
    console.log(
      `Owner ${actualOwner.name} assigned to ${this.cards.length} cards in their deck.`
    );
  }

  /**
   * NEW METHOD: Provides a read-only view of the cards in the deck.
   * Use this if you need to iterate or inspect cards without modifying the internal array directly.
   */
  public get cardsInDeck(): ReadonlyArray<Card> {
    return this.cards;
  }
}
