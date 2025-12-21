import { UserAuthorizationService } from './user-authorization.service'
import { User } from '../entities/user.entity'
import { Email } from '../value-objects/email.vo'
import { UserId } from '../value-objects/user-id.vo'
import { Role } from '../value-objects/role.vo'

describe('UserAuthorizationService', () => {
  let service: UserAuthorizationService

  beforeEach(() => {
    service = new UserAuthorizationService()
  })

  const createUser = (roles: Role[]): User => {
    return User.create({
      id: UserId.generate(),
      email: Email.create('test@example.com'),
      name: 'Test User',
      keycloakId: 'keycloak-123',
      roles,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  describe('canAccessUserResource', () => {
    it('should allow user to access their own resource', () => {
      const user = createUser([Role.user()])
      const resourceUserId = user.id

      const result = service.canAccessUserResource(user, resourceUserId)

      expect(result).toBe(true)
    })

    it('should deny user from accessing another users resource', () => {
      const user = createUser([Role.user()])
      const otherUserId = UserId.generate()

      const result = service.canAccessUserResource(user, otherUserId)

      expect(result).toBe(false)
    })

    it('should allow admin to access any users resource', () => {
      const admin = createUser([Role.admin()])
      const otherUserId = UserId.generate()

      const result = service.canAccessUserResource(admin, otherUserId)

      expect(result).toBe(true)
    })

    it('should allow admin to access their own resource', () => {
      const admin = createUser([Role.admin()])
      const resourceUserId = admin.id

      const result = service.canAccessUserResource(admin, resourceUserId)

      expect(result).toBe(true)
    })

    it('should allow manager to access any users resource', () => {
      const manager = createUser([Role.manager()])
      const otherUserId = UserId.generate()

      const result = service.canAccessUserResource(manager, otherUserId)

      expect(result).toBe(true)
    })
  })

  describe('hasElevatedPrivileges', () => {
    it('should return true for admin user', () => {
      const admin = createUser([Role.admin()])

      const result = service.hasElevatedPrivileges(admin)

      expect(result).toBe(true)
    })

    it('should return true for manager user', () => {
      const manager = createUser([Role.manager()])

      const result = service.hasElevatedPrivileges(manager)

      expect(result).toBe(true)
    })

    it('should return false for regular user', () => {
      const user = createUser([Role.user()])

      const result = service.hasElevatedPrivileges(user)

      expect(result).toBe(false)
    })

    it('should return true for user with both admin and user roles', () => {
      const user = createUser([Role.admin(), Role.user()])

      const result = service.hasElevatedPrivileges(user)

      expect(result).toBe(true)
    })

    it('should return true for user with both manager and user roles', () => {
      const user = createUser([Role.manager(), Role.user()])

      const result = service.hasElevatedPrivileges(user)

      expect(result).toBe(true)
    })
  })

  describe('canPerformAction', () => {
    it('should allow admin to perform any action', () => {
      const admin = createUser([Role.admin()])

      expect(service.canPerformAction(admin, 'user:create')).toBe(true)
      expect(service.canPerformAction(admin, 'user:read')).toBe(true)
      expect(service.canPerformAction(admin, 'user:update')).toBe(true)
      expect(service.canPerformAction(admin, 'user:delete')).toBe(true)
      expect(service.canPerformAction(admin, 'system:configure')).toBe(true)
    })

    it('should allow manager to perform management actions', () => {
      const manager = createUser([Role.manager()])

      expect(service.canPerformAction(manager, 'user:create')).toBe(true)
      expect(service.canPerformAction(manager, 'user:read')).toBe(true)
      expect(service.canPerformAction(manager, 'user:update')).toBe(true)
    })

    it('should deny manager from performing admin-only actions', () => {
      const manager = createUser([Role.manager()])

      expect(service.canPerformAction(manager, 'user:delete')).toBe(false)
      expect(service.canPerformAction(manager, 'system:configure')).toBe(false)
    })

    it('should allow regular user to perform basic actions', () => {
      const user = createUser([Role.user()])

      expect(service.canPerformAction(user, 'user:read')).toBe(true)
      expect(service.canPerformAction(user, 'profile:update')).toBe(true)
    })

    it('should deny regular user from performing privileged actions', () => {
      const user = createUser([Role.user()])

      expect(service.canPerformAction(user, 'user:create')).toBe(false)
      expect(service.canPerformAction(user, 'user:update')).toBe(false)
      expect(service.canPerformAction(user, 'user:delete')).toBe(false)
      expect(service.canPerformAction(user, 'system:configure')).toBe(false)
    })

    it('should deny unknown action for all users', () => {
      const admin = createUser([Role.admin()])
      const manager = createUser([Role.manager()])
      const user = createUser([Role.user()])

      expect(service.canPerformAction(admin, 'unknown:action')).toBe(false)
      expect(service.canPerformAction(manager, 'unknown:action')).toBe(false)
      expect(service.canPerformAction(user, 'unknown:action')).toBe(false)
    })
  })

  describe('requiresElevatedPrivileges', () => {
    it('should return true for admin-only actions', () => {
      expect(service.requiresElevatedPrivileges('user:delete')).toBe(true)
      expect(service.requiresElevatedPrivileges('system:configure')).toBe(true)
    })

    it('should return true for manager actions', () => {
      expect(service.requiresElevatedPrivileges('user:create')).toBe(true)
      expect(service.requiresElevatedPrivileges('user:update')).toBe(true)
    })

    it('should return false for basic user actions', () => {
      expect(service.requiresElevatedPrivileges('user:read')).toBe(false)
      expect(service.requiresElevatedPrivileges('profile:update')).toBe(false)
    })

    it('should return false for unknown actions', () => {
      expect(service.requiresElevatedPrivileges('unknown:action')).toBe(false)
    })
  })
})
