"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_mapper_1 = require("./user.mapper");
const user_entity_1 = require("../../domain/entities/user.entity");
const email_vo_1 = require("../../domain/value-objects/email.vo");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
const role_vo_1 = require("../../domain/value-objects/role.vo");
describe('UserMapper', () => {
    const testUuid = '123e4567-e89b-42d3-a456-426614174000';
    const mockPrismaUser = {
        id: testUuid,
        email: 'test@example.com',
        name: 'Test User',
        keycloakId: 'keycloak-123',
        roles: ['user', 'admin'],
        isActive: true,
        level: null,
        department: null,
        jobTitle: null,
        managerId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        deletedAt: null,
    };
    const mockDomainUser = user_entity_1.User.create({
        id: user_id_vo_1.UserId.fromString(testUuid),
        email: email_vo_1.Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-123',
        roles: [role_vo_1.Role.user(), role_vo_1.Role.admin()],
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
    });
    describe('toDomain', () => {
        it('should convert Prisma User to Domain User', () => {
            const domainUser = user_mapper_1.UserMapper.toDomain(mockPrismaUser);
            expect(domainUser.id.value).toBe(mockPrismaUser.id);
            expect(domainUser.email.value).toBe(mockPrismaUser.email);
            expect(domainUser.name).toBe(mockPrismaUser.name);
            expect(domainUser.keycloakId).toBe(mockPrismaUser.keycloakId);
            expect(domainUser.roles.map((r) => r.value)).toEqual(mockPrismaUser.roles);
            expect(domainUser.isActive).toBe(mockPrismaUser.isActive);
            expect(domainUser.createdAt).toEqual(mockPrismaUser.createdAt);
            expect(domainUser.updatedAt).toEqual(mockPrismaUser.updatedAt);
            expect(domainUser.deletedAt).toBeUndefined();
        });
        it('should handle deletedAt when present', () => {
            const prismaUserWithDeletedAt = {
                ...mockPrismaUser,
                deletedAt: new Date('2025-01-03'),
            };
            const domainUser = user_mapper_1.UserMapper.toDomain(prismaUserWithDeletedAt);
            expect(domainUser.deletedAt).toEqual(prismaUserWithDeletedAt.deletedAt);
        });
        it('should create valid Email value object', () => {
            const domainUser = user_mapper_1.UserMapper.toDomain(mockPrismaUser);
            expect(domainUser.email).toBeInstanceOf(email_vo_1.Email);
            expect(domainUser.email.value).toBe(mockPrismaUser.email);
        });
        it('should create valid UserId value object', () => {
            const domainUser = user_mapper_1.UserMapper.toDomain(mockPrismaUser);
            expect(domainUser.id).toBeInstanceOf(user_id_vo_1.UserId);
            expect(domainUser.id.value).toBe(mockPrismaUser.id);
        });
        it('should create valid Role value objects', () => {
            const domainUser = user_mapper_1.UserMapper.toDomain(mockPrismaUser);
            expect(domainUser.roles.length).toBe(2);
            expect(domainUser.roles[0]).toBeInstanceOf(role_vo_1.Role);
            expect(domainUser.roles[1]).toBeInstanceOf(role_vo_1.Role);
        });
    });
    describe('toOrm', () => {
        it('should convert Domain User to Prisma User', () => {
            const prismaUser = user_mapper_1.UserMapper.toOrm(mockDomainUser);
            expect(prismaUser.id).toBe(mockDomainUser.id.value);
            expect(prismaUser.email).toBe(mockDomainUser.email.value);
            expect(prismaUser.name).toBe(mockDomainUser.name);
            expect(prismaUser.keycloakId).toBe(mockDomainUser.keycloakId);
            expect(prismaUser.roles).toEqual(['user', 'admin']);
            expect(prismaUser.isActive).toBe(mockDomainUser.isActive);
            expect(prismaUser.createdAt).toEqual(mockDomainUser.createdAt);
            expect(prismaUser.updatedAt).toEqual(mockDomainUser.updatedAt);
            expect(prismaUser.deletedAt).toBeNull();
        });
        it('should handle deletedAt when present', () => {
            const domainUserWithDeletedAt = user_entity_1.User.create({
                id: user_id_vo_1.UserId.fromString(testUuid),
                email: email_vo_1.Email.create('test@example.com'),
                name: 'Test User',
                keycloakId: 'keycloak-123',
                roles: [role_vo_1.Role.user(), role_vo_1.Role.admin()],
                isActive: true,
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-02'),
                deletedAt: new Date('2025-01-03'),
            });
            const prismaUser = user_mapper_1.UserMapper.toOrm(domainUserWithDeletedAt);
            expect(prismaUser.deletedAt).toEqual(domainUserWithDeletedAt.deletedAt);
        });
        it('should convert value objects to primitive types', () => {
            const prismaUser = user_mapper_1.UserMapper.toOrm(mockDomainUser);
            expect(typeof prismaUser.id).toBe('string');
            expect(typeof prismaUser.email).toBe('string');
            expect(Array.isArray(prismaUser.roles)).toBe(true);
            expect(typeof prismaUser.roles[0]).toBe('string');
        });
    });
    describe('toOrmData', () => {
        it('should convert Domain User to Prisma data without id', () => {
            const ormData = user_mapper_1.UserMapper.toOrmData(mockDomainUser);
            expect(ormData.email).toBe(mockDomainUser.email.value);
            expect(ormData.name).toBe(mockDomainUser.name);
            expect(ormData.keycloakId).toBe(mockDomainUser.keycloakId);
            expect(ormData.roles).toEqual(['user', 'admin']);
            expect(ormData.isActive).toBe(mockDomainUser.isActive);
            expect('id' in ormData).toBe(false);
        });
        it('should be usable for create operations', () => {
            const ormData = user_mapper_1.UserMapper.toOrmData(mockDomainUser);
            expect(ormData).toHaveProperty('email');
            expect(ormData).toHaveProperty('name');
            expect(ormData).toHaveProperty('keycloakId');
            expect(ormData).toHaveProperty('roles');
            expect(ormData).toHaveProperty('isActive');
            expect(ormData).toHaveProperty('createdAt');
            expect(ormData).toHaveProperty('updatedAt');
        });
    });
    describe('Round-trip conversion', () => {
        it('should maintain data integrity through domain -> orm -> domain', () => {
            const ormUser = user_mapper_1.UserMapper.toOrm(mockDomainUser);
            const reconvertedDomainUser = user_mapper_1.UserMapper.toDomain(ormUser);
            expect(reconvertedDomainUser.id.value).toBe(mockDomainUser.id.value);
            expect(reconvertedDomainUser.email.value).toBe(mockDomainUser.email.value);
            expect(reconvertedDomainUser.name).toBe(mockDomainUser.name);
            expect(reconvertedDomainUser.keycloakId).toBe(mockDomainUser.keycloakId);
            expect(reconvertedDomainUser.roles.map((r) => r.value)).toEqual(mockDomainUser.roles.map((r) => r.value));
        });
        it('should maintain data integrity through orm -> domain -> orm', () => {
            const domainUser = user_mapper_1.UserMapper.toDomain(mockPrismaUser);
            const reconvertedOrmUser = user_mapper_1.UserMapper.toOrm(domainUser);
            expect(reconvertedOrmUser.id).toBe(mockPrismaUser.id);
            expect(reconvertedOrmUser.email).toBe(mockPrismaUser.email);
            expect(reconvertedOrmUser.name).toBe(mockPrismaUser.name);
            expect(reconvertedOrmUser.keycloakId).toBe(mockPrismaUser.keycloakId);
            expect(reconvertedOrmUser.roles).toEqual(mockPrismaUser.roles);
        });
    });
});
//# sourceMappingURL=user.mapper.spec.js.map