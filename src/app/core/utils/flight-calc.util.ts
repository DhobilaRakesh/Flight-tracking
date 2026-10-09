import { Airport, Flight, FlightRecord, FlightStatus } from '../models/flight.model';
import { bearing, greatCircleRoute, interpolateGreatCircle } from './geo.util';

const MIN = 60_000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Static, per-flight data computed once (route geometry + anchored departure time). */
export interface FlightBlueprint {
  record: FlightRecord;
  origin: Airport;
  destination: Airport;
  etd: Date;
  eta: Date;
  route: Flight['route'];
}

export function buildBlueprint(
  record: FlightRecord,
  airports: ReadonlyMap<string, Airport>,
  anchor: Date,
): FlightBlueprint | null {
  const origin = airports.get(record.origin);
  const destination = airports.get(record.destination);
  if (!origin || !destination) return null;
  const etd = new Date(anchor.getTime() + record.etdOffsetMin * MIN);
  const eta = new Date(etd.getTime() + record.durationMin * MIN);
  return { record, origin, destination, etd, eta, route: greatCircleRoute(origin, destination) };
}

/**
 * Pure function: resolve the state of a flight at simulation instant `now`.
 * Status rules: past ETA -> Arrived, delayed -> Delayed, before ETD -> Scheduled, else Active.
 */
export function resolveFlight(bp: FlightBlueprint, now: Date): Flight {
  const { record: r, origin, destination, etd, eta } = bp;
  const progress = clamp01((now.getTime() - etd.getTime()) / (r.durationMin * MIN));
  const airborne = progress > 0 && progress < 1;

  let status: FlightStatus;
  if (now >= eta) status = 'Arrived';
  else if (r.delayMin > 0) status = 'Delayed';
  else if (now < etd) status = 'Scheduled';
  else status = 'Active';

  const position = interpolateGreatCircle(origin, destination, progress);
  const ahead = interpolateGreatCircle(origin, destination, Math.min(1, progress + 0.01));
  const behind = interpolateGreatCircle(origin, destination, Math.max(0, progress - 0.01));
  const heading = bearing(behind, ahead);

  // Simple climb / cruise / descent profile.
  const profile = airborne ? Math.min(1, progress / 0.12, (1 - progress) / 0.12) : 0;
  return {
    id: r.id,
    flightNumber: r.flightNumber,
    callsign: r.callsign,
    airline: r.airline,
    aircraftType: r.aircraftType,
    registration: r.registration,
    origin,
    destination,
    status,
    delayMin: r.delayMin,
    etd,
    eta,
    durationMin: r.durationMin,
    progress,
    position,
    heading,
    altitudeFt: Math.round((r.cruiseAltFt * profile) / 100) * 100,
    speedKt: airborne ? Math.round(r.cruiseSpeedKt * (0.55 + 0.45 * profile)) : 0,
    route: bp.route,
  };
}
