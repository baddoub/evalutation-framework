"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAuthorizationService = void 0;
const role_vo_1 = require("../value-objects/role.vo");
class UserAuthorizationService {
    constructor() {
        this.permissionMap = {
            'user:create': [role_vo_1.Role.admin(), role_vo_1.Role.manager()],
            'user:read': [role_vo_1.Role.admin(), role_vo_1.Role.manager(), role_vo_1.Role.user()],
            'user:update': [role_vo_1.Role.admin(), role_vo_1.Role.manager()],
            'user:delete': [role_vo_1.Role.admin()],
            'profile:update': [role_vo_1.Role.admin(), role_vo_1.Role.manager(), role_vo_1.Role.user()],
            'system:configure': [role_vo_1.Role.admin()],
        };
    }
    canAccessUserResource(user, resourceUserId) {
        if (user.id.equals(resourceUserId)) {
            return true;
        }
        return this.hasElevatedPrivileges(user);
    }
    hasElevatedPrivileges(user) {
        return user.hasAnyRole([role_vo_1.Role.admin(), role_vo_1.Role.manager()]);
    }
    canPerformAction(user, action) {
        if (user.hasRole(role_vo_1.Role.admin())) {
            if (!this.permissionMap[action]) {
                return false;
            }
            return true;
        }
        const requiredRoles = this.permissionMap[action];
        if (!requiredRoles) {
            return false;
        }
        return user.hasAnyRole(requiredRoles);
    }
    requiresElevatedPrivileges(action) {
        const requiredRoles = this.permissionMap[action];
        if (!requiredRoles) {
            return false;
        }
        const elevatedRoles = [role_vo_1.Role.admin(), role_vo_1.Role.manager()];
        return requiredRoles.every((role) => elevatedRoles.some((elevated) => elevated.equals(role)));
    }
}
exports.UserAuthorizationService = UserAuthorizationService;
//# sourceMappingURL=user-authorization.service.js.map