import { describe, expect, it } from 'vitest';
import { estimate } from '@/app/lib/server/pricing';

const moving = (over: Partial<Parameters<typeof estimate>[0] & { serviceType: 'moving' }> = {}) =>
  ({
    serviceType: 'moving' as const,
    details: { homeSize: '1br' as const, volume: 'full' as const, specialItems: [] },
    origin: { floor: 'ground', elevator: true },
    destination: { floor: 'ground', elevator: true },
    extraServices: [],
    ...over,
  });

describe('estimate: moving', () => {
  it('charges the hourly price for the crew time from home size × volume', () => {
    const e = estimate(moving(), 7000); // 1br full = 180 min
    expect(e.estimatedDurationMin).toBe(180);
    expect(e.quotedPriceCents).toBe(21000);
    expect(e.lines).toHaveLength(1);
  });

  it('rounds the duration up to 30 minutes with a 1-hour minimum', () => {
    expect(estimate(moving({ details: { homeSize: 'studio', volume: 'few', specialItems: [] } }), 6000).estimatedDurationMin).toBe(60);
    expect(estimate(moving({ details: { homeSize: '3br', volume: 'half', specialItems: [] } }), 6000).estimatedDurationMin).toBe(270);
  });

  it('adds special items, stairs without an elevator, and extras', () => {
    const e = estimate(
      moving({
        details: { homeSize: 'studio', volume: 'full', specialItems: ['piano'] },
        origin: { floor: '3rd', elevator: false },
        destination: { floor: '2nd', elevator: true }, // elevator: no stairs fee
        extraServices: ['packing'],
      }),
      6000,
    );
    const crew = 6000 * 2; // 120 min
    expect(e.quotedPriceCents).toBe(crew + 15000 + 2 * 2500 + 12000);
    expect(e.lines.map((l) => l.label)).toEqual(
      expect.arrayContaining(['Special item: piano', 'Stairs at pickup (2 floors)', 'Extra: packing']),
    );
  });
});

describe('estimate: furniture assembly', () => {
  it('charges per item, with surcharges for large items, anchoring and missing instructions', () => {
    const e = estimate(
      { serviceType: 'furniture_assembly', details: { furnitureType: 'wardrobe', itemCount: 2, needsWallAnchoring: true, hasInstructions: false } },
      5000,
    );
    expect(e.estimatedDurationMin).toBe(240);
    expect(e.quotedPriceCents).toBe(2 * 5000 + 2 * 3000 + 2 * 2000 + 1500);
  });

  it('small items take an hour each and have no surcharges', () => {
    const e = estimate({ serviceType: 'furniture_assembly', details: { furnitureType: 'desk', itemCount: 1, needsWallAnchoring: false } }, 5000);
    expect(e).toMatchObject({ estimatedDurationMin: 60, quotedPriceCents: 5000 });
  });
});

describe('estimate: TV mounting', () => {
  it('adds size, wall, location, bracket and outlet charges', () => {
    const e = estimate(
      {
        serviceType: 'tv_mounting',
        details: { mountType: 'above_fireplace', tvSize: '76_plus', wallType: 'brick', bracket: 'full_motion', tvCount: 1, needsPowerOutlet: true },
      },
      7000,
    );
    expect(e.estimatedDurationMin).toBe(120);
    expect(e.quotedPriceCents).toBe(7000 + 4000 + 3000 + 4000 + 1500 + 8000);
  });

  it('a plain wall mount is the base price and 90 minutes per TV', () => {
    const e = estimate(
      { serviceType: 'tv_mounting', details: { mountType: 'wall', tvSize: '56_65', wallType: 'drywall_wood', bracket: 'tilting', tvCount: 2, needsPowerOutlet: false } },
      7000,
    );
    expect(e).toMatchObject({ estimatedDurationMin: 180, quotedPriceCents: 14000 });
  });

  it('drops zero-cent lines from the breakdown', () => {
    const e = estimate(
      { serviceType: 'tv_mounting', details: { mountType: 'wall', tvSize: '56_65', wallType: 'drywall_wood', bracket: 'tilting', tvCount: 1, needsPowerOutlet: false } },
      0,
    );
    expect(e.lines).toEqual([]);
  });
});
