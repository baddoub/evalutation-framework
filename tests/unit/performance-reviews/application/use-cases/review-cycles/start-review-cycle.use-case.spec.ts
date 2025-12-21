import { Test, TestingModule } from '@nestjs/testing'
import { StartReviewCycleUseCase } from '../../../../../../src/performance-reviews/application/use-cases/review-cycles/start-review-cycle.use-case'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'
import { InvalidStateTransitionException } from '../../../../../../src/performance-reviews/domain/exceptions/invalid-state-transition.exception'

describe('StartReviewCycleUseCase', () => {
  let useCase: StartReviewCycleUseCase
  let reviewCycleRepo: jest.Mocked<IReviewCycleRepository>

  beforeEach(async () => {
    const mockReviewCycleRepo = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartReviewCycleUseCase,
        { provide: 'IReviewCycleRepository', useValue: mockReviewCycleRepo },
      ],
    }).compile()

    useCase = module.get<StartReviewCycleUseCase>(StartReviewCycleUseCase)
    reviewCycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should start review cycle successfully', async () => {
      // Arrange
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

      reviewCycleRepo.findById.mockResolvedValue(cycle)
      reviewCycleRepo.save.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute({ cycleId })

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('ACTIVE')
      expect(reviewCycleRepo.findById).toHaveBeenCalledWith(cycleId)
      expect(reviewCycleRepo.save).toHaveBeenCalledWith(cycle)
    })

    it('should throw error if cycle not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      reviewCycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ cycleId })).rejects.toThrow(ReviewNotFoundException)
      expect(reviewCycleRepo.save).not.toHaveBeenCalled()
    })

    it('should throw error if cycle already active', async () => {
      // Arrange
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

      // Start cycle first time
      cycle.start()

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute({ cycleId })).rejects.toThrow(InvalidStateTransitionException)
      expect(reviewCycleRepo.save).not.toHaveBeenCalled()
    })

    it('should transition status from DRAFT to ACTIVE', async () => {
      // Arrange
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

      // Verify initial state
      expect(cycle.status.value).toBe('DRAFT')

      reviewCycleRepo.findById.mockResolvedValue(cycle)
      reviewCycleRepo.save.mockResolvedValue(cycle)

      // Act
      await useCase.execute({ cycleId })

      // Assert
      expect(cycle.status.value).toBe('ACTIVE')
    })

    it('should persist state changes to repository', async () => {
      // Arrange
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

      reviewCycleRepo.findById.mockResolvedValue(cycle)
      reviewCycleRepo.save.mockResolvedValue(cycle)

      // Act
      await useCase.execute({ cycleId })

      // Assert
      expect(reviewCycleRepo.save).toHaveBeenCalledTimes(1)
      expect(reviewCycleRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: expect.objectContaining({ value: 'ACTIVE' }),
      }))
    })
  })
})
