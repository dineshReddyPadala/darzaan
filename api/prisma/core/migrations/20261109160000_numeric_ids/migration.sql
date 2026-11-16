-- Entity primary keys become autoincrement integers. Snapshot keys, idempotency keys, and outbox ids stay text.
CREATE OR REPLACE FUNCTION darzaan_location_id(old_id text) RETURNS int AS $$
  SELECT CASE
    WHEN old_id = 'loc-khan' THEN 1
    WHEN old_id = 'loc-okhla' THEN 2
    WHEN old_id ~ '^[1-9][0-9]*$' THEN old_id::int
    ELSE 100000 + abs(hashtext(old_id))
  END;
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_customer_id_fkey";
ALTER TABLE "garments" DROP CONSTRAINT IF EXISTS "garments_order_id_fkey";
ALTER TABLE "garment_fabric_pieces" DROP CONSTRAINT IF EXISTS "garment_fabric_pieces_garment_id_fkey";
ALTER TABLE "embroidery_versions" DROP CONSTRAINT IF EXISTS "embroidery_versions_garment_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_order_id_fkey";
ALTER TABLE "production_tasks" DROP CONSTRAINT IF EXISTS "production_tasks_order_id_fkey";
ALTER TABLE "trials" DROP CONSTRAINT IF EXISTS "trials_order_id_fkey";
ALTER TABLE "alterations" DROP CONSTRAINT IF EXISTS "alterations_order_id_fkey";
ALTER TABLE "activity_events" DROP CONSTRAINT IF EXISTS "activity_events_order_id_fkey";

ALTER TABLE "customers" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "customers" ADD COLUMN "store_id" INTEGER;
UPDATE "customers" c SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "updated_at", "id")::int AS rn FROM "customers") n
WHERE c."id" = n."id";
UPDATE "customers" c SET "store_id" = darzaan_location_id(elem->>'id')
FROM "snapshots" s, jsonb_array_elements(CASE WHEN jsonb_typeof(s."body") = 'array' THEN s."body" ELSE '[]'::jsonb END) elem
WHERE s."key" = 'locations'
  AND (lower(c."store") = lower(COALESCE(elem->>'store', '')) OR lower(c."store") = lower(COALESCE(elem->>'name', '')));
UPDATE "customers" SET "store_id" = 2 WHERE "store" ILIKE '%okhla%';
UPDATE "customers" SET "store_id" = 1 WHERE "store_id" IS NULL AND "store" ILIKE '%khan%';
UPDATE "customers" SET "document" = CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END;
UPDATE "customers" SET "document" = jsonb_set("document", '{id}', to_jsonb("new_id"));
UPDATE "customers" SET "document" = CASE WHEN "store_id" IS NULL THEN "document" - 'storeId' ELSE jsonb_set("document", '{storeId}', to_jsonb("store_id")) END;

ALTER TABLE "orders" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "orders" ADD COLUMN "new_customer_id" INTEGER;
ALTER TABLE "orders" ADD COLUMN "store_id" INTEGER;
UPDATE "orders" o SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at", "id")::int AS rn FROM "orders") n
WHERE o."id" = n."id";
UPDATE "orders" o SET "new_customer_id" = c."new_id" FROM "customers" c WHERE o."customer_id" = c."id";
UPDATE "orders" o SET "store_id" = darzaan_location_id(elem->>'id')
FROM "snapshots" s, jsonb_array_elements(CASE WHEN jsonb_typeof(s."body") = 'array' THEN s."body" ELSE '[]'::jsonb END) elem
WHERE s."key" = 'locations'
  AND (lower(o."store") = lower(COALESCE(elem->>'store', '')) OR lower(o."store") = lower(COALESCE(elem->>'name', '')));
UPDATE "orders" SET "store_id" = 2 WHERE "store" ILIKE '%okhla%';
UPDATE "orders" SET "store_id" = 1 WHERE "store_id" IS NULL AND "store" ILIKE '%khan%';

