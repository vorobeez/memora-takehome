import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestWithOperatorId } from 'src/types/request';

const OPERATOR_ID_HEADER = 'x-operator-id';

@Injectable()
export class OperatorContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const operatorId = request.header(OPERATOR_ID_HEADER);

    if (!operatorId) {
      throw new BadRequestException(`Missing ${OPERATOR_ID_HEADER} header`);
    }

    (request as RequestWithOperatorId).operatorId = operatorId;

    return true;
  }
}
