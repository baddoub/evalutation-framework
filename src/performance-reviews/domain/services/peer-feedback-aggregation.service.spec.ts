import { PeerFeedbackAggregationService } from './peer-feedback-aggregation.service'
import { PeerFeedback } from '../entities/peer-feedback.entity'
import { PillarScores } from '../value-objects/pillar-scores.vo'
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import { NoPeerFeedbackException } from '../exceptions/no-peer-feedback.exception'

describe('PeerFeedbackAggregationService', () => {
  let service: PeerFeedbackAggregationService

  beforeEach(() => {
    service = new PeerFeedbackAggregationService()
  })

  const createFeedback = (scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }, comments?: {
    strengths?: string
    growthAreas?: string
    generalComments?: string
  }) => {
    return PeerFeedback.create({
      cycleId: ReviewCycleId.generate(),
      revieweeId: UserId.generate(),
      reviewerId: UserId.generate(),
      scores: PillarScores.create(scores),
      ...comments,
    })
  }

  describe('aggregatePeerScores', () => {
    it('should calculate average scores from single feedback', () => {
      const feedback = createFeedback({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const result = service.aggregatePeerScores([feedback])

      expect(result.projectImpact.value).toBe(3)
      expect(result.direction.value).toBe(2)
      expect(result.engineeringExcellence.value).toBe(4)
      expect(result.operationalOwnership.value).toBe(3)
      expect(result.peopleImpact.value).toBe(2)
    })

    it('should calculate average scores from multiple feedbacks', () => {
      const feedbacks = [
        createFeedback({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
        createFeedback({
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 4,
          peopleImpact: 3,
        }),
        createFeedback({
          projectImpact: 2,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 2,
          peopleImpact: 3,
        }),
      ]

      const result = service.aggregatePeerScores(feedbacks)

      // Averages: (3+4+2)/3=3, (2+3+3)/3=2.67→3, (4+3+4)/3=3.67→4, (3+4+2)/3=3, (2+3+3)/3=2.67→3
      expect(result.projectImpact.value).toBe(3)
      expect(result.direction.value).toBe(3)
      expect(result.engineeringExcellence.value).toBe(4)
      expect(result.operationalOwnership.value).toBe(3)
      expect(result.peopleImpact.value).toBe(3)
    })

    it('should round averages to nearest integer', () => {
      const feedbacks = [
        createFeedback({
          projectImpact: 2,
          direction: 2,
          engineeringExcellence: 2,
          operationalOwnership: 2,
          peopleImpact: 2,
        }),
        createFeedback({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
      ]

      const result = service.aggregatePeerScores(feedbacks)

      // All averages are 2.5, should round to 3 (Math.round)
      expect(result.projectImpact.value).toBe(3)
      expect(result.direction.value).toBe(3)
      expect(result.engineeringExcellence.value).toBe(3)
      expect(result.operationalOwnership.value).toBe(3)
      expect(result.peopleImpact.value).toBe(3)
    })

    it('should handle all zeros', () => {
      const feedbacks = [
        createFeedback({
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        }),
        createFeedback({
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        }),
      ]

      const result = service.aggregatePeerScores(feedbacks)

      expect(result.projectImpact.value).toBe(0)
      expect(result.direction.value).toBe(0)
      expect(result.engineeringExcellence.value).toBe(0)
      expect(result.operationalOwnership.value).toBe(0)
      expect(result.peopleImpact.value).toBe(0)
    })

    it('should handle all max scores', () => {
      const feedbacks = [
        createFeedback({
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        }),
        createFeedback({
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        }),
      ]

      const result = service.aggregatePeerScores(feedbacks)

      expect(result.projectImpact.value).toBe(4)
      expect(result.direction.value).toBe(4)
      expect(result.engineeringExcellence.value).toBe(4)
      expect(result.operationalOwnership.value).toBe(4)
      expect(result.peopleImpact.value).toBe(4)
    })

    it('should throw error for empty feedbacks array', () => {
      expect(() => service.aggregatePeerScores([])).toThrow(NoPeerFeedbackException)
    })

    it('should throw error for null feedbacks', () => {
      expect(() => service.aggregatePeerScores(null as any)).toThrow(
        NoPeerFeedbackException,
      )
    })

    it('should throw error for undefined feedbacks', () => {
      expect(() => service.aggregatePeerScores(undefined as any)).toThrow(
        NoPeerFeedbackException,
      )
    })
  })

  describe('anonymizeFeedback', () => {
    it('should anonymize single feedback with all comments', () => {
      const feedback = createFeedback(
        {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        {
          strengths: 'Great coding skills',
          growthAreas: 'Needs to improve communication',
          generalComments: 'Overall performing well',
        },
      )

      const result = service.anonymizeFeedback([feedback])

      expect(result.feedbackCount).toBe(1)
      expect(result.averageScores.projectImpact.value).toBe(3)
      expect(result.anonymizedComments.strengths).toEqual(['Great coding skills'])
      expect(result.anonymizedComments.growthAreas).toEqual([
        'Needs to improve communication',
      ])
      expect(result.anonymizedComments.general).toEqual(['Overall performing well'])
      expect(result.projectImpact).toBe(3)
      expect(result.comments).toHaveLength(3)
    })

    it('should anonymize multiple feedbacks', () => {
      const feedbacks = [
        createFeedback(
          {
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
          },
          {
            strengths: 'Strong technical skills',
            growthAreas: 'Work on leadership',
          },
        ),
        createFeedback(
          {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 4,
            peopleImpact: 3,
          },
          {
            strengths: 'Excellent problem solver',
            generalComments: 'Keep up the good work',
          },
        ),
        createFeedback(
          {
            projectImpact: 2,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 2,
            peopleImpact: 3,
          },
          {
            growthAreas: 'Improve documentation',
            generalComments: 'Good team player',
          },
        ),
      ]

      const result = service.anonymizeFeedback(feedbacks)

      expect(result.feedbackCount).toBe(3)
      expect(result.anonymizedComments.strengths).toHaveLength(2)
      expect(result.anonymizedComments.growthAreas).toHaveLength(2)
      expect(result.anonymizedComments.general).toHaveLength(2)
      expect(result.comments).toHaveLength(6)
    })

    it('should handle feedbacks with no comments', () => {
      const feedback = createFeedback({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })

      const result = service.anonymizeFeedback([feedback])

      expect(result.anonymizedComments.strengths).toEqual([])
      expect(result.anonymizedComments.growthAreas).toEqual([])
      expect(result.anonymizedComments.general).toEqual([])
      expect(result.comments).toHaveLength(0)
    })

    it('should include individual score properties for convenience', () => {
      const feedbacks = [
        createFeedback({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
        createFeedback({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
      ]

      const result = service.anonymizeFeedback(feedbacks)

      expect(result.projectImpact).toBe(3)
      expect(result.direction).toBe(2)
      expect(result.engineeringExcellence).toBe(4)
      expect(result.operationalOwnership).toBe(3)
      expect(result.peopleImpact).toBe(2)
    })

    it('should flatten comments into array with pillar labels', () => {
      const feedback = createFeedback(
        {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        {
          strengths: 'Good coder',
          growthAreas: 'Learn more',
          generalComments: 'Nice person',
        },
      )

      const result = service.anonymizeFeedback([feedback])

      expect(result.comments).toEqual([
        { pillar: 'strengths', comment: 'Good coder' },
        { pillar: 'growthAreas', comment: 'Learn more' },
        { pillar: 'general', comment: 'Nice person' },
      ])
    })

    it('should throw error for empty feedbacks array', () => {
      expect(() => service.anonymizeFeedback([])).toThrow(NoPeerFeedbackException)
    })

    it('should throw error for null feedbacks', () => {
      expect(() => service.anonymizeFeedback(null as any)).toThrow(
        NoPeerFeedbackException,
      )
    })
  })

  describe('aggregateFeedback', () => {
    it('should be an alias for anonymizeFeedback', () => {
      const feedback = createFeedback(
        {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        {
          strengths: 'Great work',
        },
      )

      const anonymizedResult = service.anonymizeFeedback([feedback])
      const aggregatedResult = service.aggregateFeedback([feedback])

      expect(aggregatedResult).toEqual(anonymizedResult)
    })
  })

  describe('edge cases', () => {
    it('should handle large number of feedbacks', () => {
      const feedbacks = Array.from({ length: 100 }, () =>
        createFeedback({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
      )

      const result = service.aggregatePeerScores(feedbacks)

      expect(result.projectImpact.value).toBe(3)
      expect(result.direction.value).toBe(3)
      expect(result.engineeringExcellence.value).toBe(3)
      expect(result.operationalOwnership.value).toBe(3)
      expect(result.peopleImpact.value).toBe(3)
    })

    it('should handle mixed partial comments', () => {
      const feedbacks = [
        createFeedback(
          {
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
          },
          {
            strengths: 'Comment 1',
          },
        ),
        createFeedback(
          {
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
          },
          {
            growthAreas: 'Comment 2',
          },
        ),
        createFeedback(
          {
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
          },
          {
            generalComments: 'Comment 3',
          },
        ),
      ]

      const result = service.anonymizeFeedback(feedbacks)

      expect(result.anonymizedComments.strengths).toHaveLength(1)
      expect(result.anonymizedComments.growthAreas).toHaveLength(1)
      expect(result.anonymizedComments.general).toHaveLength(1)
      expect(result.comments).toHaveLength(3)
    })
  })
})
