import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { db } from '../database/app-db';
import { Achievement, CardCollectionEntry, CardVariant, CollectionEntry, ImportExportPayload, Pokemon, PokemonCard, PriceCurrency, UserSettings } from '../models/pokemon.models';
import { PokeApiService } from './poke-api.service';
import { TcgApiService } from './tcg-api.service';

@Injectable({ providedIn: 'root' })
export class CollectionStore {
  private readonly api = inject(PokeApiService);
  private readonly tcg = inject(TcgApiService);

  readonly pokemon = signal<Pokemon[]>([]);
  readonly entries = signal<Map<number, CollectionEntry>>(new Map());
  readonly cards = signal<Map<string, CardCollectionEntry>>(new Map());
  readonly trainerName = signal('Entrenador');
  readonly totalTcgCards = signal(0);
  readonly preferredCurrency = signal<PriceCurrency>('USD');
  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);
  readonly achievementToast = signal<Achievement | null>(null);

  private unlockedSnapshot = new Set<string>();
  private toastTimer: number | undefined;

  readonly total = computed(() => this.pokemon().length);
  readonly ownedCount = computed(() => [...this.entries().values()].filter(x => x.owned).length);
  readonly missingCount = computed(() => Math.max(0, this.total() - this.ownedCount()));
  readonly percent = computed(() => this.total() ? Math.round(this.ownedCount() / this.total() * 100) : 0);
  readonly uniqueCardsOwned = computed(() => [...this.cards().values()].filter(card => this.entryQuantity(card) > 0).length);
  readonly totalCardsOwned = computed(() => [...this.cards().values()].reduce((sum, card) => sum + this.entryQuantity(card), 0));
  readonly estimatedValueUsd = computed(() => Number([...this.cards().values()].reduce((sum, card) => {
    if (card.variants?.length) return sum + card.variants.reduce((variantSum, variant) => variantSum + ((variant.currency === 'USD' ? variant.estimatedPrice : undefined) ?? card.marketPriceUsd ?? 0) * variant.quantity, 0);
    return sum + ((card.marketPriceUsd ?? 0) * Math.max(0, card.quantity));
  }, 0).toFixed(2)));
  readonly purchaseValueUsd = computed(() => Number([...this.cards().values()].reduce((sum, card) => sum + (card.variants ?? []).reduce((variantSum, item) => variantSum + (item.currency === 'USD' ? (item.purchasePrice ?? 0) * item.quantity : 0), 0), 0).toFixed(2)));
  readonly cardPercent = computed(() => this.totalTcgCards() ? Math.min(100, Number((this.uniqueCardsOwned() / this.totalTcgCards() * 100).toFixed(2))) : 0);

  readonly achievements = computed<Achievement[]>(() => {
    const owned = this.ownedCount();
    const uniqueCards = this.uniqueCardsOwned();
    const totalCards = this.totalCardsOwned();
    const value = this.estimatedValueUsd();
    const generations = this.groupProgress('generation');
    const types = this.groupProgress('type');
    const completedGenerations = generations.filter(item => item.owned === item.total && item.total > 0).length;
    const completedTypes = types.filter(item => item.owned === item.total && item.total > 0).length;
    const favoriteCount = [...this.entries().values()].filter(entry => entry.favorite).length;
    const languageKinds = new Set<string>();
    for (const card of this.cards().values()) Object.entries(card.languageCounts).forEach(([lang, count]) => { if (count > 0) languageKinds.add(lang); });

    return [
      { id: 'first-pokemon', title: 'Primera captura', description: 'Marca tu primer Pokémon como obtenido.', unlocked: owned >= 1, icon: '🥉', tier: 'bronze' },
      { id: 'starter-team', title: 'Equipo inicial', description: 'Obtén 3 Pokémon.', unlocked: owned >= 3, icon: '🔥', tier: 'bronze' },
      { id: 'ten-pokemon', title: 'Diez registros', description: 'Obtén 10 Pokémon.', unlocked: owned >= 10, icon: '🔴', tier: 'bronze' },
      { id: 'twenty-five-pokemon', title: 'Ruta avanzada', description: 'Obtén 25 Pokémon.', unlocked: owned >= 25, icon: '🧭', tier: 'bronze' },
      { id: 'fifty-pokemon', title: 'Coleccionista', description: 'Obtén 50 Pokémon.', unlocked: owned >= 50, icon: '🥈', tier: 'silver' },
      { id: 'hundred-pokemon', title: 'Centenario', description: 'Obtén 100 Pokémon.', unlocked: owned >= 100, icon: '🏅', tier: 'silver' },
      { id: 'two-hundred-pokemon', title: 'Doble centena', description: 'Obtén 200 Pokémon.', unlocked: owned >= 200, icon: '⚙️', tier: 'silver' },
      { id: 'three-hundred-pokemon', title: 'Archivo regional', description: 'Obtén 300 Pokémon.', unlocked: owned >= 300, icon: '📘', tier: 'silver' },
      { id: 'five-hundred-pokemon', title: 'Mitad legendaria', description: 'Obtén 500 Pokémon.', unlocked: owned >= 500, icon: '🥇', tier: 'gold' },
      { id: 'seven-fifty-pokemon', title: 'Ultra coleccionista', description: 'Obtén 750 Pokémon.', unlocked: owned >= 750, icon: '💎', tier: 'platinum' },
      { id: 'all-pokedex', title: 'Maestro de la PokéCardDex', description: 'Completa todos los Pokémon existentes con al menos una carta.', unlocked: this.total() > 0 && owned === this.total(), icon: '👑', tier: 'master' },
      { id: 'first-favorite', title: 'Favorito elegido', description: 'Marca un Pokémon como favorito.', unlocked: favoriteCount >= 1, icon: '⭐', tier: 'bronze' },
      { id: 'ten-favorites', title: 'Vitrina personal', description: 'Marca 10 Pokémon como favoritos.', unlocked: favoriteCount >= 10, icon: '🌟', tier: 'silver' },
      { id: 'generation-one', title: 'Kanto completo', description: 'Completa la Generación 1.', unlocked: this.generationCompleted(1), icon: '🗺️', tier: 'gold' },
      { id: 'any-generation', title: 'Maestro generacional', description: 'Completa cualquier generación.', unlocked: completedGenerations >= 1, icon: '🏆', tier: 'gold' },
      { id: 'three-generations', title: 'Tres regiones dominadas', description: 'Completa 3 generaciones.', unlocked: completedGenerations >= 3, icon: '🏰', tier: 'platinum' },
      { id: 'all-generations', title: 'Todas las regiones', description: 'Completa todas las generaciones disponibles.', unlocked: generations.length > 0 && completedGenerations === generations.length, icon: '🌎', tier: 'master' },
      { id: 'one-type', title: 'Especialista de tipo', description: 'Completa todos los Pokémon de un tipo.', unlocked: completedTypes >= 1, icon: '⚡', tier: 'gold' },
      { id: 'five-types', title: 'Maestro multitypo', description: 'Completa 5 tipos.', unlocked: completedTypes >= 5, icon: '🛡️', tier: 'platinum' },
      { id: 'all-types', title: 'Dominio elemental', description: 'Completa todos los tipos disponibles.', unlocked: types.length > 0 && completedTypes === types.length, icon: '🌈', tier: 'master' },
      { id: 'first-card', title: 'Primera carta registrada', description: 'Agrega tu primera carta específica.', unlocked: uniqueCards >= 1, icon: '🃏', tier: 'bronze' },
      { id: 'ten-unique-cards', title: 'Carpeta inicial', description: 'Registra 10 cartas distintas.', unlocked: uniqueCards >= 10, icon: '📒', tier: 'bronze' },
      { id: 'fifty-unique-cards', title: 'Binder serio', description: 'Registra 50 cartas distintas.', unlocked: uniqueCards >= 50, icon: '📚', tier: 'silver' },
      { id: 'hundred-unique-cards', title: 'Archivo TCG', description: 'Registra 100 cartas distintas.', unlocked: uniqueCards >= 100, icon: '🗃️', tier: 'gold' },
      { id: 'five-hundred-unique-cards', title: 'Museo de cartas', description: 'Registra 500 cartas distintas.', unlocked: uniqueCards >= 500, icon: '🏛️', tier: 'platinum' },
      { id: 'all-tcg-cards', title: 'Leyenda TCG absoluta', description: 'Registra una copia de cada carta existente en Pokémon TCG API.', unlocked: this.totalTcgCards() > 0 && uniqueCards >= this.totalTcgCards(), icon: '👑', tier: 'master' },
      { id: 'ten-total-copies', title: 'Diez copias', description: 'Acumula 10 cartas contando duplicados.', unlocked: totalCards >= 10, icon: '🔢', tier: 'bronze' },
      { id: 'hundred-total-copies', title: 'Caja de entrenador', description: 'Acumula 100 cartas contando duplicados.', unlocked: totalCards >= 100, icon: '📦', tier: 'silver' },
      { id: 'multi-language', title: 'Colección internacional', description: 'Registra cartas en 3 idiomas diferentes.', unlocked: languageKinds.size >= 3, icon: '🌐', tier: 'gold' },
      { id: 'value-100', title: 'Tesoro inicial', description: 'Alcanza un valor estimado de $100 USD.', unlocked: value >= 100, icon: '💰', tier: 'silver' },
      { id: 'value-500', title: 'Tesoro premium', description: 'Alcanza un valor estimado de $500 USD.', unlocked: value >= 500, icon: '💵', tier: 'gold' }
    ];
  });

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [cachedPokemon, cachedEntries, cachedCards, settings] = await Promise.all([
        db.pokemon.toArray(), db.collection.toArray(), db.cards.toArray(), db.settings.get('profile')
      ]);
      this.pokemon.set(cachedPokemon.sort((a, b) => a.id - b.id));
      this.entries.set(new Map(cachedEntries.map(entry => [entry.pokemonId, entry])));
      this.cards.set(new Map(cachedCards.map(card => [card.cardId, card])));
      this.trainerName.set(settings?.trainerName?.trim() || 'Entrenador');
      this.totalTcgCards.set(settings?.totalTcgCards ?? 0);
      this.preferredCurrency.set(settings?.preferredCurrency ?? 'USD');
      this.unlockedSnapshot = new Set(this.achievements().filter(item => item.unlocked).map(item => item.id));
      if (!cachedPokemon.length && navigator.onLine) await this.syncPokemon();
      else if (!cachedPokemon.length) this.error.set('Conéctate una vez para descargar la Pokédex. Después funcionará sin internet.');
      if (navigator.onLine && !this.totalTcgCards()) void this.refreshTcgTotal();
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
      this.checkAchievements();
    } catch { this.error.set('No se pudo actualizar la Pokédex. Revisa tu conexión.'); }
    finally { this.syncing.set(false); }
  }

  async refreshTcgTotal(): Promise<void> {
    try {
      const total = await firstValueFrom(this.tcg.totalCards());
      this.totalTcgCards.set(total);
      await this.saveSettings({ totalTcgCards: total });
    } catch { /* La cifra global de cartas es opcional y no debe bloquear la app. */ }
  }

  entry(id: number): CollectionEntry | undefined { return this.entries().get(id); }
  cardEntry(id: string): CardCollectionEntry | undefined { return this.cards().get(id); }
  isOwned(id: number): boolean { return this.entry(id)?.owned ?? false; }
  isFavorite(id: number): boolean { return this.entry(id)?.favorite ?? false; }
  cardQuantity(id: string): number { const card = this.cardEntry(id); return card ? this.entryQuantity(card) : 0; }
  pokemonCards(pokemonId: number): CardCollectionEntry[] { return [...this.cards().values()].filter(card => card.pokemonId === pokemonId && this.entryQuantity(card) > 0); }
  entryQuantity(card: CardCollectionEntry): number { return card.variants?.length ? card.variants.reduce((sum, variant) => sum + Math.max(0, variant.quantity), 0) : Math.max(0, card.quantity); }

  async toggleOwned(id: number): Promise<void> {
    const current = this.entry(id);
    const owned = !(current?.owned ?? false);
    await this.saveCollection({ pokemonId: id, owned, favorite: current?.favorite ?? false,
      obtainedAt: owned ? (current?.obtainedAt ?? new Date().toISOString()) : undefined,
      updatedAt: new Date().toISOString() });
  }

  async toggleFavorite(id: number): Promise<void> {
    const current = this.entry(id);
    await this.saveCollection({ pokemonId: id, owned: current?.owned ?? false, favorite: !(current?.favorite ?? false),
      obtainedAt: current?.obtainedAt, updatedAt: new Date().toISOString() });
  }

  async setTrainerName(name: string): Promise<void> {
    await this.saveSettings({ trainerName: name.trim() || 'Entrenador' });
  }

  async setPreferredCurrency(currency: PriceCurrency): Promise<void> {
    await this.saveSettings({ preferredCurrency: currency });
  }

  async addCard(pokemonId: number, card: PokemonCard, language = 'Español'): Promise<void> {
    const current = this.cardEntry(card.id);
    const variants = [...(current?.variants ?? [])];
    const existing = variants.find(item => item.language === language && item.condition === 'Near Mint' && item.finish === 'Normal' && !item.firstEdition);
    if (existing) existing.quantity += 1;
    else variants.push({ id: crypto.randomUUID(), language, quantity: 1, condition: 'Near Mint', finish: 'Normal', firstEdition: false, currency: 'USD' });
    const quantity = variants.reduce((sum, item) => sum + item.quantity, 0);
    const languageCounts = this.languageCountsFromVariants(variants);
    await this.saveCard({ ...this.toCardEntry(pokemonId, card, quantity, languageCounts), ...current, variants, quantity, languageCounts, updatedAt: new Date().toISOString() });
    if (!this.isOwned(pokemonId)) await this.toggleOwned(pokemonId);
  }

  async saveVariant(card: CardCollectionEntry, variant: CardVariant): Promise<void> {
    const clean: CardVariant = {
      ...variant,
      id: variant.id || crypto.randomUUID(),
      language: variant.language.trim() || 'Otro',
      quantity: Math.max(0, Math.floor(Number(variant.quantity) || 0)),
      purchasePrice: this.optionalNumber(variant.purchasePrice),
      estimatedPrice: this.optionalNumber(variant.estimatedPrice),
      grade: this.optionalNumber(variant.grade)
    };
    const variants = [...(card.variants ?? [])].filter(item => item.id !== clean.id);
    if (clean.quantity > 0) variants.push(clean);
    const quantity = variants.reduce((sum, item) => sum + item.quantity, 0);
    await this.saveCard({ ...card, variants, quantity, languageCounts: this.languageCountsFromVariants(variants), updatedAt: new Date().toISOString() });
  }

  async removeVariant(card: CardCollectionEntry, variantId: string): Promise<void> {
    const variants = (card.variants ?? []).filter(item => item.id !== variantId);
    const quantity = variants.reduce((sum, item) => sum + item.quantity, 0);
    await this.saveCard({ ...card, variants, quantity, languageCounts: this.languageCountsFromVariants(variants), updatedAt: new Date().toISOString() });
  }

  async updateCard(card: CardCollectionEntry, quantity: number, languageCounts: Record<string, number>): Promise<void> {
    const cleanQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
    const cleanLanguages = Object.fromEntries(
      Object.entries(languageCounts)
        .map(([key, value]): [string, number] => [
          key,
          Math.max(0, Math.floor(Number(value) || 0))
        ])
        .filter((entry): entry is [string, number] => entry[1] > 0)
    );
    const variants = card.variants?.length ? card.variants : Object.entries(cleanLanguages).map(([language, count]) => ({ id: crypto.randomUUID(), language, quantity: count, condition: 'Near Mint' as const, finish: 'Normal' as const, firstEdition: false, currency: 'USD' as const }));
    await this.saveCard({ ...card, quantity: cleanQuantity, languageCounts: cleanLanguages, variants, updatedAt: new Date().toISOString() });
  }

  async removeCard(cardId: string): Promise<void> {
    await db.cards.delete(cardId);
    this.cards.update(map => { const next = new Map(map); next.delete(cardId); return next; });
    this.checkAchievements();
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
    const payload: ImportExportPayload = {
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      entries: [...this.entries().values()],
      cards: [...this.cards().values()],
      settings: { id: 'profile', trainerName: this.trainerName(), totalTcgCards: this.totalTcgCards(), preferredCurrency: this.preferredCurrency(), updatedAt: new Date().toISOString() }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `pokecarddex-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  }

  async importJson(file: File): Promise<void> {
    const parsed = JSON.parse(await file.text()) as Partial<ImportExportPayload> & { schemaVersion: number };
    if (![1, 2, 3].includes(parsed.schemaVersion) || !Array.isArray(parsed.entries)) throw new Error('Archivo incompatible');
    const cleanedEntries = parsed.entries.filter(entry => Number.isInteger(entry.pokemonId)).map(entry => ({
      pokemonId: entry.pokemonId, owned: Boolean(entry.owned), favorite: Boolean(entry.favorite),
      obtainedAt: entry.obtainedAt, updatedAt: new Date().toISOString()
    }));
    const cleanedCards = (parsed.cards ?? []).filter(card => typeof card.cardId === 'string').map(card => {
      const variants = card.variants ?? Object.entries(card.languageCounts ?? {}).map(([language, count]) => ({ id: crypto.randomUUID(), language, quantity: Math.max(0, Number(count) || 0), condition: 'Near Mint' as const, finish: 'Normal' as const, firstEdition: false, currency: 'USD' as const }));
      return { ...card, variants, quantity: variants.reduce((sum, item) => sum + item.quantity, 0), languageCounts: this.languageCountsFromVariants(variants), updatedAt: new Date().toISOString() };
    });
    await db.transaction('rw', db.collection, db.cards, db.settings, async () => {
      await db.collection.bulkPut(cleanedEntries);
      if (cleanedCards.length) await db.cards.bulkPut(cleanedCards);
      if (parsed.settings) await db.settings.put({ ...parsed.settings, id: 'profile', updatedAt: new Date().toISOString() });
    });
    const [entries, cards, settings] = await Promise.all([db.collection.toArray(), db.cards.toArray(), db.settings.get('profile')]);
    this.entries.set(new Map(entries.map(entry => [entry.pokemonId, entry])));
    this.cards.set(new Map(cards.map(card => [card.cardId, card])));
    this.trainerName.set(settings?.trainerName?.trim() || 'Entrenador');
    this.totalTcgCards.set(settings?.totalTcgCards ?? this.totalTcgCards());
    this.preferredCurrency.set(settings?.preferredCurrency ?? this.preferredCurrency());
    this.checkAchievements();
  }

  private generationCompleted(value: number): boolean {
    const item = this.groupProgress('generation').find(row => row.label === `Generación ${value}`);
    return !!item && item.total > 0 && item.owned === item.total;
  }

  private async saveCollection(entry: CollectionEntry): Promise<void> {
    await db.collection.put(entry);
    this.entries.update(map => { const next = new Map(map); next.set(entry.pokemonId, entry); return next; });
    this.checkAchievements();
  }

  private async saveCard(entry: CardCollectionEntry): Promise<void> {
    if (entry.quantity <= 0) return this.removeCard(entry.cardId);
    await db.cards.put(entry);
    this.cards.update(map => { const next = new Map(map); next.set(entry.cardId, entry); return next; });
    this.checkAchievements();
  }

  private async saveSettings(values: Partial<UserSettings>): Promise<void> {
    const current = await db.settings.get('profile');
    const next: UserSettings = { id: 'profile', trainerName: this.trainerName(), totalTcgCards: this.totalTcgCards(), preferredCurrency: this.preferredCurrency(), ...current, ...values, updatedAt: new Date().toISOString() };
    await db.settings.put(next);
    this.trainerName.set(next.trainerName?.trim() || 'Entrenador');
    this.totalTcgCards.set(next.totalTcgCards ?? 0);
    this.preferredCurrency.set(next.preferredCurrency ?? 'USD');
  }

  private toCardEntry(pokemonId: number, card: PokemonCard, quantity: number, languageCounts: Record<string, number>): CardCollectionEntry {
    return { cardId: card.id, pokemonId, cardName: card.name, setName: card.setName, number: card.number, rarity: card.rarity,
      imageSmall: card.imageSmall, imageLarge: card.imageLarge, marketPriceUsd: card.marketPriceUsd, marketPriceEur: card.marketPriceEur, quantity, languageCounts, variants: [], updatedAt: new Date().toISOString() };
  }

  private languageCountsFromVariants(variants: CardVariant[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const variant of variants) result[variant.language] = (result[variant.language] ?? 0) + Math.max(0, variant.quantity);
    return result;
  }

  private optionalNumber(value: number | undefined): number | undefined {
    if (value === undefined || value === null || value === ('' as unknown as number)) return undefined;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : undefined;
  }

  private checkAchievements(): void {
    const unlockedNow = this.achievements().filter(item => item.unlocked);
    const fresh = unlockedNow.find(item => !this.unlockedSnapshot.has(item.id));
    this.unlockedSnapshot = new Set(unlockedNow.map(item => item.id));
    if (!fresh) return;
    this.achievementToast.set(fresh);
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.achievementToast.set(null), 5200);
  }
}
