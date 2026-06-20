import { defineEntity, p } from '@mikro-orm/postgresql';
import { Operator } from './operator.entity';

const FacilitySchema = defineEntity({
  name: 'Facility',
  tableName: 'facility',
  properties: {
    id: p.string().primary(),
    operatorId: () => p.manyToOne(Operator).mapToPk().joinColumn('operator_id'),
    name: p.string(),
    // PostGIS values stay database-native. API queries project them to GeoJSON.
    geom: p.string().columnType('geometry(POLYGON, 4326)'),
  },
});

export class Facility extends FacilitySchema.class {}

FacilitySchema.setClass(Facility);
