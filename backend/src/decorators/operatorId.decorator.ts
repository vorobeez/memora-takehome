import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithOperatorId } from 'src/types/request';

export const OperatorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithOperatorId>();
    return request.operatorId;
  },
);
