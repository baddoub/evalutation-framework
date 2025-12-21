import { User } from '../entities/user.entity'
import { UserId } from '../value-objects/user-id.vo'
import { Role } from '../value-objects/role.vo'

/**
 * Permission action type
 */
export type PermissionAction =
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'profile:update'
  | 'system:configure'

/**
 * User Authorization Service
 *
 * Domain service for authorization logic.
 * Stateless service that encapsulates role-based permission rules.
 */
export class UserAuthorizationService {
  // Permission mapping: action -> required roles
  private readonly permissionMap: Record<string, Role[]> = {
    'user:create': [Role.admin(), Role.manager()],
    'user:read': [Role.admin(), Role.manager(), Role.user()],
    'user:update': [Role.admin(), Role.manager()],
    'user:delete': [Role.admin()],
    'profile:update': [Role.admin(), Role.manager(), Role.user()],
    'system:configure': [Role.admin()],
  }

  /**
   * Check if user can access a specific user's resource
   * Users can access their own resources, admins and managers can access any
   *
   * @param user The user attempting access
   * @param resourceUserId The user ID of the resource being accessed
   * @returns True if access is allowed
   */
  canAccessUserResource(user: User, resourceUserId: UserId): boolean {
    // User can access their own resources
    if (user.id.equals(resourceUserId)) {
      return true
    }

    // Admins and managers can access any user's resources
    return this.hasElevatedPrivileges(user)
  }

  /**
   * Check if user has elevated privileges (admin or manager)
   *
   * @param user The user to check
   * @returns True if user is admin or manager
   */
  hasElevatedPrivileges(user: User): boolean {
    return user.hasAnyRole([Role.admin(), Role.manager()])
  }

  /**
   * Check if user can perform a specific action
   *
   * @param user The user attempting the action
   * @param action The action to perform
   * @returns True if user has permission
   */
  canPerformAction(user: User, action: string): boolean {
    // Admin can do everything
    if (user.hasRole(Role.admin())) {
      // Check if action exists in permission map
      if (!this.permissionMap[action]) {
        return false // Unknown action
      }
      return true
    }

    // Check if action exists in permission map
    const requiredRoles = this.permissionMap[action]
    if (!requiredRoles) {
      return false // Unknown action
    }

    // Check if user has any of the required roles
    return user.hasAnyRole(requiredRoles)
  }

  /**
   * Check if an action requires elevated privileges
   *
   * @param action The action to check
   * @returns True if action requires admin or manager role
   */
  requiresElevatedPrivileges(action: string): boolean {
    const requiredRoles = this.permissionMap[action]
    if (!requiredRoles) {
      return false // Unknown action doesn't require privileges
    }

    // Check if only admin/manager roles are in the required roles
    const elevatedRoles = [Role.admin(), Role.manager()]
    return requiredRoles.every((role) => elevatedRoles.some((elevated) => elevated.equals(role)))
  }
}
