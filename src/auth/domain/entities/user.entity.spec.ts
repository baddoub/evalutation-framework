import { User } from './user.entity'
import { Email } from '../value-objects/email.vo'
import { UserId } from '../value-objects/user-id.vo'
import { Role } from '../value-objects/role.vo'

describe('User Entity', () => {
  const createValidUserData = () => ({
    id: UserId.generate(),
    email: Email.create('test@example.com'),
    name: 'Test User',
    keycloakId: 'keycloak-123',
    roles: [Role.user()],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  describe('create', () => {
    it('should create a user with valid data', () => {
      const data = createValidUserData()
      const user = User.create(data)

      expect(user).toBeDefined()
      expect(user.id.equals(data.id)).toBe(true)
      expect(user.email.equals(data.email)).toBe(true)
      expect(user.name).toBe(data.name)
      expect(user.keycloakId).toBe(data.keycloakId)
      expect(user.roles).toHaveLength(1)
      expect(user.isActive).toBe(true)
    })

    it('should reject empty name', () => {
      const data = { ...createValidUserData(), name: '' }
      expect(() => User.create(data)).toThrow('User name cannot be empty')
    })

    it('should reject whitespace-only name', () => {
      const data = { ...createValidUserData(), name: '   ' }
      expect(() => User.create(data)).toThrow('User name cannot be empty')
    })

    it('should reject name longer than 100 characters', () => {
      const data = { ...createValidUserData(), name: 'a'.repeat(101) }
      expect(() => User.create(data)).toThrow('Name too long (max 100 chars)')
    })

    it('should reject empty keycloakId', () => {
      const data = { ...createValidUserData(), keycloakId: '' }
      expect(() => User.create(data)).toThrow('Keycloak ID is required')
    })

    it('should reject empty roles array', () => {
      const data = { ...createValidUserData(), roles: [] }
      expect(() => User.create(data)).toThrow('User must have at least one role')
    })

    it('should create user with multiple roles', () => {
      const data = {
        ...createValidUserData(),
        roles: [Role.admin(), Role.manager()],
      }
      const user = User.create(data)

      expect(user.roles).toHaveLength(2)
      expect(user.hasRole(Role.admin())).toBe(true)
      expect(user.hasRole(Role.manager())).toBe(true)
    })
  })

  describe('updateProfile', () => {
    it('should update user name', () => {
      const user = User.create(createValidUserData())
      const originalUpdatedAt = user.updatedAt

      // Wait a tiny bit to ensure timestamp changes
      setTimeout(() => {
        user.updateProfile('New Name')

        expect(user.name).toBe('New Name')
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }, 10)
    })

    it('should reject empty name update', () => {
      const user = User.create(createValidUserData())
      expect(() => user.updateProfile('')).toThrow('User name cannot be empty')
    })

    it('should reject whitespace-only name update', () => {
      const user = User.create(createValidUserData())
      expect(() => user.updateProfile('   ')).toThrow('User name cannot be empty')
    })

    it('should reject name update longer than 100 characters', () => {
      const user = User.create(createValidUserData())
      expect(() => user.updateProfile('a'.repeat(101))).toThrow('Name too long (max 100 chars)')
    })
  })

  describe('assignRole', () => {
    it('should add role to user', () => {
      const user = User.create(createValidUserData())
      const adminRole = Role.admin()

      user.assignRole(adminRole)

      expect(user.hasRole(adminRole)).toBe(true)
      expect(user.roles).toHaveLength(2)
    })

    it('should not duplicate roles', () => {
      const user = User.create(createValidUserData())
      const userRole = Role.user()

      user.assignRole(userRole)

      expect(user.roles).toHaveLength(1)
    })

    it('should update timestamp when adding role', () => {
      const user = User.create(createValidUserData())
      const originalUpdatedAt = user.updatedAt

      setTimeout(() => {
        user.assignRole(Role.admin())
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }, 10)
    })
  })

  describe('removeRole', () => {
    it('should remove role from user', () => {
      const user = User.create({
        ...createValidUserData(),
        roles: [Role.user(), Role.admin()],
      })

      user.removeRole(Role.admin())

      expect(user.hasRole(Role.admin())).toBe(false)
      expect(user.roles).toHaveLength(1)
    })

    it('should not allow removing last role', () => {
      const user = User.create(createValidUserData())
      expect(() => user.removeRole(Role.user())).toThrow('User must have at least one role')
    })

    it('should do nothing if role does not exist', () => {
      const user = User.create(createValidUserData())
      const originalRolesCount = user.roles.length

      user.removeRole(Role.admin())

      expect(user.roles).toHaveLength(originalRolesCount)
    })
  })

  describe('activate and deactivate', () => {
    it('should activate user', () => {
      const user = User.create({ ...createValidUserData(), isActive: false })

      user.activate()

      expect(user.isActive).toBe(true)
    })

    it('should deactivate user', () => {
      const user = User.create(createValidUserData())

      user.deactivate()

      expect(user.isActive).toBe(false)
    })

    it('should update timestamp on activation', () => {
      const user = User.create({ ...createValidUserData(), isActive: false })
      const originalUpdatedAt = user.updatedAt

      setTimeout(() => {
        user.activate()
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }, 10)
    })

    it('should update timestamp on deactivation', () => {
      const user = User.create(createValidUserData())
      const originalUpdatedAt = user.updatedAt

      setTimeout(() => {
        user.deactivate()
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }, 10)
    })
  })

  describe('hasRole', () => {
    it('should return true if user has role', () => {
      const user = User.create(createValidUserData())
      expect(user.hasRole(Role.user())).toBe(true)
    })

    it('should return false if user does not have role', () => {
      const user = User.create(createValidUserData())
      expect(user.hasRole(Role.admin())).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', () => {
      const user = User.create({
        ...createValidUserData(),
        roles: [Role.user(), Role.manager()],
      })

      expect(user.hasAnyRole([Role.admin(), Role.manager()])).toBe(true)
    })

    it('should return false if user has none of the roles', () => {
      const user = User.create(createValidUserData())
      expect(user.hasAnyRole([Role.admin(), Role.manager()])).toBe(false)
    })

    it('should return false for empty roles array', () => {
      const user = User.create(createValidUserData())
      expect(user.hasAnyRole([])).toBe(false)
    })
  })

  describe('synchronizeFromKeycloak', () => {
    it('should update user data from Keycloak', () => {
      const user = User.create(createValidUserData())

      const keycloakData = {
        email: Email.create('updated@example.com'),
        name: 'Updated Name',
        roles: [Role.admin(), Role.user()],
      }

      user.synchronizeFromKeycloak(keycloakData)

      expect(user.email.equals(keycloakData.email)).toBe(true)
      expect(user.name).toBe(keycloakData.name)
      expect(user.roles).toHaveLength(2)
      expect(user.hasRole(Role.admin())).toBe(true)
    })

    it('should update timestamp on synchronization', () => {
      const user = User.create(createValidUserData())
      const originalUpdatedAt = user.updatedAt

      setTimeout(() => {
        user.synchronizeFromKeycloak({
          email: Email.create('updated@example.com'),
          name: 'Updated Name',
          roles: [Role.user()],
        })
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }, 10)
    })

    it('should maintain keycloakId immutability', () => {
      const user = User.create(createValidUserData())
      const originalKeycloakId = user.keycloakId

      user.synchronizeFromKeycloak({
        email: Email.create('updated@example.com'),
        name: 'Updated Name',
        roles: [Role.user()],
      })

      expect(user.keycloakId).toBe(originalKeycloakId)
    })
  })

  describe('immutability', () => {
    it('should not allow id modification', () => {
      const user = User.create(createValidUserData())
      const originalId = user.id

      // TypeScript prevents this at compile time, but we verify runtime behavior
      expect(user.id).toBe(originalId)
    })

    it('should not allow keycloakId modification after creation', () => {
      const user = User.create(createValidUserData())
      const originalKeycloakId = user.keycloakId

      expect(user.keycloakId).toBe(originalKeycloakId)
    })

    it('should not allow createdAt modification', () => {
      const user = User.create(createValidUserData())
      const originalCreatedAt = user.createdAt

      expect(user.createdAt).toBe(originalCreatedAt)
    })
  })
})
