import { raw } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { validate } from 'class-validator';

import {
  BayResponse,
  BaysCursor,
  BayStatusValues,
  BoundingBox,
} from 'src/domain/bay';
import { Facility } from '../../entities/facility.entity';
import { Bay } from '../../entities/bay.entity';
import {
  FacilityNotFoundException,
  InvalidCursorException,
  QueryParamsValidationException,
} from './facilities.errors';
import { BaysParamsDTO, parseBoundingBox } from './facilities.dto';
import { decodeCursor, encodeCursor } from 'src/utils/cursor';

const PAGE_SIZE = 50;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const parseCursor = (cursor: string | undefined): BaysCursor | undefined => {
  if (!cursor) {
    return undefined;
  }

  let decodedCursor: unknown;

  try {
    decodedCursor = decodeCursor(cursor);
  } catch {
    throw new InvalidCursorException();
  }

  if (!isRecord(decodedCursor)) {
    throw new InvalidCursorException();
  }

  const lastSeenId = decodedCursor.lastSeenId;
  const facilityId = decodedCursor.facilityId;
  const status = decodedCursor.status;
  const bbox = decodedCursor.bbox;

  if (typeof lastSeenId !== 'string') {
    throw new InvalidCursorException();
  }

  if (typeof facilityId !== 'string') {
    throw new InvalidCursorException();
  }

  if (status !== undefined && typeof status !== 'string') {
    throw new InvalidCursorException();
  }

  if (bbox !== undefined && (!Array.isArray(bbox) || bbox.length !== 4)) {
    throw new InvalidCursorException();
  }

  return {
    lastSeenId,
    facilityId,
    status: status as BayStatusValues | undefined,
    bbox: bbox as BoundingBox | undefined,
  };
};

const checkCursorMatch = (
  cursor: BaysCursor,
  facilityId: string,
  status: BayStatusValues | undefined,
  bbox: BoundingBox | undefined,
): boolean => {
  if (cursor.facilityId !== facilityId) {
    return false;
  }

  if (cursor.status !== status) {
    return false;
  }

  if (JSON.stringify(cursor.bbox) !== JSON.stringify(bbox)) {
    return false;
  }

  return true;
};

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
      throw new QueryParamsValidationException(validationErrors);
    }

    const facility = await this.facilitiesRepo.findOne({
      id: facilityId,
      operatorId,
    });

    if (!facility) {
      throw new FacilityNotFoundException(facilityId);
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

    const boundingBox = parseBoundingBox(params.bbox);

    if (boundingBox) {
      query.andWhere(
        raw(
          'ST_Intersects("b"."geom", ST_MakeEnvelope(?, ?, ?, ?, 4326))',
          boundingBox,
        ),
      );
    }

    const cursor = parseCursor(params.cursor);

    if (cursor) {
      if (!checkCursorMatch(cursor, facilityId, params.status, boundingBox)) {
        throw new InvalidCursorException();
      }

      query.andWhere({
        id: { $gt: cursor.lastSeenId },
      });
    }

    query.orderBy({ id: 'asc' }).limit(PAGE_SIZE + 1);

    const result = await query.execute<Array<BayResponse>>();

    return {
      items: result.slice(0, PAGE_SIZE),
      cursor:
        result.length > PAGE_SIZE
          ? encodeCursor({
              facilityId,
              status: params.status,
              bbox: boundingBox,
              lastSeenId: result[PAGE_SIZE - 1].id,
            })
          : null,
    };
  }
}
