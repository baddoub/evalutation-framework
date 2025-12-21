import { UserSynchronizationService } from './user-synchronization.service'
import { User } from '../../domain/entities/user.entity'
import { UserId } from '../../domain/value-objects/user-id.vo'
import { Email } from '../../domain/value-objects/email.vo'
import { Role } from '../../domain/value-objects/role.vo'
import { KeycloakUserDataDto } from '../dto/keycloak-user-data.dto'

describe('UserSynchronizationService', () => {
  let service: UserSynchronizationService

  beforeEach(() => {
    service = new UserSynchronizationService()
  })

  describe('synchronizeUser', () => {
    it('should update user name from Keycloak data', () => {
      // Arrange
      const user = User.create({
        id: UserId.generate(),
        email: Email.create('test@example.com'),
        name: 'Old Name',
        keycloakId: 'keycloak-id-123',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const keycloakData = new KeycloakUserDataDto(
        'keycloak-id-123',
        'test@example.com',
        'New Name',
        true,
      )

      const oldName = user.name

      // Act
      service.synchronizeUser(user, keycloakData)

      // Assert
      expect(user.name).not.toBe(oldName)
      expect(user.name).toBe('New Name')
    })

    it('should update user email from Keycloak data', () => {
      // Arrange
      const user = User.create({
        id: UserId.generate(),
        email: Email.create('old@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-id-123',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const keycloakData = new KeycloakUserDataDto(
        'keycloak-id-123',
        'new@example.com',
        'Test User',
        true,
      )

      // Act
      service.synchronizeUser(user, keycloakData)

      // Assert
      expect(user.email.value).toBe('new@example.com')
    })

    it('should not throw error if data is the same', () => {
      // Arrange
      const user = User.create({
        id: UserId.generate(),
        email: Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-id-123',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const keycloakData = new KeycloakUserDataDto(
        'keycloak-id-123',
        'test@example.com',
        'Test User',
        true,
      )

      // Act & Assert - should not throw
      expect(() => service.synchronizeUser(user, keycloakData)).not.toThrow()
    })

    it('should handle missing optional fields gracefully', () => {
      // Arrange
      const user = User.create({
        id: UserId.generate(),
        email: Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-id-123',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const keycloakData = new KeycloakUserDataDto(
        'keycloak-id-123',
        'test@example.com',
        'Updated Name',
      )

      // Act & Assert - should not throw
      expect(() => service.synchronizeUser(user, keycloakData)).not.toThrow()
      expect(user.name).toBe('Updated Name')
    })
  })
})
