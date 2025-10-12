import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUnidad = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id_unidad || null;
  },
);
