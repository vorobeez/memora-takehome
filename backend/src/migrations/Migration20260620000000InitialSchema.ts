import { Migration } from '@mikro-orm/migrations';

export class Migration20260620000000InitialSchema extends Migration {
  override up(): void {
    this.addSql('CREATE EXTENSION IF NOT EXISTS postgis;');

    this.addSql(`
      CREATE TABLE "operator" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.addSql(`
      CREATE TABLE "facility" (
        "id" TEXT PRIMARY KEY,
        "operator_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "geom" GEOMETRY(POLYGON, 4326) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "facility_operator_id_foreign"
          FOREIGN KEY ("operator_id") REFERENCES "operator" ("id") ON DELETE CASCADE,
        CONSTRAINT "facility_id_operator_id_unique" UNIQUE ("id", "operator_id")
      );
    `);

    this.addSql(
      'CREATE INDEX "facility_operator_id_index" ON "facility" ("operator_id");',
    );
    this.addSql(
      'CREATE INDEX "facility_geom_gist_index" ON "facility" USING GIST ("geom");',
    );

    this.addSql(`
      CREATE TABLE "bay" (
        "id" TEXT PRIMARY KEY,
        "operator_id" TEXT NOT NULL,
        "facility_id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "geom" GEOMETRY(POLYGON, 4326) NOT NULL,
        "point" GEOMETRY(POINT, 4326)
          GENERATED ALWAYS AS (ST_CENTROID("geom")) STORED,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bay_status_check"
          CHECK ("status" IN ('available', 'reserved', 'occupied')),
        CONSTRAINT "bay_facility_operator_foreign"
          FOREIGN KEY ("facility_id", "operator_id")
          REFERENCES "facility" ("id", "operator_id") ON DELETE CASCADE,
        CONSTRAINT "bay_operator_code_unique" UNIQUE ("operator_id", "code")
      );
    `);

    this.addSql(
      'CREATE INDEX "bay_operator_facility_id_index" ON "bay" ("operator_id", "facility_id");',
    );
    this.addSql(
      'CREATE INDEX "bay_operator_facility_status_index" ON "bay" ("operator_id", "facility_id", "status");',
    );
    this.addSql(
      'CREATE INDEX "bay_geom_gist_index" ON "bay" USING GIST ("geom");',
    );
    this.addSql(
      'CREATE INDEX "bay_point_gist_index" ON "bay" USING GIST ("point");',
    );
  }

  override down(): void {
    this.addSql('DROP TABLE IF EXISTS "bay" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "facility" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "operator" CASCADE;');
  }
}
