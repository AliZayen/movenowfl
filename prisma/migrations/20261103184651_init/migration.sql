-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('moving', 'furniture_assembly', 'tv_mounting');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "BookingEventType" AS ENUM ('submitted', 'provider_assigned', 'confirmed', 'rescheduled', 'modified', 'started', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "DateFlexibility" AS ENUM ('exact', 'day', 'week');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('password_reset', 'email_verify');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "date_format" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "notify_booking" BOOLEAN NOT NULL DEFAULT true,
    "notify_messages" BOOLEAN NOT NULL DEFAULT true,
    "notify_promos" BOOLEAN NOT NULL DEFAULT false,
    "notify_news" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "persistent" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "label" TEXT,
    "street" TEXT NOT NULL,
    "apt" TEXT,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zip" VARCHAR(5) NOT NULL,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starting_price_cents" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_alt" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_areas" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "zips" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_blocks" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "slot" TEXT,
    "service_type" "ServiceType",
    "area_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "avatar_alt" TEXT,
    "phone" TEXT,
    "services" "ServiceType"[],
    "rating_avg" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "background_checked" BOOLEAN NOT NULL DEFAULT false,
    "insured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "ref" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "provider_id" UUID,
    "service_type" "ServiceType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "scheduled_date" DATE NOT NULL,
    "preferred_slot" TEXT NOT NULL,
    "window_start" TEXT,
    "window_end" TEXT,
    "date_flexibility" "DateFlexibility",
    "estimated_duration_min" INTEGER NOT NULL,
    "origin_address_id" UUID NOT NULL,
    "origin_floor" TEXT,
    "origin_elevator" BOOLEAN,
    "origin_parking" TEXT,
    "origin_access_notes" TEXT,
    "destination_address_id" UUID,
    "destination_floor" TEXT,
    "destination_elevator" BOOLEAN,
    "destination_parking" TEXT,
    "destination_access_notes" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "extra_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "quoted_price_cents" INTEGER,
    "final_price_cents" INTEGER,
    "cover_image_url" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_photos" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_events" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "type" "BookingEventType" NOT NULL,
    "actor_id" UUID,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_ref_counters" (
    "year" INTEGER NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "booking_ref_counters_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "_ProviderToServiceArea" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ProviderToServiceArea_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_type_idx" ON "auth_tokens"("user_id", "type");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_areas_name_key" ON "service_areas"("name");

-- CreateIndex
CREATE INDEX "availability_blocks_date_idx" ON "availability_blocks"("date");

-- CreateIndex
CREATE UNIQUE INDEX "providers_user_id_key" ON "providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews"("booking_id");

-- CreateIndex
CREATE INDEX "reviews_provider_id_created_at_idx" ON "reviews"("provider_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_ref_key" ON "bookings"("ref");

-- CreateIndex
CREATE INDEX "bookings_customer_id_scheduled_date_idx" ON "bookings"("customer_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "bookings_customer_id_status_idx" ON "bookings"("customer_id", "status");

-- CreateIndex
CREATE INDEX "bookings_provider_id_scheduled_date_idx" ON "bookings"("provider_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "bookings_status_scheduled_date_idx" ON "bookings"("status", "scheduled_date");

-- CreateIndex
CREATE INDEX "bookings_service_type_scheduled_date_idx" ON "bookings"("service_type", "scheduled_date");

-- CreateIndex
CREATE INDEX "booking_photos_booking_id_idx" ON "booking_photos"("booking_id");

-- CreateIndex
CREATE INDEX "booking_events_booking_id_created_at_idx" ON "booking_events"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "_ProviderToServiceArea_B_index" ON "_ProviderToServiceArea"("B");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_blocks" ADD CONSTRAINT "availability_blocks_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "service_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_origin_address_id_fkey" FOREIGN KEY ("origin_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_destination_address_id_fkey" FOREIGN KEY ("destination_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_photos" ADD CONSTRAINT "booking_photos_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderToServiceArea" ADD CONSTRAINT "_ProviderToServiceArea_A_fkey" FOREIGN KEY ("A") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderToServiceArea" ADD CONSTRAINT "_ProviderToServiceArea_B_fkey" FOREIGN KEY ("B") REFERENCES "service_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
