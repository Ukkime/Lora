// src/models/CreatureCard.ts
import { Card } from "./Card"; // Importa la clase base Card
import { ManaCost } from "../../types/interfaces"; // Importa la interfaz ManaCost
import { CardType, Zone, CardState } from "../../types/enums"; // Importa los enums CardType, Zone, CardState
import { Player } from "../players/Player"; // Importa la clase Player para el propietario y la interacción

/**
 * Representa una carta de Criatura.
 * Extiende la clase base `Card` añadiendo propiedades y comportamientos específicos de criatura.
 */
export class CreatureCard extends Card {
  public power: number; // Poder de la criatura (daño que inflige)
  public toughness: number; // Resistencia de la criatura (daño que puede recibir antes de morir)
  public currentToughness: number; // Resistencia actual, para rastrear el daño recibido en un turno
  public hasSummoningSickness: boolean; // Indica si la criatura no puede atacar o usar habilidades de girar (habilidades con {T})

  /**
   * Constructor de la clase CreatureCard.
   * @param id Identificador único de la criatura.
   * @param name Nombre de la criatura.
   * @param manaCost Coste de maná de la criatura.
   * @param types Array de tipos de la criatura (ya incluirá CardType.Creature).
   * @param text Texto de reglas de la criatura.
   * @param owner El jugador propietario original de la criatura.
   * @param power El valor de poder inicial de la criatura.
   * @param toughness El valor de resistencia inicial de la criatura.
   */
  constructor(
    id: string,
    name: string,
    manaCost: ManaCost,
    types: CardType[], // Recibe el array de tipos del CardService
    text: string,
    owner: Player,
    power: number,
    toughness: number
  ) {
    // Llama al constructor de la clase base Card
    // Asegúrate de que CardType.Creature esté siempre incluido en 'types' para las criaturas.
    // También puedes añadirlo aquí si el JSON solo da 'Creature' como baseType.
    const creatureTypes = Array.from(new Set([...types, CardType.Creature])); // Asegura que Creature esté en los tipos
    super(id, name, manaCost, creatureTypes, text, owner);

    this.power = power;
    this.toughness = toughness;
    this.currentToughness = toughness; // Inicialmente, la resistencia actual es la resistencia base
    this.hasSummoningSickness = true; // Por defecto, las criaturas tienen mareo de invocación al entrar en juego
  }

  /**
   * Determina si la criatura puede ser jugada (lanzada) por el jugador.
   * Implementa la lógica específica para las criaturas.
   * @param player El jugador que intenta jugar la criatura.
   * @returns `true` si la criatura puede ser lanzada, `false` en caso contrario.
   */
  public canBePlayed(player: Player): boolean {
    // Lógica de juego de criaturas:
    // - Debes estar en una Main Phase.
    // - Debes tener suficiente maná.
    // - El stack debe estar en un estado apropiado (o vacío si es conjuro).
    // - Restricciones adicionales de la carta (ej., "no se puede lanzar si...").

    // Por ahora, solo una comprobación básica.
    // La lógica de coste de maná se maneja en GameService.playCard.
    console.log(
      `Verificando si ${this.name} puede ser lanzada por ${player.name}.`
    );
    // Asumimos que sí puede ser lanzada si el GameService valida el maná y la prioridad.
    return true;
  }

  /**
   * Lógica que ocurre cuando la criatura es jugada (lanzada).
   * Una criatura lanzada va a la pila, se resuelve y luego entra al campo de batalla.
   * @param player El jugador que juega la criatura.
   */
  public play(player: Player): void {
    // Este método se llama cuando el hechizo de criatura se resuelve desde la pila.
    // Mueve la criatura al campo de batalla del jugador.
    player.addCardToBattlefield(this); // Añade la carta al campo de batalla del jugador
    this.moveTo(Zone.Battlefield); // Actualiza la zona de la carta
    this.hasSummoningSickness = true; // Asegura que tiene mareo de invocación al entrar
    this.currentToughness = this.toughness; // Reinicia la resistencia actual al entrar al campo
    console.log(`${this.name} de ${player.name} entra al campo de batalla.`);
  }

  /**
   * Determina si la criatura puede atacar.
   * Una criatura solo puede atacar si:
   * - Está en el campo de batalla.
   * - Está enderezada.
   * - No tiene "mareo de invocación" (a menos que tenga Haste).
   * @returns `true` si la criatura puede atacar, `false` en caso contrario.
   */
  public canAttack(): boolean {
    return (
      this.currentZone === Zone.Battlefield &&
      this.state === CardState.Untapped && // Debe estar enderezada
      !this.hasSummoningSickness // No debe tener mareo de invocación (ignorando Haste por ahora)
    );
  }

  /**
   * Aplica daño a la criatura.
   * Si la resistencia actual cae a 0 o menos, la criatura muere y va al cementerio.
   * @param amount La cantidad de daño a aplicar.
   */
  public takeDamage(amount: number): void {
    this.currentToughness -= amount;
    console.log(
      `${this.name} (ID: ${this.id}) recibe ${amount} de daño. Su resistencia actual es: ${this.currentToughness}.`
    );
    if (this.currentToughness <= 0) {
      console.log(`${this.name} (ID: ${this.id}) muere y va al cementerio.`);
      // La criatura se remueve del campo de batalla de su controlador y va al cementerio del propietario
      this.owner.removeCardFromBattlefield(this.id, Zone.Graveyard);
      // Resetear resistencia actual para futuras reanimaciones/retornos
      this.currentToughness = this.toughness;
    }
  }

  /**
   * Remueve todo el daño marcado en la criatura.
   * Esto ocurre normalmente al final del turno durante la fase de limpieza.
   */
  public removeAllDamage(): void {
    this.currentToughness = this.toughness;
    console.log(
      `${this.name} remueve todo el daño. Resistencia restablecida a ${this.currentToughness}.`
    );
  }

  /**
   * Este método se llama al inicio de la fase de enderezar del controlador.
   * Es donde la criatura pierde su "mareo de invocación".
   * En un juego real, la lógica de mareo de invocación se gestionaría de forma global por el Game loop,
   * pero esta función es un placeholder útil.
   */
  public removeSummoningSickness(): void {
    this.hasSummoningSickness = false;
    console.log(`${this.name} ha perdido su mareo de invocación.`);
  }
}
