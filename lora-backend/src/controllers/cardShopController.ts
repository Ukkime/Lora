// src/controllers/cardShopController.ts
import { Request, Response } from "express";
import { query, run } from "../db";
import { cardService } from "../services/cardService";

/**
 * POST /api/cards/buy
 * Body: { cardId: string }
 * Requiere autenticación (userId en req.user.id)
 */
export const buyCard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { cardId } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }
    if (!cardId) {
      return res.status(400).json({ message: "Falta cardId" });
    }
    // 1. Verifica que la carta existe
    const card = cardService.getCardDefinitionById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Carta no encontrada" });
    }
    // 2. Verifica que el usuario no la tiene ya
    const existing = await query("SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?", [userId, cardId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Ya tienes esta carta" });
    }
    // 3. Obtiene créditos del usuario
    const userRows = await query("SELECT credits FROM users WHERE id = ?", [userId]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    const credits = userRows[0].credits;
    const price = card.price ?? 10;
    if (credits < price) {
      return res.status(400).json({ message: "Créditos insuficientes" });
    }
    // 4. Descuenta créditos y añade la carta
    await run("UPDATE users SET credits = credits - ? WHERE id = ?", [price, userId]);
    await run("INSERT INTO user_cards (user_id, card_id) VALUES (?, ?)", [userId, cardId]);
    // 5. Devuelve créditos restantes y carta comprada
    const updatedUser = await query("SELECT credits FROM users WHERE id = ?", [userId]);
    return res.json({
      message: "Compra exitosa",
      card: { ...card, available: true },
      credits: updatedUser[0].credits
    });
  } catch (error: any) {
    console.error("Error en compra de carta:", error.message);
    return res.status(500).json({ message: "Error interno en compra de carta", error: error.message });
  }
};
