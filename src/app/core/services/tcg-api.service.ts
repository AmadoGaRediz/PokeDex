import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PokemonCard } from '../models/pokemon.models';

interface CardResponse {
  totalCount: number;
  data: Array<{
    id: string;
    name: string;
    number: string;
    rarity?: string;
    set: { name: string; series?: string; releaseDate?: string };
    images: { small: string; large: string };
    tcgplayer?: { prices?: Record<string, { market?: number; mid?: number }> };
    cardmarket?: { prices?: { averageSellPrice?: number } };
  }>;
}

@Injectable({ providedIn: 'root' })
export class TcgApiService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = localStorage.getItem('pokecarddex_tcg_key') ?? '';

  cardsFor(nameEn: string, pageSize = 40): Observable<PokemonCard[]> {
    const headers = this.apiKey ? new HttpHeaders({ 'X-Api-Key': this.apiKey }) : undefined;
    return this.http.get<CardResponse>('https://api.pokemontcg.io/v2/cards', {
      params: { q: `name:"${nameEn}"`, pageSize, orderBy: '-set.releaseDate' }, headers
    }).pipe(map(response => response.data.map(card => ({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      setName: card.set.name,
      setSeries: card.set.series,
      releaseDate: card.set.releaseDate,
      imageSmall: card.images.small,
      imageLarge: card.images.large,
      marketPriceUsd: this.marketPriceUsd(card),
      marketPriceEur: card.cardmarket?.prices?.averageSellPrice
    }))));
  }

  totalCards(): Observable<number> {
    const headers = this.apiKey ? new HttpHeaders({ 'X-Api-Key': this.apiKey }) : undefined;
    return this.http.get<CardResponse>('https://api.pokemontcg.io/v2/cards', { params: { pageSize: 1 }, headers })
      .pipe(map(response => response.totalCount));
  }

  private marketPriceUsd(card: CardResponse['data'][number]): number | undefined {
    const prices = card.tcgplayer?.prices ? Object.values(card.tcgplayer.prices) : [];
    const value = prices.find(price => typeof price.market === 'number')?.market
      ?? prices.find(price => typeof price.mid === 'number')?.mid
      ?? card.cardmarket?.prices?.averageSellPrice;
    return typeof value === 'number' ? Number(value.toFixed(2)) : undefined;
  }
}
