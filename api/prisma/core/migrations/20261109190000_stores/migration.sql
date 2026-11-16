-- Stores and workshops leave the locations snapshot. Existing rows are copied once; nothing is inserted when that snapshot is empty.
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'store',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

INSERT INTO "stores" ("id", "name", "kind", "address", "phone", "code", "active")
SELECT DISTINCT ON (store_id)
    store_id,
    store_name,
    store_kind,
    store_address,
    store_phone,
    store_code,
    store_active
FROM (
    SELECT
        (item->>'id')::int AS store_id,
        btrim(COALESCE(item->>'name', '')) AS store_name,
        CASE WHEN item->>'kind' = 'workshop' THEN 'workshop' ELSE 'store' END AS store_kind,
        COALESCE(item->>'address', '') AS store_address,
        COALESCE(item->>'phone', '') AS store_phone,
        NULLIF(btrim(COALESCE(item->>'store', '')), '') AS store_code,
        COALESCE((item->>'active')::boolean, true) AS store_active
    FROM "snapshots" AS snapshot,
    LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(snapshot."body"::jsonb) = 'array' THEN snapshot."body"::jsonb ELSE '[]'::jsonb END
    ) AS item
    WHERE snapshot."key" = 'locations'
      AND (item->>'id') ~ '^[1-9][0-9]*$'
      AND btrim(COALESCE(item->>'name', '')) <> ''
) AS copied
ORDER BY store_id;

SELECT setval(
    pg_get_serial_sequence('stores', 'id'),
    GREATEST(COALESCE((SELECT MAX("id") FROM "stores"), 1), 1),
    (SELECT COUNT(*) FROM "stores") > 0
);

DELETE FROM "snapshots" WHERE "key" = 'locations';
