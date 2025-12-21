import { BonusTier } from './bonus-tier.vo'

describe('BonusTier', () => {
  describe('static factory methods', () => {
    it('should create EXCEEDS tier', () => {
      const tier = BonusTier.EXCEEDS

      expect(tier).toBeInstanceOf(BonusTier)
      expect(tier.value).toBe('EXCEEDS')
    })

    it('should create MEETS tier', () => {
      const tier = BonusTier.MEETS

      expect(tier).toBeInstanceOf(BonusTier)
      expect(tier.value).toBe('MEETS')
    })

    it('should create BELOW tier', () => {
      const tier = BonusTier.BELOW

      expect(tier).toBeInstanceOf(BonusTier)
      expect(tier.value).toBe('BELOW')
    })
  })

  describe('fromPercentage', () => {
    it('should return EXCEEDS for percentage >= 85', () => {
      expect(BonusTier.fromPercentage(85).value).toBe('EXCEEDS')
      expect(BonusTier.fromPercentage(90).value).toBe('EXCEEDS')
      expect(BonusTier.fromPercentage(100).value).toBe('EXCEEDS')
      expect(BonusTier.fromPercentage(110).value).toBe('EXCEEDS') // Edge case
    })

    it('should return MEETS for percentage between 50 and 84', () => {
      expect(BonusTier.fromPercentage(50).value).toBe('MEETS')
      expect(BonusTier.fromPercentage(70).value).toBe('MEETS')
      expect(BonusTier.fromPercentage(84).value).toBe('MEETS')
      expect(BonusTier.fromPercentage(84.9).value).toBe('MEETS')
    })

    it('should return BELOW for percentage < 50', () => {
      expect(BonusTier.fromPercentage(0).value).toBe('BELOW')
      expect(BonusTier.fromPercentage(25).value).toBe('BELOW')
      expect(BonusTier.fromPercentage(49).value).toBe('BELOW')
      expect(BonusTier.fromPercentage(49.9).value).toBe('BELOW')
    })

    it('should handle negative percentages', () => {
      expect(BonusTier.fromPercentage(-10).value).toBe('BELOW')
    })
  })

  describe('equals', () => {
    it('should return true for equal tiers', () => {
      const tier1 = BonusTier.EXCEEDS
      const tier2 = BonusTier.fromPercentage(90)

      expect(tier1.equals(tier2)).toBe(true)
    })

    it('should return false for different tiers', () => {
      const tier1 = BonusTier.EXCEEDS
      const tier2 = BonusTier.MEETS

      expect(tier1.equals(tier2)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      const tier = BonusTier.EXCEEDS

      expect(tier.equals(null as any)).toBe(false)
      expect(tier.equals(undefined as any)).toBe(false)
    })
  })

  describe('helper methods', () => {
    it('should check if tier is EXCEEDS', () => {
      expect(BonusTier.EXCEEDS.isExceeds()).toBe(true)
      expect(BonusTier.MEETS.isExceeds()).toBe(false)
      expect(BonusTier.BELOW.isExceeds()).toBe(false)
    })

    it('should check if tier is MEETS', () => {
      expect(BonusTier.MEETS.isMeets()).toBe(true)
      expect(BonusTier.EXCEEDS.isMeets()).toBe(false)
      expect(BonusTier.BELOW.isMeets()).toBe(false)
    })

    it('should check if tier is BELOW', () => {
      expect(BonusTier.BELOW.isBelow()).toBe(true)
      expect(BonusTier.EXCEEDS.isBelow()).toBe(false)
      expect(BonusTier.MEETS.isBelow()).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the tier string value', () => {
      expect(BonusTier.EXCEEDS.toString()).toBe('EXCEEDS')
      expect(BonusTier.MEETS.toString()).toBe('MEETS')
      expect(BonusTier.BELOW.toString()).toBe('BELOW')
    })
  })

  describe('value getter', () => {
    it('should return the tier value', () => {
      expect(BonusTier.EXCEEDS.value).toBe('EXCEEDS')
      expect(BonusTier.MEETS.value).toBe('MEETS')
      expect(BonusTier.BELOW.value).toBe('BELOW')
    })
  })
})
