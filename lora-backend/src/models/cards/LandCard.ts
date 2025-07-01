// src/cards/LandCard.ts
import { Card } from "./Card";
import { ManaColor } from "../../types/enums";
import { Player } from "../players/Player";
import { CardType } from "../../types/enums";
import { CardState, Zone } from "../../types/enums";

/**
 * Representa una carta de Tierra (Land).
 */
export class LandCard extends Card {
  public providesMana: ManaColor;

    constructor(id: string, name: string, owner: Player, providesMana: ManaColor) {
        // Pass CardType.Land as an array to the super constructor
        super(id, name, {}, [CardType.Land], `Tap to add one ${providesMana} mana.`, owner);
        this.providesMana = providesMana;
    }

  /**
   * Lógica para determinar si la tierra puede ser jugada.
   * Las tierras tienen reglas especiales.
   */
  public canBePlayed(player: Player): boolean {
    // En Magic, solo se puede jugar una tierra por turno (salvo excepciones).
    // Aquí verificarías si el jugador ya jugó una tierra este turno.
    console.log(
      `Verificando si ${this.name} puede ser jugada por ${player.name}.`
    );
    // Asumimos que sí por ahora.
    return true;
  }

  /**
   * Lógica cuando la tierra es jugada.
   */
  public play(player: Player): void {
    if (this.canBePlayed(player)) {
      console.log(`${player.name} juega ${this.name}.`);
      this.moveTo(Zone.Battlefield);
      // Marcar que el jugador ya jugó una tierra este turno
    } else {
      console.log(
        `¡${player.name} no puede jugar ${this.name} en este momento!`
      );
    }
  }

  /**
   * Activa la habilidad de la tierra para producir maná.
   */
  public produceMana(player: Player): void {
    if (
      this.currentZone === Zone.Battlefield &&
      this.state === CardState.Untapped
    ) {
      this.tap(); // Gira la tierra para producir maná
      player.addMana(this.providesMana, 1);
      console.log(
        `${this.name} produce un maná ${this.providesMana} para ${player.name}.`
      );
    } else {
      console.log(
        `${this.name} no puede producir maná ahora mismo (no está en juego o ya está girada).`
      );
    }
  }
}
