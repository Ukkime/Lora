// src/players/Player.ts
import { Deck } from "./Deck";
import { Hand } from "./Hand";
import { Card } from "../cards/Card"; // La ruta debe ser a ../models/Card
import { ManaColor, Zone } from "../../types/enums";
import { ManaCost } from "../../types/interfaces";
import { cardService } from "../../services/cardService"; // NEW: Importar cardService para instanciar cartas
import { CardJsonData } from "../../services/cardService"; // NEW: Importar la interfaz de datos JSON

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

  // --- NEW: Propiedades para la gestión de cartas del jugador ---
  // Esto representaría la colección total de cartas que el jugador "posee".
  // En un juego real, esto se cargaría de una base de datos o perfil de usuario.
  // Por ahora, será una lista de CardJsonData (definiciones crudas).
  public availableCardCollection: CardJsonData[];

  // Esto representaría el mazo que el jugador ha "seleccionado" de su colección para la partida actual.
  // Es una lista de IDs de cartas, no de instancias de Card.
  public selectedDeckListIds: string[];
  // --- FIN NEW ---

  constructor(
    id: string,
    name: string,
    // Eliminamos deckList: Card[] del constructor del Player,
    // ya que el mazo ahora se construirá a partir de selectedDeckListIds
    // y availableCardCollection
    initialAvailableCards: CardJsonData[] = [], // NEW: La colección de cartas que posee el jugador
    initialSelectedDeckIds: string[] = [] // NEW: IDs de las cartas elegidas para el mazo
  ) {
    this.id = id;
    this.name = name;
    this.life = 20; // Vida inicial típica de Magic
    this.hand = new Hand();
    this.graveyard = [];
    this.battlefield = [];
    this.manaPool = {};

    this.availableCardCollection = initialAvailableCards;
    this.selectedDeckListIds = initialSelectedDeckIds;

    // El mazo inicial se construye con un array vacío.
    // Se llenará cuando se llame a buildDeckForGame().
    this.deck = new Deck([]);

    // Inicializa el manaPool a 0 para todos los colores
    Object.values(ManaColor).forEach((color) => (this.manaPool[color] = 0));
  }

  /**
   * NEW METHOD: Construye el mazo de juego del jugador a partir de los IDs de cartas seleccionados.
   * Instancia las cartas reales y las asigna a su mazo.
   * Debe llamarse ANTES de que el juego comience y se robe la mano inicial.
   * @returns `true` si el mazo se construyó con éxito, `false` si hay errores (ej. cartas no encontradas).
   */
  public buildDeckForGame(): boolean {
    const actualDeckCards: Card[] = [];
    const missingCards: string[] = [];

    // Por cada ID de carta en el mazo seleccionado:
    for (const cardId of this.selectedDeckListIds) {
      const cardData = cardService.getCardDefinitionById(cardId); // Obtiene la definición JSON
      if (cardData) {
        // Instancia la carta usando el cardService y asignándose a sí mismo como owner
        const instantiatedCard = cardService.instantiateCard(cardData, this);
        actualDeckCards.push(instantiatedCard);
      } else {
        missingCards.push(cardId);
        console.warn(
          `[${this.name}] Carta con ID '${cardId}' no encontrada en las definiciones de cardService. No se añadió al mazo.`
        );
      }
    }

    if (missingCards.length > 0) {
      console.error(
        `[${
          this.name
        }] Advertencia: No se pudieron construir las siguientes cartas en el mazo: ${missingCards.join(
          ", "
        )}`
      );
      // Decide si esto es un error fatal (return false) o si el juego puede continuar con un mazo incompleto.
      // Para Magic, un mazo no válido debería impedir el inicio del juego.
      return false;
    }

    this.deck = new Deck(actualDeckCards); // Crea el objeto Deck con las cartas instanciadas
    console.log(`[${this.name}] Mazo construido con ${this.deck.size} cartas.`);
    return true;
  }

  /**
   * NEW METHOD: Establece la colección completa de cartas que el jugador posee.
   * @param cardsData Array de CardJsonData representando la colección.
   */
  public setAvailableCardCollection(cardsData: CardJsonData[]): void {
    this.availableCardCollection = cardsData;
    console.log(
      `[${this.name}] Colección disponible actualizada con ${cardsData.length} cartas.`
    );
  }

  /**
   * NEW METHOD: Establece la lista de IDs de cartas que el jugador ha elegido para su mazo actual.
   * @param cardIds Array de IDs de cartas.
   */
  public setSelectedDeck(cardIds: string[]): void {
    // Validación básica: asegura que todos los IDs existen en la colección disponible.
    const validIds = cardIds.filter((id) =>
      this.availableCardCollection.some((card) => card.id === id)
    );
    if (validIds.length !== cardIds.length) {
      console.warn(
        `[${this.name}] Algunos IDs de cartas seleccionados no están en la colección disponible. Se ignorarán.`
      );
    }
    this.selectedDeckListIds = validIds;
    console.log(
      `[${this.name}] Mazo seleccionado con ${validIds.length} cartas.`
    );
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
      console.log(
        `${this.name} no puede robar más cartas. ¡Ha perdido el juego por 'decking out'!');`
      );
      this.life = 0;
    }
    return card;
  }

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

  public payManaCost(cost: ManaCost): boolean {
    let canPay = true;
    let tempManaPool = { ...this.manaPool };

    let colorlessNeeded = cost.Colorless || 0;
    let availableColorless = 0;
    for (const color of Object.values(ManaColor)) {
      if (color !== ManaColor.Colorless) {
        availableColorless += tempManaPool[color] || 0;
      }
    }
    availableColorless += tempManaPool[ManaColor.Colorless] || 0;

    if (colorlessNeeded > availableColorless) {
      canPay = false;
    } else {
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

      for (const color of Object.values(ManaColor)) {
        if (color !== ManaColor.Colorless && colorlessNeeded > 0) {
          const spent = Math.min(colorlessNeeded, tempManaPool[color] || 0);
          tempManaPool[color]! -= spent;
          colorlessNeeded -= spent;
        }
      }
    }

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
      this.manaPool = tempManaPool;
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

  public addCardToBattlefield(card: Card): void {
    this.battlefield.push(card);
    card.moveTo(Zone.Battlefield);
    console.log(`${card.name} de ${this.name} entra al campo de batalla.`);
  }

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

  public clearManaPool(): void {
    Object.values(ManaColor).forEach((color) => (this.manaPool[color] = 0));
    console.log(`${this.name}'s maná pool cleared.`);
  }
}
