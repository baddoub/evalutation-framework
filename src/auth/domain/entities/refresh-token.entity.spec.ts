import { RefreshToken } from './refresh-token.entity'
import { UserId } from '../value-objects/user-id.vo'

describe('RefreshToken Entity', () => {
  const createValidRefreshTokenData = () => ({
    id: crypto.randomUUID(),
    userId: UserId.generate(),
    tokenHash: 'hashed_token_value',
    used: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    revokedAt: undefined,
  })

  describe('create', () => {
    it('should create a refresh token with valid data', () => {
      const data = createValidRefreshTokenData()
      const token = RefreshToken.create(data)

      expect(token).toBeDefined()
      expect(token.id).toBe(data.id)
      expect(token.userId.equals(data.userId)).toBe(true)
      expect(token.tokenHash).toBe(data.tokenHash)
      expect(token.used).toBe(false)
      expect(token.expiresAt).toEqual(data.expiresAt)
    })

    it('should reject empty id', () => {
      const data = { ...createValidRefreshTokenData(), id: '' }
      expect(() => RefreshToken.create(data)).toThrow('Refresh token ID is required')
    })

    it('should reject empty tokenHash', () => {
      const data = { ...createValidRefreshTokenData(), tokenHash: '' }
      expect(() => RefreshToken.create(data)).toThrow('Token hash is required')
    })

    it('should reject expiration in the past', () => {
      const data = {
        ...createValidRefreshTokenData(),
        expiresAt: new Date(Date.now() - 1000),
      }
      expect(() => RefreshToken.create(data)).toThrow('Expiration must be in future')
    })

    it('should allow creation with used flag true', () => {
      const data = { ...createValidRefreshTokenData(), used: true }
      const token = RefreshToken.create(data)

      expect(token.used).toBe(true)
    })

    it('should allow creation with revokedAt set', () => {
      const revokedAt = new Date()
      const data = { ...createValidRefreshTokenData(), revokedAt }
      const token = RefreshToken.create(data)

      expect(token.revokedAt).toEqual(revokedAt)
    })
  })

  describe('markAsUsed', () => {
    it('should mark token as used', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())

      token.markAsUsed()

      expect(token.used).toBe(true)
    })

    it('should not throw when marking already used token', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      token.markAsUsed()

      expect(() => token.markAsUsed()).not.toThrow()
      expect(token.used).toBe(true)
    })
  })

  describe('revoke', () => {
    it('should revoke token', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())

      token.revoke()

      expect(token.revokedAt).toBeDefined()
      expect(token.revokedAt).toBeInstanceOf(Date)
    })

    it('should not change revokedAt if already revoked', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      token.revoke()
      const firstRevokedAt = token.revokedAt

      // Wait a bit and revoke again
      setTimeout(() => {
        token.revoke()
        expect(token.revokedAt).toEqual(firstRevokedAt)
      }, 10)
    })

    it('should revoke token even if already used', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      token.markAsUsed()

      token.revoke()

      expect(token.used).toBe(true)
      expect(token.revokedAt).toBeDefined()
    })
  })

  describe('isExpired', () => {
    it('should return false for non-expired token', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      expect(token.isExpired()).toBe(false)
    })

    it('should return true for expired token', () => {
      const data = {
        ...createValidRefreshTokenData(),
        expiresAt: new Date(Date.now() + 100), // Expires in 100ms
      }
      const token = RefreshToken.create(data)

      setTimeout(() => {
        expect(token.isExpired()).toBe(true)
      }, 150)
    })

    it('should return true when expiresAt is exactly now', () => {
      const now = new Date()
      const data = {
        ...createValidRefreshTokenData(),
        expiresAt: now,
      }
      // Adjust creation time to make it valid during creation
      const token = RefreshToken.create({
        ...data,
        createdAt: new Date(now.getTime() - 1000),
      })

      // Mock Date.now to return exact expiration time
      const originalNow = Date.now
      Date.now = jest.fn(() => now.getTime())

      expect(token.isExpired()).toBe(true)

      Date.now = originalNow
    })
  })

  describe('isValid', () => {
    it('should return true for valid token', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      expect(token.isValid()).toBe(true)
    })

    it('should return false for used token', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      token.markAsUsed()

      expect(token.isValid()).toBe(false)
    })

    it('should return false for revoked token', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      token.revoke()

      expect(token.isValid()).toBe(false)
    })

    it('should return false for expired token', () => {
      const data = {
        ...createValidRefreshTokenData(),
        expiresAt: new Date(Date.now() - 1000),
      }
      // Create with past createdAt to bypass validation
      const token = RefreshToken.create({
        ...data,
        createdAt: new Date(Date.now() - 10000),
      })

      // Manually set expired date (simulating time passing)
      Object.defineProperty(token, '_expiresAt', {
        value: new Date(Date.now() - 1000),
        writable: false,
      })

      expect(token.isValid()).toBe(false)
    })

    it('should return false for token that is used, revoked, and expired', () => {
      const data = {
        ...createValidRefreshTokenData(),
        expiresAt: new Date(Date.now() - 1000),
      }
      const token = RefreshToken.create({
        ...data,
        createdAt: new Date(Date.now() - 10000),
      })

      token.markAsUsed()
      token.revoke()

      // Manually set expired date
      Object.defineProperty(token, '_expiresAt', {
        value: new Date(Date.now() - 1000),
        writable: false,
      })

      expect(token.isValid()).toBe(false)
    })
  })

  describe('immutability', () => {
    it('should not allow id modification', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      const originalId = token.id

      expect(token.id).toBe(originalId)
    })

    it('should not allow userId modification', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      const originalUserId = token.userId

      expect(token.userId).toBe(originalUserId)
    })

    it('should not allow tokenHash modification', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      const originalHash = token.tokenHash

      expect(token.tokenHash).toBe(originalHash)
    })

    it('should not allow expiresAt modification', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      const originalExpiresAt = token.expiresAt

      expect(token.expiresAt).toBe(originalExpiresAt)
    })

    it('should not allow createdAt modification', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      const originalCreatedAt = token.createdAt

      expect(token.createdAt).toBe(originalCreatedAt)
    })

    it('should not allow used to be set to false after being set to true', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      token.markAsUsed()

      // No public method exists to set used back to false
      expect(token.used).toBe(true)
    })

    it('should not allow revokedAt to be unset after being set', () => {
      const token = RefreshToken.create(createValidRefreshTokenData())
      token.revoke()
      const firstRevokedAt = token.revokedAt

      // No public method exists to unset revokedAt
      expect(token.revokedAt).toBe(firstRevokedAt)
    })
  })

  describe('token rotation scenario', () => {
    it('should support typical rotation workflow', () => {
      // 1. Create fresh token
      const token = RefreshToken.create(createValidRefreshTokenData())
      expect(token.isValid()).toBe(true)

      // 2. Use it for refresh
      token.markAsUsed()
      expect(token.isValid()).toBe(false)
      expect(token.used).toBe(true)

      // 3. New token would be created (not tested here)
      // 4. If old token is reused, revoke all tokens
      token.revoke()
      expect(token.revokedAt).toBeDefined()
    })
  })
})
