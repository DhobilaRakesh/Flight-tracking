import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { FlightFilters } from '../../core/models/flight.model';
import { FlightService, PlaybackSpeed } from '../../core/services/flight.service';
import { ThemeService } from '../../core/services/theme.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { FlightDetailsComponent } from './components/flight-details/flight-details.component';
import { FlightFiltersComponent } from './components/flight-filters/flight-filters.component';
import { FlightListComponent } from './components/flight-list/flight-list.component';
import { FlightMapComponent } from './components/flight-map/flight-map.component';
import { PlaybackControlsComponent } from './components/playback-controls/playback-controls.component';

/** Smart (container) component: wires the service streams to dumb presentational children. */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    KpiCardComponent,
    DashboardHeaderComponent,
    FlightDetailsComponent,
    FlightFiltersComponent,
    FlightListComponent,
    FlightMapComponent,
    PlaybackControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly flights = inject(FlightService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  /** Bound from the `/flight/:id` route param (withComponentInputBinding). */
  @Input() set id(value: string | undefined) {
    this.flights.select(value ?? null);
  }

  sidebarOpen = false;

  readonly vm$ = combineLatest({
    visible: this.flights.filteredFlights$,
    all: this.flights.flights$,
    selected: this.flights.selectedFlight$,
    kpis: this.flights.kpis$,
    filters: this.flights.filters$,
    airports: this.flights.airports$,
    origins: this.flights.originOptions$,
    destinations: this.flights.destinationOptions$,
    loading: this.flights.loading$,
    error: this.flights.error$,
    theme: this.themeService.theme$,
    playing: this.flights.playing$,
    speed: this.flights.speed$,
  }).pipe(map((vm) => ({ ...vm, selectedId: vm.selected?.id ?? null })));

  readonly now$ = this.flights.simulatedNow$;

  onSelect(id: string | null): void {
    this.router.navigate(id ? ['/flight', id] : ['/']);
    if (id) this.sidebarOpen = false;
  }

  onFilters(filters: FlightFilters): void {
    this.flights.setFilters(filters);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  togglePlayback(): void {
    this.flights.togglePlayback();
  }

  restart(): void {
    this.flights.restartSimulation();
  }

  setSpeed(speed: PlaybackSpeed): void {
    this.flights.setSpeed(speed);
  }

  retry(): void {
    this.flights.load();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.sidebarOpen) this.sidebarOpen = false;
    else this.onSelect(null);
  }
}
