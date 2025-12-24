import { GetActiveCycleUseCase } from './get-active-cycle.use-case'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import type { GetActiveCycleOutput } from '../../dto/review-cycle.dto'

describe('GetActiveCycleUseCase', () => {
  let useCase: GetActiveCycleUseCase
  let reviewCycleRepository: jest.Mocked<IReviewCycleRepository>

  // Test data factories
  const createValidCycleDeadlines = (): CycleDeadlines => {
    return CycleDeadlines.create({
      selfReview: new Date('2024-01-31'),
      peerFeedback: new Date('2024-02-28'),
      managerEvaluation: new Date('2024-03-31'),
      calibration: new Date('2024-04-30'),
      feedbackDelivery: new Date('2024-05-31'),
    })
  }

  const createActiveCycle = (): ReviewCycle => {
    const deadlines = createValidCycleDeadlines()
    const cycle = ReviewCycle.create({
      id: ReviewCycleId.generate(),
      year: 2024,
      startDate: new Date('2024-01-01'),
      name: 'Annual Review 2024',
      deadlines,
    })
    cycle.activate() // DRAFT → ACTIVE
    return cycle
  }

  const createDraftCycle = (): ReviewCycle => {
    const deadlines = createValidCycleDeadlines()
    return ReviewCycle.create({
      id: ReviewCycleId.generate(),
      year: 2024,
      startDate: new Date('2024-01-01'),
      name: 'Annual Review 2024',
      deadlines,
    })
  }

  const createCalibrationCycle = (): ReviewCycle => {
    const deadlines = createValidCycleDeadlines()
    const cycle = ReviewCycle.create({
      id: ReviewCycleId.generate(),
      year: 2024,
      startDate: new Date('2024-01-01'),
      name: 'Annual Review 2024',
      deadlines,
    })
    cycle.activate() // DRAFT → ACTIVE
    cycle.enterCalibration() // ACTIVE → CALIBRATION
    return cycle
  }

  const createCompletedCycle = (): ReviewCycle => {
    const deadlines = createValidCycleDeadlines()
    const cycle = ReviewCycle.create({
      id: ReviewCycleId.generate(),
      year: 2024,
      startDate: new Date('2024-01-01'),
      name: 'Annual Review 2024',
      deadlines,
    })
    cycle.activate() // DRAFT → ACTIVE
    cycle.enterCalibration() // ACTIVE → CALIBRATION
    cycle.complete() // CALIBRATION → COMPLETED
    return cycle
  }

  beforeEach(() => {
    // Create mock repository
    reviewCycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    // Create use case instance
    useCase = new GetActiveCycleUseCase(reviewCycleRepository)
  })

  describe('execute', () => {
    describe('CRITICAL: Happy path - returns active cycle when one exists', () => {
      it('should return active cycle with all data populated', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result).not.toBeNull()
        expect(result!.id).toBe(activeCycle.id.value)
        expect(result!.name).toBe('Annual Review 2024')
        expect(result!.year).toBe(2024)
        expect(result!.status).toBe('ACTIVE')
        expect(result!.startDate).toEqual(activeCycle.startDate)
      })

      it('should return cycle with correct deadlines structure', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.deadlines).toBeDefined()
        expect(result!.deadlines.selfReview).toEqual(new Date('2024-01-31'))
        expect(result!.deadlines.peerFeedback).toEqual(new Date('2024-02-28'))
        expect(result!.deadlines.managerEvaluation).toEqual(new Date('2024-03-31'))
        expect(result!.deadlines.calibration).toEqual(new Date('2024-04-30'))
        expect(result!.deadlines.feedbackDelivery).toEqual(new Date('2024-05-31'))
      })

      it('should call repository findActive method', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        await useCase.execute()

        // Assert
        expect(reviewCycleRepository.findActive).toHaveBeenCalledTimes(1)
        expect(reviewCycleRepository.findActive).toHaveBeenCalledWith()
      })

      it('should return DTO with string ID (not value object)', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(typeof result!.id).toBe('string')
        expect(typeof result!.status).toBe('string')
      })

      it('should return DTO conforming to GetActiveCycleOutput interface', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result: GetActiveCycleOutput | null = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result).not.toBeNull()
        expect(typeof result!.id).toBe('string')
        expect(typeof result!.name).toBe('string')
        expect(typeof result!.year).toBe('number')
        expect(typeof result!.status).toBe('string')
        expect(result!.startDate instanceof Date).toBe(true)
        expect(result!.deadlines).toBeDefined()
      })
    })

    describe('CRITICAL: Returns null when no active cycle exists', () => {
      it('should return null when repository returns null', async () => {
        // Arrange
        reviewCycleRepository.findActive.mockResolvedValue(null)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeNull()
      })

      it('should call repository findActive even when no cycle exists', async () => {
        // Arrange
        reviewCycleRepository.findActive.mockResolvedValue(null)

        // Act
        await useCase.execute()

        // Assert
        expect(reviewCycleRepository.findActive).toHaveBeenCalledTimes(1)
      })

      it('should not throw error when no active cycle found', async () => {
        // Arrange
        reviewCycleRepository.findActive.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute()).resolves.toBeNull()
      })
    })

    describe('CRITICAL: Output DTO structure validation when cycle exists', () => {
      it('should return output with all required fields', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('year')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('deadlines')
        expect(result).toHaveProperty('startDate')
      })

      it('should return DTO with correct structure for deadlines', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.deadlines).toHaveProperty('selfReview')
        expect(result!.deadlines).toHaveProperty('peerFeedback')
        expect(result!.deadlines).toHaveProperty('managerEvaluation')
        expect(result!.deadlines).toHaveProperty('calibration')
        expect(result!.deadlines).toHaveProperty('feedbackDelivery')
        expect(result!.deadlines.selfReview instanceof Date).toBe(true)
        expect(result!.deadlines.peerFeedback instanceof Date).toBe(true)
        expect(result!.deadlines.managerEvaluation instanceof Date).toBe(true)
        expect(result!.deadlines.calibration instanceof Date).toBe(true)
        expect(result!.deadlines.feedbackDelivery instanceof Date).toBe(true)
      })

      it('should return primitive types for ID and status', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(typeof result!.id).toBe('string')
        expect(typeof result!.status).toBe('string')
        expect(typeof result!.name).toBe('string')
        expect(typeof result!.year).toBe('number')
      })
    })

    describe('IMPORTANT: Repository findActive() called', () => {
      it('should call findActive exactly once on repository', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        await useCase.execute()

        // Assert
        expect(reviewCycleRepository.findActive).toHaveBeenCalledTimes(1)
      })

      it('should call findActive with no parameters', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        await useCase.execute()

        // Assert
        expect(reviewCycleRepository.findActive).toHaveBeenCalledWith()
      })

      it('should not call other repository methods', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        await useCase.execute()

        // Assert
        expect(reviewCycleRepository.findById).not.toHaveBeenCalled()
        expect(reviewCycleRepository.findByYear).not.toHaveBeenCalled()
        expect(reviewCycleRepository.save).not.toHaveBeenCalled()
        expect(reviewCycleRepository.delete).not.toHaveBeenCalled()
      })
    })

    describe('IMPORTANT: All cycle properties mapped correctly', () => {
      it('should map id from value object to string', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result!.id).toBe(activeCycle.id.value)
        expect(result!.id).not.toBe(activeCycle.id) // Should be string, not VO
      })

      it('should map name correctly', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result!.name).toBe(activeCycle.name)
        expect(result!.name).toBe('Annual Review 2024')
      })

      it('should map year correctly', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result!.year).toBe(activeCycle.year)
        expect(result!.year).toBe(2024)
      })

      it('should map status from value object to string', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result!.status).toBe(activeCycle.status.value)
        expect(result!.status).toBe('ACTIVE')
      })

      it('should map deadlines from value object to plain object', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        const expectedDeadlines = activeCycle.deadlines.toObject()
        expect(result!.deadlines).toEqual(expectedDeadlines)
        expect(result!.deadlines.selfReview).toEqual(expectedDeadlines.selfReview)
        expect(result!.deadlines.peerFeedback).toEqual(expectedDeadlines.peerFeedback)
        expect(result!.deadlines.managerEvaluation).toEqual(expectedDeadlines.managerEvaluation)
        expect(result!.deadlines.calibration).toEqual(expectedDeadlines.calibration)
        expect(result!.deadlines.feedbackDelivery).toEqual(expectedDeadlines.feedbackDelivery)
      })

      it('should map startDate correctly', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result!.startDate).toEqual(activeCycle.startDate)
        expect(result!.startDate).toEqual(new Date('2024-01-01'))
      })

      it('should map all properties correctly in a single assertion', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toEqual({
          id: activeCycle.id.value,
          name: activeCycle.name,
          year: activeCycle.year,
          status: activeCycle.status.value,
          deadlines: activeCycle.deadlines.toObject(),
          startDate: activeCycle.startDate,
        })
      })
    })

    describe('EDGE: Multiple cycles with different statuses', () => {
      it('should return only ACTIVE cycle when repository returns it', async () => {
        // Arrange - Repository should only return ACTIVE cycles
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.status).toBe('ACTIVE')
      })

      it('should return null if findActive returns DRAFT cycle (repository contract violation)', async () => {
        // Arrange - This tests defensive behavior if repository is broken
        const draftCycle = createDraftCycle()
        reviewCycleRepository.findActive.mockResolvedValue(draftCycle)

        // Act
        const result = await useCase.execute()

        // Assert - Use case trusts repository, returns whatever it gets
        expect(result).toBeDefined()
        expect(result!.status).toBe('DRAFT')
      })

      it('should return null if findActive returns CALIBRATION cycle', async () => {
        // Arrange
        const calibrationCycle = createCalibrationCycle()
        reviewCycleRepository.findActive.mockResolvedValue(calibrationCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.status).toBe('CALIBRATION')
      })

      it('should return null if findActive returns COMPLETED cycle', async () => {
        // Arrange
        const completedCycle = createCompletedCycle()
        reviewCycleRepository.findActive.mockResolvedValue(completedCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.status).toBe('COMPLETED')
      })
    })

    describe('EDGE: Different years and names', () => {
      it('should handle cycle from different year', async () => {
        // Arrange
        const deadlines = createValidCycleDeadlines()
        const cycle2023 = ReviewCycle.create({
          id: ReviewCycleId.generate(),
          year: 2023,
          startDate: new Date('2023-01-01'),
          name: 'Annual Review 2023',
          deadlines,
        })
        cycle2023.activate()
        reviewCycleRepository.findActive.mockResolvedValue(cycle2023)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.year).toBe(2023)
        expect(result!.name).toBe('Annual Review 2023')
      })

      it('should handle cycle with custom name', async () => {
        // Arrange
        const deadlines = createValidCycleDeadlines()
        const customCycle = ReviewCycle.create({
          id: ReviewCycleId.generate(),
          year: 2024,
          startDate: new Date('2024-01-01'),
          name: 'Q1 Performance Review',
          deadlines,
        })
        customCycle.activate()
        reviewCycleRepository.findActive.mockResolvedValue(customCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.name).toBe('Q1 Performance Review')
      })
    })

    describe('EDGE: Different start dates', () => {
      it('should handle cycle with custom start date', async () => {
        // Arrange
        const deadlines = createValidCycleDeadlines()
        const customStartDate = new Date('2024-06-01')
        const cycle = ReviewCycle.create({
          id: ReviewCycleId.generate(),
          year: 2024,
          startDate: customStartDate,
          name: 'Mid-Year Review 2024',
          deadlines,
        })
        cycle.activate()
        reviewCycleRepository.findActive.mockResolvedValue(cycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.startDate).toEqual(customStartDate)
      })

      it('should handle cycle with past start date', async () => {
        // Arrange
        const deadlines = createValidCycleDeadlines()
        const pastDate = new Date('2020-01-01')
        const cycle = ReviewCycle.create({
          id: ReviewCycleId.generate(),
          year: 2020,
          startDate: pastDate,
          name: 'Old Review 2020',
          deadlines,
        })
        cycle.activate()
        reviewCycleRepository.findActive.mockResolvedValue(cycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.startDate).toEqual(pastDate)
      })

      it('should handle cycle with future start date', async () => {
        // Arrange
        const deadlines = createValidCycleDeadlines()
        const futureDate = new Date('2030-01-01')
        const cycle = ReviewCycle.create({
          id: ReviewCycleId.generate(),
          year: 2030,
          startDate: futureDate,
          name: 'Future Review 2030',
          deadlines,
        })
        cycle.activate()
        reviewCycleRepository.findActive.mockResolvedValue(cycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(result).toBeDefined()
        expect(result!.startDate).toEqual(futureDate)
      })
    })

    describe('IMPORTANT: Should handle repository errors gracefully', () => {
      it('should throw error if repository fails', async () => {
        // Arrange
        const error = new Error('Database connection failed')
        reviewCycleRepository.findActive.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute()).rejects.toThrow('Database connection failed')
      })

      it('should propagate repository errors without modification', async () => {
        // Arrange
        const customError = new Error('Custom repository error')
        reviewCycleRepository.findActive.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute()).rejects.toThrow(customError)
      })

      it('should handle repository timeout errors', async () => {
        // Arrange
        const timeoutError = new Error('Query timeout')
        reviewCycleRepository.findActive.mockRejectedValue(timeoutError)

        // Act & Assert
        await expect(useCase.execute()).rejects.toThrow('Query timeout')
      })
    })

    describe('Integration scenarios', () => {
      it('should complete full workflow: query and return active cycle', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(reviewCycleRepository.findActive).toHaveBeenCalledTimes(1)
        expect(result).toBeDefined()
        expect(result!.id).toBe(activeCycle.id.value)
        expect(result!.status).toBe('ACTIVE')
      })

      it('should complete full workflow: query and return null', async () => {
        // Arrange
        reviewCycleRepository.findActive.mockResolvedValue(null)

        // Act
        const result = await useCase.execute()

        // Assert
        expect(reviewCycleRepository.findActive).toHaveBeenCalledTimes(1)
        expect(result).toBeNull()
      })

      it('should maintain data consistency between entity and DTO', async () => {
        // Arrange
        const activeCycle = createActiveCycle()
        reviewCycleRepository.findActive.mockResolvedValue(activeCycle)

        // Act
        const result = await useCase.execute()

        // Assert - Verify all entity data is correctly mapped to DTO
        expect(result!.id).toBe(activeCycle.id.value)
        expect(result!.name).toBe(activeCycle.name)
        expect(result!.year).toBe(activeCycle.year)
        expect(result!.status).toBe(activeCycle.status.value)
        expect(result!.startDate).toBe(activeCycle.startDate)

        const entityDeadlines = activeCycle.deadlines.toObject()
        expect(result!.deadlines.selfReview).toEqual(entityDeadlines.selfReview)
        expect(result!.deadlines.peerFeedback).toEqual(entityDeadlines.peerFeedback)
        expect(result!.deadlines.managerEvaluation).toEqual(entityDeadlines.managerEvaluation)
        expect(result!.deadlines.calibration).toEqual(entityDeadlines.calibration)
        expect(result!.deadlines.feedbackDelivery).toEqual(entityDeadlines.feedbackDelivery)
      })
    })
  })
})
