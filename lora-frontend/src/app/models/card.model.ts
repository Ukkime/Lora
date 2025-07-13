// x:/Proyectos/LORA/lora-frontend/src/app/models/card.model.ts (tu archivo original)

import { CardData, ManaCost, LoyaltyAbility, CardAttribute, CardAbility } from '../interfaces/card-data.interface'; // Importa la interfaz CardData y tipos para atributos/habilidades

export class Card implements CardData {
  image?: string;
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
  attributes?: CardAttribute[]; // NUEVO: atributos como "prisa", "toque mortal"
  activatedAbilities?: CardAbility[]; // NUEVO: habilidades activadas con coste de maná


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
    return Card.formatManaCost(this.manaCost, this.baseType);
  }

  /**
   * Formatea un objeto ManaCost como string (ej: "1W1U").
   * Si se pasa baseType==='Land' y el coste está vacío, retorna '0'.
   */
  static formatManaCost(manaCost: ManaCost, baseType?: string): string {
    const costParts: string[] = [];
    const manaOrder: (keyof ManaCost)[] = ['C', 'W', 'U', 'B', 'R', 'G'];
    for (const type of manaOrder) {
      if (manaCost[type] !== undefined && manaCost[type]! > 0) {
        costParts.push(`${manaCost[type]}${type}`);
      }
    }
    if (costParts.length === 0 && baseType === 'Land') {
      return '0';
    } else if (costParts.length === 0) {
      return '0';
    }
    return costParts.join('');
  }
}