INSERT INTO "customers" ("id", "name", "mobile", "email", "city", "tier", "designer", "store", "store_id", "document", "new_id")
SELECT 'migrated-unknown', 'Unknown', '', '', '', 'New', '', 'Khan Market', 1,
  jsonb_build_object('id', COALESCE((SELECT MAX("new_id") FROM "customers"), 0) + 1, 'name', 'Unknown', 'mobile', '', 'storeId', 1),
  COALESCE((SELECT MAX("new_id") FROM "customers"), 0) + 1
WHERE EXISTS (SELECT 1 FROM "orders" WHERE "new_customer_id" IS NULL)
  AND NOT EXISTS (SELECT 1 FROM "customers" WHERE "id" = 'migrated-unknown');
UPDATE "orders" SET "new_customer_id" = (SELECT "new_id" FROM "customers" WHERE "id" = 'migrated-unknown')
WHERE "new_customer_id" IS NULL AND EXISTS (SELECT 1 FROM "customers" WHERE "id" = 'migrated-unknown');

ALTER TABLE "garments" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "garments" ADD COLUMN "new_order_id" INTEGER;
UPDATE "garments" g SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "garments") n
WHERE g."id" = n."id";
UPDATE "garments" g SET "new_order_id" = o."new_id" FROM "orders" o WHERE g."order_id" = o."id";

ALTER TABLE "garment_fabric_pieces" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "garment_fabric_pieces" ADD COLUMN "new_garment_id" INTEGER;
UPDATE "garment_fabric_pieces" p SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "garment_fabric_pieces") n
WHERE p."id" = n."id";
UPDATE "garment_fabric_pieces" p SET "new_garment_id" = g."new_id" FROM "garments" g WHERE p."garment_id" = g."id";

ALTER TABLE "embroidery_versions" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "embroidery_versions" ADD COLUMN "new_garment_id" INTEGER;
UPDATE "embroidery_versions" e SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "embroidery_versions") n
WHERE e."id" = n."id";
UPDATE "embroidery_versions" e SET "new_garment_id" = g."new_id" FROM "garments" g WHERE e."garment_id" = g."id";

ALTER TABLE "payments" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "payments" ADD COLUMN "new_order_id" INTEGER;
UPDATE "payments" p SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "payments") n
WHERE p."id" = n."id";
UPDATE "payments" p SET "new_order_id" = o."new_id" FROM "orders" o WHERE p."order_id" = o."id";

ALTER TABLE "production_tasks" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "production_tasks" ADD COLUMN "new_order_id" INTEGER;
ALTER TABLE "production_tasks" ADD COLUMN "new_garment_id" INTEGER;
UPDATE "production_tasks" t SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "production_tasks") n
WHERE t."id" = n."id";
UPDATE "production_tasks" t SET "new_order_id" = o."new_id" FROM "orders" o WHERE t."order_id" = o."id";
UPDATE "production_tasks" t SET "new_garment_id" = g."new_id"
FROM "garments" g
WHERE t."new_garment_id" IS NULL AND g."order_id" = t."order_id" AND g."id" = t."order_id" || ':' || t."garment_id";
UPDATE "production_tasks" t SET "new_garment_id" = g."new_id"
FROM (SELECT DISTINCT ON ("order_id", "document"->>'id') "order_id", "document"->>'id' AS local_id, "new_id" FROM "garments") g
WHERE t."new_garment_id" IS NULL AND g."order_id" = t."order_id" AND g.local_id = t."garment_id";

