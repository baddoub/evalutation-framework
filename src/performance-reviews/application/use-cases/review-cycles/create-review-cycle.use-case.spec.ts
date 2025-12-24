import { CreateReviewCycleUseCase } from './create-review-cycle.use-case'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { CycleStatus } from '../../../domain/entities/review-cycle.entity'
import { InvalidCycleDeadlinesException } from '../../../domain/exceptions/invalid-cycle-deadlines.exception'
import type { CreateReviewCycleInput, CreateReviewCycleOutput } from '../../dto/review-cycle.dto'

describe('CreateReviewCycleUseCase', () => {
  let useCase: CreateReviewCycleUseCase
  let mockReviewCycleRepository: jest.Mocked<IReviewCycleRepository>

  const createValidDeadlines = (): CycleDeadlines => {
    return CycleDeadlines.create({
      selfReview: new Date('2025-12-31'),
      peerFeedback: new Date('2026-01-15'),
      managerEvaluation: new Date('2026-01-31'),
      calibration: new Date('2026-02-28'),
      feedbackDelivery: new Date('2026-03-31'),
    })
  }

  beforeEach(() => {
    mockReviewCycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new CreateReviewCycleUseCase(mockReviewCycleRepository)
  })

  describe('CRITICAL: happy path - successfully creates review cycle', () => {
    it('should create review cycle with all required fields', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(savedCycle.id.value)
      expect(result.name).toBe(input.name)
      expect(result.year).toBe(input.year)
      expect(result.status).toBe(CycleStatus.DRAFT.value)
    })

    it('should create review cycle with default startDate when not provided', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      const beforeCreate = new Date()

      // Act
      const result = await useCase.execute(input)
      const afterCreate = new Date()

      // Assert
      expect(result.startDate).toBeDefined()
      expect(result.startDate.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(result.startDate.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })

    it('should persist to repository', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.save).toHaveBeenCalledTimes(1)
      expect(mockReviewCycleRepository.save).toHaveBeenCalledWith(expect.any(ReviewCycle))
    })
  })

  describe('CRITICAL: deadlines validation', () => {
    it('should validate chronological order of deadlines', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert - should succeed without throwing
      expect(result).toBeDefined()
    })

    it('should throw InvalidCycleDeadlinesException when peerFeedback is before selfReview', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2026-01-15'),
          peerFeedback: new Date('2025-12-31'), // Before selfReview
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidCycleDeadlinesException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Peer Feedback deadline must be after Self Review deadline',
      )
    })

    it('should throw InvalidCycleDeadlinesException when managerEvaluation is before peerFeedback', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-31'),
          managerEvaluation: new Date('2026-01-15'), // Before peerFeedback
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidCycleDeadlinesException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Manager Evaluation deadline must be after Peer Feedback deadline',
      )
    })

    it('should throw InvalidCycleDeadlinesException when calibration is before managerEvaluation', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-02-28'),
          calibration: new Date('2026-01-31'), // Before managerEvaluation
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidCycleDeadlinesException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Calibration deadline must be after Manager Evaluation deadline',
      )
    })

    it('should throw InvalidCycleDeadlinesException when feedbackDelivery is before calibration', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-03-31'),
          feedbackDelivery: new Date('2026-02-28'), // Before calibration
        },
        startDate: new Date('2025-01-01'),
      }

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidCycleDeadlinesException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Feedback Delivery deadline must be after Calibration deadline',
      )
    })

    it('should throw InvalidCycleDeadlinesException when deadlines are equal', async () => {
      // Arrange
      const sameDate = new Date('2026-01-31')
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: sameDate,
          managerEvaluation: sameDate, // Same as peerFeedback
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InvalidCycleDeadlinesException)
      await expect(useCase.execute(input)).rejects.toThrow(
        'Manager Evaluation deadline must be after Peer Feedback deadline',
      )
    })

    it('should not save when deadline validation fails', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2026-01-15'),
          peerFeedback: new Date('2025-12-31'), // Invalid order
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockReviewCycleRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: all required fields present in output DTO', () => {
    it('should return all required fields in DTO', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert - Check all required fields
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('deadlines')
      expect(result).toHaveProperty('startDate')
      expect(result).toHaveProperty('createdAt')
    })

    it('should return correct types for all fields', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert - Check types
      expect(typeof result.id).toBe('string')
      expect(typeof result.name).toBe('string')
      expect(typeof result.year).toBe('number')
      expect(typeof result.status).toBe('string')
      expect(result.deadlines).toBeInstanceOf(Object)
      expect(result.startDate).toBeInstanceOf(Date)
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should return complete deadlines object with all phases', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert - Check all deadline phases
      expect(result.deadlines).toHaveProperty('selfReview')
      expect(result.deadlines).toHaveProperty('peerFeedback')
      expect(result.deadlines).toHaveProperty('managerEvaluation')
      expect(result.deadlines).toHaveProperty('calibration')
      expect(result.deadlines).toHaveProperty('feedbackDelivery')
      expect(result.deadlines.selfReview).toBeInstanceOf(Date)
      expect(result.deadlines.peerFeedback).toBeInstanceOf(Date)
      expect(result.deadlines.managerEvaluation).toBeInstanceOf(Date)
      expect(result.deadlines.calibration).toBeInstanceOf(Date)
      expect(result.deadlines.feedbackDelivery).toBeInstanceOf(Date)
    })

    it('should conform to CreateReviewCycleOutput interface', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert - Type-safe check
      const output: CreateReviewCycleOutput = result
      expect(output).toBeDefined()
    })
  })

  describe('IMPORTANT: entity creation with all properties', () => {
    it('should create ReviewCycle entity with correct name', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.name).toBe('Performance Review 2025')
    })

    it('should create ReviewCycle entity with correct year', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.year).toBe(2025)
    })

    it('should create ReviewCycle entity with DRAFT status by default', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe('DRAFT')
    })

    it('should create ReviewCycle entity with CycleDeadlines value object', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert - Deadlines should match input
      expect(result.deadlines.selfReview).toEqual(input.deadlines.selfReview)
      expect(result.deadlines.peerFeedback).toEqual(input.deadlines.peerFeedback)
      expect(result.deadlines.managerEvaluation).toEqual(input.deadlines.managerEvaluation)
      expect(result.deadlines.calibration).toEqual(input.deadlines.calibration)
      expect(result.deadlines.feedbackDelivery).toEqual(input.deadlines.feedbackDelivery)
    })

    it('should generate unique ReviewCycleId for entity', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
      expect(result.id.length).toBeGreaterThan(0)
    })
  })

  describe('IMPORTANT: repository save operation', () => {
    it('should call repository save with created entity', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.save).toHaveBeenCalledTimes(1)
      const savedEntity = mockReviewCycleRepository.save.mock.calls[0][0]
      expect(savedEntity).toBeInstanceOf(ReviewCycle)
      expect(savedEntity.name).toBe(input.name)
      expect(savedEntity.year).toBe(input.year)
    })

    it('should return saved entity data in DTO', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(savedCycle.id.value)
      expect(result.name).toBe(savedCycle.name)
      expect(result.year).toBe(savedCycle.year)
      expect(result.status).toBe(savedCycle.status.value)
    })
  })

  describe('IMPORTANT: DTO structure validation', () => {
    it('should map entity ID to string in DTO', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(savedCycle.id.value)
      expect(typeof result.id).toBe('string')
    })

    it('should map status value object to string in DTO', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe(savedCycle.status.value)
      expect(typeof result.status).toBe('string')
    })

    it('should map deadlines value object to plain object in DTO', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.deadlines).toEqual(savedCycle.deadlines.toObject())
    })

    it('should set createdAt timestamp', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      const beforeCreate = new Date()

      // Act
      const result = await useCase.execute(input)
      const afterCreate = new Date()

      // Assert
      expect(result.createdAt).toBeDefined()
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })
  })

  describe('EDGE: different deadline configurations', () => {
    it('should handle deadlines spanning across year boundaries', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-02-01'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-15'),
        },
        startDate: new Date('2025-11-01'),
      }

      const deadlines = CycleDeadlines.create(input.deadlines)
      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines,
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.deadlines.selfReview.getFullYear()).toBe(2025)
      expect(result.deadlines.feedbackDelivery.getFullYear()).toBe(2026)
    })

    it('should handle deadlines with minimal time gaps', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31T23:59:59'),
          peerFeedback: new Date('2026-01-01T00:00:00'),
          managerEvaluation: new Date('2026-01-01T00:00:01'),
          calibration: new Date('2026-01-01T00:00:02'),
          feedbackDelivery: new Date('2026-01-01T00:00:03'),
        },
        startDate: new Date('2025-01-01'),
      }

      const deadlines = CycleDeadlines.create(input.deadlines)
      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines,
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.deadlines.selfReview).toEqual(input.deadlines.selfReview)
      expect(result.deadlines.feedbackDelivery).toEqual(input.deadlines.feedbackDelivery)
    })

    it('should handle deadlines spanning multiple months', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-09-30'),
          peerFeedback: new Date('2025-10-31'),
          managerEvaluation: new Date('2025-11-30'),
          calibration: new Date('2025-12-31'),
          feedbackDelivery: new Date('2026-01-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const deadlines = CycleDeadlines.create(input.deadlines)
      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines,
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.deadlines.selfReview.getMonth()).toBe(8) // September (0-indexed)
      expect(result.deadlines.feedbackDelivery.getMonth()).toBe(0) // January (0-indexed)
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full creation workflow successfully', async () => {
      // Arrange
      const input: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle = ReviewCycle.create({
        name: input.name,
        year: input.year,
        deadlines: createValidDeadlines(),
        startDate: input.startDate,
      })

      mockReviewCycleRepository.save.mockResolvedValue(savedCycle)

      // Act
      const result = await useCase.execute(input)

      // Assert - Full workflow validation
      expect(mockReviewCycleRepository.save).toHaveBeenCalledTimes(1)
      expect(result.id).toBe(savedCycle.id.value)
      expect(result.name).toBe(input.name)
      expect(result.year).toBe(input.year)
      expect(result.status).toBe('DRAFT')
      expect(result.deadlines.selfReview).toEqual(input.deadlines.selfReview)
      expect(result.deadlines.peerFeedback).toEqual(input.deadlines.peerFeedback)
      expect(result.deadlines.managerEvaluation).toEqual(input.deadlines.managerEvaluation)
      expect(result.deadlines.calibration).toEqual(input.deadlines.calibration)
      expect(result.deadlines.feedbackDelivery).toEqual(input.deadlines.feedbackDelivery)
      expect(result.startDate).toEqual(input.startDate)
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should handle multiple review cycles for different years', async () => {
      // Arrange
      const input2024: CreateReviewCycleInput = {
        name: 'Performance Review 2024',
        year: 2024,
        deadlines: {
          selfReview: new Date('2024-12-31'),
          peerFeedback: new Date('2025-01-15'),
          managerEvaluation: new Date('2025-01-31'),
          calibration: new Date('2025-02-28'),
          feedbackDelivery: new Date('2025-03-31'),
        },
        startDate: new Date('2024-01-01'),
      }

      const input2025: CreateReviewCycleInput = {
        name: 'Performance Review 2025',
        year: 2025,
        deadlines: {
          selfReview: new Date('2025-12-31'),
          peerFeedback: new Date('2026-01-15'),
          managerEvaluation: new Date('2026-01-31'),
          calibration: new Date('2026-02-28'),
          feedbackDelivery: new Date('2026-03-31'),
        },
        startDate: new Date('2025-01-01'),
      }

      const savedCycle2024 = ReviewCycle.create({
        name: input2024.name,
        year: input2024.year,
        deadlines: CycleDeadlines.create(input2024.deadlines),
        startDate: input2024.startDate,
      })

      const savedCycle2025 = ReviewCycle.create({
        name: input2025.name,
        year: input2025.year,
        deadlines: CycleDeadlines.create(input2025.deadlines),
        startDate: input2025.startDate,
      })

      mockReviewCycleRepository.save
        .mockResolvedValueOnce(savedCycle2024)
        .mockResolvedValueOnce(savedCycle2025)

      // Act
      const result2024 = await useCase.execute(input2024)
      const result2025 = await useCase.execute(input2025)

      // Assert
      expect(result2024.year).toBe(2024)
      expect(result2025.year).toBe(2025)
      expect(result2024.id).not.toBe(result2025.id)
      expect(mockReviewCycleRepository.save).toHaveBeenCalledTimes(2)
    })
  })
})
