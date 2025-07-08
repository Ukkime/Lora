// src/routes/userRoutes.ts
import { Router } from "express";
import { getCredits } from "../controllers/userController";

const router = Router();

router.get("/me/credits", getCredits);

export default router;
