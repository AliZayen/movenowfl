// Single source of truth for service form options: the IDs the API accepts and the labels the UI shows.
// Used by validation (app/lib/validation), pricing, the seed script, and GET /api/v1/services/:type/options.
// Safe to import from client and server code.

export const SERVICE_TYPES = ['moving', 'furniture_assembly', 'tv_mounting'] as const;
export type ServiceTypeId = (typeof SERVICE_TYPES)[number];

export const SERVICE_LABELS: Record<ServiceTypeId, string> = {
  moving: 'Moving',
  furniture_assembly: 'Furniture Assembly',
  tv_mounting: 'TV Mounting',
};

export const BOOKING_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;
export type BookingStatusId = (typeof BOOKING_STATUSES)[number];

type Option<T extends string> = { readonly id: T; readonly label: string; readonly hint?: string };
const ids = <T extends string>(opts: readonly Option<T>[]) => opts.map((o) => o.id) as [T, ...T[]];

// ─── Shared access options ──────────────────────────────────────────────────

export const FLOORS = [
  { id: 'ground', label: 'Ground' },
  { id: '2nd', label: '2nd' },
  { id: '3rd', label: '3rd' },
  { id: '4th', label: '4th' },
  { id: '5th_plus', label: '5th+' },
] as const satisfies readonly Option<string>[];

export const PARKING = [
  { id: 'street', label: 'Street parking' },
  { id: 'driveway', label: 'Driveway' },
  { id: 'loading_dock', label: 'Loading dock' },
  { id: 'garage', label: 'Garage' },
] as const satisfies readonly Option<string>[];

// ─── Moving ─────────────────────────────────────────────────────────────────

export const HOME_SIZES = [
  { id: 'studio', label: 'Studio', hint: '0 - 400 sqft' },
  { id: '1br', label: '1 Bedroom', hint: '401 - 800 sqft' },
  { id: '2br', label: '2 Bedrooms', hint: '801 - 1200 sqft' },
  { id: '3br', label: '3 Bedrooms', hint: '1201 - 1800 sqft' },
  { id: '4br_plus', label: '4+ Bedrooms', hint: '1800+ sqft' },
] as const satisfies readonly Option<string>[];

export const MOVE_VOLUMES = [
  { id: 'few', label: 'A few items' },
  { id: 'half', label: 'Half a truck' },
  { id: 'full', label: 'Full truck' },
  { id: 'unsure', label: 'Not sure' },
] as const satisfies readonly Option<string>[];

export const SPECIAL_ITEMS = [
  { id: 'piano', label: 'Piano' },
  { id: 'safe', label: 'Safe' },
  { id: 'gym_equipment', label: 'Gym equipment' },
  { id: 'large_appliances', label: 'Large appliances' },
  { id: 'artwork', label: 'Artwork' },
] as const satisfies readonly Option<string>[];

export const EXTRA_SERVICES = [
  { id: 'packing', label: 'Packing service', hint: 'We pack everything for you' },
  { id: 'unpacking', label: 'Unpacking service', hint: 'We unpack at your new place' },
  { id: 'assembly', label: 'Furniture assembly', hint: 'Assemble & disassemble furniture' },
  { id: 'tv', label: 'TV mounting', hint: 'Mount your TV on the wall' },
] as const satisfies readonly Option<string>[];

// ─── Furniture assembly ─────────────────────────────────────────────────────

export const FURNITURE_TYPES = [
  { id: 'bed_frame', label: 'Bed frame' },
  { id: 'dresser', label: 'Dresser / chest of drawers' },
  { id: 'wardrobe', label: 'Wardrobe / armoire' },
  { id: 'dining_table', label: 'Dining table' },
  { id: 'desk', label: 'Desk / workstation' },
  { id: 'bookcase', label: 'Bookcase / shelving unit' },
  { id: 'sofa', label: 'Sofa / sectional' },
  { id: 'crib', label: 'Crib / nursery furniture' },
  { id: 'patio_set', label: 'Patio / outdoor set' },
  { id: 'tv_stand', label: 'TV stand / media console' },
] as const satisfies readonly Option<string>[];

