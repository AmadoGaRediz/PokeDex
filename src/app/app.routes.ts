import { Routes } from '@angular/router';
export const routes: Routes = [
  { path:'', loadComponent:()=>import('./features/dex/dex.page').then(m=>m.DexPage), title:'PokéCardDex' },
  { path:'pokemon/:id', loadComponent:()=>import('./features/detail/detail.page').then(m=>m.DetailPage), title:'Detalle | PokéCardDex' },
  { path:'cartas', loadComponent:()=>import('./features/cards/cards.page').then(m=>m.CardsPage), title:'Mis cartas | PokéCardDex' },
  { path:'estadisticas', loadComponent:()=>import('./features/stats/stats.page').then(m=>m.StatsPage), title:'Estadísticas | PokéCardDex' },
  { path:'logros', loadComponent:()=>import('./features/achievements/achievements.page').then(m=>m.AchievementsPage), title:'Logros | PokéCardDex' },
  { path:'configuracion', loadComponent:()=>import('./features/settings/settings.page').then(m=>m.SettingsPage), title:'Configuración | PokéCardDex' },
  { path:'**', redirectTo:'' }
];
