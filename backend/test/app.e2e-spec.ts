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

  afterAll(async () => {
    await app.close();
  });
});
