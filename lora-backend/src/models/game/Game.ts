// src/models/Game.ts
import { Player } from "../players/Player";
import { Card } from "../cards/Card";
import { Deck } from "../players/Deck";
import { TurnPhase, Zone, CardType } from "../../types/enums";
import { Stack, StackElement } from "./Stack";
import { Target } from "../../types/interfaces";

/**
 * Representa el estado global y la lógica del juego.
 */
export class Game {
  public players: Player[];
  public activePlayer: Player;
  public nonActivePlayer: Player;
  public currentPhase: TurnPhase;
  public turnNumber: number;
  public stack: Stack; // La pila de hechizos y habilidades
  public battlefield: Card[] = []; // Todas las cartas en el campo de batalla de ambos jugadores
  // public exiledCards: Card[] = []; // Opcional: cartas exiliadas
  // public pendingTriggers: any[] = []; // Opcional: para gestionar habilidades disparadas

  // New properties for player interaction
  public playerWithPriority: Player | null = null;
  public hasPassedTurnOnce: boolean = false; // To handle first player not drawing on turn 1
  public lastActionPlayerId: string | null = null; // To track who last acted on the stack for priority passing

  constructor(
    player1: Player,
    player2: Player,
  ) {
    this.players = [player1, player2];
    this.activePlayer = this.players[0]; // Player 1 starts
    this.nonActivePlayer = this.players[1];
    this.currentPhase = TurnPhase.Untap;
    this.turnNumber = 0;
    this.stack = new Stack();
    this.initializeGame();
  }

  private initializeGame(): void {
    console.log(
      `--- Iniciando Juego entre ${this.players[0].name} y ${this.players[1].name} ---`
    );
    this.players.forEach((player) => {
      player.deck.shuffle();
      // Robar 7 cartas iniciales
      for (let i = 0; i < 7; i++) {
        player.drawCard();
      }
      console.log(
        `${player.name} ha robado 7 cartas. Cartas en mano: ${player.hand.size}`
      );
    });
    console.log("Juego inicializado. ¡Comienza el primer turno!");
    this.startNextTurn(); // Still start the first turn automatically
  }

  public startNextTurn(): void {
    this.turnNumber++;
    // On turn 1, Player 1 doesn't draw. After that, active player gets to draw.
    this.hasPassedTurnOnce = this.turnNumber > 1;

    console.log(
      `\n--- Turno ${this.turnNumber}: ${this.activePlayer.name}'s Turn ---`
    );
    // Alternar jugador activo
    // Note: The first player goes first, then they alternate.
    // If turnNumber is odd, P1 is active. If even, P2 is active.
    if (this.turnNumber % 2 !== 0) {
      // Odd turns (1, 3, 5...)
      this.activePlayer = this.players[0];
      this.nonActivePlayer = this.players[1];
    } else {
      // Even turns (2, 4, 6...)
      this.activePlayer = this.players[1];
      this.nonActivePlayer = this.players[0];
    }

    this.goToPhase(TurnPhase.Untap);
  }

  public goToPhase(phase: TurnPhase): void {
    this.currentPhase = phase;
    console.log(`\n--- Fase: ${this.currentPhase} ---`);

    // Reset priority at the start of each phase (unless specific rules dictate otherwise)
    this.playerWithPriority = this.activePlayer;
    this.lastActionPlayerId = null; // Clear last action player for new phase priority

    switch (this.currentPhase) {
      case TurnPhase.Untap:
        this.handleUntapPhase();
        this.passPriority(this.activePlayer.id); // Active player gets priority after untap
        break;
      case TurnPhase.Upkeep:
        this.handleUpkeepPhase();
        this.passPriority(this.activePlayer.id); // Active player gets priority after upkeep
        break;
      case TurnPhase.Draw:
        this.handleDrawPhase();
        this.passPriority(this.activePlayer.id); // Active player gets priority after draw
        break;
      case TurnPhase.MainPhase1:
        this.handleMainPhase1();
        this.playerWithPriority = this.activePlayer; // Active player gets priority
        console.log(
          `Prioridad para ${this.playerWithPriority.name} en ${this.currentPhase}.`
        );
        break;
      case TurnPhase.Combat:
        this.handleCombatPhase(); // This phase has many sub-steps, each requiring priority
        this.playerWithPriority = this.activePlayer; // Active player gets priority
        console.log(
          `Prioridad para ${this.playerWithPriority.name} en ${this.currentPhase}.`
        );
        break;
      case TurnPhase.MainPhase2:
        this.handleMainPhase2();
        this.playerWithPriority = this.activePlayer; // Active player gets priority
        console.log(
          `Prioridad para ${this.playerWithPriority.name} en ${this.currentPhase}.`
        );
        break;
      case TurnPhase.EndStep:
        this.handleEndStep();
        this.passPriority(this.activePlayer.id); // Active player gets priority after end step
        break;
      case TurnPhase.Cleanup:
        this.handleCleanupPhase();
        // Cleanup normally doesn't involve priority unless something triggers
        // We'll automatically advance after this phase
        this.advancePhase(); // Auto-advance from Cleanup
        break;
    }
  }

