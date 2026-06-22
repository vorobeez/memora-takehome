import { raw } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';

import { Facility } from '../../entities/facility.entity';
import { Bay } from '../../entities/bay.entity';
import { FacilityNotFound } from './facilities.errors';
import { BaysResponse } from 'src/domain/bay';
import { BaysParamsDTO } from './facilities.dto';
import { validate } from 'class-validator';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilitiesRepo: EntityRepository<Facility>,
    @InjectRepository(Bay)
    private readonly baysRepo: EntityRepository<Bay>,
  ) {}

  async getBays(facilityId: string, operatorId: string, params: BaysParamsDTO) {
    const validationErrors = await validate(params);

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        `Validation errors on the folllowing properties: ${validationErrors.map((error) => error.property).join(', ')}`,
      );
    }

    const facility = await this.facilitiesRepo.findOne({
      id: facilityId,
      operatorId,
    });

    if (!facility) {
      throw new FacilityNotFound(facilityId);
    }

    const query = this.baysRepo
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
      .where({
        operatorId,
        facilityId,
      });

    if (params.status) {
      query.andWhere({
        status: params.status,
      });
    }

    return query.execute<BaysResponse>();
  }
}
