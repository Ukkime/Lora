// src/models/PlaneswalkerCard.ts
import { Card } from "./Card"; // Importa la clase base Card
import { ManaCost } from "../../types/interfaces"; // Importa la interfaz ManaCost
import { CardType, Zone, CardState } from "../../types/enums"; // Importa los enums para tipos, zonas y estados
import { Player } from "../players/Player"; // Importa la clase Player para el propietario y la interacción con el juego

/**
 * Define una habilidad de lealtad de Planeswalker.
 * Los planeswalkers tienen habilidades que añaden (+) o quitan (-) lealtad,
 * o que fijan la lealtad a un número específico (aunque 'X' es más común para coste variable).
 */
export interface LoyaltyAbility {
  cost: number | "X"; // El coste de lealtad (ej., +1, -3, -X, o una definitiva como -12)
  type: "plus" | "minus" | "ultimate"; // Tipo de habilidad (sumar lealtad, restar lealtad, o habilidad definitiva)
  name: string; // Nombre descriptivo de la habilidad (ej. "+1: Roba una carta.")
  description: string; // Texto de la habilidad que describe su efecto
  // Opcional: podrías añadir una función aquí para la lógica de la habilidad,
  // o un ID de habilidad para que el motor de juego la ejecute.
  // execute?: (game: Game, sourcePlaneswalker: PlaneswalkerCard, target?: any) => void;
}

/**
 * Representa una carta de Planeswalker.
 * Extiende la clase base `Card` añadiendo propiedades y comportamientos específicos
 * relacionados con la lealtad y las habilidades de Planeswalker.
 */
export class PlaneswalkerCard extends Card {
  public initialLoyalty: number; // La lealtad con la que el Planeswalker entra al campo de batalla.
  public currentLoyalty: number; // La cantidad actual de contadores de lealtad sobre el Planeswalker.
  public loyaltyAbilities: LoyaltyAbility[]; // Un array de las habilidades de lealtad del Planeswalker.

  /**
   * Constructor de la clase PlaneswalkerCard.
   * @param id Identificador único del Planeswalker.
   * @param name Nombre del Planeswalker.
   * @param manaCost Coste de maná para lanzar el Planeswalker.
   * @param types Array de tipos de la carta (asegúrate de que `CardType.Planeswalker` esté incluido).
   * @param text Texto de reglas y lore del Planeswalker.
   * @param owner El jugador propietario original del Planeswalker.
   * @param initialLoyalty La lealtad inicial del Planeswalker al entrar al campo de batalla.
   * @param loyaltyAbilities Las habilidades de lealtad que el Planeswalker puede activar.
   */
  constructor(
    id: string,
    name: string,
    manaCost: ManaCost,
    types: CardType[], // Recibe el array de tipos del CardService
    text: string,
    owner: Player,
    initialLoyalty: number,
    loyaltyAbilities: LoyaltyAbility[] = [] // Por defecto, se inicializa como un array vacío si no se proporciona
  ) {
    // Llama al constructor de la clase base `Card`.
    // Nos aseguramos de que `CardType.Planeswalker` siempre esté entre sus tipos.
    const planeswalkerTypes = Array.from(
      new Set([...types, CardType.Planeswalker])
    );
    super(id, name, manaCost, planeswalkerTypes, text, owner);

    this.initialLoyalty = initialLoyalty;
    this.currentLoyalty = initialLoyalty; // La lealtad actual se inicializa con la lealtad inicial.
    this.loyaltyAbilities = loyaltyAbilities;
    this.state = CardState.Untapped; // Los Planeswalkers entran enderezados.
  }

  /**
   * Determina si el Planeswalker puede ser lanzado (jugado) por el jugador.
   * @param player El jugador que intenta lanzar el Planeswalker.
   * @returns `true` si el Planeswalker puede ser lanzado, `false` en caso contrario.
   */
  public canBePlayed(player: Player): boolean {
    // Lógica de lanzamiento de Planeswalkers (similar a otros permanentes):
    // - Debe ser durante la Main Phase del controlador.
    // - El jugador debe tener el maná suficiente.
    // - El stack debe estar en un estado apropiado (generalmente vacío para los conjuros).
    // - Considerar las restricciones adicionales que pueda tener la carta.
    console.log(
      `Verificando si ${this.name} puede ser lanzado por ${player.name}.`
    );
    // La lógica completa de validación de maná y fase se maneja en el GameService/Game.
    return true;
  }

