/**
 * Role Value Object Tests
 *
 * Following TDD: Write tests FIRST before implementation
 */

describe('Role Value Object', () => {
  describe('create', () => {
    it('should accept valid roles (admin, manager, user)', () => {
      const validRoles = ['admin', 'manager', 'user', 'Admin', 'MANAGER', 'USER']

      validRoles.forEach((roleStr) => {
        const role = Role.create(roleStr)
        expect(role).toBeDefined()
        expect(role.value).toBe(roleStr.toLowerCase())
      })
    })

    it('should reject invalid roles', () => {
      const invalidRoles = ['', 'superadmin', 'guest', 'moderator', '  ', 'admin123']

      invalidRoles.forEach((roleStr) => {
        expect(() => Role.create(roleStr)).toThrow(InvalidRoleException)
      })
    })

    it('should be case-insensitive', () => {
      const role1 = Role.create('ADMIN')
      const role2 = Role.create('admin')
      const role3 = Role.create('Admin')

      expect(role1.value).toBe('admin')
      expect(role2.value).toBe('admin')
      expect(role3.value).toBe('admin')
    })
  })

  describe('factory methods', () => {
    it('should create admin role', () => {
      const role = Role.admin()

      expect(role.value).toBe('admin')
      expect(role.isAdmin()).toBe(true)
    })

    it('should create manager role', () => {
      const role = Role.manager()

      expect(role.value).toBe('manager')
      expect(role.isAdmin()).toBe(false)
    })

    it('should create user role', () => {
      const role = Role.user()

      expect(role.value).toBe('user')
      expect(role.isAdmin()).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for roles with same value', () => {
      const role1 = Role.create('admin')
      const role2 = Role.create('admin')

      expect(role1.equals(role2)).toBe(true)
    })

    it('should return true for roles with different casing but same value', () => {
      const role1 = Role.create('ADMIN')
      const role2 = Role.create('admin')

      expect(role1.equals(role2)).toBe(true)
    })

    it('should return false for roles with different values', () => {
      const role1 = Role.create('admin')
      const role2 = Role.create('user')

      expect(role1.equals(role2)).toBe(false)
    })

    it('should return false when comparing with null', () => {
      const role = Role.admin()

      expect(role.equals(null as any)).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const adminRole = Role.admin()

      expect(adminRole.isAdmin()).toBe(true)
    })

    it('should return false for manager role', () => {
      const managerRole = Role.manager()

      expect(managerRole.isAdmin()).toBe(false)
    })

    it('should return false for user role', () => {
      const userRole = Role.user()

      expect(userRole.isAdmin()).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return role value as string', () => {
      const role = Role.create('manager')

      expect(role.toString()).toBe('manager')
    })
  })

  describe('immutability', () => {
    it('should not allow modification of value after creation', () => {
      const role = Role.admin()
      const originalValue = role.value

      expect(role.value).toBe(originalValue)
      expect(role.value).toBe('admin')
    })
  })
})

// Import after test definition
import { Role } from './role.vo'
import { InvalidRoleException } from '../exceptions/invalid-role.exception'
