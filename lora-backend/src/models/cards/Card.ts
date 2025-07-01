// src/models/Card.ts
import { ManaCost, CardAbility } from "../../types/interfaces";
import { CardType, Zone, CardState } from "../../types/enums";
import { Player } from "../players/Player"; // Asegúrate de que la ruta de importación sea correcta

/**
 * Clase base abstracta para todas las cartas en el juego.
 * Define propiedades y comportamientos comunes a todas las cartas,
 * y métodos abstractos que deben ser implementados por sus subclases.
 */
export abstract class Card {
  // Propiedades fundamentales de una carta, inmutables una vez creadas
  public readonly id: string; // Identificador único de la carta (ej. "grizzly_bears_1")
  public name: string; // Nombre visible de la carta (ej. "Grizzly Bears")
  public manaCost: ManaCost; // Coste de maná para jugar la carta (objeto ManaCost)
  public types: CardType[]; // Tipos de la carta (ej. [CardType.Creature, CardType.Spirit])
  public text: string; // Texto de reglas de la carta (flavor text, habilidades, etc.)

  // Propiedades del estado de la carta en el juego
  public owner: Player; // El jugador propietario original de la carta
  public currentZone: Zone; // La zona actual donde se encuentra la carta (mano, mazo, campo, etc.)
  public state: CardState; // Estado de la carta en el campo de batalla (enderezada/girada), solo si aplica

  /**
   * Constructor de la clase base Card.
   * @param id Identificador único de la carta.
   * @param name Nombre de la carta.
   * @param manaCost Coste de maná de la carta.
   * @param types Array de tipos de la carta (usando el enum CardType).
   * @param text Texto de reglas/lore de la carta.
   * @param owner El jugador que es el propietario original de esta carta.
   */
  constructor(
    id: string,
    name: string,
    manaCost: ManaCost,
    types: CardType[], // Ahora acepta un array de CardType
    text: string,
    owner: Player // Se requiere un jugador 'owner' (puede ser un dummy al inicio si la instancia real no existe)
  ) {
    this.id = id;
    this.name = name;
    this.manaCost = manaCost;
    this.types = types;
    this.text = text;
    this.owner = owner; // Asignación del propietario
    this.currentZone = Zone.Library; // Por defecto, las cartas se crean en el mazo (Library)
    this.state = CardState.Untapped; // Por defecto, enderezada (útil para permanentes)
  }

  /**
   * Mueve la carta a una nueva zona del juego.
   * Este método actualiza la propiedad `currentZone` de la carta.
   * @param newZone La nueva zona a la que se mueve la carta.
   */
  public moveTo(newZone: Zone): void {
    if (this.currentZone !== newZone) {
      console.log(
        `${this.name} (ID: ${this.id}) se mueve de ${this.currentZone} a ${newZone}.`
      );
      this.currentZone = newZone;
      // Aquí podrías añadir lógica adicional:
      // - Si sale del campo de batalla, limpiar contadores, efectos, etc.
      // - Si entra al campo de batalla, disparar habilidades "entra al campo de batalla".
    }
  }

  /**
   * Devuelve una representación legible del coste de maná de la carta.
   * Por ejemplo, `{C: 1, G: 1}` se convierte en `{C:1}{G:1}`.
   * @returns Una cadena que representa el coste de maná.
   */
  public getManaCostString(): string {
    let costString = "";
    if (this.manaCost) {
      for (const color in this.manaCost) {
        if (
          this.manaCost.hasOwnProperty(color) &&
          this.manaCost[color as keyof ManaCost] !== undefined
        ) {
          costString += `{${color}:${this.manaCost[color as keyof ManaCost]}}`;
        }
      }
    }
    return costString || "{0}"; // Retorna '{0}' si no tiene coste
  }

  /**
   * Gira la carta. Se usa típicamente para indicar que un permanente (criatura, tierra)
   * ha sido usado (ej., para atacar o producir maná).
   */
  public tap(): void {
    // Solo se puede girar si está en el campo de batalla y no está ya girada
    if (
      this.currentZone === Zone.Battlefield &&
      this.state === CardState.Untapped
    ) {
      this.state = CardState.Tapped;
      console.log(`${this.name} (ID: ${this.id}) se gira.`);
    } else {
      console.log(
        `${this.name} no se puede girar (no está en juego o ya está girada).`
      );
    }
  }

  /**
   * Endereza la carta. Ocurre al principio de cada turno para los permanentes.
   */
  public untap(): void {
    // Solo se puede enderezar si está en el campo de batalla y está girada
    if (
      this.currentZone === Zone.Battlefield &&
      this.state === CardState.Tapped
    ) {
      this.state = CardState.Untapped;
      console.log(`${this.name} (ID: ${this.id}) se endereza.`);
    } else {
      // console.log(`${this.name} no necesita enderezarse (no está en juego o ya está enderezada).`);
    }
  }

  /**
   * Método abstracto que determina si una carta puede ser jugada por un jugador.
   * Las subclases (Criatura, Tierra, Hechizo) deben implementar su propia lógica.
   * @param player El jugador que intenta jugar la carta.
   * @returns `true` si la carta puede ser jugada, `false` en caso contrario.
   */
  public abstract canBePlayed(player: Player): boolean;

  /**
   * Método abstracto que define la lógica que ocurre cuando la carta es "jugada" (lanzada o puesta en el campo).
   * Las subclases implementarán el comportamiento específico al jugarse.
   * @param player El jugador que juega la carta.
   */
  public abstract play(player: Player): void;
}
