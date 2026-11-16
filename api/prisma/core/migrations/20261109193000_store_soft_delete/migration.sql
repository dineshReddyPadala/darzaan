ALTER TABLE "stores" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "stores_deleted_at_idx" ON "stores"("deleted_at");
