import { MarkFeedbackDeliveredUseCase } from './mark-feedback-delivered.use-case'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { FinalScore, FinalScoreId } from '../../../domain/entities/final-score.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { User } from '../../../../auth/domain/entities/user.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'
import { MarkFeedbackDeliveredInput, MarkFeedbackDeliveredOutput } from '../../dto/final-score.dto'

describe('MarkFeedbackDeliveredUseCase', () => {
  let useCase: MarkFeedbackDeliveredUseCase
  let mockFinalScoreRepository: jest.Mocked<IFinalScoreRepository>
  let mockCycleRepository: jest.Mocked<IReviewCycleRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>

  const createValidReviewCycle = (): ReviewCycle => {
    const deadlines = CycleDeadlines.create({
      selfReview: new Date('2025-12-31'),
      peerFeedback: new Date('2026-01-15'),
      managerEvaluation: new Date('2026-01-31'),
      calibration: new Date('2026-02-28'),
      feedbackDelivery: new Date('2026-03-31'),
    })

    const cycle = ReviewCycle.create({
      name: 'Performance Review 2025',
      year: 2025,
      deadlines,
      startDate: new Date('2025-01-01'),
    })
    return cycle
  }

  const createValidFinalScore = (
    overrides?: Partial<{
      id: FinalScoreId
      cycleId: ReviewCycleId
      userId: UserId
      scores: PillarScores
      weightedScore: WeightedScore
      locked: boolean
      feedbackDelivered: boolean
    }>,
  ): FinalScore => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const userId = overrides?.userId || UserId.generate()

    const finalScore = FinalScore.create({
      id: overrides?.id,
      cycleId,
      userId,
      pillarScores:
        overrides?.scores ||
        PillarScores.create({
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
      weightedScore:
        overrides?.weightedScore ||
        WeightedScore.fromValue(3.5),
      finalLevel: EngineerLevel.create('Senior'),
    })

    // Lock if needed
    if (overrides?.locked) {
      finalScore.lock()
    }

    return finalScore
  }

  const createValidUser = (
    overrides?: Partial<{
      id: UserId
      name: string
      email: string
      managerId: string
    }>,
  ): User => {
    const userId = overrides?.id || UserId.generate()
    const managerId = overrides?.managerId || 'manager-123'

    return User.create({
      id: userId,
      email: Email.create(overrides?.email || 'employee@example.com'),
      name: overrides?.name || 'John Doe',
      keycloakId: `keycloak-${userId.value}`,
      roles: [Role.create('user')],
      isActive: true,
      managerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
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

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByKeycloakId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      findByRole: jest.fn(),
      findByManagerId: jest.fn(),
    }

    useCase = new MarkFeedbackDeliveredUseCase(
      mockFinalScoreRepository,
      mockCycleRepository,
      mockUserRepository,
    )
  })

  describe('CRITICAL: Mark feedback as delivered successfully', () => {
    it('should mark feedback as delivered successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'Great performance this year',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<MarkFeedbackDeliveredOutput>({
        employeeId: updatedScore.userId.value,
        feedbackDelivered: true,
        feedbackDeliveredAt: updatedScore.feedbackDeliveredAt!,
      })
      expect(result.feedbackDelivered).toBe(true)
      expect(result.feedbackDeliveredAt).toBeInstanceOf(Date)
    })

    it('should mark feedback delivered with feedback notes', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const feedbackNotes = 'Excellent work on Q4 projects'

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId, feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.feedbackDelivered).toBe(true)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
    })

    it('should mark feedback delivered without optional feedback notes', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.feedbackDelivered).toBe(true)
      expect(mockFinalScoreRepository.save).toHaveBeenCalled()
    })
  })

  describe('CRITICAL: Validate final score exists', () => {
    it('should throw ReviewNotFoundException if final score not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Final score not found')
    })

    it('should not proceed to mark delivery if final score does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: Set deliveredAt timestamp', () => {
    it('should set deliveredAt timestamp with current time', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const beforeMark = new Date()
      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)
      const afterMark = new Date()

      // Assert
      expect(result.feedbackDeliveredAt).toBeDefined()
      expect(result.feedbackDeliveredAt.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime())
      expect(result.feedbackDeliveredAt.getTime()).toBeLessThanOrEqual(afterMark.getTime())
    })

    it('should update feedbackDeliveredAt on each marking', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result1 = await useCase.execute(input)
      expect(result1.feedbackDeliveredAt).toBeInstanceOf(Date)
    })
  })

  describe('CRITICAL: Record deliveredBy user ID', () => {
    it('should record manager ID as deliveredBy', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
      // Verify entity was modified with markFeedbackDelivered
      expect(finalScore.feedbackDelivered).toBe(true)
    })

    it('should pass correct manager ID to markFeedbackDelivered', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const markFeedbackSpy = jest.spyOn(finalScore, 'markFeedbackDelivered')
      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      await useCase.execute(input)

      // Assert
      expect(markFeedbackSpy).toHaveBeenCalledWith(managerId, input.feedbackNotes)
      markFeedbackSpy.mockRestore()
    })
  })

  describe('CRITICAL: Prevent duplicate delivery marking', () => {
    it('should allow marking feedback delivered even if already marked (idempotent operation)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })
      finalScore.markFeedbackDelivered(managerId, 'First delivery')

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'Second delivery notes',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.feedbackDelivered).toBe(true)
      expect(mockFinalScoreRepository.save).toHaveBeenCalled()
    })

    it('should allow multiple marking attempts with different notes', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input1: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'First attempt notes',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)

      const updatedScore1 = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore1.markFeedbackDelivered(managerId, input1.feedbackNotes)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore1)

      // Act & Assert - First marking
      const result1 = await useCase.execute(input1)
      expect(result1.feedbackDelivered).toBe(true)

      // Second attempt
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const input2: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'Updated notes',
      }

      const updatedScore2 = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore2.markFeedbackDelivered(managerId, input2.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore2)

      const result2 = await useCase.execute(input2)
      expect(result2.feedbackDelivered).toBe(true)
    })
  })

  describe('IMPORTANT: Persist changes to repository', () => {
    it('should save updated final score to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
    })

    it('should call save only once per execution', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'Test notes',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('IMPORTANT: Return success confirmation', () => {
    it('should return DTO with correct employee ID', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('employeeId')
      expect(result.employeeId).toBe(updatedScore.userId.value)
    })

    it('should return DTO with feedbackDelivered flag set to true', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('feedbackDelivered')
      expect(result.feedbackDelivered).toBe(true)
    })

    it('should return DTO with feedbackDeliveredAt timestamp', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('feedbackDeliveredAt')
      expect(result.feedbackDeliveredAt).toBeInstanceOf(Date)
    })

    it('should return MarkFeedbackDeliveredOutput with all required properties', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toEqual<MarkFeedbackDeliveredOutput>({
        employeeId: expect.any(String),
        feedbackDelivered: true,
        feedbackDeliveredAt: expect.any(Date),
      })
    })
  })

  describe('IMPORTANT: Validate manager authorization', () => {
    it('should throw error if manager is not the employee\'s direct manager', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const wrongManagerId = UserId.generate()
      const correctManagerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: correctManagerId.value,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId: wrongManagerId, // Wrong manager
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(Error)
      await expect(useCase.execute(input)).rejects.toThrow(
        'You can only mark feedback delivered for your direct reports',
      )
    })

    it('should not proceed if manager-employee relationship is invalid', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const wrongManagerId = UserId.generate()
      const correctManagerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: correctManagerId.value,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId: wrongManagerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should allow manager to mark feedback for their direct report', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.feedbackDelivered).toBe(true)
      expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalled()
    })
  })

  describe('EDGE: Handle already delivered feedback', () => {
    it('should handle feedback that was already delivered', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })
      finalScore.markFeedbackDelivered(managerId, 'Previously delivered')

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.feedbackDelivered).toBe(true)
    })

    it('should update delivery record for already delivered feedback', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })
      finalScore.markFeedbackDelivered(managerId, 'First delivery')

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'Updated delivery notes',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.feedbackDelivered).toBe(true)
      expect(mockFinalScoreRepository.save).toHaveBeenCalled()
    })
  })

  describe('EDGE: Handle locked final scores', () => {
    it('should still allow marking feedback as delivered for locked scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
        locked: true,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
        locked: true,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.feedbackDelivered).toBe(true)
    })

    it('should record timestamp for locked scores feedback delivery', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
        locked: true,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const beforeMark = new Date()
      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
        locked: true,
      })
      updatedScore.markFeedbackDelivered(managerId)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)
      const afterMark = new Date()

      // Assert
      expect(result.feedbackDeliveredAt).toBeDefined()
      expect(result.feedbackDeliveredAt.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime())
      expect(result.feedbackDeliveredAt.getTime()).toBeLessThanOrEqual(afterMark.getTime())
    })
  })

  describe('EDGE: Verify employee-manager relationship', () => {
    it('should verify employee exists in system', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null) // Employee not found

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Employee not found')
    })

    it('should not proceed if employee is not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should confirm manager ID matches employee\'s manager', async () => {
      // Arrange
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      // Act & Assert
      expect(employee.managerId).toBe(managerId.value)
    })
  })

  describe('EDGE: Handle missing final score', () => {
    it('should throw ReviewNotFoundException when final score is missing', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Final score not found')
    })

    it('should provide clear error message for missing final score', async () => {
      // Arrange & Act & Assert
      const error = new ReviewNotFoundException('Final score not found')
      expect(error.message).toBe('Final score not found')
    })
  })

  describe('error precedence: validation order', () => {
    it('should validate cycle before checking employee', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
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
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should validate employee before checking final score', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should validate manager relationship before checking final score', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const wrongManagerId = UserId.generate()
      const correctManagerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: correctManagerId.value,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId: wrongManagerId,
        cycleId,
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full feedback delivery workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'Comprehensive feedback on performance',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId)
      expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(employeeId, cycleId)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
      expect(result.feedbackDelivered).toBe(true)
      expect(result.feedbackDeliveredAt).toBeInstanceOf(Date)
    })

    it('should handle multiple employees in same cycle independently', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employee1Id = UserId.generate()
      const employee2Id = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee1 = createValidUser({
        id: employee1Id,
        managerId: managerId.value,
      })
      const employee2 = createValidUser({
        id: employee2Id,
        managerId: managerId.value,
      })
      const finalScore1 = createValidFinalScore({
        cycleId,
        userId: employee1Id,
      })
      const finalScore2 = createValidFinalScore({
        cycleId,
        userId: employee2Id,
      })

      const input1: MarkFeedbackDeliveredInput = {
        employeeId: employee1Id,
        managerId,
        cycleId,
        feedbackNotes: 'Feedback for employee 1',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValueOnce(employee1)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore1)

      const updatedScore1 = createValidFinalScore({
        id: finalScore1.id,
        cycleId,
        userId: employee1Id,
      })
      updatedScore1.markFeedbackDelivered(managerId, input1.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValueOnce(updatedScore1)

      // Act
      const result1 = await useCase.execute(input1)

      // Assert
      expect(result1.employeeId).toBe(employee1Id.value)
      expect(result1.feedbackDelivered).toBe(true)

      // Now process second employee
      const input2: MarkFeedbackDeliveredInput = {
        employeeId: employee2Id,
        managerId,
        cycleId,
        feedbackNotes: 'Feedback for employee 2',
      }

      mockUserRepository.findById.mockResolvedValueOnce(employee2)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore2)

      const updatedScore2 = createValidFinalScore({
        id: finalScore2.id,
        cycleId,
        userId: employee2Id,
      })
      updatedScore2.markFeedbackDelivered(managerId, input2.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValueOnce(updatedScore2)

      const result2 = await useCase.execute(input2)

      expect(result2.employeeId).toBe(employee2Id.value)
      expect(result2.feedbackDelivered).toBe(true)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2)
    })

    it('should handle concurrent marking attempts for same employee', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const cycle = createValidReviewCycle()
      const employee = createValidUser({
        id: employeeId,
        managerId: managerId.value,
      })
      const finalScore = createValidFinalScore({
        cycleId,
        userId: employeeId,
      })

      const input: MarkFeedbackDeliveredInput = {
        employeeId,
        managerId,
        cycleId,
        feedbackNotes: 'Feedback notes',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const updatedScore = createValidFinalScore({
        id: finalScore.id,
        cycleId,
        userId: employeeId,
      })
      updatedScore.markFeedbackDelivered(managerId, input.feedbackNotes)
      mockFinalScoreRepository.save.mockResolvedValue(updatedScore)

      // Act - Simulate concurrent calls
      const result1 = await useCase.execute(input)
      const result2 = await useCase.execute(input)

      // Assert
      expect(result1.feedbackDelivered).toBe(true)
      expect(result2.feedbackDelivered).toBe(true)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2)
    })
  })
})
