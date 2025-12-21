import { Test, TestingModule } from '@nestjs/testing'
import { GetActiveCycleUseCase } from '../../../../../../src/performance-reviews/application/use-cases/review-cycles/get-active-cycle.use-case'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('GetActiveCycleUseCase', () => {
  let useCase: GetActiveCycleUseCase
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
        GetActiveCycleUseCase,
        { provide: 'IReviewCycleRepository', useValue: mockReviewCycleRepo },
      ],
    }).compile()

    useCase = module.get<GetActiveCycleUseCase>(GetActiveCycleUseCase)
    reviewCycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should return active cycle successfully', async () => {
      // Arrange
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
      cycle.start()

      reviewCycleRepo.findActive.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(cycle.id.value)
      expect(result.name).toBe('2025 Annual Review')
      expect(result.year).toBe(2025)
      expect(result.status).toBe('ACTIVE')
      expect(reviewCycleRepo.findActive).toHaveBeenCalledTimes(1)
    })

    it('should throw error if no active cycle exists', async () => {
      // Arrange
      reviewCycleRepo.findActive.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(ReviewNotFoundException)
    })

    it('should return cycle with all deadlines', async () => {
      // Arrange
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
      cycle.start()

      reviewCycleRepo.findActive.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result.deadlines).toBeDefined()
      expect(result.deadlines.selfReview).toEqual(deadlines.selfReview)
      expect(result.deadlines.peerFeedback).toEqual(deadlines.peerFeedback)
      expect(result.deadlines.managerEvaluation).toEqual(deadlines.managerEvaluation)
      expect(result.deadlines.calibration).toEqual(deadlines.calibration)
      expect(result.deadlines.feedbackDelivery).toEqual(deadlines.feedbackDelivery)
    })

    it('should return cycle with start date', async () => {
      // Arrange
      const startDate = new Date('2025-02-01')
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
        startDate,
      })
      cycle.start()

      reviewCycleRepo.findActive.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result.startDate).toEqual(startDate)
    })

    it('should only query repository once', async () => {
      // Arrange
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
      cycle.start()

      reviewCycleRepo.findActive.mockResolvedValue(cycle)

      // Act
      await useCase.execute()

      // Assert
      expect(reviewCycleRepo.findActive).toHaveBeenCalledTimes(1)
      expect(reviewCycleRepo.findById).not.toHaveBeenCalled()
      expect(reviewCycleRepo.findByYear).not.toHaveBeenCalled()
    })
  })
})
