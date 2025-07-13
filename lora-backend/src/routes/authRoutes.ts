// src/routes/authRoutes.ts
import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Sesiones activas y logout global (protegidos)
router.get("/sessions", authenticateToken, authController.getActiveSessions);
router.post("/logout-all", authenticateToken, authController.logoutAllSessions);
router.post("/revoke-session", authenticateToken, authController.revokeSession);

export default router;
