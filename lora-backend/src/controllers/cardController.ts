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
export const getAllCards = (req: Request, res: Response) => {
  try {
    // cardService.getAllCardDefinitions() devuelve un array de CardJsonData (el dato crudo del JSON).
    const cardsData = cardService.getAllCardDefinitions();

    // Mapeamos los datos crudos a un formato "simple" que el frontend pueda consumir fácilmente.
    // Aquí es donde se añaden condicionalmente propiedades como 'power', 'toughness', 'providesMana', etc.
    const simpleCards = cardsData.map((cardData) => ({
      id: cardData.id,
      name: cardData.name,
      baseType: cardData.baseType, // Es crucial enviar el baseType para que el frontend sepa de qué tipo es.
      manaCost: cardData.manaCost,
      text: cardData.text,
      // Agrega propiedades específicas de criatura si cardData.baseType es 'Creature'
      ...(cardData.baseType === "Creature" && {
        power: cardData.power,
        toughness: cardData.toughness,
      }),
      // Agrega propiedades específicas de tierra si cardData.baseType es 'Land'
      ...(cardData.baseType === "Land" && {
        providesMana: cardData.providesMana,
      }),
      // Agrega propiedades específicas de planeswalker si cardData.baseType es 'Planeswalker'
      ...(cardData.baseType === "Planeswalker" && {
        initialLoyalty: cardData.initialLoyalty,
        loyaltyAbilities: cardData.loyaltyAbilities,
      }),
      // ... Puedes añadir lógica similar para otros tipos de cartas como 'Artifact', 'Enchantment', etc.
      // Siempre asegúrate de que las propiedades existan en CardJsonData antes de incluirlas.
    }));

    // Envía la lista de cartas simplificadas como respuesta JSON.
    return res.json(simpleCards);
  } catch (error: any) {
    console.error("Error al obtener todas las cartas:", error.message);
    // En caso de error, envía un estado 500 (Error Interno del Servidor) con un mensaje descriptivo.
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
