// src/controllers/matchmakingController.ts
import { Request, Response } from "express";
import { gameService } from "../services/gameService"; // Importa el servicio de juego

/**
 * Permite a un jugador unirse a la cola de emparejamiento.
 * POST /api/matchmaking/join
 */
export const joinQueue = (req: Request, res: Response) => {
  try {
    const { playerId, playerName } = req.body;
    if (!playerId || !playerName) {
      return res
        .status(400)
        .json({ message: "Se requieren playerId y playerName." });
    }

    const success = gameService.joinQueue(playerId, playerName);
    if (success) {
      return res
        .status(200)
        .json({
          message: `${playerName} unido a la cola.`,
          queueSize: gameService.getQueueStatus().length,
        });
    } else {
      return res
        .status(409)
        .json({ message: `${playerName} ya está en la cola.` }); // 409 Conflict
    }
  } catch (error: any) {
    console.error("Error al unirse a la cola:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al unirse a la cola.",
        error: error.message,
      });
  }
};

/**
 * Permite a un jugador salir de la cola de emparejamiento.
 * POST /api/matchmaking/leave
 */
export const leaveQueue = (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ message: "Se requiere playerId." });
    }

    const success = gameService.leaveQueue(playerId);
    if (success) {
      return res
        .status(200)
        .json({
          message: `Jugador ${playerId} ha salido de la cola.`,
          queueSize: gameService.getQueueStatus().length,
        });
    } else {
      return res
        .status(404)
        .json({ message: `Jugador ${playerId} no encontrado en la cola.` });
    }
  } catch (error: any) {
    console.error("Error al salir de la cola:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al salir de la cola.",
        error: error.message,
      });
  }
};

/**
 * Obtiene el estado actual de la cola.
 * GET /api/matchmaking/status
 */
export const getQueueStatus = (req: Request, res: Response) => {
  try {
    const queue = gameService.getQueueStatus();
    return res
      .status(200)
      .json({
        queueSize: queue.length,
        playersInQueue: queue.map((p) => p.playerName),
      });
  } catch (error: any) {
    console.error("Error al obtener el estado de la cola:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener el estado de la cola.",
        error: error.message,
      });
  }
};
