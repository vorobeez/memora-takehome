import { defineEntity, p } from '@mikro-orm/postgresql';
import { Facility } from './facility.entity';
import { BayStatusValues } from 'src/domain/bay';

const BaySchema = defineEntity({
  name: 'Bay',
  tableName: 'bay',
  properties: {
    id: p.string().primary(),
    operatorId: p.string().fieldName('operator_id'),
    facility: () =>
      p
        .manyToOne(Facility)
        .joinColumns('facility_id', 'operator_id')
        .referencedColumnNames('id', 'operator_id')
        .ownColumns('facility_id'),
    code: p.string(),
    status: p.string().$type<BayStatusValues>(),
    // Response projections use ST_AsGeoJSON so the database representation
    // never becomes the wire format.
    geom: p.string().columnType('geometry(POLYGON, 4326)'),
  },
});

export class Bay extends BaySchema.class {}

BaySchema.setClass(Bay);
