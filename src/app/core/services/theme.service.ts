import { effect, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>((localStorage.getItem('pokecarddex_theme') as ThemeMode) || 'light');
  constructor() {
    effect(() => {
      const mode = this.mode();
      document.documentElement.dataset['theme'] = mode;
      localStorage.setItem('pokecarddex_theme', mode);
    });
  }
  toggle(): void { this.mode.update(value => value === 'light' ? 'dark' : 'light'); }
}
