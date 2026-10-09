import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Flight } from '../../../../core/models/flight.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="list" aria-label="Flights">
      @for (f of flights; track f.id) {
        <li>
          <button
            type="button"
            class="item"
            [class.selected]="f.id === selectedId"
            [attr.aria-current]="f.id === selectedId ? 'true' : null"
            (click)="flightSelected.emit(f.id)"
          >
            <span class="top">
              <span class="fn">{{ f.flightNumber }}</span>
              <span class="cs">{{ f.callsign }}</span>
              <app-status-badge [status]="f.status" />
            </span>
            <span class="route">
              <b>{{ f.origin.iata }}</b>
              <span class="arrow" aria-label="to">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>
              </span>
              <b>{{ f.destination.iata }}</b>
              <span class="eta">ETA {{ f.eta | date: 'HH:mm' : 'UTC' }}Z</span>
            </span>
            <span class="bar" aria-hidden="true"><i [style.width.%]="f.progress * 100"></i></span>
          </button>
        </li>
      } @empty {
        <li class="none">No flights to show.</li>
      }
    </ul>
  `,
  styles: `
    .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
    .item {
      width: 100%; text-align: left; display: grid; gap: 6px; padding: 10px 12px; border-radius: var(--radius-sm);
      background: var(--surface-2); border: 1px solid var(--border); transition: border-color 0.15s, background 0.15s;
    }
    .item:hover { border-color: var(--accent); }
    .item.selected { border-color: var(--accent); background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
    .top { display: flex; align-items: center; gap: 8px; }
    .fn { font-weight: 700; }
    .cs { font-family: var(--mono); font-size: 12px; color: var(--text-muted); flex: 1; }
    .route { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .arrow { color: var(--text-muted); display: inline-grid; }
    .eta { margin-left: auto; font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .bar { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .bar i { display: block; height: 100%; background: var(--accent); transition: width 0.3s; }
    .none { color: var(--text-muted); padding: 16px; text-align: center; }
  `,
})
export class FlightListComponent {
  @Input() flights: Flight[] = [];
  @Input() selectedId: string | null = null;
  @Output() flightSelected = new EventEmitter<string>();
}
