export type FlightStatus = 'Scheduled' | 'Active' | 'Delayed' | 'Arrived';

export const FLIGHT_STATUSES: readonly FlightStatus[] = ['Scheduled', 'Active', 'Delayed', 'Arrived'];

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface Airport extends LatLngLiteral {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
}

/** Shape of an entry in `public/data/flights.json` (static, time-independent). */
export interface FlightRecord {
  id: string;
  flightNumber: string;
  callsign: string;
  airline: string;
  aircraftType: string;
  registration: string;
  origin: string;
  destination: string;
  /** Minutes relative to "load time" at which the flight departs (negative = already departed). */
  etdOffsetMin: number;
  durationMin: number;
  /** Delay versus schedule in minutes (0 = on time). */
  delayMin: number;
  cruiseAltFt: number;
  cruiseSpeedKt: number;
}

/** Fully resolved flight used by the UI, computed for a given simulation instant. */
export interface Flight {
  id: string;
  flightNumber: string;
  callsign: string;
  airline: string;
  aircraftType: string;
  registration: string;
  origin: Airport;
  destination: Airport;
  status: FlightStatus;
  delayMin: number;
  etd: Date;
  eta: Date;
  durationMin: number;
  /** 0 = at origin, 1 = at destination. */
  progress: number;
  position: LatLngLiteral;
  heading: number;
  altitudeFt: number;
  speedKt: number;
  /** Great-circle route origin -> destination (cached, same reference between ticks). */
  route: LatLngLiteral[];
}

export interface FlightFilters {
  search: string;
  status: FlightStatus | 'All';
  origin: string; // IATA or 'All'
  destination: string; // IATA or 'All'
}

export const DEFAULT_FILTERS: FlightFilters = {
  search: '',
  status: 'All',
  origin: 'All',
  destination: 'All',
};

export interface FlightKpis {
  total: number;
  active: number;
  delayed: number;
  arrived: number;
  scheduled: number;
}
