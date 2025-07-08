// src/controllers/gameController.ts
import { Request, Response } from "express";
import { gameService } from "../services/gameService";

/**
 * Inicia una nueva partida.
 */
export const startGame = (req: Request, res: Response) => {
  try {
    const { player1Id, player1Name, player2Id, player2Name } = req.body;
    if (!player1Name || !player2Name) {
      return res
        .status(400)
        .json({ message: "Se requieren los nombres de ambos jugadores." });
    }
    // Si no se proporcionan IDs, generamos unos temporales para pruebas
    const id1 = player1Id || `player_${Math.floor(Math.random() * 10000)}`;
    const id2 = player2Id || `player_${Math.floor(Math.random() * 10000)}`;
    const gameData = gameService.startGame(id1, player1Name, id2, player2Name);
    return res.status(201).json(gameData);
  } catch (error: any) {
    console.error("Error al iniciar el juego:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al iniciar el juego.",
        error: error.message,
      });
  }
};

/**
 * Obtiene el estado actual de la partida (vista pública).
 */
export const getGameState = (req: Request, res: Response) => {
  try {
    const gameId = req.params.gameId;
    const state = gameService.getGameState(gameId);
    if (state) {
      return res.status(200).json(state);
    } else {
      return res
        .status(404)
        .json({ message: "No hay partida activa o el ID es incorrecto." });
    }
  } catch (error: any) {
    console.error("Error al obtener el estado del juego:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener el estado del juego.",
        error: error.message,
      });
  }
};

/**
 * Obtiene el estado del juego desde la perspectiva de un jugador específico.
 * Revela la mano del jugador solicitante.
 * GET /api/game/:gameId/player/:playerId/state
 */
export const getPlayerSpecificGameState = (req: Request, res: Response) => {
  try {
    const { gameId, playerId } = req.params;
    if (!gameId || !playerId) {
      return res
        .status(400)
        .json({ message: "Se requieren gameId y playerId." });
    }
    const state = gameService.getGameStateForPlayer(gameId, playerId);
    if (state) {
      return res.status(200).json(state);
    } else {
      return res
        .status(404)
        .json({
          message: "No se pudo obtener el estado para el jugador especificado.",
        });
    }
  } catch (error: any) {
    console.error(
      "Error al obtener el estado específico del jugador:",
      error.message
    );
    return res
      .status(500)
      .json({
        message:
          "Error interno del servidor al obtener el estado específico del jugador.",
        error: error.message,
      });
  }
};

/**
 * Permite a un jugador jugar una carta de su mano.
 * POST /api/game/:gameId/play-card
 */
export const playCard = (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { playerId, cardId, targetId } = req.body;
    if (!gameId || !playerId || !cardId) {
      return res
        .status(400)
        .json({ message: "Se requieren gameId, playerId y cardId." });
    }
    const updatedState = gameService.playCard(
      gameId,
      playerId,
      cardId,
      targetId
    );
    if (updatedState) {
      return res.status(200).json(updatedState);
    } else {
      return res
        .status(400)
        .json({
          message:
            "No se pudo realizar la acción de jugar la carta. Verifica logs.",
        });
    }
  } catch (error: any) {
    console.error("Error al jugar carta:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al jugar carta.",
        error: error.message,
      });
  }
};

/**
 * Permite a un jugador pasar prioridad.
 * POST /api/game/:gameId/pass-priority
 */
export const passPriority = (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    if (!gameId || !playerId) {
      return res
        .status(400)
        .json({ message: "Se requieren gameId y playerId." });
    }
    const updatedState = gameService.passPriority(gameId, playerId);
    if (updatedState) {
      return res.status(200).json(updatedState);
    } else {
      return res
        .status(400)
        .json({ message: "No se pudo pasar prioridad. Verifica logs." });
    }
  } catch (error: any) {
    console.error("Error al pasar prioridad:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al pasar prioridad.",
        error: error.message,
      });
  }
};

/**
 * Permite avanzar el juego de fase/turno. (Útil para debugar o cuando ambos jugadores han pasado prioridad).
 * POST /api/game/:gameId/advance-phase
 */
export const advancePhase = (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    if (!gameId) {
      return res.status(400).json({ message: "Se requiere gameId." });
    }
    const updatedState = gameService.advancePhase(gameId);
    if (updatedState) {
      return res.status(200).json(updatedState);
    } else {
      return res
        .status(400)
        .json({ message: "No se pudo avanzar la fase. Verifica logs." });
    }
  } catch (error: any) {
    console.error("Error al avanzar la fase:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al avanzar la fase.",
        error: error.message,
      });
  }
};
