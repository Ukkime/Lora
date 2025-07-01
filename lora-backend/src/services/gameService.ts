// src/services/gameService.ts
import { Game } from "../models/game/Game";
import { Card } from "../models/cards/Card";
import { Player } from "../models/players/Player";
import { Server as SocketIOServer } from "socket.io"; // Importa Server para el tipado de Socket.IO
import { cardService } from "./cardService"; // Importa el servicio de cartas para cargar mazos

// --- Interfaces y Tipos ---

/**
 * Representa un jugador que está en la cola de emparejamiento.
 */
interface QueuedPlayer {
  playerId: string;
  playerName: string;
  joinTime: number; // Marca de tiempo cuando el jugador se unió a la cola
  // Podrías añadir más criterios aquí, como rating, nivel, etc.
}

/**
 * GameService es el corazón de la lógica de negocio del juego.
 * Gestiona las instancias de partida, la cola de emparejamiento y la comunicación con los clientes.
 * Se implementa como un Singleton para asegurar una única fuente de verdad para el estado del juego.
 */
class GameService {
  // --- Propiedades del Servicio ---
  private games: Map<string, Game> = new Map(); // Almacena todas las partidas activas, mapeadas por gameId
  private matchmakingQueue: QueuedPlayer[] = []; // La cola de jugadores esperando emparejamiento
  private matchmakingInterval: NodeJS.Timeout | null = null; // ID para el intervalo de emparejamiento automático

  // Instancia de Socket.IO para comunicación en tiempo real con los clientes
  private io: SocketIOServer | null = null;
  // Mapas para asociar IDs de jugador con IDs de socket, y viceversa
  private playerSocketMap: Map<string, string> = new Map(); // playerId -> socketId
  private socketPlayerMap: Map<string, string> = new Map(); // socketId -> playerId

  // --- Constructor ---
  constructor() {
    console.log("GameService inicializado.");
    // Inicia el proceso de emparejamiento automáticamente al crear la instancia del servicio
    this.startMatchmakingProcess();
  }

  // --- Métodos de Configuración de Socket.IO ---

  /**
   * Establece la instancia de Socket.IO para permitir la comunicación en tiempo real.
   * Debe ser llamado desde `index.ts` después de inicializar Socket.IO.
   * @param ioInstance La instancia del servidor de Socket.IO.
   */
  public setSocketIoInstance(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
    console.log("Socket.IO instance set in GameService.");
  }

  /**
   * Registra un jugador asociando su ID de jugador con su ID de socket.
   * Permite enviar mensajes específicos a ese jugador más tarde.
   * @param playerId El ID único del jugador.
   * @param socketId El ID del socket del cliente conectado.
   */
  public registerPlayerSocket(playerId: string, socketId: string): void {
    this.playerSocketMap.set(playerId, socketId);
    this.socketPlayerMap.set(socketId, playerId);
    console.log(`Player ${playerId} associated with socket ${socketId}.`);
  }

  /**
   * Desregistra un jugador cuando su socket se desconecta.
   * También lo remueve de la cola de emparejamiento si estaba en ella.
   * @param socketId El ID del socket que se desconectó.
   */
  public unregisterPlayerSocket(socketId: string): void {
    const playerId = this.socketPlayerMap.get(socketId);
    if (playerId) {
      this.playerSocketMap.delete(playerId);
      this.socketPlayerMap.delete(socketId);
      // Si el jugador estaba en cola al desconectarse, sácalo
      this.leaveQueue(playerId);
      console.log(
        `Player ${playerId} disconnected, removed from socket map and queue.`
      );
    }
  }

  // --- Métodos de Gestión de Partidas ---

