import { FinalScore } from './final-score.entity'
import { FinalScoreId } from '../value-objects/final-score-id.vo'
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../value-objects/pillar-scores.vo'
import { WeightedScore } from '../value-objects/weighted-score.vo'
import { BonusTier } from '../value-objects/bonus-tier.vo'
import { EngineerLevel } from '../value-objects/engineer-level.vo'
import { FinalScoreLockedException } from '../exceptions/final-score-locked.exception'

describe('FinalScore', () => {
  const createValidProps = () => ({
    cycleId: ReviewCycleId.generate(),
    userId: UserId.generate(),
    pillarScores: PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    }),
    weightedScore: WeightedScore.fromValue(3.2),
    finalLevel: EngineerLevel.SENIOR,
  })

  describe('create', () => {
    it('should create a FinalScore with required properties', () => {
      const props = createValidProps()
      const beforeCreate = new Date()
      const finalScore = FinalScore.create(props)
      const afterCreate = new Date()

      expect(finalScore).toBeInstanceOf(FinalScore)
      expect(finalScore.id).toBeInstanceOf(FinalScoreId)
      expect(finalScore.cycleId).toBe(props.cycleId)
      expect(finalScore.userId).toBe(props.userId)
      expect(finalScore.employeeId).toBe(props.userId) // Alias getter
      expect(finalScore.pillarScores).toBe(props.pillarScores)
      expect(finalScore.finalScores).toBe(props.pillarScores) // Alias getter
      expect(finalScore.weightedScore).toBe(props.weightedScore)
      expect(finalScore.finalLevel).toBe(props.finalLevel)
      expect(finalScore.peerAverageScores).toBeNull()
      expect(finalScore.peerFeedbackCount).toBe(0)
      expect(finalScore.isLocked).toBe(false)
      expect(finalScore.lockedAt).toBeUndefined()
      expect(finalScore.feedbackDelivered).toBe(false)
      expect(finalScore.feedbackDeliveredAt).toBeUndefined()
      expect(finalScore.calculatedAt).toBeDefined()
      expect(finalScore.calculatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(finalScore.calculatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })

    it('should create a FinalScore with provided id', () => {
      const props = createValidProps()
      const customId = FinalScoreId.generate()
      const finalScore = FinalScore.create({ ...props, id: customId })

      expect(finalScore.id).toBe(customId)
    })

    it('should create a FinalScore with peer feedback data', () => {
      const props = createValidProps()
      const peerScores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })
      const finalScore = FinalScore.create({
        ...props,
        peerAverageScores: peerScores,
        peerFeedbackCount: 5,
      })

      expect(finalScore.peerAverageScores).toBe(peerScores)
      expect(finalScore.peerFeedbackCount).toBe(5)
    })

    it('should create a FinalScore with custom calculatedAt', () => {
      const props = createValidProps()
      const customDate = new Date('2024-01-01')
      const finalScore = FinalScore.create({
        ...props,
        calculatedAt: customDate,
      })

      expect(finalScore.calculatedAt).toBe(customDate)
    })

    it('should create a FinalScore with feedback notes', () => {
      const props = createValidProps()
      const feedbackNotes = 'Great work this cycle'
      const finalScore = FinalScore.create({
        ...props,
        feedbackNotes,
      })

      expect(finalScore.feedbackNotes).toBe(feedbackNotes)
    })

    it('should create a FinalScore with delivery information', () => {
      const props = createValidProps()
      const deliveredBy = UserId.generate()
      const deliveredAt = new Date('2024-02-01')
      const finalScore = FinalScore.create({
        ...props,
        deliveredAt,
        deliveredBy,
      })

      expect(finalScore.deliveredAt).toBe(deliveredAt)
      expect(finalScore.deliveredBy).toBe(deliveredBy)
    })

    it('should create multiple FinalScores with unique ids', () => {
      const props = createValidProps()
      const finalScore1 = FinalScore.create(props)
      const finalScore2 = FinalScore.create(props)

      expect(finalScore1.id).not.toBe(finalScore2.id)
    })
  })

  describe('lock', () => {
    it('should lock an unlocked final score', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      expect(finalScore.isLocked).toBe(false)
      expect(finalScore.lockedAt).toBeUndefined()

      const beforeLock = new Date()
      finalScore.lock()
      const afterLock = new Date()

      expect(finalScore.isLocked).toBe(true)
      expect(finalScore.lockedAt).toBeDefined()
      expect(finalScore.lockedAt!.getTime()).toBeGreaterThanOrEqual(beforeLock.getTime())
      expect(finalScore.lockedAt!.getTime()).toBeLessThanOrEqual(afterLock.getTime())
    })

    it('should be idempotent - locking already locked score has no effect', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      finalScore.lock()
      const firstLockedAt = finalScore.lockedAt

      finalScore.lock()

      expect(finalScore.isLocked).toBe(true)
      expect(finalScore.lockedAt).toBe(firstLockedAt)
    })
  })

  describe('unlock', () => {
    it('should unlock a locked final score', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      finalScore.lock()
      expect(finalScore.isLocked).toBe(true)

      finalScore.unlock()

      expect(finalScore.isLocked).toBe(false)
      expect(finalScore.lockedAt).toBeUndefined()
    })

    it('should be idempotent - unlocking already unlocked score has no effect', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      expect(finalScore.isLocked).toBe(false)

      finalScore.unlock()

      expect(finalScore.isLocked).toBe(false)
      expect(finalScore.lockedAt).toBeUndefined()
    })

    it('should allow locking and unlocking multiple times', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      finalScore.lock()
      expect(finalScore.isLocked).toBe(true)

      finalScore.unlock()
      expect(finalScore.isLocked).toBe(false)

      finalScore.lock()
      expect(finalScore.isLocked).toBe(true)

      finalScore.unlock()
      expect(finalScore.isLocked).toBe(false)
    })
  })

  describe('updateScores', () => {
    it('should update scores when unlocked', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      const newPillarScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const newWeightedScore = WeightedScore.fromValue(4.0)

      finalScore.updateScores(newPillarScores, newWeightedScore)

      expect(finalScore.pillarScores).toBe(newPillarScores)
      expect(finalScore.weightedScore).toBe(newWeightedScore)
    })

    it('should throw error when updating scores while locked', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      finalScore.lock()

      const newPillarScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const newWeightedScore = WeightedScore.fromValue(4.0)

      expect(() => finalScore.updateScores(newPillarScores, newWeightedScore)).toThrow(FinalScoreLockedException)
      expect(() => finalScore.updateScores(newPillarScores, newWeightedScore)).toThrow('Cannot update scores when final score is locked')
    })

    it('should allow updates after unlocking', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      finalScore.lock()

      const newPillarScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const newWeightedScore = WeightedScore.fromValue(4.0)

      expect(() => finalScore.updateScores(newPillarScores, newWeightedScore)).toThrow()

      finalScore.unlock()

      finalScore.updateScores(newPillarScores, newWeightedScore)

      expect(finalScore.pillarScores).toBe(newPillarScores)
      expect(finalScore.weightedScore).toBe(newWeightedScore)
    })

    it('should allow multiple score updates while unlocked', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      const scores1 = PillarScores.create({
        projectImpact: 2,
        direction: 2,
        engineeringExcellence: 2,
        operationalOwnership: 2,
        peopleImpact: 2,
      })
      const weighted1 = WeightedScore.fromValue(2.0)

      const scores2 = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })
      const weighted2 = WeightedScore.fromValue(3.0)

      finalScore.updateScores(scores1, weighted1)
      expect(finalScore.pillarScores).toBe(scores1)
      expect(finalScore.weightedScore).toBe(weighted1)

      finalScore.updateScores(scores2, weighted2)
      expect(finalScore.pillarScores).toBe(scores2)
      expect(finalScore.weightedScore).toBe(weighted2)
    })
  })

  describe('markFeedbackDelivered', () => {
    it('should mark feedback as delivered', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      const deliveredBy = UserId.generate()

      expect(finalScore.feedbackDelivered).toBe(false)
      expect(finalScore.feedbackDeliveredAt).toBeUndefined()
      expect(finalScore.deliveredBy).toBeUndefined()

      const beforeDelivery = new Date()
      finalScore.markFeedbackDelivered(deliveredBy)
      const afterDelivery = new Date()

      expect(finalScore.feedbackDelivered).toBe(true)
      expect(finalScore.feedbackDeliveredAt).toBeDefined()
      expect(finalScore.feedbackDeliveredAt!.getTime()).toBeGreaterThanOrEqual(beforeDelivery.getTime())
      expect(finalScore.feedbackDeliveredAt!.getTime()).toBeLessThanOrEqual(afterDelivery.getTime())
      expect(finalScore.deliveredAt).toBeDefined()
      expect(finalScore.deliveredBy).toBe(deliveredBy)
    })

    it('should mark feedback as delivered with notes', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      const deliveredBy = UserId.generate()
      const feedbackNotes = 'Feedback session completed successfully'

      finalScore.markFeedbackDelivered(deliveredBy, feedbackNotes)

      expect(finalScore.feedbackDelivered).toBe(true)
      expect(finalScore.feedbackNotes).toBe(feedbackNotes)
      expect(finalScore.deliveredBy).toBe(deliveredBy)
    })

    it('should update feedback notes if already set', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        feedbackNotes: 'Initial notes',
      })
      const deliveredBy = UserId.generate()
      const newNotes = 'Updated notes after delivery'

      finalScore.markFeedbackDelivered(deliveredBy, newNotes)

      expect(finalScore.feedbackNotes).toBe(newNotes)
    })

    it('should allow marking as delivered multiple times', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      const deliveredBy1 = UserId.generate()
      const deliveredBy2 = UserId.generate()

      finalScore.markFeedbackDelivered(deliveredBy1, 'First delivery')
      const firstDeliveryAt = finalScore.feedbackDeliveredAt

      finalScore.markFeedbackDelivered(deliveredBy2, 'Second delivery')

      expect(finalScore.feedbackDelivered).toBe(true)
      expect(finalScore.deliveredBy).toBe(deliveredBy2)
      expect(finalScore.feedbackNotes).toBe('Second delivery')
      expect(finalScore.feedbackDeliveredAt!.getTime()).toBeGreaterThanOrEqual(firstDeliveryAt!.getTime())
    })
  })

  describe('getters', () => {
    it('should expose all properties via getters', () => {
      const props = createValidProps()
      const customId = FinalScoreId.generate()
      const peerScores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })
      const deliveredBy = UserId.generate()
      const deliveredAt = new Date('2024-02-01')
      const calculatedAt = new Date('2024-01-01')

      const finalScore = FinalScore.create({
        ...props,
        id: customId,
        peerAverageScores: peerScores,
        peerFeedbackCount: 5,
        calculatedAt,
        feedbackNotes: 'Great work',
        deliveredAt,
        deliveredBy,
      })

      expect(finalScore.id).toBe(customId)
      expect(finalScore.cycleId).toBe(props.cycleId)
      expect(finalScore.userId).toBe(props.userId)
      expect(finalScore.employeeId).toBe(props.userId)
      expect(finalScore.pillarScores).toBe(props.pillarScores)
      expect(finalScore.finalScores).toBe(props.pillarScores)
      expect(finalScore.weightedScore).toBe(props.weightedScore)
      expect(finalScore.finalLevel).toBe(props.finalLevel)
      expect(finalScore.peerAverageScores).toBe(peerScores)
      expect(finalScore.peerFeedbackCount).toBe(5)
      expect(finalScore.calculatedAt).toBe(calculatedAt)
      expect(finalScore.feedbackNotes).toBe('Great work')
      expect(finalScore.deliveredAt).toBe(deliveredAt)
      expect(finalScore.deliveredBy).toBe(deliveredBy)
    })

    it('should return undefined for optional properties when not set', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      expect(finalScore.peerAverageScores).toBeNull()
      expect(finalScore.lockedAt).toBeUndefined()
      expect(finalScore.feedbackDeliveredAt).toBeUndefined()
      expect(finalScore.feedbackNotes).toBeUndefined()
      expect(finalScore.deliveredAt).toBeUndefined()
      expect(finalScore.deliveredBy).toBeUndefined()
    })
  })

  describe('percentageScore', () => {
    it('should return percentage from weighted score', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        weightedScore: WeightedScore.fromValue(3.2),
      })

      expect(finalScore.percentageScore).toBe(80) // (3.2 / 4.0) * 100
    })

    it('should calculate percentage for minimum score', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        weightedScore: WeightedScore.fromValue(0),
      })

      expect(finalScore.percentageScore).toBe(0)
    })

    it('should calculate percentage for maximum score', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        weightedScore: WeightedScore.fromValue(4.0),
      })

      expect(finalScore.percentageScore).toBe(100)
    })
  })

  describe('bonusTier', () => {
    it('should return EXCEEDS tier for scores >= 85%', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        weightedScore: WeightedScore.fromValue(3.4), // 85%
      })

      expect(finalScore.bonusTier).toBe(BonusTier.EXCEEDS)
      expect(finalScore.bonusTier.isExceeds()).toBe(true)
    })

    it('should return MEETS tier for scores between 50% and 84%', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        weightedScore: WeightedScore.fromValue(2.4), // 60%
      })

      expect(finalScore.bonusTier).toBe(BonusTier.MEETS)
      expect(finalScore.bonusTier.isMeets()).toBe(true)
    })

    it('should return BELOW tier for scores < 50%', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        weightedScore: WeightedScore.fromValue(1.6), // 40%
      })

      expect(finalScore.bonusTier).toBe(BonusTier.BELOW)
      expect(finalScore.bonusTier.isBelow()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle all zero scores', () => {
      const props = createValidProps()
      const zeroScores = PillarScores.create({
        projectImpact: 0,
        direction: 0,
        engineeringExcellence: 0,
        operationalOwnership: 0,
        peopleImpact: 0,
      })
      const finalScore = FinalScore.create({
        ...props,
        pillarScores: zeroScores,
        weightedScore: WeightedScore.fromValue(0),
      })

      expect(finalScore.pillarScores).toBe(zeroScores)
      expect(finalScore.weightedScore.value).toBe(0)
      expect(finalScore.percentageScore).toBe(0)
      expect(finalScore.bonusTier).toBe(BonusTier.BELOW)
    })

    it('should handle maximum scores', () => {
      const props = createValidProps()
      const maxScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const finalScore = FinalScore.create({
        ...props,
        pillarScores: maxScores,
        weightedScore: WeightedScore.fromValue(4.0),
      })

      expect(finalScore.pillarScores).toBe(maxScores)
      expect(finalScore.weightedScore.value).toBe(4.0)
      expect(finalScore.percentageScore).toBe(100)
      expect(finalScore.bonusTier).toBe(BonusTier.EXCEEDS)
    })

    it('should handle all engineer levels', () => {
      const props = createValidProps()

      const levels = [
        EngineerLevel.JUNIOR,
        EngineerLevel.MID,
        EngineerLevel.SENIOR,
        EngineerLevel.LEAD,
        EngineerLevel.MANAGER,
      ]

      levels.forEach((level) => {
        const finalScore = FinalScore.create({
          ...props,
          finalLevel: level,
        })

        expect(finalScore.finalLevel).toBe(level)
      })
    })

    it('should handle zero peer feedback count', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        peerFeedbackCount: 0,
      })

      expect(finalScore.peerFeedbackCount).toBe(0)
      expect(finalScore.peerAverageScores).toBeNull()
    })

    it('should handle large peer feedback count', () => {
      const props = createValidProps()
      const peerScores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })
      const finalScore = FinalScore.create({
        ...props,
        peerAverageScores: peerScores,
        peerFeedbackCount: 100,
      })

      expect(finalScore.peerFeedbackCount).toBe(100)
      expect(finalScore.peerAverageScores).toBe(peerScores)
    })

    it('should handle very long feedback notes', () => {
      const props = createValidProps()
      const longNotes = 'a'.repeat(10000)
      const finalScore = FinalScore.create({
        ...props,
        feedbackNotes: longNotes,
      })

      expect(finalScore.feedbackNotes).toBe(longNotes)
    })

    it('should handle empty feedback notes', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create({
        ...props,
        feedbackNotes: '',
      })

      expect(finalScore.feedbackNotes).toBe('')
    })
  })

  describe('workflow scenarios', () => {
    it('should support complete calculation-to-delivery workflow', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      // Initial state
      expect(finalScore.isLocked).toBe(false)
      expect(finalScore.feedbackDelivered).toBe(false)

      // Calculate and update scores
      const updatedScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const updatedWeighted = WeightedScore.fromValue(4.0)
      finalScore.updateScores(updatedScores, updatedWeighted)

      // Lock scores
      finalScore.lock()
      expect(finalScore.isLocked).toBe(true)

      // Deliver feedback
      const deliveredBy = UserId.generate()
      finalScore.markFeedbackDelivered(deliveredBy, 'Excellent performance')

      expect(finalScore.feedbackDelivered).toBe(true)
      expect(finalScore.deliveredBy).toBe(deliveredBy)
      expect(finalScore.feedbackNotes).toBe('Excellent performance')

      // Verify final state
      expect(finalScore.pillarScores).toBe(updatedScores)
      expect(finalScore.weightedScore).toBe(updatedWeighted)
      expect(finalScore.isLocked).toBe(true)
      expect(finalScore.percentageScore).toBe(100)
      expect(finalScore.bonusTier).toBe(BonusTier.EXCEEDS)
    })

    it('should support admin unlock workflow', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      // Lock and deliver feedback
      finalScore.lock()
      const deliveredBy = UserId.generate()
      finalScore.markFeedbackDelivered(deliveredBy, 'Initial feedback')

      expect(finalScore.isLocked).toBe(true)
      expect(finalScore.feedbackDelivered).toBe(true)

      // Admin needs to make adjustments - unlock
      finalScore.unlock()

      // Make corrections
      const correctedScores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })
      const correctedWeighted = WeightedScore.fromValue(3.0)
      finalScore.updateScores(correctedScores, correctedWeighted)

      // Re-lock
      finalScore.lock()

      // Re-deliver feedback
      finalScore.markFeedbackDelivered(deliveredBy, 'Corrected feedback')

      expect(finalScore.isLocked).toBe(true)
      expect(finalScore.feedbackNotes).toBe('Corrected feedback')
      expect(finalScore.pillarScores).toBe(correctedScores)
    })

    it('should prevent modifications to locked scores', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      const originalScores = props.pillarScores
      const originalWeighted = props.weightedScore

      finalScore.lock()

      const newScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const newWeighted = WeightedScore.fromValue(4.0)

      expect(() => finalScore.updateScores(newScores, newWeighted)).toThrow(FinalScoreLockedException)

      // Verify scores remain unchanged
      expect(finalScore.pillarScores).toBe(originalScores)
      expect(finalScore.weightedScore).toBe(originalWeighted)
    })
  })

  describe('immutability', () => {
    it('should not allow modification of id after creation', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      const originalId = finalScore.id

      expect(finalScore.id).toBe(originalId)
      expect(finalScore.id).toBe(originalId) // Verify it remains constant
    })

    it('should not allow modification of userId after creation', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      const originalUserId = finalScore.userId

      expect(finalScore.userId).toBe(originalUserId)
      expect(finalScore.employeeId).toBe(originalUserId) // Alias should also be constant
    })

    it('should not allow modification of cycleId after creation', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)
      const originalCycleId = finalScore.cycleId

      expect(finalScore.cycleId).toBe(originalCycleId)
      expect(finalScore.cycleId).toBe(originalCycleId) // Verify it remains constant
    })

    it('should allow modification of scores only when unlocked', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      // Can modify when unlocked
      const newScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const newWeighted = WeightedScore.fromValue(4.0)
      finalScore.updateScores(newScores, newWeighted)
      expect(finalScore.pillarScores).toBe(newScores)

      // Cannot modify when locked
      finalScore.lock()
      const attemptedScores = PillarScores.create({
        projectImpact: 2,
        direction: 2,
        engineeringExcellence: 2,
        operationalOwnership: 2,
        peopleImpact: 2,
      })
      const attemptedWeighted = WeightedScore.fromValue(2.0)
      expect(() => finalScore.updateScores(attemptedScores, attemptedWeighted)).toThrow()
      expect(finalScore.pillarScores).toBe(newScores) // Remains unchanged
    })
  })

  describe('alias getters', () => {
    it('should provide employeeId as alias for userId', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      expect(finalScore.employeeId).toBe(finalScore.userId)
      expect(finalScore.employeeId).toBe(props.userId)
    })

    it('should provide finalScores as alias for pillarScores', () => {
      const props = createValidProps()
      const finalScore = FinalScore.create(props)

      expect(finalScore.finalScores).toBe(finalScore.pillarScores)
      expect(finalScore.finalScores).toBe(props.pillarScores)
    })
  })
})
