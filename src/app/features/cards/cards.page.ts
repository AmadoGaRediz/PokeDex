import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CardCollectionEntry } from '../../core/models/pokemon.models';
import { CollectionStore } from '../../core/services/collection.store';

type EditState = { cardId: string; quantity: number; language: string; languageQuantity: number };

@Component({
  selector: 'app-cards-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <header class="hero"><p>MIS CARTAS TCG</p><h1>Tu colección física</h1><span>Contador separado de la PokéCardDex principal.</span></header>
  <section class="summary">
    <article><span>Cartas distintas</span><strong>{{store.uniqueCardsOwned()}}</strong></article>
    <article><span>Copias totales</span><strong>{{store.totalCardsOwned()}}</strong></article>
    <article><span>Total TCG API</span><strong>{{store.totalTcgCards() || '—'}}</strong><button (click)="store.refreshTcgTotal()">Actualizar total</button></article>
    <article><span>Valor estimado</span><strong>{{valueLabel()}}</strong><small>Basado en precios disponibles de Pokémon TCG API.</small></article>
  </section>
  <section class="filters"><input placeholder="Buscar por carta, set, rareza o idioma" [ngModel]="query()" (ngModelChange)="query.set($event)"><select [ngModel]="pokemonFilter()" (ngModelChange)="pokemonFilter.set(+$event)"><option [ngValue]="0">Todos los Pokémon</option>@for(p of ownedPokemon();track p.id){<option [ngValue]="p.id">#{{p.id}} {{p.nameEs}}</option>}</select></section>
  @if(filtered().length){<section class="grid">@for(card of filtered();track card.cardId){<article class="card"><img [src]="card.imageSmall" [alt]="card.cardName"><div class="content"><a [routerLink]="['/pokemon', card.pokemonId]">#{{card.pokemonId.toString().padStart(4,'0')}}</a><h2>{{card.cardName}}</h2><p>{{card.setName}} · #{{card.number}}</p><small>{{card.rarity || 'Rareza no disponible'}}</small><div class="badges"><span>{{card.quantity}} copia{{card.quantity===1?'':'s'}}</span>@if(card.marketPriceUsd){<span>{{priceLabel(card)}} c/u</span>}</div><p class="langs">{{languageSummary(card)}}</p><button (click)="openEdit(card)">Editar cantidades</button></div></article>}</section>}
  @else{<section class="empty"><h2>Aún no tienes cartas específicas registradas.</h2><p>Entra al detalle de un Pokémon y pulsa “Tengo esta carta”.</p><a routerLink="/">Ir a la Pokédex</a></section>}

  @if(editing(); as edit){@if(cardById(edit.cardId); as card){<div class="modal" role="dialog" aria-modal="true"><section><button class="close" (click)="editing.set(null)">×</button><img [src]="card.imageLarge" [alt]="card.cardName"><div><h2>{{card.cardName}}</h2><p>{{card.setName}} · #{{card.number}}</p><label>Copias totales<input type="number" min="0" [(ngModel)]="edit.quantity"></label><label>Idioma<input [(ngModel)]="edit.language" list="languages"></label><datalist id="languages"><option>Español</option><option>Inglés</option><option>Japonés</option><option>Coreano</option><option>Francés</option><option>Alemán</option><option>Italiano</option><option>Portugués</option><option>Otro</option></datalist><label>Copias de ese idioma<input type="number" min="0" [(ngModel)]="edit.languageQuantity"></label><div class="modal-actions"><button (click)="saveEdit(card, edit)">Guardar</button><button class="danger" (click)="store.removeCard(card.cardId); editing.set(null)">Eliminar carta</button></div><p class="help">Idiomas actuales: {{languageSummary(card) || 'sin idiomas capturados'}}</p></div></section></div>}}
  `,
  styles: [`
    .hero{position:relative;overflow:hidden;border-radius:30px;padding:34px;background:linear-gradient(135deg,var(--red),#8d1016);color:white;box-shadow:var(--shadow-lg)}.hero:after{content:'';position:absolute;right:-80px;top:-80px;width:260px;height:260px;border-radius:50%;border:32px solid #fff2}.hero p{font-weight:950;letter-spacing:.22em;margin:0}.hero h1{font-size:clamp(2.4rem,8vw,5rem);line-height:.92;margin:8px 0}.hero span{color:#fffbd9}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0}.summary article{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:var(--shadow)}.summary span,.summary small{display:block;color:var(--muted);font-size:.78rem}.summary strong{display:block;font-size:2rem;margin:4px 0}.summary button{border:0;background:var(--chip);color:var(--text);border-radius:999px;padding:6px 10px;font-weight:800}.filters{display:grid;grid-template-columns:1fr 260px;gap:12px;margin-bottom:20px}input,select{height:48px;border-radius:14px;border:1px solid var(--line);background:var(--surface);color:var(--text);padding:0 14px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:16px}.card{display:grid;grid-template-columns:112px 1fr;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:14px;box-shadow:var(--shadow)}.card img{width:112px;border-radius:12px}.card a{color:var(--red);font-weight:950;text-decoration:none}.card h2{margin:3px 0;font-size:1.1rem}.card p,.card small{color:var(--muted);margin:2px 0}.badges{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.badges span{background:var(--chip);border-radius:999px;padding:5px 9px;font-size:.74rem;font-weight:900}.langs{font-size:.82rem}.card button,.empty a,.modal-actions button{border:0;background:var(--red);color:white;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-block}.empty{background:var(--surface);border:1px solid var(--line);border-radius:24px;text-align:center;padding:50px;color:var(--muted)}.modal{position:fixed;inset:0;background:#0009;z-index:60;display:grid;place-items:center;padding:16px}.modal section{position:relative;display:grid;grid-template-columns:minmax(180px,280px) minmax(260px,420px);gap:22px;background:var(--surface);border-radius:24px;padding:22px;max-width:780px;width:100%;box-shadow:var(--shadow-lg)}.modal img{width:100%;border-radius:14px}.close{position:absolute;right:12px;top:10px;border:0;background:transparent;color:var(--text);font-size:2rem;cursor:pointer}label{display:grid;gap:5px;margin:12px 0;color:var(--muted);font-weight:800}.modal input{width:100%}.modal-actions{display:flex;gap:10px;flex-wrap:wrap}.modal-actions .danger{background:#832029}.help{color:var(--muted);font-size:.86rem}@media(max-width:820px){.summary{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr}.modal section{grid-template-columns:1fr;max-height:88vh;overflow:auto}.modal img{max-width:220px;margin:auto}}@media(max-width:520px){.summary{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.card{grid-template-columns:88px 1fr}.card img{width:88px}.hero{border-radius:22px;padding:26px 20px}}`
  ]
})
export class CardsPage {
  readonly store = inject(CollectionStore);
  readonly query = signal('');
  readonly pokemonFilter = signal(0);
  readonly editing = signal<EditState | null>(null);

  readonly ownedPokemon = computed(() => this.store.pokemon().filter(pokemon => this.store.pokemonCards(pokemon.id).length > 0));
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const pokemonId = this.pokemonFilter();
    return [...this.store.cards().values()]
      .filter(card => card.quantity > 0)
      .filter(card => !pokemonId || card.pokemonId === pokemonId)
      .filter(card => !q || [card.cardName, card.setName, card.rarity ?? '', ...Object.keys(card.languageCounts)].some(value => value.toLowerCase().includes(q)))
      .sort((a, b) => a.pokemonId - b.pokemonId || a.cardName.localeCompare(b.cardName));
  });

  valueLabel(): string { return this.store.estimatedValueUsd() ? `$${this.store.estimatedValueUsd().toFixed(2)} USD` : '—'; }
  priceLabel(card: CardCollectionEntry): string { return card.marketPriceUsd ? `$${card.marketPriceUsd.toFixed(2)} USD` : 'Sin precio'; }
  cardById(id: string): CardCollectionEntry | undefined { return this.store.cardEntry(id); }
  languageSummary(card: CardCollectionEntry): string { return Object.entries(card.languageCounts).filter(([, count]) => count > 0).map(([lang, count]) => `${lang}: ${count}`).join(' · '); }
  openEdit(card: CardCollectionEntry): void { const [language, quantity] = Object.entries(card.languageCounts)[0] ?? ['Español', card.quantity]; this.editing.set({ cardId: card.cardId, quantity: card.quantity, language, languageQuantity: quantity }); }
  saveEdit(card: CardCollectionEntry, edit: EditState): void { void this.store.updateCard(card, edit.quantity, { ...card.languageCounts, [edit.language.trim() || 'Otro']: edit.languageQuantity }); this.editing.set(null); }
}
