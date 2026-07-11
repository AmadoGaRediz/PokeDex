export interface Pokemon {
  id: number;
  nameEn: string;
  nameEs: string;
  image: string;
  types: string[];
  generation: number;
}

export interface CollectionEntry {
  pokemonId: number;
  owned: boolean;
  favorite: boolean;
  obtainedAt?: string;
  updatedAt: string;
}

export interface PokemonCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  setName: string;
  setSeries?: string;
  releaseDate?: string;
  imageSmall: string;
  imageLarge: string;
  marketPriceUsd?: number;
  marketPriceEur?: number;
}

export type CardCondition = 'Mint' | 'Near Mint' | 'Excellent' | 'Good' | 'Played' | 'Poor';
export type CardFinish = 'Normal' | 'Holo' | 'Reverse Holo';
export type PriceCurrency = 'USD' | 'EUR' | 'MXN';

export interface CardVariant {
  id: string;
  language: string;
  quantity: number;
  condition: CardCondition;
  finish: CardFinish;
  firstEdition: boolean;
  gradedBy?: 'PSA' | 'CGC' | 'BGS' | '';
  grade?: number;
  purchasePrice?: number;
  estimatedPrice?: number;
  currency: PriceCurrency;
  acquiredAt?: string;
  location?: string;
  notes?: string;
}

export interface CardCollectionEntry {
  cardId: string;
  pokemonId: number;
  cardName: string;
  setName: string;
  number: string;
  rarity?: string;
  imageSmall: string;
  imageLarge: string;
  marketPriceUsd?: number;
  marketPriceEur?: number;
  quantity: number;
  languageCounts: Record<string, number>;
  variants?: CardVariant[];
  updatedAt: string;
}

export interface UserSettings {
  id: 'profile';
  trainerName: string;
  totalTcgCards?: number;
  preferredCurrency?: PriceCurrency;
  updatedAt: string;
}

export interface ImportExportPayload {
  schemaVersion: 3;
  exportedAt: string;
  entries: CollectionEntry[];
  cards: CardCollectionEntry[];
  settings?: UserSettings;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'master';
}
