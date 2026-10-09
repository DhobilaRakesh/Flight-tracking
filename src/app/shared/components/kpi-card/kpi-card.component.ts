import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" [attr.data-tone]="tone">
      <div class="icon" aria-hidden="true"><ng-content select="[icon]" /></div>
      <div class="body">
        <div class="value" aria-live="polite">{{ value }}</div>
        <div class="label">{{ label }}</div>
      </div>
      @if (hint) {
        <div class="hint">{{ hint }}</div>
      }
    </div>
  `,
  styles: `
    .card {
      --tone: var(--accent); --tone-bg: var(--accent-soft);
      position: relative; display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow); height: 100%;
      border-left: 4px solid var(--tone);
    }
    [data-tone='active'] { --tone: var(--marker-active); --tone-bg: var(--st-active-bg); }
    [data-tone='delayed'] { --tone: var(--marker-delayed); --tone-bg: var(--st-delayed-bg); }
    [data-tone='arrived'] { --tone: var(--marker-arrived); --tone-bg: var(--st-arrived-bg); }
    .icon {
      display: grid; place-items: center; width: 42px; height: 42px; flex: none;
      border-radius: 10px; background: var(--tone-bg); color: var(--tone);
    }
    .icon ::ng-deep svg { width: 22px; height: 22px; }
    .value { font-size: 28px; font-weight: 700; line-height: 1.05; font-variant-numeric: tabular-nums; }
    .label { color: var(--text-muted); font-size: 12.5px; font-weight: 500; margin-top: 2px; }
    .hint { margin-left: auto; color: var(--text-muted); font-size: 12px; align-self: flex-start; text-align: right; }
    @media (max-width: 1100px) { .hint { display: none; } }
  `,
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number | string;
  @Input() tone: 'default' | 'active' | 'delayed' | 'arrived' = 'default';
  @Input() hint = '';
}
