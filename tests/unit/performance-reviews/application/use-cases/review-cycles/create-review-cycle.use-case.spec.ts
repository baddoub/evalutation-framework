import { Test, TestingModule } from '@nestjs/testing'
import { CreateReviewCycleUseCase } from '../../../../../../src/performance-reviews/application/use-cases/review-cycles/create-review-cycle.use-case'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { InvalidCycleDeadlinesException } from '../../../../../../src/performance-reviews/domain/exceptions/invalid-cycle-deadlines.exception'

describe('CreateReviewCycleUseCase', () => {
  let useCase: CreateReviewCycleUseCase
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
        CreateReviewCycleUseCase,
        { provide: 'IReviewCycleRepository', useValue: mockReviewCycleRepo },
      ],
    }).compile()

    useCase = module.get<CreateReviewCycleUseCase>(CreateReviewCycleUseCase)
    reviewCycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    it('should create review cycle successfully with valid deadlines', async () => {
      // Arrange
      const input = {
        name: '2025 Annual Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-02-28'),
          peerFeedback: new Date('2025-03-15'),
          managerEvaluation: new Date('2025-03-31'),
          calibration: new Date('2025-04-15'),
          feedbackDelivery: new Date('2025-04-30'),
        },
        startDate: new Date('2025-02-01'),
      }

      const mockCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: expect.anything(),
        startDate: input.startDate,
      })

      reviewCycleRepo.save.mockResolvedValue(mockCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe('2025 Annual Review')
      expect(result.year).toBe(2025)
      expect(result.status).toBe('DRAFT')
      expect(result.deadlines).toBeDefined()
      expect(result.deadlines.selfReview).toEqual(input.deadlines.selfReview)
      expect(reviewCycleRepo.save).toHaveBeenCalledWith(expect.any(ReviewCycle))
    })

    it('should throw error if deadlines are not chronological', async () => {
      // Arrange
      const input = {
        name: '2025 Annual Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-03-31'), // After peerFeedback - invalid!
          peerFeedback: new Date('2025-03-15'),
          managerEvaluation: new Date('2025-03-31'),
          calibration: new Date('2025-04-15'),
          feedbackDelivery: new Date('2025-04-30'),
        },
        startDate: new Date('2025-02-01'),
      }

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidCycleDeadlinesException)
      expect(reviewCycleRepo.save).not.toHaveBeenCalled()
    })

    it('should create cycle with status DRAFT', async () => {
      // Arrange
      const input = {
        name: 'Q1 2025 Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-02-28'),
          peerFeedback: new Date('2025-03-15'),
          managerEvaluation: new Date('2025-03-31'),
          calibration: new Date('2025-04-15'),
          feedbackDelivery: new Date('2025-04-30'),
        },
        startDate: new Date('2025-02-01'),
      }

      const mockCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: expect.anything(),
        startDate: input.startDate,
      })

      reviewCycleRepo.save.mockResolvedValue(mockCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe('DRAFT')
    })

    it('should persist cycle to repository', async () => {
      // Arrange
      const input = {
        name: 'H1 2025 Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-06-30'),
          peerFeedback: new Date('2025-07-15'),
          managerEvaluation: new Date('2025-07-31'),
          calibration: new Date('2025-08-15'),
          feedbackDelivery: new Date('2025-08-31'),
        },
        startDate: new Date('2025-06-01'),
      }

      const mockCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: expect.anything(),
        startDate: input.startDate,
      })

      reviewCycleRepo.save.mockResolvedValue(mockCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(reviewCycleRepo.save).toHaveBeenCalledTimes(1)
      expect(reviewCycleRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        name: input.name,
        year: input.year,
      }))
    })

    it('should return cycle with generated ID', async () => {
      // Arrange
      const input = {
        name: '2025 Mid-Year Review',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-06-30'),
          peerFeedback: new Date('2025-07-15'),
          managerEvaluation: new Date('2025-07-31'),
          calibration: new Date('2025-08-15'),
          feedbackDelivery: new Date('2025-08-31'),
        },
        startDate: new Date('2025-06-01'),
      }

      const mockCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: expect.anything(),
        startDate: input.startDate,
      })

      reviewCycleRepo.save.mockResolvedValue(mockCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
    })
  })
})
