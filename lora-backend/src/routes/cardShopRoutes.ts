// src/routes/cardShopRoutes.ts
import { Router } from "express";
import { buyCard } from "../controllers/cardShopController";

const router = Router();

router.post("/buy", buyCard);

export default router;
