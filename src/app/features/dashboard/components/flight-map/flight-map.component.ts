import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Airport, Flight, FlightStatus } from '../../../../core/models/flight.model';
import { Theme } from '../../../../core/services/theme.service';

const TILES: Record<Theme, string> = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const PLANE_PATH =
  'M12 2c.8 0 1.5.7 1.5 1.5V9l8 4.5v2l-8-2.2V19l2 1.5V22l-3.5-1L8.5 22v-1.5l2-1.5v-5.7l-8 2.2v-2l8-4.5V3.5C10.5 2.7 11.2 2 12 2z';

const STATUS_VAR: Record<FlightStatus, string> = {
  Scheduled: 'var(--marker-scheduled)',
  Active: 'var(--marker-active)',
  Delayed: 'var(--marker-delayed)',
  Arrived: 'var(--marker-arrived)',
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Leaflet map. Pure presentational: receives flights/selection as inputs and emits selection events.
 * Leaflet runs outside Angular's zone so map interaction doesn't trigger app-wide change detection.
 */
@Component({
  selector: 'app-flight-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #mapEl class="map" role="application" aria-label="Interactive flight map. Use Tab to move between flights, Enter to open details."></div>

    <div class="toolbar" role="group" aria-label="Map layers and view">
      <button type="button" class="chip" [attr.aria-pressed]="clustering" (click)="toggleClustering()">
        <span aria-hidden="true">◎</span> Clusters
      </button>
      <button type="button" class="chip" [attr.aria-pressed]="showAirports" (click)="toggleAirports()">
        <span aria-hidden="true">⌖</span> Airports
      </button>
      <button type="button" class="chip" [attr.aria-pressed]="weather" (click)="toggleWeather()">
        <span aria-hidden="true">☂</span> Weather radar
      </button>
      <button type="button" class="chip" (click)="fitAll()"><span aria-hidden="true">⤢</span> Fit all</button>
    </div>
    @if (weatherError) {
      <div class="toast" role="status">{{ weatherError }}</div>
    }

    <ul class="legend" aria-label="Status legend">
      <li><i style="background: var(--marker-scheduled)"></i>Scheduled</li>
      <li><i style="background: var(--marker-active)"></i>Active</li>
      <li><i style="background: var(--marker-delayed)"></i>Delayed</li>
      <li><i style="background: var(--marker-arrived)"></i>Arrived</li>
    </ul>

    @if (flights.length === 0) {
      <div class="empty" role="status">
        <strong>No flights match your filters</strong>
        <span>Try clearing the search or changing the status / airport filters.</span>
      </div>
    }
  `,
  styles: `
    :host { position: relative; display: block; width: 100%; height: 100%; min-height: 320px; }
    .map { position: absolute; inset: 0; border-radius: inherit; }
    .toolbar {
      position: absolute; z-index: 800; top: 12px; left: 12px; display: flex; gap: 6px; flex-wrap: wrap; max-width: calc(100% - 80px);
    }
    .chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; min-height: 36px;
      background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 999px;
      font-size: 12.5px; font-weight: 600; box-shadow: var(--shadow); transition: background 0.15s, border-color 0.15s;
    }
    .chip:hover { border-color: var(--accent); }
    .chip[aria-pressed='true'] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
    .legend {
      position: absolute; z-index: 800; left: 12px; bottom: 24px; display: flex; gap: 12px; margin: 0; padding: 7px 12px; list-style: none;
      background: var(--surface); border: 1px solid var(--border); border-radius: 999px; box-shadow: var(--shadow); font-size: 12px; font-weight: 500;
    }
    .legend li { display: inline-flex; align-items: center; gap: 6px; }
    .legend i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .empty {
      position: absolute; z-index: 800; inset: 0; margin: auto; width: fit-content; height: fit-content; max-width: 320px; text-align: center;
      display: flex; flex-direction: column; gap: 4px; padding: 16px 20px; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow-lg); color: var(--text-muted);
      strong { color: var(--text); }
    }
    .toast {
      position: absolute; z-index: 800; top: 58px; left: 12px; padding: 8px 12px; background: var(--st-delayed-bg); color: var(--st-delayed);
      border-radius: var(--radius-sm); font-size: 12.5px; font-weight: 600; box-shadow: var(--shadow);
    }
    @media (max-width: 720px) { .legend { display: none; } }
  `,
})
export class FlightMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() flights: Flight[] = [];
  @Input() selected: Flight | null = null;
  @Input() airports: Airport[] = [];
  @Input() theme: Theme = 'light';
  @Input() following = false;
  @Output() flightSelected = new EventEmitter<string | null>();

  @ViewChild('mapEl', { static: true }) private mapEl!: ElementRef<HTMLDivElement>;

  clustering = true;
  showAirports = true;
  weather = false;
  weatherError = '';

  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private map?: L.Map;
  private tileLayer?: L.TileLayer;
  private flightLayer!: L.FeatureGroup;
  private readonly airportLayer = L.layerGroup();
  private readonly routeLayer = L.layerGroup();
  private weatherLayer?: L.TileLayer;
  private resizeObserver?: ResizeObserver;

  private readonly markers = new Map<string, L.Marker>();
  private readonly iconKeys = new Map<string, string>();
  private readonly latest = new Map<string, Flight>();
  private lastSelectedId: string | null = null;
  private fitted = false;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const map = L.map(this.mapEl.nativeElement, {
        center: [21, 78],
        zoom: 4,
        minZoom: 2,
        zoomControl: false,
        worldCopyJump: true,
        preferCanvas: true,
      });
      this.map = map;
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

      this.setTiles();
      this.airportLayer.addTo(map);
      this.routeLayer.addTo(map);
      this.flightLayer = this.createFlightLayer();
      this.flightLayer.addTo(map);

      map.on('click', () => this.zone.run(() => this.flightSelected.emit(null)));

      this.resizeObserver = new ResizeObserver(() => map.invalidateSize());
      this.resizeObserver.observe(this.mapEl.nativeElement);

      this.syncAirports();
      this.syncMarkers();
      this.fitOnce();
      this.syncSelection();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    this.zone.runOutsideAngular(() => {
      if (changes['theme']) this.setTiles();
      if (changes['airports']) this.syncAirports();
      if (changes['flights'] || changes['selected']) {
        this.syncMarkers();
        this.fitOnce();
        this.syncSelection();
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  /* ------------------------------ toolbar ------------------------------ */

  toggleClustering(): void {
    this.clustering = !this.clustering;
    this.zone.runOutsideAngular(() => {
      const old = this.flightLayer;
      this.map!.removeLayer(old);
      this.flightLayer = this.createFlightLayer();
      this.flightLayer.addTo(this.map!);
      this.markers.forEach((m) => this.flightLayer.addLayer(m));
      old.clearLayers();
    });
  }

  toggleAirports(): void {
    this.showAirports = !this.showAirports;
    this.zone.runOutsideAngular(() =>
      this.showAirports ? this.airportLayer.addTo(this.map!) : this.map!.removeLayer(this.airportLayer),
    );
  }

  async toggleWeather(): Promise<void> {
    this.weatherError = '';
    if (this.weather) {
      this.weather = false;
      if (this.weatherLayer) this.map?.removeLayer(this.weatherLayer);
      return;
    }
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const frame = data.radar?.past?.at(-1);
      if (!frame) throw new Error('no frames');
      this.zone.runOutsideAngular(() => {
        this.weatherLayer = L.tileLayer(`${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
          opacity: 0.6,
          zIndex: 350,
          attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
        }).addTo(this.map!);
      });
      this.weather = true;
    } catch {
      this.weatherError = 'Weather radar is unavailable right now.';
      setTimeout(() => {
        this.weatherError = '';
        this.cdr.markForCheck();
      }, 4000);
    }
    this.cdr.markForCheck();
  }

  fitAll(): void {
    this.zone.runOutsideAngular(() => {
      const pts = this.flights.flatMap((f) => [f.origin, f.destination]);
      if (!pts.length || !this.map) return;
      this.map.flyToBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng] as L.LatLngTuple)), {
        padding: [48, 48],
        duration: 0.8,
      });
    });
  }

  /* ------------------------------ layers ------------------------------ */

  private createFlightLayer(): L.FeatureGroup {
    return this.clustering
      ? L.markerClusterGroup({
          maxClusterRadius: 30,
          disableClusteringAtZoom: 5,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
        })
      : L.featureGroup();
  }

  private setTiles(): void {
    if (this.tileLayer) this.map!.removeLayer(this.tileLayer);
    this.tileLayer = L.tileLayer(TILES[this.theme], {
      attribution: ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 12,
    }).addTo(this.map!);
    this.tileLayer.bringToBack();
  }

  private syncAirports(): void {
    this.airportLayer.clearLayers();
    for (const a of this.airports) {
      L.marker([a.lat, a.lng], {
        icon: L.divIcon({
          className: 'airport-icon',
          html: `<span class="apt">${esc(a.iata)}</span>`,
          iconSize: [0, 0],
        }),
        zIndexOffset: -500,
        keyboard: false,
        interactive: true,
      })
        .bindTooltip(`${esc(a.name)} · ${esc(a.city)}, ${esc(a.country)}`, { direction: 'top', offset: [0, -10] })
        .addTo(this.airportLayer);
    }
  }

  private syncMarkers(): void {
    const seen = new Set<string>();
    for (const f of this.flights) {
      seen.add(f.id);
      this.latest.set(f.id, f);
      const isSelected = this.selected?.id === f.id;
      const key = `${f.status}|${Math.round(f.heading / 4)}|${isSelected}|${f.progress > 0 && f.progress < 1}`;
      let marker = this.markers.get(f.id);
      if (!marker) {
        marker = L.marker([f.position.lat, f.position.lng], {
          icon: this.iconFor(f, isSelected),
          title: `${f.flightNumber} · ${f.callsign} · ${f.status}`,
          alt: `${f.flightNumber}, ${f.origin.iata} to ${f.destination.iata}, ${f.status}`,
          keyboard: true,
          riseOnHover: true,
        });
        marker.bindPopup(() => this.popupHtml(this.latest.get(f.id)!), { closeButton: true, autoPanPadding: [60, 60] });
        marker.on('click', () => this.zone.run(() => this.flightSelected.emit(f.id)));
        this.markers.set(f.id, marker);
        this.iconKeys.set(f.id, key);
        this.flightLayer.addLayer(marker);
      } else {
        marker.setLatLng([f.position.lat, f.position.lng]);
        if (this.iconKeys.get(f.id) !== key) {
          marker.setIcon(this.iconFor(f, isSelected));
          this.iconKeys.set(f.id, key);
        }
        if (marker.isPopupOpen()) marker.getPopup()!.setContent(this.popupHtml(f));
      }
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    }
    for (const [id, marker] of this.markers) {
      if (!seen.has(id)) {
        this.flightLayer.removeLayer(marker);
        this.markers.delete(id);
        this.iconKeys.delete(id);
        this.latest.delete(id);
      }
    }
    (this.flightLayer as L.MarkerClusterGroup).refreshClusters?.();
  }

  private iconFor(f: Flight, selected: boolean): L.DivIcon {
    const airborne = f.progress > 0 && f.progress < 1;
    return L.divIcon({
      className: `flight-icon${selected ? ' selected' : ''}${airborne ? '' : ' grounded'}`,
      html: `<div class="plane"><svg viewBox="0 0 24 24" style="transform: rotate(${Math.round(f.heading)}deg); fill: ${STATUS_VAR[f.status]}"><path d="${PLANE_PATH}"/></svg></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -14],
    });
  }

  private popupHtml(f: Flight): string {
    return `<div class="fp-title">${esc(f.flightNumber)}</div>
      <div class="fp-sub">${esc(f.callsign)}</div>
      <div class="fp-row"><span>Origin</span><b>${esc(f.origin.iata)} · ${esc(f.origin.city)}</b></div>
      <div class="fp-row"><span>Destination</span><b>${esc(f.destination.iata)} · ${esc(f.destination.city)}</b></div>
      <div class="fp-row"><span>Status</span><b class="fp-status ${f.status}">${f.status}</b></div>`;
  }

  /* ------------------------------ selection / route ------------------------------ */

  private syncSelection(): void {
    const sel = this.selected;
    const changed = (sel?.id ?? null) !== this.lastSelectedId;
    this.lastSelectedId = sel?.id ?? null;

    this.routeLayer.clearLayers();
    if (!sel || !this.map) return;

    const idx = Math.floor(sel.progress * (sel.route.length - 1));
    const here: L.LatLngTuple = [sel.position.lat, sel.position.lng];
    const toTuple = (p: { lat: number; lng: number }): L.LatLngTuple => [p.lat, p.lng];
    const flown = [...sel.route.slice(0, idx + 1).map(toTuple), here];
    const remaining = [here, ...sel.route.slice(idx + 1).map(toTuple)];

    // Highlight: soft halo + dashed remaining leg + solid flown leg.
    L.polyline(sel.route.map(toTuple), { color: '#38bdf8', weight: 10, opacity: 0.18, interactive: false }).addTo(this.routeLayer);
    L.polyline(remaining, { color: '#0ea5e9', weight: 3, opacity: 0.95, dashArray: '8 8', interactive: false }).addTo(this.routeLayer);
    if (flown.length > 1) {
      L.polyline(flown, { color: '#0284c7', weight: 4, opacity: 1, interactive: false }).addTo(this.routeLayer);
    }
    for (const [airport, role] of [[sel.origin, 'Origin'], [sel.destination, 'Destination']] as const) {
      L.circleMarker([airport.lat, airport.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: role === 'Origin' ? '#0ea5e9' : '#f43f5e',
        fillOpacity: 1,
      })
        .bindTooltip(`${role}: ${esc(airport.iata)} ${esc(airport.city)}`, { permanent: true, direction: 'bottom', offset: [0, 8] })
        .addTo(this.routeLayer);
    }

    if (changed) {
      this.map.flyTo(here, Math.max(this.map.getZoom(), 6), { duration: 0.9 });
    } else if (this.following) {
      this.map.panTo(here, { animate: false });
    }
  }

  private fitOnce(): void {
    if (this.fitted || !this.map || !this.flights.length) return;
    this.fitted = true;
    const pts = this.flights.flatMap((f) => [f.origin, f.destination]);
    this.map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng] as L.LatLngTuple)), { padding: [48, 48] });
  }
}
