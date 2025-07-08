// x:/Proyectos/LORA/lora-frontend/src/app/models/card-data.interface.ts (nuevo archivo)

export interface ManaCost {
  W?: number;
  U?: number;
  B?: number;
  R?: number;
  G?: number;
  C?: number;
}

export interface LoyaltyAbility {
  cost: number;
  type: 'plus' | 'minus' | 'ultimate';
  name: string;
  description: string;
}

// Interfaz para la estructura de los datos que vienen del backend
export interface CardData {
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
  available: boolean;
  // faccion
  faction: 'elf' | 'dwarf' | 'human' | 'demon' | 'angel' | 'undead' | 'beast' | 'elemental' | 'necropolis' | 'tribal';
  price?: number; // Precio de la carta
}
