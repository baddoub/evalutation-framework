import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email: string;
  name: string;
  role?: string;
  level?: string;
  department?: string;
  managerId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return {
      userId: request.user.id,
      email: request.user.email,
      name: request.user.name,
      role: request.user.role,
      level: request.user.level,
      department: request.user.department,
      managerId: request.user.managerId,
    };
  },
);
