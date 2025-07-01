// src/models/ArtifactCard.ts
import { Card } from "./Card"; // Importa la clase base Card
import { ManaCost } from "../../types/interfaces"; // Importa la interfaz ManaCost
import { CardType, Zone, CardState } from "../../types/enums"; // Importa los enums CardType, Zone, CardState
import { Player } from "../players/Player"; // Importa la clase Player para el propietario y la interacción

/**
 * Representa una carta de Artefacto.
 * Extiende la clase base `Card` añadiendo propiedades y comportamientos específicos de artefacto.
 * Los artefactos son permanentes que, una vez jugados, permanecen en el campo de batalla
 * y pueden tener habilidades activadas, disparadas o estáticas.
 */
export class ArtifactCard extends Card {
  // Los artefactos pueden tener propiedades específicas si es necesario,
  // como un contador de cargas, o si son "equipos", etc.
  // Por ahora, no añadiremos propiedades adicionales específicas de artefactos aquí,
  // ya que su comportamiento principal se deriva de ser un permanente.

  /**
   * Constructor de la clase ArtifactCard.
   * @param id Identificador único del artefacto.
   * @param name Nombre del artefacto.
   * @param manaCost Coste de maná del artefacto.
   * @param types Array de tipos del artefacto (ya incluirá CardType.Artifact).
   * @param text Texto de reglas del artefacto.
   * @param owner El jugador propietario original del artefacto.
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
    // Asegúrate de que CardType.Artifact esté siempre incluido en 'types' para los artefactos.
    const artifactTypes = Array.from(new Set([...types, CardType.Artifact])); // Asegura que Artifact esté en los tipos
    super(id, name, manaCost, artifactTypes, text, owner);

    // Los artefactos, como permanentes, se inicializan enderezados.
    this.state = CardState.Untapped;
  }

  /**
   * Determina si el artefacto puede ser jugado (lanzado) por el jugador.
   * Implementa la lógica específica para los artefactos, que se lanzan como hechizos.
   * @param player El jugador que intenta jugar el artefacto.
   * @returns `true` si el artefacto puede ser lanzado, `false` en caso contrario.
   */
  public canBePlayed(player: Player): boolean {
    // Lógica de juego de artefactos:
    // - Debes estar en una Main Phase.
    // - Debes tener suficiente maná.
    // - El stack debe estar en un estado apropiado (o vacío si es conjuro).
    // - Restricciones adicionales de la carta (ej., "no se puede lanzar si...").

    // Por ahora, solo una comprobación básica.
    // La lógica de coste de maná se maneja en GameService.playCard.
    console.log(
      `Verificando si ${this.name} puede ser lanzado por ${player.name}.`
    );
    // Asumimos que sí puede ser lanzado si el GameService valida el maná y la prioridad.
    return true;
  }

  /**
   * Lógica que ocurre cuando el artefacto es jugado (lanzado) y se resuelve.
   * Un artefacto lanzado va a la pila, se resuelve y luego entra al campo de batalla.
   * @param player El jugador que juega el artefacto.
   */
  public play(player: Player): void {
    // Este método se llama cuando el hechizo de artefacto se resuelve desde la pila.
    // Mueve el artefacto al campo de batalla del jugador.
    player.addCardToBattlefield(this); // Añade la carta al campo de batalla del jugador
    this.moveTo(Zone.Battlefield); // Actualiza la zona de la carta
    this.state = CardState.Untapped; // Se asegura de que entra enderezado
    console.log(`${this.name} de ${player.name} entra al campo de batalla.`);
  }

  // Los artefactos pueden tener sus propios métodos para habilidades activadas,
  // pero eso dependerá de las habilidades específicas que diseñes para ellos.
  // Por ejemplo:
  // public activateAbility(): void {
  //     // Lógica para activar una habilidad del artefacto
  //     console.log(`${this.name} activa una habilidad.`);
  // }
}
