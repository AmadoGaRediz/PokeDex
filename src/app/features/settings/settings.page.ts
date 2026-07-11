import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PriceCurrency } from '../../core/models/pokemon.models';
import { CollectionStore } from '../../core/services/collection.store';

@Component({
  selector:'app-settings-page', imports:[FormsModule], changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
    <header><p>PERFIL Y RESPALDO</p><h1>Ajustes</h1></header>
    <section class="panel"><h2>Perfil del entrenador</h2><p>Tu nombre aparece en las notificaciones de medallas.</p><div class="row"><input [ngModel]="name()" (ngModelChange)="name.set($event)" placeholder="Ej. Papoi"><button class="primary" (click)="saveProfile()">Guardar</button></div>@if(message()){<p class="message">{{message()}}</p>}</section>
    <section class="panel"><h2>Moneda preferida</h2><p>Se utiliza para tus registros manuales. Los precios de API pueden venir en USD o EUR y no representan automáticamente otros idiomas.</p><select [ngModel]="currency()" (ngModelChange)="currency.set($event)"><option>USD</option><option>EUR</option><option>MXN</option></select></section>
    <section class="panel"><h2>Exportar colección</h2><p>Incluye Pokémon, favoritos, variantes, cantidades, idiomas, condición, acabado, precios, notas y configuración.</p><button class="primary" (click)="store.exportJson()">Exportar respaldo JSON</button></section>
    <section class="panel"><h2>Importar colección</h2><p>Restaura respaldos anteriores o de esta versión. Los datos se migran sin borrar la Pokédex local.</p><label class="file">Seleccionar JSON<input type="file" accept="application/json,.json" (change)="importFile($event)"></label></section>
    <section class="panel"><h2>Datos y funcionamiento offline</h2><p>Actualiza nombres, tipos e imágenes sin borrar el progreso. El almacenamiento permanece en IndexedDB del mismo navegador y dominio.</p><div class="actions"><button (click)="store.syncPokemon()" [disabled]="store.syncing()">{{store.syncing()?'Actualizando '+store.progress()+'%':'Actualizar Pokédex'}}</button><button (click)="store.refreshTcgTotal()">Actualizar total TCG</button></div><p class="message">Total global de cartas registrado: {{store.totalTcgCards()||'sin sincronizar'}}</p></section>
  `,
  styles:[`
    header p{color:var(--red);font-weight:900;letter-spacing:.18em}header h1{font-size:clamp(2.7rem,8vw,4.7rem);margin:0 0 24px}.panel{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:24px;margin-bottom:14px;box-shadow:var(--shadow)}.panel p{color:var(--muted)}button,.file,select{display:inline-block;border:1px solid var(--line);background:var(--surface-2);color:var(--text);padding:12px 16px;border-radius:13px;font-weight:800}.primary{background:var(--red);color:#fff;border:0}.file input{display:none}.row,.actions{display:flex;gap:9px;flex-wrap:wrap}input{height:46px;min-width:260px;flex:1;border:1px solid var(--line);background:var(--surface-2);color:var(--text);border-radius:13px;padding:0 13px}.message{font-weight:800}@media(max-width:560px){.panel{padding:18px;border-radius:19px}.row,.actions{display:grid}input{min-width:0;width:100%}select{width:100%}}
  `]
})
export class SettingsPage {
  readonly store=inject(CollectionStore); readonly name=signal(this.store.trainerName()); readonly currency=signal<PriceCurrency>(this.store.preferredCurrency()); readonly message=signal('');
  async saveProfile():Promise<void>{await Promise.all([this.store.setTrainerName(this.name()),this.store.setPreferredCurrency(this.currency())]);this.message.set('Perfil guardado correctamente.');setTimeout(()=>this.message.set(''),2500);}
  async importFile(event:Event):Promise<void>{const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;try{await this.store.importJson(file);this.name.set(this.store.trainerName());this.currency.set(this.store.preferredCurrency());this.message.set('Respaldo importado correctamente.');}catch{this.message.set('El archivo no es un respaldo válido.');}finally{input.value='';}}
}
