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
  imageSmall: string;
  imageLarge: string;
}

export interface ImportExportPayload {
  schemaVersion: 1;
  exportedAt: string;
  entries: CollectionEntry[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}
