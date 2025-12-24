import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { GetReviewCycleUseCase } from './get-review-cycle.use-case'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { InvalidReviewCycleIdException } from '../../../domain/exceptions/invalid-review-cycle-id.exception'

describe('GetReviewCycleUseCase', () => {
  let useCase: GetReviewCycleUseCase
  let reviewCycleRepo: jest.Mocked<IReviewCycleRepository>

  const validCycleId = '550e8400-e29b-41d4-a716-446655440000'

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
        GetReviewCycleUseCase,
        { provide: 'IReviewCycleRepository', useValue: mockReviewCycleRepo },
      ],
    }).compile()

    useCase = module.get<GetReviewCycleUseCase>(GetReviewCycleUseCase)
    reviewCycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should successfully retrieve a review cycle by ID', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(validCycleId)
      expect(result.name).toBe('2025 Annual Review')
      expect(result.year).toBe(2025)
      expect(result.status).toBe('DRAFT')
      expect(result.startDate).toEqual(new Date('2025-02-01'))
    })

    it('should throw error when review cycle is not found', async () => {
      // Arrange
      reviewCycleRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(validCycleId)).rejects.toThrow('Review cycle not found')
    })

    it('should call repository findById with correct ReviewCycleId', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      await useCase.execute(validCycleId)

      // Assert
      expect(reviewCycleRepo.findById).toHaveBeenCalledTimes(1)
      expect(reviewCycleRepo.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          value: validCycleId,
        }),
      )
    })

    it('should return DTO with all required fields', async () => {
      // Arrange
      const startDate = new Date('2025-02-01')
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate,
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('deadlines')
      expect(result).toHaveProperty('startDate')
      expect(result).toHaveProperty('endDate')
    })

    it('should return DTO with all deadline fields', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result.deadlines).toBeDefined()
      expect(result.deadlines.selfReview).toEqual(new Date('2025-02-28'))
      expect(result.deadlines.peerFeedback).toEqual(new Date('2025-03-15'))
      expect(result.deadlines.managerEvaluation).toEqual(new Date('2025-03-31'))
      expect(result.deadlines.calibration).toEqual(new Date('2025-04-15'))
      expect(result.deadlines.feedbackDelivery).toEqual(new Date('2025-04-30'))
    })

    it('should return ACTIVE status for activated cycle', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })
      cycle.start()

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result.status).toBe('ACTIVE')
    })

    it('should return CALIBRATION status for cycle in calibration phase', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })
      cycle.start()
      cycle.enterCalibration()

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result.status).toBe('CALIBRATION')
    })

    it('should return COMPLETED status for completed cycle with endDate', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })
      cycle.start()
      cycle.enterCalibration()
      cycle.complete()

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result.status).toBe('COMPLETED')
      expect(result.endDate).toBeDefined()
    })

    it('should return undefined endDate for non-completed cycle', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result.endDate).toBeUndefined()
    })

    it('should handle different cycle years correctly', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2024-02-28'),
        peerFeedback: new Date('2024-03-15'),
        managerEvaluation: new Date('2024-03-31'),
        calibration: new Date('2024-04-15'),
        feedbackDelivery: new Date('2024-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2024 Annual Review',
        year: 2024,
        deadlines,
        startDate: new Date('2024-02-01'),
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result.year).toBe(2024)
    })

    it('should only call repository once per execution', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      await useCase.execute(validCycleId)

      // Assert
      expect(reviewCycleRepo.findById).toHaveBeenCalledTimes(1)
      expect(reviewCycleRepo.findByYear).not.toHaveBeenCalled()
      expect(reviewCycleRepo.findActive).not.toHaveBeenCalled()
    })

    it('should throw InvalidReviewCycleIdException for invalid cycle ID format', async () => {
      // Arrange
      const invalidCycleId = 'invalid-uuid-format'

      // Act & Assert
      await expect(useCase.execute(invalidCycleId)).rejects.toThrow(InvalidReviewCycleIdException)
    })

    it('should handle cycle with different name formats', async () => {
      // Arrange
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      const cycleId = ReviewCycleId.create(validCycleId)
      const cycle = ReviewCycle.create({
        id: cycleId,
        name: 'Q1 Performance Review 2025',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })

      reviewCycleRepo.findById.mockResolvedValue(cycle)

      // Act
      const result = await useCase.execute(validCycleId)

      // Assert
      expect(result.name).toBe('Q1 Performance Review 2025')
    })
  })
})
