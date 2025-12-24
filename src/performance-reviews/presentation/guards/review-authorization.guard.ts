import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

interface RequestUser {
  id: string
  email: string
  roles: string[]
}

interface RequestWithUser {
  user: RequestUser
}

@Injectable()
export class ReviewAuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const { user } = request

    if (!user) {
      throw new ForbiddenException('User not authenticated')
    }

    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('review_roles', [
      context.getHandler(),
      context.getClass(),
    ])

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    // Check if user has any of the required roles (case-insensitive)
    const userRolesLower = user.roles.map((r) => r.toLowerCase())
    const hasRole = requiredRoles.some((role) => userRolesLower.includes(role.toLowerCase()))

    if (!hasRole) {
      const rolesStr = requiredRoles.join(', ')
      throw new ForbiddenException(`Insufficient permissions. Required roles: ${rolesStr}`)
    }

    // Additional authorization logic can be added here
    // For example, checking if a manager can only access their team's reviews
    // This will be implemented in use cases for now

    return true
  }
}
