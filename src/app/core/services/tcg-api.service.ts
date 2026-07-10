import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PokemonCard } from '../models/pokemon.models';

interface CardResponse {
  data: Array<{ id: string; name: string; number: string; rarity?: string; set: { name: string }; images: { small: string; large: string } }>;
}

@Injectable({ providedIn: 'root' })
export class TcgApiService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = localStorage.getItem('pokecarddex_tcg_key') ?? '';

  cardsFor(nameEn: string): Observable<PokemonCard[]> {
    const headers = this.apiKey ? new HttpHeaders({ 'X-Api-Key': this.apiKey }) : undefined;
    return this.http.get<CardResponse>('https://api.pokemontcg.io/v2/cards', {
      params: { q: `name:"${nameEn}"`, pageSize: 12, orderBy: '-set.releaseDate' }, headers
    }).pipe(map(response => response.data.map(card => ({
      id: card.id, name: card.name, number: card.number, rarity: card.rarity,
      setName: card.set.name, imageSmall: card.images.small, imageLarge: card.images.large
    }))));
  }
}
