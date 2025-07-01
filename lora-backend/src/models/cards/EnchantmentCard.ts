// src/models/EnchantmentCard.ts
import { Card } from "./Card";
import { ManaCost } from "../../types/interfaces";
import { CardType, Zone, CardState } from "../../types/enums";
import { Player } from "../players/Player";

/**
 * Representa una carta de Encantamiento.
 * Extiende la clase base `Card` como un tipo de permanente.
 * Los encantamientos pueden tener efectos continuos, habilidades activadas,
 * o ser "Encantamientos de Aura" que se adjuntan a otras cosas.
 */
export class EnchantmentCard extends Card {
  // Los encantamientos pueden tener propiedades específicas aquí si es necesario,
  // por ejemplo, si es un Aura, necesitaría una propiedad para el objetivo al que está encantando.

  /**
   * Constructor de la clase EnchantmentCard.
   * @param id Identificador único del encantamiento.
   * @param name Nombre del encantamiento.
   * @param manaCost Coste de maná del encantamiento.
   * @param types Array de tipos del encantamiento (ya incluirá CardType.Enchantment).
   * @param text Texto de reglas del encantamiento.
   * @param owner El jugador propietario original del encantamiento.
   */
  constructor(
    id: string,
    name: string,
    manaCost: ManaCost,
    types: CardType[], // Recibe el array de tipos del CardService
    text: string,
    owner: Player
  ) {
    // Llama al constructor de la clase base Card
    const enchantmentTypes = Array.from(
      new Set([...types, CardType.Enchantment])
    ); // Asegura que Enchantment esté en los tipos
    super(id, name, manaCost, enchantmentTypes, text, owner);

    this.state = CardState.Untapped; // Los encantamientos entran enderezados
  }

  /**
   * Determina si el encantamiento puede ser lanzado por el jugador.
   * @param player El jugador que intenta lanzar el encantamiento.
   * @returns `true` si puede ser lanzado, `false` en caso contrario.
   */
  public canBePlayed(player: Player): boolean {
    console.log(
      `Verificando si ${this.name} puede ser lanzado por ${player.name}.`
    );
    // Lógica similar a otros permanentes: Main Phase, maná, etc.
    return true;
  }

  /**
   * Lógica que ocurre cuando el encantamiento es lanzado y se resuelve.
   * Entra al campo de batalla.
   * @param player El jugador que juega el encantamiento.
   */
  public play(player: Player): void {
    player.addCardToBattlefield(this);
    this.moveTo(Zone.Battlefield);
    this.state = CardState.Untapped; // Entra enderezado
    console.log(`${this.name} de ${player.name} entra al campo de batalla.`);
    // Si es un Aura, aquí se adjuntaría a su objetivo
  }

  // Los encantamientos pueden tener sus propios métodos para aplicar efectos estáticos
  // o habilidades, pero la implementación de esos efectos es compleja y requeriría
  // un sistema de reglas más avanzado. Por ahora, solo entran al campo de batalla.
}
