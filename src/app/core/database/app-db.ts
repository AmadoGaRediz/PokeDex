import Dexie, { Table } from 'dexie';
import { CollectionEntry, Pokemon } from '../models/pokemon.models';

export class AppDb extends Dexie {
  pokemon!: Table<Pokemon, number>;
  collection!: Table<CollectionEntry, number>;

  constructor() {
    super('pokecarddex');
    this.version(1).stores({
      pokemon: 'id, nameEn, nameEs, generation, *types',
      collection: 'pokemonId, owned, favorite, updatedAt'
    });
  }
}

export const db = new AppDb();
