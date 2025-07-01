// src/game/Stack.ts
import { Card } from "../cards/Card";
import { Player } from "../players/Player";
import { Target } from "../../types/interfaces";

/**
 * Representa un elemento en la pila (un hechizo lanzado o una habilidad activada/disparada).
 */
export interface StackElement {
  type: "spell" | "ability";
  sourceCard?: Card; // La carta que generó el hechizo/habilidad
  sourcePlayer: Player; // El jugador que puso el elemento en la pila
  target?: Target; // El objetivo (si lo hay)
  // Para hechizos:
  cardToResolve?: Card;
  // Para habilidades:
  abilityName?: string;
  // ... cualquier otra data necesaria para resolver el elemento
}

/**
 * La pila del juego, donde los hechizos y habilidades esperan para resolverse.
 * Sigue la regla LIFO (Last In, First Out).
 */
export class Stack {
  public elements: StackElement[] = [];

  /**
   * Añade un elemento a la parte superior de la pila.
   * @param element El hechizo o habilidad a añadir.
   */
  public push(element: StackElement): void {
    this.elements.push(element);
    console.log(
      `"${element.sourceCard?.name || element.abilityName}" añadido a la pila.`
    );
    this.printStack();
  }

  /**
   * Remueve y retorna el elemento superior de la pila.
   * @returns El elemento superior de la pila, o undefined si la pila está vacía.
   */
  public pop(): StackElement | undefined {
    const element = this.elements.pop();
    if (element) {
      console.log(
        `"${
          element.sourceCard?.name || element.abilityName
        }" removido de la pila.`
      );
      this.printStack();
    }
    return element;
  }

  /**
   * Retorna el elemento superior de la pila sin removerlo.
   * @returns El elemento superior de la pila, o undefined si la pila está vacía.
   */
  public peek(): StackElement | undefined {
    return this.elements[this.elements.length - 1];
  }

  /**
   * Verifica si la pila está vacía.
   */
  public isEmpty(): boolean {
    return this.elements.length === 0;
  }

  /**
   * Limpia la pila.
   */
  public clear(): void {
    this.elements = [];
    console.log("La pila ha sido limpiada.");
  }

  /**
   * Muestra el contenido actual de la pila.
   */
  public printStack(): void {
    if (this.isEmpty()) {
      console.log("La pila está vacía.");
      return;
    }
    console.log("--- Pila Actual ---");
    this.elements.forEach((el, index) => {
      const name = el.sourceCard?.name || el.abilityName || "Unknown Element";
      const targetInfo =
        el.target && el.target.id ? ` targeting ${el.target.id}` : "";
      console.log(
        `${index + 1}. [${el.type}] ${name} (por ${
          el.sourcePlayer.name
        })${targetInfo}`
      );
    });
    console.log("-------------------");
  }

  public get size(): number {
    return this.elements.length;
  }
}