// ─── TV mounting ────────────────────────────────────────────────────────────

export const TV_MOUNT_TYPES = [
  { id: 'wall', label: 'Wall mount' },
  { id: 'above_fireplace', label: 'Above fireplace' },
  { id: 'ceiling', label: 'Ceiling mount' },
] as const satisfies readonly Option<string>[];

export const TV_SIZES = [
  { id: '32_43', label: '32" - 43"' },
  { id: '44_55', label: '44" - 55"' },
  { id: '56_65', label: '56" - 65"' },
  { id: '66_75', label: '66" - 75"' },
  { id: '76_plus', label: '76" and larger' },
] as const satisfies readonly Option<string>[];

export const WALL_TYPES = [
  { id: 'drywall_wood', label: 'Drywall (wood studs)' },
  { id: 'drywall_metal', label: 'Drywall (metal studs)' },
  { id: 'brick', label: 'Brick' },
  { id: 'concrete', label: 'Concrete / block' },
  { id: 'plaster', label: 'Plaster' },
  { id: 'stone_veneer', label: 'Stone veneer' },
] as const satisfies readonly Option<string>[];

export const BRACKETS = [
  { id: 'flat', label: 'Flat to wall' },
  { id: 'tilting', label: 'Tilting' },
  { id: 'full_motion', label: 'Full motion (articulating)' },
  { id: 'ceiling_pole', label: 'Ceiling pole mount' },
  { id: 'customer_has', label: 'I already have a bracket' },
  { id: 'supply_one', label: 'I need you to supply one' },
] as const satisfies readonly Option<string>[];

// ─── Scheduling ─────────────────────────────────────────────────────────────

// Hourly start times offered in the Date & Time section (8:00 AM - 7:00 PM), Florida local time.
export const SLOT_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
] as const;

export const DATE_FLEXIBILITY = ['exact', 'day', 'week'] as const;

/** Form label → API id (e.g. "Wall mount" → "wall"). Returns undefined for unknown labels. */
export function idOf<T extends string>(options: readonly { id: T; label: string }[], label: string): T | undefined {
  return options.find((o) => o.label === label)?.id;
}

export const labels = (options: readonly { label: string }[]) => options.map((o) => o.label);

// Enum tuples for z.enum(...)
export const ENUMS = {
  floor: ids(FLOORS),
  parking: ids(PARKING),
  homeSize: ids(HOME_SIZES),
  moveVolume: ids(MOVE_VOLUMES),
  specialItem: ids(SPECIAL_ITEMS),
  extraService: ids(EXTRA_SERVICES),
  furnitureType: ids(FURNITURE_TYPES),
  tvMountType: ids(TV_MOUNT_TYPES),
  tvSize: ids(TV_SIZES),
  wallType: ids(WALL_TYPES),
  bracket: ids(BRACKETS),
};

// What GET /api/v1/services/:type/options returns (and what the seed stores in services.options).
export const SERVICE_FORM_OPTIONS: Record<ServiceTypeId, Record<string, readonly Option<string>[]>> = {
  moving: {
    floors: FLOORS,
    parking: PARKING,
    homeSizes: HOME_SIZES,
    volumes: MOVE_VOLUMES,
    specialItems: SPECIAL_ITEMS,
    extraServices: EXTRA_SERVICES,
  },
  furniture_assembly: { floors: FLOORS, parking: PARKING, furnitureTypes: FURNITURE_TYPES },
  tv_mounting: {
    floors: FLOORS,
    parking: PARKING,
    mountTypes: TV_MOUNT_TYPES,
    tvSizes: TV_SIZES,
    wallTypes: WALL_TYPES,
    brackets: BRACKETS,
  },
};