ALTER TABLE "price_requests" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "price_requests" ADD COLUMN "new_order_id" INTEGER;
ALTER TABLE "price_requests" ADD COLUMN "new_garment_id" INTEGER;
UPDATE "price_requests" p SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "updated_at", "id")::int AS rn FROM "price_requests") n
WHERE p."id" = n."id";
UPDATE "price_requests" p SET "new_order_id" = o."new_id" FROM "orders" o WHERE p."order_id" = o."id";
UPDATE "price_requests" p SET "new_garment_id" = g."new_id"
FROM "garments" g
WHERE p."new_garment_id" IS NULL AND p."order_id" IS NOT NULL AND g."order_id" = p."order_id" AND g."id" = p."order_id" || ':' || COALESCE(p."garment_id", '');
UPDATE "price_requests" p SET "new_garment_id" = g."new_id"
FROM (SELECT DISTINCT ON ("order_id", "document"->>'id') "order_id", "document"->>'id' AS local_id, "new_id" FROM "garments") g
WHERE p."new_garment_id" IS NULL AND g."order_id" = p."order_id" AND g.local_id = p."garment_id";

ALTER TABLE "qc_inspections" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "qc_inspections" ADD COLUMN "new_order_id" INTEGER;
ALTER TABLE "qc_inspections" ADD COLUMN "new_garment_id" INTEGER;
UPDATE "qc_inspections" q SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "at", "id")::int AS rn FROM "qc_inspections") n
WHERE q."id" = n."id";
UPDATE "qc_inspections" q SET "new_order_id" = o."new_id" FROM "orders" o WHERE q."order_id" = o."id";
UPDATE "qc_inspections" q SET "new_garment_id" = g."new_id"
FROM "garments" g
WHERE q."new_garment_id" IS NULL AND g."order_id" = q."order_id" AND g."id" = q."order_id" || ':' || q."garment_id";
UPDATE "qc_inspections" q SET "new_garment_id" = g."new_id"
FROM (SELECT DISTINCT ON ("order_id", "document"->>'id') "order_id", "document"->>'id' AS local_id, "new_id" FROM "garments") g
WHERE q."new_garment_id" IS NULL AND g."order_id" = q."order_id" AND g.local_id = q."garment_id";

ALTER TABLE "qc_reworks" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "qc_reworks" ADD COLUMN "new_order_id" INTEGER;
ALTER TABLE "qc_reworks" ADD COLUMN "new_garment_id" INTEGER;
UPDATE "qc_reworks" q SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "qc_reworks") n
WHERE q."id" = n."id";
UPDATE "qc_reworks" q SET "new_order_id" = o."new_id" FROM "orders" o WHERE q."order_id" = o."id";
UPDATE "qc_reworks" q SET "new_garment_id" = g."new_id"
FROM "garments" g
WHERE q."new_garment_id" IS NULL AND g."order_id" = q."order_id" AND g."id" = q."order_id" || ':' || q."garment_id";
UPDATE "qc_reworks" q SET "new_garment_id" = g."new_id"
FROM (SELECT DISTINCT ON ("order_id", "document"->>'id') "order_id", "document"->>'id' AS local_id, "new_id" FROM "garments") g
WHERE q."new_garment_id" IS NULL AND g."order_id" = q."order_id" AND g.local_id = q."garment_id";

ALTER TABLE "trials" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "trials" ADD COLUMN "new_order_id" INTEGER;
UPDATE "trials" t SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "trials") n
WHERE t."id" = n."id";
UPDATE "trials" t SET "new_order_id" = o."new_id" FROM "orders" o WHERE t."order_id" = o."id";

ALTER TABLE "alterations" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "alterations" ADD COLUMN "new_order_id" INTEGER;
UPDATE "alterations" a SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "alterations") n
WHERE a."id" = n."id";
UPDATE "alterations" a SET "new_order_id" = o."new_id" FROM "orders" o WHERE a."order_id" = o."id";

ALTER TABLE "activity_events" ADD COLUMN "new_id" INTEGER;
ALTER TABLE "activity_events" ADD COLUMN "new_order_id" INTEGER;
UPDATE "activity_events" a SET "new_id" = n.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "id")::int AS rn FROM "activity_events") n
WHERE a."id" = n."id";
UPDATE "activity_events" a SET "new_order_id" = o."new_id" FROM "orders" o WHERE a."order_id" = o."id";

