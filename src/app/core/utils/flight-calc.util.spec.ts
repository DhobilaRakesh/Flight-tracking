import { Airport, FlightRecord } from '../models/flight.model';
import { buildBlueprint, resolveFlight } from './flight-calc.util';

const airports = new Map<string, Airport>([
  ['DEL', { iata: 'DEL', icao: 'VIDP', name: 'Delhi', city: 'Delhi', country: 'India', lat: 28.5562, lng: 77.1 }],
  ['BOM', { iata: 'BOM', icao: 'VABB', name: 'Mumbai', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 }],
]);
const record = (over: Partial<FlightRecord> = {}): FlightRecord => ({
  id: 'FL001', flightNumber: 'AI 101', callsign: 'AIC101', airline: 'Air India', aircraftType: 'A320neo', registration: 'VT-X',
  origin: 'DEL', destination: 'BOM', etdOffsetMin: -60, durationMin: 120, delayMin: 0, cruiseAltFt: 36000, cruiseSpeedKt: 450, ...over,
});
const anchor = new Date('2026-01-01T10:00:00Z');
const resolve = (r: FlightRecord, now = anchor) => resolveFlight(buildBlueprint(r, airports, anchor)!, now);

describe('resolveFlight', () => {
  it('is Active halfway through the flight', () => {
    const f = resolve(record());
    expect(f.status).toBe('Active');
    expect(f.progress).toBeCloseTo(0.5, 5);
    expect(f.altitudeFt).toBeGreaterThan(30000);
  });

  it('is Scheduled before departure and sits at the origin', () => {
    const f = resolve(record({ etdOffsetMin: 30 }));
    expect(f.status).toBe('Scheduled');
    expect(f.position.lat).toBeCloseTo(28.5562, 3);
    expect(f.speedKt).toBe(0);
  });

  it('is Arrived after ETA and sits at the destination', () => {
    const f = resolve(record({ etdOffsetMin: -300 }));
    expect(f.status).toBe('Arrived');
    expect(f.position.lng).toBeCloseTo(72.8656, 3);
  });

  it('is Delayed when delayMin > 0 and not yet arrived', () => {
    expect(resolve(record({ delayMin: 25 })).status).toBe('Delayed');
  });

  it('moves with the simulation clock', () => {
    const later = new Date(anchor.getTime() + 30 * 60_000);
    expect(resolve(record(), later).progress).toBeGreaterThan(resolve(record()).progress);
  });

  it('returns null blueprint for unknown airports', () => {
    expect(buildBlueprint(record({ origin: 'XXX' }), airports, anchor)).toBeNull();
  });
});
