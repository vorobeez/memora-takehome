import { defineEntity, p } from '@mikro-orm/postgresql';

const FacilitySchema = defineEntity({
  name: 'Facility',
  tableName: 'facility',
  properties: {
    id: p.string().primary(),
    operatorId: p.string().fieldName('operator_id'),
    name: p.string(),
    geom: p.string().columnType('geometry(POLYGON, 4326)'),
  },
});

export class Facility extends FacilitySchema.class {}

FacilitySchema.setClass(Facility);
