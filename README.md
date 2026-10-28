# MoveNowFL

MoveNowFL is a booking platform for home services in South Florida: **Moving**, **Furniture Assembly**, and **TV Mounting**. Customers request a service, a provider (pro) is assigned and confirms it, and the customer tracks, messages, reschedules, or cancels the booking from their dashboard.

**Current state:** the frontend is built (Next.js 16, React 19, Tailwind 4). **There is no backend yet.** Every page reads from hard-coded mock data or local component state, and every action (book, cancel, message, save profile) only shows a toast.

This README describes everything the backend has to provide so the existing UI can work for real.

---

## Contents

1. [Quick start (frontend)](#1-quick-start-frontend)
2. [Backend scope at a glance](#2-backend-scope-at-a-glance)
3. [Recommended stack](#3-recommended-stack)
4. [Users and roles](#4-users-and-roles)
5. [Data model](#5-data-model)
6. [Booking lifecycle](#6-booking-lifecycle)
7. [API reference](#7-api-reference)
8. [Feature-by-feature requirements](#8-feature-by-feature-requirements)
9. [Cross-cutting requirements](#9-cross-cutting-requirements)
10. [Environment variables](#10-environment-variables)
11. [Frontend integration checklist](#11-frontend-integration-checklist)
12. [Frontend issues to fix during integration](#12-frontend-issues-to-fix-during-integration)
13. [Open product questions](#13-open-product-questions)
14. [Suggested delivery phases](#14-suggested-delivery-phases)

---

## 1. Quick start (frontend)

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000.

| Route | What it is |
|---|---|
| `/` | Public landing page (hero quick-quote form, services, gallery, service areas, FAQ) |
| `/quote` | Full moving quote form (public, with sign-in / sign-up box) |
| `/book-service` | Choose a service |
| `/book-service/moving` | Moving booking form |
| `/book-service/furniture-assembly` | Furniture assembly booking form |
| `/book-service/tv-mounting` | TV mounting booking form |
| `/dashboard` | Customer dashboard (stats, upcoming bookings, messages) |
| `/my-bookings` | Booking list with search, status tabs, date range, pagination |
| `/my-bookings/[id]` | Booking details, progress timeline, cancel / modify |
| `/profile` | Profile and settings (personal info, addresses, language, notifications, password, payments, appearance) |

All mock data lives in [app/data/mockData.ts](app/data/mockData.ts). The rest is hard-coded inside components (listed in [section 11](#11-frontend-integration-checklist)).

> This project runs **Next.js 16**, which differs from older versions. For example, `middleware.ts` is now `proxy.ts`. Read the bundled docs in `node_modules/next/dist/docs/` before writing server code.

---

## 2. Backend scope at a glance

The backend must provide:

| # | Capability | Used by |
|---|---|---|
| 1 | **Authentication** — sign up, sign in, sign out, "remember me", password reset, change password | `/quote`, booking sidebars, `/profile` → Security |
| 2 | **User profile & preferences** — name, phone, photo, language, timezone, date format, theme, notification toggles | `/profile` |
| 3 | **Saved addresses** — CRUD, one default | `/profile` → Addresses, address dropdown in booking forms |
| 4 | **Service catalog** — 3 services, starting prices, form options | `/book-service`, landing page |
| 5 | **Quotes / booking requests** — create a request per service type with its specific details | `/quote`, `/book-service/*`, hero form |
| 6 | **Availability** — time slots per date, service, and ZIP | Date & Time section in booking forms |
| 7 | **File uploads** — up to 5 job photos per booking, 1 profile photo | Photos section, booking details → Photos, profile |
| 8 | **Bookings** — list (search, filter, paginate), details, stats, cancel, reschedule, modify | `/dashboard`, `/my-bookings`, `/my-bookings/[id]` |
| 9 | **Booking timeline** — history of status changes with timestamps | Booking details → progress |
| 10 | **Providers** — profile, rating, review count, phone, avatar | Booking cards, details sidebar |
| 11 | **Messaging** — conversations between customer and provider, unread counts | Dashboard → Recent Messages, nav badge, "Message provider" |
| 12 | **Notifications** — in-app bell list + email/SMS based on preferences | Topbar bell, profile → Notifications |
| 13 | **Payments** — saved cards, charge on booking/completion, receipts | `/profile` → Payment Methods, "Send receipt" |
| 14 | **Reviews** — rate the provider after completion | Booking timeline step "Rate your experience" |
| 15 | **Service areas** — supported regions/ZIPs | Landing page, ZIP validation |
| 16 | **Admin / dispatch** (no UI yet) — confirm requests, assign providers, set prices | Needed to move bookings from Pending → Confirmed |

---

## 3. Recommended stack

These are suggestions. Any stack works as long as it implements the API in [section 7](#7-api-reference).

| Concern | Recommendation | Why |
|---|---|---|
| API layer | Next.js **Route Handlers** (`app/api/**/route.ts`) and/or **Server Actions** | Same repo and deploy as the frontend; no separate server needed at this size |
| Route protection | `proxy.ts` (Next 16 replacement for middleware) to redirect signed-out users away from `/dashboard`, `/my-bookings`, `/profile` | Built in |
| Database | PostgreSQL | Relational data (users → bookings → providers → messages) |
| ORM | Prisma or Drizzle | Typed queries, migrations |
| Auth | Auth.js (NextAuth v5), Better Auth, or Clerk | Email + password today, social login later |
| File storage | S3, Cloudflare R2, or Vercel Blob with signed upload URLs | Photos should not pass through the app server |
| Payments | Stripe (Customer, SetupIntent, PaymentIntent, saved cards) | The UI already shows a saved card "•••• 4242" |
| Email | Resend, Postmark, or SendGrid | Confirmations, receipts, password reset |
| SMS (optional) | Twilio | Day-of-service reminders |
| Real-time messaging | Pusher, Ably, Supabase Realtime, or polling to start | Chat and unread badges |
| Validation | Zod, shared between client and server | One schema per form |
| Background jobs | Inngest, Trigger.dev, or a cron route | Reminders, auto-expire stale requests |

---

## 4. Users and roles

| Role | Description | Needs |
|---|---|---|
| **Customer** | Books services. This is the only role with UI today. | Own bookings, messages, profile, payment methods |
| **Provider (pro)** | Mover / technician who does the job. Shown on cards with name, avatar, rating, reviews, phone. | Accept assigned jobs, message customers, mark jobs complete. Needs its own UI later. |
| **Admin / dispatcher** | MoveNowFL staff. The timeline step "Agent confirmed — crew and arrival window locked in" implies a human confirms. | See all requests, set final price, assign provider, confirm/cancel, manage service areas and catalog |

Every API must check that the signed-in user can access the resource (a customer sees only their own bookings and conversations).

---

## 5. Data model

Field names and enum values are taken from the current UI so the frontend can switch over with minimal changes.

### 5.1 Enums

```ts
type Role = 'customer' | 'provider' | 'admin';

type ServiceType = 'moving' | 'furniture_assembly' | 'tv_mounting';
// UI labels: 'Moving' | 'Furniture Assembly' | 'TV Mounting'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
// UI today uses: Pending | Confirmed | Completed | Cancelled.
// 'in_progress' backs the "Service day" timeline step.

type Floor = 'ground' | '2nd' | '3rd' | '4th' | '5th_plus';
type Parking = 'street' | 'driveway' | 'loading_dock' | 'garage';

type HomeSize = 'studio' | '1br' | '2br' | '3br' | '4br_plus';
type MoveVolume = 'few' | 'half' | 'full' | 'unsure';
type SpecialItem = 'piano' | 'safe' | 'gym_equipment' | 'large_appliances' | 'artwork';
type ExtraService = 'packing' | 'unpacking' | 'assembly' | 'tv';     // /quote page

type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'specific'; // /quote page
type DateFlexibility = 'exact' | 'day' | 'week';                     // /quote page

type TvMountType = 'wall' | 'above_fireplace' | 'ceiling';
type TvSize = '32_43' | '44_55' | '56_65' | '66_75' | '76_plus';
type WallType = 'drywall_wood' | 'drywall_metal' | 'brick' | 'concrete' | 'plaster' | 'stone_veneer';
type Bracket = 'flat' | 'tilting' | 'full_motion' | 'ceiling_pole' | 'customer_has' | 'supply_one';

type FurnitureType = 'bed_frame' | 'dresser' | 'wardrobe' | 'dining_table' | 'desk' | 'bookcase'
  | 'sofa' | 'crib' | 'patio_set' | 'tv_stand';
```

### 5.2 Tables

**users**

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| email | string, unique | Cannot be changed from the UI ("Email address cannot be changed") |
| password_hash | string | argon2 or bcrypt; null if social login |
| role | Role | default `customer` |
| full_name | string | |
| phone | string | E.164 format, e.g. `+13055550123` |
| avatar_url | string? | Profile photo |
| email_verified_at | timestamp? | |
| created_at / updated_at | timestamp | |

**user_preferences** (1:1 with users)

| Field | Type | Default (from UI) |
|---|---|---|
| language | `en` \| `es` \| `pt` | `en` |
| timezone | IANA string | `America/New_York` (UI shows "Eastern Time") |
| date_format | `MM/DD/YYYY` \| `DD/MM/YYYY` \| `YYYY-MM-DD` | `MM/DD/YYYY` |
| theme | `light` \| `system` \| `navy` | `light` |
| notify_booking | bool | true |
| notify_messages | bool | true |
| notify_promos | bool | false |
| notify_news | bool | false |

**addresses** (saved addresses and job addresses)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid? | null for one-off job addresses |
| label | string | `Home`, `Office`, `Gym`, or custom |
| street | string | |
| apt | string? | |
| city | string | |
| state | string(2) | UI offers FL, GA, NY, TX, CA |
| zip | string(5) | |
| lat / lng | decimal? | From geocoding; useful for distance pricing and maps |
| is_default | bool | Only one per user |

**services** (catalog)

| Field | Type | Example |
|---|---|---|
| id | ServiceType | `moving` |
| name | string | `Moving` |
| description | string | "Residential, business and office moves…" |
| starting_price_cents | int | Moving 7000, Assembly 5000, TV 7000 |
| image_url | string | |
| active | bool | |

**bookings**

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| ref | string, unique | Human reference, format `MN-YYYY-NNNN` (e.g. `MN-2025-0068`). Must be searchable. |
| customer_id | uuid | FK users |
| provider_id | uuid? | FK providers; null while pending |
| service_type | ServiceType | |
| status | BookingStatus | |
| scheduled_date | date | |
| window_start / window_end | time | e.g. 08:00–10:00. UI shows "8:00 AM - 10:00 AM" |
| preferred_slot | string? | Slot the customer picked (e.g. `10:00 AM`) before confirmation |
| date_flexibility | DateFlexibility? | /quote only |
| estimated_duration_min | int | UI shows "2 hours", "1.5 hours" |
| origin_address_id | uuid | Job address / "From" |
| destination_address_id | uuid? | Moving only / "To" |
| origin_floor, origin_elevator, origin_parking, origin_access_notes | | Access details. Moving needs them for **both** addresses (the /quote page collects them per address). |
| destination_floor, destination_elevator, destination_parking, destination_access_notes | | Moving only |
| notes | text | "Special instructions" |
| details | jsonb | Service-specific fields, see 5.3 |
| extra_services | ExtraService[] | /quote only |
| quoted_price_cents | int? | Estimate shown to customer |
| final_price_cents | int? | Set by admin/provider |
| cover_image_url | string? | Card thumbnail (can be derived from service type) |
| cancelled_at, cancel_reason | | |
| created_at / updated_at | timestamp | |

**booking_photos**

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| booking_id | uuid | |
| url | string | Storage URL |
| file_name, mime_type, size_bytes | | |
| created_at | timestamp | Max **5 per booking** (enforced in UI, must be enforced on server too) |

**booking_events** (powers the progress timeline)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| booking_id | uuid | |
| type | `submitted` \| `confirmed` \| `rescheduled` \| `modified` \| `started` \| `completed` \| `cancelled` \| `provider_assigned` | |
| actor_id | uuid? | Who did it |
| payload | jsonb | e.g. old/new date for reschedule |
| created_at | timestamp | Shown as "Oct 29, 2026 • 10:24 AM" |

**providers**

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK users (role = provider) |
| display_name | string | |
| avatar_url, avatar_alt | string | |
| phone | string | Shown in "Call the provider" |
| services | ServiceType[] | What they can do |
| service_area_ids | uuid[] | Where they work |
| rating_avg | decimal(2,1) | Denormalised from reviews, e.g. 4.9 |
| review_count | int | e.g. 128 |
| background_checked, insured | bool | "Background checked & insured" perk |

**reviews**

| Field | Type |
|---|---|
| id, booking_id (unique), provider_id, customer_id | uuid |
| rating | int 1–5 |
| comment | text? |
| created_at | timestamp |

**conversations** and **messages**

| conversations | | messages | |
|---|---|---|---|
| id | uuid | id | uuid |
| booking_id | uuid? | conversation_id | uuid |
| customer_id | uuid | sender_id | uuid |
| provider_id | uuid | body | text |
| last_message_at | timestamp | attachments | jsonb? |
| | | created_at | timestamp |
| | | read_at | timestamp? |

Unread count per conversation = messages where `sender_id != me` and `read_at is null`.

**notifications** (topbar bell)

| Field | Type | Example |
|---|---|---|
| id, user_id | uuid | |
| type | string | `booking_confirmed`, `new_message`, `awaiting_confirmation` |
| text | string | "Mike Rodriguez confirmed your Jun 18 moving" |
| link | string? | `/my-bookings/<id>` |
| read_at | timestamp? | |
| created_at | timestamp | Shown as "2h ago" |

**payment_methods** — store **only** Stripe IDs and display data, never card numbers.

| Field | Type | Example |
|---|---|---|
| id, user_id | uuid | |
| stripe_payment_method_id | string | |
| brand | string | `visa` |
| last4 | string | `4242` |
| exp_month / exp_year | int | 05 / 28 |
| is_default | bool | |

**payments**

| Field | Type |
|---|---|
| id, booking_id | uuid |
| stripe_payment_intent_id | string |
| amount_cents, currency | int, `usd` |
| status | `requires_payment` \| `authorized` \| `paid` \| `refunded` \| `failed` |
| receipt_url | string? |

**service_areas**

| Field | Type | Example |
|---|---|---|
| id | uuid | |
| name | string | Miami-Dade, Broward, Palm Beach, Brickell, Wynwood, Coral Gables, Doral, Aventura |
| zips | string[] | ZIPs covered |
| active | bool | |

**availability / time slots** — either a table of capacity per `(date, slot, service, area)` or computed from provider schedules. The UI shows hourly slots **8:00 AM – 7:00 PM** with some disabled.

### 5.3 Service-specific `details` (jsonb)

```jsonc
// moving
{
  "homeSize": "1br",              // studio | 1br | 2br | 3br | 4br_plus
  "volume": "full",               // few | half | full | unsure
  "specialItems": ["piano", "safe"] // empty array = "None"
}

// furniture_assembly
{
  "furnitureType": "bed_frame",
  "brand": "IKEA",
  "model": "MALM",
  "hasInstructions": true,
  "needsWallAnchoring": false
}

// tv_mounting
{
  "mountType": "wall",
  "tvSize": "56_65",
  "wallType": "drywall_wood",
  "bracket": "full_motion",
  "needsPowerOutlet": true        // "power" yes/no in the form
}
```

Validate `details` with a separate Zod schema per `service_type`.

---

## 6. Booking lifecycle

```
            customer submits
                  │
                  ▼
   ┌──────────► PENDING ─────────────┐
   │              │                  │ customer / admin cancels
   │   admin confirms, assigns       ▼
   │   provider, sets window     CANCELLED
   │              │                  ▲
   │              ▼                  │
   │          CONFIRMED ─────────────┤ cancel (policy may apply)
   │              │                  │
   │  reschedule  │ service day      │
   └──────────────┤ starts           │
   (back to       ▼                  │
   pending if  IN_PROGRESS           │
   needs re-      │                  │
   confirmation)  │ provider marks done
                  ▼
              COMPLETED ──► customer can review, receipt sent
```

Rules the UI already assumes:

- **Cancel** is disabled when status is `completed` or `cancelled`.
- **Modify** is allowed "up to 24 hours before" the service window. The server must enforce this.
- **Reschedule** is available on pending and confirmed bookings.
- **Receipt** is only for completed bookings.
- **Review** becomes available after completion ("Rate your experience after service").
- Every transition writes a `booking_events` row and triggers notifications (see 9.5).

---

## 7. API reference

REST shape shown below; the same operations can be Server Actions. All endpoints return JSON. All except auth, catalog, service areas, and public quote require a signed-in session.

### 7.1 Conventions

- Base path: `/api/v1`
- Auth: HTTP-only, `Secure`, `SameSite=Lax` session cookie
- Money: integer cents (`"priceCents": 7000`)
- Dates: ISO 8601 (`2026-10-30`, `2026-10-29T14:24:00Z`); the frontend formats using the user's timezone and date format
- Pagination: `?page=1&pageSize=5` → response includes `{ items, page, pageSize, total, totalPages }`. The bookings page uses page size **5**.
- Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please enter a street address",
    "fields": { "origin.street": "Required" }
  }
}
```

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad input |
| 401 | `UNAUTHENTICATED` | No session |
| 403 | `FORBIDDEN` | Not your resource / wrong role |
| 404 | `NOT_FOUND` | |
| 409 | `CONFLICT` | Slot taken, invalid status transition, modify window closed |
| 413 | `FILE_TOO_LARGE` | |
| 422 | `OUT_OF_SERVICE_AREA` | ZIP not served |
| 429 | `RATE_LIMITED` | |

### 7.2 Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `{ email, password, fullName?, phone? }` | Used by "Create account" on `/quote` |
| POST | `/auth/signin` | `{ email, password, remember }` | `remember` → long-lived session (e.g. 30 days) vs. browser session |
| POST | `/auth/signout` | — | |
| GET | `/auth/session` | — | Returns current user + preferences, or 401 |
| POST | `/auth/password/forgot` | `{ email }` | Always 200 (don't reveal if email exists) |
| POST | `/auth/password/reset` | `{ token, newPassword }` | |
| POST | `/auth/password/change` | `{ currentPassword, newPassword }` | Profile → Security |
| POST | `/auth/verify-email` | `{ token }` | |

### 7.3 Profile & preferences

| Method | Path | Body / Notes |
|---|---|---|
| GET | `/me` | User + preferences |
| PATCH | `/me` | `{ fullName?, phone? }` — email is read-only |
| POST | `/me/avatar` | Returns signed upload URL, then confirm with `{ key }` |
| DELETE | `/me/avatar` | |
| PATCH | `/me/preferences` | `{ language?, timezone?, dateFormat?, theme?, notifications?: { booking, messages, promos, news } }` |
| DELETE | `/me` | Account deletion (recommended for privacy compliance) |

### 7.4 Addresses

| Method | Path | Notes |
|---|---|---|
| GET | `/me/addresses` | For profile and the "Saved address" dropdown in booking forms |
| POST | `/me/addresses` | `{ label, street, apt?, city, state, zip, isDefault? }` |
| PATCH | `/me/addresses/:id` | |
| DELETE | `/me/addresses/:id` | |
| POST | `/me/addresses/:id/default` | Makes it default, unsets others |

### 7.5 Catalog, service areas, availability (public)

| Method | Path | Notes |
|---|---|---|
| GET | `/services` | Catalog with starting prices |
| GET | `/services/:type/options` | Dropdown values for that service's form (so options are not hard-coded) |
| GET | `/service-areas` | Names for the landing page |
| GET | `/service-areas/check?zip=33139` | `{ served: true, area: "Miami-Dade" }` |
| GET | `/availability?service=moving&zip=33139&date=2026-10-30` | `{ slots: [{ time: "08:00", available: true }, …] }` |

### 7.6 Quotes & bookings (customer)

**Create a booking request** — used by all three `/book-service/*` forms and `/quote`.

`POST /bookings`

```json
{
  "serviceType": "moving",
  "scheduledDate": "2026-10-30",
  "preferredSlot": "10:00",
  "dateFlexibility": "exact",
  "origin": {
    "savedAddressId": null,
    "street": "123 Ocean Dr", "apt": "4B", "city": "Miami", "state": "FL", "zip": "33139",
    "floor": "2nd", "elevator": true, "parking": "street", "accessNotes": "Gate code 1234"
  },
  "destination": {
    "street": "456 Brickell Ave", "city": "Miami", "state": "FL", "zip": "33131",
    "floor": "ground", "elevator": false, "parking": "driveway"
  },
  "details": { "homeSize": "1br", "volume": "full", "specialItems": ["piano"] },
  "extraServices": ["packing"],
  "notes": "Fragile glass table",
  "photoKeys": ["uploads/tmp/abc.jpg"]
}
```

Response `201`:

```json
{
  "id": "6f1c…",
  "ref": "MN-2026-0069",
  "status": "pending",
  "quotedPriceCents": 42000,
  "createdAt": "2026-10-28T15:02:11Z"
}
```

Notes:

- `destination` is required only for `moving`.
- For furniture assembly and TV mounting there is one job address (the UI calls it "Job Address").
- If the user is not signed in, either require sign-in before submit, or accept a guest request with `contact: { email, phone, name }` and attach it to an account later (see [open questions](#13-open-product-questions)).
- Optional: `POST /quotes/estimate` with the same body returns a price estimate without creating a booking, for the live summary sidebar.

**Hero quick quote** (landing page) — `POST /leads` with `{ serviceType, fromZip, toZip }`, or simply redirect to `/quote` with prefilled values (no PII in the URL; ZIPs only).

**List bookings** — `GET /bookings`

| Query param | Example | Notes |
|---|---|---|
| `q` | `brickell`, `MN-2025-0068` | Searches service name, ref, and address |
| `status` | `pending` | Omit for "All" |
| `service` | `tv_mounting` | Dashboard side panel filter |
| `from`, `to` | `2025-06-01`, `2025-07-31` | Date range filter |
| `upcoming` | `true` | Pending + confirmed with date ≥ today (dashboard "Upcoming Bookings") |
| `page`, `pageSize` | `1`, `5` | |
| `sort` | `-scheduledDate` | |

Each item must contain what [BookingCard](app/my-bookings/components/BookingCard.tsx) renders:

```json
{
  "id": "6f1c…",
  "ref": "MN-2025-0068",
  "serviceType": "moving",
  "status": "confirmed",
  "scheduledDate": "2025-06-18",
  "windowStart": "08:00",
  "windowEnd": "10:00",
  "estimatedDurationMin": 120,
  "address": "123 Ocean Dr, Miami, FL, 33139",
  "coverImageUrl": "https://…",
  "provider": {
    "id": "…", "name": "Mike Rodriguez", "avatarUrl": "https://…", "avatarAlt": "…",
    "rating": 4.9, "reviewCount": 128
  }
}
```

**Stats** — `GET /bookings/stats?from=&to=`

```json
{ "total": 6, "upcoming": 2, "pending": 1, "confirmed": 1, "completed": 3, "cancelled": 1 }
```

Used by the dashboard stats row, the My Bookings mini stats, and the status tab counts (counts must respect the same search/date filters as the list).

**Booking details & actions**

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/bookings/:id` | — | Full booking: addresses, access info, details, notes, photos, provider (incl. phone), price, events timeline. Accept `:id` or `ref`. |
| PATCH | `/bookings/:id` | `{ details?, notes?, accessNotes? }` | "Modify" — reject with 409 if < 24h before window |
| POST | `/bookings/:id/reschedule` | `{ date, preferredSlot, reason? }` | Checks availability; may return status to `pending` |
| POST | `/bookings/:id/cancel` | `{ reason? }` | 409 if completed/cancelled; apply cancellation fee policy; refund if paid |
| POST | `/bookings/:id/photos` | `{ keys: [] }` | After signed upload; max 5 total |
| DELETE | `/bookings/:id/photos/:photoId` | — | |
| POST | `/bookings/:id/receipt` | — | Emails the receipt ("Receipt for MN-… sent to your email"); completed only |
| POST | `/bookings/:id/review` | `{ rating, comment? }` | Completed only, once per booking |

### 7.7 Uploads

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/uploads` | `{ purpose: "booking_photo" \| "avatar", fileName, mimeType, sizeBytes }` | `{ uploadUrl, key, expiresAt }` |

Flow: client requests URL → `PUT` file directly to storage → sends `key` with the booking or avatar call. Server checks the key belongs to this user and the object exists.

### 7.8 Providers

| Method | Path | Notes |
|---|---|---|
| GET | `/providers/:id` | Public profile: name, avatar, rating, review count, services, recent reviews ("View provider profile") |
| GET | `/providers/:id/reviews?page=` | |

### 7.9 Messaging

| Method | Path | Notes |
|---|---|---|
| GET | `/conversations` | List with `{ id, otherParty: { name, avatarUrl }, lastMessagePreview, lastMessageAt, unreadCount, bookingRef? }` — powers Recent Messages |
| POST | `/conversations` | `{ bookingId }` — get or create the conversation for "Message provider" |
| GET | `/conversations/:id/messages?before=&limit=` | Cursor pagination |
| POST | `/conversations/:id/messages` | `{ body }` |
| POST | `/conversations/:id/read` | Marks all as read (clicking a conversation clears its unread badge) |
| GET | `/conversations/unread-count` | Nav "Messages" badge |
| Real-time | channel `user:<id>` | Events: `message.created`, `conversation.read` |

### 7.10 Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications?limit=10` | Bell dropdown |
| POST | `/notifications/:id/read` | |
| POST | `/notifications/read-all` | |

### 7.11 Payments

| Method | Path | Notes |
|---|---|---|
| GET | `/me/payment-methods` | `[{ id, brand, last4, expMonth, expYear, isDefault }]` |
| POST | `/me/payment-methods/setup-intent` | Returns Stripe SetupIntent client secret; card entered in Stripe Elements |
| POST | `/me/payment-methods/:id/default` | |
| DELETE | `/me/payment-methods/:id` | |
| POST | `/webhooks/stripe` | Handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `setup_intent.succeeded`. Verify signature. |

### 7.12 Admin / dispatch (no UI yet)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/bookings?status=pending` | Queue of new requests |
| POST | `/admin/bookings/:id/confirm` | `{ providerId, windowStart, windowEnd, finalPriceCents, estimatedDurationMin }` |
| POST | `/admin/bookings/:id/assign` | `{ providerId }` |
| POST | `/admin/bookings/:id/status` | `{ status }` — `in_progress`, `completed` |
| CRUD | `/admin/providers`, `/admin/services`, `/admin/service-areas`, `/admin/availability` | |

Provider-facing equivalents (`/provider/jobs`, `/provider/jobs/:id/start`, `/provider/jobs/:id/complete`) are needed once a provider app exists.

---

## 8. Feature-by-feature requirements

### 8.1 Sign in / sign up
- Shown on `/quote` and in the summary sidebar of each `/book-service/*` page (email, password, show/hide, remember me).
- Booking pages should prefill name, phone, and saved addresses when signed in.
- Redirect signed-out users from `/dashboard`, `/my-bookings`, `/profile` to sign-in using `proxy.ts`.

### 8.2 Booking forms (`/book-service/*`, `/quote`)
- Shared sections: Job Address (saved address picker + street/city/state/ZIP + floor, elevator, parking, access notes), Date & Time, Photos (≤ 5 images), service details, notes.
- Server-side validation: required street/city/ZIP, valid date (not in the past, within booking horizon), slot available, ZIP within a service area.
- On success the UI should redirect to `/my-bookings/<id>` instead of only showing a toast.
- Price summary sidebar needs an estimate endpoint (pricing rules are an open question).

### 8.3 Availability
- The Date & Time section shows hourly slots from 8 AM to 7 PM, some disabled. Today these are hard-coded.
- Backend returns real availability per date, service, and ZIP, accounting for provider capacity and job duration.
- Hold or re-check the slot at submit to avoid double booking (409 if taken).

### 8.4 Dashboard and My Bookings
- Stats, upcoming list, full list with search (service, ref #, address), status tabs with counts, date range filter, pagination (5 per page), empty state.
- Do filtering/pagination in SQL, not in the browser. Add indexes on `(customer_id, scheduled_date)`, `(customer_id, status)`, and a trigram or full-text index for search.

### 8.5 Booking details
- Tabs: Details, Address & Location, Special Instructions, Photos.
- Progress timeline from `booking_events`: Request submitted → Agent confirmed → Service day → Completed.
- Sidebar: service, date, time window, duration, address, provider card, call provider (phone), message provider, cancel, modify.
- Exposing the provider's phone only after confirmation is recommended (or use a masked/proxy number).

### 8.6 Profile & settings
- Personal info: name, phone, email (read-only), photo upload.
- Saved addresses: list, add, remove, set default.
- Language & region: language (en/es/pt), timezone, date format. Emails and SMS should use the user's language.
- Notifications: four toggles; the backend must check these before sending.
- Security: change password (current + new + confirm). Enforce strength rules on the server and sign out other sessions after a change.
- Payment methods: list saved cards, add via Stripe, remove, set default.
- Appearance: theme stored server-side so it follows the user across devices.

### 8.7 Messaging
- One conversation per booking (or per customer–provider pair).
- Unread counts drive the nav badge and the Recent Messages list.
- Notify by email/push if the recipient is offline and `notify_messages` is on.

### 8.8 Landing page
- Hero quick-quote form (service, from ZIP, to ZIP) → validate ZIPs against service areas and continue to the full form.
- Service areas list should come from the database.
- Contact phone numbers are currently hard-coded in the footer; optionally serve from a settings table.

---

## 9. Cross-cutting requirements

### 9.1 Security
- Hash passwords with argon2id (or bcrypt cost ≥ 12).
- HTTP-only, Secure session cookies; CSRF protection for cookie-based mutations (Server Actions include this; Route Handlers need an origin check or token).
- Check ownership on every booking, conversation, address, and payment method query.
- Rate limit sign-in, sign-up, password reset, booking creation, and message sending.
- Never store card numbers; use Stripe tokens only.
- Validate upload MIME type and size on the server; strip EXIF location data from photos.
- Keep PII (email, phone, address) out of URLs and logs.

### 9.2 Validation
- One Zod schema per form, shared with the frontend.
- Enum values (section 5.1) are the only accepted values; map UI labels ↔ enum IDs in one place.

### 9.3 Files
- Booking photos: images only (`image/jpeg`, `image/png`, `image/webp`, `image/heic`), max 5 per booking, suggested 10 MB each.
- Avatar: 1 image, suggested 5 MB, resized to e.g. 256×256.
- Serve via CDN or signed read URLs; photos are private to the customer, assigned provider, and admins.

### 9.4 Time and locale
- Store timestamps in UTC; store service date + window as local Florida time (`America/New_York`) since the job happens there.
- Return ISO values; the frontend formats with the user's timezone and date format.
- Messages and emails in en / es / pt.

### 9.5 Notifications matrix

| Event | In-app | Email | SMS (optional) | Respects toggle |
|---|---|---|---|---|
| Request submitted | ✓ | ✓ | | booking |
| Booking confirmed / provider assigned | ✓ | ✓ | ✓ | booking |
| Rescheduled / modified | ✓ | ✓ | | booking |
| Cancelled | ✓ | ✓ | ✓ | booking |
| Reminder 24h before | ✓ | ✓ | ✓ | booking |
| Completed + receipt + review request | ✓ | ✓ | | booking |
| New message | ✓ | ✓ (if offline) | | messages |
| Promotions | | ✓ | | promos |
| Product news | | ✓ | | news |
| Password changed / reset | | ✓ | | always sent |

### 9.6 Observability and ops
- Structured logs with request ID; error tracking (e.g. Sentry).
- Database migrations in version control; seed script that recreates the current mock data (6 bookings, 6 providers, 4 conversations) for local development.
- Health check route `GET /api/health`.
- Daily database backups.

### 9.7 Testing
- Unit tests for validation schemas, pricing, and status transitions.
- Integration tests for each endpoint (auth, ownership, 409 cases).
- Stripe webhooks tested with the Stripe CLI in test mode.

---

## 10. Environment variables

Add a `.env.example` with:

```bash
# App
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/movenowfl

# Auth
AUTH_SECRET=                # random 32+ byte string
AUTH_SESSION_MAX_AGE_DAYS=30

# Storage
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_PUBLIC_BASE_URL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email / SMS
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM="MoveNowFL <no-reply@your-domain>"
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Real-time (if used)
REALTIME_APP_ID=
REALTIME_KEY=
REALTIME_SECRET=

# Geocoding (optional, for distance pricing)
GEOCODING_API_KEY=
```

Only variables prefixed `NEXT_PUBLIC_` reach the browser. Never prefix secrets with it.

---

## 11. Frontend integration checklist

Where mock data or fake actions live today, and what replaces them:

| File | Mocked today | Replace with |
|---|---|---|
| [app/data/mockData.ts](app/data/mockData.ts) | `bookings`, `initialMessages`, `dateRanges`, types | API types + `GET /bookings`, `GET /conversations` |
| [app/dashboard/components/StatsRow.tsx](app/dashboard/components/StatsRow.tsx) | Hard-coded counts (2, 1, 3, 6) | `GET /bookings/stats` |
| [app/my-bookings/components/MiniStats.tsx](app/my-bookings/components/MiniStats.tsx) | Hard-coded counts | `GET /bookings/stats` |
| [app/dashboard/components/UpcomingBookings.tsx](app/dashboard/components/UpcomingBookings.tsx) | Filters mock list | `GET /bookings?upcoming=true` |
| [app/dashboard/components/BookingsSidePanel.tsx](app/dashboard/components/BookingsSidePanel.tsx) | Client-side filter; reschedule/message/cancel are toasts | `GET /bookings` with filters; action endpoints |
| [app/my-bookings/components/MyBookingsClient.tsx](app/my-bookings/components/MyBookingsClient.tsx) | Client-side search, tabs, pagination | `GET /bookings` + `GET /bookings/stats` |
| [app/my-bookings/components/BookingCard.tsx](app/my-bookings/components/BookingCard.tsx) | Reschedule, message, receipt, cancel are toasts | `/reschedule`, `/conversations`, `/receipt`, `/cancel` |
| [app/my-bookings/[id]/page.tsx](app/my-bookings/[id]/page.tsx) + components | Static TV-mounting data, local cancel state, fixed timeline | `GET /bookings/:id`, `PATCH`, `/cancel`, `/photos` |
| [app/my-bookings/[id]/components/BookingProgress.tsx](app/my-bookings/[id]/components/BookingProgress.tsx) | Hard-coded steps and dates | `events` from booking details |
| [app/my-bookings/[id]/components/DetailsSidebar.tsx](app/my-bookings/[id]/components/DetailsSidebar.tsx) | Hard-coded summary and phone | Booking details + provider |
| [app/dashboard/components/RecentMessages.tsx](app/dashboard/components/RecentMessages.tsx) | Local state; always "sends" to Sarah Johnson | Messaging endpoints + real-time |
| [app/my-bookings/components/RailTabs.tsx](app/my-bookings/components/RailTabs.tsx) | Mock messages and upcoming | Same endpoints as dashboard |
| [app/components/Topbar.tsx](app/components/Topbar.tsx) | Hard-coded notifications; search input does nothing | `GET /notifications`; search → `/my-bookings?q=` |
| [app/components/NavTabs.tsx](app/components/NavTabs.tsx) | Messages badge = 2, links to `/` | `GET /conversations/unread-count`; a messages page |
| [app/book-service/components/DateTimeSection.tsx](app/book-service/components/DateTimeSection.tsx) | Static slots, 2 PM always disabled | `GET /availability` |
| [app/book-service/components/PhotosSection.tsx](app/book-service/components/PhotosSection.tsx) | Keeps file names only | `POST /uploads` + direct upload |
| [app/book-service/components/JobAdress.tsx](app/book-service/components/JobAdress.tsx), [moving/components/MoveDetailsSection.tsx](app/book-service/moving/components/MoveDetailsSection.tsx) | Saved address options hard-coded (Home/Office/Gym) | `GET /me/addresses` |
| `app/book-service/*/components/Book*ServiceClient.tsx` | Submit shows a toast | `POST /bookings`, then redirect |
| `app/book-service/*/components/*SummarySidebar.tsx` | Sign-in form does nothing | Auth endpoints |
| [app/quote/page.tsx](app/quote/page.tsx) | Form state only; sign-in/sign-up do nothing | Auth + `POST /bookings` |
| [app/components/HeroSection.tsx](app/components/HeroSection.tsx) | Quick quote form not submitted | ZIP check + continue to booking |
| [app/components/GalleryAreasSection.tsx](app/components/GalleryAreasSection.tsx) | Hard-coded area list | `GET /service-areas` |
| [app/book-service/components/ChooseService.tsx](app/book-service/components/ChooseService.tsx) | Hard-coded services and prices | `GET /services` |
| [app/profile/components/ProfileClient.tsx](app/profile/components/ProfileClient.tsx) | Hard-coded "John Doe", phone, prefs | `GET /me`, `PATCH /me`, `PATCH /me/preferences` |
| [app/profile/components/AddressesSection.tsx](app/profile/components/AddressesSection.tsx) | Local list | Address endpoints |
| [app/profile/components/SecuritySection.tsx](app/profile/components/SecuritySection.tsx) | Current password prefilled with a placeholder value | `POST /auth/password/change`; start empty |
| [app/profile/components/PaymentSection.tsx](app/profile/components/PaymentSection.tsx) | Static "•••• 4242" card | Payment method endpoints + Stripe Elements |
| [app/profile/components/PersonalInfoSection.tsx](app/profile/components/PersonalInfoSection.tsx) | Photo upload not wired | `POST /me/avatar` |

Suggested approach: add a small typed client in `app/lib/api.ts` (or Server Actions in `app/actions/*`), move shared types from `mockData.ts` to `app/lib/types.ts`, and replace imports file by file.

---

## 12. Frontend issues to fix during integration

Found while mapping the UI. They will cause bugs once real data flows through.

1. **Inconsistent home size IDs and ranges.** `/quote` uses `1bed`, `2bed`… with "0–500 sqft"; `/book-service/moving` uses `1br`, `2br`… with "0 - 400 sqft". Pick one set (section 5.1).
2. **Wrong copy on non-moving forms.** Furniture assembly and TV mounting show "Please enter both street addresses" and "Move details saved", but they have only one address.
3. **Typo in TV options:** `'Ceilling mount'` → `Ceiling mount`. Bracket option `'flat to wall'` is lowercase.
4. **TV summary sidebar label** says "Move date" instead of "Service date".
5. **Hard-coded default date** `2026-10-30` in all booking forms; should default to the next available date from the API.
6. **Booking details page** looks up the booking by `id` for the header only. The sidebar, tabs, timeline, and "Booked on" date are hard-coded to a TV mounting booking, and the ref is rewritten from `MN-2025-` to `BK-`. Use one ref format everywhere.
7. **State dropdown** only offers FL, GA, NY, TX, CA. Since service is South Florida only, consider locking to FL or validating against service areas.
8. **Messages nav link** points to `/`; a messages page is needed.
9. **Quick links in RailTabs** — "Book a Service" links to `/my-bookings` and "Back to Dashboard" links to `/`.
10. **Password field prefilled** with a sample value in Security settings.

---

## 13. Open product questions

These decide parts of the backend and need an answer from the product owner:

1. **Pricing:** how is the estimate calculated? (hourly × crew size, by home size/volume, distance between ZIPs, special-item surcharges, floor/elevator fees, TV size and wall type, furniture type.) Is the price fixed or confirmed by an agent?
2. **Payment timing:** card saved at booking and charged after completion? Deposit at booking? Pay in person?
3. **Guest booking:** can someone request a quote without an account, or must they sign in first?
4. **Provider assignment:** manual by a dispatcher, or automatic by area and availability? Can a provider decline?
5. **Cancellation policy:** free until when? Fee after that? Same for reschedule?
6. **Modify window:** the UI says 24 hours. Confirm, and which fields can change.
7. **Long-distance moves:** the service card says "local and long distance". Are out-of-state destinations allowed? Different pricing?
8. **Provider and admin apps:** in scope for this phase, or will admins use a simple internal page or a third-party tool?
9. **Messaging scope:** customer ↔ provider only, or customer ↔ support as well? Attachments?
10. **Reviews:** public on a provider profile page? Moderation?

---

## 14. Suggested delivery phases

| Phase | Deliverables | Unlocks |
|---|---|---|
| **1. Foundation** | DB schema + migrations, seed data, auth, `proxy.ts` route protection, `GET /me` | Real sign-in; protected pages |
| **2. Booking core** | Services, service areas, addresses, `POST /bookings`, uploads, list/stats/details | Booking forms, dashboard, My Bookings work end to end |
| **3. Operations** | Admin confirm/assign, booking events, availability, cancel/reschedule/modify, email notifications | Bookings move from Pending to Confirmed with a real timeline |
| **4. Communication** | Conversations, messages, unread counts, real-time, in-app notifications | Recent Messages, bell, nav badge |
| **5. Money** | Stripe customers, saved cards, charges, refunds, receipts, webhooks | Payment Methods, receipts |
| **6. Trust & polish** | Reviews, provider profiles, SMS reminders, i18n emails, rate limiting, monitoring | Ratings, reminders, production readiness |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