  /**
   * Inicia una nueva partida entre dos jugadores.
   * Crea una nueva instancia de la clase `Game` y construye sus mazos.
   * @param player1Name El nombre del primer jugador.
   * @param player2Name El nombre del segundo jugador.
   * @returns Un objeto que contiene el ID de la partida y su estado inicial.
   * @throws Error si no hay definiciones de cartas cargadas.
   */
  public startGame(
    player1Name: string,
    player2Name: string
  ): { gameId: string; initialState: any } {
    const newGameId = `game_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const allCardDefs = cardService.getAllCardDefinitions();
    if (allCardDefs.length === 0) {
      throw new Error(
        "No hay definiciones de cartas cargadas. Asegúrate de que los archivos JSON estén en src/data/cards."
      );
    }

    const player1DeckData = allCardDefs.slice(
      0,
      Math.min(allCardDefs.length, 15)
    );
    const player2DeckData = allCardDefs.slice(
      Math.max(0, allCardDefs.length - 15)
    );

    const tempDummyPlayerForDeckCreation = new Player(
      "temp_dummy",
      "Temp Dummy",
      []
    );

    const player1DeckInstances: Card[] = player1DeckData.map((def) =>
      cardService.instantiateCard(def, tempDummyPlayerForDeckCreation)
    );
    const player2DeckInstances: Card[] = player2DeckData.map((def) =>
      cardService.instantiateCard(def, tempDummyPlayerForDeckCreation)
    );

    // Create the new Game instance
    const newGame = new Game(
      player1Name,
      player2Name,
      player1DeckInstances,
      player2DeckInstances
    );

    // NEW: Assign the actual Player owner to cards in their respective decks
    // Use the new public method on the Deck class
    newGame.players[0].deck.assignCardOwners(newGame.players[0]);
    newGame.players[1].deck.assignCardOwners(newGame.players[1]);

    // Store the new game in the active games map
    this.games.set(newGameId, newGame);

    console.log(
      `Partida ${newGameId} iniciada entre ${player1Name} y ${player2Name}.`
    );
    return { gameId: newGameId, initialState: newGame.getGameState() };
  }

  /**
   * Obtiene una instancia de partida por su ID.
   * @param gameId El ID de la partida.
   * @returns La instancia de Game o `undefined` si no se encuentra.
   */
  public getGameById(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  /**
   * Obtiene el estado actual de la partida para una vista pública (manos ocultas).
   * @param gameId El ID de la partida.
   * @returns El estado público del juego o `null` si la partida no existe.
   */
  public getGameState(gameId: string): any {
    const game = this.getGameById(gameId);
    return game ? game.getGameState() : null;
  }

  /**
   * Obtiene el estado del juego desde la perspectiva de un jugador específico,
   * revelando su propia mano y ocultando la del oponente.
   * @param gameId El ID de la partida.
   * @param requestingPlayerId El ID del jugador que solicita el estado.
   * @returns El estado del juego adaptado o `null` si la partida/jugador no existe.
   */
  public getGameStateForPlayer(
    gameId: string,
    requestingPlayerId: string
  ): any {
    const game = this.getGameById(gameId);
    if (!game) {
      return null;
    }
    return game.getGameStateForPlayer(requestingPlayerId);
  }

  /**
   * Termina y remueve una partida activa.
   * @param gameId El ID de la partida a terminar.
   */
  public endGame(gameId: string): void {
    console.log(`Partida ${gameId} terminada.`);
    this.games.delete(gameId);
  }

  /**
   * Permite a un jugador intentar jugar una carta.
   * Realiza validaciones básicas y delega la lógica de juego a la instancia de `Game`.
   * @param gameId El ID de la partida.
   * @param playerId El ID del jugador que intenta jugar la carta.
   * @param cardId El ID de la carta que se intenta jugar.
   * @param targetId Opcional. El ID del objetivo de la carta.
   * @returns El estado actualizado del juego para el jugador o `null` si la acción no es válida.
   */
  public playCard(
    gameId: string,
    playerId: string,
    cardId: string,
    targetId?: string
  ): any {
    const game = this.getGameById(gameId);
    if (!game) {
      console.error("No hay partida activa para jugar cartas.");
      return null;
    }

    const player = game.getPlayerById(playerId);
    if (!player) {
      console.error(`Jugador ${playerId} no encontrado en la partida.`);
      return null;
    }

    // Valida si el jugador tiene la prioridad para actuar
    if (game.playerWithPriority?.id !== playerId) {
      console.error(
        `Jugador ${player.name} no tiene prioridad para jugar la carta.`
      );
      return null;
    }

    const cardToPlay = player.hand.cardsInHand.find((c) => c.id === cardId);
    if (!cardToPlay) {
      console.error(
        `Carta ${cardId} no encontrada en la mano del jugador ${playerId}.`
      );
      return null;
    }

    // Realiza el pago de maná antes de que la carta sea añadida a la pila
    if (!player.payManaCost(cardToPlay.manaCost)) {
      console.error(`Maná insuficiente para jugar ${cardToPlay.name}.`);
      return null;
    }

    // Delega la acción de añadir a la pila a la instancia de Game
    const success = game.addSpellToStack(player, cardToPlay, {
      type: "card",
      id: targetId || "",
    });

    // Devuelve el estado actualizado del juego desde la perspectiva del jugador
    return success ? game.getGameStateForPlayer(playerId) : null;
  }

  /**
   * Permite a un jugador pasar la prioridad.
   * @param gameId El ID de la partida.
   * @param playerId El ID del jugador que pasa prioridad.
   * @returns El estado actualizado del juego para el jugador o `null` si la acción no es válida.
   */
  public passPriority(gameId: string, playerId: string): any {
    const game = this.getGameById(gameId);
    if (!game) {
      console.error("No hay partida activa para pasar prioridad.");
      return null;
    }
    const player = game.getPlayerById(playerId);
    if (!player) {
      console.error(`Jugador ${playerId} no encontrado en la partida.`);
      return null;
    }

    // Delega la acción de pasar prioridad a la instancia de Game
    const success = game.passPriority(playerId);
    // Devuelve el estado actualizado del juego para el jugador
    // (ya que su prioridad o la del oponente habrá cambiado)
    return success ? game.getGameStateForPlayer(playerId) : null;
  }

  /**
   * Intenta resolver el elemento superior de la pila.
   * Este método es llamado internamente por `passPriority` cuando ambos jugadores han pasado.
   * También podría ser expuesto a la API para depuración o acciones específicas.
   * @param gameId El ID de la partida.
   * @returns El estado público actualizado del juego o `null` si la acción no es válida.
   */
  public resolveStack(gameId: string): any {
    const game = this.getGameById(gameId);
    if (!game) {
      console.error("No hay partida activa para resolver la pila.");
      return null;
    }
    // Delega la acción de resolver la pila a la instancia de Game
    const success = game.resolveStack();
    // Después de resolver, la prioridad puede haber cambiado, así que se devuelve el estado público
    return success ? game.getGameState() : null;
  }

  /**
   * Avanza el juego a la siguiente fase o turno.
   * Principalmente llamado internamente por `passPriority` cuando las condiciones se cumplen.
   * @param gameId El ID de la partida.
   * @returns El estado del juego actualizado para el jugador activo o `null`.
   */
  public advancePhase(gameId: string): any {
    const game = this.getGameById(gameId);
    if (!game) {
      console.error("No hay partida activa para avanzar de fase.");
      return null;
    }
    // Delega la acción de avanzar fase a la instancia de Game
    game.advancePhase();
    // Después de avanzar la fase, se devuelve el estado para el nuevo jugador activo
    return game.getGameStateForPlayer(game.activePlayer.id);
  }

  // --- Métodos de Matchmaking ---

  /**
   * Inicia el proceso de emparejamiento automático.
   * Se ejecuta periódicamente para buscar y emparejar jugadores en la cola.
   */
  private startMatchmakingProcess(): void {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
    }
    // Intervalo de 5 segundos para intentar emparejar
    this.matchmakingInterval = setInterval(() => {
      this.tryMatchmaking();
    }, 5000);
    console.log("Proceso de emparejamiento automático iniciado.");
  }

  /**
   * Detiene el proceso de emparejamiento automático.
   */
  public stopMatchmakingProcess(): void {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
      console.log("Proceso de emparejamiento automático detenido.");
    }
  }

  /**
   * Intenta emparejar jugadores de la cola.
   * Implementa una lógica simple de "primeros dos que llegan".
   */
  private tryMatchmaking(): void {
    console.log(
      `Intentando emparejar. Jugadores en cola: ${this.matchmakingQueue.length}`
    );
    if (this.matchmakingQueue.length >= 2) {
      // Saca a los dos primeros jugadores de la cola (FIFO - First In, First Out)
      const player1 = this.matchmakingQueue.shift();
      const player2 = this.matchmakingQueue.shift();

      if (player1 && player2) {
        console.log(
          `¡Emparejamiento encontrado! ${player1.playerName} vs ${player2.playerName}`
        );
        // Inicia la partida con los jugadores encontrados
        const gameResult = this.startGame(
          player1.playerName,
          player2.playerName
        );

        // Notifica a los clientes emparejados a través de Socket.IO
        if (this.io) {
          const player1SocketId = this.playerSocketMap.get(player1.playerId);
          const player2SocketId = this.playerSocketMap.get(player2.playerId);

          if (player1SocketId) {
            this.io.to(player1SocketId).emit("matchFound", {
              gameId: gameResult.gameId,
              opponentName: player2.playerName,
              yourPlayerId: player1.playerId,
            });
            console.log(
              `Notificación de partida enviada a ${player1.playerName}`
            );
          } else {
            console.warn(
              `Socket para ${player1.playerName} (${player1.playerId}) no encontrado. Puede que se haya desconectado.`
            );
          }

          if (player2SocketId) {
            this.io.to(player2SocketId).emit("matchFound", {
              gameId: gameResult.gameId,
              opponentName: player1.playerName,
              yourPlayerId: player2.playerId,
            });
            console.log(
              `Notificación de partida enviada a ${player2.playerName}`
            );
          } else {
            console.warn(
              `Socket para ${player2.playerName} (${player2.playerId}) no encontrado. Puede que se haya desconectado.`
            );
          }
        } else {
          console.warn(
            "Socket.IO no está inicializado en GameService. No se pudieron enviar notificaciones."
          );
        }
      }
    }
  }

  /**
   * Añade un jugador a la cola de emparejamiento.
   * Requiere que el jugador tenga una conexión Socket.IO activa.
   * @param playerId El ID único del jugador.
   * @param playerName El nombre del jugador.
   * @returns `true` si se añadió, `false` si ya estaba en cola o no tenía conexión Socket.IO.
   */
  public joinQueue(playerId: string, playerName: string): boolean {
    // Evita que un jugador se una dos veces a la cola
    if (this.matchmakingQueue.some((p) => p.playerId === playerId)) {
      console.log(`${playerName} (ID: ${playerId}) ya está en la cola.`);
      return false;
    }

    // Requiere una conexión Socket.IO activa para unirse a la cola
    if (!this.playerSocketMap.has(playerId)) {
      console.warn(
        `Jugador ${playerName} (ID: ${playerId}) intentó unirse a la cola sin una conexión Socket.IO registrada.`
      );
      // En un sistema robusto, podrías notificar al cliente que necesita conectar el socket primero.
      return false;
    }

    const newQueuedPlayer: QueuedPlayer = {
      playerId,
      playerName,
      joinTime: Date.now(),
    };
    this.matchmakingQueue.push(newQueuedPlayer);
    console.log(
      `${playerName} (ID: ${playerId}) se ha unido a la cola. Jugadores en cola: ${this.matchmakingQueue.length}`
    );
    // Intenta emparejar inmediatamente después de que un nuevo jugador se une
    this.tryMatchmaking();
    return true;
  }

  /**
   * Remueve un jugador de la cola de emparejamiento.
   * @param playerId El ID del jugador a remover.
   * @returns `true` si se removió, `false` si no estaba en cola.
   */
  public leaveQueue(playerId: string): boolean {
    const initialLength = this.matchmakingQueue.length;
    this.matchmakingQueue = this.matchmakingQueue.filter(
      (p) => p.playerId !== playerId
    );
    if (this.matchmakingQueue.length < initialLength) {
      console.log(
        `Jugador ID: ${playerId} ha salido de la cola. Jugadores en cola: ${this.matchmakingQueue.length}`
      );
      // Notifica al jugador que ha salido de la cola, si su socket está activo
      if (this.io) {
        const socketId = this.playerSocketMap.get(playerId);
        if (socketId) {
          this.io.to(socketId).emit("queueUpdate", {
            status: "left",
            message: "Has salido de la cola.",
          });
        }
      }
      return true;
    }
    console.log(`Jugador ID: ${playerId} no estaba en la cola.`);
    return false;
  }

  /**
   * Obtiene el estado actual de la cola de emparejamiento.
   * @returns Un array con los jugadores actualmente en cola.
   */
  public getQueueStatus(): QueuedPlayer[] {
    // Devuelve una copia del array para evitar modificaciones externas directas
    return [...this.matchmakingQueue];
  }
}

// Exporta una única instancia de GameService (Singleton) para ser utilizada en toda la aplicación.
export const gameService = new GameService();
