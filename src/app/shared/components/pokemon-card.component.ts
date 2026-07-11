import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pokemon } from '../../core/models/pokemon.models';

@Component({
  selector: 'app-pokemon-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card" [class.owned]="owned()" [class.locked]="!owned()">
      <button class="favorite" type="button" [attr.aria-label]="favorite() ? 'Quitar favorito' : 'Agregar favorito'" (click)="favoriteToggle.emit(); $event.stopPropagation()">
        {{ favorite() ? '★' : '☆' }}
      </button>
      <a [routerLink]="['/pokemon', pokemon().id]" class="card-link" (click)="opening.emit()">
        <span class="number">#{{ pokemon().id.toString().padStart(4, '0') }}</span>
        <div class="image-wrap"><img [src]="pokemon().image" [alt]="pokemon().nameEs" loading="lazy"></div>
        <h2>{{ pokemon().nameEs }}</h2>
        <div class="types">
          @for (type of pokemon().types; track type) { <span [attr.data-type]="type">{{ type }}</span> }
        </div>
        <span class="status">{{ owned() ? 'Obtenido' : 'Faltante' }}</span>
      </a>
    </article>
  `,
  styles: [`
    .card{position:relative;border-radius:22px;background:var(--surface);box-shadow:var(--shadow);overflow:hidden;transition:.25s ease;min-height:290px;border:1px solid var(--line)}
    .card:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg)}
    .card-link{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:inherit;padding:18px;height:100%;box-sizing:border-box}
    .number{align-self:flex-start;font-weight:800;color:var(--muted);font-size:.82rem}.image-wrap{height:145px;display:grid;place-items:center;width:100%}
    img{max-width:145px;max-height:145px;transition:.45s cubic-bezier(.2,.8,.2,1)}.locked img{filter:grayscale(1);opacity:.35}.locked{background:color-mix(in srgb,var(--surface) 76%,#111)}
    .owned{box-shadow:0 10px 30px color-mix(in srgb,var(--accent) 24%,transparent);animation:unlock .55s ease}.owned img{filter:none;opacity:1}
    h2{font-size:1.12rem;margin:4px 0 10px;text-transform:capitalize}.types{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.types span{font-size:.72rem;padding:4px 9px;border-radius:999px;background:var(--chip);text-transform:capitalize}
    .status{margin-top:auto;padding-top:12px;font-size:.75rem;font-weight:800;color:var(--muted)}.owned .status{color:var(--success)}
    .favorite{position:absolute;z-index:2;right:12px;top:10px;border:0;background:transparent;font-size:1.7rem;color:var(--yellow);cursor:pointer;filter:drop-shadow(0 2px 2px #0003)}
    @keyframes unlock{0%{transform:scale(.92);filter:brightness(1.8)}60%{transform:scale(1.04)}100%{transform:scale(1)}}@media(max-width:520px){.card{min-height:220px;border-radius:18px}.card-link{padding:12px}.image-wrap{height:105px}img{max-width:105px;max-height:105px}h2{font-size:.92rem;text-align:center}.types span{font-size:.62rem;padding:3px 7px}.favorite{right:6px;top:4px}.status{font-size:.68rem}}
  `]
})
export class PokemonCardComponent {
  pokemon = input.required<Pokemon>(); owned = input(false); favorite = input(false); favoriteToggle = output<void>(); opening = output<void>();
}
