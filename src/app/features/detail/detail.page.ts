import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CollectionStore } from '../../core/services/collection.store';
import { TcgApiService } from '../../core/services/tcg-api.service';

@Component({
  selector:'app-detail-page', imports:[RouterLink], changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
    @if (pokemon(); as p) {
      <a routerLink="/" class="back">← Volver a la Pokédex</a>
      <section class="detail">
        <div class="art" [class.locked]="!store.isOwned(p.id)"><span>#{{ p.id.toString().padStart(4,'0') }}</span><img [src]="p.image" [alt]="p.nameEs"></div>
        <div class="info"><p class="eyebrow">GENERACIÓN {{ p.generation }}</p><h1>{{ p.nameEs }}</h1><p class="english">{{ p.nameEn }}</p>
          <div class="types">@for(type of p.types;track type){<span>{{type}}</span>}</div>
          <button class="owned" [class.active]="store.isOwned(p.id)" (click)="store.toggleOwned(p.id)">{{ store.isOwned(p.id) ? '✓ Pokémon obtenido' : 'Tengo una carta de este Pokémon' }}</button>
          <button class="favorite" (click)="store.toggleFavorite(p.id)">{{ store.isFavorite(p.id) ? '★ Quitar de favoritos' : '☆ Agregar a favoritos' }}</button>
          <p class="hint">Cualquier carta cuenta, sin importar expansión, rareza, idioma, año o edición.</p>
        </div>
      </section>
      <section class="cards-section"><div class="section-title"><div><p class="eyebrow">POKÉMON TCG</p><h2>Cartas de {{p.nameEs}}</h2></div></div>
        @if(cards();as cardsList){
          @if(cardsList.length){<div class="cards">@for(card of cardsList;track card.id){<article><img [src]="card.imageSmall" [alt]="card.name" loading="lazy"><h3>{{card.name}}</h3><p>{{card.setName}} · #{{card.number}}</p></article>}</div>}
          @else{<div class="notice">No fue posible cargar cartas en este momento. La colección local sigue disponible.</div>}
        } @else {<div class="notice">Cargando cartas relacionadas…</div>}
      </section>
    } @else {<div class="notice">Pokémon no encontrado. <a routerLink="/">Regresar</a></div>}
  `,
  styles:[`
    .back{display:inline-block;margin:4px 0 22px;color:var(--muted);text-decoration:none;font-weight:800}.detail{display:grid;grid-template-columns:minmax(300px,1fr) 1fr;gap:48px;align-items:center}.art{min-height:480px;border-radius:34px;background:radial-gradient(circle at 50% 45%,var(--surface),var(--surface-2));display:grid;place-items:center;position:relative;border:1px solid var(--line);box-shadow:var(--shadow-lg)}.art span{position:absolute;left:28px;top:24px;font-weight:900;color:var(--muted)}.art img{width:min(80%,390px);max-height:420px;object-fit:contain;transition:.5s}.art.locked img{filter:grayscale(1);opacity:.4}.eyebrow{font-size:.74rem;letter-spacing:.2em;color:var(--red);font-weight:900}.info h1{font-size:clamp(3rem,8vw,6rem);line-height:.9;margin:10px 0;text-transform:capitalize;letter-spacing:-.06em}.english{font-size:1.2rem;color:var(--muted);text-transform:capitalize}.types{display:flex;gap:8px;margin:24px 0}.types span{background:var(--chip);padding:8px 16px;border-radius:999px;text-transform:capitalize;font-weight:800}.owned,.favorite{display:block;width:100%;max-width:430px;padding:16px;border-radius:14px;font-weight:900;cursor:pointer;margin-top:12px}.owned{background:var(--red);border:0;color:white}.owned.active{background:var(--success)}.favorite{background:transparent;color:var(--text);border:1px solid var(--line)}.hint{max-width:430px;color:var(--muted);font-size:.88rem;line-height:1.5}.cards-section{margin-top:70px}.section-title h2{font-size:2rem;margin:5px 0 20px}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:18px}.cards article{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:12px;box-shadow:var(--shadow)}.cards img{width:100%;border-radius:12px}.cards h3{font-size:.92rem;margin:10px 0 4px}.cards p{font-size:.75rem;color:var(--muted);margin:0}.notice{padding:40px;text-align:center;background:var(--surface);border-radius:18px;color:var(--muted)}@media(max-width:800px){.detail{grid-template-columns:1fr;gap:25px}.art{min-height:340px}.art img{max-height:300px}.info h1{font-size:3.8rem}}
  `]
})
export class DetailPage {
  readonly store=inject(CollectionStore); private route=inject(ActivatedRoute); private tcg=inject(TcgApiService);
  readonly id=toSignal(this.route.paramMap.pipe(switchMap(params=>of(Number(params.get('id'))))),{initialValue:0});
  readonly pokemon=computed(()=>this.store.pokemon().find(p=>p.id===this.id()));
  readonly cards=toSignal(this.route.paramMap.pipe(switchMap(params=>{const id=Number(params.get('id'));const p=this.store.pokemon().find(x=>x.id===id);return p?this.tcg.cardsFor(p.nameEn).pipe(catchError(()=>of([]))):of([]);})),{initialValue:undefined});
}
