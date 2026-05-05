import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

type AuthenticatedRequest = {
    user?: {
        role?: string;
    };
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>(
            'roles',
            context.getHandler(),
        );
        if (!requiredRoles) {
            return true;
        }
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        const userRole = request.user?.role ?? '';

        return requiredRoles.some((role) => userRole.includes(role));
    }
}
