import Dexie, { Table } from 'dexie';
import { CardCollectionEntry, CollectionEntry, Pokemon, UserSettings } from '../models/pokemon.models';

export class AppDb extends Dexie {
  pokemon!: Table<Pokemon, number>;
  collection!: Table<CollectionEntry, number>;
  cards!: Table<CardCollectionEntry, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('pokecarddex');

    this.version(1).stores({
      pokemon: 'id, nameEn, nameEs, generation, *types',
      collection: 'pokemonId, owned, favorite, updatedAt'
    });

    this.version(2).stores({
      pokemon: 'id, nameEn, nameEs, generation, *types',
      collection: 'pokemonId, owned, favorite, updatedAt',
      cards: 'cardId, pokemonId, cardName, setName, updatedAt',
      settings: 'id'
    });
  }
}

export const db = new AppDb();
