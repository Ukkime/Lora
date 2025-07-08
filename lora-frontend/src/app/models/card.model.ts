// x:/Proyectos/LORA/lora-frontend/src/app/models/card.model.ts (tu archivo original)

import { CardData, ManaCost, LoyaltyAbility } from '../interfaces/card-data.interface'; // Importa la interfaz CardData

export class Card implements CardData {
  available: boolean; // Indica si la carta está disponible para seleccionar
  // Propiedades públicas que coinciden con CardData
  id: string;
  name: string;
  baseType:
    | 'Enchantment'
    | 'Creature'
    | 'Spell'
    | 'Planeswalker'
    | 'Artifact'
    | 'Land';
  manaCost: ManaCost;
  text: string;
  power?: number;
  toughness?: number;
  initialLoyalty?: number;
  loyaltyAbilities?: LoyaltyAbility[];
  providesMana?: 'W' | 'U' | 'B' | 'R' | 'G';
  rarity: 'common' | 'special' | 'uncommon' | 'mythic' | 'legendary';
  faction: 'elf' | 'dwarf' | 'human' | 'demon' | 'angel' | 'undead' | 'beast' | 'elemental' | 'necropolis' | 'tribal';
  // Puedes agregar más propiedades opcionales aquí si lo necesitas
  price?: number;

  // Lista de rarezas permitidas
  static readonly allowedRarities = [
    'common',
    'special',
    'uncommon',
    'mythic',
    'legendary',
  ] as const;

  // Constructor para inicializar las propiedades
  constructor(data: CardData) {
    this.id = data.id;
    this.name = data.name;

    this.baseType = data.baseType;
    this.manaCost = data.manaCost;
    this.text = data.text;
    this.power = data.power;
    this.toughness = data.toughness;
    this.initialLoyalty = data.initialLoyalty;
    this.loyaltyAbilities = data.loyaltyAbilities;
    this.providesMana = data.providesMana;
    this.rarity = (
      Card.allowedRarities.includes(data.rarity as any) ? data.rarity : 'common'
    ) as (typeof Card.allowedRarities)[number];
    this.available = data.available ?? true;
    this.faction = data.faction;
    this.price = data.price;
  }

  /**
   * Devuelve el costo de maná de la carta como una cadena formateada (ej. "1W", "1C1G").
   */
  get formattedManaCost(): string {
    const costParts: string[] = [];
    const manaOrder: (keyof ManaCost)[] = ['C', 'W', 'U', 'B', 'R', 'G']; // Orden preferido para mostrar el maná

    // Itera en el orden definido para una representación consistente
    for (const type of manaOrder) {
      if (this.manaCost[type] !== undefined && this.manaCost[type]! > 0) {
        costParts.push(`${this.manaCost[type]}${type}`);
      }
    }

    if (costParts.length === 0 && this.baseType === 'Land') {
      return '0'; // Para las tierras, que tienen costo vacío
    } else if (costParts.length === 0) {
      // Para otras cartas que podrían tener un costo de 0 si no son tierras
      return '0';
    }

    return costParts.join(''); // Junta las partes, ej. "1C1G"
  }
}

