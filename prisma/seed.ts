// Seed data for local development: recreates the frontend's mock data (README 9.6).
// Safe to run more than once — existing rows are matched by email / name / ref and left alone.
// Run with: npm run db:seed
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type BookingEventType, type BookingStatus, type ServiceType } from '../generated/prisma/client';
import { SERVICE_FORM_OPTIONS } from '../app/lib/catalog';
import { addDays, floridaToUtc, toDbDate, todayInFlorida } from '../app/lib/server/time';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

// Demo sign-in password for the seeded customer, admin and pro. Set SEED_DEMO_PASSWORD in .env.
// The demo pro is Mike Rodriguez; the other pros have no password (set one with "Forgot password").
const DEMO_PROVIDER_EMAIL = 'mike.rodriguez@movenow.test';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? 'movenow-demo-123';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

// Approximate ZIP coverage. Admins should adjust these to the real service map.
const AREAS: Record<string, string[]> = {
  'Miami-Dade': [...range(33010, 33018), ...range(33030, 33035), ...range(33054, 33056), ...range(33101, 33199)],
  Broward: ['33004', '33009', ...range(33019, 33029), ...range(33060, 33069), ...range(33071, 33076), ...range(33301, 33394)],
  'Palm Beach': range(33401, 33499),
  Brickell: ['33129', '33130', '33131'],
  Wynwood: ['33127', '33137'],
  'Coral Gables': ['33134', '33143', '33146'],
  Doral: ['33122', '33126', '33166', '33172', '33178'],
  Aventura: ['33160', '33180'],
};

const SERVICES = [
  {
    id: 'moving' as const,
    name: 'Moving',
    description: 'Residential, business and office moves — local and long distance.',
    startingPriceCents: 7000,
    imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_1384b98d6-1773100531867.png',
    imageAlt: 'Professional movers carrying cardboard boxes in a bright living room with packed furniture',
  },
  {
    id: 'furniture_assembly' as const,
    name: 'Furniture Assembly',
    description: 'Beds, desks, tables, cabinets and more. Quick and professional service.',
    startingPriceCents: 5000,
    imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d34ff377-1772511949473.png',
    imageAlt: 'Technician assembling wooden furniture with tools on a clean hardwood floor in a modern apartment',
  },
  {
    id: 'tv_mounting' as const,
    name: 'TV Mounting',
    description: 'Secure and clean installation for all TV sizes. Wall mounts and cable management.',
    startingPriceCents: 7000,
    imageUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_112219723-1772182085582.png',
    imageAlt: 'Technician mounting a large flat screen TV on a white wall in a modern living room',
  },
];