CREATE TEMP TABLE id_map (
  kind text NOT NULL,
  old_id text NOT NULL,
  new_id int NOT NULL,
  PRIMARY KEY (kind, old_id)
);
INSERT INTO id_map SELECT 'garment', "id", "new_id" FROM "garments" WHERE "new_id" IS NOT NULL;
INSERT INTO id_map SELECT 'piece', "id", "new_id" FROM "garment_fabric_pieces" WHERE "new_id" IS NOT NULL;
INSERT INTO id_map SELECT 'sketch', "id", "new_id" FROM "embroidery_versions" WHERE "new_id" IS NOT NULL;
INSERT INTO id_map SELECT 'payment', "id", "new_id" FROM "payments" WHERE "new_id" IS NOT NULL;
INSERT INTO id_map SELECT 'task', "id", "new_id" FROM "production_tasks" WHERE "new_id" IS NOT NULL;
INSERT INTO id_map SELECT 'alteration', "id", "new_id" FROM "alterations" WHERE "new_id" IS NOT NULL;
INSERT INTO id_map SELECT 'activity', "id", "new_id" FROM "activity_events" WHERE "new_id" IS NOT NULL;
INSERT INTO id_map SELECT 'trial', "id", "new_id" FROM "trials" WHERE "new_id" IS NOT NULL;

CREATE OR REPLACE FUNCTION darzaan_remap(items jsonb, p_kind text, parent_old text) RETURNS jsonb AS $$
DECLARE
  item jsonb;
  result jsonb := '[]'::jsonb;
  nid int;
BEGIN
  IF items IS NULL OR jsonb_typeof(items) <> 'array' THEN
    RETURN COALESCE(items, '[]'::jsonb);
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(items) LOOP
    SELECT m.new_id INTO nid FROM id_map m WHERE m.kind = p_kind AND m.old_id = parent_old || ':' || COALESCE(item->>'id', '');
    IF nid IS NOT NULL THEN
      item := jsonb_set(item, '{id}', to_jsonb(nid));
    END IF;
    result := result || jsonb_build_array(item);
  END LOOP;
  RETURN result;
END $$ LANGUAGE plpgsql;

DO $$
DECLARE
  rec record;
  garment jsonb;
  next_garments jsonb;
  old_garment text;
  garment_nid int;
  doc jsonb;
