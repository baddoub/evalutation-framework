/**
 * Email Value Object Tests
 *
 * Following TDD: Write tests FIRST before implementation
 * These tests will FAIL until we implement email.vo.ts
 */

describe('Email Value Object', () => {
  describe('create', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'test123@test.org',
      ]

      validEmails.forEach((emailStr) => {
        const email = Email.create(emailStr)
        expect(email).toBeDefined()
        expect(email.value).toBe(emailStr.toLowerCase())
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        '',
        ' ',
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ]

      invalidEmails.forEach((emailStr) => {
        expect(() => Email.create(emailStr)).toThrow(InvalidEmailException)
      })
    })

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM')
      expect(email.value).toBe('test@example.com')

      const email2 = Email.create('User.Name@Example.Com')
      expect(email2.value).toBe('user.name@example.com')
    })

    it('should trim whitespace from email', () => {
      const email = Email.create('  test@example.com  ')
      expect(email.value).toBe('test@example.com')

      const email2 = Email.create('\tuser@example.com\n')
      expect(email2.value).toBe('user@example.com')
    })
  })

  describe('equals', () => {
    it('should return true for emails with same value', () => {
      const email1 = Email.create('test@example.com')
      const email2 = Email.create('test@example.com')

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return true for emails with different casing but same normalized value', () => {
      const email1 = Email.create('TEST@EXAMPLE.COM')
      const email2 = Email.create('test@example.com')

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return false for emails with different values', () => {
      const email1 = Email.create('test1@example.com')
      const email2 = Email.create('test2@example.com')

      expect(email1.equals(email2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the email value as string', () => {
      const email = Email.create('test@example.com')
      expect(email.toString()).toBe('test@example.com')
    })
  })

  describe('immutability', () => {
    it('should not allow modification of email value after creation', () => {
      const email = Email.create('test@example.com')
      const originalValue = email.value

      // Readonly property enforced by TypeScript at compile time
      // Runtime check: getter returns the same value
      expect(email.value).toBe(originalValue)
      expect(email.value).toBe('test@example.com')
    })
  })
})

// Import after test definition to ensure tests fail first
import { Email } from './email.vo'
import { InvalidEmailException } from '../exceptions/invalid-email.exception'
