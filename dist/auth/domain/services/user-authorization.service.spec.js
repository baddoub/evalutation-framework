"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_authorization_service_1 = require("./user-authorization.service");
const user_entity_1 = require("../entities/user.entity");
const email_vo_1 = require("../value-objects/email.vo");
const user_id_vo_1 = require("../value-objects/user-id.vo");
const role_vo_1 = require("../value-objects/role.vo");
describe('UserAuthorizationService', () => {
    let service;
    beforeEach(() => {
        service = new user_authorization_service_1.UserAuthorizationService();
    });
    const createUser = (roles) => {
        return user_entity_1.User.create({
            id: user_id_vo_1.UserId.generate(),
            email: email_vo_1.Email.create('test@example.com'),
            name: 'Test User',
            keycloakId: 'keycloak-123',
            roles,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };
    describe('canAccessUserResource', () => {
        it('should allow user to access their own resource', () => {
            const user = createUser([role_vo_1.Role.user()]);
            const resourceUserId = user.id;
            const result = service.canAccessUserResource(user, resourceUserId);
            expect(result).toBe(true);
        });
        it('should deny user from accessing another users resource', () => {
            const user = createUser([role_vo_1.Role.user()]);
            const otherUserId = user_id_vo_1.UserId.generate();
            const result = service.canAccessUserResource(user, otherUserId);
            expect(result).toBe(false);
        });
        it('should allow admin to access any users resource', () => {
            const admin = createUser([role_vo_1.Role.admin()]);
            const otherUserId = user_id_vo_1.UserId.generate();
            const result = service.canAccessUserResource(admin, otherUserId);
            expect(result).toBe(true);
        });
        it('should allow admin to access their own resource', () => {
            const admin = createUser([role_vo_1.Role.admin()]);
            const resourceUserId = admin.id;
            const result = service.canAccessUserResource(admin, resourceUserId);
            expect(result).toBe(true);
        });
        it('should allow manager to access any users resource', () => {
            const manager = createUser([role_vo_1.Role.manager()]);
            const otherUserId = user_id_vo_1.UserId.generate();
            const result = service.canAccessUserResource(manager, otherUserId);
            expect(result).toBe(true);
        });
    });
    describe('hasElevatedPrivileges', () => {
        it('should return true for admin user', () => {
            const admin = createUser([role_vo_1.Role.admin()]);
            const result = service.hasElevatedPrivileges(admin);
            expect(result).toBe(true);
        });
        it('should return true for manager user', () => {
            const manager = createUser([role_vo_1.Role.manager()]);
            const result = service.hasElevatedPrivileges(manager);
            expect(result).toBe(true);
        });
        it('should return false for regular user', () => {
            const user = createUser([role_vo_1.Role.user()]);
            const result = service.hasElevatedPrivileges(user);
            expect(result).toBe(false);
        });
        it('should return true for user with both admin and user roles', () => {
            const user = createUser([role_vo_1.Role.admin(), role_vo_1.Role.user()]);
            const result = service.hasElevatedPrivileges(user);
            expect(result).toBe(true);
        });
        it('should return true for user with both manager and user roles', () => {
            const user = createUser([role_vo_1.Role.manager(), role_vo_1.Role.user()]);
            const result = service.hasElevatedPrivileges(user);
            expect(result).toBe(true);
        });
    });
    describe('canPerformAction', () => {
        it('should allow admin to perform any action', () => {
            const admin = createUser([role_vo_1.Role.admin()]);
            expect(service.canPerformAction(admin, 'user:create')).toBe(true);
            expect(service.canPerformAction(admin, 'user:read')).toBe(true);
            expect(service.canPerformAction(admin, 'user:update')).toBe(true);
            expect(service.canPerformAction(admin, 'user:delete')).toBe(true);
            expect(service.canPerformAction(admin, 'system:configure')).toBe(true);
        });
        it('should allow manager to perform management actions', () => {
            const manager = createUser([role_vo_1.Role.manager()]);
            expect(service.canPerformAction(manager, 'user:create')).toBe(true);
            expect(service.canPerformAction(manager, 'user:read')).toBe(true);
            expect(service.canPerformAction(manager, 'user:update')).toBe(true);
        });
        it('should deny manager from performing admin-only actions', () => {
            const manager = createUser([role_vo_1.Role.manager()]);
            expect(service.canPerformAction(manager, 'user:delete')).toBe(false);
            expect(service.canPerformAction(manager, 'system:configure')).toBe(false);
        });
        it('should allow regular user to perform basic actions', () => {
            const user = createUser([role_vo_1.Role.user()]);
            expect(service.canPerformAction(user, 'user:read')).toBe(true);
            expect(service.canPerformAction(user, 'profile:update')).toBe(true);
        });
        it('should deny regular user from performing privileged actions', () => {
            const user = createUser([role_vo_1.Role.user()]);
            expect(service.canPerformAction(user, 'user:create')).toBe(false);
            expect(service.canPerformAction(user, 'user:update')).toBe(false);
            expect(service.canPerformAction(user, 'user:delete')).toBe(false);
            expect(service.canPerformAction(user, 'system:configure')).toBe(false);
        });
        it('should deny unknown action for all users', () => {
            const admin = createUser([role_vo_1.Role.admin()]);
            const manager = createUser([role_vo_1.Role.manager()]);
            const user = createUser([role_vo_1.Role.user()]);
            expect(service.canPerformAction(admin, 'unknown:action')).toBe(false);
            expect(service.canPerformAction(manager, 'unknown:action')).toBe(false);
            expect(service.canPerformAction(user, 'unknown:action')).toBe(false);
        });
    });
    describe('requiresElevatedPrivileges', () => {
        it('should return true for admin-only actions', () => {
            expect(service.requiresElevatedPrivileges('user:delete')).toBe(true);
            expect(service.requiresElevatedPrivileges('system:configure')).toBe(true);
        });
        it('should return true for manager actions', () => {
            expect(service.requiresElevatedPrivileges('user:create')).toBe(true);
            expect(service.requiresElevatedPrivileges('user:update')).toBe(true);
        });
        it('should return false for basic user actions', () => {
            expect(service.requiresElevatedPrivileges('user:read')).toBe(false);
            expect(service.requiresElevatedPrivileges('profile:update')).toBe(false);
        });
        it('should return false for unknown actions', () => {
            expect(service.requiresElevatedPrivileges('unknown:action')).toBe(false);
        });
    });
});
//# sourceMappingURL=user-authorization.service.spec.js.map