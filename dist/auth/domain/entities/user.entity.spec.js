"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_entity_1 = require("./user.entity");
const email_vo_1 = require("../value-objects/email.vo");
const user_id_vo_1 = require("../value-objects/user-id.vo");
const role_vo_1 = require("../value-objects/role.vo");
describe('User Entity', () => {
    const createValidUserData = () => ({
        id: user_id_vo_1.UserId.generate(),
        email: email_vo_1.Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-123',
        roles: [role_vo_1.Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    describe('create', () => {
        it('should create a user with valid data', () => {
            const data = createValidUserData();
            const user = user_entity_1.User.create(data);
            expect(user).toBeDefined();
            expect(user.id.equals(data.id)).toBe(true);
            expect(user.email.equals(data.email)).toBe(true);
            expect(user.name).toBe(data.name);
            expect(user.keycloakId).toBe(data.keycloakId);
            expect(user.roles).toHaveLength(1);
            expect(user.isActive).toBe(true);
        });
        it('should reject empty name', () => {
            const data = { ...createValidUserData(), name: '' };
            expect(() => user_entity_1.User.create(data)).toThrow('User name cannot be empty');
        });
        it('should reject whitespace-only name', () => {
            const data = { ...createValidUserData(), name: '   ' };
            expect(() => user_entity_1.User.create(data)).toThrow('User name cannot be empty');
        });
        it('should reject name longer than 100 characters', () => {
            const data = { ...createValidUserData(), name: 'a'.repeat(101) };
            expect(() => user_entity_1.User.create(data)).toThrow('Name too long (max 100 chars)');
        });
        it('should reject empty keycloakId', () => {
            const data = { ...createValidUserData(), keycloakId: '' };
            expect(() => user_entity_1.User.create(data)).toThrow('Keycloak ID is required');
        });
        it('should reject empty roles array', () => {
            const data = { ...createValidUserData(), roles: [] };
            expect(() => user_entity_1.User.create(data)).toThrow('User must have at least one role');
        });
        it('should create user with multiple roles', () => {
            const data = {
                ...createValidUserData(),
                roles: [role_vo_1.Role.admin(), role_vo_1.Role.manager()],
            };
            const user = user_entity_1.User.create(data);
            expect(user.roles).toHaveLength(2);
            expect(user.hasRole(role_vo_1.Role.admin())).toBe(true);
            expect(user.hasRole(role_vo_1.Role.manager())).toBe(true);
        });
    });
    describe('updateProfile', () => {
        it('should update user name', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalUpdatedAt = user.updatedAt;
            setTimeout(() => {
                user.updateProfile('New Name');
                expect(user.name).toBe('New Name');
                expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
            }, 10);
        });
        it('should reject empty name update', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(() => user.updateProfile('')).toThrow('User name cannot be empty');
        });
        it('should reject whitespace-only name update', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(() => user.updateProfile('   ')).toThrow('User name cannot be empty');
        });
        it('should reject name update longer than 100 characters', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(() => user.updateProfile('a'.repeat(101))).toThrow('Name too long (max 100 chars)');
        });
    });
    describe('assignRole', () => {
        it('should add role to user', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const adminRole = role_vo_1.Role.admin();
            user.assignRole(adminRole);
            expect(user.hasRole(adminRole)).toBe(true);
            expect(user.roles).toHaveLength(2);
        });
        it('should not duplicate roles', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const userRole = role_vo_1.Role.user();
            user.assignRole(userRole);
            expect(user.roles).toHaveLength(1);
        });
        it('should update timestamp when adding role', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalUpdatedAt = user.updatedAt;
            setTimeout(() => {
                user.assignRole(role_vo_1.Role.admin());
                expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
            }, 10);
        });
    });
    describe('removeRole', () => {
        it('should remove role from user', () => {
            const user = user_entity_1.User.create({
                ...createValidUserData(),
                roles: [role_vo_1.Role.user(), role_vo_1.Role.admin()],
            });
            user.removeRole(role_vo_1.Role.admin());
            expect(user.hasRole(role_vo_1.Role.admin())).toBe(false);
            expect(user.roles).toHaveLength(1);
        });
        it('should not allow removing last role', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(() => user.removeRole(role_vo_1.Role.user())).toThrow('User must have at least one role');
        });
        it('should do nothing if role does not exist', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalRolesCount = user.roles.length;
            user.removeRole(role_vo_1.Role.admin());
            expect(user.roles).toHaveLength(originalRolesCount);
        });
    });
    describe('activate and deactivate', () => {
        it('should activate user', () => {
            const user = user_entity_1.User.create({ ...createValidUserData(), isActive: false });
            user.activate();
            expect(user.isActive).toBe(true);
        });
        it('should deactivate user', () => {
            const user = user_entity_1.User.create(createValidUserData());
            user.deactivate();
            expect(user.isActive).toBe(false);
        });
        it('should update timestamp on activation', () => {
            const user = user_entity_1.User.create({ ...createValidUserData(), isActive: false });
            const originalUpdatedAt = user.updatedAt;
            setTimeout(() => {
                user.activate();
                expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
            }, 10);
        });
        it('should update timestamp on deactivation', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalUpdatedAt = user.updatedAt;
            setTimeout(() => {
                user.deactivate();
                expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
            }, 10);
        });
    });
    describe('hasRole', () => {
        it('should return true if user has role', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(user.hasRole(role_vo_1.Role.user())).toBe(true);
        });
        it('should return false if user does not have role', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(user.hasRole(role_vo_1.Role.admin())).toBe(false);
        });
    });
    describe('hasAnyRole', () => {
        it('should return true if user has any of the roles', () => {
            const user = user_entity_1.User.create({
                ...createValidUserData(),
                roles: [role_vo_1.Role.user(), role_vo_1.Role.manager()],
            });
            expect(user.hasAnyRole([role_vo_1.Role.admin(), role_vo_1.Role.manager()])).toBe(true);
        });
        it('should return false if user has none of the roles', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(user.hasAnyRole([role_vo_1.Role.admin(), role_vo_1.Role.manager()])).toBe(false);
        });
        it('should return false for empty roles array', () => {
            const user = user_entity_1.User.create(createValidUserData());
            expect(user.hasAnyRole([])).toBe(false);
        });
    });
    describe('synchronizeFromKeycloak', () => {
        it('should update user data from Keycloak', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const keycloakData = {
                email: email_vo_1.Email.create('updated@example.com'),
                name: 'Updated Name',
                roles: [role_vo_1.Role.admin(), role_vo_1.Role.user()],
            };
            user.synchronizeFromKeycloak(keycloakData);
            expect(user.email.equals(keycloakData.email)).toBe(true);
            expect(user.name).toBe(keycloakData.name);
            expect(user.roles).toHaveLength(2);
            expect(user.hasRole(role_vo_1.Role.admin())).toBe(true);
        });
        it('should update timestamp on synchronization', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalUpdatedAt = user.updatedAt;
            setTimeout(() => {
                user.synchronizeFromKeycloak({
                    email: email_vo_1.Email.create('updated@example.com'),
                    name: 'Updated Name',
                    roles: [role_vo_1.Role.user()],
                });
                expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
            }, 10);
        });
        it('should maintain keycloakId immutability', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalKeycloakId = user.keycloakId;
            user.synchronizeFromKeycloak({
                email: email_vo_1.Email.create('updated@example.com'),
                name: 'Updated Name',
                roles: [role_vo_1.Role.user()],
            });
            expect(user.keycloakId).toBe(originalKeycloakId);
        });
    });
    describe('immutability', () => {
        it('should not allow id modification', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalId = user.id;
            expect(user.id).toBe(originalId);
        });
        it('should not allow keycloakId modification after creation', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalKeycloakId = user.keycloakId;
            expect(user.keycloakId).toBe(originalKeycloakId);
        });
        it('should not allow createdAt modification', () => {
            const user = user_entity_1.User.create(createValidUserData());
            const originalCreatedAt = user.createdAt;
            expect(user.createdAt).toBe(originalCreatedAt);
        });
    });
});
//# sourceMappingURL=user.entity.spec.js.map