import { StartReviewCycleUseCase } from './start-review-cycle.use-case'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { InvalidReviewCycleStateException } from '../../../domain/exceptions/invalid-review-cycle-state.exception'
import { ReviewCycle, CycleStatus } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import type { StartReviewCycleInput, StartReviewCycleOutput } from '../../dto/review-cycle.dto'

describe('StartReviewCycleUseCase', () => {
  let useCase: StartReviewCycleUseCase
  let mockReviewCycleRepository: jest.Mocked<IReviewCycleRepository>

  const createValidReviewCycle = (
    overrides?: Partial<{ id: ReviewCycleId; status: CycleStatus }>,
  ): ReviewCycle => {
    const deadlines = CycleDeadlines.create({
      selfReview: new Date('2025-12-31'),
      peerFeedback: new Date('2026-01-15'),
      managerEvaluation: new Date('2026-01-31'),
      calibration: new Date('2026-02-28'),
      feedbackDelivery: new Date('2026-03-31'),
    })

    const cycle = ReviewCycle.create({
      id: overrides?.id,
      name: 'Performance Review 2025',
      year: 2025,
      deadlines,
      startDate: new Date('2025-01-01'),
    })

    return cycle
  }

  beforeEach(() => {
    mockReviewCycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new StartReviewCycleUseCase(mockReviewCycleRepository)
  })

  describe('successful start', () => {
    it('should start review cycle successfully when no active cycle exists (DRAFT → ACTIVE)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      // Mock findById to return cycle when called with any ReviewCycleId matching the value
      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      // Create the started cycle for the save mock return
      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<StartReviewCycleOutput>({
        id: cycleId.value,
        status: CycleStatus.ACTIVE.value,
        startedAt: startedCycle.startDate,
      })
      expect(result.status).toBe('ACTIVE')
      expect(result.startedAt).toBeInstanceOf(Date)
    })

    it('should call start() method on the cycle entity', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      const startSpy = jest.spyOn(cycle, 'start')

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(startSpy).toHaveBeenCalledTimes(1)
    })

    it('should persist changes to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.save).toHaveBeenCalledTimes(1)
      expect(mockReviewCycleRepository.save).toHaveBeenCalledWith(cycle)
    })

    it('should return correct DTO with id, status, and startedAt', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('startedAt')
      expect(typeof result.id).toBe('string')
      expect(typeof result.status).toBe('string')
      expect(result.startedAt).toBeInstanceOf(Date)
    })
  })

  describe('validation: cycle existence', () => {
    it('should throw ReviewNotFoundException if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not proceed to check active cycle if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockReviewCycleRepository.findActive).not.toHaveBeenCalled()
    })
  })

  describe('validation: no other active cycle', () => {
    it('should throw Error if another review cycle is already active', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const otherCycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      const activeCycle = createValidReviewCycle({ id: otherCycleId })
      activeCycle.start()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(activeCycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Another review cycle is already active. Please complete it first.',
      )
    })

    it('should not proceed to start cycle if another cycle is active', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const otherCycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      const activeCycle = createValidReviewCycle({ id: otherCycleId })
      activeCycle.start()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(activeCycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockReviewCycleRepository.save).not.toHaveBeenCalled()
    })

    it('should allow starting if the same cycle is already active (idempotent)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      const activeCycle = createValidReviewCycle({ id: cycleId })
      activeCycle.start()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(activeCycle)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act & Assert - Should not throw
      const result = await useCase.execute(input)
      expect(result).toBeDefined()
    })

    it('should proceed to start when no active cycle exists', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockReviewCycleRepository.save).toHaveBeenCalled()
    })
  })

  describe('edge cases: state transitions', () => {
    it('should handle cycle already in ACTIVE status (entity should throw InvalidReviewCycleStateException)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      cycle.start() // Already started

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(cycle) // Same cycle is active

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidReviewCycleStateException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot start cycle from ACTIVE status. Must be DRAFT',
      )
    })

    it('should not save when cycle is already in ACTIVE status', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      cycle.start()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockReviewCycleRepository.save).not.toHaveBeenCalled()
    })

    it('should handle cycle in CALIBRATION status (entity should throw InvalidReviewCycleStateException)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      cycle.start()
      cycle.enterCalibration()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidReviewCycleStateException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot start cycle from CALIBRATION status. Must be DRAFT',
      )
    })

    it('should handle cycle in COMPLETED status (entity should throw InvalidReviewCycleStateException)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      cycle.start()
      cycle.enterCalibration()
      cycle.complete()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidReviewCycleStateException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot start cycle from COMPLETED status. Must be DRAFT',
      )
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full start workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockReviewCycleRepository.findActive).toHaveBeenCalledTimes(1)
      expect(mockReviewCycleRepository.save).toHaveBeenCalledWith(cycle)
      expect(result.status).toBe('ACTIVE')
      expect(result.id).toBe(cycleId.value)
      expect(result.startedAt).toBeDefined()
    })

    it('should handle multiple cycles with proper state management', async () => {
      // Arrange
      const cycle1Id = ReviewCycleId.generate()
      const cycle2Id = ReviewCycleId.generate()
      const cycle1 = createValidReviewCycle({ id: cycle1Id })
      const cycle2 = createValidReviewCycle({ id: cycle2Id })

      const input1: StartReviewCycleInput = {
        cycleId: cycle1Id.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycle1Id.value) {
          return cycle1
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle1 = createValidReviewCycle({ id: cycle1Id })
      startedCycle1.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle1)

      // Act - Start first cycle
      const result1 = await useCase.execute(input1)
      expect(result1.status).toBe('ACTIVE')

      // Arrange - Try to start second cycle while first is active
      const input2: StartReviewCycleInput = {
        cycleId: cycle2Id.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycle2Id.value) {
          return cycle2
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(startedCycle1)

      // Act & Assert - Should fail because cycle1 is active
      await expect(useCase.execute(input2)).rejects.toThrow(
        'Another review cycle is already active. Please complete it first.',
      )
    })
  })

  describe('error precedence', () => {
    it('should validate cycle existence before checking active cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockResolvedValue(null)
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(mockReviewCycleRepository.findActive).not.toHaveBeenCalled()
    })

    it('should check active cycle before starting', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const otherCycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })
      const activeCycle = createValidReviewCycle({ id: otherCycleId })
      activeCycle.start()

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(activeCycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Another review cycle is already active. Please complete it first.',
      )
      expect(mockReviewCycleRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('repository interaction', () => {
    it('should call findById with correct ReviewCycleId value', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.findById).toHaveBeenCalledTimes(1)
      const calledWithId = mockReviewCycleRepository.findById.mock.calls[0][0]
      expect(calledWithId.value).toBe(cycleId.value)
    })

    it('should call findActive exactly once', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.findActive).toHaveBeenCalledTimes(1)
    })

    it('should save the cycle entity with updated state', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.save).toHaveBeenCalledTimes(1)
      const savedCycle = mockReviewCycleRepository.save.mock.calls[0][0]
      expect(savedCycle.id.value).toBe(cycleId.value)
    })
  })

  describe('output DTO validation', () => {
    it('should return output matching StartReviewCycleOutput interface', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<StartReviewCycleOutput>({
        id: expect.any(String),
        status: expect.any(String),
        startedAt: expect.any(Date),
      })
    })

    it('should return id matching the cycle entity id', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(cycleId.value)
    })

    it('should return status as ACTIVE string', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe('ACTIVE')
    })

    it('should return startedAt as the cycle startDate', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: StartReviewCycleInput = {
        cycleId: cycleId.value,
      }

      mockReviewCycleRepository.findById.mockImplementation(async (id: ReviewCycleId) => {
        if (id.value === cycleId.value) {
          return cycle
        }
        return null
      })
      mockReviewCycleRepository.findActive.mockResolvedValue(null)

      const startedCycle = createValidReviewCycle({ id: cycleId })
      startedCycle.start()
      mockReviewCycleRepository.save.mockResolvedValue(startedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.startedAt).toBe(startedCycle.startDate)
    })
  })
})