  /**
   * Advances the game to the next phase or turn.
   * This method is called by the GameService after players have passed priority.
   * @returns The new game state.
   */
  public advancePhase(): void {
    if (!this.stack.isEmpty()) {
      console.warn(
        "No se puede avanzar de fase: ¡La pila no está vacía! Resuelve la pila primero."
      );
      // In a real game, this might trigger a rule violation or just not allow the action.
      return;
    }

    this.lastActionPlayerId = null; // Reset for phase advancement

    const phases = Object.values(TurnPhase);
    const currentIndex = phases.indexOf(this.currentPhase);
    if (currentIndex < phases.length - 1) {
      this.goToPhase(phases[currentIndex + 1] as TurnPhase);
    } else {
      this.startNextTurn(); // Cycle through a full turn
    }
  }

  // --- Lógica de Fases ---
  private handleUntapPhase(): void {
    console.log(`${this.activePlayer.name} endereza sus permanentes.`);
    this.players.forEach((player) => {
      // Untap for ALL players
      player.battlefield.forEach((card) => card.untap());
      // Quitar mareo de invocación de criaturas al inicio del turno del controlador
      player.battlefield.forEach((card) => {
        if (
          card.types.includes(CardType.Creature) &&
          (card as any).hasSummoningSickness !== undefined
        ) {
          (card as any).hasSummoningSickness = false;
        }
      });
    });
  }

  private handleUpkeepPhase(): void {
    console.log("Fase de Mantenimiento.");
    // Aquí se resuelven los disparadores de "al inicio del mantenimiento"
    // This is where priority typically starts after triggers are put on the stack
  }

  private handleDrawPhase(): void {
    console.log("Fase de Robar.");
    if (this.turnNumber === 1 && this.activePlayer === this.players[0]) {
      // First player does not draw on their first turn in Magic
      console.log("Primer jugador no roba en su primer turno.");
    } else {
      this.activePlayer.drawCard();
    }
  }

  private handleMainPhase1(): void {
    console.log("Primera Fase Principal.");
    this.activePlayer.clearManaPool(); // Mana empties from previous phase
    // Players can cast sorceries, creatures, enchantments, artifacts and lands.
    // This is where the frontend would enable player actions.
  }

  private handleCombatPhase(): void {
    console.log("Fase de Combate (simplificada).");
    // Combat is very complex: Beginning of Combat, Declare Attackers, Declare Blockers, Combat Damage, End of Combat.
    // Each sub-step has priority.
  }

  private handleMainPhase2(): void {
    console.log("Segunda Fase Principal.");
    this.activePlayer.clearManaPool();
    // Similar to Main Phase 1.
  }

  private handleEndStep(): void {
    console.log("Paso Final.");
    // "At the beginning of the end step" triggers happen here.
  }

