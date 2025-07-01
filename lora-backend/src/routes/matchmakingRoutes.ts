// src/routes/matchmakingRoutes.ts
import { Router } from "express";
import * as matchmakingController from "../controllers/matchmakingController";

const router = Router();

router.post("/join", matchmakingController.joinQueue);
router.post("/leave", matchmakingController.leaveQueue);
router.get("/status", matchmakingController.getQueueStatus);

export default router;