const PROVIDERS = [
  { key: 'mike', name: 'Mike Rodriguez', email: 'mike.rodriguez@movenow.test', phone: '+13055550101', services: ['moving'], rating: 4.9, reviews: 128, avatar: 'https://images.unsplash.com/photo-1597214878849-ccd3506e706d', alt: 'Smiling mover in navy cap and polo shirt outdoors' },
  { key: 'david', name: 'David Kim', email: 'david.kim@movenow.test', phone: '+13055550102', services: ['tv_mounting'], rating: 4.8, reviews: 96, avatar: 'https://images.unsplash.com/photo-1641723345380-804552d000fb', alt: 'Bearded man in dark blazer smiling at camera' },
  { key: 'sarah', name: 'Sarah Johnson', email: 'sarah.johnson@movenow.test', phone: '+13055550103', services: ['furniture_assembly', 'moving'], rating: 4.9, reviews: 142, avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1a6de9328-1773141085898.png', alt: 'Woman with long brown hair smiling warmly' },
  { key: 'james', name: 'James Brown', email: 'james.brown@movenow.test', phone: '+13055550104', services: ['moving'], rating: 4.7, reviews: 88, avatar: 'https://images.unsplash.com/photo-1695830209166-161b6297541d', alt: 'Man in light shirt with short dark hair smiling' },
  { key: 'alex', name: 'Alex Wilson', email: 'alex.wilson@movenow.test', phone: '+13055550105', services: ['tv_mounting'], rating: 4.6, reviews: 73, avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_119e09d92-1785047445836.png', alt: 'Young man with short hair and light stubble looking at camera' },
  { key: 'leo', name: 'Leo Martinez', email: 'leo.martinez@movenow.test', phone: '+13055550106', services: ['furniture_assembly', 'tv_mounting'], rating: 4.8, reviews: 61, avatar: 'https://images.unsplash.com/photo-1728072584773-81a2ea45a706', alt: 'Man in dark jacket with trimmed beard smiling' },
] as const;

const IMG = {
  truck: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop',
  tv: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
  boxes: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
  tvWall: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
};

// Same six bookings as app/data/mockData.ts. Open ones are placed in the future relative to today.
const BOOKINGS: {
  ref: string;
  service: ServiceType;
  status: BookingStatus;
  provider: (typeof PROVIDERS)[number]['key'];
  dayOffset: number;
  slot: string;
  window: [string, string] | null;
  origin: { street: string; zip: string };
  destination?: { street: string; zip: string };
  details: object;
  duration: number;
  price: number;
  image: string;
  review?: { rating: number; comment: string };
}[] = [
  { ref: 'MN-2025-0068', service: 'moving', status: 'confirmed', provider: 'mike', dayOffset: 5, slot: '08:00', window: ['08:00', '10:00'], origin: { street: '123 Ocean Dr', zip: '33139' }, destination: { street: '456 Brickell Ave', zip: '33131' }, details: { homeSize: '1br', volume: 'full', specialItems: [] }, duration: 180, price: 21000, image: IMG.truck },
  { ref: 'MN-2025-0067', service: 'tv_mounting', status: 'pending', provider: 'david', dayOffset: 12, slot: '14:00', window: null, origin: { street: '456 Brickell Ave', zip: '33131' }, details: { mountType: 'wall', tvSize: '56_65', wallType: 'drywall_wood', bracket: 'tilting', tvCount: 1, needsPowerOutlet: false }, duration: 90, price: 7000, image: IMG.tv },
  { ref: 'MN-2025-0066', service: 'furniture_assembly', status: 'completed', provider: 'sarah', dayOffset: -10, slot: '10:00', window: ['10:00', '12:00'], origin: { street: '789 Collins Ave', zip: '33139' }, details: { furnitureType: 'sofa', brand: 'IKEA', model: 'KIVIK', itemCount: 1, hasInstructions: true, needsWallAnchoring: false }, duration: 120, price: 8000, image: IMG.furniture, review: { rating: 5, comment: 'Quick, careful and friendly. The sofa looks perfect.' } },
  { ref: 'MN-2025-0063', service: 'moving', status: 'completed', provider: 'james', dayOffset: -30, slot: '09:00', window: ['09:00', '11:00'], origin: { street: '321 Washington Ave', zip: '33139' }, destination: { street: '1200 Brickell Bay Dr', zip: '33131' }, details: { homeSize: 'studio', volume: 'half', specialItems: [] }, duration: 90, price: 10500, image: IMG.boxes, review: { rating: 5, comment: 'On time and nothing was damaged. Would book again.' } },
  { ref: 'MN-2025-0061', service: 'tv_mounting', status: 'cancelled', provider: 'alex', dayOffset: -20, slot: '13:00', window: ['13:00', '15:00'], origin: { street: '654 Lincoln Rd', zip: '33139' }, details: { mountType: 'above_fireplace', tvSize: '66_75', wallType: 'brick', bracket: 'full_motion', tvCount: 1, needsPowerOutlet: false }, duration: 120, price: 17500, image: IMG.tvWall },
  { ref: 'MN-2025-0058', service: 'furniture_assembly', status: 'completed', provider: 'leo', dayOffset: -40, slot: '11:00', window: ['11:00', '13:00'], origin: { street: '88 NE 2nd Ave', zip: '33132' }, details: { furnitureType: 'bed_frame', itemCount: 2, hasInstructions: true, needsWallAnchoring: true }, duration: 120, price: 14000, image: IMG.furniture, review: { rating: 4, comment: 'Great work on both beds.' } },
];

const H = 60;
const D = 24 * H;
const THREADS: { ref: string; messages: { from: 'customer' | 'provider'; body: string; ago: number; unread?: boolean }[] }[] = [
  {
    ref: 'MN-2025-0068',
    messages: [
      { from: 'customer', body: 'Hi Mike, just checking you have both addresses for the move.', ago: 26 * H },
      { from: 'provider', body: 'Hi John! Yes, Ocean Dr to Brickell Ave. I\'m confirming the details for your moving day: we\'ll arrive between 8 and 10 AM with a 2-person crew.', ago: 3 * H, unread: true },
      { from: 'provider', body: 'Is there a loading zone or a service elevator we should book at the new building?', ago: 3 * H - 2, unread: true },
    ],
  },
  {
    ref: 'MN-2025-0067',
    messages: [
      { from: 'customer', body: 'Will you bring the tilting bracket, or should I buy one?', ago: 1 * D + 5 * H },
      { from: 'provider', body: 'I\'ll bring it. The technician will arrive at 2 PM.', ago: 1 * D + 4 * H },
    ],
  },
  {
    ref: 'MN-2025-0066',
    messages: [
      { from: 'provider', body: 'All done! The sofa is assembled and the packaging is out by the curb.', ago: 10 * D },
      { from: 'customer', body: 'Thank you for the great service!', ago: 10 * D - 30 },
    ],
  },
  {
    ref: 'MN-2025-0063',
    messages: [
      { from: 'provider', body: 'We\'re 15 minutes away.', ago: 30 * D },
      { from: 'customer', body: 'Perfect, see you then!', ago: 30 * D - 5 },
    ],
  },
];

async function upsertUser(email: string, data: { fullName: string; role: 'customer' | 'provider' | 'admin'; phone?: string; passwordHash?: string | null }) {
  return db.user.upsert({
    where: { email },
    update: {},
    create: { email, ...data, emailVerifiedAt: new Date(), preferences: { create: {} } },
  });
}

async function main() {
  const today = todayInFlorida();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const [i, s] of SERVICES.entries()) {
    const data = { ...s, options: SERVICE_FORM_OPTIONS[s.id], sortOrder: i };
    await db.service.upsert({ where: { id: s.id }, update: data, create: data });
  }

  const areaIds: Record<string, string> = {};
  for (const [name, zips] of Object.entries(AREAS)) {
    const a = await db.serviceArea.upsert({ where: { name }, update: { zips }, create: { name, zips } });
    areaIds[name] = a.id;
  }

  const providerIds: Record<string, string> = {};
  for (const p of PROVIDERS) {
    const demo = p.email === DEMO_PROVIDER_EMAIL;
    let user = await upsertUser(p.email, { fullName: p.name, role: 'provider', phone: p.phone, passwordHash: demo ? passwordHash : null });
    // Databases seeded before pro sign-in existed have Mike without a password.
    if (demo && !user.passwordHash) user = await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    const data = {
      displayName: p.name,
      avatarUrl: p.avatar,
      avatarAlt: p.alt,
      phone: p.phone,
      services: [...p.services] as ServiceType[],
      ratingAvg: p.rating,
      reviewCount: p.reviews,
      backgroundChecked: true,
      insured: true,
    };
    // Every pro covers Miami-Dade (which includes Miami Beach and the neighborhoods); a few also cover Broward.
    const areas = ['Miami-Dade', ...(['mike', 'sarah', 'leo'].includes(p.key) ? ['Broward'] : [])];
    const provider = await db.provider.upsert({
      where: { userId: user.id },
      update: data,
      create: { ...data, userId: user.id, serviceAreas: { connect: areas.map((n) => ({ id: areaIds[n] })) } },
    });
    providerIds[p.key] = provider.id;
  }

  const john = await upsertUser('john.doe@movenow.test', { fullName: 'John Doe', role: 'customer', phone: '+13055550123', passwordHash });
  await upsertUser('admin@movenow.test', { fullName: 'MoveNow Dispatch', role: 'admin', passwordHash });
  // The demo admin is a manager (README "Admin area"); staff without a staffRole have no permissions.
  await db.user.updateMany({ where: { email: 'admin@movenow.test', staffRole: null }, data: { staffRole: 'manager' } });
  const admin = await db.user.findUniqueOrThrow({ where: { email: 'admin@movenow.test' } });

  if ((await db.address.count({ where: { userId: john.id } })) === 0) {
    await db.address.createMany({
      data: [
        { userId: john.id, label: 'Home', street: '123 Ocean Dr', city: 'Miami Beach', state: 'FL', zip: '33139', isDefault: true },
        { userId: john.id, label: 'Office', street: '456 Brickell Ave', city: 'Miami', state: 'FL', zip: '33131' },
        { userId: john.id, label: 'Gym', street: '789 Collins Ave', city: 'Miami Beach', state: 'FL', zip: '33139' },
      ],
    });
  }

  for (const b of BOOKINGS) {
    if (await db.booking.findUnique({ where: { ref: b.ref } })) continue;
    const date = addDays(today, b.dayOffset);
    const city = (zip: string) => (zip === '33139' ? 'Miami Beach' : 'Miami');
    const origin = await db.address.create({ data: { ...b.origin, city: city(b.origin.zip), state: 'FL' } });
    const destination = b.destination
      ? await db.address.create({ data: { ...b.destination, city: city(b.destination.zip), state: 'FL' } })
      : null;

    // Timeline that matches the status.
    const start = floridaToUtc(date, b.slot);
    const submittedAt = new Date(start.getTime() - 7 * 86_400_000);
    const events: { type: BookingEventType; at: Date; actorId: string; payload?: object }[] = [
      { type: 'submitted', at: submittedAt, actorId: john.id },
    ];
    const confirmed = b.status !== 'pending';
    if (confirmed) {
      events.push({ type: 'provider_assigned', at: new Date(submittedAt.getTime() + 3_600_000), actorId: admin.id, payload: { providerId: providerIds[b.provider] } });
      events.push({ type: 'confirmed', at: new Date(submittedAt.getTime() + 3_700_000), actorId: admin.id, payload: { windowStart: b.window?.[0], windowEnd: b.window?.[1] } });
    }
    if (b.status === 'completed') {
      events.push({ type: 'started', at: start, actorId: admin.id });
      events.push({ type: 'completed', at: new Date(start.getTime() + b.duration * 60_000), actorId: admin.id });
    }
    if (b.status === 'cancelled') {
      events.push({ type: 'cancelled', at: new Date(start.getTime() - 3 * 86_400_000), actorId: john.id, payload: { reason: 'Plans changed', previousStatus: 'confirmed' } });
    }

    const booking = await db.booking.create({
      data: {
        ref: b.ref,
        customerId: john.id,
        providerId: confirmed || b.status === 'pending' ? providerIds[b.provider] : null,
        serviceType: b.service,
        status: b.status,
        scheduledDate: toDbDate(date),
        preferredSlot: b.slot,
        windowStart: b.window?.[0],
        windowEnd: b.window?.[1],
        estimatedDurationMin: b.duration,
        originAddressId: origin.id,
        originFloor: 'ground',
        originElevator: true,
        originParking: 'street',
        destinationAddressId: destination?.id,
        destinationFloor: destination ? '2nd' : undefined,
        destinationElevator: destination ? true : undefined,
        destinationParking: destination ? 'garage' : undefined,
        details: b.details,
        quotedPriceCents: b.price,
        finalPriceCents: confirmed && b.status !== 'cancelled' ? b.price : null,
        coverImageUrl: b.image,
        createdAt: submittedAt,
        cancelledAt: b.status === 'cancelled' ? events.at(-1)!.at : null,
        cancelReason: b.status === 'cancelled' ? 'Plans changed' : null,
        events: { create: events.map((e) => ({ type: e.type, actorId: e.actorId, payload: e.payload, createdAt: e.at })) },
      },
    });

    if (b.review) {
      await db.review.create({
        data: { bookingId: booking.id, providerId: providerIds[b.provider], customerId: john.id, ...b.review, createdAt: new Date(start.getTime() + 86_400_000) },
      });
    }
  }

  // Conversations (README 9.6: 4 conversations). `from` is who sent it; `ago` is minutes before now.
  const providerUserIds = Object.fromEntries(
    (await db.provider.findMany({ select: { id: true, userId: true } })).map((p) => [p.id, p.userId]),
  );
  const now = Date.now();
  for (const t of THREADS) {
    const booking = await db.booking.findUnique({ where: { ref: t.ref } });
    if (!booking?.providerId || (await db.conversation.findUnique({ where: { bookingId: booking.id } }))) continue;
    const proUserId = providerUserIds[booking.providerId];
    const at = (ago: number) => new Date(now - ago * 60_000);
    // Read pointers per seat: the customer has read up to the first unread pro message; the pro has read everything.
    const customerRead = t.messages.filter((m) => !m.unread).at(-1);
    await db.conversation.create({
      data: {
        bookingId: booking.id,
        customerId: john.id,
        providerId: booking.providerId,
        moderatorAssignedAt: at(t.messages[0].ago),
        customerReadAt: customerRead ? at(customerRead.ago) : null,
        moderatorReadAt: at(t.messages.at(-1)!.ago),
        lastMessageAt: at(t.messages.at(-1)!.ago),
        createdAt: at(t.messages[0].ago),
        messages: {
          create: t.messages.map((m) => ({
            senderId: m.from === 'customer' ? john.id : proUserId,
            author: m.from === 'customer' ? ('customer' as const) : ('moderator' as const),
            body: m.body,
            createdAt: at(m.ago),
          })),
        },
      },
    });
  }

  const counts = await Promise.all([db.service.count(), db.serviceArea.count(), db.provider.count(), db.user.count(), db.booking.count(), db.conversation.count()]);
  console.log(`Seeded: ${counts[0]} services, ${counts[1]} areas, ${counts[2]} providers, ${counts[3]} users, ${counts[4]} bookings, ${counts[5]} conversations.`);
  console.log(`Demo sign-in: john.doe@movenow.test (customer), admin@movenow.test (admin) and ${DEMO_PROVIDER_EMAIL} (pro), password = SEED_DEMO_PASSWORD.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
