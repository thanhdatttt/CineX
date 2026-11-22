-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('STANDARD', 'VIP', 'COUPLE');

-- CreateEnum
CREATE TYPE "ShowtimeStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'HELD', 'BOOKED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'PAYMENT_PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REQUIRES_RECONCILIATION');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'ADMITTED', 'VOID');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "normalized_email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "synopsis" TEXT,
    "duration_mins" INTEGER NOT NULL,
    "age_rating" VARCHAR(20),
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trailer_url" VARCHAR(2048),
    "release_date" DATE,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cinemas" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cinemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cinema_rooms" (
    "id" UUID NOT NULL,
    "cinema_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cinema_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "row_label" VARCHAR(10) NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "seat_type" "SeatType" NOT NULL DEFAULT 'STANDARD',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showtimes" (
    "id" UUID NOT NULL,
    "movie_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "status" "ShowtimeStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "showtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showtime_seats" (
    "id" UUID NOT NULL,
    "showtime_id" UUID NOT NULL,
    "seat_id" UUID NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "reservation_id" UUID,
    "booking_id" UUID,
    "price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "showtime_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "showtime_id" UUID NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_items" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "showtime_seat_id" UUID NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',

    CONSTRAINT "reservation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "showtime_id" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "total_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "showtime_seat_id" UUID NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "max_discount_minor" INTEGER,
    "minimum_spend_minor" INTEGER NOT NULL DEFAULT 0,
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_redemptions" (
    "id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_reference" VARCHAR(255),
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_reference" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhooks" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_event_id" VARCHAR(255) NOT NULL,
    "payment_id" UUID,
    "signature_valid" BOOLEAN NOT NULL,
    "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),

    CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "booking_item_id" UUID NOT NULL,
    "code" VARCHAR(128) NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "admitted_at" TIMESTAMPTZ(3),
    "validated_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "principal" VARCHAR(255) NOT NULL,
    "user_id" UUID,
    "operation" VARCHAR(100) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "request_hash" VARCHAR(128) NOT NULL,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'PROCESSING',
    "response" JSONB,
    "resource_id" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "aggregate" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(150) NOT NULL,
    "payload" JSONB NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_email_key" ON "users"("normalized_email");

-- CreateIndex
CREATE INDEX "movies_status_title_idx" ON "movies"("status", "title");

-- CreateIndex
CREATE INDEX "cinemas_status_name_idx" ON "cinemas"("status", "name");

-- CreateIndex
CREATE INDEX "cinema_rooms_cinema_id_status_idx" ON "cinema_rooms"("cinema_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cinema_rooms_cinema_id_name_key" ON "cinema_rooms"("cinema_id", "name");

-- CreateIndex
CREATE INDEX "seats_room_id_is_enabled_idx" ON "seats"("room_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "seats_room_id_row_label_seat_number_key" ON "seats"("room_id", "row_label", "seat_number");

-- CreateIndex
CREATE INDEX "showtimes_room_id_starts_at_ends_at_idx" ON "showtimes"("room_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "showtimes_starts_at_status_idx" ON "showtimes"("starts_at", "status");

-- CreateIndex
CREATE INDEX "showtime_seats_showtime_id_status_idx" ON "showtime_seats"("showtime_id", "status");

-- CreateIndex
CREATE INDEX "showtime_seats_reservation_id_idx" ON "showtime_seats"("reservation_id");

-- CreateIndex
CREATE INDEX "showtime_seats_booking_id_idx" ON "showtime_seats"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "showtime_seats_showtime_id_seat_id_key" ON "showtime_seats"("showtime_id", "seat_id");

-- CreateIndex
CREATE INDEX "reservations_status_expires_at_idx" ON "reservations"("status", "expires_at");

-- CreateIndex
CREATE INDEX "reservations_user_id_created_at_idx" ON "reservations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "reservation_items_showtime_seat_id_idx" ON "reservation_items"("showtime_seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_items_reservation_id_showtime_seat_id_key" ON "reservation_items"("reservation_id", "showtime_seat_id");

-- CreateIndex
CREATE INDEX "bookings_user_id_created_at_idx" ON "bookings"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "bookings_status_created_at_idx" ON "bookings"("status", "created_at");

-- A reservation may produce at most one booking, including under retries.
CREATE UNIQUE INDEX "bookings_reservation_id_key" ON "bookings"("reservation_id");

-- CreateIndex
CREATE INDEX "booking_items_showtime_seat_id_idx" ON "booking_items"("showtime_seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_items_booking_id_showtime_seat_id_key" ON "booking_items"("booking_id", "showtime_seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_is_active_starts_at_ends_at_idx" ON "vouchers"("is_active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "voucher_redemptions_user_id_voucher_id_idx" ON "voucher_redemptions"("user_id", "voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemptions_voucher_id_booking_id_key" ON "voucher_redemptions"("voucher_id", "booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemptions_booking_id_key" ON "voucher_redemptions"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_reference_key" ON "payments"("idempotency_reference");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_provider_provider_reference_idx" ON "payments"("provider", "provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhooks_provider_event_id_key" ON "payment_webhooks"("provider_event_id");

-- CreateIndex
CREATE INDEX "payment_webhooks_status_received_at_idx" ON "payment_webhooks"("status", "received_at");

-- CreateIndex
CREATE INDEX "payment_webhooks_payment_id_idx" ON "payment_webhooks"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_booking_item_id_key" ON "tickets"("booking_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_code_key" ON "tickets"("code");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_principal_operation_key_key" ON "idempotency_keys"("principal", "operation", "key");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_created_at_idx" ON "outbox_events"("published_at", "created_at");

-- CreateIndex
CREATE INDEX "outbox_events_aggregate_aggregate_id_idx" ON "outbox_events"("aggregate", "aggregate_id");

-- AddForeignKey
ALTER TABLE "cinema_rooms" ADD CONSTRAINT "cinema_rooms_cinema_id_fkey" FOREIGN KEY ("cinema_id") REFERENCES "cinemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "cinema_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "cinema_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_showtime_seat_id_fkey" FOREIGN KEY ("showtime_seat_id") REFERENCES "showtime_seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_showtime_seat_id_fkey" FOREIGN KEY ("showtime_seat_id") REFERENCES "showtime_seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhooks" ADD CONSTRAINT "payment_webhooks_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_item_id_fkey" FOREIGN KEY ("booking_item_id") REFERENCES "booking_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Prisma models the relations and indexes; PostgreSQL checks enforce invariants that
-- cannot be expressed in the Prisma schema itself.
ALTER TABLE "users" ADD CONSTRAINT "users_normalized_email_matches_email_check"
  CHECK ("normalized_email" = lower(btrim("email")));
ALTER TABLE "movies" ADD CONSTRAINT "movies_duration_positive_check"
  CHECK ("duration_mins" > 0);
ALTER TABLE "seats" ADD CONSTRAINT "seats_number_positive_check"
  CHECK ("seat_number" > 0);
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_end_after_start_check"
  CHECK ("ends_at" > "starts_at");
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_price_nonnegative_check"
  CHECK ("price_minor" >= 0);
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_version_nonnegative_check"
  CHECK ("version" >= 0);
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_owner_matches_status_check"
  CHECK (("status" = 'AVAILABLE' AND "reservation_id" IS NULL AND "booking_id" IS NULL)
      OR ("status" = 'HELD' AND "reservation_id" IS NOT NULL AND "booking_id" IS NULL)
      OR ("status" = 'BOOKED' AND "reservation_id" IS NULL AND "booking_id" IS NOT NULL));
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_price_nonnegative_check"
  CHECK ("price_minor" >= 0);
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_price_nonnegative_check"
  CHECK ("price_minor" >= 0);
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_total_nonnegative_check"
  CHECK ("total_minor" >= 0);
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_values_valid_check"
  CHECK ("discount_value" > 0 AND "minimum_spend_minor" >= 0
      AND ("max_discount_minor" IS NULL OR "max_discount_minor" >= 0)
      AND ("usage_limit" IS NULL OR "usage_limit" > 0)
      AND "usage_count" >= 0 AND "usage_count" <= COALESCE("usage_limit", "usage_count")
      AND "ends_at" > "starts_at"
      AND ("discount_type" <> 'PERCENTAGE' OR "discount_value" <= 100));
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_amount_nonnegative_check"
  CHECK ("amount_minor" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_nonnegative_check"
  CHECK ("amount_minor" >= 0);
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_attempts_nonnegative_check"
  CHECK ("attempts" >= 0);
