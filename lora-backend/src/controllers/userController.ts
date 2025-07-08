// src/controllers/userController.ts
import { Request, Response } from "express";
import { query } from "../db";

export const getCredits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }
    const rows = await query("SELECT credits FROM users WHERE id = ?", [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json({ credits: rows[0].credits });
  } catch (error: any) {
    return res.status(500).json({ message: "Error interno al consultar créditos", error: error.message });
  }
};