  private handleCleanupPhase(): void {
    console.log("Fase de Limpieza.");
    this.activePlayer.clearManaPool();
    // Reduce hand to 7 cards
    while (this.activePlayer.hand.size > 7) {
      const excessCard = this.activePlayer.hand.cardsInHand[0]; // Example: discard the first
      this.activePlayer.hand.removeCard(excessCard);
      excessCard.moveTo(Zone.Graveyard);
      this.activePlayer.graveyard.push(excessCard);
      console.log(
        `${this.activePlayer.name} descarta ${excessCard.name} al cementerio.`
      );
    }
    // Damage marked on creatures is removed.
    // "Until end of turn" effects end.
  }

  // --- Lógica de la Pila (Stack) ---

  /**
   * Adds a spell or ability to the top of the stack.
   * @param player The player casting the spell or activating the ability.
   * @param card The card being cast (for spells) or source of ability.
   * @param target Optional target.
   * @returns true if added, false otherwise.
   */
  public addSpellToStack(player: Player, card: Card, target?: Target): boolean {
    // Basic validation: Is it the active player? Do they have priority?
    if (
      player.id !== this.activePlayer.id &&
      player.id !== this.nonActivePlayer.id
    ) {
      console.log(`Error: Player ${player.name} is not part of this game.`);
      return false;
    }
    if (player.id !== this.playerWithPriority?.id) {
      console.log(
        `Error: ${player.name} does not have priority to cast ${card.name}. Current priority: ${this.playerWithPriority?.name}.`
      );
      return false;
    }

    // More detailed checks:
    // - Does the player have the card in hand? (Done in card.canBePlayed implicitly)
    // - Is the phase correct for casting this type of card (e.g., Sorcery only in Main Phase)?
    // - Does the player have enough mana? (Handled in gameService.playCard before calling this)
    // - Is the target valid?

    if (
      card.currentZone === Zone.Hand &&
      player.hand.cardsInHand.includes(card) &&
      card.canBePlayed(player)
    ) {
      const stackElement: StackElement = {
        type: "spell",
        sourceCard: card,
        sourcePlayer: player,
        target: target,
        cardToResolve: card,
      };
      this.stack.push(stackElement);
      player.hand.removeCard(card); // The card moves from hand to stack
      this.lastActionPlayerId = player.id; // Record who cast the last spell for priority
      this.playerWithPriority = this.nonActivePlayer; // Priority passes to the non-active player to respond
      console.log(
        `${player.name} lanza ${card.name}. Prioridad para ${this.playerWithPriority.name}.`
      );
      return true;
    } else {
      console.log(
        `No se puede lanzar ${card.name}. No está en la mano o no se puede jugar en este momento.`
      );
      return false;
    }
  }

  /**
   * Resolves the top element of the stack.
   * This method is called by the GameService after both players have passed priority.
   * @returns true if an element was resolved, false if stack was empty.
   */
  public resolveStack(): boolean {
    if (this.stack.isEmpty()) {
      console.log("No hay elementos en la pila para resolver.");
      // Reset priority to active player if stack is empty after attempting to resolve
      this.playerWithPriority = this.activePlayer;
      this.lastActionPlayerId = null;
      return false;
    }

    const elementToResolve = this.stack.pop();
    if (elementToResolve) {
      console.log(
        `Resolviendo "${
          elementToResolve.sourceCard?.name || elementToResolve.abilityName
        }"...`
      );
      if (elementToResolve.type === "spell" && elementToResolve.cardToResolve) {
        const card = elementToResolve.cardToResolve;
        // Execute the card's play logic
        card.play(elementToResolve.sourcePlayer);
      } else if (elementToResolve.type === "ability") {
        // Logic to execute the ability
        console.log(
          `Habilidad "${elementToResolve.abilityName}" de ${elementToResolve.sourceCard?.name} resuelta.`
        );
      }
      // After resolving, priority goes back to the active player to respond to whatever just resolved
      this.playerWithPriority = this.activePlayer; // Active player gets priority after resolution
      this.lastActionPlayerId = null; // Clear last action after resolution
      console.log(
        `Elemento resuelto. Prioridad para ${this.playerWithPriority.name}.`
      );
      return true;
    }
    return false;
  }

