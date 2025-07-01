// src/types/enums.ts

/**
 * Representa los colores de maná en el juego.
 */
export enum ManaColor {
  White = "W",
  Blue = "U",
  Black = "B",
  Red = "R",
  Green = "G",
  Colorless = "C",
}

/**
 * Representa los tipos principales de cartas.
 */
export enum CardType {
  Creature = "Creature",
  Instant = "Instant",
  Sorcery = "Sorcery",
  Enchantment = "Enchantment",
  Artifact = "Artifact",
  Land = "Land",
  Planeswalker = "Planeswalker", // Opcional, si quieres incluirlo
}

/**
 * Representa las fases principales de un turno.
 */
export enum TurnPhase {
  Untap = "Untap",
  Upkeep = "Upkeep",
  Draw = "Draw",
  MainPhase1 = "Main Phase 1",
  Combat = "Combat",
  MainPhase2 = "Main Phase 2",
  EndStep = "End Step",
  Cleanup = "Cleanup",
}

/**
 * Representa el estado de una carta en el campo de batalla (enderezada/girada).
 */
export enum CardState {
  Untapped = "Untapped",
  Tapped = "Tapped",
}

/**
 * Representa las zonas del juego donde pueden estar las cartas.
 */
export enum Zone {
  Library = "Library", // Mazo
  Hand = "Hand",
  Battlefield = "Battlefield", // Campo de batalla
  Graveyard = "Graveyard", // Cementerio
  Stack = "Stack", // Pila
  Exile = "Exile", // Exilio
}
