import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Airport, FlightRecord } from '../models/flight.model';
import { FlightService } from './flight.service';

const airports: Airport[] = [
  { iata: 'DEL', icao: 'VIDP', name: 'Delhi', city: 'Delhi', country: 'India', lat: 28.55, lng: 77.1 },
  { iata: 'BOM', icao: 'VABB', name: 'Mumbai', city: 'Mumbai', country: 'India', lat: 19.09, lng: 72.86 },
  { iata: 'HYD', icao: 'VOHS', name: 'Hyderabad', city: 'Hyderabad', country: 'India', lat: 17.24, lng: 78.43 },
];
const base = { airline: 'X', aircraftType: 'A320', registration: 'VT', durationMin: 120, cruiseAltFt: 36000, cruiseSpeedKt: 450 };
const records: FlightRecord[] = [
  { ...base, id: '1', flightNumber: 'AI 1', callsign: 'AIC1', origin: 'DEL', destination: 'BOM', etdOffsetMin: -60, delayMin: 0 },
  { ...base, id: '2', flightNumber: '6E 2', callsign: 'IGO2', origin: 'HYD', destination: 'DEL', etdOffsetMin: -30, delayMin: 20 },
  { ...base, id: '3', flightNumber: 'AI 3', callsign: 'AIC3', origin: 'BOM', destination: 'HYD', etdOffsetMin: -400, delayMin: 0 },
  { ...base, id: '4', flightNumber: 'AI 4', callsign: 'AIC4', origin: 'DEL', destination: 'HYD', etdOffsetMin: 45, delayMin: 0 },
];

describe('FlightService', () => {
  let service: FlightService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FlightService);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('data/airports.json').flush(airports);
    http.expectOne('data/flights.json').flush(records);
  });

  it('computes KPIs from the loaded flights', async () => {
    const kpis = await firstValueFrom(service.kpis$);
    expect(kpis).toEqual({ total: 4, active: 1, delayed: 1, arrived: 1, scheduled: 1 });
  });

  it('filters by callsign (case-insensitive)', async () => {
    service.setFilters({ search: 'igo' });
    const list = await firstValueFrom(service.filteredFlights$);
    expect(list.map((f) => f.id)).toEqual(['2']);
  });

  it('filters by status, origin and destination together', async () => {
    service.setFilters({ origin: 'DEL', destination: 'HYD', status: 'Scheduled' });
    expect((await firstValueFrom(service.filteredFlights$)).map((f) => f.id)).toEqual(['4']);
    service.setFilters({ status: 'Active' });
    expect(await firstValueFrom(service.filteredFlights$)).toEqual([]);
  });

  it('resets filters', async () => {
    service.setFilters({ search: 'zzz' });
    service.resetFilters();
    expect((await firstValueFrom(service.filteredFlights$)).length).toBe(4);
  });

  it('exposes the selected flight', async () => {
    service.select('2');
    expect((await firstValueFrom(service.selectedFlight$))?.callsign).toBe('IGO2');
    service.select(null);
    expect(await firstValueFrom(service.selectedFlight$)).toBeNull();
  });

  it('lists unique, sorted airport options', async () => {
    expect(await firstValueFrom(service.originOptions$)).toEqual(['BOM', 'DEL', 'HYD']);
    expect(await firstValueFrom(service.destinationOptions$)).toEqual(['BOM', 'DEL', 'HYD']);
  });
});
