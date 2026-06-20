import { defineEntity, p } from '@mikro-orm/postgresql';
import { BayStatusValues } from 'src/domain/bay';

const BaySchema = defineEntity({
  name: 'Bay',
  tableName: 'bay',
  properties: {
    id: p.string().primary(),
    operatorId: p.string().fieldName('operator_id'),
    facilityId: p.string().fieldName('facility_id'),
    code: p.string(),
    status: p.string().$type<BayStatusValues>(),
    geom: p.string().columnType('geometry(POLYGON, 4326)'),
    point: p.string().columnType('geometry(POINT, 4326)'),
  },
});

export class Bay extends BaySchema.class {}

BaySchema.setClass(Bay);
