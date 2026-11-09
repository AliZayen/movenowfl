import type { ServiceTypeId } from '@/app/lib/catalog';
import type { FurnitureDetails, MovingDetails, TvDetails } from '@/app/lib/validation/booking';

// PLACEHOLDER pricing. README 13 ("Pricing") is still an open product question, so these rules
// are a reasonable starting point to replace once the business decides. Everything is in cents.
// An admin sets the final price when confirming (finalPriceCents).

export interface EstimateLine {
  label: string;
  cents: number;
}
export interface Estimate {
  quotedPriceCents: number;
  estimatedDurationMin: number;
  lines: EstimateLine[];
}

interface Access {
  floor?: string;
  elevator?: boolean;
}

export type EstimateInput =
  | { serviceType: 'moving'; details: MovingDetails; origin: Access; destination: Access; extraServices: string[] }
  | { serviceType: 'furniture_assembly'; details: FurnitureDetails }
  | { serviceType: 'tv_mounting'; details: TvDetails };

const MOVING_BASE_MIN: Record<MovingDetails['homeSize'], number> = {
  studio: 120,
  '1br': 180,
  '2br': 240,
  '3br': 360,
  '4br_plus': 480,
};
const VOLUME_FACTOR: Record<MovingDetails['volume'], number> = { few: 0.5, half: 0.75, full: 1, unsure: 1 };
const SPECIAL_ITEM_CENTS: Record<string, number> = {
  piano: 15000,
  safe: 10000,
  gym_equipment: 7500,
  large_appliances: 5000,
  artwork: 3000,
};
const EXTRA_CENTS: Record<string, number> = { packing: 12000, unpacking: 9000, assembly: 6000, tv: 7000 };
const FLOOR_NUMBER: Record<string, number> = { ground: 0, '2nd': 1, '3rd': 2, '4th': 3, '5th_plus': 4 };
const STAIRS_PER_FLOOR_CENTS = 2500;

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

/** `startingPriceCents` is the service's "From $X" price: per hour for moving, per item for the others. */
export function estimate(input: EstimateInput, startingPriceCents: number): Estimate {
  const lines: EstimateLine[] = [];
  let duration = 0;

  if (input.serviceType === 'moving') {
    const d = input.details;
    duration = Math.max(60, roundUp(MOVING_BASE_MIN[d.homeSize] * VOLUME_FACTOR[d.volume], 30));
    lines.push({ label: `2-person crew, about ${duration / 60} h`, cents: Math.round((startingPriceCents * duration) / 60) });
    for (const item of d.specialItems) lines.push({ label: `Special item: ${item}`, cents: SPECIAL_ITEM_CENTS[item] ?? 0 });
    for (const [name, a] of [['pickup', input.origin], ['drop-off', input.destination]] as const) {
      const floors = FLOOR_NUMBER[a.floor ?? 'ground'] ?? 0;
      if (floors > 0 && a.elevator === false) {
        lines.push({ label: `Stairs at ${name} (${floors} floor${floors > 1 ? 's' : ''})`, cents: floors * STAIRS_PER_FLOOR_CENTS });
      }
    }
    for (const extra of input.extraServices) lines.push({ label: `Extra: ${extra}`, cents: EXTRA_CENTS[extra] ?? 0 });
  }

  if (input.serviceType === 'furniture_assembly') {
    const d = input.details;
    const big = ['wardrobe', 'sofa', 'patio_set'].includes(d.furnitureType);
    duration = d.itemCount * (big ? 120 : 60);
    lines.push({ label: `Assembly × ${d.itemCount}`, cents: startingPriceCents * d.itemCount });
    if (big) lines.push({ label: 'Large item', cents: 3000 * d.itemCount });
    if (d.needsWallAnchoring) lines.push({ label: 'Wall anchoring', cents: 2000 * d.itemCount });
    if (d.hasInstructions === false) lines.push({ label: 'No instructions', cents: 1500 });
  }

  if (input.serviceType === 'tv_mounting') {
    const d = input.details;
    const tricky = d.mountType !== 'wall';
    duration = d.tvCount * (tricky ? 120 : 90);
    lines.push({ label: `Mounting × ${d.tvCount}`, cents: startingPriceCents * d.tvCount });
    const size = { '66_75': 2000, '76_plus': 4000 }[d.tvSize as string];
    if (size) lines.push({ label: 'Large TV', cents: size * d.tvCount });
    const wall = { brick: 3000, concrete: 3000, stone_veneer: 3000, plaster: 1500 }[d.wallType as string];
    if (wall) lines.push({ label: 'Masonry or plaster wall', cents: wall * d.tvCount });
    if (d.mountType === 'above_fireplace') lines.push({ label: 'Above fireplace', cents: 4000 * d.tvCount });
    if (d.mountType === 'ceiling') lines.push({ label: 'Ceiling mount', cents: 6000 * d.tvCount });
    if (d.bracket === 'supply_one') lines.push({ label: 'Bracket supplied', cents: 5000 * d.tvCount });
    if (d.bracket === 'full_motion') lines.push({ label: 'Full-motion bracket install', cents: 1500 * d.tvCount });
    if (d.needsPowerOutlet) lines.push({ label: 'In-wall power outlet', cents: 8000 });
  }

  return {
    quotedPriceCents: lines.reduce((sum, l) => sum + l.cents, 0),
    estimatedDurationMin: duration,
    lines: lines.filter((l) => l.cents > 0),
  };
}

export const isServiceType = (s: string): s is ServiceTypeId =>
  s === 'moving' || s === 'furniture_assembly' || s === 'tv_mounting';
