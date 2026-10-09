import { bearing, greatCircleRoute, haversineKm, interpolateGreatCircle } from './geo.util';

const DEL = { lat: 28.5562, lng: 77.1 };
const BOM = { lat: 19.0896, lng: 72.8656 };

describe('geo.util', () => {
  it('computes Delhi–Mumbai distance (~1,140 km)', () => {
    expect(haversineKm(DEL, BOM)).toBeGreaterThan(1100);
    expect(haversineKm(DEL, BOM)).toBeLessThan(1180);
  });

  it('interpolates endpoints exactly', () => {
    const start = interpolateGreatCircle(DEL, BOM, 0);
    const end = interpolateGreatCircle(DEL, BOM, 1);
    expect(start.lat).toBeCloseTo(DEL.lat, 4);
    expect(end.lng).toBeCloseTo(BOM.lng, 4);
  });

  it('builds a route with segments + 1 points', () => {
    expect(greatCircleRoute(DEL, BOM, 10).length).toBe(11);
  });

  it('returns a southwest bearing for Delhi → Mumbai', () => {
    const b = bearing(DEL, BOM);
    expect(b).toBeGreaterThan(180);
    expect(b).toBeLessThan(270);
  });
});
