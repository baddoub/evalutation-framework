"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_synchronization_service_1 = require("./user-synchronization.service");
const user_entity_1 = require("../../domain/entities/user.entity");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
const email_vo_1 = require("../../domain/value-objects/email.vo");
const role_vo_1 = require("../../domain/value-objects/role.vo");
const keycloak_user_data_dto_1 = require("../dto/keycloak-user-data.dto");
describe('UserSynchronizationService', () => {
    let service;
    beforeEach(() => {
        service = new user_synchronization_service_1.UserSynchronizationService();
    });
    describe('synchronizeUser', () => {
        it('should update user name from Keycloak data', () => {
            const user = user_entity_1.User.create({
                id: user_id_vo_1.UserId.generate(),
                email: email_vo_1.Email.create('test@example.com'),
                name: 'Old Name',
                keycloakId: 'keycloak-id-123',
                roles: [role_vo_1.Role.user()],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const keycloakData = new keycloak_user_data_dto_1.KeycloakUserDataDto('keycloak-id-123', 'test@example.com', 'New Name', true);
            const oldName = user.name;
            service.synchronizeUser(user, keycloakData);
            expect(user.name).not.toBe(oldName);
            expect(user.name).toBe('New Name');
        });
        it('should update user email from Keycloak data', () => {
            const user = user_entity_1.User.create({
                id: user_id_vo_1.UserId.generate(),
                email: email_vo_1.Email.create('old@example.com'),
                name: 'Test User',
                keycloakId: 'keycloak-id-123',
                roles: [role_vo_1.Role.user()],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const keycloakData = new keycloak_user_data_dto_1.KeycloakUserDataDto('keycloak-id-123', 'new@example.com', 'Test User', true);
            service.synchronizeUser(user, keycloakData);
            expect(user.email.value).toBe('new@example.com');
        });
        it('should not throw error if data is the same', () => {
            const user = user_entity_1.User.create({
                id: user_id_vo_1.UserId.generate(),
                email: email_vo_1.Email.create('test@example.com'),
                name: 'Test User',
                keycloakId: 'keycloak-id-123',
                roles: [role_vo_1.Role.user()],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const keycloakData = new keycloak_user_data_dto_1.KeycloakUserDataDto('keycloak-id-123', 'test@example.com', 'Test User', true);
            expect(() => service.synchronizeUser(user, keycloakData)).not.toThrow();
        });
        it('should handle missing optional fields gracefully', () => {
            const user = user_entity_1.User.create({
                id: user_id_vo_1.UserId.generate(),
                email: email_vo_1.Email.create('test@example.com'),
                name: 'Test User',
                keycloakId: 'keycloak-id-123',
                roles: [role_vo_1.Role.user()],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const keycloakData = new keycloak_user_data_dto_1.KeycloakUserDataDto('keycloak-id-123', 'test@example.com', 'Updated Name');
            expect(() => service.synchronizeUser(user, keycloakData)).not.toThrow();
            expect(user.name).toBe('Updated Name');
        });
    });
});
//# sourceMappingURL=user-synchronization.service.spec.js.map