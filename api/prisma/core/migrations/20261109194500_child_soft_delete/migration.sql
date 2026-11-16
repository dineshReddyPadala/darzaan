ALTER TABLE "garments" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "garment_fabric_pieces" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "embroidery_versions" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "production_tasks" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "trials" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "alterations" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "activity_events" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "garments_deleted_at_idx" ON "garments"("deleted_at");
CREATE INDEX "garment_fabric_pieces_deleted_at_idx" ON "garment_fabric_pieces"("deleted_at");
CREATE INDEX "embroidery_versions_deleted_at_idx" ON "embroidery_versions"("deleted_at");
CREATE INDEX "payments_deleted_at_idx" ON "payments"("deleted_at");
CREATE INDEX "production_tasks_deleted_at_idx" ON "production_tasks"("deleted_at");
CREATE INDEX "trials_deleted_at_idx" ON "trials"("deleted_at");
CREATE INDEX "alterations_deleted_at_idx" ON "alterations"("deleted_at");
CREATE INDEX "activity_events_deleted_at_idx" ON "activity_events"("deleted_at");
