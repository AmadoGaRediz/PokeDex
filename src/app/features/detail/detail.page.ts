import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CollectionStore } from '../../core/services/collection.store';
import { CardCollectionEntry, PokemonCard } from '../../core/models/pokemon.models';
import { TcgApiService } from '../../core/services/tcg-api.service';

@Component({
  selector:'app-detail-page', imports:[RouterLink, FormsModule], changeDetection:ChangeDetectionStrategy.OnPush,
  template: `
    @if (pokemon(); as p) {
      <a routerLink="/" class="back">← Volver a la Pokédex</a>

      <section class="detail">
        <div class="art" [class.locked]="!store.isOwned(p.id)">
          <span>#{{ p.id.toString().padStart(4, '0') }}</span>
          <img [src]="p.image" [alt]="p.nameEs">
        </div>

        <div class="info">
          <p class="eyebrow">GENERACIÓN {{ p.generation }}</p>
          <h1>{{ p.nameEs }}</h1>
          <p class="english">{{ p.nameEn }}</p>

          <div class="types">
            @for (type of p.types; track type) {
              <span>{{ type }}</span>
            }
          </div>

          <div class="mini-stats">
            <article>
              <strong>{{ store.pokemonCards(p.id).length }}</strong>
              <span>cartas distintas</span>
            </article>
            <article>
              <strong>{{ pokemonTotalCopies() }}</strong>
              <span>copias totales</span>
            </article>
          </div>

          <button class="owned" [class.active]="store.isOwned(p.id)" (click)="store.toggleOwned(p.id)">
            {{ store.isOwned(p.id) ? '✓ Pokémon obtenido' : 'Tengo una carta de este Pokémon' }}
          </button>
          <button class="favorite" (click)="store.toggleFavorite(p.id)">
            {{ store.isFavorite(p.id) ? '★ Quitar de favoritos' : '☆ Agregar a favoritos' }}
          </button>
          <p class="hint">
            Cualquier carta cuenta para la Pokédex principal. Las cartas específicas se cuentan aparte para tu colección TCG.
          </p>
        </div>
      </section>

      <section class="owned-list">
        <div class="section-title">
          <div>
            <p class="eyebrow">TU CARPETA</p>
            <h2>Cartas registradas de {{ p.nameEs }}</h2>
          </div>
          <a routerLink="/cartas">Ver todas</a>
        </div>

        @if (store.pokemonCards(p.id).length) {
          <div class="owned-cards">
            @for (card of store.pokemonCards(p.id); track card.cardId) {
              <article>
                <img [src]="card.imageSmall" [alt]="card.cardName">
                <div>
                  <h3>{{ card.cardName }}</h3>
                  <p>{{ card.setName }} · #{{ card.number }}</p>
                  <strong>{{ card.quantity }} copia{{ card.quantity === 1 ? '' : 's' }}</strong>
                  <small>{{ languageSummary(card) }}</small>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="notice compact">Aún no registras cartas específicas de este Pokémon.</div>
        }
      </section>

      <section class="cards-section">
        <div class="section-title">
          <div>
            <p class="eyebrow">POKÉMON TCG</p>
            <h2>Cartas disponibles de {{ p.nameEs }}</h2>
          </div>
        </div>

        @if (cards(); as cardsList) {
          @if (cardsList.length) {
            <div class="cards">
              @for (card of cardsList; track card.id) {
                <article [class.saved]="store.cardQuantity(card.id) > 0">
                  <img [src]="card.imageSmall" [alt]="card.name" loading="lazy">
                  <h3>{{ card.name }}</h3>
                  <p>{{ card.setName }} · #{{ card.number }}</p>
                  <small>{{ card.rarity || 'Rareza no disponible' }}{{ priceLabel(card) }}</small>

                  <div class="card-actions">
                    <select #lang>
                      <option>Español</option>
                      <option>Inglés</option>
                      <option>Japonés</option>
                      <option>Coreano</option>
                      <option>Francés</option>
                      <option>Alemán</option>
                      <option>Italiano</option>
                      <option>Portugués</option>
                      <option>Otro</option>
                    </select>
                    <button (click)="store.addCard(p.id, card, lang.value)">
                      {{ store.cardQuantity(card.id) > 0 ? '+ Agregar copia' : 'Tengo esta carta' }}
                    </button>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="notice">No fue posible cargar cartas en este momento. La colección local sigue disponible.</div>
          }
        } @else {
          <div class="notice">Cargando cartas relacionadas…</div>
        }
      </section>
    } @else {
      <div class="notice">Pokémon no encontrado. <a routerLink="/">Regresar</a></div>
    }
  `,
  styles:[`
    .back{display:inline-block;margin:4px 0 18px;color:var(--muted);text-decoration:none;font-weight:900}.detail{display:grid;grid-template-columns:minmax(280px,1fr) 1fr;gap:34px;align-items:center;padding:20px;border-radius:32px;background:linear-gradient(145deg,color-mix(in srgb,var(--red) 12%,var(--surface)),var(--surface));border:1px solid var(--line);box-shadow:var(--shadow-lg)}.art{min-height:430px;border-radius:28px;background:radial-gradient(circle at 50% 45%,var(--surface),var(--surface-2));display:grid;place-items:center;position:relative;border:1px solid var(--line);overflow:hidden}.art:before{content:'';position:absolute;inset:22px;border:2px solid color-mix(in srgb,var(--red) 30%,transparent);border-radius:24px}.art span{position:absolute;left:28px;top:24px;font-weight:950;color:var(--muted)}.art img{width:min(80%,360px);max-height:390px;object-fit:contain;transition:.5s}.art.locked img{filter:grayscale(1);opacity:.4}.eyebrow{font-size:.74rem;letter-spacing:.2em;color:var(--red);font-weight:950}.info h1{font-size:clamp(3rem,8vw,5.6rem);line-height:.9;margin:10px 0;text-transform:capitalize;letter-spacing:-.06em}.english{font-size:1.15rem;color:var(--muted);text-transform:capitalize}.types{display:flex;gap:8px;margin:22px 0;flex-wrap:wrap}.types span{background:var(--chip);padding:8px 16px;border-radius:999px;text-transform:capitalize;font-weight:900}.mini-stats{display:grid;grid-template-columns:repeat(2,minmax(0,180px));gap:10px;margin-bottom:10px}.mini-stats article{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:13px}.mini-stats strong{font-size:1.6rem;display:block}.mini-stats span{color:var(--muted);font-size:.78rem}.owned,.favorite{display:block;width:100%;max-width:430px;padding:16px;border-radius:16px;font-weight:950;cursor:pointer;margin-top:12px}.owned{background:var(--red);border:0;color:white}.owned.active{background:var(--success)}.favorite{background:transparent;color:var(--text);border:1px solid var(--line)}.hint{max-width:430px;color:var(--muted);font-size:.88rem;line-height:1.5}.cards-section,.owned-list{margin-top:48px}.section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}.section-title h2{font-size:2rem;margin:5px 0 20px}.section-title a{color:var(--red);font-weight:900;text-decoration:none}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:18px}.cards article{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:12px;box-shadow:var(--shadow);position:relative}.cards article.saved{outline:3px solid color-mix(in srgb,var(--success) 55%,transparent)}.cards img{width:100%;border-radius:13px}.cards h3{font-size:.92rem;margin:10px 0 4px}.cards p,.cards small{font-size:.75rem;color:var(--muted);margin:0}.card-actions{display:grid;gap:8px;margin-top:12px}select,button{border-radius:12px;border:1px solid var(--line);padding:10px;background:var(--surface-2);color:var(--text);font-weight:800}button{cursor:pointer}.card-actions button{background:var(--red);color:white;border:0}.owned-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}.owned-cards article{display:flex;gap:13px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:12px}.owned-cards img{width:72px;border-radius:8px}.owned-cards h3{margin:2px 0}.owned-cards p,.owned-cards small{display:block;color:var(--muted);margin:2px 0}.notice{padding:40px;text-align:center;background:var(--surface);border-radius:18px;color:var(--muted);border:1px solid var(--line)}.compact{padding:22px}@media(max-width:800px){.detail{grid-template-columns:1fr;padding:12px;border-radius:24px}.art{min-height:300px}.art img{max-height:270px}.info{padding:4px 8px 12px}.info h1{font-size:3.3rem}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.section-title{align-items:flex-start;flex-direction:column}.mini-stats{grid-template-columns:1fr 1fr}.owned-cards{grid-template-columns:1fr}}`]
})
export class DetailPage {
  readonly store=inject(CollectionStore); private route=inject(ActivatedRoute); private tcg=inject(TcgApiService);
  readonly id=toSignal(this.route.paramMap.pipe(switchMap(params=>of(Number(params.get('id'))))),{initialValue:0});
  readonly pokemon=computed(()=>this.store.pokemon().find(p=>p.id===this.id()));
  readonly pokemonTotalCopies=computed(()=>this.store.pokemonCards(this.id()).reduce((sum, card)=>sum + card.quantity, 0));
  readonly cards=toSignal(this.route.paramMap.pipe(switchMap(params=>{const id=Number(params.get('id'));const p=this.store.pokemon().find(x=>x.id===id);return p?this.tcg.cardsFor(p.nameEn).pipe(catchError(()=>of([]))):of([]);})),{initialValue:undefined});

  languageSummary(card: CardCollectionEntry): string { return Object.entries(card.languageCounts).filter(([, count]) => count > 0).map(([lang, count]) => `${lang}: ${count}`).join(' · '); }
  priceLabel(card: PokemonCard): string { return card.marketPriceUsd ? ` · $${card.marketPriceUsd.toFixed(2)} USD` : ''; }
}

