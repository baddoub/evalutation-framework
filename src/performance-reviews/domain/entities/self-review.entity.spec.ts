import { SelfReview } from './self-review.entity'
import { SelfReviewId } from '../value-objects/self-review-id.vo'
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../value-objects/pillar-scores.vo'
import { Narrative } from '../value-objects/narrative.vo'
import { ReviewStatus } from '../value-objects/review-status.vo'
import { SelfReviewAlreadySubmittedException } from '../exceptions/self-review-already-submitted.exception'

describe('SelfReview', () => {
  const createValidProps = () => ({
    cycleId: ReviewCycleId.generate(),
    userId: UserId.generate(),
    scores: PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    }),
    narrative: Narrative.create('This is my self-review narrative'),
  })

  describe('create', () => {
    it('should create a SelfReview with generated id in DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      expect(selfReview).toBeInstanceOf(SelfReview)
      expect(selfReview.id).toBeInstanceOf(SelfReviewId)
      expect(selfReview.cycleId).toBe(props.cycleId)
      expect(selfReview.userId).toBe(props.userId)
      expect(selfReview.scores).toBe(props.scores)
      expect(selfReview.narrative).toBe(props.narrative)
      expect(selfReview.status).toBe(ReviewStatus.DRAFT)
      expect(selfReview.submittedAt).toBeUndefined()
      expect(selfReview.isSubmitted).toBe(false)
    })

    it('should create a SelfReview with provided id', () => {
      const props = createValidProps()
      const customId = SelfReviewId.generate()
      const selfReview = SelfReview.create({ ...props, id: customId })

      expect(selfReview.id).toBe(customId)
    })

    it('should create multiple SelfReviews with unique ids', () => {
      const props = createValidProps()
      const selfReview1 = SelfReview.create(props)
      const selfReview2 = SelfReview.create(props)

      expect(selfReview1.id).not.toBe(selfReview2.id)
    })
  })

  describe('updateScores', () => {
    it('should update scores when in DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      const newScores = PillarScores.create({
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 3,
      })

      selfReview.updateScores(newScores)

      expect(selfReview.scores).toBe(newScores)
    })

    it('should throw error when updating scores after submission', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      selfReview.submit()

      const newScores = PillarScores.create({
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 3,
      })

      expect(() => selfReview.updateScores(newScores)).toThrow(SelfReviewAlreadySubmittedException)
      expect(() => selfReview.updateScores(newScores)).toThrow('Cannot update scores after submission')
    })

    it('should allow multiple updates while in DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      const scores1 = PillarScores.create({
        projectImpact: 1,
        direction: 1,
        engineeringExcellence: 1,
        operationalOwnership: 1,
        peopleImpact: 1,
      })

      const scores2 = PillarScores.create({
        projectImpact: 2,
        direction: 2,
        engineeringExcellence: 2,
        operationalOwnership: 2,
        peopleImpact: 2,
      })

      selfReview.updateScores(scores1)
      expect(selfReview.scores).toBe(scores1)

      selfReview.updateScores(scores2)
      expect(selfReview.scores).toBe(scores2)
    })
  })

  describe('updateNarrative', () => {
    it('should update narrative when in DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      const newNarrative = Narrative.create('Updated narrative text')

      selfReview.updateNarrative(newNarrative)

      expect(selfReview.narrative).toBe(newNarrative)
    })

    it('should throw error when updating narrative after submission', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      selfReview.submit()

      const newNarrative = Narrative.create('Updated narrative text')

      expect(() => selfReview.updateNarrative(newNarrative)).toThrow(SelfReviewAlreadySubmittedException)
      expect(() => selfReview.updateNarrative(newNarrative)).toThrow('Cannot update narrative after submission')
    })

    it('should allow multiple narrative updates while in DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      const narrative1 = Narrative.create('First narrative')
      const narrative2 = Narrative.create('Second narrative')

      selfReview.updateNarrative(narrative1)
      expect(selfReview.narrative).toBe(narrative1)

      selfReview.updateNarrative(narrative2)
      expect(selfReview.narrative).toBe(narrative2)
    })
  })

  describe('submit', () => {
    it('should submit a self-review in DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      const beforeSubmit = new Date()

      selfReview.submit()

      expect(selfReview.status).toBe(ReviewStatus.SUBMITTED)
      expect(selfReview.submittedAt).toBeDefined()
      expect(selfReview.submittedAt!.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime())
      expect(selfReview.isSubmitted).toBe(true)
    })

    it('should throw error when submitting already submitted review', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      selfReview.submit()

      expect(() => selfReview.submit()).toThrow(SelfReviewAlreadySubmittedException)
    })

    it('should prevent updates after submission', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      selfReview.submit()

      const newScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const newNarrative = Narrative.create('New narrative')

      expect(() => selfReview.updateScores(newScores)).toThrow(SelfReviewAlreadySubmittedException)
      expect(() => selfReview.updateNarrative(newNarrative)).toThrow(SelfReviewAlreadySubmittedException)
    })
  })

  describe('getters', () => {
    it('should expose all properties via getters', () => {
      const props = createValidProps()
      const customId = SelfReviewId.generate()
      const selfReview = SelfReview.create({ ...props, id: customId })

      expect(selfReview.id).toBe(customId)
      expect(selfReview.cycleId).toBe(props.cycleId)
      expect(selfReview.userId).toBe(props.userId)
      expect(selfReview.scores).toBe(props.scores)
      expect(selfReview.narrative).toBe(props.narrative)
      expect(selfReview.status).toBe(ReviewStatus.DRAFT)
      expect(selfReview.submittedAt).toBeUndefined()
    })

    it('should expose submittedAt after submission', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      expect(selfReview.submittedAt).toBeUndefined()

      selfReview.submit()

      expect(selfReview.submittedAt).toBeDefined()
      expect(selfReview.submittedAt).toBeInstanceOf(Date)
    })
  })

  describe('isSubmitted', () => {
    it('should return false for DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      expect(selfReview.isSubmitted).toBe(false)
    })

    it('should return true for SUBMITTED status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      selfReview.submit()

      expect(selfReview.isSubmitted).toBe(true)
    })

    it('should return true for CALIBRATED status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      selfReview.submit()

      // Manually set status to CALIBRATED (simulating calibration workflow)
      const selfReviewWithState = selfReview as any
      selfReviewWithState._status = ReviewStatus.CALIBRATED

      expect(selfReview.isSubmitted).toBe(true)
      expect(selfReview.status).toBe(ReviewStatus.CALIBRATED)
    })
  })

  describe('status transitions', () => {
    it('should start in DRAFT status', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      expect(selfReview.status).toBe(ReviewStatus.DRAFT)
      expect(selfReview.isSubmitted).toBe(false)
    })

    it('should transition from DRAFT to SUBMITTED', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      expect(selfReview.status).toBe(ReviewStatus.DRAFT)

      selfReview.submit()

      expect(selfReview.status).toBe(ReviewStatus.SUBMITTED)
    })

    it('should not allow transition from SUBMITTED to DRAFT', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      selfReview.submit()

      // No method exists to revert to DRAFT - this is by design
      expect(selfReview.status).toBe(ReviewStatus.SUBMITTED)
      expect(selfReview.isSubmitted).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle minimum valid narrative length', () => {
      const props = createValidProps()
      const minNarrative = Narrative.create('a'.repeat(10)) // Minimum length
      const selfReview = SelfReview.create({ ...props, narrative: minNarrative })

      expect(selfReview.narrative).toBe(minNarrative)
    })

    it('should handle all zero scores', () => {
      const props = createValidProps()
      const zeroScores = PillarScores.create({
        projectImpact: 0,
        direction: 0,
        engineeringExcellence: 0,
        operationalOwnership: 0,
        peopleImpact: 0,
      })
      const selfReview = SelfReview.create({ ...props, scores: zeroScores })

      expect(selfReview.scores).toBe(zeroScores)
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
      const selfReview = SelfReview.create({ ...props, scores: maxScores })

      expect(selfReview.scores).toBe(maxScores)
    })
  })

  describe('workflow scenarios', () => {
    it('should support full draft-to-submit workflow', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)

      // Start in draft
      expect(selfReview.status).toBe(ReviewStatus.DRAFT)
      expect(selfReview.isSubmitted).toBe(false)

      // Update scores multiple times
      const scores1 = PillarScores.create({
        projectImpact: 2,
        direction: 2,
        engineeringExcellence: 2,
        operationalOwnership: 2,
        peopleImpact: 2,
      })
      selfReview.updateScores(scores1)

      const scores2 = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })
      selfReview.updateScores(scores2)

      // Update narrative
      const narrative = Narrative.create('Final narrative before submission')
      selfReview.updateNarrative(narrative)

      // Submit
      selfReview.submit()

      expect(selfReview.status).toBe(ReviewStatus.SUBMITTED)
      expect(selfReview.isSubmitted).toBe(true)
      expect(selfReview.submittedAt).toBeDefined()
      expect(selfReview.scores).toBe(scores2)
      expect(selfReview.narrative).toBe(narrative)
    })

    it('should maintain immutability of submitted data', () => {
      const props = createValidProps()
      const selfReview = SelfReview.create(props)
      const originalScores = props.scores
      const originalNarrative = props.narrative

      selfReview.submit()

      // Verify data is locked after submission
      expect(selfReview.scores).toBe(originalScores)
      expect(selfReview.narrative).toBe(originalNarrative)

      // Verify updates are blocked
      const newScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      expect(() => selfReview.updateScores(newScores)).toThrow()

      // Data should remain unchanged
      expect(selfReview.scores).toBe(originalScores)
      expect(selfReview.narrative).toBe(originalNarrative)
    })
  })
})
