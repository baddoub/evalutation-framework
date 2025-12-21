import { EngineerLevel } from './engineer-level.vo'
import { InvalidEngineerLevelException } from '../exceptions'

describe('EngineerLevel', () => {
  describe('static factory methods', () => {
    it('should create JUNIOR level', () => {
      const level = EngineerLevel.JUNIOR

      expect(level).toBeInstanceOf(EngineerLevel)
      expect(level.value).toBe('JUNIOR')
    })

    it('should create MID level', () => {
      const level = EngineerLevel.MID

      expect(level).toBeInstanceOf(EngineerLevel)
      expect(level.value).toBe('MID')
    })

    it('should create SENIOR level', () => {
      const level = EngineerLevel.SENIOR

      expect(level).toBeInstanceOf(EngineerLevel)
      expect(level.value).toBe('SENIOR')
    })

    it('should create LEAD level', () => {
      const level = EngineerLevel.LEAD

      expect(level).toBeInstanceOf(EngineerLevel)
      expect(level.value).toBe('LEAD')
    })

    it('should create MANAGER level', () => {
      const level = EngineerLevel.MANAGER

      expect(level).toBeInstanceOf(EngineerLevel)
      expect(level.value).toBe('MANAGER')
    })
  })

  describe('fromString', () => {
    it('should create JUNIOR level from string', () => {
      const level = EngineerLevel.fromString('JUNIOR')

      expect(level.value).toBe('JUNIOR')
    })

    it('should create MID level from string', () => {
      const level = EngineerLevel.fromString('MID')

      expect(level.value).toBe('MID')
    })

    it('should create SENIOR level from string', () => {
      const level = EngineerLevel.fromString('SENIOR')

      expect(level.value).toBe('SENIOR')
    })

    it('should create LEAD level from string', () => {
      const level = EngineerLevel.fromString('LEAD')

      expect(level.value).toBe('LEAD')
    })

    it('should create MANAGER level from string', () => {
      const level = EngineerLevel.fromString('MANAGER')

      expect(level.value).toBe('MANAGER')
    })

    it('should normalize to uppercase', () => {
      const level = EngineerLevel.fromString('junior')

      expect(level.value).toBe('JUNIOR')
    })

    it('should trim whitespace', () => {
      const level = EngineerLevel.fromString('  SENIOR  ')

      expect(level.value).toBe('SENIOR')
    })

    it('should throw InvalidEngineerLevelException for empty string', () => {
      expect(() => EngineerLevel.fromString('')).toThrow(InvalidEngineerLevelException)
      expect(() => EngineerLevel.fromString('   ')).toThrow(InvalidEngineerLevelException)
    })

    it('should throw InvalidEngineerLevelException for null/undefined', () => {
      expect(() => EngineerLevel.fromString(null as any)).toThrow(InvalidEngineerLevelException)
      expect(() => EngineerLevel.fromString(undefined as any)).toThrow(InvalidEngineerLevelException)
    })

    it('should throw InvalidEngineerLevelException for invalid level', () => {
      expect(() => EngineerLevel.fromString('INVALID')).toThrow(InvalidEngineerLevelException)
      expect(() => EngineerLevel.fromString('PRINCIPAL')).toThrow(InvalidEngineerLevelException)
    })

    it('should provide helpful error message with valid levels', () => {
      expect(() => EngineerLevel.fromString('INVALID'))
        .toThrow(/JUNIOR, MID, SENIOR, LEAD, MANAGER/)
    })
  })

  describe('equals', () => {
    it('should return true for equal levels', () => {
      const level1 = EngineerLevel.SENIOR
      const level2 = EngineerLevel.fromString('SENIOR')

      expect(level1.equals(level2)).toBe(true)
    })

    it('should return false for different levels', () => {
      const level1 = EngineerLevel.JUNIOR
      const level2 = EngineerLevel.SENIOR

      expect(level1.equals(level2)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      const level = EngineerLevel.SENIOR

      expect(level.equals(null as any)).toBe(false)
      expect(level.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the level string value', () => {
      const level = EngineerLevel.SENIOR

      expect(level.toString()).toBe('SENIOR')
    })
  })

  describe('value getter', () => {
    it('should return the level value', () => {
      const level = EngineerLevel.LEAD

      expect(level.value).toBe('LEAD')
    })
  })

  describe('helper methods', () => {
    it('should check if level is JUNIOR', () => {
      expect(EngineerLevel.JUNIOR.isJunior()).toBe(true)
      expect(EngineerLevel.MID.isJunior()).toBe(false)
    })

    it('should check if level is MID', () => {
      expect(EngineerLevel.MID.isMid()).toBe(true)
      expect(EngineerLevel.SENIOR.isMid()).toBe(false)
    })

    it('should check if level is SENIOR', () => {
      expect(EngineerLevel.SENIOR.isSenior()).toBe(true)
      expect(EngineerLevel.LEAD.isSenior()).toBe(false)
    })

    it('should check if level is LEAD', () => {
      expect(EngineerLevel.LEAD.isLead()).toBe(true)
      expect(EngineerLevel.MANAGER.isLead()).toBe(false)
    })

    it('should check if level is MANAGER', () => {
      expect(EngineerLevel.MANAGER.isManager()).toBe(true)
      expect(EngineerLevel.SENIOR.isManager()).toBe(false)
    })
  })
})
