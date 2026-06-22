import { raw } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { validate } from 'class-validator';

import { BayResponse } from 'src/domain/bay';
import { Bay } from '../../entities/bay.entity';
import { NearbyBaysParamsDTO, parseRadius } from './bays.dto';
import { NearbyBaysParamsValidationException } from './bays.errors';

@Injectable()
export class BaysService {
  constructor(
    @InjectRepository(Bay)
    private readonly baysRepo: EntityRepository<Bay>,
  ) {}

  async getNearby(
    operatorId: string,
    params: NearbyBaysParamsDTO,
  ): Promise<Array<BayResponse>> {
    const validationErrors = await validate(params);

    if (validationErrors.length > 0) {
      throw new NearbyBaysParamsValidationException(validationErrors);
    }

    const lng = Number(params.lng);
    const lat = Number(params.lat);
    const radius = parseRadius(params.radius)!;

    const distance = raw(
      'ST_Distance("b"."point"::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)',
      [lng, lat],
    );

    return this.baysRepo
      .createQueryBuilder('b')
      .select([
        'b.id',
        'b.operatorId',
        'b.facilityId',
        'b.code',
        'b.status',
        raw('ST_AsGeoJSON("b"."geom")::json').as('geometry'),
        raw('ST_Area("b"."geom"::geography)').as('area'),
      ])
      .where({ operatorId })
      .andWhere(
        raw(
          'ST_DWithin("b"."point"::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)',
          [lng, lat, radius],
        ),
      )
      .orderBy([{ [distance]: 'asc' }, { id: 'asc' }])
      .execute<Array<BayResponse>>();
  }
}
