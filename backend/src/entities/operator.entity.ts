import { defineEntity, p } from '@mikro-orm/postgresql';

const OperatorSchema = defineEntity({
  name: 'Operator',
  tableName: 'operator',
  properties: {
    id: p.string().primary(),
    name: p.string(),
  },
});

export class Operator extends OperatorSchema.class {}

OperatorSchema.setClass(Operator);
