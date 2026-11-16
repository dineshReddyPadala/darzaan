ALTER TABLE "notifications" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");
