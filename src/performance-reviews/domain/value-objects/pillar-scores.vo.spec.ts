import { PillarScores } from './pillar-scores.vo'
import { PillarScore } from './pillar-score.vo'

describe('PillarScores', () => {
  describe('create', () => {
    it('should create PillarScores with valid scores', () => {
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      expect(scores).toBeInstanceOf(PillarScores)
      expect(scores.projectImpact.value).toBe(3)
      expect(scores.direction.value).toBe(2)
      expect(scores.engineeringExcellence.value).toBe(4)
      expect(scores.operationalOwnership.value).toBe(3)
      expect(scores.peopleImpact.value).toBe(2)
    })

    it('should create PillarScores with all zeros', () => {
      const scores = PillarScores.create({
        projectImpact: 0,
        direction: 0,
        engineeringExcellence: 0,
        operationalOwnership: 0,
        peopleImpact: 0,
      })

      expect(scores.projectImpact.value).toBe(0)
      expect(scores.direction.value).toBe(0)
      expect(scores.engineeringExcellence.value).toBe(0)
      expect(scores.operationalOwnership.value).toBe(0)
      expect(scores.peopleImpact.value).toBe(0)
    })

    it('should create PillarScores with all max values', () => {
      const scores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })

      expect(scores.projectImpact.value).toBe(4)
      expect(scores.direction.value).toBe(4)
      expect(scores.engineeringExcellence.value).toBe(4)
      expect(scores.operationalOwnership.value).toBe(4)
      expect(scores.peopleImpact.value).toBe(4)
    })

    it('should throw error when any score is invalid', () => {
      expect(() =>
        PillarScores.create({
          projectImpact: 5, // Invalid
          direction: 2,
          engineeringExcellence: 3,
          operationalOwnership: 2,
          peopleImpact: 3,
        }),
      ).toThrow()

      expect(() =>
        PillarScores.create({
          projectImpact: 2,
          direction: -1, // Invalid
          engineeringExcellence: 3,
          operationalOwnership: 2,
          peopleImpact: 3,
        }),
      ).toThrow()
    })
  })

  describe('toObject', () => {
    it('should return plain object representation', () => {
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const obj = scores.toObject()

      expect(obj).toEqual({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })
    })
  })

  describe('equals', () => {
    it('should return true for equal PillarScores', () => {
      const scores1 = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const scores2 = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      expect(scores1.equals(scores2)).toBe(true)
    })

    it('should return false for different PillarScores', () => {
      const scores1 = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const scores2 = PillarScores.create({
        projectImpact: 2, // Different
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      expect(scores1.equals(scores2)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      expect(scores.equals(null as any)).toBe(false)
      expect(scores.equals(undefined as any)).toBe(false)
    })
  })

  describe('getters', () => {
    it('should expose all pillar scores', () => {
      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      expect(scores.projectImpact).toBeInstanceOf(PillarScore)
      expect(scores.direction).toBeInstanceOf(PillarScore)
      expect(scores.engineeringExcellence).toBeInstanceOf(PillarScore)
      expect(scores.operationalOwnership).toBeInstanceOf(PillarScore)
      expect(scores.peopleImpact).toBeInstanceOf(PillarScore)
    })
  })
})