BEGIN
  FOR rec IN SELECT "id", "new_id", "new_customer_id", "store_id", "document" FROM "orders" LOOP
    doc := CASE WHEN jsonb_typeof(rec.document) = 'object' THEN rec.document ELSE '{}'::jsonb END;
    doc := jsonb_set(doc, '{id}', to_jsonb(rec.new_id));
    doc := jsonb_set(doc, '{customerId}', to_jsonb(rec.new_customer_id));
    IF rec.store_id IS NULL THEN
      doc := doc - 'storeId';
    ELSE
      doc := jsonb_set(doc, '{storeId}', to_jsonb(rec.store_id));
    END IF;
    next_garments := '[]'::jsonb;
    FOR garment IN SELECT value FROM jsonb_array_elements(COALESCE(doc->'garments', '[]'::jsonb)) LOOP
      garment_nid := NULL;
      old_garment := rec.id || ':' || COALESCE(garment->>'id', '');
      SELECT m.new_id INTO garment_nid FROM id_map m WHERE m.kind = 'garment' AND m.old_id = old_garment;
      IF garment_nid IS NULL THEN
        SELECT g.new_id INTO garment_nid FROM garments g
        WHERE g.order_id = rec.id AND g.document->>'id' = garment->>'id'
        LIMIT 1;
        IF garment_nid IS NOT NULL THEN
          SELECT g.id INTO old_garment FROM garments g WHERE g.order_id = rec.id AND g.new_id = garment_nid LIMIT 1;
        END IF;
      END IF;
      IF garment_nid IS NOT NULL THEN
        garment := jsonb_set(garment, '{id}', to_jsonb(garment_nid));
        IF garment ? 'fabric' AND jsonb_typeof(garment->'fabric') = 'object' THEN
          garment := jsonb_set(garment, '{fabric,pieces}', darzaan_remap(garment#>'{fabric,pieces}', 'piece', old_garment));
        END IF;
        IF garment ? 'embroidery' AND jsonb_typeof(garment->'embroidery') = 'object' THEN
          garment := jsonb_set(garment, '{embroidery,versions}', darzaan_remap(garment#>'{embroidery,versions}', 'sketch', old_garment));
        END IF;
      END IF;
      next_garments := next_garments || jsonb_build_array(garment);
    END LOOP;
    doc := jsonb_set(doc, '{garments}', next_garments);
    doc := jsonb_set(doc, '{payments}', darzaan_remap(doc->'payments', 'payment', rec.id));
    doc := jsonb_set(doc, '{alterations}', darzaan_remap(doc->'alterations', 'alteration', rec.id));
    doc := jsonb_set(doc, '{activity}', darzaan_remap(doc->'activity', 'activity', rec.id));
    doc := jsonb_set(doc, '{tasks}', darzaan_remap(COALESCE(doc->'tasks', '[]'::jsonb), 'task', rec.id));
    garment_nid := NULL;
    IF doc ? 'trial' AND jsonb_typeof(doc->'trial') = 'object' THEN
      SELECT m.new_id INTO garment_nid FROM id_map m WHERE m.kind = 'trial' AND m.old_id = rec.id || ':trial';
      IF garment_nid IS NOT NULL THEN
        doc := jsonb_set(doc, '{trial,id}', to_jsonb(garment_nid));
      END IF;
    END IF;
    UPDATE "orders" SET "document" = doc WHERE "id" = rec.id;
  END LOOP;
END $$;

UPDATE "garments" SET "document" = jsonb_set(CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END, '{id}', to_jsonb("new_id"))
WHERE "new_id" IS NOT NULL;
UPDATE "production_tasks" SET "document" = jsonb_set(CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END, '{id}', to_jsonb("new_id"))
WHERE "new_id" IS NOT NULL;
UPDATE "alterations" SET "document" = jsonb_set(CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END, '{id}', to_jsonb("new_id"))
WHERE "new_id" IS NOT NULL;
UPDATE "trials" SET "document" = jsonb_set(CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END, '{id}', to_jsonb("new_id"))
WHERE "new_id" IS NOT NULL;
UPDATE "qc_inspections" SET "document" = jsonb_set(CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END, '{id}', to_jsonb("new_id"))
WHERE "new_id" IS NOT NULL;
UPDATE "qc_reworks" SET "document" = jsonb_set(CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END, '{id}', to_jsonb("new_id"))
WHERE "new_id" IS NOT NULL;
UPDATE "price_requests" SET "document" = jsonb_set(CASE WHEN jsonb_typeof("document") = 'object' THEN "document" ELSE '{}'::jsonb END, '{id}', to_jsonb("new_id"))
WHERE "new_id" IS NOT NULL;

DELETE FROM "garment_fabric_pieces" WHERE "new_garment_id" IS NULL;
DELETE FROM "embroidery_versions" WHERE "new_garment_id" IS NULL;
DELETE FROM "garments" WHERE "new_order_id" IS NULL;
DELETE FROM "payments" WHERE "new_order_id" IS NULL;
DELETE FROM "production_tasks" WHERE "new_order_id" IS NULL;
DELETE FROM "trials" WHERE "new_order_id" IS NULL;
DELETE FROM "alterations" WHERE "new_order_id" IS NULL;
DELETE FROM "activity_events" WHERE "new_order_id" IS NULL;

ALTER TABLE "customers" DROP CONSTRAINT "customers_pkey";
ALTER TABLE "customers" DROP COLUMN "id";
ALTER TABLE "customers" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "customers" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "customers" ADD PRIMARY KEY ("id");
ALTER TABLE "customers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('customers', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "customers"), 1), 1), (SELECT COUNT(*) FROM "customers") > 0);
CREATE INDEX "customers_store_id_idx" ON "customers"("store_id");

ALTER TABLE "orders" DROP CONSTRAINT "orders_pkey";
DROP INDEX IF EXISTS "orders_customer_id_idx";
ALTER TABLE "orders" DROP COLUMN "id";
ALTER TABLE "orders" DROP COLUMN "customer_id";
ALTER TABLE "orders" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "orders" RENAME COLUMN "new_customer_id" TO "customer_id";
ALTER TABLE "orders" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "customer_id" SET NOT NULL;
ALTER TABLE "orders" ADD PRIMARY KEY ("id");
ALTER TABLE "orders" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('orders', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "orders"), 1), 1), (SELECT COUNT(*) FROM "orders") > 0);
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");
CREATE INDEX "orders_store_id_idx" ON "orders"("store_id");

ALTER TABLE "garments" DROP CONSTRAINT "garments_pkey";
DROP INDEX IF EXISTS "garments_order_id_idx";
ALTER TABLE "garments" DROP COLUMN "id";
ALTER TABLE "garments" DROP COLUMN "order_id";
ALTER TABLE "garments" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "garments" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "garments" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "garments" ALTER COLUMN "order_id" SET NOT NULL;
ALTER TABLE "garments" ADD PRIMARY KEY ("id");
ALTER TABLE "garments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('garments', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "garments"), 1), 1), (SELECT COUNT(*) FROM "garments") > 0);
CREATE INDEX "garments_order_id_idx" ON "garments"("order_id");

ALTER TABLE "garment_fabric_pieces" DROP CONSTRAINT "garment_fabric_pieces_pkey";
DROP INDEX IF EXISTS "garment_fabric_pieces_garment_id_idx";
ALTER TABLE "garment_fabric_pieces" DROP COLUMN "id";
ALTER TABLE "garment_fabric_pieces" DROP COLUMN "garment_id";
ALTER TABLE "garment_fabric_pieces" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "garment_fabric_pieces" RENAME COLUMN "new_garment_id" TO "garment_id";
ALTER TABLE "garment_fabric_pieces" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "garment_fabric_pieces" ALTER COLUMN "garment_id" SET NOT NULL;
ALTER TABLE "garment_fabric_pieces" ADD PRIMARY KEY ("id");
ALTER TABLE "garment_fabric_pieces" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('garment_fabric_pieces', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "garment_fabric_pieces"), 1), 1), (SELECT COUNT(*) FROM "garment_fabric_pieces") > 0);
CREATE INDEX "garment_fabric_pieces_garment_id_idx" ON "garment_fabric_pieces"("garment_id");

