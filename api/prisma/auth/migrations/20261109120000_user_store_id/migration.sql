-- AlterTable
ALTER TABLE "users" ADD COLUMN "store_id" TEXT;

-- Existing staff belong to a store by the location name already stored on the account.
UPDATE "users" SET "store_id" = 'loc-khan' WHERE "location" = 'Khan Market Store' OR "store" = 'Khan Market';
UPDATE "users" SET "store_id" = 'loc-okhla' WHERE "location" = 'Okhla Workshop';
