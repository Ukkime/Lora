// src/types/interfaces.ts
import { ManaColor } from "./enums";

/**
 * Representa el coste de maná de una carta.
 */

export interface ManaCost {
  [key: string]: number | undefined;
}
/**
 * Interface básica para una habilidad de carta.
 * Esto es muy simplificado; en un juego real sería más complejo.
 */
export interface CardAbility {
  name: string;
  description: string;
  // Opcional: una función para ejecutar la habilidad
  // execute?: (game: Game, sourceCard: Card, target?: any) => void;
}

/**
 * Representa un objetivo en el juego (carta, jugador, etc.)
 */
export interface Target {
  type: "card" | "player" | "none";
  id?: string; // ID de la carta o jugador
}