ALTER TABLE "embroidery_versions" DROP CONSTRAINT "embroidery_versions_pkey";
DROP INDEX IF EXISTS "embroidery_versions_garment_id_idx";
ALTER TABLE "embroidery_versions" DROP COLUMN "id";
ALTER TABLE "embroidery_versions" DROP COLUMN "garment_id";
ALTER TABLE "embroidery_versions" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "embroidery_versions" RENAME COLUMN "new_garment_id" TO "garment_id";
ALTER TABLE "embroidery_versions" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "embroidery_versions" ALTER COLUMN "garment_id" SET NOT NULL;
ALTER TABLE "embroidery_versions" ADD PRIMARY KEY ("id");
ALTER TABLE "embroidery_versions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('embroidery_versions', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "embroidery_versions"), 1), 1), (SELECT COUNT(*) FROM "embroidery_versions") > 0);
CREATE INDEX "embroidery_versions_garment_id_idx" ON "embroidery_versions"("garment_id");

ALTER TABLE "payments" DROP CONSTRAINT "payments_pkey";
DROP INDEX IF EXISTS "payments_order_id_at_idx";
ALTER TABLE "payments" DROP COLUMN "id";
ALTER TABLE "payments" DROP COLUMN "order_id";
ALTER TABLE "payments" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "payments" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "payments" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "order_id" SET NOT NULL;
ALTER TABLE "payments" ADD PRIMARY KEY ("id");
ALTER TABLE "payments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('payments', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "payments"), 1), 1), (SELECT COUNT(*) FROM "payments") > 0);
CREATE INDEX "payments_order_id_at_idx" ON "payments"("order_id", "at");

