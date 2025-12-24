import { ApplyCalibrationAdjustmentUseCase } from './apply-calibration-adjustment.use-case'
import type { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import type {
  ICalibrationSessionRepository,
  CalibrationSession,
} from '../../../domain/repositories/calibration-session.repository.interface'
import type { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import type { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import type { ScoreCalculationService } from '../../../domain/services/score-calculation.service'
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity'
import { FinalScore } from '../../../domain/entities/final-score.entity'
import { User } from '../../../../auth/domain/entities/user.entity'
import type { ManagerEvaluationId } from '../../../domain/value-objects/manager-evaluation-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'
import type { ApplyCalibrationAdjustmentInput } from '../../dto/final-score.dto'

describe('ApplyCalibrationAdjustmentUseCase', () => {
  let useCase: ApplyCalibrationAdjustmentUseCase
  let mockManagerEvaluationRepository: jest.Mocked<IManagerEvaluationRepository>
  let mockCalibrationSessionRepository: jest.Mocked<ICalibrationSessionRepository>
  let mockFinalScoreRepository: jest.Mocked<IFinalScoreRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockScoreCalculationService: jest.Mocked<ScoreCalculationService>

  const createValidManagerEvaluation = (
    overrides?: Partial<{
      id: ManagerEvaluationId
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
      id: overrides?.id,
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

  const createValidCalibrationSession = (
    overrides?: Partial<{
      id: string
      cycleId: ReviewCycleId
      facilitatorId: UserId
    }>,
  ): CalibrationSession => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const facilitatorId = overrides?.facilitatorId || UserId.generate()

    return {
      id: overrides?.id || 'session-123',
      cycleId,
      name: 'Engineering Calibration Q1 2025',
      facilitatorId,
      participantIds: [UserId.generate().value, UserId.generate().value],
      scheduledAt: new Date('2025-03-15'),
      department: 'Engineering',
      status: 'SCHEDULED',
    }
  }

  const createValidEmployee = (overrides?: { id?: UserId; level?: string }): User => {
    const id = overrides?.id || UserId.generate()

    return User.create({
      id,
      email: Email.create('employee@example.com'),
      name: 'Employee Name',
      keycloakId: 'keycloak-employee-id',
      roles: [Role.user()],
      isActive: true,
      level: overrides?.level || 'MID',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
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

  beforeEach(() => {
    mockManagerEvaluationRepository = {
      findById: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByManagerAndCycle: jest.fn(),
      findByCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    mockCalibrationSessionRepository = {
      findById: jest.fn(),
      findByCycle: jest.fn(),
      findByDepartment: jest.fn(),
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

    mockScoreCalculationService = {
      calculateWeightedScore: jest.fn(),
    } as unknown as jest.Mocked<ScoreCalculationService>

    useCase = new ApplyCalibrationAdjustmentUseCase(
      mockManagerEvaluationRepository,
      mockCalibrationSessionRepository,
      mockFinalScoreRepository,
      mockUserRepository,
      mockScoreCalculationService,
    )
  })

  describe('CRITICAL: successful calibration adjustment', () => {
    it('should apply calibration adjustment successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId, level: 'MID' })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification:
          'After calibration discussion, we agreed to increase project impact and people impact scores due to exceptional cross-team collaboration.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const oldWeightedScore = { value: 2.9, bonusTier: { value: 'MEETS' } }
      const newWeightedScore = { value: 3.5, bonusTier: { value: 'EXCEEDS' } }

      mockScoreCalculationService.calculateWeightedScore
        .mockReturnValueOnce(oldWeightedScore as any)
        .mockReturnValueOnce(newWeightedScore as any)

      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.evaluationId).toBe(input.evaluationId)
      expect(result.adjustedScores).toEqual(input.adjustedScores)
      expect(result.originalScores.projectImpact).toBe(3)
      expect(result.oldWeightedScore).toBe(2.9)
      expect(result.newWeightedScore).toBe(3.5)
      expect(result.oldBonusTier).toBe('MEETS')
      expect(result.newBonusTier).toBe('EXCEEDS')
      expect(result.adjustedAt).toBeInstanceOf(Date)
    })

    it('should return DTO with all required fields', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        justification:
          'Calibration committee agreed on score adjustments based on comparative analysis.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.8, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('adjustmentId')
      expect(result).toHaveProperty('evaluationId')
      expect(result).toHaveProperty('originalScores')
      expect(result).toHaveProperty('adjustedScores')
      expect(result).toHaveProperty('oldWeightedScore')
      expect(result).toHaveProperty('newWeightedScore')
      expect(result).toHaveProperty('oldBonusTier')
      expect(result).toHaveProperty('newBonusTier')
      expect(result).toHaveProperty('adjustedAt')
      expect(typeof result.id).toBe('string')
      expect(typeof result.adjustmentId).toBe('string')
      expect(typeof result.evaluationId).toBe('string')
    })

    it('should save evaluation with adjusted scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Adjusted based on calibration session feedback and peer comparison.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.4, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(evaluation)
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('CRITICAL: validation - evaluation exists', () => {
    it('should throw ReviewNotFoundException if evaluation does not exist', async () => {
      // Arrange
      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: 'session-123',
        evaluationId: 'non-existent-evaluation',
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Adjusted based on calibration discussion.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation not found')
    })

    it('should not proceed to validate session if evaluation does not exist', async () => {
      // Arrange
      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: 'session-123',
        evaluationId: 'non-existent-evaluation',
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Adjusted based on calibration discussion.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockCalibrationSessionRepository.findById).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: validation - session exists', () => {
    it('should throw ReviewNotFoundException if session does not exist', async () => {
      // Arrange
      const evaluation = createValidManagerEvaluation()

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: 'non-existent-session',
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Adjusted based on calibration discussion.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow('Calibration session not found')
    })

    it('should not proceed to validate justification if session does not exist', async () => {
      // Arrange
      const evaluation = createValidManagerEvaluation()

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: 'non-existent-session',
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Adjusted based on calibration discussion.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(null)

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

  describe('CRITICAL: validation - justification required', () => {
    it('should throw Error if justification is empty', async () => {
      // Arrange
      const evaluation = createValidManagerEvaluation()
      const session = createValidCalibrationSession()

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: '',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Justification must be at least 20 characters',
      )
    })

    it('should throw Error if justification is too short', async () => {
      // Arrange
      const evaluation = createValidManagerEvaluation()
      const session = createValidCalibrationSession()

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Too short',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Justification must be at least 20 characters',
      )
    })

    it('should throw Error if justification is only whitespace', async () => {
      // Arrange
      const evaluation = createValidManagerEvaluation()
      const session = createValidCalibrationSession()

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: '                    ',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Justification must be at least 20 characters',
      )
    })

    it('should accept justification with exactly 20 characters', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: '12345678901234567890', // Exactly 20 characters
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.4, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe('CRITICAL: score calculation', () => {
    it('should calculate old weighted score using original scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const originalScores = PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 3,
        operationalOwnership: 2,
        peopleImpact: 2,
      })
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        scores: originalScores,
      })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId, level: 'MID' })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration adjustment after team discussion.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const oldWeightedScore = { value: 2.5, bonusTier: { value: 'BELOW' } }
      const newWeightedScore = { value: 3.5, bonusTier: { value: 'EXCEEDS' } }

      mockScoreCalculationService.calculateWeightedScore
        .mockReturnValueOnce(oldWeightedScore as any)
        .mockReturnValueOnce(newWeightedScore as any)

      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenCalledTimes(2)
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          projectImpact: expect.objectContaining({ value: 3 }),
          direction: expect.objectContaining({ value: 2 }),
          engineeringExcellence: expect.objectContaining({ value: 3 }),
          operationalOwnership: expect.objectContaining({ value: 2 }),
          peopleImpact: expect.objectContaining({ value: 2 }),
        }),
        EngineerLevel.MID,
      )
    })

    it('should calculate new weighted score using adjusted scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId, level: 'MID' })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        justification: 'Calibration adjustment after team discussion.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.9, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenCalledWith(
        expect.objectContaining({
          projectImpact: expect.objectContaining({ value: 4 }),
          direction: expect.objectContaining({ value: 4 }),
          engineeringExcellence: expect.objectContaining({ value: 4 }),
          operationalOwnership: expect.objectContaining({ value: 4 }),
          peopleImpact: expect.objectContaining({ value: 3 }),
        }),
        EngineerLevel.MID,
      )
    })

    it('should use employee level for weighted score calculation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId, level: 'SENIOR' })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Calibration adjustment for senior engineer.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.6, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenCalledWith(
        expect.anything(),
        EngineerLevel.SENIOR,
      )
    })

    it('should default to MID level if employee level is not available', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employeeWithoutLevel = User.create({
        id: employeeId,
        email: Email.create('employee@example.com'),
        name: 'Employee Name',
        keycloakId: 'keycloak-employee-id',
        roles: [Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Calibration adjustment with default level.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employeeWithoutLevel)

      const weightedScore = { value: 3.4, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenCalledWith(
        expect.anything(),
        EngineerLevel.MID,
      )
    })
  })

  describe('CRITICAL: apply adjustment to evaluation', () => {
    it('should call applyCalibrationAdjustment on evaluation entity', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const applyCalibrationAdjustmentSpy = jest.spyOn(evaluation, 'applyCalibrationAdjustment')

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration adjustment based on committee decision.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.5, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      await useCase.execute(input)

      // Assert
      expect(applyCalibrationAdjustmentSpy).toHaveBeenCalledWith(
        expect.anything(),
        input.justification,
      )
    })

    it('should pass adjusted scores to entity method', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const applyCalibrationAdjustmentSpy = jest.spyOn(evaluation, 'applyCalibrationAdjustment')

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        justification: 'Committee consensus on score adjustment.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.9, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

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
        input.justification,
      )
    })
  })

  describe('CRITICAL: update final score if exists', () => {
    it('should update final score when it exists', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration adjustment requiring final score update.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const weightedScore = { value: 3.5, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(employeeId, cycleId)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
    })

    it('should not fail when final score does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration adjustment without existing final score.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

      const weightedScore = { value: 3.5, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('EDGE: score range validation', () => {
    it('should accept valid scores (0-4 range)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 0,
          direction: 1,
          engineeringExcellence: 2,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        justification: 'Testing full score range from 0 to 4.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 2.0, bonusTier: { value: 'BELOW' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.adjustedScores.projectImpact).toBe(0)
      expect(result.adjustedScores.peopleImpact).toBe(4)
    })

    it('should accept all scores at maximum value (4)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        justification: 'Exceptional performance across all pillars.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 4.0, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.adjustedScores.projectImpact).toBe(4)
      expect(result.adjustedScores.direction).toBe(4)
    })

    it('should accept all scores at minimum value (0)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 0,
          direction: 0,
          engineeringExcellence: 0,
          operationalOwnership: 0,
          peopleImpact: 0,
        },
        justification: 'Performance improvement plan required.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 0.0, bonusTier: { value: 'BELOW' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.adjustedScores.projectImpact).toBe(0)
    })
  })

  describe('EDGE: bonus tier changes', () => {
    it('should track bonus tier change from BELOW to MEETS', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const originalScores = PillarScores.create({
        projectImpact: 2,
        direction: 2,
        engineeringExcellence: 2,
        operationalOwnership: 2,
        peopleImpact: 1,
      })
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        scores: originalScores,
      })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration adjustment to reflect actual performance.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const oldWeightedScore = { value: 1.9, bonusTier: { value: 'BELOW' } }
      const newWeightedScore = { value: 3.0, bonusTier: { value: 'MEETS' } }

      mockScoreCalculationService.calculateWeightedScore
        .mockReturnValueOnce(oldWeightedScore as any)
        .mockReturnValueOnce(newWeightedScore as any)

      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.oldBonusTier).toBe('BELOW')
      expect(result.newBonusTier).toBe('MEETS')
    })

    it('should track bonus tier change from MEETS to EXCEEDS', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const originalScores = PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 3,
        operationalOwnership: 3,
        peopleImpact: 2,
      })
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        scores: originalScores,
      })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration reflecting exceptional contributions.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const oldWeightedScore = { value: 2.9, bonusTier: { value: 'MEETS' } }
      const newWeightedScore = { value: 3.7, bonusTier: { value: 'EXCEEDS' } }

      mockScoreCalculationService.calculateWeightedScore
        .mockReturnValueOnce(oldWeightedScore as any)
        .mockReturnValueOnce(newWeightedScore as any)

      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.oldBonusTier).toBe('MEETS')
      expect(result.newBonusTier).toBe('EXCEEDS')
    })

    it('should track bonus tier staying the same', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Minor score adjustment without tier change.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.0, bonusTier: { value: 'MEETS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.oldBonusTier).toBe('MEETS')
      expect(result.newBonusTier).toBe('MEETS')
    })
  })

  describe('EDGE: different engineer levels', () => {
    it('should handle calibration for JUNIOR level', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId, level: 'JUNIOR' })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration for junior engineer performance.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 2.9, bonusTier: { value: 'MEETS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenCalledWith(
        expect.anything(),
        EngineerLevel.JUNIOR,
      )
    })

    it('should handle calibration for LEAD level', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId, level: 'LEAD' })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Calibration for lead engineer demonstrating strong technical leadership.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)

      const weightedScore = { value: 3.8, bonusTier: { value: 'EXCEEDS' } }
      mockScoreCalculationService.calculateWeightedScore.mockReturnValue(weightedScore as any)
      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenCalledWith(
        expect.anything(),
        EngineerLevel.LEAD,
      )
    })
  })

  describe('error precedence', () => {
    it('should validate evaluation before session', async () => {
      // Arrange
      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: 'session-123',
        evaluationId: 'non-existent-evaluation',
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: 'Adjusted based on calibration discussion.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(null)
      mockCalibrationSessionRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation not found')
      expect(mockCalibrationSessionRepository.findById).not.toHaveBeenCalled()
    })

    it('should validate session before justification', async () => {
      // Arrange
      const evaluation = createValidManagerEvaluation()

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: 'non-existent-session',
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        justification: '', // Invalid justification
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Calibration session not found')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full calibration adjustment workflow', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })
      const session = createValidCalibrationSession({ cycleId })
      const employee = createValidEmployee({ id: employeeId })
      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })

      const input: ApplyCalibrationAdjustmentInput = {
        sessionId: session.id,
        evaluationId: evaluation.id.value,
        adjustedScores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        justification: 'Full calibration workflow test with comprehensive justification.',
      }

      mockManagerEvaluationRepository.findById.mockResolvedValue(evaluation)
      mockCalibrationSessionRepository.findById.mockResolvedValue(session)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockFinalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

      const oldWeightedScore = { value: 2.9, bonusTier: { value: 'MEETS' } }
      const newWeightedScore = { value: 3.5, bonusTier: { value: 'EXCEEDS' } }

      mockScoreCalculationService.calculateWeightedScore
        .mockReturnValueOnce(oldWeightedScore as any)
        .mockReturnValueOnce(newWeightedScore as any)

      mockManagerEvaluationRepository.save.mockResolvedValue(evaluation)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockManagerEvaluationRepository.findById).toHaveBeenCalled()
      expect(mockCalibrationSessionRepository.findById).toHaveBeenCalled()
      expect(mockUserRepository.findById).toHaveBeenCalled()
      expect(mockScoreCalculationService.calculateWeightedScore).toHaveBeenCalledTimes(2)
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalled()
      expect(mockFinalScoreRepository.findByUserAndCycle).toHaveBeenCalled()
      expect(mockFinalScoreRepository.save).toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result.adjustmentId).toBeDefined()
      expect(result.oldWeightedScore).toBe(2.9)
      expect(result.newWeightedScore).toBe(3.5)
    })
  })
})
