import { Request } from 'express';

export type RequestWithOperatorId = Request & {
  operatorId: string;
};