ALTER TABLE "production_tasks" DROP CONSTRAINT "production_tasks_pkey";
DROP INDEX IF EXISTS "production_tasks_order_id_idx";
ALTER TABLE "production_tasks" DROP COLUMN "id";
ALTER TABLE "production_tasks" DROP COLUMN "order_id";
ALTER TABLE "production_tasks" DROP COLUMN "garment_id";
ALTER TABLE "production_tasks" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "production_tasks" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "production_tasks" RENAME COLUMN "new_garment_id" TO "garment_id";
ALTER TABLE "production_tasks" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "production_tasks" ALTER COLUMN "order_id" SET NOT NULL;
ALTER TABLE "production_tasks" ADD PRIMARY KEY ("id");
ALTER TABLE "production_tasks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('production_tasks', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "production_tasks"), 1), 1), (SELECT COUNT(*) FROM "production_tasks") > 0);
CREATE INDEX "production_tasks_order_id_idx" ON "production_tasks"("order_id");

ALTER TABLE "price_requests" DROP CONSTRAINT "price_requests_pkey";
ALTER TABLE "price_requests" DROP COLUMN "id";
ALTER TABLE "price_requests" DROP COLUMN "order_id";
ALTER TABLE "price_requests" DROP COLUMN "garment_id";
ALTER TABLE "price_requests" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "price_requests" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "price_requests" RENAME COLUMN "new_garment_id" TO "garment_id";
ALTER TABLE "price_requests" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "price_requests" ADD PRIMARY KEY ("id");
ALTER TABLE "price_requests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('price_requests', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "price_requests"), 1), 1), (SELECT COUNT(*) FROM "price_requests") > 0);

ALTER TABLE "qc_inspections" DROP CONSTRAINT "qc_inspections_pkey";
DROP INDEX IF EXISTS "qc_inspections_order_id_garment_id_idx";
ALTER TABLE "qc_inspections" DROP COLUMN "id";
ALTER TABLE "qc_inspections" DROP COLUMN "order_id";
ALTER TABLE "qc_inspections" DROP COLUMN "garment_id";
ALTER TABLE "qc_inspections" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "qc_inspections" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "qc_inspections" RENAME COLUMN "new_garment_id" TO "garment_id";
ALTER TABLE "qc_inspections" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "qc_inspections" ADD PRIMARY KEY ("id");
ALTER TABLE "qc_inspections" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('qc_inspections', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "qc_inspections"), 1), 1), (SELECT COUNT(*) FROM "qc_inspections") > 0);
CREATE INDEX "qc_inspections_order_id_garment_id_idx" ON "qc_inspections"("order_id", "garment_id");

ALTER TABLE "qc_reworks" DROP CONSTRAINT "qc_reworks_pkey";
ALTER TABLE "qc_reworks" DROP COLUMN "id";
ALTER TABLE "qc_reworks" DROP COLUMN "order_id";
ALTER TABLE "qc_reworks" DROP COLUMN "garment_id";
ALTER TABLE "qc_reworks" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "qc_reworks" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "qc_reworks" RENAME COLUMN "new_garment_id" TO "garment_id";
ALTER TABLE "qc_reworks" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "qc_reworks" ADD PRIMARY KEY ("id");
ALTER TABLE "qc_reworks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('qc_reworks', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "qc_reworks"), 1), 1), (SELECT COUNT(*) FROM "qc_reworks") > 0);

