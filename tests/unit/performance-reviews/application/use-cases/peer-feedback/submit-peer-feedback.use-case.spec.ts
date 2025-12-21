import { Test, TestingModule } from '@nestjs/testing'
import { SubmitPeerFeedbackUseCase } from '../../../../../../src/performance-reviews/application/use-cases/peer-feedback/submit-peer-feedback.use-case'
import { IPeerFeedbackRepository } from '../../../../../../src/performance-reviews/domain/repositories/peer-feedback.repository.interface'
import { IPeerNominationRepository } from '../../../../../../src/performance-reviews/domain/repositories/peer-nomination.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { PeerFeedback } from '../../../../../../src/performance-reviews/domain/entities/peer-feedback.entity'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('SubmitPeerFeedbackUseCase', () => {
  let useCase: SubmitPeerFeedbackUseCase
  let peerFeedbackRepo: jest.Mocked<IPeerFeedbackRepository>
  let peerNominationRepo: jest.Mocked<IPeerNominationRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>

  beforeEach(async () => {
    const mockPeerFeedbackRepo = {
      findByReviewerAndCycle: jest.fn(),
      findByRevieweeAndCycle: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByCycle: jest.fn(),
      delete: jest.fn(),
    }

    const mockPeerNominationRepo = {
      findByNominatorAndCycle: jest.fn(),
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
        SubmitPeerFeedbackUseCase,
        { provide: 'IPeerFeedbackRepository', useValue: mockPeerFeedbackRepo },
        { provide: 'IPeerNominationRepository', useValue: mockPeerNominationRepo },
        { provide: 'IReviewCycleRepository', useValue: mockCycleRepo },
      ],
    }).compile()

    useCase = module.get<SubmitPeerFeedbackUseCase>(SubmitPeerFeedbackUseCase)
    peerFeedbackRepo = module.get('IPeerFeedbackRepository')
    peerNominationRepo = module.get('IPeerNominationRepository')
    cycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should submit peer feedback successfully', async () => {
      // Arrange
      const reviewerId = UserId.generate()
      const revieweeId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-12-31'), // Future deadline
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      const nomination = {
        id: 'nomination-id',
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'PENDING' as const,
        nominatedAt: new Date(),
      }

      const input = {
        cycleId,
        reviewerId,
        revieweeId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        strengths: 'Great technical skills',
        growthAreas: 'Could improve communication',
        generalComments: 'Excellent peer',
      }

      const mockFeedback = PeerFeedback.create({
        cycleId,
        revieweeId,
        reviewerId,
        scores: expect.anything(),
        strengths: input.strengths,
        growthAreas: input.growthAreas,
        generalComments: input.generalComments,
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([nomination])
      peerFeedbackRepo.findByReviewerAndCycle.mockResolvedValue([])
      peerFeedbackRepo.save.mockResolvedValue(mockFeedback)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.isAnonymized).toBe(true)
      expect(peerFeedbackRepo.save).toHaveBeenCalled()
    })

    it('should throw error if cycle not found', async () => {
      // Arrange
      const input = {
        cycleId: ReviewCycleId.generate(),
        reviewerId: UserId.generate(),
        revieweeId: UserId.generate(),
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        strengths: 'Great skills',
        growthAreas: 'None',
        generalComments: 'Good work',
      }

      cycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
    })

    it('should throw error if deadline passed', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2024-02-28'),
        peerFeedback: new Date('2024-03-15'), // Past deadline
        managerEvaluation: new Date('2024-03-31'),
        calibration: new Date('2024-04-15'),
        feedbackDelivery: new Date('2024-04-30'),
      })

      const cycle = ReviewCycle.create({
        name: '2024 Annual Review',
        year: 2024,
        deadlines,
        startDate: new Date('2024-02-01'),
      })

      const input = {
        cycleId: ReviewCycleId.generate(),
        reviewerId: UserId.generate(),
        revieweeId: UserId.generate(),
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        strengths: 'Great skills',
        growthAreas: 'None',
        generalComments: 'Good work',
      }

      cycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Peer feedback deadline has passed')
    })

    it('should throw error if no nomination exists', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-12-31'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      const input = {
        cycleId: ReviewCycleId.generate(),
        reviewerId: UserId.generate(),
        revieweeId: UserId.generate(),
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        strengths: 'Great skills',
        growthAreas: 'None',
        generalComments: 'Good work',
      }

      cycleRepo.findById.mockResolvedValue(cycle)
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'No peer nomination found for this reviewer and reviewee',
      )
    })

    it('should throw error if feedback already submitted', async () => {
      // Arrange
      const reviewerId = UserId.generate()
      const revieweeId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-12-31'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      const nomination = {
        id: 'nomination-id',
        cycleId,
        nominatorId: revieweeId,
        nomineeId: reviewerId,
        status: 'PENDING' as const,
        nominatedAt: new Date(),
      }

      const existingFeedback = PeerFeedback.create({
        cycleId,
        revieweeId,
        reviewerId,
        scores: expect.anything(),
        strengths: 'Previous feedback',
        growthAreas: 'Previous growth areas',
        generalComments: 'Previous comments',
      })

      const input = {
        cycleId,
        reviewerId,
        revieweeId,
        scores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        strengths: 'Great skills',
        growthAreas: 'None',
        generalComments: 'Good work',
      }

      cycleRepo.findById.mockResolvedValue(cycle)
      peerNominationRepo.findByNominatorAndCycle.mockResolvedValue([nomination])
      peerFeedbackRepo.findByReviewerAndCycle.mockResolvedValue([existingFeedback])

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Peer feedback already submitted for this reviewee',
      )
    })
  })
})
