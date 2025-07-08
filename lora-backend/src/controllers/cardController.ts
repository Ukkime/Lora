// src/controllers/cardController.ts
import { Request, Response } from "express";
import { cardService } from "../services/cardService";
// No necesitamos CardType aquí, ya que operamos con 'baseType' directamente de CardJsonData.
// import { CardType } from '../types/enums'; // Si no se usa, es mejor quitar esta importación para limpieza.

/**
 * Obtiene todas las definiciones de cartas disponibles en el sistema.
 * Las transforma en un formato más simple y listo para el frontend,
 * incluyendo propiedades específicas según el tipo base de la carta.
 * GET /api/cards
 */
import { query } from "../db";

export const getAllCards = async (req: Request, res: Response) => {
  try {
    const cardsData = cardService.getAllCardDefinitions();

    // Obtener userId del usuario autenticado
    // Asume que el middleware de autenticación coloca el userId en req.user.id
    // Si usas otro campo, ajusta aquí
    const userId = (req as any).user?.id;
    let userCardIds: Set<string> = new Set();

    if (userId) {
      // Consulta la tabla user_cards para obtener los IDs de cartas que posee el usuario
      const userCards = await query(
        "SELECT card_id FROM user_cards WHERE user_id = ?",
        [userId]
      );
      userCardIds = new Set(userCards.map((row: any) => row.card_id));
    }

    const simpleCards = cardsData.map((cardData) => ({
      id: cardData.id,
      name: cardData.name,
      baseType: cardData.baseType,
      manaCost: cardData.manaCost,
      text: cardData.text,
      rarity: cardData.rarity,
      faction: cardData.faction,
      ...(cardData.baseType === "Creature" && {
        power: cardData.power,
        toughness: cardData.toughness,
      }),
      ...(cardData.baseType === "Land" && {
        providesMana: cardData.providesMana,
      }),
      ...(cardData.baseType === "Planeswalker" && {
        initialLoyalty: cardData.initialLoyalty,
        loyaltyAbilities: cardData.loyaltyAbilities,
      }),
      // Campo available: true si el usuario la tiene, false si no o si no autenticado
      available: userId ? userCardIds.has(cardData.id) : false,
      price: cardData.price,
    }));

    return res.json(simpleCards);
  } catch (error: any) {
    console.error("Error al obtener todas las cartas:", error.message);
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener las cartas.",
        error: error.message,
      });
  }
};

/**
 * Obtiene una definición de carta específica por su ID.
 * Transforma la definición en un formato simple listo para el frontend.
 * GET /api/cards/:id
 */
export const getCardById = (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Extrae el 'id' de los parámetros de la URL.

    // cardService.getCardDefinitionById() devuelve un CardJsonData o undefined.
    const cardData = cardService.getCardDefinitionById(id);

    if (cardData) {
      // Si la carta se encuentra, la transforma en un formato "simple" similar a getAllCards.
      const simpleCard = {
        id: cardData.id,
        name: cardData.name,
        baseType: cardData.baseType, // Crucial para el frontend.
        manaCost: cardData.manaCost,
        text: cardData.text,
        // Nuevos atributos generales
        rarity: cardData.rarity,
        faction: cardData.faction,
        // Agrega propiedades específicas condicionalmente, igual que en getAllCards.
        ...(cardData.baseType === "Creature" && {
          power: cardData.power,
          toughness: cardData.toughness,
        }),
        ...(cardData.baseType === "Land" && {
          providesMana: cardData.providesMana,
        }),
        ...(cardData.baseType === "Planeswalker" && {
          initialLoyalty: cardData.initialLoyalty,
          loyaltyAbilities: cardData.loyaltyAbilities,
        }),
        // ... añadir otros tipos de cartas
      };
      // Envía la carta simplificada como respuesta JSON.
      return res.json(simpleCard);
    } else {
      // Si la carta no se encuentra, envía un estado 404 (No Encontrado).
      return res.status(404).send("Card not found");
    }
  } catch (error: any) {
    console.error("Error al obtener carta por ID:", error.message);
    // En caso de error, envía un estado 500.
    return res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener la carta.",
        error: error.message,
      });
  }
};
