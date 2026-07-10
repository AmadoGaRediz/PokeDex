import { computed, inject, Injectable, signal } from '@angular/core';
import { db } from '../database/app-db';
import { Achievement, CollectionEntry, ImportExportPayload, Pokemon } from '../models/pokemon.models';
import { PokeApiService } from './poke-api.service';

@Injectable({ providedIn: 'root' })
export class CollectionStore {
  private readonly api = inject(PokeApiService);
  readonly pokemon = signal<Pokemon[]>([]);
  readonly entries = signal<Map<number, CollectionEntry>>(new Map());
  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);

  readonly total = computed(() => this.pokemon().length);
  readonly ownedCount = computed(() => [...this.entries().values()].filter(x => x.owned).length);
  readonly missingCount = computed(() => Math.max(0, this.total() - this.ownedCount()));
  readonly percent = computed(() => this.total() ? Math.round(this.ownedCount() / this.total() * 100) : 0);

  readonly achievements = computed<Achievement[]>(() => {
    const owned = this.ownedCount();
    const generationComplete = this.groupProgress('generation').some(item => item.owned === item.total && item.total > 0);
    const typeComplete = this.groupProgress('type').some(item => item.owned === item.total && item.total > 0);
    return [
      { id: 'first', title: '¡Comenzó la aventura!', description: 'Obtén tu primer Pokémon.', unlocked: owned >= 1, icon: '🥚' },
      { id: '50', title: 'Coleccionista', description: 'Obtén 50 Pokémon.', unlocked: owned >= 50, icon: '⭐' },
      { id: '100', title: 'Centenario', description: 'Obtén 100 Pokémon.', unlocked: owned >= 100, icon: '🏅' },
      { id: 'generation', title: 'Maestro generacional', description: 'Completa una generación.', unlocked: generationComplete, icon: '🏆' },
      { id: 'type', title: 'Especialista de tipo', description: 'Completa todos los Pokémon de un tipo.', unlocked: typeComplete, icon: '⚡' },
      { id: 'all', title: 'Maestro Pokémon', description: 'Completa toda la PokéCardDex.', unlocked: this.total() > 0 && owned === this.total(), icon: '👑' }
    ];
  });

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [cachedPokemon, cachedEntries] = await Promise.all([db.pokemon.toArray(), db.collection.toArray()]);
      this.pokemon.set(cachedPokemon.sort((a, b) => a.id - b.id));
      this.entries.set(new Map(cachedEntries.map(entry => [entry.pokemonId, entry])));
      if (!cachedPokemon.length && navigator.onLine) await this.syncPokemon();
      else if (!cachedPokemon.length) this.error.set('Conéctate una vez para descargar la Pokédex. Después funcionará sin internet.');
    } catch {
      this.error.set('No fue posible abrir el almacenamiento local.');
    } finally { this.loading.set(false); }
  }

  async syncPokemon(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true); this.progress.set(0); this.error.set(null);
    try {
      const values = await this.api.loadAll((done, total) => this.progress.set(Math.round(done / total * 100)));
      await db.transaction('rw', db.pokemon, async () => { await db.pokemon.clear(); await db.pokemon.bulkPut(values); });
      this.pokemon.set(values);
    } catch { this.error.set('No se pudo actualizar la Pokédex. Revisa tu conexión.'); }
    finally { this.syncing.set(false); }
  }

  entry(id: number): CollectionEntry | undefined { return this.entries().get(id); }
  isOwned(id: number): boolean { return this.entry(id)?.owned ?? false; }
  isFavorite(id: number): boolean { return this.entry(id)?.favorite ?? false; }

  async toggleOwned(id: number): Promise<void> {
    const current = this.entry(id);
    const owned = !(current?.owned ?? false);
    await this.save({ pokemonId: id, owned, favorite: current?.favorite ?? false,
      obtainedAt: owned ? (current?.obtainedAt ?? new Date().toISOString()) : undefined,
      updatedAt: new Date().toISOString() });
  }

  async toggleFavorite(id: number): Promise<void> {
    const current = this.entry(id);
    await this.save({ pokemonId: id, owned: current?.owned ?? false, favorite: !(current?.favorite ?? false),
      obtainedAt: current?.obtainedAt, updatedAt: new Date().toISOString() });
  }

  groupProgress(group: 'generation' | 'type'): Array<{ label: string; owned: number; total: number; percent: number }> {
    const buckets = new Map<string, Pokemon[]>();
    for (const pokemon of this.pokemon()) {
      const keys = group === 'generation' ? [`Generación ${pokemon.generation}`] : pokemon.types;
      for (const key of keys) buckets.set(key, [...(buckets.get(key) ?? []), pokemon]);
    }
    return [...buckets.entries()].map(([label, values]) => {
      const owned = values.filter(value => this.isOwned(value.id)).length;
      return { label, owned, total: values.length, percent: values.length ? Math.round(owned / values.length * 100) : 0 };
    }).sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true }));
  }

  exportJson(): void {
    const payload: ImportExportPayload = { schemaVersion: 1, exportedAt: new Date().toISOString(), entries: [...this.entries().values()] };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `pokecarddex-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  }

  async importJson(file: File): Promise<void> {
    const parsed = JSON.parse(await file.text()) as ImportExportPayload;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.entries)) throw new Error('Archivo incompatible');
    const cleaned = parsed.entries.filter(entry => Number.isInteger(entry.pokemonId)).map(entry => ({
      pokemonId: entry.pokemonId, owned: Boolean(entry.owned), favorite: Boolean(entry.favorite),
      obtainedAt: entry.obtainedAt, updatedAt: new Date().toISOString()
    }));
    await db.collection.bulkPut(cleaned);
    this.entries.set(new Map((await db.collection.toArray()).map(entry => [entry.pokemonId, entry])));
  }

  private async save(entry: CollectionEntry): Promise<void> {
    await db.collection.put(entry);
    this.entries.update(map => { const next = new Map(map); next.set(entry.pokemonId, entry); return next; });
  }
}
