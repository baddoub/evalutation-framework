import { Test, TestingModule } from '@nestjs/testing'
import { GetPeerFeedbackUseCase } from '../../../../../../src/performance-reviews/application/use-cases/peer-feedback/get-peer-feedback.use-case'
import { IPeerFeedbackRepository } from '../../../../../../src/performance-reviews/domain/repositories/peer-feedback.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { PeerFeedbackAggregationService } from '../../../../../../src/performance-reviews/domain/services/peer-feedback-aggregation.service'
import { PeerFeedback } from '../../../../../../src/performance-reviews/domain/entities/peer-feedback.entity'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('GetPeerFeedbackUseCase', () => {
  let useCase: GetPeerFeedbackUseCase
  let peerFeedbackRepo: jest.Mocked<IPeerFeedbackRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>
  let aggregationService: PeerFeedbackAggregationService

  beforeEach(async () => {
    const mockPeerFeedbackRepo = {
      findByReviewerAndCycle: jest.fn(),
      findByRevieweeAndCycle: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByCycle: jest.fn(),
      delete: jest.fn(),
    }

    const mockCycleRepo = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPeerFeedbackUseCase,
        { provide: 'IPeerFeedbackRepository', useValue: mockPeerFeedbackRepo },
        { provide: 'IReviewCycleRepository', useValue: mockCycleRepo },
        PeerFeedbackAggregationService,
      ],
    }).compile()

    useCase = module.get<GetPeerFeedbackUseCase>(GetPeerFeedbackUseCase)
    peerFeedbackRepo = module.get('IPeerFeedbackRepository')
    cycleRepo = module.get('IReviewCycleRepository')
    aggregationService = module.get<PeerFeedbackAggregationService>(PeerFeedbackAggregationService)
  })

  describe('execute', () => {
    it('should return aggregated peer feedback successfully', async () => {
      // Arrange
      const revieweeId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      const feedbacks = [
        PeerFeedback.create({
          cycleId,
          revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Great technical skills',
          growthAreas: 'Communication',
          generalComments: 'Excellent peer',
        }),
        PeerFeedback.create({
          cycleId,
          revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 3,
          }),
          strengths: 'Strong problem solving',
          growthAreas: 'Time management',
          generalComments: 'Very helpful',
        }),
      ]

      cycleRepo.findById.mockResolvedValue(cycle)
      peerFeedbackRepo.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

      // Act
      const result = await useCase.execute({ revieweeId, cycleId })

      // Assert
      expect(result).toBeDefined()
      expect(result.feedbackCount).toBe(2)
      expect(result.aggregatedScores).toBeDefined()
      expect(result.anonymizedComments).toHaveLength(2)
    })

    it('should throw error if cycle not found', async () => {
      // Arrange
      const revieweeId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      cycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ revieweeId, cycleId })).rejects.toThrow(ReviewNotFoundException)
    })

    it('should return empty result if no feedback exists', async () => {
      // Arrange
      const revieweeId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      peerFeedbackRepo.findByRevieweeAndCycle.mockResolvedValue([])

      // Act
      const result = await useCase.execute({ revieweeId, cycleId })

      // Assert
      expect(result.feedbackCount).toBe(0)
      expect(result.aggregatedScores.projectImpact).toBe(0)
      expect(result.anonymizedComments).toHaveLength(0)
    })

    it('should anonymize reviewer identities', async () => {
      // Arrange
      const revieweeId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      const feedbacks = [
        PeerFeedback.create({
          cycleId,
          revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          strengths: 'Great skills',
          growthAreas: 'Communication',
          generalComments: 'Good work',
        }),
      ]

      cycleRepo.findById.mockResolvedValue(cycle)
      peerFeedbackRepo.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

      // Act
      const result = await useCase.execute({ revieweeId, cycleId })

      // Assert
      expect(result.anonymizedComments).toBeDefined()
      result.anonymizedComments.forEach((comment) => {
        expect(comment).not.toHaveProperty('reviewerId')
      })
    })

    it('should calculate average scores correctly', async () => {
      // Arrange
      const revieweeId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      const feedbacks = [
        PeerFeedback.create({
          cycleId,
          revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          }),
          strengths: 'Feedback 1',
          growthAreas: 'Growth 1',
          generalComments: 'Comments 1',
        }),
        PeerFeedback.create({
          cycleId,
          revieweeId,
          reviewerId: UserId.generate(),
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          strengths: 'Feedback 2',
          growthAreas: 'Growth 2',
          generalComments: 'Comments 2',
        }),
      ]

      cycleRepo.findById.mockResolvedValue(cycle)
      peerFeedbackRepo.findByRevieweeAndCycle.mockResolvedValue(feedbacks)

      // Act
      const result = await useCase.execute({ revieweeId, cycleId })

      // Assert
      // Average of 2 and 4 should be 3
      expect(result.aggregatedScores.projectImpact).toBe(3)
      expect(result.aggregatedScores.direction).toBe(3)
      expect(result.aggregatedScores.engineeringExcellence).toBe(3)
      expect(result.aggregatedScores.operationalOwnership).toBe(3)
      expect(result.aggregatedScores.peopleImpact).toBe(3)
    })
  })
})
