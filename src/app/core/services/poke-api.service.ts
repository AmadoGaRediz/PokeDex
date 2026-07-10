import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Pokemon } from '../models/pokemon.models';

interface Named { name: string; url: string; }
interface ListResponse { count: number; results: Named[]; }
interface PokemonResponse { id: number; name: string; types: { type: Named }[]; sprites: { other: { ['official-artwork']: { front_default: string | null } } }; }
interface SpeciesResponse { names: { language: Named; name: string }[]; generation: Named; }

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://pokeapi.co/api/v2';

  async loadAll(onProgress?: (done: number, total: number) => void): Promise<Pokemon[]> {
    const list = await firstValueFrom(this.http.get<ListResponse>(`${this.base}/pokemon-species?limit=2000`));
    const valid = list.results.filter(item => this.idFromUrl(item.url) > 0);
    const output: Pokemon[] = [];
    const batchSize = 20;

    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize);
      const values = await Promise.all(batch.map(item => this.loadOne(this.idFromUrl(item.url))));
      output.push(...values.filter((value): value is Pokemon => value !== null));
      onProgress?.(Math.min(i + batch.length, valid.length), valid.length);
    }
    return output.sort((a, b) => a.id - b.id);
  }

  private async loadOne(id: number): Promise<Pokemon | null> {
    try {
      const [pokemon, species] = await Promise.all([
        firstValueFrom(this.http.get<PokemonResponse>(`${this.base}/pokemon/${id}`)),
        firstValueFrom(this.http.get<SpeciesResponse>(`${this.base}/pokemon-species/${id}`))
      ]);
      const spanish = species.names.find(item => item.language.name === 'es')?.name ?? pokemon.name;
      return {
        id: pokemon.id,
        nameEn: pokemon.name,
        nameEs: spanish,
        image: pokemon.sprites.other['official-artwork'].front_default ??
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
        types: pokemon.types.map(item => item.type.name),
        generation: this.romanToNumber(species.generation.name.replace('generation-', ''))
      };
    } catch {
      return null;
    }
  }

  private idFromUrl(url: string): number {
    return Number(url.split('/').filter(Boolean).at(-1) ?? 0);
  }

  private romanToNumber(value: string): number {
    const map: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
    return map[value] ?? 0;
  }
}
