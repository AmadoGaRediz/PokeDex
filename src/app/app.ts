import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CollectionStore } from './core/services/collection.store';
import { ThemeService } from './core/services/theme.service';
@Component({
  selector:'app-root',imports:[RouterOutlet,RouterLink,RouterLinkActive],changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
  <header class="topbar"><a routerLink="/" class="brand"><span class="ball"></span><span>PokéCard<span>Dex</span></span></a>
    <nav><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Pokédex</a><a routerLink="/estadisticas" routerLinkActive="active">Estadísticas</a><a routerLink="/logros" routerLinkActive="active">Logros</a><a routerLink="/configuracion" routerLinkActive="active">Datos</a></nav>
    <button class="theme" (click)="theme.toggle()" [attr.aria-label]="theme.mode()==='light'?'Activar modo oscuro':'Activar modo claro'">{{theme.mode()==='light'?'◐':'☀'}}</button>
  </header>
  <section class="progress-shell"><div><strong>{{store.ownedCount()}} / {{store.total()}}</strong><span> Pokémon</span></div><progress [value]="store.ownedCount()" [max]="store.total()||1"></progress><b>{{store.percent()}}%</b></section>
  @if(store.error() && store.total()){<div class="banner">{{store.error()}}</div>}
  <main><router-outlet/></main>
  <footer><strong>PokéCardDex</strong><span>Tu progreso vive únicamente en este dispositivo.</span><small>Datos de PokéAPI y Pokémon TCG API. Proyecto no afiliado a Nintendo, Creatures Inc. ni The Pokémon Company.</small></footer>
  `,
  styles:[`
    .topbar{height:74px;display:flex;align-items:center;gap:30px;padding:0 max(20px,calc((100vw - 1380px)/2));position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--text);font-size:1.25rem;font-weight:950}.brand>span:last-child span{color:var(--red)}.ball{width:30px;height:30px;border-radius:50%;background:linear-gradient(#e63946 0 45%,#202124 45% 55%,#fff 55%);border:3px solid #202124;box-sizing:border-box;position:relative}.ball:after{content:'';width:7px;height:7px;border-radius:50%;background:white;border:3px solid #202124;position:absolute;inset:0;margin:auto}nav{display:flex;gap:5px;margin:auto}nav a{padding:9px 13px;border-radius:10px;color:var(--muted);text-decoration:none;font-weight:800;font-size:.86rem}nav a.active,nav a:hover{color:var(--text);background:var(--surface-2)}.theme{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:1.1rem}.progress-shell{display:grid;grid-template-columns:auto minmax(150px,420px) 45px;align-items:center;gap:14px;padding:12px max(20px,calc((100vw - 1380px)/2));background:var(--surface);border-bottom:1px solid var(--line);font-size:.84rem}.progress-shell span{color:var(--muted)}progress{width:100%;height:9px;accent-color:var(--red)}.banner{background:#f6c945;color:#222;padding:10px;text-align:center;font-weight:800}main{max-width:1380px;margin:auto;padding:30px 20px 70px;min-height:70vh}footer{display:flex;flex-wrap:wrap;align-items:center;gap:18px;padding:28px max(20px,calc((100vw - 1380px)/2));border-top:1px solid var(--line);color:var(--muted)}footer strong{color:var(--text)}footer small{margin-left:auto;max-width:560px;text-align:right}@media(max-width:720px){.topbar{height:auto;padding:12px 16px;flex-wrap:wrap;gap:10px}.brand{margin-right:auto}.theme{order:2}nav{order:3;width:100%;overflow:auto;justify-content:flex-start}.progress-shell{grid-template-columns:auto 1fr auto}footer small{margin:0;text-align:left;width:100%}}`]
})
export class App implements OnInit{readonly store=inject(CollectionStore);readonly theme=inject(ThemeService);ngOnInit():void{void this.store.initialize();}}
