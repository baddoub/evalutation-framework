import { PeerFeedback } from './peer-feedback.entity'
import { PeerFeedbackId } from '../value-objects/peer-feedback-id.vo'
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../value-objects/pillar-scores.vo'

describe('PeerFeedback', () => {
  const createValidProps = () => ({
    cycleId: ReviewCycleId.generate(),
    revieweeId: UserId.generate(),
    reviewerId: UserId.generate(),
    scores: PillarScores.create({
      projectImpact: 3,
      direction: 2,
      engineeringExcellence: 4,
      operationalOwnership: 3,
      peopleImpact: 2,
    }),
    strengths: 'Strong technical skills and collaboration',
    growthAreas: 'Could improve in delegation',
    generalComments: 'Overall excellent performance',
  })

  describe('create', () => {
    it('should create a PeerFeedback with all properties', () => {
      const props = createValidProps()
      const beforeCreate = new Date()
      const peerFeedback = PeerFeedback.create(props)

      expect(peerFeedback).toBeInstanceOf(PeerFeedback)
      expect(peerFeedback.id).toBeInstanceOf(PeerFeedbackId)
      expect(peerFeedback.cycleId).toBe(props.cycleId)
      expect(peerFeedback.revieweeId).toBe(props.revieweeId)
      expect(peerFeedback.reviewerId).toBe(props.reviewerId)
      expect(peerFeedback.scores).toBe(props.scores)
      expect(peerFeedback.strengths).toBe(props.strengths)
      expect(peerFeedback.growthAreas).toBe(props.growthAreas)
      expect(peerFeedback.generalComments).toBe(props.generalComments)
      expect(peerFeedback.submittedAt).toBeDefined()
      expect(peerFeedback.submittedAt!.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
    })

    it('should create a PeerFeedback with provided id', () => {
      const props = createValidProps()
      const customId = PeerFeedbackId.generate()
      const peerFeedback = PeerFeedback.create({ ...props, id: customId })

      expect(peerFeedback.id).toBe(customId)
    })

    it('should create a PeerFeedback without optional comments', () => {
      const { strengths, growthAreas, generalComments, ...requiredProps } = createValidProps()
      const peerFeedback = PeerFeedback.create(requiredProps)

      expect(peerFeedback).toBeInstanceOf(PeerFeedback)
      expect(peerFeedback.strengths).toBeUndefined()
      expect(peerFeedback.growthAreas).toBeUndefined()
      expect(peerFeedback.generalComments).toBeUndefined()
      expect(peerFeedback.scores).toBe(requiredProps.scores)
    })

    it('should create a PeerFeedback with only strengths', () => {
      const { growthAreas, generalComments, ...propsWithStrengths } = createValidProps()
      const peerFeedback = PeerFeedback.create(propsWithStrengths)

      expect(peerFeedback.strengths).toBe(propsWithStrengths.strengths)
      expect(peerFeedback.growthAreas).toBeUndefined()
      expect(peerFeedback.generalComments).toBeUndefined()
    })

    it('should create a PeerFeedback with only growthAreas', () => {
      const { strengths, generalComments, ...propsWithGrowthAreas } = createValidProps()
      const peerFeedback = PeerFeedback.create(propsWithGrowthAreas)

      expect(peerFeedback.strengths).toBeUndefined()
      expect(peerFeedback.growthAreas).toBe(propsWithGrowthAreas.growthAreas)
      expect(peerFeedback.generalComments).toBeUndefined()
    })

    it('should create a PeerFeedback with only generalComments', () => {
      const { strengths, growthAreas, ...propsWithComments } = createValidProps()
      const peerFeedback = PeerFeedback.create(propsWithComments)

      expect(peerFeedback.strengths).toBeUndefined()
      expect(peerFeedback.growthAreas).toBeUndefined()
      expect(peerFeedback.generalComments).toBe(propsWithComments.generalComments)
    })

    it('should create multiple PeerFeedbacks with unique ids', () => {
      const props = createValidProps()
      const peerFeedback1 = PeerFeedback.create(props)
      const peerFeedback2 = PeerFeedback.create(props)

      expect(peerFeedback1.id).not.toBe(peerFeedback2.id)
    })

    it('should automatically set submittedAt timestamp', () => {
      const props = createValidProps()
      const beforeCreate = new Date()
      const peerFeedback = PeerFeedback.create(props)
      const afterCreate = new Date()

      expect(peerFeedback.submittedAt).toBeDefined()
      expect(peerFeedback.submittedAt!.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(peerFeedback.submittedAt!.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })
  })

  describe('getters', () => {
    it('should expose all properties via getters', () => {
      const props = createValidProps()
      const customId = PeerFeedbackId.generate()
      const peerFeedback = PeerFeedback.create({ ...props, id: customId })

      expect(peerFeedback.id).toBe(customId)
      expect(peerFeedback.cycleId).toBe(props.cycleId)
      expect(peerFeedback.revieweeId).toBe(props.revieweeId)
      expect(peerFeedback.reviewerId).toBe(props.reviewerId)
      expect(peerFeedback.scores).toBe(props.scores)
      expect(peerFeedback.strengths).toBe(props.strengths)
      expect(peerFeedback.growthAreas).toBe(props.growthAreas)
      expect(peerFeedback.generalComments).toBe(props.generalComments)
      expect(peerFeedback.submittedAt).toBeDefined()
    })

    it('should return undefined for optional properties when not provided', () => {
      const { strengths, growthAreas, generalComments, ...requiredProps } = createValidProps()
      const peerFeedback = PeerFeedback.create(requiredProps)

      expect(peerFeedback.strengths).toBeUndefined()
      expect(peerFeedback.growthAreas).toBeUndefined()
      expect(peerFeedback.generalComments).toBeUndefined()
    })
  })

  describe('isAnonymized', () => {
    it('should always return true', () => {
      const props = createValidProps()
      const peerFeedback = PeerFeedback.create(props)

      expect(peerFeedback.isAnonymized).toBe(true)
    })

    it('should return true regardless of reviewer and reviewee', () => {
      const props = createValidProps()
      const peerFeedback1 = PeerFeedback.create(props)

      const differentProps = {
        ...props,
        reviewerId: UserId.generate(),
        revieweeId: UserId.generate(),
      }
      const peerFeedback2 = PeerFeedback.create(differentProps)

      expect(peerFeedback1.isAnonymized).toBe(true)
      expect(peerFeedback2.isAnonymized).toBe(true)
    })

    it('should be immutable - always true', () => {
      const props = createValidProps()
      const peerFeedback = PeerFeedback.create(props)

      // isAnonymized should always be true, no way to change it
      expect(peerFeedback.isAnonymized).toBe(true)

      // Verify it remains true
      expect(peerFeedback.isAnonymized).toBe(true)
      expect(peerFeedback.isAnonymized).toBe(true)
    })
  })

  describe('reviewer and reviewee relationship', () => {
    it('should allow same user in different cycles', () => {
      const reviewerId = UserId.generate()
      const revieweeId = UserId.generate()

      const cycle1 = ReviewCycleId.generate()
      const cycle2 = ReviewCycleId.generate()

      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })

      const feedback1 = PeerFeedback.create({
        cycleId: cycle1,
        reviewerId,
        revieweeId,
        scores,
      })

      const feedback2 = PeerFeedback.create({
        cycleId: cycle2,
        reviewerId,
        revieweeId,
        scores,
      })

      expect(feedback1.reviewerId).toBe(reviewerId)
      expect(feedback1.revieweeId).toBe(revieweeId)
      expect(feedback2.reviewerId).toBe(reviewerId)
      expect(feedback2.revieweeId).toBe(revieweeId)
      expect(feedback1.id).not.toBe(feedback2.id)
    })

    it('should allow reviewer to provide feedback to multiple reviewees', () => {
      const reviewerId = UserId.generate()
      const reviewee1 = UserId.generate()
      const reviewee2 = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })

      const feedback1 = PeerFeedback.create({
        cycleId,
        reviewerId,
        revieweeId: reviewee1,
        scores,
      })

      const feedback2 = PeerFeedback.create({
        cycleId,
        reviewerId,
        revieweeId: reviewee2,
        scores,
      })

      expect(feedback1.reviewerId).toBe(reviewerId)
      expect(feedback2.reviewerId).toBe(reviewerId)
      expect(feedback1.revieweeId).toBe(reviewee1)
      expect(feedback2.revieweeId).toBe(reviewee2)
    })

    it('should allow reviewee to receive feedback from multiple reviewers', () => {
      const revieweeId = UserId.generate()
      const reviewer1 = UserId.generate()
      const reviewer2 = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const scores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 3,
      })

      const feedback1 = PeerFeedback.create({
        cycleId,
        reviewerId: reviewer1,
        revieweeId,
        scores,
      })

      const feedback2 = PeerFeedback.create({
        cycleId,
        reviewerId: reviewer2,
        revieweeId,
        scores,
      })

      expect(feedback1.revieweeId).toBe(revieweeId)
      expect(feedback2.revieweeId).toBe(revieweeId)
      expect(feedback1.reviewerId).toBe(reviewer1)
      expect(feedback2.reviewerId).toBe(reviewer2)
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
      const peerFeedback = PeerFeedback.create({ ...props, scores: zeroScores })

      expect(peerFeedback.scores).toBe(zeroScores)
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
      const peerFeedback = PeerFeedback.create({ ...props, scores: maxScores })

      expect(peerFeedback.scores).toBe(maxScores)
    })

    it('should handle empty strings for optional comments', () => {
      const props = createValidProps()
      const peerFeedback = PeerFeedback.create({
        ...props,
        strengths: '',
        growthAreas: '',
        generalComments: '',
      })

      expect(peerFeedback.strengths).toBe('')
      expect(peerFeedback.growthAreas).toBe('')
      expect(peerFeedback.generalComments).toBe('')
    })

    it('should handle very long comment strings', () => {
      const props = createValidProps()
      const longText = 'a'.repeat(10000)
      const peerFeedback = PeerFeedback.create({
        ...props,
        strengths: longText,
        growthAreas: longText,
        generalComments: longText,
      })

      expect(peerFeedback.strengths).toBe(longText)
      expect(peerFeedback.growthAreas).toBe(longText)
      expect(peerFeedback.generalComments).toBe(longText)
    })

    it('should handle special characters in comments', () => {
      const props = createValidProps()
      const specialText = 'Test with special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
      const peerFeedback = PeerFeedback.create({
        ...props,
        strengths: specialText,
        growthAreas: specialText,
        generalComments: specialText,
      })

      expect(peerFeedback.strengths).toBe(specialText)
      expect(peerFeedback.growthAreas).toBe(specialText)
      expect(peerFeedback.generalComments).toBe(specialText)
    })

    it('should handle multiline comments', () => {
      const props = createValidProps()
      const multilineText = 'Line 1\nLine 2\nLine 3\n\nLine 5'
      const peerFeedback = PeerFeedback.create({
        ...props,
        strengths: multilineText,
        growthAreas: multilineText,
        generalComments: multilineText,
      })

      expect(peerFeedback.strengths).toBe(multilineText)
      expect(peerFeedback.growthAreas).toBe(multilineText)
      expect(peerFeedback.generalComments).toBe(multilineText)
    })
  })

  describe('immutability', () => {
    it('should not allow modification of properties after creation', () => {
      const props = createValidProps()
      const peerFeedback = PeerFeedback.create(props)

      // All properties should be read-only via getters
      // TypeScript will prevent assignment, but we can verify getters work consistently
      const originalCycleId = peerFeedback.cycleId
      const originalRevieweeId = peerFeedback.revieweeId
      const originalReviewerId = peerFeedback.reviewerId
      const originalScores = peerFeedback.scores
      const originalStrengths = peerFeedback.strengths
      const originalGrowthAreas = peerFeedback.growthAreas
      const originalGeneralComments = peerFeedback.generalComments
      const originalSubmittedAt = peerFeedback.submittedAt

      // Verify properties remain constant
      expect(peerFeedback.cycleId).toBe(originalCycleId)
      expect(peerFeedback.revieweeId).toBe(originalRevieweeId)
      expect(peerFeedback.reviewerId).toBe(originalReviewerId)
      expect(peerFeedback.scores).toBe(originalScores)
      expect(peerFeedback.strengths).toBe(originalStrengths)
      expect(peerFeedback.growthAreas).toBe(originalGrowthAreas)
      expect(peerFeedback.generalComments).toBe(originalGeneralComments)
      expect(peerFeedback.submittedAt).toBe(originalSubmittedAt)
    })
  })

  describe('business rules', () => {
    it('should create feedback with submitted timestamp immediately', () => {
      const props = createValidProps()
      const peerFeedback = PeerFeedback.create(props)

      // Feedback is considered submitted upon creation
      expect(peerFeedback.submittedAt).toBeDefined()
    })

    it('should maintain anonymization guarantee', () => {
      const props = createValidProps()
      const peerFeedback = PeerFeedback.create(props)

      // Even though we can see the reviewerId internally,
      // the isAnonymized flag indicates it should be hidden from reviewee
      expect(peerFeedback.isAnonymized).toBe(true)
      expect(peerFeedback.reviewerId).toBeDefined() // System knows who gave feedback
      expect(peerFeedback.revieweeId).toBeDefined() // System knows who receives feedback
    })

    it('should allow complete feedback without text comments', () => {
      const { strengths, growthAreas, generalComments, ...requiredProps } = createValidProps()
      const peerFeedback = PeerFeedback.create(requiredProps)

      // Feedback is valid with just scores
      expect(peerFeedback.scores).toBeDefined()
      expect(peerFeedback.submittedAt).toBeDefined()
      expect(peerFeedback.isAnonymized).toBe(true)
    })
  })
})
