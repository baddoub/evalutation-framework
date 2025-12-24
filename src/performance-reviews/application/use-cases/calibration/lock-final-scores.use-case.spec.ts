import { LockFinalScoresUseCase } from './lock-final-scores.use-case'
import type { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { FinalScore } from '../../../domain/entities/final-score.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import type { LockFinalScoresInput, LockFinalScoresOutput } from '../../dto/final-score.dto'

describe('LockFinalScoresUseCase', () => {
  let useCase: LockFinalScoresUseCase
  let mockFinalScoreRepository: jest.Mocked<IFinalScoreRepository>
  let mockCycleRepository: jest.Mocked<IReviewCycleRepository>

  const createValidReviewCycle = (
    overrides?: Partial<{
      id: ReviewCycleId
      name: string
      year: number
    }>,
  ): ReviewCycle => {
    const deadlines = CycleDeadlines.create({
      selfReview: new Date('2025-12-31'),
      peerFeedback: new Date('2026-01-15'),
      managerEvaluation: new Date('2026-01-31'),
      calibration: new Date('2026-02-28'),
      feedbackDelivery: new Date('2026-03-31'),
    })

    return ReviewCycle.create({
      id: overrides?.id,
      name: overrides?.name || 'Performance Review 2025',
      year: overrides?.year || 2025,
      deadlines,
      startDate: new Date('2025-01-01'),
    })
  }

  const createValidFinalScore = (
    overrides?: Partial<{
      cycleId: ReviewCycleId
      userId: UserId
      scores: PillarScores
      weightedScore: WeightedScore
      locked: boolean
    }>,
  ): FinalScore => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const userId = overrides?.userId || UserId.generate()

    const finalScore = FinalScore.create({
      cycleId,
      userId,
      pillarScores:
        overrides?.scores ||
        PillarScores.create({
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
      weightedScore: overrides?.weightedScore || WeightedScore.fromValue(3.2),
      finalLevel: EngineerLevel.MID,
    })

    if (overrides?.locked) {
      finalScore.lock()
    }

    return finalScore
  }

  beforeEach(() => {
    mockFinalScoreRepository = {
      findById: jest.fn(),
      findByUserAndCycle: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByCycle: jest.fn(),
      findByBonusTier: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    mockCycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new LockFinalScoresUseCase(mockFinalScoreRepository, mockCycleRepository)
  })

  describe('CRITICAL: Lock all final scores for a cycle', () => {
    it('should lock all unlocked final scores for a cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const score1 = createValidFinalScore({ cycleId, locked: false })
      const score2 = createValidFinalScore({ cycleId, locked: false })
      const score3 = createValidFinalScore({ cycleId, locked: false })

      const finalScores = [score1, score2, score3]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3)
      expect(score1.isLocked).toBe(true)
      expect(score2.isLocked).toBe(true)
      expect(score3.isLocked).toBe(true)
      expect(result.totalScoresLocked).toBe(3)
    })

    it('should set lockedAt timestamp on all scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const score1 = createValidFinalScore({ cycleId, locked: false })
      const score2 = createValidFinalScore({ cycleId, locked: false })

      const finalScores = [score1, score2]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      const beforeLock = new Date()

      // Act
      await useCase.execute(input)
      const afterLock = new Date()

      // Assert
      expect(score1.lockedAt).toBeDefined()
      expect(score2.lockedAt).toBeDefined()
      expect(score1.lockedAt!.getTime()).toBeGreaterThanOrEqual(beforeLock.getTime())
      expect(score1.lockedAt!.getTime()).toBeLessThanOrEqual(afterLock.getTime())
      expect(score2.lockedAt!.getTime()).toBeGreaterThanOrEqual(beforeLock.getTime())
      expect(score2.lockedAt!.getTime()).toBeLessThanOrEqual(afterLock.getTime())
    })

    it('should persist all locked scores to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const score1 = createValidFinalScore({ cycleId })
      const score2 = createValidFinalScore({ cycleId })

      const finalScores = [score1, score2]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2)
      expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(1, score1)
      expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(2, score2)
    })

    it('should return count of all scores in cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.totalScoresLocked).toBe(5)
    })
  })

  describe('CRITICAL: Skip already locked scores', () => {
    it('should skip scores that are already locked', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const unlockedScore = createValidFinalScore({ cycleId, locked: false })
      const lockedScore = createValidFinalScore({ cycleId, locked: true })

      const finalScores = [unlockedScore, lockedScore]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(unlockedScore)
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalledWith(lockedScore)
    })

    it('should return count including already locked scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const score1 = createValidFinalScore({ cycleId, locked: false })
      const score2 = createValidFinalScore({ cycleId, locked: true })
      const score3 = createValidFinalScore({ cycleId, locked: true })

      const finalScores = [score1, score2, score3]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.totalScoresLocked).toBe(3)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should not modify lockedAt for already locked scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const lockedScore = createValidFinalScore({ cycleId, locked: true })
      const originalLockedAt = lockedScore.lockedAt

      const finalScores = [lockedScore]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(input)

      // Assert
      expect(lockedScore.lockedAt).toBe(originalLockedAt)
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should handle cycle with all scores already locked', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [
        createValidFinalScore({ cycleId, locked: true }),
        createValidFinalScore({ cycleId, locked: true }),
        createValidFinalScore({ cycleId, locked: true }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.totalScoresLocked).toBe(3)
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: Validate cycle exists', () => {
    it('should throw ReviewNotFoundException if cycle not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not proceed if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockFinalScoreRepository.findByCycle).not.toHaveBeenCalled()
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should validate cycle before fetching final scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue([])

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockFinalScoreRepository.findByCycle).toHaveBeenCalledWith(cycleId)
    })
  })

  describe('CRITICAL: Return success output with metadata', () => {
    it('should return output with cycle ID', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [createValidFinalScore({ cycleId }), createValidFinalScore({ cycleId })]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('cycleId')
      expect(result.cycleId).toBe(cycleId.value)
    })

    it('should return output with total scores locked count', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('totalScoresLocked')
      expect(result.totalScoresLocked).toBe(3)
    })

    it('should return output with lockedAt timestamp', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [createValidFinalScore({ cycleId })]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      const beforeLock = new Date()

      // Act
      const result = await useCase.execute(input)
      const afterLock = new Date()

      // Assert
      expect(result).toHaveProperty('lockedAt')
      expect(result.lockedAt).toBeInstanceOf(Date)
      expect(result.lockedAt.getTime()).toBeGreaterThanOrEqual(beforeLock.getTime())
      expect(result.lockedAt.getTime()).toBeLessThanOrEqual(afterLock.getTime())
    })

    it('should return complete LockFinalScoresOutput', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [createValidFinalScore({ cycleId }), createValidFinalScore({ cycleId })]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<LockFinalScoresOutput>({
        cycleId: cycleId.value,
        totalScoresLocked: 2,
        lockedAt: expect.any(Date),
      })
    })
  })

  describe('IMPORTANT: Handle empty final scores', () => {
    it('should handle cycle with no final scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue([])
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.totalScoresLocked).toBe(0)
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should return zero count when no scores exist for cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue([])

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<LockFinalScoresOutput>({
        cycleId: cycleId.value,
        totalScoresLocked: 0,
        lockedAt: expect.any(Date),
      })
    })

    it('should still return success even with empty final scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue([])

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.cycleId).toBe(cycleId.value)
      expect(result.lockedAt).toBeInstanceOf(Date)
    })
  })

  describe('IMPORTANT: Process scores concurrently', () => {
    it('should process all score locks using Promise.all', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(5)
      expect(result.totalScoresLocked).toBe(5)
    })

    it('should handle large batches of scores efficiently', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = Array.from({ length: 20 }, () => createValidFinalScore({ cycleId }))

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.totalScoresLocked).toBe(20)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(20)
    })
  })

  describe('EDGE: Idempotent operation', () => {
    it('should be idempotent when called multiple times', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [createValidFinalScore({ cycleId }), createValidFinalScore({ cycleId })]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act - First execution
      const result1 = await useCase.execute(input)

      // Reset mocks
      mockFinalScoreRepository.save.mockClear()

      // Act - Second execution (scores already locked)
      const result2 = await useCase.execute(input)

      // Assert
      expect(result1.totalScoresLocked).toBe(2)
      expect(result2.totalScoresLocked).toBe(2)
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should not save already locked scores on second run', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const score1 = createValidFinalScore({ cycleId })
      const score2 = createValidFinalScore({ cycleId })
      const finalScores = [score1, score2]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act - First run locks the scores
      await useCase.execute(input)

      expect(score1.isLocked).toBe(true)
      expect(score2.isLocked).toBe(true)

      // Reset
      mockFinalScoreRepository.save.mockClear()

      // Act - Second run with already locked scores
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('EDGE: Handle repository errors', () => {
    it('should propagate error if cycle repository fails', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockRejectedValue(new Error('Database connection failed'))

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Database connection failed')
      expect(mockFinalScoreRepository.findByCycle).not.toHaveBeenCalled()
    })

    it('should propagate error if final score repository findByCycle fails', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockRejectedValue(
        new Error('Failed to fetch final scores'),
      )

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Failed to fetch final scores')
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should propagate error if save operation fails', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [createValidFinalScore({ cycleId })]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockRejectedValue(new Error('Save operation failed'))

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Save operation failed')
    })

    it('should fail entire operation if any save fails', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save
        .mockResolvedValueOnce(finalScores[0])
        .mockRejectedValueOnce(new Error('Save failed for second score'))

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Save failed for second score')
    })
  })

  describe('EDGE: Handle mixed locked/unlocked scores', () => {
    it('should only lock unlocked scores in mixed batch', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const unlockedScore1 = createValidFinalScore({ cycleId, locked: false })
      const lockedScore1 = createValidFinalScore({ cycleId, locked: true })
      const unlockedScore2 = createValidFinalScore({ cycleId, locked: false })
      const lockedScore2 = createValidFinalScore({ cycleId, locked: true })
      const unlockedScore3 = createValidFinalScore({ cycleId, locked: false })

      const finalScores = [
        unlockedScore1,
        lockedScore1,
        unlockedScore2,
        lockedScore2,
        unlockedScore3,
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(unlockedScore1)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(unlockedScore2)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(unlockedScore3)
      expect(result.totalScoresLocked).toBe(5)
    })

    it('should preserve original lockedAt for already locked scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const lockedScore = createValidFinalScore({ cycleId, locked: true })
      const originalLockedAt = lockedScore.lockedAt
      const unlockedScore = createValidFinalScore({ cycleId, locked: false })

      const finalScores = [lockedScore, unlockedScore]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(input)

      // Assert
      expect(lockedScore.lockedAt).toBe(originalLockedAt)
      expect(unlockedScore.lockedAt).not.toBe(originalLockedAt)
    })
  })

  describe('EDGE: Validate score data integrity', () => {
    it('should not modify pillar scores when locking', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const originalScores = PillarScores.create({
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 2,
        peopleImpact: 3,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        scores: originalScores,
      })

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue([finalScore])
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(input)

      // Assert
      expect(finalScore.pillarScores).toBe(originalScores)
      expect(finalScore.pillarScores.projectImpact.value).toBe(4)
      expect(finalScore.pillarScores.direction.value).toBe(3)
      expect(finalScore.pillarScores.engineeringExcellence.value).toBe(4)
      expect(finalScore.pillarScores.operationalOwnership.value).toBe(2)
      expect(finalScore.pillarScores.peopleImpact.value).toBe(3)
    })

    it('should not modify weighted score when locking', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const originalWeightedScore = WeightedScore.fromValue(3.5)
      const finalScore = createValidFinalScore({
        cycleId,
        weightedScore: originalWeightedScore,
      })

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue([finalScore])
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(input)

      // Assert
      expect(finalScore.weightedScore).toBe(originalWeightedScore)
      expect(finalScore.weightedScore.value).toBe(3.5)
    })

    it('should preserve all score metadata when locking', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const userId = UserId.generate()
      const finalScore = createValidFinalScore({
        cycleId,
        userId,
      })

      const originalCalculatedAt = finalScore.calculatedAt
      const originalBonusTier = finalScore.bonusTier

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue([finalScore])
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(input)

      // Assert
      expect(finalScore.userId).toBe(userId)
      expect(finalScore.cycleId).toBe(cycleId)
      expect(finalScore.calculatedAt).toBe(originalCalculatedAt)
      expect(finalScore.bonusTier).toBe(originalBonusTier)
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full lock workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      const finalScores = [
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
        createValidFinalScore({ cycleId }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockFinalScoreRepository.findByCycle).toHaveBeenCalledWith(cycleId)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3)
      expect(result.cycleId).toBe(cycleId.value)
      expect(result.totalScoresLocked).toBe(3)
      expect(result.lockedAt).toBeInstanceOf(Date)
      expect(finalScores.every((score) => score.isLocked)).toBe(true)
    })

    it('should handle real-world scenario with mixed states', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId, year: 2025 })

      const finalScores = [
        createValidFinalScore({ cycleId, locked: false }),
        createValidFinalScore({ cycleId, locked: true }),
        createValidFinalScore({ cycleId, locked: false }),
        createValidFinalScore({ cycleId, locked: false }),
        createValidFinalScore({ cycleId, locked: true }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.totalScoresLocked).toBe(5)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3)
      expect(finalScores.filter((s) => s.isLocked).length).toBe(5)
    })

    it('should support calibration workflow', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycle = createValidReviewCycle({ id: cycleId })

      // Simulate post-calibration final scores
      const finalScores = [
        createValidFinalScore({
          cycleId,
          scores: PillarScores.create({
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
          }),
          weightedScore: WeightedScore.fromValue(3.2),
        }),
        createValidFinalScore({
          cycleId,
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          weightedScore: WeightedScore.fromValue(3.0),
        }),
      ]

      const input: LockFinalScoresInput = {
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByCycle.mockResolvedValue(finalScores)
      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.totalScoresLocked).toBe(2)
      expect(finalScores.every((s) => s.isLocked)).toBe(true)
      expect(finalScores.every((s) => s.lockedAt !== undefined)).toBe(true)
    })
  })
})