ALTER TABLE "trials" DROP CONSTRAINT "trials_pkey";
DROP INDEX IF EXISTS "trials_order_id_idx";
ALTER TABLE "trials" DROP COLUMN "id";
ALTER TABLE "trials" DROP COLUMN "order_id";
ALTER TABLE "trials" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "trials" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "trials" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "trials" ALTER COLUMN "order_id" SET NOT NULL;
ALTER TABLE "trials" ADD PRIMARY KEY ("id");
ALTER TABLE "trials" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('trials', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "trials"), 1), 1), (SELECT COUNT(*) FROM "trials") > 0);
CREATE INDEX "trials_order_id_idx" ON "trials"("order_id");

ALTER TABLE "alterations" DROP CONSTRAINT "alterations_pkey";
DROP INDEX IF EXISTS "alterations_order_id_idx";
ALTER TABLE "alterations" DROP COLUMN "id";
ALTER TABLE "alterations" DROP COLUMN "order_id";
ALTER TABLE "alterations" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "alterations" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "alterations" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "alterations" ALTER COLUMN "order_id" SET NOT NULL;
ALTER TABLE "alterations" ADD PRIMARY KEY ("id");
ALTER TABLE "alterations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('alterations', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "alterations"), 1), 1), (SELECT COUNT(*) FROM "alterations") > 0);
CREATE INDEX "alterations_order_id_idx" ON "alterations"("order_id");

ALTER TABLE "activity_events" DROP CONSTRAINT "activity_events_pkey";
DROP INDEX IF EXISTS "activity_events_order_id_at_idx";
ALTER TABLE "activity_events" DROP COLUMN "id";
ALTER TABLE "activity_events" DROP COLUMN "order_id";
ALTER TABLE "activity_events" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "activity_events" RENAME COLUMN "new_order_id" TO "order_id";
ALTER TABLE "activity_events" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "activity_events" ALTER COLUMN "order_id" SET NOT NULL;
ALTER TABLE "activity_events" ADD PRIMARY KEY ("id");
ALTER TABLE "activity_events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY;
SELECT setval(pg_get_serial_sequence('activity_events', 'id'), GREATEST(COALESCE((SELECT MAX("id") FROM "activity_events"), 1), 1), (SELECT COUNT(*) FROM "activity_events") > 0);
CREATE INDEX "activity_events_order_id_at_idx" ON "activity_events"("order_id", "at");

ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "garments" ADD CONSTRAINT "garments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "garment_fabric_pieces" ADD CONSTRAINT "garment_fabric_pieces_garment_id_fkey" FOREIGN KEY ("garment_id") REFERENCES "garments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "embroidery_versions" ADD CONSTRAINT "embroidery_versions_garment_id_fkey" FOREIGN KEY ("garment_id") REFERENCES "garments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trials" ADD CONSTRAINT "trials_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alterations" ADD CONSTRAINT "alterations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "snapshots" SET "body" = (
  SELECT COALESCE(jsonb_agg(jsonb_set(elem, '{id}', to_jsonb(darzaan_location_id(elem->>'id')))), '[]'::jsonb)
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof("body") = 'array' THEN "body" ELSE '[]'::jsonb END) elem
) WHERE "key" = 'locations';

UPDATE "snapshots" SET "body" = (
  SELECT COALESCE(jsonb_object_agg(darzaan_location_id(entry.key)::text, entry.value), '{}'::jsonb)
  FROM jsonb_each(CASE WHEN jsonb_typeof("body") = 'object' THEN "body" ELSE '{}'::jsonb END) entry
) WHERE "key" = 'storeSettings';

UPDATE "snapshots" SET "body" = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN jsonb_typeof(elem) = 'object' AND jsonb_typeof(elem->'storeId') = 'string' AND btrim(elem->>'storeId') <> ''
        THEN jsonb_set(elem, '{storeId}', to_jsonb(darzaan_location_id(elem->>'storeId')))
      ELSE elem
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements("body") elem
) WHERE "key" = 'team' AND jsonb_typeof("body") = 'array';

DROP FUNCTION darzaan_remap(jsonb, text, text);
DROP FUNCTION darzaan_location_id(text);