  /**
   * Lógica que ocurre cuando el hechizo de Planeswalker se resuelve desde la pila
   * y entra al campo de batalla.
   * @param player El jugador que controla el Planeswalker.
   */
  public play(player: Player): void {
    // Añade el Planeswalker al campo de batalla del jugador.
    player.addCardToBattlefield(this);
    this.moveTo(Zone.Battlefield); // Actualiza la zona de la carta a 'Battlefield'.
    this.state = CardState.Untapped; // Se asegura de que entre enderezado.
    this.currentLoyalty = this.initialLoyalty; // Restablece la lealtad actual a la inicial.
    console.log(
      `${this.name} de ${player.name} entra al campo de batalla con ${this.currentLoyalty} contadores de lealtad.`
    );
  }

  /**
   * Modifica la cantidad de contadores de lealtad en el Planeswalker.
   * Si la lealtad cae a 0 o menos, el Planeswalker es enviado al cementerio.
   * @param amount La cantidad de contadores de lealtad a añadir (si es positivo) o quitar (si es negativo).
   */
  public modifyLoyalty(amount: number): void {
    this.currentLoyalty += amount;
    console.log(
      `${this.name} ${amount > 0 ? "gana" : "pierde"} ${Math.abs(
        amount
      )} lealtad. Lealtad actual: ${this.currentLoyalty}.`
    );

    // Si la lealtad es 0 o menos, el Planeswalker es destruido.
    if (this.currentLoyalty <= 0) {
      console.log(
        `${this.name} tiene 0 o menos lealtad y es puesto en el cementerio de ${this.owner.name}.`
      );
      // El Planeswalker se remueve del campo de batalla de su controlador y va al cementerio de su propietario.
      this.owner.removeCardFromBattlefield(this.id, Zone.Graveyard);
    }
  }

  /**
   * Activa una habilidad de lealtad específica del Planeswalker.
   * @param ability La habilidad de lealtad a activar (objeto `LoyaltyAbility`).
   * @returns `true` si la habilidad se activó con éxito, `false` en caso contrario.
   */
  public activateLoyaltyAbility(ability: LoyaltyAbility): boolean {
    // En un juego de Magic real, hay reglas adicionales:
    // - Un Planeswalker solo puede activar una habilidad de lealtad por turno.
    // - Las habilidades de lealtad son habilidades activadas que usan la pila.

    let hasEnoughLoyalty = false;
    let loyaltyChangeAmount = 0; // Cantidad numérica de cambio de lealtad

    // Manejo del coste de lealtad
    if (typeof ability.cost === "number") {
      switch (ability.type) {
        case "plus":
          // Las habilidades de suma de lealtad siempre se pueden activar si la prioridad es correcta.
          hasEnoughLoyalty = true;
          loyaltyChangeAmount = ability.cost;
          break;
        case "minus":
        case "ultimate":
          // Para habilidades de resta o definitivas, se necesita suficiente lealtad actual.
          hasEnoughLoyalty = this.currentLoyalty >= ability.cost;
          loyaltyChangeAmount = -ability.cost; // El coste de lealtad se resta.
          break;
      }
    } else {
      // Caso donde `ability.cost` es 'X'
      // Las habilidades con coste 'X' implican que el jugador elige un valor para X.
      // Nuestro modelo actual no soporta la entrada dinámica de 'X' aquí.
      // Para esta simulación, asumimos que no se puede activar directamente sin un valor numérico.
      hasEnoughLoyalty = false;
      console.warn(
        `[${this.name}] Habilidad de lealtad '${ability.name}' tiene coste 'X'. Este modelo simplificado no soporta costes 'X' directamente aquí. Requiere entrada del jugador.`
      );
    }

    if (hasEnoughLoyalty) {
      this.modifyLoyalty(loyaltyChangeAmount); // Aplica el cambio de lealtad.
      console.log(
        `${this.owner.name} activa la habilidad de ${this.name}: "${ability.description}"`
      );
      // Aquí iría la llamada a la lógica real que ejecuta el efecto de la habilidad.
      // Por ejemplo: game.executeAbilityEffect(ability.name, this, target);
      return true;
    } else {
      console.log(
        `No hay suficiente lealtad (${this.currentLoyalty}) para activar la habilidad "${ability.name}" (coste ${ability.cost}).`
      );
      return false;
    }
  }
}