  /**
   * Allows a player to pass priority.
   * @param playerId The ID of the player passing priority.
   * @returns true if priority was successfully passed, false otherwise.
   */
  public passPriority(playerId: string): boolean {
    if (this.playerWithPriority?.id !== playerId) {
      console.log(
        `Error: ${
          this.getPlayerById(playerId)?.name
        } does not have priority to pass.`
      );
      return false;
    }

    // Rule: If stack is empty AND active player passes priority during their own main phase,
    // it means they are done and the phase can advance (after non-active player also passes).
    // If stack is NOT empty, passing priority moves it to the other player.
    // If both players pass priority consecutively on an empty stack, the phase advances.
    // If both players pass priority consecutively on a non-empty stack, the top element resolves.

    if (this.stack.isEmpty()) {
      // Player passing priority on an empty stack
      if (this.playerWithPriority.id === this.activePlayer.id) {
        // Active player passes on empty stack
        if (
          this.lastActionPlayerId === this.nonActivePlayer.id ||
          this.currentPhase === TurnPhase.Untap ||
          this.currentPhase === TurnPhase.Upkeep ||
          this.currentPhase === TurnPhase.Draw ||
          this.currentPhase === TurnPhase.EndStep ||
          this.currentPhase === TurnPhase.Cleanup
        ) {
          // Both players have passed (implicitly or explicitly), advance phase
          console.log(
            `${this.playerWithPriority.name} pasa prioridad en pila vacía. Ambos pasaron. Avanzando fase.`
          );
          this.advancePhase(); // Advance the phase
        } else {
          // Active player passes, priority goes to non-active player
          this.playerWithPriority = this.nonActivePlayer;
          console.log(
            `${
              this.getPlayerById(playerId)?.name
            } pasa prioridad en pila vacía. Prioridad para ${
              this.playerWithPriority.name
            }.`
          );
        }
      } else {
        // Non-active player passes on empty stack
        if (
          this.lastActionPlayerId === this.activePlayer.id ||
          this.currentPhase === TurnPhase.Untap ||
          this.currentPhase === TurnPhase.Upkeep ||
          this.currentPhase === TurnPhase.Draw ||
          this.currentPhase === TurnPhase.EndStep ||
          this.currentPhase === TurnPhase.Cleanup
        ) {
          // Both players have passed (implicitly or explicitly), advance phase
          console.log(
            `${this.playerWithPriority.name} pasa prioridad en pila vacía. Ambos pasaron. Avanzando fase.`
          );
          this.advancePhase(); // Advance the phase
        } else {
          // Non-active player passes, priority goes back to active player
          this.playerWithPriority = this.activePlayer;
          console.log(
            `${
              this.getPlayerById(playerId)?.name
            } pasa prioridad en pila vacía. Prioridad para ${
              this.playerWithPriority.name
            }.`
          );
        }
      }
    } else {
      // Player passing priority on a non-empty stack
      if (this.playerWithPriority.id === this.nonActivePlayer.id) {
        // Non-active player passes on a non-empty stack, resolves top element
        console.log(
          `${this.playerWithPriority.name} pasa prioridad. Pila no vacía. Resolviendo elemento superior.`
        );
        this.resolveStack(); // Resolve top element
      } else {
        // Active player passes on a non-empty stack, priority goes to non-active player
        this.playerWithPriority = this.nonActivePlayer;
        console.log(
          `${
            this.getPlayerById(playerId)?.name
          } pasa prioridad. Pila no vacía. Prioridad para ${
            this.playerWithPriority.name
          }.`
        );
      }
    }
    this.lastActionPlayerId = playerId; // Record who just passed
    return true;
  }

  public getPlayerById(playerId: string): Player | undefined {
    return this.players.find((p) => p.id === playerId);
  }

  /**
   * Helper method to get a simplified card object for API responses.
   * @param card The card object.
   * @returns A simplified object with key card properties.
   */
  private _getSimplifiedCard(card: Card): any {
    return {
      id: card.id,
      name: card.name,
      types: card.types,
      manaCost: card.manaCost,
      text: card.text,
      state: card.state,
      currentZone: card.currentZone,
      // Add other common properties or specific ones based on type
      ...(card.types.includes(CardType.Creature) && {
        power: (card as any).power,
        toughness: (card as any).toughness,
        hasSummoningSickness: (card as any).hasSummoningSickness,
      }),
      ...(card.types.includes(CardType.Land) && {
        providesMana: (card as any).providesMana,
      }),
      // ... add other card type specific properties as needed
    };
  }

