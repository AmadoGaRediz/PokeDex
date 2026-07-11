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
  shouldRestoreScroll: boolean;
}

@Injectable({ providedIn: 'root' })
export class DexViewStateService {
  private readonly key = 'pokecarddex_dex_state_v3';
  private readonly initial = this.read();
  private lastScrollY = this.initial.scrollY;
  private restorePending = this.initial.shouldRestoreScroll;

  readonly query = signal(this.initial.query);
  readonly type = signal(this.initial.type);
  readonly generation = signal(this.initial.generation);
  readonly status = signal<DexStatusFilter>(this.initial.status);
  readonly sort = signal<DexSort>(this.initial.sort);

  saveFilters(): void {
    this.write();
  }

  /**
   * Guarda la posición sin modificar Signals. Esto evita que el scroll de iOS
   * provoque un nuevo render de toda la cuadrícula mientras el usuario desliza.
   */
  rememberScroll(value = window.scrollY): void {
    this.lastScrollY = Math.max(0, Math.round(value));
    this.write();
  }

  /** Marca que la próxima entrada al Dex debe restaurar la posición guardada. */
  markScrollForRestore(value = window.scrollY): void {
    this.lastScrollY = Math.max(0, Math.round(value));
    this.restorePending = true;
    this.write();
  }

  /** Devuelve la posición una sola vez y consume la restauración pendiente. */
  consumeScrollRestore(): number | null {
    if (!this.restorePending) return null;

    this.restorePending = false;
    this.write();
    return this.lastScrollY;
  }

  clear(): void {
    this.query.set('');
    this.type.set('');
    this.generation.set(0);
    this.status.set('all');
    this.sort.set('number');
    this.lastScrollY = 0;
    this.restorePending = false;
    this.write();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  snapshot(): PersistedDexState {
    return {
      query: this.query(),
      type: this.type(),
      generation: this.generation(),
      status: this.status(),
      sort: this.sort(),
      scrollY: this.lastScrollY,
      shouldRestoreScroll: this.restorePending
    };
  }

  private write(): void {
    try {
      sessionStorage.setItem(this.key, JSON.stringify(this.snapshot()));
    } catch {
      // Safari puede rechazar storage en modos privados/restringidos.
    }
  }

  private read(): PersistedDexState {
    const fallback: PersistedDexState = {
      query: '',
      type: '',
      generation: 0,
      status: 'all',
      sort: 'number',
      scrollY: 0,
      shouldRestoreScroll: false
    };

    try {
      const parsed = JSON.parse(sessionStorage.getItem(this.key) ?? '{}') as Partial<PersistedDexState>;
      return { ...fallback, ...parsed };
    } catch {
      return fallback;
    }
  }
}
