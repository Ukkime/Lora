// src/models/SpellCard.ts
import { Card } from "./Card";
import { ManaCost } from "../../types/interfaces";
import { CardType, Zone } from "../../types/enums";
import { Player } from "../players/Player";

/**
 * Representa una carta de Hechizo (Instantáneo o Conjuro).
 */
export class SpellCard extends Card {
  // Puedes añadir propiedades específicas para hechizos aquí, como efectos, etc.

  constructor(
    id: string,
    name: string,
    manaCost: ManaCost,
    types: CardType[], // Accept types here
    text: string,
    owner: Player
    // Puedes añadir aquí si es instantáneo o conjuro si esa distinción es importante para la lógica
    // subType: 'Instant' | 'Sorcery' = 'Sorcery'
  ) {
    // Por simplicidad, todos los SpellCard serán de tipo Instant.
    // Puedes refinar esto si quieres distinguir entre Instant y Sorcery.
    super(id, name, manaCost, types, text, owner);
  }

  /**
   * Los hechizos no entran al campo de batalla (normalmente), se resuelven y van al cementerio.
   * Esta implementación es una simplificación.
   */
  public play(player: Player): void {
    if (this.canBePlayed(player)) {
      console.log(`${player.name} lanza ${this.name}.`);
      // Aquí iría la lógica para aplicar el efecto del hechizo
      // Por ejemplo, para Magic Bolt: player.takeDamage(3) o target.takeDamage(3)
      console.log(`Aplicando el efecto de ${this.name}: "${this.text}"`);
      this.moveTo(Zone.Graveyard); // Después de resolverse, va al cementerio
    } else {
      console.log(
        `¡${player.name} no puede lanzar ${this.name} en este momento!`
      );
    }
  }

  public canBePlayed(player: Player): boolean {
    // Lógica de coste de maná, fase, etc. (similar a otras cartas)
    // Por ahora, asumimos que sí.
    return true;
  }
}
