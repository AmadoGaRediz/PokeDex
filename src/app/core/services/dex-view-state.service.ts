import { Injectable, signal } from '@angular/core';

export type DexStatusFilter = 'all' | 'owned' | 'missing' | 'favorites';
export type DexSort = 'number' | 'name' | 'owned-first';

interface PersistedDexState {
  query: string;
  type: string;
  generation: number;
  status: DexStatusFilter;
  sort: DexSort;
  scrollY: number;
}

@Injectable({ providedIn: 'root' })
export class DexViewStateService {
  private readonly key = 'pokecarddex_dex_state_v3';
  private readonly initial = this.read();
  readonly query = signal(this.initial.query);
  readonly type = signal(this.initial.type);
  readonly generation = signal(this.initial.generation);
  readonly status = signal<DexStatusFilter>(this.initial.status);
  readonly sort = signal<DexSort>(this.initial.sort);
  readonly scrollY = signal(this.initial.scrollY);

  save(): void {
    sessionStorage.setItem(this.key, JSON.stringify(this.snapshot()));
  }

  rememberScroll(value = window.scrollY): void {
    this.scrollY.set(Math.max(0, Math.round(value)));
    this.save();
  }

  clear(): void {
    this.query.set('');
    this.type.set('');
    this.generation.set(0);
    this.status.set('all');
    this.sort.set('number');
    this.scrollY.set(0);
    this.save();
  }

  snapshot(): PersistedDexState {
    return {
      query: this.query(), type: this.type(), generation: this.generation(),
      status: this.status(), sort: this.sort(), scrollY: this.scrollY()
    };
  }

  private read(): PersistedDexState {
    const fallback: PersistedDexState = { query: '', type: '', generation: 0, status: 'all', sort: 'number', scrollY: 0 };
    try { return { ...fallback, ...JSON.parse(sessionStorage.getItem(this.key) ?? '{}') }; }
    catch { return fallback; }
  }
}
