import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FlightStatus } from '../../../core/models/flight.model';

/** Status pill. Uses a distinct glyph + text so meaning never relies on colour alone. */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [attr.data-status]="status"><span class="glyph" aria-hidden="true">{{ glyph }}</span>{{ status }}</span>`,
  styles: `
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 2px 9px 2px 7px; border-radius: 999px;
      font-size: 11.5px; font-weight: 600; line-height: 18px; white-space: nowrap;
    }
    .glyph { font-size: 9px; }
    [data-status='Scheduled'] { color: var(--st-scheduled); background: var(--st-scheduled-bg); }
    [data-status='Active'] { color: var(--st-active); background: var(--st-active-bg); }
    [data-status='Delayed'] { color: var(--st-delayed); background: var(--st-delayed-bg); }
    [data-status='Arrived'] { color: var(--st-arrived); background: var(--st-arrived-bg); }
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: FlightStatus;

  get glyph(): string {
    return { Scheduled: '◷', Active: '▲', Delayed: '!', Arrived: '✓' }[this.status];
  }
}
