import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DEFAULT_FILTERS, FLIGHT_STATUSES, FlightFilters } from '../../../../core/models/flight.model';

/** Reactive-forms filter bar. Emits a debounced FlightFilters object on every change. */
@Component({
  selector: 'app-flight-filters',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="filters" [formGroup]="form" role="search" aria-label="Filter flights" (ngSubmit)="$event.preventDefault()">
      <div class="field search">
        <label for="f-search">Search by callsign</label>
        <div class="input-wrap">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="f-search" type="search" formControlName="search" placeholder="e.g. IGO2145" autocomplete="off" spellcheck="false" />
        </div>
      </div>

      <div class="field">
        <label for="f-status">Status</label>
        <select id="f-status" formControlName="status">
          <option value="All">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>
      </div>

      <div class="row">
        <div class="field">
          <label for="f-origin">Origin</label>
          <select id="f-origin" formControlName="origin">
            <option value="All">Any origin</option>
            @for (o of origins; track o) {
              <option [value]="o">{{ o }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="f-dest">Destination</label>
          <select id="f-dest" formControlName="destination">
            <option value="All">Any destination</option>
            @for (d of destinations; track d) {
              <option [value]="d">{{ d }}</option>
            }
          </select>
        </div>
      </div>

      <div class="foot">
        <span class="count" role="status" aria-live="polite">{{ resultCount }} of {{ totalCount }} flights</span>
        <button type="button" class="link" (click)="reset()" [disabled]="isDefault">Clear filters</button>
      </div>
    </form>
  `,
  styles: `
    .filters { display: grid; gap: 10px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { display: grid; gap: 4px; min-width: 0; }
    label { font-size: 11.5px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.02em; }
    input, select {
      width: 100%; height: 38px; padding: 0 10px; border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--surface-2); color: var(--text);
    }
    input:hover, select:hover { border-color: var(--accent); }
    .input-wrap { position: relative; }
    .input-wrap svg { position: absolute; left: 10px; top: 11px; color: var(--text-muted); pointer-events: none; }
    .input-wrap input { padding-left: 32px; }
    .foot { display: flex; justify-content: space-between; align-items: center; }
    .count { font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .link { background: none; border: 0; padding: 4px 2px; font-size: 12.5px; font-weight: 600; color: var(--accent); }
    .link:disabled { color: var(--text-muted); opacity: 0.6; cursor: default; }
    .link:not(:disabled):hover { text-decoration: underline; }
  `,
})
export class FlightFiltersComponent implements OnInit, OnChanges, OnDestroy {
  @Input() origins: string[] = [];
  @Input() destinations: string[] = [];
  @Input() resultCount = 0;
  @Input() totalCount = 0;
  @Input() value: FlightFilters = DEFAULT_FILTERS;
  @Output() filtersChange = new EventEmitter<FlightFilters>();

  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly destroy$ = new Subject<void>();

  readonly statuses = FLIGHT_STATUSES;
  readonly form = this.fb.group({
    search: this.fb.control(''),
    status: this.fb.control<FlightFilters['status']>('All'),
    origin: this.fb.control('All'),
    destination: this.fb.control('All'),
  });

  get isDefault(): boolean {
    const v = this.form.getRawValue();
    return !v.search && v.status === 'All' && v.origin === 'All' && v.destination === 'All';
  }

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        debounceTime(150),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.filtersChange.emit(this.form.getRawValue() as FlightFilters));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Keep the form in sync if filters are reset from outside (e.g. empty state).
    if (changes['value'] && JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.value)) {
      this.form.patchValue(this.value, { emitEvent: false });
    }
  }

  reset(): void {
    this.form.reset(DEFAULT_FILTERS);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
