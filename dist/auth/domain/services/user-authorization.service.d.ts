import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/user-id.vo';
export type PermissionAction = 'user:create' | 'user:read' | 'user:update' | 'user:delete' | 'profile:update' | 'system:configure';
export declare class UserAuthorizationService {
    private readonly permissionMap;
    canAccessUserResource(user: User, resourceUserId: UserId): boolean;
    hasElevatedPrivileges(user: User): boolean;
    canPerformAction(user: User, action: string): boolean;
    requiresElevatedPrivileges(action: string): boolean;
}
