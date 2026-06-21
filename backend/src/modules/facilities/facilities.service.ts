import { raw } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { Facility } from '../../entities/facility.entity';
import { Bay } from '../../entities/bay.entity';
import { FacilityNotFound } from './facilities.errors';
import { BaysResponse } from 'src/domain/bay';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilitiesRepo: EntityRepository<Facility>,
    @InjectRepository(Bay)
    private readonly baysRepo: EntityRepository<Bay>,
  ) {}

  async getBays(facilityId: string) {
    const facility = await this.facilitiesRepo.findOne({
      id: facilityId,
    });

    if (!facility) {
      throw new FacilityNotFound(facilityId);
    }

    return this.baysRepo
      .createQueryBuilder('b')
      .select([
        'b.id',
        'b.facilityId',
        'b.code',
        'b.status',
        raw('ST_AsGeoJSON("b"."geom")::json').as('geometry'),
        raw('ST_Area("b"."geom"::geography)').as('area'),
      ])
      .where({
        operatorId: facility.operatorId,
        facilityId: facility.id,
      })
      .execute<BaysResponse>();
  }
}
