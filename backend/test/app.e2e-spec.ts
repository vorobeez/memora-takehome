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

describe('Facilities API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const orm = app.get(MikroORM);

    await orm.migrator.up();
    await orm.seeder.seed(DatabaseSeeder);

    app.enableVersioning({
      type: VersioningType.URI,
    });

    await app.init();
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

  it('returns bays that belong only to specified facility', () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveLength(60);

        data.body.forEach((bay) => {
          expect(bay.operatorId).toBe(OPERATOR_A_ID);
          expect(bay.facilityId).toBe(FACILITY_A_ID);
        });
      });
  });

  it('filters bays by status within the requested facility', () => {
    return request(app.getHttpServer())
      .get(`/v1/facilities/${FACILITY_A_ID}/bays?status=available`)
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveLength(27);

        data.body.forEach((bay) => {
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
        expect(data.body).toHaveLength(1);
        expect(data.body[0]).toMatchObject({
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
      .expect([]);
  });

  it('combines bounding box and status filters', () => {
    const bbox = '12.471001,55.732001,12.47111,55.73203';

    return request(app.getHttpServer())
      .get(
        `/v1/facilities/${FACILITY_A_ID}/bays?bbox=${bbox}&status=occupied`,
      )
      .set('x-operator-id', OPERATOR_A_ID)
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveLength(1);
        expect(data.body[0]).toMatchObject({
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