  /**
   * Helper method to get a detailed player state, including hand.
   * @param player The player object.
   * @returns A detailed object representing the player's state.
   */
  private _getDetailedPlayerState(player: Player): any {
    return {
      id: player.id,
      name: player.name,
      life: player.life,
      hand: player.hand.cardsInHand.map((card) =>
        this._getSimplifiedCard(card)
      ), // Reveal actual cards in hand
      deckSize: player.deck.size,
      manaPool: player.manaPool,
      battlefield: player.battlefield.map((card) =>
        this._getSimplifiedCard(card)
      ),
      graveyard: player.graveyard.map((card) => this._getSimplifiedCard(card)),
      // Add other private player info if needed
    };
  }

  /**
   * Helper method to get a public player state, hiding hand details.
   * @param player The player object.
   * @returns A public object representing the player's state.
   */
  private _getPublicPlayerState(player: Player): any {
    return {
      id: player.id,
      name: player.name,
      life: player.life,
      handSize: player.hand.size, // Only show hand size
      deckSize: player.deck.size,
      manaPool: player.manaPool,
      battlefield: player.battlefield.map((card) =>
        this._getSimplifiedCard(card)
      ),
      graveyard: player.graveyard.map((card) => this._getSimplifiedCard(card)),
    };
  }

  /**
   * Obtiene el estado actual del juego desde una perspectiva pública (manos ocultas).
   * @returns El estado público del juego.
   */
  public getGameState(): any {
    return {
      turnNumber: this.turnNumber,
      currentPhase: this.currentPhase,
      playerWithPriorityId: this.playerWithPriority?.id,
      activePlayer: this._getPublicPlayerState(this.activePlayer),
      nonActivePlayer: this._getPublicPlayerState(this.nonActivePlayer),
      stack: this.stack.elements.map((el: any) => ({
        type: el.type,
        sourceCardName: el.sourceCard?.name,
        sourcePlayerName: el.sourcePlayer.name,
        targetId: el.target?.id,
        abilityName: el.abilityName,
      })),
      // Add other public game state properties
    };
  }

  /**
   * Obtiene el estado del juego desde la perspectiva de un jugador específico.
   * Revela la mano del jugador solicitante y oculta la de los oponentes.
   * @param requestingPlayerId El ID del jugador que solicita el estado.
   * @returns El estado del juego adaptado a la perspectiva del jugador.
   */
  public getGameStateForPlayer(requestingPlayerId: string): any {
    const publicState = this.getGameState(); // Start with the public state

    // LOG: imprime los IDs de los jugadores en la partida
    console.log('[Game] Jugadores en la partida:', this.players.map(p => p.id));

    // Find the requesting player and their opponent
    const requestingPlayer = this.getPlayerById(requestingPlayerId);
    if (!requestingPlayer) {
      console.warn(
        `Jugador ${requestingPlayerId} no encontrado al solicitar estado específico.`
      );
      return null; // Or throw an error
    }

    const opponentPlayer = this.players.find(
      (p) => p.id !== requestingPlayerId
    );
    if (!opponentPlayer) {
      console.warn(
        `Oponente no encontrado para el jugador ${requestingPlayerId}.`
      );
      return null; // Should not happen in a 2-player game
    }

    // Override the active/non-active player data with detailed view for the requesting player
    if (this.activePlayer.id === requestingPlayerId) {
      publicState.activePlayer = this._getDetailedPlayerState(
        this.activePlayer
      );
      publicState.nonActivePlayer = this._getPublicPlayerState(
        this.nonActivePlayer
      ); // Ensure opponent's hand is hidden
    } else {
      publicState.activePlayer = this._getPublicPlayerState(this.activePlayer); // Active player's hand is hidden if not requesting player
      publicState.nonActivePlayer = this._getDetailedPlayerState(
        this.nonActivePlayer
      );
    }

    return publicState;
  }
}
