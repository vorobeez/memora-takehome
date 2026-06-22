import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { MikroORM } from '@mikro-orm/postgresql';

import { AppModule } from './../src/app.module';
import { DatabaseSeeder } from 'src/seeders/database.seeder';

const OPERATOR_A_ID = 'operator-a';
const FACILITY_A_ID = 'fac-gladsaxe-demo';

const FACILITY_B_ID = 'fac-gladsaxe-demo-b';

const createTestApp = async (): Promise<INestApplication<App>> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const orm = app.get(MikroORM);

  await orm.migrator.up();
  await orm.seeder.seed(DatabaseSeeder);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.init();

  return app;
};

describe('Facilities API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('returns Bad Request error if x-operator-id is missing', () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays`)
      .expect({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Missing x-operator-id header',
      });
  });

  it("returns Not Found error if facility doesn't belong to the current operator", () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_B_ID}/bays`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect({
        statusCode: 404,
        error: 'Not Found',
        message: `Facility ${FACILITY_B_ID} was not found`,
      });
  });

  it('returns the first page of bays for the specified facility', () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body.items).toHaveLength(50);
        expect(data.body.cursor).toEqual(expect.any(String));

        data.body.items.forEach((bay) => {
          expect(bay.operatorId).toBe(OPERATOR_A_ID);
          expect(bay.facilityId).toBe(FACILITY_A_ID);
        });
      });
  });

  it('returns the second page without repeating bays', async () => {
    const firstPage = await request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200);

    const secondPage = await request(app.getHttpServer())
      .get(
        `/v1/facilities/${FACILITY_A_ID}/bays?cursor=${encodeURIComponent(firstPage.body.cursor)}`,
      )
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200);

    expect(secondPage.body.items).toHaveLength(10);
    expect(secondPage.body.cursor).toBeNull();

    const firstPageIds = new Set(
      firstPage.body.items.map((bay: { id: string }) => bay.id),
    );

    secondPage.body.items.forEach((bay) => {
      expect(firstPageIds.has(bay.id)).toBe(false);
      expect(bay.operatorId).toBe(OPERATOR_A_ID);
      expect(bay.facilityId).toBe(FACILITY_A_ID);
    });
  });

  it('returns Bad Request for a cursor with mismatched internal parameters', async () => {
    const firstPage = await request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200);

    const decodedCursor = JSON.parse(
      Buffer.from(firstPage.body.cursor, 'base64url').toString('utf8'),
    );
    const invalidCursor = Buffer.from(
      JSON.stringify({
        ...decodedCursor,
        facilityId: FACILITY_B_ID,
      }),
      'utf8',
    ).toString('base64url');

    return request(app.getHttpServer())
      .get(
        `/v1/facilities/${FACILITY_A_ID}/bays?cursor=${encodeURIComponent(invalidCursor)}`,
      )
      .set('x-operator-id', OPERATOR_A_ID)
      .expect({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid pagination cursor',
      });
  });

  it('filters bays by status within the requested facility', () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays?status=available`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body.items).toHaveLength(27);
        expect(data.body.cursor).toBeNull();

        data.body.items.forEach((bay) => {
          expect(bay.operatorId).toBe(OPERATOR_A_ID);
          expect(bay.facilityId).toBe(FACILITY_A_ID);
          expect(bay.status).toBe('available');
        });
      });
  });

  it('returns Bad Request for an invalid status', () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays?status=invalid`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(400);
  });

  it('returns bays that intersect the requested bounding box', () => {
    const bbox = '12.47101,55.73201,12.47103,55.73203';

    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays?bbox=${bbox}`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body.items).toHaveLength(1);
        expect(data.body.cursor).toBeNull();
        expect(data.body.items[0]).toMatchObject({
          code: 'L1-A-01',
          operatorId: OPERATOR_A_ID,
          facilityId: FACILITY_A_ID,
        });
      });
  });

  it('returns an empty array for a bounding box outside the facility', () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays?bbox=0,0,1,1`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .expect({ items: [], cursor: null });
  });

  it('combines bounding box and status filters', () => {
    const bbox = '12.471001,55.732001,12.47111,55.73203';

    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays?bbox=${bbox}&status=occupied`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body.items).toHaveLength(1);
        expect(data.body.cursor).toBeNull();
        expect(data.body.items[0]).toMatchObject({
          code: 'L1-A-03',
          status: 'occupied',
          operatorId: OPERATOR_A_ID,
          facilityId: FACILITY_A_ID,
        });
      });
  });

  it.each([
    ['too few coordinates', '12,55,13'],
    ['non-numeric coordinates', 'west,55,13,56'],
    ['reversed longitude bounds', '13,55,12,56'],
    ['reversed latitude bounds', '12,56,13,55'],
    ['longitude outside WGS84', '-181,55,13,56'],
    ['latitude outside WGS84', '12,-91,13,56'],
  ])('returns Bad Request for %s in bbox', (_description, bbox) => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays?bbox=${bbox}`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});

describe('Nearby bays API (e2e)', () => {
  const lng = '12.471020015';
  const lat = '55.73202246';

  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('returns bays within the radius nearest-first', () => {
    return request(app.getHttpServer())
      .get(`/v1/bays/nearby?lng=${lng}&lat=${lat}&radius=4`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body.map((bay) => bay.code)).toEqual([
          'L1-A-01',
          'L1-A-02',
        ]);
      });
  });

  it("does not return another operator's nearby bays", () => {
    return request(app.getHttpServer())
      .get(`/v1/bays/nearby?lng=${lng}&lat=${lat}&radius=1000`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveLength(60);
        data.body.forEach((bay) => {
          expect(bay.operatorId).toBe(OPERATOR_A_ID);
        });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
