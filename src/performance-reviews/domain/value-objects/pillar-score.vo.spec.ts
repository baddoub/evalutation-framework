import { PillarScore } from './pillar-score.vo'
import { InvalidPillarScoreException } from '../exceptions'

describe('PillarScore', () => {
  describe('fromValue', () => {
    it('should create PillarScore with value 0', () => {
      const score = PillarScore.fromValue(0)

      expect(score).toBeInstanceOf(PillarScore)
      expect(score.value).toBe(0)
    })

    it('should create PillarScore with value 1', () => {
      const score = PillarScore.fromValue(1)

      expect(score.value).toBe(1)
    })

    it('should create PillarScore with value 2', () => {
      const score = PillarScore.fromValue(2)

      expect(score.value).toBe(2)
    })

    it('should create PillarScore with value 3', () => {
      const score = PillarScore.fromValue(3)

      expect(score.value).toBe(3)
    })

    it('should create PillarScore with value 4', () => {
      const score = PillarScore.fromValue(4)

      expect(score.value).toBe(4)
    })

    it('should throw InvalidPillarScoreException for negative values', () => {
      expect(() => PillarScore.fromValue(-1)).toThrow(InvalidPillarScoreException)
      expect(() => PillarScore.fromValue(-10)).toThrow(InvalidPillarScoreException)
    })

    it('should throw InvalidPillarScoreException for values greater than 4', () => {
      expect(() => PillarScore.fromValue(5)).toThrow(InvalidPillarScoreException)
      expect(() => PillarScore.fromValue(10)).toThrow(InvalidPillarScoreException)
    })

    it('should throw InvalidPillarScoreException for non-integer values', () => {
      expect(() => PillarScore.fromValue(2.5)).toThrow(InvalidPillarScoreException)
      expect(() => PillarScore.fromValue(3.14)).toThrow(InvalidPillarScoreException)
    })

    it('should throw InvalidPillarScoreException for null/undefined', () => {
      expect(() => PillarScore.fromValue(null as any)).toThrow(InvalidPillarScoreException)
      expect(() => PillarScore.fromValue(undefined as any)).toThrow(InvalidPillarScoreException)
    })

    it('should throw InvalidPillarScoreException for NaN', () => {
      expect(() => PillarScore.fromValue(NaN)).toThrow(InvalidPillarScoreException)
    })
  })

  describe('equals', () => {
    it('should return true for equal scores', () => {
      const score1 = PillarScore.fromValue(3)
      const score2 = PillarScore.fromValue(3)

      expect(score1.equals(score2)).toBe(true)
    })

    it('should return false for different scores', () => {
      const score1 = PillarScore.fromValue(2)
      const score2 = PillarScore.fromValue(3)

      expect(score1.equals(score2)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      const score = PillarScore.fromValue(2)

      expect(score.equals(null as any)).toBe(false)
      expect(score.equals(undefined as any)).toBe(false)
    })
  })

  describe('value getter', () => {
    it('should return the score value', () => {
      const score = PillarScore.fromValue(3)

      expect(score.value).toBe(3)
    })
  })

  describe('toString', () => {
    it('should return the score as string', () => {
      const score = PillarScore.fromValue(3)

      expect(score.toString()).toBe('3')
    })
  })
})
