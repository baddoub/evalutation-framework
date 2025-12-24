import { ReviewScoreAdjustmentUseCase } from './review-score-adjustment.use-case'
import type {
  IScoreAdjustmentRequestRepository,
  ScoreAdjustmentRequest,
} from '../../../domain/repositories/score-adjustment-request.repository.interface'
import type { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import type { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { FinalScore } from '../../../domain/entities/final-score.entity'
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import type { ReviewScoreAdjustmentInput } from '../../dto/final-score.dto'

describe('ReviewScoreAdjustmentUseCase', () => {
  let useCase: ReviewScoreAdjustmentUseCase
  let mockScoreAdjustmentRequestRepository: jest.Mocked<IScoreAdjustmentRequestRepository>
  let mockFinalScoreRepository: jest.Mocked<IFinalScoreRepository>
  let mockManagerEvaluationRepository: jest.Mocked<IManagerEvaluationRepository>

  const createValidScoreAdjustmentRequest = (
    overrides?: Partial<{
      id: string
      cycleId: ReviewCycleId
      employeeId: UserId
      requesterId: UserId
      approverId: UserId
      status: 'PENDING' | 'APPROVED' | 'REJECTED'
      proposedScores: PillarScores
      reason: string
      rejectionReason: string
    }>,
  ): ScoreAdjustmentRequest => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const employeeId = overrides?.employeeId || UserId.generate()
    const requesterId = overrides?.requesterId || UserId.generate()
    const proposedScores =
      overrides?.proposedScores ||
      PillarScores.create({
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 3,
      })

    return {
      id: overrides?.id || 'request-123',
      cycleId,
      employeeId,
      requesterId,
      approverId: overrides?.approverId,
      reason:
        overrides?.reason || 'Original scores did not reflect significant project contributions',
      status: overrides?.status || 'PENDING',
      proposedScores,
      requestedAt: new Date('2025-03-10'),
      reviewedAt: undefined,
      rejectionReason: overrides?.rejectionReason,
      approve: jest.fn(),
      reject: jest.fn(),
    }
  }

  const createValidFinalScore = (
    overrides?: Partial<{
      userId: UserId
      cycleId: ReviewCycleId
    }>,
  ): FinalScore => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const userId = overrides?.userId || UserId.generate()

    return FinalScore.create({
      cycleId,
      userId,
      pillarScores: PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 2,
      }),
      weightedScore: WeightedScore.fromValue(2.9),
      finalLevel: EngineerLevel.MID,
    })
  }

  const createValidManagerEvaluation = (
    overrides?: Partial<{
      cycleId: ReviewCycleId
      employeeId: UserId
      managerId: UserId
      scores: PillarScores
    }>,
  ): ManagerEvaluation => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const employeeId = overrides?.employeeId || UserId.generate()
    const managerId = overrides?.managerId || UserId.generate()

    const evaluation = ManagerEvaluation.create({
      cycleId,
      employeeId,
      managerId,
      scores:
        overrides?.scores ||
        PillarScores.create({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
      narrative: 'Original performance narrative',
      strengths: 'Good technical skills',
      growthAreas: 'Could improve communication',
      developmentPlan: 'Enroll in public speaking course',
      employeeLevel: EngineerLevel.MID,
    })

    evaluation.submit()
    return evaluation
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

    mockManagerEvaluationRepository = {
      findById: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByManagerAndCycle: jest.fn(),
      findByCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new ReviewScoreAdjustmentUseCase(
      mockScoreAdjustmentRequestRepository,
      mockFinalScoreRepository,
      mockManagerEvaluationRepository,
    )
  })

  describe('CRITICAL: successful approval', () => {
    it('should approve score adjustment request successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
      expect(result.reviewedAt).toBeInstanceOf(Date)
      expect(result.approvedBy).toBe(approverId.value)
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalled()
    })

    it('should update manager evaluation with proposed scores when approved', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const proposedScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 3,
      })
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId, proposedScores })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const applyCalibrationAdjustmentSpy = jest.spyOn(managerEval, 'applyCalibrationAdjustment')

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(input)

      // Assert
      expect(applyCalibrationAdjustmentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          projectImpact: expect.objectContaining({ value: 4 }),
          direction: expect.objectContaining({ value: 4 }),
          engineeringExcellence: expect.objectContaining({ value: 4 }),
          operationalOwnership: expect.objectContaining({ value: 4 }),
          peopleImpact: expect.objectContaining({ value: 3 }),
        }),
        expect.stringContaining('Score adjustment approved'),
      )
    })

    it('should save final score when approved', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
    })

    it('should return DTO with all required fields on approval', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('reviewedAt')
      expect(result).toHaveProperty('approvedBy')
      expect(typeof result.id).toBe('string')
      expect(typeof result.status).toBe('string')
      expect(result.reviewedAt).toBeInstanceOf(Date)
      expect(typeof result.approvedBy).toBe('string')
    })

    it('should handle approval when final score does not exist yet', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should handle approval when manager evaluation does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
      expect(mockManagerEvaluationRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: successful rejection', () => {
    it('should reject score adjustment request successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'The proposed scores do not align with performance evidence',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('REJECTED')
      expect(result.reviewedAt).toBeInstanceOf(Date)
      expect(result.approvedBy).toBe(approverId.value)
    })

    it('should not update manager evaluation when rejected', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'Insufficient justification provided',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).not.toHaveBeenCalled()
      expect(mockManagerEvaluationRepository.save).not.toHaveBeenCalled()
    })

    it('should not update final score when rejected', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'Performance does not support proposed scores',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should set rejection reason when rejecting', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const rejectionReason = 'The evidence does not support the proposed score increase'

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason,
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      await useCase.execute(input)

      // Assert
      expect(request.rejectionReason).toBe(rejectionReason)
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalled()
    })
  })

  describe('CRITICAL: validation - request exists', () => {
    it('should throw ReviewNotFoundException if request does not exist', async () => {
      // Arrange
      const approverId = UserId.generate()

      const input: ReviewScoreAdjustmentInput = {
        requestId: 'non-existent-request',
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Score adjustment request not found')
    })

    it('should not proceed to update if request does not exist', async () => {
      // Arrange
      const approverId = UserId.generate()

      const input: ReviewScoreAdjustmentInput = {
        requestId: 'non-existent-request',
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(null)

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

  describe('CRITICAL: validation - request status', () => {
    it('should throw Error if request has already been reviewed (APPROVED)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({
        cycleId,
        employeeId,
        status: 'APPROVED',
      })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Score adjustment request has already been reviewed',
      )
    })

    it('should throw Error if request has already been reviewed (REJECTED)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({
        cycleId,
        employeeId,
        status: 'REJECTED',
      })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Score adjustment request has already been reviewed',
      )
    })

    it('should allow reviewing request with PENDING status', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({
        cycleId,
        employeeId,
        status: 'PENDING',
      })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'Not aligned with performance',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('REJECTED')
    })

    it('should not save if request has already been reviewed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({
        cycleId,
        employeeId,
        status: 'APPROVED',
      })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'Reconsidering decision',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

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

  describe('CRITICAL: validation - rejection reason required', () => {
    it('should throw Error if rejection reason is missing when rejecting', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Rejection reason is required when rejecting a request',
      )
    })

    it('should throw Error if rejection reason is empty string', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: '',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Rejection reason is required when rejecting a request',
      )
    })

    it('should not require rejection reason when approving', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })
  })

  describe('CRITICAL: update request fields', () => {
    it('should set request status to action value', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'Performance evidence insufficient',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      await useCase.execute(input)

      // Assert
      expect(request.status).toBe('REJECTED')
    })

    it('should set approverId on request', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'Does not meet criteria',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      await useCase.execute(input)

      // Assert
      expect(request.approverId).toBe(approverId)
    })

    it('should set reviewedAt timestamp', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason: 'Criteria not met',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const beforeReview = new Date()
      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      await useCase.execute(input)
      const afterReview = new Date()

      // Assert
      expect(request.reviewedAt).toBeDefined()
      expect(request.reviewedAt!.getTime()).toBeGreaterThanOrEqual(beforeReview.getTime())
      expect(request.reviewedAt!.getTime()).toBeLessThanOrEqual(afterReview.getTime())
    })
  })

  describe('EDGE: score range validation', () => {
    it('should accept proposed scores in valid range (0-4)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const proposedScores = PillarScores.create({
        projectImpact: 0,
        direction: 1,
        engineeringExcellence: 2,
        operationalOwnership: 3,
        peopleImpact: 4,
      })
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId, proposedScores })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should accept all scores at maximum value (4)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const proposedScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId, proposedScores })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should accept all scores at minimum value (0)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const proposedScores = PillarScores.create({
        projectImpact: 0,
        direction: 0,
        engineeringExcellence: 0,
        operationalOwnership: 0,
        peopleImpact: 0,
      })
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId, proposedScores })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })
  })

  describe('EDGE: different approval scenarios', () => {
    it('should handle approval with only manager evaluation existing', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
      // Manager evaluation is only updated if final score exists
      expect(mockManagerEvaluationRepository.save).not.toHaveBeenCalled()
    })

    it('should handle approval with only final score existing', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
    })

    it('should handle approval with neither manager evaluation nor final score existing', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
      expect(mockManagerEvaluationRepository.save).not.toHaveBeenCalled()
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('error precedence', () => {
    it('should validate request existence before status', async () => {
      // Arrange
      const approverId = UserId.generate()

      const input: ReviewScoreAdjustmentInput = {
        requestId: 'non-existent-request',
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Score adjustment request not found')
    })

    it('should validate status before checking rejection reason', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({
        cycleId,
        employeeId,
        status: 'APPROVED',
      })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        // Missing rejection reason
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Score adjustment request has already been reviewed',
      )
    })

    it('should validate rejection reason before updating scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Rejection reason is required when rejecting a request',
      )
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full approval workflow with all entities', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      const managerEval = createValidManagerEvaluation({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'APPROVED',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(managerEval)

      const updatedRequest = {
        ...request,
        status: 'APPROVED' as const,
        approverId,
        reviewedAt: new Date(),
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)
      mockManagerEvaluationRepository.save.mockResolvedValue(managerEval)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockScoreAdjustmentRequestRepository.findById).toHaveBeenCalledWith(request.id)
      expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(employeeId, cycleId)
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
        employeeId,
        cycleId,
      )
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(managerEval)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalledTimes(1)
      expect(result.status).toBe('APPROVED')
      expect(result.approvedBy).toBe(approverId.value)
    })

    it('should complete full rejection workflow', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const approverId = UserId.generate()
      const request = createValidScoreAdjustmentRequest({ cycleId, employeeId })

      const input: ReviewScoreAdjustmentInput = {
        requestId: request.id,
        approverId,
        action: 'REJECTED',
        rejectionReason:
          'Comprehensive review shows proposed scores are not aligned with peer performance',
      }

      mockScoreAdjustmentRequestRepository.findById.mockResolvedValue(request)

      const updatedRequest = {
        ...request,
        status: 'REJECTED' as const,
        approverId,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
      }
      mockScoreAdjustmentRequestRepository.save.mockResolvedValue(updatedRequest)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockScoreAdjustmentRequestRepository.findById).toHaveBeenCalledWith(request.id)
      expect(mockScoreAdjustmentRequestRepository.save).toHaveBeenCalledTimes(1)
      expect(mockFinalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).not.toHaveBeenCalled()
      expect(result.status).toBe('REJECTED')
      expect(result.approvedBy).toBe(approverId.value)
    })
  })
})
