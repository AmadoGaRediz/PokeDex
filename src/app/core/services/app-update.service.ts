import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly updates = inject(SwUpdate);
  readonly updateReady = signal(false);

  initialize(): void {
    if (!this.updates.isEnabled) return;
    this.updates.versionUpdates.pipe(
      filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY')
    ).subscribe(() => this.updateReady.set(true));
    void this.updates.checkForUpdate();
    window.setInterval(() => void this.updates.checkForUpdate(), 60 * 60 * 1000);
  }

  apply(): void { document.location.reload(); }
}
