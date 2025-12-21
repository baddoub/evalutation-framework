import { Test, TestingModule } from '@nestjs/testing'
import { SubmitSelfReviewUseCase } from '../../../../../../src/performance-reviews/application/use-cases/self-reviews/submit-self-review.use-case'
import { ISelfReviewRepository } from '../../../../../../src/performance-reviews/domain/repositories/self-review.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { SelfReview } from '../../../../../../src/performance-reviews/domain/entities/self-review.entity'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'
import { Narrative } from '../../../../../../src/performance-reviews/domain/value-objects/narrative.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('SubmitSelfReviewUseCase', () => {
  let useCase: SubmitSelfReviewUseCase
  let selfReviewRepo: jest.Mocked<ISelfReviewRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>

  beforeEach(async () => {
    const mockSelfReviewRepo = {
      findByUserAndCycle: jest.fn(),
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
        SubmitSelfReviewUseCase,
        { provide: 'ISelfReviewRepository', useValue: mockSelfReviewRepo },
        { provide: 'IReviewCycleRepository', useValue: mockCycleRepo },
      ],
    }).compile()

    useCase = module.get<SubmitSelfReviewUseCase>(SubmitSelfReviewUseCase)
    selfReviewRepo = module.get('ISelfReviewRepository')
    cycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should submit self-review successfully', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'), // Future deadline
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
        narrative: Narrative.fromText('Complete self-review narrative'),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)
      selfReviewRepo.save.mockResolvedValue(review)

      // Act
      const result = await useCase.execute({ userId, cycleId })

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('SUBMITTED')
      expect(result.submittedAt).toBeDefined()
      expect(selfReviewRepo.save).toHaveBeenCalledWith(review)
    })

    it('should throw error if cycle not found', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      cycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ userId, cycleId })).rejects.toThrow(ReviewNotFoundException)
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if review not found', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ userId, cycleId })).rejects.toThrow(ReviewNotFoundException)
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if deadline passed', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2024-02-28'), // Past deadline
        peerFeedback: new Date('2024-03-15'),
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

      cycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute({ userId, cycleId })).rejects.toThrow('Self-review deadline has passed')
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if narrative is empty', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
        narrative: Narrative.fromText(''),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)

      // Act & Assert
      await expect(useCase.execute({ userId, cycleId })).rejects.toThrow(
        'Cannot submit incomplete self-review. Narrative is required.',
      )
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if narrative is only whitespace', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
        narrative: Narrative.fromText('   '),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)

      // Act & Assert
      await expect(useCase.execute({ userId, cycleId })).rejects.toThrow(
        'Cannot submit incomplete self-review. Narrative is required.',
      )
      expect(selfReviewRepo.save).not.toHaveBeenCalled()
    })

    it('should transition status from DRAFT to SUBMITTED', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
        narrative: Narrative.fromText('Complete self-review narrative'),
      })

      // Verify initial state
      expect(review.status.value).toBe('DRAFT')

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)
      selfReviewRepo.save.mockResolvedValue(review)

      // Act
      await useCase.execute({ userId, cycleId })

      // Assert
      expect(review.status.value).toBe('SUBMITTED')
    })

    it('should persist submitted review to repository', async () => {
      // Arrange
      const userId = UserId.generate()
      const cycleId = ReviewCycleId.generate()

      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-12-31'),
        peerFeedback: new Date('2026-01-15'),
        managerEvaluation: new Date('2026-01-31'),
        calibration: new Date('2026-02-15'),
        feedbackDelivery: new Date('2026-02-28'),
      })

      const cycle = ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-12-01'),
      })

      const review = SelfReview.create({
        userId,
        cycleId,
        scores: PillarScores.create({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
        narrative: Narrative.fromText('Complete self-review narrative'),
      })

      cycleRepo.findById.mockResolvedValue(cycle)
      selfReviewRepo.findByUserAndCycle.mockResolvedValue(review)
      selfReviewRepo.save.mockResolvedValue(review)

      // Act
      await useCase.execute({ userId, cycleId })

      // Assert
      expect(selfReviewRepo.save).toHaveBeenCalledTimes(1)
      expect(selfReviewRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: expect.objectContaining({ value: 'SUBMITTED' }),
      }))
    })
  })
})
