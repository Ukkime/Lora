// src/players/Player.ts
import { Deck } from "./Deck";
import { Hand } from "./Hand";
import { Card } from "../cards/Card";
import { ManaColor, Zone } from "../../types/enums";
import { ManaCost } from "../../types/interfaces";

/**
 * Representa un jugador en el juego.
 */
export class Player {
  public readonly id: string;
  public name: string;
  public life: number;
  public deck: Deck;
  public hand: Hand;
  public graveyard: Card[] = [];
  public battlefield: Card[] = []; // Cartas en juego
  public manaPool: ManaCost = {}; // Maná disponible actualmente

  constructor(id: string, name: string, deckList: Card[]) {
    this.id = id;
    this.name = name;
    this.life = 20; // Vida inicial típica de Magic
    this.deck = new Deck(deckList);
    this.hand = new Hand();
    // Inicializa el manaPool a 0 para todos los colores
    Object.values(ManaColor).forEach((color) => (this.manaPool[color] = 0));
  }

  public takeDamage(amount: number): void {
    this.life -= amount;
    console.log(
      `${this.name} recibe ${amount} de daño. Vida restante: ${this.life}.`
    );
    if (this.life <= 0) {
      console.log(`${this.name} ha sido derrotado.`);
      // Lógica de fin de juego
    }
  }

  public drawCard(): Card | undefined {
    const card = this.deck.drawCard();
    if (card) {
      this.hand.addCard(card);
      console.log(`${this.name} roba "${card.name}".`);
    } else {
      // Regla de "decking out" en Magic: pierdes el juego si intentas robar de un mazo vacío.
      console.log(
        `${this.name} no puede robar más cartas. ¡Ha perdido el juego por 'decking out'!');`
      );
      this.life = 0; // O la lógica que decidas para perder el juego
    }
    return card;
  }

  /**
   * Añade maná al pozo de maná del jugador.
   * @param color El color del maná a añadir.
   * @param amount La cantidad de maná a añadir.
   */
  public addMana(color: ManaColor, amount: number): void {
    this.manaPool[color] = (this.manaPool[color] || 0) + amount;
    console.log(
      `${
        this.name
      } añade ${amount} ${color} maná. Pozo de maná: ${JSON.stringify(
        this.manaPool
      )}`
    );
  }

  /**
   * Gasta maná del pozo de maná del jugador.
   * Retorna true si el maná se pudo gastar, false en caso contrario.
   * @param cost El coste de maná a pagar.
   */
  public payManaCost(cost: ManaCost): boolean {
    let canPay = true;
    let tempManaPool = { ...this.manaPool }; // Copia para simular el pago

    // Primero intenta pagar el maná incoloro
    let colorlessNeeded = cost.Colorless || 0;
    let availableColorless = 0;
    for (const color of Object.values(ManaColor)) {
      if (color !== ManaColor.Colorless) {
        // El maná incoloro se puede pagar con cualquier color de maná
        availableColorless += tempManaPool[color] || 0;
      }
    }
    availableColorless += tempManaPool[ManaColor.Colorless] || 0;

    if (colorlessNeeded > availableColorless) {
      canPay = false; // No hay suficiente maná incoloro en total
    } else {
      // Prioridad para gastar maná incoloro de fuentes incoloras, luego de maná de colores
      // Esto es una simplificación. La gestión de maná en Magic es compleja (flexibilidad de maná de color para incoloro).
      if (
        tempManaPool[ManaColor.Colorless] &&
        tempManaPool[ManaColor.Colorless] >= colorlessNeeded
      ) {
        tempManaPool[ManaColor.Colorless]! -= colorlessNeeded;
        colorlessNeeded = 0;
      } else if (tempManaPool[ManaColor.Colorless]) {
        colorlessNeeded -= tempManaPool[ManaColor.Colorless]!;
        tempManaPool[ManaColor.Colorless] = 0;
      }

      // Gasta el resto del maná incoloro de maná de colores
      for (const color of Object.values(ManaColor)) {
        if (color !== ManaColor.Colorless && colorlessNeeded > 0) {
          const spent = Math.min(colorlessNeeded, tempManaPool[color] || 0);
          tempManaPool[color]! -= spent;
          colorlessNeeded -= spent;
        }
      }
    }

    // Luego intenta pagar los colores específicos
    for (const color of Object.values(ManaColor)) {
      if (color !== ManaColor.Colorless && cost[color]) {
        if ((tempManaPool[color] || 0) < cost[color]!) {
          canPay = false;
          break;
        }
        tempManaPool[color]! -= cost[color]!;
      }
    }

    if (canPay) {
      this.manaPool = tempManaPool; // Confirma el gasto
      console.log(
        `${this.name} paga ${JSON.stringify(
          cost
        )}. Nuevo pozo de maná: ${JSON.stringify(this.manaPool)}`
      );
      return true;
    } else {
      console.log(
        `${this.name} no tiene suficiente maná para pagar ${JSON.stringify(
          cost
        )}. Pozo de maná actual: ${JSON.stringify(this.manaPool)}`
      );
      return false;
    }
  }

  /**
   * Añade una carta al campo de batalla del jugador.
   * @param card La carta a añadir.
   */
  public addCardToBattlefield(card: Card): void {
    this.battlefield.push(card);
    card.moveTo(Zone.Battlefield);
    console.log(`${card.name} de ${this.name} entra al campo de batalla.`);
  }

  /**
   * Remueve una carta del campo de batalla del jugador y la mueve a una zona específica (ej. cementerio).
   * @param cardId El ID de la carta a remover.
   * @param destinationZone La zona a la que se moverá la carta (ej. Zone.Graveyard).
   */
  public removeCardFromBattlefield(
    cardId: string,
    destinationZone: Zone
  ): void {
    const index = this.battlefield.findIndex((c) => c.id === cardId);
    if (index > -1) {
      const card = this.battlefield.splice(index, 1)[0];
      card.moveTo(destinationZone);
      if (destinationZone === Zone.Graveyard) {
        this.graveyard.push(card);
      }
      console.log(
        `${card.name} de ${this.name} se mueve del campo de batalla a ${destinationZone}.`
      );
    }
  }

  /**
   * Restablece el pozo de maná a cero.
   * Ocurre al final de cada fase principal.
   */
  public clearManaPool(): void {
    Object.values(ManaColor).forEach((color) => (this.manaPool[color] = 0));
    console.log(`${this.name}'s maná pool cleared.`);
  }
}
