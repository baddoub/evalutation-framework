"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('Role Value Object', () => {
    describe('create', () => {
        it('should accept valid roles (admin, manager, user)', () => {
            const validRoles = ['admin', 'manager', 'user', 'Admin', 'MANAGER', 'USER'];
            validRoles.forEach((roleStr) => {
                const role = role_vo_1.Role.create(roleStr);
                expect(role).toBeDefined();
                expect(role.value).toBe(roleStr.toLowerCase());
            });
        });
        it('should reject invalid roles', () => {
            const invalidRoles = ['', 'superadmin', 'guest', 'moderator', '  ', 'admin123'];
            invalidRoles.forEach((roleStr) => {
                expect(() => role_vo_1.Role.create(roleStr)).toThrow(invalid_role_exception_1.InvalidRoleException);
            });
        });
        it('should be case-insensitive', () => {
            const role1 = role_vo_1.Role.create('ADMIN');
            const role2 = role_vo_1.Role.create('admin');
            const role3 = role_vo_1.Role.create('Admin');
            expect(role1.value).toBe('admin');
            expect(role2.value).toBe('admin');
            expect(role3.value).toBe('admin');
        });
    });
    describe('factory methods', () => {
        it('should create admin role', () => {
            const role = role_vo_1.Role.admin();
            expect(role.value).toBe('admin');
            expect(role.isAdmin()).toBe(true);
        });
        it('should create manager role', () => {
            const role = role_vo_1.Role.manager();
            expect(role.value).toBe('manager');
            expect(role.isAdmin()).toBe(false);
        });
        it('should create user role', () => {
            const role = role_vo_1.Role.user();
            expect(role.value).toBe('user');
            expect(role.isAdmin()).toBe(false);
        });
    });
    describe('equals', () => {
        it('should return true for roles with same value', () => {
            const role1 = role_vo_1.Role.create('admin');
            const role2 = role_vo_1.Role.create('admin');
            expect(role1.equals(role2)).toBe(true);
        });
        it('should return true for roles with different casing but same value', () => {
            const role1 = role_vo_1.Role.create('ADMIN');
            const role2 = role_vo_1.Role.create('admin');
            expect(role1.equals(role2)).toBe(true);
        });
        it('should return false for roles with different values', () => {
            const role1 = role_vo_1.Role.create('admin');
            const role2 = role_vo_1.Role.create('user');
            expect(role1.equals(role2)).toBe(false);
        });
        it('should return false when comparing with null', () => {
            const role = role_vo_1.Role.admin();
            expect(role.equals(null)).toBe(false);
        });
    });
    describe('isAdmin', () => {
        it('should return true for admin role', () => {
            const adminRole = role_vo_1.Role.admin();
            expect(adminRole.isAdmin()).toBe(true);
        });
        it('should return false for manager role', () => {
            const managerRole = role_vo_1.Role.manager();
            expect(managerRole.isAdmin()).toBe(false);
        });
        it('should return false for user role', () => {
            const userRole = role_vo_1.Role.user();
            expect(userRole.isAdmin()).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return role value as string', () => {
            const role = role_vo_1.Role.create('manager');
            expect(role.toString()).toBe('manager');
        });
    });
    describe('immutability', () => {
        it('should not allow modification of value after creation', () => {
            const role = role_vo_1.Role.admin();
            const originalValue = role.value;
            expect(role.value).toBe(originalValue);
            expect(role.value).toBe('admin');
        });
    });
});
const role_vo_1 = require("./role.vo");
const invalid_role_exception_1 = require("../exceptions/invalid-role.exception");
//# sourceMappingURL=role.vo.spec.js.map