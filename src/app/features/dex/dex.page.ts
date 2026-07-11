import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionStore } from '../../core/services/collection.store';
import { DexViewStateService } from '../../core/services/dex-view-state.service';
import { PokemonCardComponent } from '../../shared/components/pokemon-card.component';

@Component({
  selector: 'app-dex-page',
  imports: [FormsModule, PokemonCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pokedex-hero">
      <div class="lights"><i></i><i></i><i></i><i></i></div>
      <div class="hero-copy"><p>POKÉDEX DEL ENTRENADOR</p><h1>Hola, {{store.trainerName()}}</h1><span>Completa la Pokédex con al menos una carta de cada Pokémon.</span></div>
      <div class="lcd"><small>PROGRESO</small><strong>{{store.percent()}}%</strong><span>{{store.ownedCount()}} / {{store.total()}}</span></div>
    </section>

    <section class="toolbar">
      <label class="search"><span>⌕</span><input [ngModel]="state.query()" (ngModelChange)="state.query.set($event)" placeholder="Nombre, número o tipo"></label>
      <button class="filter-trigger" (click)="filtersOpen = true">☷ Filtros @if(activeFilterCount()){<b>{{activeFilterCount()}}</b>}</button>
      <div class="desktop-filters">
        <select [ngModel]="state.type()" (ngModelChange)="state.type.set($event)"><option value="">Todos los tipos</option>@for(item of types();track item){<option [value]="item">{{item}}</option>}</select>
        <select [ngModel]="state.generation()" (ngModelChange)="state.generation.set(+$event)"><option value="0">Todas las generaciones</option>@for(item of generations();track item){<option [value]="item">Generación {{item}}</option>}</select>
        <select [ngModel]="state.status()" (ngModelChange)="state.status.set($event)"><option value="all">Todos</option><option value="owned">Obtenidos</option><option value="missing">Faltantes</option><option value="favorites">Favoritos</option></select>
        <select [ngModel]="state.sort()" (ngModelChange)="state.sort.set($event)"><option value="number">Número</option><option value="name">Nombre</option><option value="owned-first">Obtenidos primero</option></select>
      </div>
    </section>

    <div class="result-row"><span><strong>{{filtered().length}}</strong> resultados</span>@if(activeFilterCount()){<button (click)="state.clear()">Limpiar</button>}</div>

    @if(store.loading() || store.syncing()){
      <div class="loading"><div class="spinner"></div><h2>Preparando tu PokéCardDex</h2><p>{{store.syncing() ? 'Descargando Pokédex… '+store.progress()+'%' : 'Cargando progreso local…'}}</p></div>
    } @else if(store.error() && !store.total()){
      <div class="empty"><h2>Sin datos disponibles</h2><p>{{store.error()}}</p><button class="primary" (click)="store.syncPokemon()">Reintentar</button></div>
    } @else {
      <section class="grid">@for(pokemon of filtered();track pokemon.id){
        <app-pokemon-card [pokemon]="pokemon" [owned]="store.isOwned(pokemon.id)" [favorite]="store.isFavorite(pokemon.id)" (favoriteToggle)="store.toggleFavorite(pokemon.id)" />
      } @empty {<div class="empty"><h2>No hay coincidencias</h2><p>Prueba con otros filtros.</p></div>}</section>
    }

    @if(filtersOpen){
      <div class="sheet-backdrop" (click)="filtersOpen=false">
        <section class="filter-sheet" (click)="$event.stopPropagation()"><i class="grabber"></i><header><h2>Filtros</h2><button (click)="filtersOpen=false">Listo</button></header>
          <label>Tipo<select [ngModel]="state.type()" (ngModelChange)="state.type.set($event)"><option value="">Todos</option>@for(item of types();track item){<option [value]="item">{{item}}</option>}</select></label>
          <label>Generación<select [ngModel]="state.generation()" (ngModelChange)="state.generation.set(+$event)"><option value="0">Todas</option>@for(item of generations();track item){<option [value]="item">Generación {{item}}</option>}</select></label>
          <label>Estado<select [ngModel]="state.status()" (ngModelChange)="state.status.set($event)"><option value="all">Todos</option><option value="owned">Obtenidos</option><option value="missing">Faltantes</option><option value="favorites">Favoritos</option></select></label>
          <label>Orden<select [ngModel]="state.sort()" (ngModelChange)="state.sort.set($event)"><option value="number">Número</option><option value="name">Nombre</option><option value="owned-first">Obtenidos primero</option></select></label>
          <button class="apply" (click)="filtersOpen=false">Mostrar {{filtered().length}} resultados</button>
          <button class="clear" (click)="state.clear()">Restablecer filtros</button>
        </section>
      </div>
    }
  `,
  styles: [`
    .pokedex-hero{position:relative;display:grid;grid-template-columns:1fr 190px;align-items:center;gap:24px;overflow:hidden;padding:32px;border-radius:30px;background:linear-gradient(145deg,#db1f32,#9e101e);color:#fff;border:7px solid #77101a;box-shadow:inset 0 0 0 2px #ff6571,var(--shadow-lg)}.lights{position:absolute;top:14px;left:18px;display:flex;gap:8px}.lights i{width:12px;height:12px;border-radius:50%;background:#ffdb3d;box-shadow:inset 0 -2px 3px #0004}.lights i:first-child{width:31px;height:31px;background:#6bd7ff;border:4px solid #eaffff}.lights i:nth-child(3){background:#60d870}.hero-copy{padding-top:22px}.hero-copy p{letter-spacing:.18em;font-size:.7rem;font-weight:900;color:#ffe362}.hero-copy h1{font-size:clamp(2.2rem,7vw,4.7rem);line-height:.95;margin:6px 0 12px}.hero-copy span{opacity:.9}.lcd{min-height:145px;border:8px solid #26282c;border-radius:21px;background:linear-gradient(160deg,#9fe5a9,#3f8455);display:grid;place-items:center;padding:18px;color:#102d18;box-shadow:inset 0 0 18px #0d4b2866}.lcd small{letter-spacing:.18em;font-weight:900}.lcd strong{font:900 3rem/1 ui-monospace,monospace}.lcd span{font-weight:900}.toolbar{display:flex;gap:10px;margin:18px 0 8px;padding:12px;border-radius:20px;background:color-mix(in srgb,var(--surface) 84%,transparent);backdrop-filter:blur(22px);border:1px solid var(--line);position:sticky;top:86px;z-index:12}.search{flex:1;position:relative}.search span{position:absolute;left:14px;top:6px;font-size:1.8rem;color:var(--muted)}input,select{width:100%;height:46px;border:0;border-radius:13px;background:var(--surface-2);color:var(--text);padding:0 13px}.search input{padding-left:42px}.desktop-filters{display:flex;gap:8px}.desktop-filters select{min-width:145px}.filter-trigger{display:none;border:0;background:var(--surface-2);color:var(--text);border-radius:13px;padding:0 14px;font-weight:800}.filter-trigger b{background:var(--red);color:#fff;border-radius:999px;padding:2px 7px}.result-row{display:flex;justify-content:space-between;padding:10px 4px 16px;color:var(--muted)}.result-row button{border:0;background:none;color:var(--red);font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:16px}.empty,.loading{grid-column:1/-1;text-align:center;padding:70px 20px;color:var(--muted)}.spinner{width:45px;height:45px;border:5px solid var(--line);border-top-color:var(--red);border-radius:50%;animation:spin 1s linear infinite;margin:auto}@keyframes spin{to{transform:rotate(360deg)}}.sheet-backdrop{display:none}
    @media(max-width:760px){.pokedex-hero{grid-template-columns:1fr 120px;padding:24px 16px 18px;border-radius:24px}.hero-copy h1{font-size:2.35rem}.hero-copy span{font-size:.82rem}.lcd{min-height:110px;border-width:6px}.lcd strong{font-size:2.1rem}.toolbar{top:0;margin:12px -2px 4px;padding:8px;border-radius:17px}.desktop-filters{display:none}.filter-trigger{display:block}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sheet-backdrop{display:flex;position:fixed;inset:0;z-index:80;background:#0008;align-items:flex-end}.filter-sheet{width:100%;max-height:88vh;overflow:auto;background:var(--surface);border-radius:24px 24px 0 0;padding:10px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -18px 50px #0004;animation:sheet .25s ease}.grabber{display:block;width:42px;height:5px;border-radius:999px;background:var(--line);margin:0 auto 10px}.filter-sheet header{display:flex;align-items:center;justify-content:space-between}.filter-sheet header button,.clear{border:0;background:none;color:var(--red);font-weight:800}.filter-sheet label{display:grid;gap:6px;margin:14px 0;color:var(--muted);font-size:.85rem;font-weight:800}.filter-sheet select{height:50px}.apply{width:100%;border:0;background:var(--red);color:#fff;border-radius:14px;padding:14px;font-weight:900}.clear{display:block;margin:14px auto}@keyframes sheet{from{transform:translateY(100%)}to{transform:none}}}
  `]
})
export class DexPage implements AfterViewInit, OnDestroy {
  readonly store = inject(CollectionStore);
  readonly state = inject(DexViewStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  filtersOpen = false;
  private readonly scrollHandler = () => this.state.rememberScroll();

  readonly types = computed(() => [...new Set(this.store.pokemon().flatMap(p => p.types))].sort());
  readonly generations = computed(() => [...new Set(this.store.pokemon().map(p => p.generation))].filter(Boolean).sort((a,b)=>a-b));
  readonly activeFilterCount = computed(() => Number(!!this.state.type()) + Number(!!this.state.generation()) + Number(this.state.status() !== 'all') + Number(this.state.sort() !== 'number'));
  readonly filtered = computed(() => {
    const q=this.state.query().trim().toLowerCase(), type=this.state.type(), gen=this.state.generation(), status=this.state.status();
    const values=this.store.pokemon().filter(p => (!q || p.nameEs.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || String(p.id).includes(q) || p.types.some(t=>t.includes(q))) && (!type || p.types.includes(type)) && (!gen || p.generation===gen) && (status==='all' || status==='owned'&&this.store.isOwned(p.id) || status==='missing'&&!this.store.isOwned(p.id) || status==='favorites'&&this.store.isFavorite(p.id)));
    return [...values].sort((a,b) => this.state.sort()==='name' ? a.nameEs.localeCompare(b.nameEs,'es') : this.state.sort()==='owned-first' ? Number(this.store.isOwned(b.id))-Number(this.store.isOwned(a.id)) || a.id-b.id : a.id-b.id);
  });

  constructor(){
    const params=this.route.snapshot.queryParamMap;
    if(params.keys.length){
      this.state.query.set(params.get('q')??''); this.state.type.set(params.get('type')??''); this.state.generation.set(Number(params.get('gen'))||0);
      const status=params.get('status'); if(status==='owned'||status==='missing'||status==='favorites'||status==='all') this.state.status.set(status);
    }
    effect(() => {
      this.state.snapshot(); this.state.save();
      void this.router.navigate([], { relativeTo:this.route, replaceUrl:true, queryParams:{ q:this.state.query()||null,type:this.state.type()||null,gen:this.state.generation()||null,status:this.state.status()==='all'?null:this.state.status(),sort:this.state.sort()==='number'?null:this.state.sort() }, queryParamsHandling:'merge' });
    });
  }
  ngAfterViewInit():void{window.addEventListener('scroll',this.scrollHandler,{passive:true});setTimeout(()=>window.scrollTo({top:this.state.scrollY(),behavior:'instant'}),0);}
  ngOnDestroy():void{this.state.rememberScroll();window.removeEventListener('scroll',this.scrollHandler);}
}
