// src/services/cardService.ts
import { Card } from "../models/cards/Card";
import { CreatureCard } from "../models/cards/CreatureCard";
import { LandCard } from "../models/cards/LandCard";
import { SpellCard } from "../models/cards/SpellCard"; // Asegúrate de que esta clase exista y esté correctamente importada
import { PlaneswalkerCard, LoyaltyAbility } from '../models/cards/PlaneswalkerCard'; // Importa PlaneswalkerCard y su interfaz
import { EnchantmentCard } from '../models/cards/EnchantmentCard'; // Importa EnchantmentCard
import { ManaColor, CardType } from "../types/enums"; // Importa CardType para mapear los tipos de carta
import { ManaCost } from "../types/interfaces";
import { Player } from "../models/players/Player"; // Necesario para el "dummy player" al instanciar cartas
import fs from "fs"; // Módulo de Node.js para interactuar con el sistema de archivos
import path from "path"; // Módulo de Node.js para trabajar con rutas de archivos
import { ArtifactCard } from "../models/cards/ArtifactCard";

/**
 * Define la estructura esperada de los datos de una carta en los archivos JSON.
 * Esta interfaz asegura que los JSON que leemos cumplen con un contrato.
 */
export interface CardJsonData {
  id: string;
  name: string;
  baseType:
    | "Creature"
    | "Land"
    | "Spell"
    | "Enchantment"
    | "Artifact"
    | "Planeswalker";
  manaCost: ManaCost;
  text: string;
  power?: number;
  toughness?: number;
  providesMana?: ManaColor;
  initialLoyalty?: number;
  loyaltyAbilities?: LoyaltyAbility[];
  // Nuevos atributos opcionales
  rarity?: string;
  faction?: string;
  price?: number; // Precio de la carta (tokens)
}

/**
 * CardService gestiona la carga de definiciones de cartas desde archivos
 * y la instanciación de objetos Card "vivos" para el juego.
 * Se implementa como un Singleton.
 */
class CardService {
  // Almacena las definiciones de cartas leídas de los JSON, mapeadas por su ID para acceso rápido.
  private allCardDefinitions: Map<string, CardJsonData> = new Map();

  constructor() {
    console.log("CardService inicializado. Cargando definiciones de cartas...");
    this.loadAllCardDefinitions(); // Carga las cartas al iniciar el servicio
  }

  /**
   * Carga todas las definiciones de cartas desde archivos JSON.
   * Lee todos los archivos .json de la carpeta `src/data/cards`.
   * Cada archivo JSON debe representar una única definición de carta.
   */
  private loadAllCardDefinitions(): void {
    // Construye la ruta absoluta a la carpeta donde se esperan los JSON de cartas
    // '__dirname' es el directorio del archivo actual (src/services/)
    const cardsDirPath = path.join(__dirname, "../data/cards");
    console.log(`Buscando archivos de cartas en: ${cardsDirPath}`);

    try {
      // Lee todos los nombres de archivo en el directorio de cartas
      const cardFiles = fs
        .readdirSync(cardsDirPath)
        .filter((file) => file.endsWith(".json"));
      console.log(`Encontrados ${cardFiles.length} archivos de cartas JSON.`);

      // Itera sobre cada archivo y carga su contenido
      for (const file of cardFiles) {
        const filePath = path.join(cardsDirPath, file);
        const fileContent = fs.readFileSync(filePath, "utf8"); // Lee el contenido como string UTF-8
        const cardData: CardJsonData = JSON.parse(fileContent); // Parse el JSON a un objeto CardJsonData
        // Asegura que cada carta tenga un campo price (por defecto 10)
        if (typeof cardData.price !== "number") {
          cardData.price = 10;
        }
        this.allCardDefinitions.set(cardData.id, cardData); // Almacena la definición por su ID
        console.log(
          `- Definición de carta cargada: "${cardData.name}" (ID: ${cardData.id}, Tipo Base: ${cardData.baseType}, Precio: ${cardData.price})`
        );
      }
    } catch (error: any) {
      console.error(
        `ERROR: No se pudieron cargar las definiciones de cartas desde ${cardsDirPath}.`,
        error.message
      );
      console.error(
        "Asegúrate de que la carpeta existe y contiene archivos JSON válidos."
      );
      // En un entorno de producción, aquí podrías querer lanzar una excepción o manejar este error de forma más robusta.
    }
  }

  /**
   * Devuelve todas las definiciones de cartas cargadas (los datos JSON brutos).
   * Esto es útil para, por ejemplo, mostrar todas las cartas disponibles en una colección.
   * @returns Un array de objetos CardJsonData.
   */
  public getAllCardDefinitions(): CardJsonData[] {
    return Array.from(this.allCardDefinitions.values());
  }

  /**
   * Devuelve una definición de carta específica por su ID (los datos JSON brutos).
   * @param id El ID único de la carta a buscar.
   * @returns Un objeto CardJsonData o `undefined` si la carta no se encuentra.
   */
  public getCardDefinitionById(id: string): CardJsonData | undefined {
    return this.allCardDefinitions.get(id);
  }

