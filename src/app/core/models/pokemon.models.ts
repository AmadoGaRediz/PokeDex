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
  quantity: number;
  languageCounts: Record<string, number>;
  updatedAt: string;
}

export interface UserSettings {
  id: 'profile';
  trainerName: string;
  totalTcgCards?: number;
  updatedAt: string;
}

export interface ImportExportPayload {
  schemaVersion: 2;
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
