import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CollectionStore } from './core/services/collection.store';
import { ThemeService } from './core/services/theme.service';
import { AppUpdateService } from './core/services/app-update.service';

@Component({
  selector:'app-root',
  imports:[RouterOutlet,RouterLink,RouterLinkActive],
  changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
    <header class="topbar">
      <a routerLink="/" class="brand"><span class="ball"></span><span>PokéCard<span>Dex</span></span></a>
      <nav class="desktop-nav"><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Dex</a><a routerLink="/cartas" routerLinkActive="active">Mis cartas</a><a routerLink="/estadisticas" routerLinkActive="active">Estadísticas</a><a routerLink="/logros" routerLinkActive="active">Medallas</a><a routerLink="/configuracion" routerLinkActive="active">Ajustes</a></nav>
      <button class="theme" (click)="theme.toggle()" [attr.aria-label]="theme.mode()==='light'?'Activar modo oscuro':'Activar modo claro'">{{theme.mode()==='light'?'◐':'☀'}}</button>
    </header>
    <section class="progress-shell"><div><strong>{{store.ownedCount()}} / {{store.total()}}</strong><span> Pokémon</span></div><progress [value]="store.ownedCount()" [max]="store.total()||1"></progress><b>{{store.percent()}}%</b></section>
    @if(update.updateReady()){<aside class="update-banner"><div><strong>Nueva versión disponible</strong><span>Tu progreso local se conservará.</span></div><button (click)="update.apply()">Actualizar ahora</button></aside>}
    @if(store.achievementToast(); as medal){<aside class="achievement-toast"><span>{{medal.icon}}</span><div><strong>¡{{store.trainerName()}}, desbloqueaste una medalla!</strong><p>{{medal.title}} · {{medal.description}}</p></div></aside>}
    @if(store.error() && store.total()){<div class="banner">{{store.error()}}</div>}
    <main><router-outlet/></main>
    <nav class="tabbar" aria-label="Navegación principal">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><i>◉</i><span>Dex</span></a>
      <a routerLink="/cartas" routerLinkActive="active"><i>▣</i><span>Cartas</span></a>
      <a routerLink="/estadisticas" routerLinkActive="active"><i>⌁</i><span>Stats</span></a>
      <a routerLink="/logros" routerLinkActive="active"><i>◆</i><span>Medallas</span></a>
      <a routerLink="/configuracion" routerLinkActive="active"><i>⚙</i><span>Ajustes</span></a>
    </nav>
    <footer><strong>PokéCardDex</strong><span>Tu progreso vive en este dispositivo.</span><small>Datos de PokéAPI y Pokémon TCG API. No afiliado a Nintendo ni The Pokémon Company.</small></footer>
  `,
  styles:[`
    .topbar{height:72px;display:flex;align-items:center;gap:24px;padding:0 max(16px,calc((100vw - 1380px)/2));position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(180%) blur(22px);border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--text);font-size:1.16rem;font-weight:950}.brand>span:last-child span{color:var(--red)}.ball{width:32px;height:32px;border-radius:50%;background:linear-gradient(#e63946 0 45%,#202124 45% 55%,#fff 55%);border:3px solid #202124;box-sizing:border-box;position:relative}.ball:after{content:'';width:8px;height:8px;border-radius:50%;background:white;border:3px solid #202124;position:absolute;inset:0;margin:auto}.desktop-nav{display:flex;gap:6px;margin:auto}.desktop-nav a{padding:10px 13px;border-radius:13px;color:var(--muted);text-decoration:none;font-weight:800;font-size:.86rem}.desktop-nav a.active,.desktop-nav a:hover{color:var(--red);background:var(--surface-2)}.theme{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:1.1rem}.progress-shell{display:grid;grid-template-columns:auto minmax(150px,420px) 45px;align-items:center;gap:14px;padding:11px max(16px,calc((100vw - 1380px)/2));background:var(--surface);border-bottom:1px solid var(--line);font-size:.84rem}.progress-shell span{color:var(--muted)}progress{width:100%;height:9px;accent-color:var(--red)}.banner{background:#f6c945;color:#222;padding:10px;text-align:center;font-weight:800}.update-banner{position:fixed;z-index:90;top:88px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:18px;padding:13px 15px;border-radius:17px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-lg)}.update-banner div{display:grid}.update-banner span{font-size:.78rem;color:var(--muted)}.update-banner button{border:0;background:var(--red);color:#fff;border-radius:12px;padding:10px 13px;font-weight:900}.achievement-toast{position:fixed;right:18px;top:92px;z-index:80;display:flex;align-items:center;gap:12px;max-width:430px;padding:16px;border-radius:22px;background:linear-gradient(135deg,var(--surface),color-mix(in srgb,var(--yellow) 20%,var(--surface)));border:1px solid color-mix(in srgb,var(--yellow) 50%,var(--line));box-shadow:var(--shadow-lg);animation:toastIn .35s ease}.achievement-toast>span{font-size:2.6rem}.achievement-toast p{margin:4px 0 0;color:var(--muted);font-size:.86rem}main{max-width:1380px;margin:auto;padding:28px 20px 80px;min-height:70vh}.tabbar{display:none}footer{display:flex;flex-wrap:wrap;gap:18px;padding:28px max(16px,calc((100vw - 1380px)/2));border-top:1px solid var(--line);color:var(--muted)}footer small{margin-left:auto;max-width:560px;text-align:right}@keyframes toastIn{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}
    @media(max-width:760px){.topbar{height:58px;padding:calc(6px + env(safe-area-inset-top)) 14px 6px;position:relative}.brand{font-size:1.02rem}.ball{width:28px;height:28px}.desktop-nav{display:none}.theme{margin-left:auto;width:38px;height:38px}.progress-shell{grid-template-columns:auto 1fr auto;padding:9px 14px}.update-banner{top:auto;bottom:calc(86px + env(safe-area-inset-bottom));left:12px;right:12px;transform:none;justify-content:space-between}.achievement-toast{left:12px;right:12px;top:auto;bottom:calc(88px + env(safe-area-inset-bottom))}.achievement-toast>span{font-size:2rem}main{padding:14px 10px calc(100px + env(safe-area-inset-bottom))}.tabbar{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:70;padding:7px 5px;border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:22px;background:color-mix(in srgb,var(--surface) 84%,transparent);backdrop-filter:saturate(180%) blur(24px);box-shadow:0 10px 40px #0003}.tabbar a{display:grid;place-items:center;gap:2px;text-decoration:none;color:var(--muted);font-size:.64rem;font-weight:800;min-height:48px;border-radius:16px}.tabbar i{font-style:normal;font-size:1.25rem}.tabbar a.active{color:var(--red);background:color-mix(in srgb,var(--red) 10%,transparent)}footer{display:none}}
  `]
})
export class App implements OnInit {
  readonly store=inject(CollectionStore); readonly theme=inject(ThemeService); readonly update=inject(AppUpdateService);
  ngOnInit():void{void this.store.initialize();this.update.initialize();}
}
