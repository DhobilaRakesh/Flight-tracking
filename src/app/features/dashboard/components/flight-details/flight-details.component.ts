import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Flight } from '../../../../core/models/flight.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-flight-details',
  standalone: true,
  imports: [DatePipe, DecimalPipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="panel" aria-labelledby="fd-title">
      <header class="head">
        <div>
          <h2 id="fd-title">{{ flight.flightNumber }}</h2>
          <div class="sub">{{ flight.airline }} · <span class="mono">{{ flight.callsign }}</span></div>
        </div>
        <button type="button" class="close" (click)="closed.emit()" aria-label="Close flight details">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>

      <div class="route" aria-label="Route">
        <div class="stop">
          <div class="code">{{ flight.origin.iata }}</div>
          <div class="city">{{ flight.origin.city }}</div>
        </div>
        <div class="line" aria-hidden="true">
          <span class="plane" [style.left.%]="flight.progress * 100">✈</span>
        </div>
        <div class="stop end">
          <div class="code">{{ flight.destination.iata }}</div>
          <div class="city">{{ flight.destination.city }}</div>
        </div>
      </div>

      <div class="progress" role="progressbar" aria-label="Flight progress" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="progressPct">
        <i [style.width.%]="progressPct"></i>
      </div>
      <div class="progress-label">{{ progressPct }}% complete · {{ duration }}</div>

      <dl class="grid">
        <div><dt>Flight number</dt><dd>{{ flight.flightNumber }}</dd></div>
        <div><dt>Callsign</dt><dd class="mono">{{ flight.callsign }}</dd></div>
        <div><dt>Aircraft type</dt><dd>{{ flight.aircraftType }}</dd></div>
        <div><dt>Registration</dt><dd class="mono">{{ flight.registration }}</dd></div>
        <div><dt>Origin</dt><dd>{{ flight.origin.iata }} · {{ flight.origin.name }}</dd></div>
        <div><dt>Destination</dt><dd>{{ flight.destination.iata }} · {{ flight.destination.name }}</dd></div>
        <div><dt>Current status</dt><dd><app-status-badge [status]="flight.status" />@if (flight.delayMin > 0) { <span class="delay">+{{ flight.delayMin }} min</span> }</dd></div>
        <div><dt>Altitude / Speed</dt><dd>{{ flight.altitudeFt | number }} ft · {{ flight.speedKt }} kt</dd></div>
        <div><dt>Estimated departure</dt><dd>{{ flight.etd | date: 'dd MMM, HH:mm' : 'UTC' }} UTC</dd></div>
        <div><dt>Estimated arrival</dt><dd>{{ flight.eta | date: 'dd MMM, HH:mm' : 'UTC' }} UTC</dd></div>
      </dl>
    </article>
  `,
  styles: `
    .panel { display: grid; gap: 14px; padding: 16px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    h2 { margin: 0; font-size: 22px; letter-spacing: -0.01em; }
    .sub { color: var(--text-muted); font-size: 13px; }
    .mono { font-family: var(--mono); }
    .close { width: 36px; height: 36px; border-radius: 10px; background: var(--surface-2); border: 1px solid var(--border); display: grid; place-items: center; }
    .close:hover { border-color: var(--accent); }
    .route { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }
    .stop.end { text-align: right; }
    .code { font-size: 26px; font-weight: 700; letter-spacing: 0.02em; line-height: 1.1; }
    .city { font-size: 12px; color: var(--text-muted); }
    .line { position: relative; height: 2px; background: repeating-linear-gradient(90deg, var(--border) 0 6px, transparent 6px 12px); }
    .plane { position: absolute; top: -11px; transform: translateX(-50%) rotate(90deg); color: var(--accent); font-size: 18px; }
    .progress { height: 6px; border-radius: 3px; background: var(--border); overflow: hidden; }
    .progress i { display: block; height: 100%; background: var(--accent); transition: width 0.3s; }
    .progress-label { font-size: 12px; color: var(--text-muted); margin-top: -8px; }
    .grid { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
    .grid > div { min-width: 0; }
    dt { font-size: 11px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 2px; }
    dd { margin: 0; font-weight: 500; overflow-wrap: anywhere; }
    .delay { margin-left: 6px; color: var(--st-delayed); font-weight: 700; font-size: 12px; }
  `,
})
export class FlightDetailsComponent {
  @Input({ required: true }) flight!: Flight;
  @Output() closed = new EventEmitter<void>();

  get progressPct(): number {
    return Math.round(this.flight.progress * 100);
  }

  get duration(): string {
    const m = this.flight.durationMin;
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m block time`;
  }
}
