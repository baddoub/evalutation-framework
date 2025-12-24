import type { AggregatedPeerFeedbackOutput } from './get-aggregated-peer-feedback.use-case'
import { GetAggregatedPeerFeedbackUseCase } from './get-aggregated-peer-feedback.use-case'
import type { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service'
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { PeerFeedbackId } from '../../../domain/value-objects/peer-feedback-id.vo'
import { NoPeerFeedbackException } from '../../../domain/exceptions/no-peer-feedback.exception'

describe('GetAggregatedPeerFeedbackUseCase', () => {
  let useCase: GetAggregatedPeerFeedbackUseCase
  let peerFeedbackRepository: jest.Mocked<IPeerFeedbackRepository>
  let aggregationService: PeerFeedbackAggregationService

  // Test data factories
  const createPeerFeedback = (
    revieweeId: UserId,
    cycleId: ReviewCycleId,
    scores: {
      projectImpact: number
      direction: number
      engineeringExcellence: number
      operationalOwnership: number
      peopleImpact: number
    },
    comments?: { strengths?: string; growthAreas?: string; generalComments?: string },
  ): PeerFeedback => {
    return PeerFeedback.create({
      id: PeerFeedbackId.generate(),
      cycleId,
      revieweeId,
      reviewerId: UserId.generate(),
      scores: PillarScores.create(scores),
      strengths: comments?.strengths,
      growthAreas: comments?.growthAreas,
      generalComments: comments?.generalComments,
    })
  }

  beforeEach(() => {
    // Create mock repository
    peerFeedbackRepository = {
      findById: jest.fn(),
      findByRevieweeAndCycle: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByReviewerAndCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    // Create real aggregation service
    aggregationService = new PeerFeedbackAggregationService()

    // Create use case instance
    useCase = new GetAggregatedPeerFeedbackUseCase(peerFeedbackRepository, aggregationService)
  })

  describe('execute', () => {
    describe('CRITICAL: Happy path - successfully aggregates peer feedback', () => {
      it('should return aggregated feedback with correct structure', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 3,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 3,
            },
            {
              strengths: 'Great teamwork',
              growthAreas: 'Could improve communication',
              generalComments: 'Overall doing well',
            },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result).toBeDefined()
        expect(result.employeeId).toBe(employeeId)
        expect(result.cycleId).toBe(cycleId)
        expect(result.feedbackCount).toBe(1)
        expect(result.aggregatedScores).toBeDefined()
        expect(result.anonymizedComments).toBeDefined()
      })

      it('should call repository with correct parameters', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        await useCase.execute(employeeId, cycleId)

        // Assert
        expect(peerFeedbackRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1)
        expect(peerFeedbackRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
          expect.objectContaining({ value: employeeId }),
          expect.objectContaining({ value: cycleId }),
        )
      })
    })

    describe('CRITICAL: Multiple feedbacks aggregation with correct scores', () => {
      it('should correctly average scores from multiple feedbacks', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert - Should be rounded average: (3+5)/2 = 4
        expect(result.aggregatedScores.projectImpact).toBe(4)
        expect(result.aggregatedScores.direction).toBe(4)
        expect(result.aggregatedScores.engineeringExcellence).toBe(4)
        expect(result.aggregatedScores.operationalOwnership).toBe(4)
        expect(result.aggregatedScores.peopleImpact).toBe(4)
      })

      it('should correctly round averaged scores', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert - Average (3+4+4)/3 = 3.67, should round to 4
        expect(result.aggregatedScores.projectImpact).toBe(4)
        expect(result.aggregatedScores.direction).toBe(4)
        expect(result.aggregatedScores.engineeringExcellence).toBe(4)
        expect(result.aggregatedScores.operationalOwnership).toBe(4)
        expect(result.aggregatedScores.peopleImpact).toBe(4)
      })

      it('should track correct feedback count with multiple feedbacks', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.feedbackCount).toBe(3)
      })

      it('should aggregate varying scores across different pillars', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 2,
            peopleImpact: 4,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 3,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.aggregatedScores.projectImpact).toBe(4) // (5+3)/2 = 4
        expect(result.aggregatedScores.direction).toBe(4) // (3+5)/2 = 4
        expect(result.aggregatedScores.engineeringExcellence).toBe(4) // (4+4)/2 = 4
        expect(result.aggregatedScores.operationalOwnership).toBe(3) // (2+4)/2 = 3
        expect(result.aggregatedScores.peopleImpact).toBe(4) // (5+3)/2 = 4
      })
    })

    describe('CRITICAL: Anonymized comments structure', () => {
      it('should include all comment types in anonymized format', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            {
              strengths: 'Excellent coding skills',
              growthAreas: 'Needs better documentation',
              generalComments: 'Great colleague',
            },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(3)
        expect(result.anonymizedComments).toContainEqual({
          pillar: 'strengths',
          comment: 'Excellent coding skills',
        })
        expect(result.anonymizedComments).toContainEqual({
          pillar: 'growthAreas',
          comment: 'Needs better documentation',
        })
        expect(result.anonymizedComments).toContainEqual({
          pillar: 'general',
          comment: 'Great colleague',
        })
      })

      it('should aggregate comments from multiple feedbacks', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { strengths: 'Strong technical skills', growthAreas: 'Time management' },
          ),
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 3,
              direction: 3,
              engineeringExcellence: 3,
              operationalOwnership: 3,
              peopleImpact: 3,
            },
            { strengths: 'Good team player', generalComments: 'Helpful to others' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(4)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'strengths')).toHaveLength(2)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'growthAreas')).toHaveLength(1)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'general')).toHaveLength(1)
      })

      it('should handle feedback with only some comment types', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { strengths: 'Great leadership' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(1)
        expect(result.anonymizedComments[0]).toEqual({
          pillar: 'strengths',
          comment: 'Great leadership',
        })
      })

      it('should handle feedback with no comments', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(0)
      })
    })

    describe('IMPORTANT: Empty feedback list handling', () => {
      it('should throw NoPeerFeedbackException when no feedbacks exist', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue([])

        // Act & Assert
        await expect(useCase.execute(employeeId, cycleId)).rejects.toThrow(NoPeerFeedbackException)
      })

      it('should call repository before throwing exception', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue([])

        // Act
        try {
          await useCase.execute(employeeId, cycleId)
        } catch {}

        // Assert
        expect(peerFeedbackRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1)
      })
    })

    describe('IMPORTANT: Single feedback scenario', () => {
      it('should handle single feedback correctly', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 3,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 3,
            },
            { strengths: 'Solid performer' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.feedbackCount).toBe(1)
        expect(result.aggregatedScores.projectImpact).toBe(4)
        expect(result.aggregatedScores.direction).toBe(3)
        expect(result.aggregatedScores.engineeringExcellence).toBe(4)
        expect(result.aggregatedScores.operationalOwnership).toBe(4)
        expect(result.aggregatedScores.peopleImpact).toBe(3)
      })

      it('should return exact scores when only one feedback (no averaging)', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 2,
            direction: 4,
            engineeringExcellence: 3,
            operationalOwnership: 4,
            peopleImpact: 1,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.aggregatedScores.projectImpact).toBe(2)
        expect(result.aggregatedScores.direction).toBe(4)
        expect(result.aggregatedScores.engineeringExcellence).toBe(3)
        expect(result.aggregatedScores.operationalOwnership).toBe(4)
        expect(result.aggregatedScores.peopleImpact).toBe(1)
      })
    })

    describe('IMPORTANT: Repository method calls with correct parameters', () => {
      it('should convert string employeeId to UserId value object', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        await useCase.execute(employeeId, cycleId)

        // Assert
        const callArg = peerFeedbackRepository.findByEmployeeAndCycle.mock.calls[0][0]
        expect(callArg).toBeInstanceOf(UserId)
        expect(callArg.value).toBe(employeeId)
      })

      it('should convert string cycleId to ReviewCycleId value object', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        await useCase.execute(employeeId, cycleId)

        // Assert
        const callArg = peerFeedbackRepository.findByEmployeeAndCycle.mock.calls[0][1]
        expect(callArg).toBeInstanceOf(ReviewCycleId)
        expect(callArg.value).toBe(cycleId)
      })

      it('should only call findByEmployeeAndCycle once', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        await useCase.execute(employeeId, cycleId)

        // Assert
        expect(peerFeedbackRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1)
      })
    })

    describe('IMPORTANT: Output DTO structure validation', () => {
      it('should return AggregatedPeerFeedbackOutput with all required fields', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result: AggregatedPeerFeedbackOutput = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result).toHaveProperty('employeeId')
        expect(result).toHaveProperty('cycleId')
        expect(result).toHaveProperty('aggregatedScores')
        expect(result).toHaveProperty('feedbackCount')
        expect(result).toHaveProperty('anonymizedComments')
      })

      it('should return aggregatedScores with all pillar scores', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.aggregatedScores).toHaveProperty('projectImpact')
        expect(result.aggregatedScores).toHaveProperty('direction')
        expect(result.aggregatedScores).toHaveProperty('engineeringExcellence')
        expect(result.aggregatedScores).toHaveProperty('operationalOwnership')
        expect(result.aggregatedScores).toHaveProperty('peopleImpact')
        expect(typeof result.aggregatedScores.projectImpact).toBe('number')
        expect(typeof result.aggregatedScores.direction).toBe('number')
        expect(typeof result.aggregatedScores.engineeringExcellence).toBe('number')
        expect(typeof result.aggregatedScores.operationalOwnership).toBe('number')
        expect(typeof result.aggregatedScores.peopleImpact).toBe('number')
      })

      it('should return employeeId and cycleId as strings', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(typeof result.employeeId).toBe('string')
        expect(typeof result.cycleId).toBe('string')
        expect(result.employeeId).toBe(employeeId)
        expect(result.cycleId).toBe(cycleId)
      })

      it('should return feedbackCount as number', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(typeof result.feedbackCount).toBe('number')
        expect(result.feedbackCount).toBeGreaterThan(0)
      })

      it('should return anonymizedComments as array of objects with pillar and comment', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { strengths: 'Test strength' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(Array.isArray(result.anonymizedComments)).toBe(true)
        result.anonymizedComments.forEach((comment) => {
          expect(comment).toHaveProperty('pillar')
          expect(comment).toHaveProperty('comment')
          expect(typeof comment.pillar).toBe('string')
          expect(typeof comment.comment).toBe('string')
        })
      })
    })

    describe('EDGE: Various feedback counts', () => {
      it('should handle 2 feedbacks correctly', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.feedbackCount).toBe(2)
      })

      it('should handle 5 feedbacks correctly', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = Array.from({ length: 5 }, () =>
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        )

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.feedbackCount).toBe(5)
        expect(result.aggregatedScores.projectImpact).toBe(4)
      })

      it('should handle large number of feedbacks (10)', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = Array.from({ length: 10 }, (_, i) =>
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: (i % 4) + 1,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 4,
          }),
        )

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.feedbackCount).toBe(10)
        expect(result.aggregatedScores).toBeDefined()
      })
    })

    describe('EDGE: Different comment combinations', () => {
      it('should handle feedbacks with only strengths comments', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { strengths: 'Strength 1' },
          ),
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 3,
              direction: 3,
              engineeringExcellence: 3,
              operationalOwnership: 3,
              peopleImpact: 3,
            },
            { strengths: 'Strength 2' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(2)
        expect(result.anonymizedComments.every((c) => c.pillar === 'strengths')).toBe(true)
      })

      it('should handle feedbacks with only growth areas comments', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { growthAreas: 'Growth area 1' },
          ),
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 3,
              direction: 3,
              engineeringExcellence: 3,
              operationalOwnership: 3,
              peopleImpact: 3,
            },
            { growthAreas: 'Growth area 2' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(2)
        expect(result.anonymizedComments.every((c) => c.pillar === 'growthAreas')).toBe(true)
      })

      it('should handle feedbacks with mixed comment types', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { strengths: 'Strength', growthAreas: 'Growth' },
          ),
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 3,
              direction: 3,
              engineeringExcellence: 3,
              operationalOwnership: 3,
              peopleImpact: 3,
            },
            { generalComments: 'General' },
          ),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(3)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'strengths')).toHaveLength(1)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'growthAreas')).toHaveLength(1)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'general')).toHaveLength(1)
      })

      it('should handle all feedbacks with all comment types', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { strengths: 'S1', growthAreas: 'G1', generalComments: 'C1' },
          ),
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 3,
              direction: 3,
              engineeringExcellence: 3,
              operationalOwnership: 3,
              peopleImpact: 3,
            },
            { strengths: 'S2', growthAreas: 'G2', generalComments: 'C2' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.anonymizedComments).toHaveLength(6)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'strengths')).toHaveLength(2)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'growthAreas')).toHaveLength(2)
        expect(result.anonymizedComments.filter((c) => c.pillar === 'general')).toHaveLength(2)
      })
    })

    describe('EDGE: Repository errors', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const error = new Error('Database connection failed')
        peerFeedbackRepository.findByEmployeeAndCycle.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(employeeId, cycleId)).rejects.toThrow(
          'Database connection failed',
        )
      })

      it('should propagate custom repository errors', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const customError = new Error('Custom error')
        peerFeedbackRepository.findByEmployeeAndCycle.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute(employeeId, cycleId)).rejects.toThrow(customError)
      })
    })

    describe('Integration scenarios', () => {
      it('should complete full workflow: fetch, aggregate, return', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 3,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 3,
            },
            {
              strengths: 'Strong technical skills',
              growthAreas: 'Communication',
              generalComments: 'Good work',
            },
          ),
          createPeerFeedback(
            UserId.fromString(employeeId),
            ReviewCycleId.create(cycleId),
            {
              projectImpact: 4,
              direction: 4,
              engineeringExcellence: 4,
              operationalOwnership: 4,
              peopleImpact: 4,
            },
            { strengths: 'Great collaboration', generalComments: 'Keep it up' },
          ),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(peerFeedbackRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1)
        expect(result.employeeId).toBe(employeeId)
        expect(result.cycleId).toBe(cycleId)
        expect(result.feedbackCount).toBe(2)
        expect(result.aggregatedScores.projectImpact).toBe(4) // (4+4)/2 = 4
        expect(result.aggregatedScores.direction).toBe(4) // (3+4)/2 = 3.5 -> 4
        expect(result.anonymizedComments).toHaveLength(5)
      })

      it('should maintain data consistency throughout aggregation', async () => {
        // Arrange
        const employeeId = UserId.generate().value
        const cycleId = ReviewCycleId.generate().value
        const feedbackList = [
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          createPeerFeedback(UserId.fromString(employeeId), ReviewCycleId.create(cycleId), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
        ]

        peerFeedbackRepository.findByEmployeeAndCycle.mockResolvedValue(feedbackList)

        // Act
        const result = await useCase.execute(employeeId, cycleId)

        // Assert
        expect(result.feedbackCount).toBe(feedbackList.length)
        expect(result.aggregatedScores.projectImpact).toBe(3)
        expect(result.aggregatedScores.direction).toBe(3)
        expect(result.aggregatedScores.engineeringExcellence).toBe(3)
        expect(result.aggregatedScores.operationalOwnership).toBe(3)
        expect(result.aggregatedScores.peopleImpact).toBe(3)
      })
    })
  })
})
