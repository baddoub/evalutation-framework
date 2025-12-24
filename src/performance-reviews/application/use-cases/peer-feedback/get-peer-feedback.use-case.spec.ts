import { GetPeerFeedbackUseCase } from './get-peer-feedback.use-case'
import type { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service'
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import type { GetPeerFeedbackInput } from '../../dto/peer-feedback.dto'

describe('GetPeerFeedbackUseCase', () => {
  let useCase: GetPeerFeedbackUseCase
  let peerFeedbackRepository: jest.Mocked<IPeerFeedbackRepository>
  let cycleRepository: jest.Mocked<IReviewCycleRepository>
  let aggregationService: PeerFeedbackAggregationService

  // Test data factories
  const createValidInput = (): GetPeerFeedbackInput => ({
    revieweeId: UserId.generate(),
    cycleId: ReviewCycleId.generate(),
  })

  const createValidReviewCycle = (cycleId: ReviewCycleId): ReviewCycle => {
    const deadlines = CycleDeadlines.create({
      selfReview: new Date('2024-01-31'),
      peerFeedback: new Date('2024-02-28'),
      managerEvaluation: new Date('2024-03-31'),
      calibration: new Date('2024-04-30'),
      feedbackDelivery: new Date('2024-05-31'),
    })
    return ReviewCycle.create({
      id: cycleId,
      year: 2024,
      startDate: new Date('2024-01-01'),
      name: 'Annual Review 2024',
      deadlines,
    })
  }

  const createValidPeerFeedback = (
    cycleId: ReviewCycleId,
    revieweeId: UserId,
    reviewerId: UserId,
    scores?: {
      projectImpact: number
      direction: number
      engineeringExcellence: number
      operationalOwnership: number
      peopleImpact: number
    },
  ): PeerFeedback => {
    return PeerFeedback.create({
      cycleId,
      revieweeId,
      reviewerId,
      scores: PillarScores.create(
        scores ?? {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
      ),
      strengths: 'Strong technical skills',
      growthAreas: 'Communication could improve',
      generalComments: 'Great team player',
    })
  }

  beforeEach(() => {
    // Create mock repositories
    peerFeedbackRepository = {
      findById: jest.fn(),
      findByRevieweeAndCycle: jest.fn(),
      findByReviewerAndCycle: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    cycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    // Create real aggregation service (it's a simple domain service)
    aggregationService = new PeerFeedbackAggregationService()

    // Create use case instance
    useCase = new GetPeerFeedbackUseCase(
      peerFeedbackRepository,
      cycleRepository,
      aggregationService,
    )
  })

  describe('execute', () => {
    describe('CRITICAL: Should successfully retrieve and aggregate peer feedback', () => {
      it('should return aggregated scores and comments from multiple feedbacks', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const reviewer1 = UserId.generate()
        const reviewer2 = UserId.generate()
        const reviewer3 = UserId.generate()

        const feedbacks = [
          createValidPeerFeedback(input.cycleId, input.revieweeId, reviewer1, {
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
          }),
          createValidPeerFeedback(input.cycleId, input.revieweeId, reviewer2, {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 4,
            peopleImpact: 3,
          }),
          createValidPeerFeedback(input.cycleId, input.revieweeId, reviewer3, {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 4,
          }),
        ]

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result.feedbackCount).toBe(3)
        expect(result.aggregatedScores).toEqual({
          projectImpact: 3, // (3+4+3)/3 = 3.33 -> 3
          direction: 3, // (2+3+3)/3 = 2.67 -> 3
          engineeringExcellence: 4, // (4+3+4)/3 = 3.67 -> 4
          operationalOwnership: 3, // (3+4+3)/3 = 3.33 -> 3
          peopleImpact: 3, // (2+3+4)/3 = 3 -> 3
        })
        expect(result.anonymizedComments).toHaveLength(3)
      })

      it('should call cycleRepository.findById with correct cycle ID', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate())

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        await useCase.execute(input)

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId)
        expect(cycleRepository.findById).toHaveBeenCalledTimes(1)
      })

      it('should call peerFeedbackRepository.findByRevieweeAndCycle with correct parameters', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate())

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        await useCase.execute(input)

        // Assert
        expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledWith(
          input.revieweeId,
          input.cycleId,
        )
        expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledTimes(1)
      })

      it('should anonymize comments by not revealing reviewer identity', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const reviewer = UserId.generate()
        const feedback = createValidPeerFeedback(input.cycleId, input.revieweeId, reviewer)

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments[0]).not.toHaveProperty('reviewerId')
        expect(result.anonymizedComments[0]).toHaveProperty('strengths')
        expect(result.anonymizedComments[0]).toHaveProperty('growthAreas')
        expect(result.anonymizedComments[0]).toHaveProperty('generalComments')
      })

      it('should include all comments from all feedbacks', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        const feedback1 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Strength 1',
          growthAreas: 'Growth 1',
          generalComments: 'Comment 1',
        })

        const feedback2 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          strengths: 'Strength 2',
          growthAreas: 'Growth 2',
          generalComments: 'Comment 2',
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback1, feedback2])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments).toHaveLength(2)
        expect(result.anonymizedComments[0].strengths).toBe('Strength 1')
        expect(result.anonymizedComments[0].growthAreas).toBe('Growth 1')
        expect(result.anonymizedComments[0].generalComments).toBe('Comment 1')
        expect(result.anonymizedComments[1].strengths).toBe('Strength 2')
        expect(result.anonymizedComments[1].growthAreas).toBe('Growth 2')
        expect(result.anonymizedComments[1].generalComments).toBe('Comment 2')
      })
    })

    describe('CRITICAL: Should return zero scores when no feedback exists', () => {
      it('should return empty result with zero scores when no feedback found', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toEqual({
          aggregatedScores: {
            projectImpact: 0,
            direction: 0,
            engineeringExcellence: 0,
            operationalOwnership: 0,
            peopleImpact: 0,
          },
          feedbackCount: 0,
          anonymizedComments: [],
        })
      })

      it('should return zero feedback count when no feedback found', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackCount).toBe(0)
      })

      it('should return empty comments array when no feedback found', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments).toEqual([])
        expect(result.anonymizedComments).toHaveLength(0)
      })

      it('should still validate cycle exists before returning empty result', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([])

        // Act
        await useCase.execute(input)

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId)
        expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledWith(
          input.revieweeId,
          input.cycleId,
        )
      })
    })

    describe('CRITICAL: Should handle cycle not found error', () => {
      it('should throw ReviewNotFoundException if cycle does not exist', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      })

      it('should throw ReviewNotFoundException with correct message including cycle ID', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(
          `Review cycle with ID ${input.cycleId.value} not found`,
        )
      })

      it('should not proceed to find feedback if cycle validation fails', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act
        try {
          await useCase.execute(input)
        } catch {}

        // Assert
        expect(peerFeedbackRepository.findByRevieweeAndCycle).not.toHaveBeenCalled()
      })

      it('should validate cycle before any other operation', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act
        try {
          await useCase.execute(input)
        } catch {}

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledTimes(1)
        expect(peerFeedbackRepository.findByRevieweeAndCycle).not.toHaveBeenCalled()
      })
    })

    describe('IMPORTANT: Should aggregate multiple feedbacks correctly', () => {
      it('should calculate average scores correctly for two feedbacks', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback1 = createValidPeerFeedback(
          input.cycleId,
          input.revieweeId,
          UserId.generate(),
          {
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          },
        )
        const feedback2 = createValidPeerFeedback(
          input.cycleId,
          input.revieweeId,
          UserId.generate(),
          {
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          },
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback1, feedback2])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.aggregatedScores).toEqual({
          projectImpact: 3, // (2+4)/2 = 3
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        })
      })

      it('should round aggregated scores to nearest integer', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback1 = createValidPeerFeedback(
          input.cycleId,
          input.revieweeId,
          UserId.generate(),
          {
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          },
        )
        const feedback2 = createValidPeerFeedback(
          input.cycleId,
          input.revieweeId,
          UserId.generate(),
          {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          },
        )
        const feedback3 = createValidPeerFeedback(
          input.cycleId,
          input.revieweeId,
          UserId.generate(),
          {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          },
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([
          feedback1,
          feedback2,
          feedback3,
        ])

        // Act
        const result = await useCase.execute(input)

        // Assert - (2+3+3)/3 = 2.67 rounds to 3
        expect(result.aggregatedScores.projectImpact).toBe(3)
        expect(result.aggregatedScores.direction).toBe(3)
        expect(result.aggregatedScores.engineeringExcellence).toBe(3)
        expect(result.aggregatedScores.operationalOwnership).toBe(3)
        expect(result.aggregatedScores.peopleImpact).toBe(3)
      })

      it('should handle five feedbacks and aggregate correctly', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedbacks = [
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate(), {
            projectImpact: 1,
            direction: 2,
            engineeringExcellence: 3,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate(), {
            projectImpact: 2,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 3,
          }),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate(), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate(), {
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          }),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate(), {
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 3,
            operationalOwnership: 2,
            peopleImpact: 3,
          }),
        ]

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackCount).toBe(5)
        expect(result.aggregatedScores.projectImpact).toBe(2) // (1+2+3+2+2)/5 = 2
        expect(result.aggregatedScores.direction).toBe(2) // (2+3+3+2+2)/5 = 2.4 -> 2
        expect(result.aggregatedScores.engineeringExcellence).toBe(3) // (3+4+3+2+3)/5 = 3
        expect(result.aggregatedScores.operationalOwnership).toBe(3) // (4+4+3+2+2)/5 = 3
        expect(result.aggregatedScores.peopleImpact).toBe(3) // (4+3+3+2+3)/5 = 3
      })

      it('should return correct feedback count matching number of feedbacks', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedbacks = [
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate()),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate()),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate()),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate()),
        ]

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackCount).toBe(4)
      })
    })

    describe('IMPORTANT: Should collect anonymized comments correctly', () => {
      it('should include only populated comment fields', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Good work',
          // No growthAreas or generalComments
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments[0]).toHaveProperty('strengths', 'Good work')
        expect(result.anonymizedComments[0]).not.toHaveProperty('growthAreas')
        expect(result.anonymizedComments[0]).not.toHaveProperty('generalComments')
      })

      it('should skip feedbacks with no comments at all', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedbackWithComments = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Great work',
        })
        const feedbackWithoutComments = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          // No comments
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([
          feedbackWithComments,
          feedbackWithoutComments,
        ])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments).toHaveLength(1)
        expect(result.anonymizedComments[0].strengths).toBe('Great work')
      })

      it('should handle feedback with all three comment types', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Technical expertise',
          growthAreas: 'Time management',
          generalComments: 'Overall good performance',
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments[0]).toEqual({
          strengths: 'Technical expertise',
          growthAreas: 'Time management',
          generalComments: 'Overall good performance',
        })
      })

      it('should preserve order of comments from different feedbacks', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback1 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'First feedback strength',
        })
        const feedback2 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          strengths: 'Second feedback strength',
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback1, feedback2])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments[0].strengths).toBe('First feedback strength')
        expect(result.anonymizedComments[1].strengths).toBe('Second feedback strength')
      })
    })

    describe('IMPORTANT: Should validate repository interactions', () => {
      it('should call repositories in correct order', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate())

        const callOrder: string[] = []
        cycleRepository.findById.mockImplementation(async () => {
          callOrder.push('cycleRepository.findById')
          return cycle
        })
        peerFeedbackRepository.findByRevieweeAndCycle.mockImplementation(async () => {
          callOrder.push('peerFeedbackRepository.findByRevieweeAndCycle')
          return [feedback]
        })

        // Act
        await useCase.execute(input)

        // Assert
        expect(callOrder).toEqual([
          'cycleRepository.findById',
          'peerFeedbackRepository.findByRevieweeAndCycle',
        ])
      })

      it('should not call save on any repository', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate())

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        await useCase.execute(input)

        // Assert
        expect(peerFeedbackRepository.save).not.toHaveBeenCalled()
        expect(cycleRepository.save).not.toHaveBeenCalled()
      })

      it('should only query repositories once per execution', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate())

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        await useCase.execute(input)

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledTimes(1)
        expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledTimes(1)
      })
    })

    describe('EDGE: Should handle single feedback', () => {
      it('should return single feedback scores without averaging', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = createValidPeerFeedback(
          input.cycleId,
          input.revieweeId,
          UserId.generate(),
          {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 2,
            peopleImpact: 3,
          },
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackCount).toBe(1)
        expect(result.aggregatedScores).toEqual({
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 2,
          peopleImpact: 3,
        })
      })

      it('should return single comment in anonymizedComments array', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Only one feedback',
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments).toHaveLength(1)
        expect(result.anonymizedComments[0].strengths).toBe('Only one feedback')
      })
    })

    describe('EDGE: Should handle missing comments', () => {
      it('should handle feedbacks with no comments', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback1 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
        })
        const feedback2 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([feedback1, feedback2])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackCount).toBe(2)
        expect(result.anonymizedComments).toHaveLength(0)
        expect(result.aggregatedScores.projectImpact).toBe(4) // (3+4)/2 = 3.5 -> 4
      })

      it('should handle partial comments across multiple feedbacks', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedback1 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Good at coding',
        })
        const feedback2 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          growthAreas: 'Needs improvement in communication',
        })
        const feedback3 = PeerFeedback.create({
          cycleId: input.cycleId,
          revieweeId: input.revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          generalComments: 'Solid performer',
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue([
          feedback1,
          feedback2,
          feedback3,
        ])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.anonymizedComments).toHaveLength(3)
        expect(result.anonymizedComments[0]).toEqual({ strengths: 'Good at coding' })
        expect(result.anonymizedComments[1]).toEqual({
          growthAreas: 'Needs improvement in communication',
        })
        expect(result.anonymizedComments[2]).toEqual({ generalComments: 'Solid performer' })
      })
    })

    describe('EDGE: Should handle repository errors', () => {
      it('should throw error if cycle repository fails', async () => {
        // Arrange
        const input = createValidInput()
        const error = new Error('Database connection failed')
        cycleRepository.findById.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Database connection failed')
      })

      it('should throw error if peer feedback repository fails', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const error = new Error('Query failed')
        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Query failed')
      })

      it('should propagate custom exceptions without modification', async () => {
        // Arrange
        const input = createValidInput()
        const customError = new ReviewNotFoundException('Custom error')
        cycleRepository.findById.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(customError)
      })
    })

    describe('EDGE: Should handle different reviewee and cycle combinations', () => {
      it('should work with different revieweeId values', async () => {
        // Arrange
        const reviewee1 = UserId.generate()
        const reviewee2 = UserId.generate()
        const cycleId = ReviewCycleId.generate()
        const cycle = createValidReviewCycle(cycleId)

        const feedback1 = createValidPeerFeedback(cycleId, reviewee1, UserId.generate())
        const feedback2 = createValidPeerFeedback(cycleId, reviewee2, UserId.generate())

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle
          .mockResolvedValueOnce([feedback1])
          .mockResolvedValueOnce([feedback2])

        // Act
        const result1 = await useCase.execute({ revieweeId: reviewee1, cycleId })
        const result2 = await useCase.execute({ revieweeId: reviewee2, cycleId })

        // Assert
        expect(result1.feedbackCount).toBe(1)
        expect(result2.feedbackCount).toBe(1)
        expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledTimes(2)
      })

      it('should work with different cycleId values', async () => {
        // Arrange
        const revieweeId = UserId.generate()
        const cycle1Id = ReviewCycleId.generate()
        const cycle2Id = ReviewCycleId.generate()
        const cycle1 = createValidReviewCycle(cycle1Id)
        const cycle2 = createValidReviewCycle(cycle2Id)

        const feedback1 = createValidPeerFeedback(cycle1Id, revieweeId, UserId.generate())
        const feedback2 = createValidPeerFeedback(cycle2Id, revieweeId, UserId.generate())

        cycleRepository.findById.mockResolvedValueOnce(cycle1).mockResolvedValueOnce(cycle2)
        peerFeedbackRepository.findByRevieweeAndCycle
          .mockResolvedValueOnce([feedback1])
          .mockResolvedValueOnce([feedback2])

        // Act
        const result1 = await useCase.execute({ revieweeId, cycleId: cycle1Id })
        const result2 = await useCase.execute({ revieweeId, cycleId: cycle2Id })

        // Assert
        expect(result1.feedbackCount).toBe(1)
        expect(result2.feedbackCount).toBe(1)
        expect(cycleRepository.findById).toHaveBeenCalledTimes(2)
      })
    })

    describe('Integration scenarios', () => {
      it('should complete full workflow: validate cycle, find feedbacks, aggregate, return result', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedbacks = [
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate()),
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate()),
        ]

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId)
        expect(peerFeedbackRepository.findByRevieweeAndCycle).toHaveBeenCalledWith(
          input.revieweeId,
          input.cycleId,
        )
        expect(result.feedbackCount).toBe(2)
        expect(result.aggregatedScores).toBeDefined()
        expect(result.anonymizedComments).toBeDefined()
      })

      it('should maintain data consistency across aggregation', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const feedbacks = [
          createValidPeerFeedback(input.cycleId, input.revieweeId, UserId.generate(), {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
        ]

        cycleRepository.findById.mockResolvedValue(cycle)
        peerFeedbackRepository.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.aggregatedScores.projectImpact).toBe(3)
        expect(result.aggregatedScores.direction).toBe(3)
        expect(result.aggregatedScores.engineeringExcellence).toBe(3)
        expect(result.aggregatedScores.operationalOwnership).toBe(3)
        expect(result.aggregatedScores.peopleImpact).toBe(3)
        expect(result.feedbackCount).toBe(feedbacks.length)
      })
    })
  })
})
