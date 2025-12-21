import { WeightedScore } from './weighted-score.vo'
import { InvalidWeightedScoreException } from '../exceptions'

describe('WeightedScore', () => {
  describe('fromValue', () => {
    it('should create WeightedScore with value 0', () => {
      const score = WeightedScore.fromValue(0)

      expect(score).toBeInstanceOf(WeightedScore)
      expect(score.value).toBe(0)
    })

    it('should create WeightedScore with value 2.5', () => {
      const score = WeightedScore.fromValue(2.5)

      expect(score.value).toBe(2.5)
    })

    it('should create WeightedScore with value 4', () => {
      const score = WeightedScore.fromValue(4)

      expect(score.value).toBe(4)
    })

    it('should throw InvalidWeightedScoreException for negative values', () => {
      expect(() => WeightedScore.fromValue(-0.1)).toThrow(InvalidWeightedScoreException)
      expect(() => WeightedScore.fromValue(-10)).toThrow(InvalidWeightedScoreException)
    })

    it('should throw InvalidWeightedScoreException for values greater than 4', () => {
      expect(() => WeightedScore.fromValue(4.1)).toThrow(InvalidWeightedScoreException)
      expect(() => WeightedScore.fromValue(10)).toThrow(InvalidWeightedScoreException)
    })

    it('should throw InvalidWeightedScoreException for null/undefined', () => {
      expect(() => WeightedScore.fromValue(null as any)).toThrow(InvalidWeightedScoreException)
      expect(() => WeightedScore.fromValue(undefined as any)).toThrow(InvalidWeightedScoreException)
    })

    it('should throw InvalidWeightedScoreException for NaN', () => {
      expect(() => WeightedScore.fromValue(NaN)).toThrow(InvalidWeightedScoreException)
    })
  })

  describe('percentage', () => {
    it('should calculate percentage for score 0', () => {
      const score = WeightedScore.fromValue(0)

      expect(score.percentage).toBe(0)
    })

    it('should calculate percentage for score 2', () => {
      const score = WeightedScore.fromValue(2)

      expect(score.percentage).toBe(50)
    })

    it('should calculate percentage for score 3', () => {
      const score = WeightedScore.fromValue(3)

      expect(score.percentage).toBe(75)
    })

    it('should calculate percentage for score 4', () => {
      const score = WeightedScore.fromValue(4)

      expect(score.percentage).toBe(100)
    })

    it('should calculate percentage for decimal score', () => {
      const score = WeightedScore.fromValue(2.5)

      expect(score.percentage).toBe(62.5)
    })

    it('should calculate percentage for score 3.4', () => {
      const score = WeightedScore.fromValue(3.4)

      expect(score.percentage).toBe(85)
    })
  })

  describe('bonusTier', () => {
    it('should return BELOW tier for percentage < 50', () => {
      const score = WeightedScore.fromValue(1.5) // 37.5%

      expect(score.bonusTier.value).toBe('BELOW')
    })

    it('should return MEETS tier for percentage 50-84', () => {
      const score1 = WeightedScore.fromValue(2.0) // 50%
      const score2 = WeightedScore.fromValue(3.0) // 75%

      expect(score1.bonusTier.value).toBe('MEETS')
      expect(score2.bonusTier.value).toBe('MEETS')
    })

    it('should return EXCEEDS tier for percentage >= 85', () => {
      const score1 = WeightedScore.fromValue(3.4) // 85%
      const score2 = WeightedScore.fromValue(4.0) // 100%

      expect(score1.bonusTier.value).toBe('EXCEEDS')
      expect(score2.bonusTier.value).toBe('EXCEEDS')
    })
  })

  describe('equals', () => {
    it('should return true for equal scores', () => {
      const score1 = WeightedScore.fromValue(2.5)
      const score2 = WeightedScore.fromValue(2.5)

      expect(score1.equals(score2)).toBe(true)
    })

    it('should return false for different scores', () => {
      const score1 = WeightedScore.fromValue(2.5)
      const score2 = WeightedScore.fromValue(3.0)

      expect(score1.equals(score2)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      const score = WeightedScore.fromValue(2.5)

      expect(score.equals(null as any)).toBe(false)
      expect(score.equals(undefined as any)).toBe(false)
    })
  })

  describe('value getter', () => {
    it('should return the score value', () => {
      const score = WeightedScore.fromValue(3.2)

      expect(score.value).toBe(3.2)
    })
  })

  describe('toString', () => {
    it('should return the score as string', () => {
      const score = WeightedScore.fromValue(3.2)

      expect(score.toString()).toBe('3.2')
    })
  })
})
