import { RequestScoreAdjustmentUseCase } from './request-score-adjustment.use-case'
import type {
  IScoreAdjustmentRequestRepository,
  ScoreAdjustmentRequest,
} from '../../../domain/repositories/score-adjustment-request.repository.interface'
import type { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import type { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import type { RequestScoreAdjustmentInput } from '../../dto/final-score.dto'
import { FinalScore } from '../../../domain/entities/final-score.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { User } from '../../../../auth/domain/entities/user.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'

describe('RequestScoreAdjustmentUseCase', () => {
  let useCase: RequestScoreAdjustmentUseCase
  let mockScoreAdjustmentRequestRepository: jest.Mocked<IScoreAdjustmentRequestRepository>
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

    return ReviewCycle.create({
      name: 'Performance Review 2025',
      year: 2025,
      deadlines,
      startDate: new Date('2025-01-01'),
    })
  }

  const createValidEmployee = (overrides?: { id?: UserId; managerId?: string }): User => {
    const id = overrides?.id || UserId.generate()
    const managerId = overrides?.managerId || UserId.generate().value

    return User.create({
      id,
      email: Email.create('employee@example.com'),
      name: 'Employee Name',
      keycloakId: 'keycloak-employee-id',
      roles: [Role.user()],
      isActive: true,
      managerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const createValidFinalScore = (
    overrides?: Partial<{
      userId: UserId
      cycleId: ReviewCycleId
      locked: boolean
    }>,
  ): FinalScore => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const userId = overrides?.userId || UserId.generate()

    const score = FinalScore.create({
      cycleId,
      userId,
      pillarScores: PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 3,
        operationalOwnership: 2,
        peopleImpact: 2,
      }),
      weightedScore: WeightedScore.fromValue(2.5),
      finalLevel: EngineerLevel.MID,
    })

    if (overrides?.locked) {
      score.lock()
    }

    return score
  }

  beforeEach(() => {
    mockScoreAdjustmentRequestRepository = {
      findById: jest.fn(),
      findPending: jest.fn(),
      findByEmployee: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

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
      findByKeycloakId: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      findByRole: jest.fn(),
      findByManagerId: jest.fn(),
    }

    useCase = new RequestScoreAdjustmentUseCase(
      mockScoreAdjustmentRequestRepository,
      mockFinalScoreRepository,
      mockCycleRepository,
      mockUserRepository,
    )
  })

  describe('CRITICAL: successful score adjustment request', () => {
    it('should create score adjustment request successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Employee consistently exceeded expectations in Q4 projects',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe('request-123')
      expect(result.employeeId).toBe(employeeId.value)
      expect(result.status).toBe('PENDING')
      expect(result.reason).toBe(input.reason)
      expect(result.requestedAt).toBeInstanceOf(Date)
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalled()
    })

    it('should persist request with PENDING status', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe('PENDING')
      const saveCall = mockScoreAdjustmentRequestRepository.save.mock.calls[0][0]
      expect(saveCall.status).toBe('PENDING')
    })

    it('should include proposed scores in request', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const proposedScores = {
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 3,
      }

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores,
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      await useCase.execute(input)

      // Assert
      const saveCall = mockScoreAdjustmentRequestRepository.save.mock.calls[0][0]
      expect(saveCall.proposedScores).toBeDefined()
      expect(saveCall.proposedScores.toObject()).toEqual(proposedScores)
    })

    it('should set requestedAt timestamp', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const beforeRequest = new Date()
      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)
      const afterRequest = new Date()

      // Assert
      expect(result.requestedAt).toBeDefined()
      expect(result.requestedAt.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime())
      expect(result.requestedAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime())
    })
  })

  describe('CRITICAL: validation - cycle exists', () => {
    it('should throw ReviewNotFoundException if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not proceed to validate final score if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(null)

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

  describe('CRITICAL: validation - final score exists', () => {
    it('should throw ReviewNotFoundException if final score does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Final score not found')
    })

    it('should not proceed to validate employee if final score does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: validation - final scores must be locked', () => {
    it('should throw Error if final scores are not locked', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: false })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot request score adjustment until final scores are locked',
      )
    })

    it('should not proceed to validate employee if final scores are not locked', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: false })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should allow request when final scores are locked', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockUserRepository.findById).toHaveBeenCalled()
    })
  })

  describe('CRITICAL: validation - employee exists', () => {
    it('should throw ReviewNotFoundException if employee does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Employee not found')
    })

    it('should not proceed to verify manager relationship if employee does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockScoreAdjustmentRequestRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: validation - manager-employee relationship', () => {
    it("should throw Error if manager is not employee's direct manager", async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const differentManagerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      // Employee's manager is differentManagerId, not managerId
      const employee = createValidEmployee({ id: employeeId, managerId: differentManagerId.value })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'You can only request adjustments for your direct reports',
      )
    })

    it('should verify manager-employee relationship with correct manager ID', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalled()
    })

    it('should allow request when manager-employee relationship is valid', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('PENDING')
    })
  })

  describe('CRITICAL: validation - required fields', () => {
    it('should require reason for score adjustment', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Detailed justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.reason).toBe('Detailed justification for score adjustment')
      const saveCall = mockScoreAdjustmentRequestRepository.save.mock.calls[0][0]
      expect(saveCall.reason).toBe(input.reason)
    })

    it('should include all proposed scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const proposedScores = {
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 3,
      }

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores,
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      await useCase.execute(input)

      // Assert
      const saveCall = mockScoreAdjustmentRequestRepository.save.mock.calls[0][0]
      expect(saveCall.proposedScores.toObject()).toEqual(proposedScores)
    })
  })

  describe('EDGE: score validation', () => {
    it('should allow valid pillar scores between 0-4', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 2,
          operationalOwnership: 1,
          peopleImpact: 0,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      const saveCall = mockScoreAdjustmentRequestRepository.save.mock.calls[0][0]
      const scores = saveCall.proposedScores.toObject()
      expect(scores.projectImpact).toBe(4)
      expect(scores.direction).toBe(3)
      expect(scores.engineeringExcellence).toBe(2)
      expect(scores.operationalOwnership).toBe(1)
      expect(scores.peopleImpact).toBe(0)
    })

    it('should handle maximum pillar scores (all 4s)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        reason: 'Exceptional performance across all pillars',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      const saveCall = mockScoreAdjustmentRequestRepository.save.mock.calls[0][0]
      const scores = saveCall.proposedScores.toObject()
      Object.values(scores).forEach((score) => {
        expect(score).toBe(4)
      })
    })

    it('should handle minimum pillar scores (all 0s)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        },
        reason: 'Severe performance issues requiring intervention',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      const saveCall = mockScoreAdjustmentRequestRepository.save.mock.calls[0][0]
      const scores = saveCall.proposedScores.toObject()
      Object.values(scores).forEach((score) => {
        expect(score).toBe(0)
      })
    })
  })

  describe('EDGE: return DTO structure', () => {
    it('should return correct DTO with all required fields', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('employeeId')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('reason')
      expect(result).toHaveProperty('requestedAt')
      expect(typeof result.id).toBe('string')
      expect(typeof result.employeeId).toBe('string')
      expect(typeof result.status).toBe('string')
      expect(typeof result.reason).toBe('string')
      expect(result.requestedAt).toBeInstanceOf(Date)
    })

    it('should return employeeId as string value', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.employeeId).toBe(employeeId.value)
    })
  })

  describe('error precedence', () => {
    it('should validate cycle before validating final score', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(null)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })

    it('should validate final score exists before checking if locked', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Final score not found')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should validate final score is locked before checking employee', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: false })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Cannot request score adjustment until final scores are locked',
      )
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should validate employee exists before checking manager relationship', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Justification for score adjustment',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Employee not found')
      expect(mockScoreAdjustmentRequestRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full request workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        reason: 'Employee consistently exceeded expectations throughout the review period',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-123',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(employeeId, cycleId)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId)
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalledTimes(1)
      expect(result.status).toBe('PENDING')
      expect(result.requestedAt).toBeDefined()
    })

    it('should handle complete validation chain correctly', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId, locked: true })

      const input: RequestScoreAdjustmentInput = {
        employeeId,
        managerId,
        cycleId,
        proposedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        reason: 'Outstanding performance with significant business impact',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockUserRepository.findById.mockResolvedValue(employee)

      const savedRequest: ScoreAdjustmentRequest = {
        id: 'request-456',
        cycleId,
        employeeId,
        requesterId: managerId,
        reason: input.reason,
        status: 'PENDING',
        proposedScores: PillarScores.create(input.proposedScores),
        requestedAt: new Date(),
        approve: jest.fn(),
        reject: jest.fn(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(savedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(employeeId, cycleId)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId)
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalledTimes(1)
      expect(result.id).toBe('request-456')
      expect(result.status).toBe('PENDING')
    })
  })
})
