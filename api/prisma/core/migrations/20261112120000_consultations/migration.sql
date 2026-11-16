CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "service" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "appointment_date" TEXT NOT NULL,
    "appointment_time" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "consent" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointments_reference_key" ON "appointments"("reference");
CREATE INDEX "appointments_appointment_date_mode_status_idx" ON "appointments"("appointment_date", "mode", "status");
-- Cancelled requests do not hold the time, so the same slot can be booked again.
CREATE UNIQUE INDEX "appointments_active_slot_key" ON "appointments"("appointment_date", "appointment_time", "mode") WHERE "status" <> 'cancelled';

CREATE TABLE "franchise_leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "franchise_leads_pkey" PRIMARY KEY ("id")
);
