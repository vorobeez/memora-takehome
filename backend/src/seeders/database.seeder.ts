import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';

type PolygonGeometry = {
  type: 'Polygon';
  coordinates: number[][][];
};

type FacilitySeed = {
  id: string;
  name: string;
  geometry: PolygonGeometry;
};

type BayFeature = {
  properties: {
    code: string;
    status: 'available' | 'reserved' | 'occupied';
  };
  geometry: PolygonGeometry;
};

type BayFeatureCollection = {
  features: BayFeature[];
};

const OPERATOR_A_ID = 'operator-a';
const OPERATOR_A_NAME = 'Parking A';

const OPERATOR_B_ID = 'operator-b';
const OPERATOR_B_NAME = 'Parking B';
const OPERATOR_B_FACILITY_ID = 'fac-gladsaxe-demo-b';
const OPERATOR_B_BAY_COUNT = 10;
const OPERATOR_B_LONGITUDE_OFFSET = 0.01;

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const facilitySeed = await this.readSeedFile<FacilitySeed>('facility.json');
    const bayCollection =
      await this.readSeedFile<BayFeatureCollection>('bays.geojson');

    await em.transactional(async (transactionalEm) => {
      // A

      await this.upsertOperator(
        transactionalEm,
        OPERATOR_A_ID,
        OPERATOR_A_NAME,
      );

      await this.upsertFacility(
        transactionalEm,
        facilitySeed.id,
        OPERATOR_A_ID,
        facilitySeed.name,
        facilitySeed.geometry,
      );

      for (const [index, bay] of bayCollection.features.entries()) {
        await this.upsertBay(
          transactionalEm,
          `bay-a-${index + 1}`,
          OPERATOR_A_ID,
          facilitySeed.id,
          bay,
        );
      }

      // B

      await this.upsertOperator(
        transactionalEm,
        OPERATOR_B_ID,
        OPERATOR_B_NAME,
      );

      await this.upsertFacility(
        transactionalEm,
        OPERATOR_B_FACILITY_ID,
        OPERATOR_B_ID,
        `${facilitySeed.name} B`,
        facilitySeed.geometry,
        OPERATOR_B_LONGITUDE_OFFSET,
      );

      for (const [index, bay] of bayCollection.features
        .slice(0, OPERATOR_B_BAY_COUNT)
        .entries()) {
        await this.upsertBay(
          transactionalEm,
          `bay-b-${index + 1}`,
          OPERATOR_B_ID,
          OPERATOR_B_FACILITY_ID,
          bay,
          OPERATOR_B_LONGITUDE_OFFSET,
        );
      }
    });
  }

  private async readSeedFile<T>(fileName: string): Promise<T> {
    const filePath = resolve(process.cwd(), '..', 'seed', fileName);
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  }

  private async upsertOperator(
    em: EntityManager,
    id: string,
    name: string,
  ): Promise<void> {
    await em.execute(
      `
        INSERT INTO "operator" ("id", "name")
        VALUES (?, ?)
        ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name"
      `,
      [id, name],
      'run',
    );
  }

  private async upsertFacility(
    em: EntityManager,
    id: string,
    operatorId: string,
    name: string,
    geometry: PolygonGeometry,
    longitudeOffset = 0,
  ): Promise<void> {
    await em.execute(
      `
        INSERT INTO "facility" ("id", "operator_id", "name", "geom")
        VALUES (
          ?,
          ?,
          ?,
          ST_Translate(ST_SetSRID(ST_GeomFromGeoJSON(?), 4326), ?, 0)
        )
        ON CONFLICT ("id") DO UPDATE SET
          "operator_id" = EXCLUDED."operator_id",
          "name" = EXCLUDED."name",
          "geom" = EXCLUDED."geom"
      `,
      [id, operatorId, name, JSON.stringify(geometry), longitudeOffset],
      'run',
    );
  }

  private async upsertBay(
    em: EntityManager,
    id: string,
    operatorId: string,
    facilityId: string,
    bay: BayFeature,
    longitudeOffset = 0,
  ): Promise<void> {
    await em.execute(
      `
        INSERT INTO "bay" (
          "id",
          "operator_id",
          "facility_id",
          "code",
          "status",
          "geom"
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ST_Translate(ST_SetSRID(ST_GeomFromGeoJSON(?), 4326), ?, 0)
        )
        ON CONFLICT ("id") DO UPDATE SET
          "operator_id" = EXCLUDED."operator_id",
          "facility_id" = EXCLUDED."facility_id",
          "code" = EXCLUDED."code",
          "status" = EXCLUDED."status",
          "geom" = EXCLUDED."geom",
          "updated_at" = CURRENT_TIMESTAMP
      `,
      [
        id,
        operatorId,
        facilityId,
        bay.properties.code,
        bay.properties.status,
        JSON.stringify(bay.geometry),
        longitudeOffset,
      ],
      'run',
    );
  }
}
