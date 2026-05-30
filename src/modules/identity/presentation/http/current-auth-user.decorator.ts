import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: { userId: number } }>();
    return request.user;
  },
);
