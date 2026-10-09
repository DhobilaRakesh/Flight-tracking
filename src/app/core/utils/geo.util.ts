import { LatLngLiteral } from '../models/flight.model';

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLngLiteral, b: LatLngLiteral): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Point at fraction `t` (0..1) along the great-circle arc between a and b. */
export function interpolateGreatCircle(a: LatLngLiteral, b: LatLngLiteral, t: number): LatLngLiteral {
  const φ1 = toRad(a.lat), λ1 = toRad(a.lng);
  const φ2 = toRad(b.lat), λ2 = toRad(b.lng);
  const δ =
    2 *
    Math.asin(
      Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2),
    );
  if (δ === 0) return { ...a };
  const A = Math.sin((1 - t) * δ) / Math.sin(δ);
  const B = Math.sin(t * δ) / Math.sin(δ);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lng: toDeg(Math.atan2(y, x)) };
}

/** Sampled great-circle polyline including both endpoints. */
export function greatCircleRoute(a: LatLngLiteral, b: LatLngLiteral, segments = 64): LatLngLiteral[] {
  return Array.from({ length: segments + 1 }, (_, i) => interpolateGreatCircle(a, b, i / segments));
}

/** Initial bearing in degrees (0 = north, clockwise) from a to b. */
export function bearing(a: LatLngLiteral, b: LatLngLiteral): number {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
