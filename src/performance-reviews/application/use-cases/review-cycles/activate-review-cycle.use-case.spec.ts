import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { ActivateReviewCycleUseCase } from './activate-review-cycle.use-case'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { InvalidReviewCycleStateException } from '../../../domain/exceptions/invalid-review-cycle-state.exception'
import { InvalidReviewCycleIdException } from '../../../domain/exceptions/invalid-review-cycle-id.exception'

describe('ActivateReviewCycleUseCase', () => {
  let useCase: ActivateReviewCycleUseCase
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
        ActivateReviewCycleUseCase,
        { provide: 'IReviewCycleRepository', useValue: mockReviewCycleRepo },
      ],
    }).compile()

    useCase = module.get<ActivateReviewCycleUseCase>(ActivateReviewCycleUseCase)
    reviewCycleRepo = module.get('IReviewCycleRepository')
  })

  describe('execute', () => {
    const createMockCycle = () => {
      const deadlines = CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      })

      return ReviewCycle.create({
        name: '2025 Annual Review',
        year: 2025,
        deadlines,
        startDate: new Date('2025-02-01'),
      })
    }

    describe('Happy Path', () => {
      it('should successfully activate a review cycle', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        const result = await useCase.execute(cycleId)

        // Assert
        expect(result).toBeDefined()
        expect(result.id).toBe(cycle.id.value)
        expect(result.name).toBe('2025 Annual Review')
        expect(result.status).toBe('ACTIVE')
        expect(result.activatedAt).toEqual(cycle.startDate)
      })

      it('should call activate() method on the entity', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value
        const activateSpy = jest.spyOn(cycle, 'activate')

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        await useCase.execute(cycleId)

        // Assert
        expect(activateSpy).toHaveBeenCalledTimes(1)
      })

      it('should save the activated cycle to repository', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        await useCase.execute(cycleId)

        // Assert
        expect(reviewCycleRepo.save).toHaveBeenCalledTimes(1)
        expect(reviewCycleRepo.save).toHaveBeenCalledWith(cycle)
      })

      it('should return correct output DTO structure', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        const result = await useCase.execute(cycleId)

        // Assert
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('activatedAt')
        expect(typeof result.id).toBe('string')
        expect(typeof result.name).toBe('string')
        expect(typeof result.status).toBe('string')
        expect(result.activatedAt).toBeInstanceOf(Date)
      })

      it('should transition status from DRAFT to ACTIVE', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        // Verify initial state
        expect(cycle.status.value).toBe('DRAFT')

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        await useCase.execute(cycleId)

        // Assert
        expect(cycle.status.value).toBe('ACTIVE')
      })

      it('should call findById with correct ReviewCycleId value object', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        await useCase.execute(cycleId)

        // Assert
        expect(reviewCycleRepo.findById).toHaveBeenCalledTimes(1)
        const callArg = reviewCycleRepo.findById.mock.calls[0][0]
        expect(callArg).toBeInstanceOf(ReviewCycleId)
        expect(callArg.value).toBe(cycleId)
      })
    })

    describe('Error Handling - Cycle Not Found', () => {
      it('should throw error when cycle is not found', async () => {
        // Arrange
        const cycleId = ReviewCycleId.generate().value
        reviewCycleRepo.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(cycleId)).rejects.toThrow('Review cycle not found')
      })

      it('should not save when cycle is not found', async () => {
        // Arrange
        const cycleId = ReviewCycleId.generate().value
        reviewCycleRepo.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(cycleId)).rejects.toThrow()
        expect(reviewCycleRepo.save).not.toHaveBeenCalled()
      })
    })

    describe('Error Handling - Already Active Cycle', () => {
      it('should throw error when cycle is already active', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        // Activate cycle first
        cycle.activate()
        expect(cycle.status.value).toBe('ACTIVE')

        reviewCycleRepo.findById.mockResolvedValue(cycle)

        // Act & Assert
        await expect(useCase.execute(cycleId)).rejects.toThrow(InvalidReviewCycleStateException)
      })

      it('should not save when cycle is already active', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        // Activate cycle first
        cycle.activate()

        reviewCycleRepo.findById.mockResolvedValue(cycle)

        // Act & Assert
        await expect(useCase.execute(cycleId)).rejects.toThrow()
        expect(reviewCycleRepo.save).not.toHaveBeenCalled()
      })
    })

    describe('Error Handling - Invalid State Transitions', () => {
      it('should throw error when trying to activate from CALIBRATION status', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        // Move cycle to CALIBRATION state
        cycle.activate()
        cycle.enterCalibration()
        expect(cycle.status.value).toBe('CALIBRATION')

        reviewCycleRepo.findById.mockResolvedValue(cycle)

        // Act & Assert
        await expect(useCase.execute(cycleId)).rejects.toThrow(InvalidReviewCycleStateException)
        await expect(useCase.execute(cycleId)).rejects.toThrow(
          /Cannot start cycle from CALIBRATION status/,
        )
      })

      it('should throw error when trying to activate from COMPLETED status', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        // Move cycle to COMPLETED state
        cycle.activate()
        cycle.enterCalibration()
        cycle.complete()
        expect(cycle.status.value).toBe('COMPLETED')

        reviewCycleRepo.findById.mockResolvedValue(cycle)

        // Act & Assert
        await expect(useCase.execute(cycleId)).rejects.toThrow(InvalidReviewCycleStateException)
        await expect(useCase.execute(cycleId)).rejects.toThrow(
          /Cannot start cycle from COMPLETED status/,
        )
      })

      it('should not save when state transition is invalid', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        // Move to COMPLETED state
        cycle.activate()
        cycle.enterCalibration()
        cycle.complete()

        reviewCycleRepo.findById.mockResolvedValue(cycle)

        // Act & Assert
        await expect(useCase.execute(cycleId)).rejects.toThrow()
        expect(reviewCycleRepo.save).not.toHaveBeenCalled()
      })
    })

    describe('Edge Cases', () => {
      it('should handle invalid cycle ID format gracefully', async () => {
        // Arrange
        const invalidCycleId = 'invalid-uuid-format'

        // Act & Assert
        // ReviewCycleId.create will validate the UUID format
        await expect(useCase.execute(invalidCycleId)).rejects.toThrow(InvalidReviewCycleIdException)
      })

      it('should preserve cycle data integrity after activation', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value
        const originalName = cycle.name
        const originalYear = cycle.year
        const originalDeadlines = cycle.deadlines

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        await useCase.execute(cycleId)

        // Assert - verify only status changed, other data preserved
        expect(cycle.name).toBe(originalName)
        expect(cycle.year).toBe(originalYear)
        expect(cycle.deadlines).toBe(originalDeadlines)
        expect(cycle.status.value).toBe('ACTIVE')
      })

      it('should use startDate as activatedAt in output', async () => {
        // Arrange
        const specificStartDate = new Date('2025-01-15T10:00:00Z')
        const deadlines = CycleDeadlines.create({
          selfReview: new Date('2025-02-28'),
          peerFeedback: new Date('2025-03-15'),
          managerEvaluation: new Date('2025-03-31'),
          calibration: new Date('2025-04-15'),
          feedbackDelivery: new Date('2025-04-30'),
        })

        const cycle = ReviewCycle.create({
          name: 'Q1 2025 Review',
          year: 2025,
          deadlines,
          startDate: specificStartDate,
        })

        const cycleId = cycle.id.value

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        const result = await useCase.execute(cycleId)

        // Assert
        expect(result.activatedAt).toEqual(specificStartDate)
      })

      it('should handle repository save returning updated cycle', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        reviewCycleRepo.findById.mockResolvedValue(cycle)

        // Mock repository returning the same cycle after save
        reviewCycleRepo.save.mockImplementation(async (cycleToSave) => cycleToSave)

        // Act
        const result = await useCase.execute(cycleId)

        // Assert
        expect(result.status).toBe('ACTIVE')
        expect(reviewCycleRepo.save).toHaveBeenCalledWith(cycle)
      })
    })

    describe('Repository Integration', () => {
      it('should call repository methods in correct order', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value
        const callOrder: string[] = []

        reviewCycleRepo.findById.mockImplementation(async () => {
          callOrder.push('findById')
          return cycle
        })

        reviewCycleRepo.save.mockImplementation(async (c) => {
          callOrder.push('save')
          return c
        })

        // Act
        await useCase.execute(cycleId)

        // Assert
        expect(callOrder).toEqual(['findById', 'save'])
      })

      it('should only call save after successful activation', async () => {
        // Arrange
        const cycle = createMockCycle()
        const cycleId = cycle.id.value

        reviewCycleRepo.findById.mockResolvedValue(cycle)
        reviewCycleRepo.save.mockResolvedValue(cycle)

        // Act
        await useCase.execute(cycleId)

        // Assert
        expect(reviewCycleRepo.save).toHaveBeenCalledTimes(1)
        expect(cycle.status.value).toBe('ACTIVE')
      })
    })
  })
})
