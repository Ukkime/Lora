// src/routes/gameRoutes.ts
import { Router } from "express";
import * as gameController from "../controllers/gameController";

const router = Router();

router.post("/start", gameController.startGame); // POST /api/game/start
router.get("/:gameId", gameController.getGameState); // GET /api/game/:gameId (public view)
router.get(
  "/:gameId/player/:playerId/state",
  gameController.getPlayerSpecificGameState
); // NEW: GET /api/game/:gameId/player/:playerId/state (player-specific view)
router.post("/:gameId/play-card", gameController.playCard); // POST /api/game/:gameId/play-card
router.post("/:gameId/pass-priority", gameController.passPriority); // POST /api/game/:gameId/pass-priority
router.post("/:gameId/advance-phase", gameController.advancePhase); // POST /api/game/:gameId/advance-phase

export default router;
