import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollectionStore } from '../../core/services/collection.store';
import { PokemonCardComponent } from '../../shared/components/pokemon-card.component';

type StatusFilter = 'all' | 'owned' | 'missing' | 'favorites';
@Component({
  selector: 'app-dex-page', imports: [FormsModule, PokemonCardComponent], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div><p class="eyebrow">TU COLECCIÓN TCG</p><h1>Completa la Pokédex,<br><span>una carta a la vez.</span></h1><p>No importa la expansión, rareza o idioma: cualquier carta cuenta.</p></div>
      <div class="hero-ball" aria-hidden="true"><div></div></div>
    </section>

    <section class="filters" aria-label="Filtros de Pokédex">
      <label class="search"><span>⌕</span><input [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Buscar por nombre, número o tipo"></label>
      <select [ngModel]="type()" (ngModelChange)="type.set($event)"><option value="">Todos los tipos</option>@for (item of types(); track item){<option [value]="item">{{ item }}</option>}</select>
      <select [ngModel]="generation()" (ngModelChange)="generation.set(+$event)"><option value="0">Todas las generaciones</option>@for (item of generations(); track item){<option [value]="item">Generación {{ item }}</option>}</select>
      <select [ngModel]="status()" (ngModelChange)="status.set($event)"><option value="all">Todos</option><option value="owned">Solo obtenidos</option><option value="missing">Solo faltantes</option><option value="favorites">Favoritos</option></select>
    </section>

    <div class="result-row"><strong>{{ filtered().length }}</strong> Pokémon encontrados <button (click)="clearFilters()">Limpiar filtros</button></div>
    @if (store.loading() || store.syncing()) {
      <div class="loading"><div class="spinner"></div><h2>Preparando tu PokéCardDex</h2><p>{{ store.syncing() ? 'Descargando Pokédex… ' + store.progress() + '%' : 'Cargando progreso local…' }}</p></div>
    } @else if (store.error() && !store.total()) {
      <div class="empty"><h2>Sin datos disponibles</h2><p>{{ store.error() }}</p><button class="primary" (click)="store.syncPokemon()">Reintentar</button></div>
    } @else {
      <section class="grid">
        @for (pokemon of filtered(); track pokemon.id) {
          <app-pokemon-card [pokemon]="pokemon" [owned]="store.isOwned(pokemon.id)" [favorite]="store.isFavorite(pokemon.id)" (favoriteToggle)="store.toggleFavorite(pokemon.id)" />
        } @empty { <div class="empty"><h2>No hay coincidencias</h2><p>Prueba con otros filtros.</p></div> }
      </section>
    }
  `,
  styles: [`
    .hero{border-radius:30px;background:linear-gradient(125deg,#b81724,#e63946);color:white;padding:44px 48px;display:flex;justify-content:space-between;align-items:center;overflow:hidden;box-shadow:var(--shadow-lg);margin-bottom:24px}.eyebrow{font-size:.72rem;letter-spacing:.22em;font-weight:900;color:#ffd65a}.hero h1{font-size:clamp(2.2rem,6vw,4.6rem);line-height:.98;margin:8px 0 16px;letter-spacing:-.05em}.hero h1 span{color:#ffd65a}.hero p:last-child{max-width:530px;opacity:.9}.hero-ball{width:220px;height:220px;border:24px solid #fff3;border-radius:50%;position:relative;flex:none}.hero-ball:before{content:'';position:absolute;left:-24px;right:-24px;top:calc(50% - 12px);height:24px;background:#fff3}.hero-ball div{width:65px;height:65px;border:18px solid #fff3;border-radius:50%;position:absolute;inset:0;margin:auto;background:#d92835}
    .filters{display:grid;grid-template-columns:minmax(240px,1fr) repeat(3,minmax(145px,190px));gap:12px;padding:16px;border:1px solid var(--line);background:var(--surface);border-radius:20px;box-shadow:var(--shadow)}input,select{width:100%;height:46px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);color:var(--text);padding:0 13px;box-sizing:border-box}.search{position:relative}.search span{position:absolute;left:14px;top:8px;font-size:1.7rem;color:var(--muted)}.search input{padding-left:42px}.result-row{display:flex;gap:5px;align-items:center;margin:22px 4px;color:var(--muted)}.result-row button{margin-left:auto;border:0;background:none;color:var(--red);font-weight:800;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px}.empty,.loading{grid-column:1/-1;text-align:center;padding:70px 20px;color:var(--muted)}.spinner{width:48px;height:48px;border:5px solid var(--line);border-top-color:var(--red);border-radius:50%;animation:spin 1s linear infinite;margin:auto}@keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:850px){.filters{grid-template-columns:1fr 1fr}.search{grid-column:1/-1}.hero-ball{display:none}}@media(max-width:520px){.hero{padding:30px 22px;border-radius:22px}.filters{grid-template-columns:1fr}.search{grid-column:auto}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}
  `]
})
export class DexPage {
  readonly store = inject(CollectionStore); query = signal(''); type = signal(''); generation = signal(0); status = signal<StatusFilter>('all');
  readonly types = computed(() => [...new Set(this.store.pokemon().flatMap(p => p.types))].sort());
  readonly generations = computed(() => [...new Set(this.store.pokemon().map(p => p.generation))].filter(Boolean).sort((a,b)=>a-b));
  readonly filtered = computed(() => {
    const q=this.query().trim().toLowerCase(), type=this.type(), gen=Number(this.generation()), status=this.status();
    return this.store.pokemon().filter(p => (!q || p.nameEs.toLowerCase().includes(q) || p.nameEn.includes(q) || String(p.id).includes(q) || p.types.some(t=>t.includes(q))) && (!type || p.types.includes(type)) && (!gen || p.generation===gen) && (status==='all' || status==='owned'&&this.store.isOwned(p.id) || status==='missing'&&!this.store.isOwned(p.id) || status==='favorites'&&this.store.isFavorite(p.id)));
  });
  clearFilters():void{this.query.set('');this.type.set('');this.generation.set(0);this.status.set('all');}
}
