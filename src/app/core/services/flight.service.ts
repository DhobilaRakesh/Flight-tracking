import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  forkJoin,
  interval,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  catchError,
  distinctUntilChanged,
  tap,
  EMPTY,
} from 'rxjs';
import {
  Airport,
  DEFAULT_FILTERS,
  Flight,
  FlightFilters,
  FlightKpis,
  FlightRecord,
} from '../models/flight.model';
import { FlightBlueprint, buildBlueprint, resolveFlight } from '../utils/flight-calc.util';

export const PLAYBACK_SPEEDS = [1, 60, 300, 900] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Wall-clock interval between simulation ticks while playing. */
const TICK_MS = 1000;

/**
 * Single source of truth for flight data.
 *
 * - Loads static JSON (airports + flights) over HttpClient.
 * - Holds a simulation clock; every flight is a pure function of that clock, so
 *   status, position, KPIs and ETA stay consistent while the playback runs.
 * - Exposes derived streams (filtered flights, KPIs, selected flight) for components.
 */
@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly http = inject(HttpClient);

  private blueprints: FlightBlueprint[] = [];
  private anchor = new Date();

  private readonly simTime$ = new BehaviorSubject<Date>(this.anchor);
  private readonly flightsSubject = new BehaviorSubject<Flight[]>([]);
  private readonly airportsSubject = new BehaviorSubject<Airport[]>([]);
  private readonly filtersSubject = new BehaviorSubject<FlightFilters>(DEFAULT_FILTERS);
  private readonly selectedIdSubject = new BehaviorSubject<string | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly playingSubject = new BehaviorSubject<boolean>(false);
  private readonly speedSubject = new BehaviorSubject<PlaybackSpeed>(300);

  readonly flights$ = this.flightsSubject.asObservable();
  readonly airports$ = this.airportsSubject.asObservable();
  readonly filters$ = this.filtersSubject.asObservable();
  readonly selectedId$ = this.selectedIdSubject.asObservable().pipe(distinctUntilChanged());
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly playing$ = this.playingSubject.asObservable();
  readonly speed$ = this.speedSubject.asObservable();
  readonly simulatedNow$ = this.simTime$.asObservable();

  readonly filteredFlights$: Observable<Flight[]> = combineLatest([this.flights$, this.filters$]).pipe(
    map(([flights, filters]) => FlightService.applyFilters(flights, filters)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly kpis$: Observable<FlightKpis> = this.flights$.pipe(
    map((flights) => FlightService.computeKpis(flights)),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly selectedFlight$: Observable<Flight | null> = combineLatest([this.flights$, this.selectedId$]).pipe(
    map(([flights, id]) => (id ? flights.find((f) => f.id === id) ?? null : null)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Distinct airport options for the filter dropdowns (only airports used by flights). */
  readonly originOptions$ = this.flights$.pipe(
    map((f) => FlightService.uniqueSorted(f.map((x) => x.origin.iata))),
    distinctUntilChanged((a, b) => a.join() === b.join()),
  );
  readonly destinationOptions$ = this.flights$.pipe(
    map((f) => FlightService.uniqueSorted(f.map((x) => x.destination.iata))),
    distinctUntilChanged((a, b) => a.join() === b.join()),
  );

  constructor() {
    this.load();
    this.startClock();
  }

  /* ------------------------------ commands ------------------------------ */

  load(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    forkJoin({
      airports: this.http.get<Airport[]>('data/airports.json'),
      flights: this.http.get<FlightRecord[]>('data/flights.json'),
    })
      .pipe(
        tap(({ airports, flights }) => {
          const airportMap = new Map(airports.map((a) => [a.iata, a]));
          this.anchor = new Date();
          this.blueprints = flights
            .map((f) => buildBlueprint(f, airportMap, this.anchor))
            .filter((b): b is FlightBlueprint => b !== null);
          this.airportsSubject.next(airports);
          this.simTime$.next(this.anchor);
          this.publish();
          this.loadingSubject.next(false);
        }),
        catchError((err) => {
          this.errorSubject.next('Unable to load flight data. Please try again.');
          this.loadingSubject.next(false);
          console.error(err);
          return of(null);
        }),
      )
      .subscribe();
  }

  setFilters(filters: Partial<FlightFilters>): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  resetFilters(): void {
    this.filtersSubject.next(DEFAULT_FILTERS);
  }

  select(id: string | null): void {
    this.selectedIdSubject.next(id);
  }

  togglePlayback(): void {
    this.playingSubject.next(!this.playingSubject.value);
  }

  setSpeed(speed: PlaybackSpeed): void {
    this.speedSubject.next(speed);
  }

  /** Jump the simulation clock back to the moment the data was loaded. */
  restartSimulation(): void {
    this.playingSubject.next(false);
    this.simTime$.next(this.anchor);
    this.publish();
  }

  /* ------------------------------ internals ------------------------------ */

  private startClock(): void {
    this.playingSubject
      .pipe(
        switchMap((playing) => (playing ? interval(TICK_MS) : EMPTY)),
        startWith(null),
      )
      .subscribe((tick) => {
        if (tick === null) return;
        const stepMs = TICK_MS * this.speedSubject.value;
        this.simTime$.next(new Date(this.simTime$.value.getTime() + stepMs));
        this.publish();
      });
  }

  private publish(): void {
    const now = this.simTime$.value;
    this.flightsSubject.next(this.blueprints.map((bp) => resolveFlight(bp, now)));
  }

  /* ------------------------------ pure helpers ------------------------------ */

  static applyFilters(flights: Flight[], f: FlightFilters): Flight[] {
    const q = f.search.trim().toLowerCase();
    return flights.filter(
      (fl) =>
        (!q || fl.callsign.toLowerCase().includes(q)) &&
        (f.status === 'All' || fl.status === f.status) &&
        (f.origin === 'All' || fl.origin.iata === f.origin) &&
        (f.destination === 'All' || fl.destination.iata === f.destination),
    );
  }

  static computeKpis(flights: Flight[]): FlightKpis {
    const count = (s: Flight['status']) => flights.filter((f) => f.status === s).length;
    return {
      total: flights.length,
      active: count('Active'),
      delayed: count('Delayed'),
      arrived: count('Arrived'),
      scheduled: count('Scheduled'),
    };
  }

  private static uniqueSorted(values: string[]): string[] {
    return [...new Set(values)].sort();
  }
}