  /**
   * Instancia un objeto de una clase `Card` (o una de sus subclases)
   * basándose en la definición JSON cargada. Este es el paso clave
   * para convertir datos estáticos en objetos interactivos del juego.
   * @param cardData La definición JSON de la carta que se desea instanciar.
   * @param owner El objeto `Player` que será el propietario real de esta instancia de carta.
   * @returns Una nueva instancia de `Card` o una de sus subclases.
   * @throws `Error` si los datos de la carta son incompletos para el tipo esperado.
   */
  public instantiateCard(cardData: CardJsonData, owner: Player): Card {
    // Determina el/los tipo(s) de carta a pasar al constructor de Card
    // Por ahora, solo usamos el baseType como el tipo principal.
    // Si necesitas subtipos (ej. 'Creature, Goblin'), tendrías que añadirlos al JSON.
    let cardTypes: CardType[];
    switch (cardData.baseType) {
      case "Creature":
        cardTypes = [CardType.Creature];
        break;
      case "Land":
        cardTypes = [CardType.Land];
        break;
      case "Spell":
        // En Magic, 'Spell' es una categoría. Los tipos reales son 'Instant' o 'Sorcery'.
        // Aquí asumimos Instant para todos los 'Spell' si no se especifica más.
        cardTypes = [CardType.Instant];
        break;
      case "Enchantment":
        cardTypes = [CardType.Enchantment];
        break;
      case "Artifact":
        cardTypes = [CardType.Artifact];
        break;
      case "Planeswalker":
        cardTypes = [CardType.Planeswalker];
        break;
      default:
        // Si el baseType es desconocido, lanzamos un error o usamos un tipo por defecto.
        // Es mejor que todos los baseTypes esperados tengan un case explícito.
        console.warn(
          `WARN: Tipo base de carta desconocido o no manejado: '${cardData.baseType}' para ID: ${cardData.id}. Instanciando como Artefacto genérico.`
        );
        cardTypes = [CardType.Artifact];
        break;
    }

    // Instancia la clase de carta específica según el 'baseType'
    switch (cardData.baseType) {
      case "Creature":
        // Verifica que las propiedades específicas de Criatura existan
        if (cardData.power === undefined || cardData.toughness === undefined) {
          throw new Error(
            `Datos incompletos para CreatureCard (ID: ${cardData.id}): Faltan 'power' o 'toughness'.`
          );
        }
        return new CreatureCard(
          cardData.id,
          cardData.name,
          cardData.manaCost,
          cardTypes, // Pasa el array de tipos derivado
          cardData.text,
          owner,
          cardData.power,
          cardData.toughness
        );
      case "Land":
        // Verifica que la propiedad específica de Tierra exista
        if (cardData.providesMana === undefined) {
          throw new Error(
            `Datos incompletos para LandCard (ID: ${cardData.id}): Falta 'providesMana'.`
          );
        }
        return new LandCard(
          cardData.id,
          cardData.name,
          owner,
          cardData.providesMana
        );
      case "Spell":
        // SpellCard no requiere propiedades adicionales específicas en su constructor base por ahora
        return new SpellCard(
          cardData.id,
          cardData.name,
          cardData.manaCost,
          cardTypes, // Pasa el array de tipos derivado
          cardData.text,
          owner
        );
      case "Planeswalker":
        if (
          cardData.initialLoyalty === undefined ||
          cardData.loyaltyAbilities === undefined
        ) {
          throw new Error(
            `Datos incompletos para PlaneswalkerCard (ID: ${cardData.id}): Faltan 'initialLoyalty' o 'loyaltyAbilities'.`
          );
        }
        return new PlaneswalkerCard(
          cardData.id,
          cardData.name,
          cardData.manaCost,
          cardTypes,
          cardData.text,
          owner,
          cardData.initialLoyalty,
          cardData.loyaltyAbilities
        );
      case "Enchantment":
        return new EnchantmentCard(
          cardData.id,
          cardData.name,
          cardData.manaCost,
          cardTypes,
          cardData.text,
          owner
        );
      case "Artifact":
        return new ArtifactCard(
          cardData.id,
          cardData.name,
          cardData.manaCost,
          cardTypes,
          cardData.text,
          owner
        );
      default:
        // Si llegamos aquí, significa que `baseType` no coincide con ninguna clase de carta implementada.
        // Es un error de configuración de datos o una clase de carta que falta.
        throw new Error(
          `ERROR: No se puede instanciar la carta '${cardData.name}' (ID: ${cardData.id}). Tipo base '${cardData.baseType}' no está soportado o implementado.`
        );
    }
    
  }
}

// Exporta una única instancia de CardService (Singleton)
// para que todos los demás servicios y controladores utilicen la misma fuente de definiciones de cartas.
export const cardService = new CardService();
