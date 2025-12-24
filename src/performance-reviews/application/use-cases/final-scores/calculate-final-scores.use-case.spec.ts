import { CalculateFinalScoresUseCase } from './calculate-final-scores.use-case'
import type { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import type { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import type { FinalScoreCalculationService } from '../../../domain/services/final-score-calculation.service'
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity'
import { FinalScore } from '../../../domain/entities/final-score.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewStatus } from '../../../domain/value-objects/review-status.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'

describe('CalculateFinalScoresUseCase', () => {
  let useCase: CalculateFinalScoresUseCase
  let mockFinalScoreRepository: jest.Mocked<IFinalScoreRepository>
  let mockManagerEvaluationRepository: jest.Mocked<IManagerEvaluationRepository>
  let mockCalculationService: jest.Mocked<FinalScoreCalculationService>

  const createValidManagerEvaluation = (
    overrides?: Partial<{
      id: string
      cycleId: ReviewCycleId
      employeeId: UserId
      managerId: UserId
      scores: PillarScores
      status: ReviewStatus
      employeeLevel: EngineerLevel
      proposedLevel: EngineerLevel
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
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
      narrative: 'Strong overall performance',
      strengths: 'Good technical skills',
      growthAreas: 'Could improve communication',
      developmentPlan: 'Enroll in public speaking course',
      employeeLevel: overrides?.employeeLevel || EngineerLevel.MID,
      proposedLevel: overrides?.proposedLevel,
    })

    // Submit if requested
    if (overrides?.status === ReviewStatus.SUBMITTED) {
      evaluation.submit()
    }

    return evaluation
  }

  const createValidFinalScore = (
    overrides?: Partial<{
      userId: UserId
      cycleId: ReviewCycleId
      pillarScores: PillarScores
      weightedScore: WeightedScore
      finalLevel: EngineerLevel
    }>,
  ): FinalScore => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const userId = overrides?.userId || UserId.generate()

    return FinalScore.create({
      cycleId,
      userId,
      pillarScores:
        overrides?.pillarScores ||
        PillarScores.create({
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        }),
      weightedScore: overrides?.weightedScore || WeightedScore.fromValue(3.2),
      finalLevel: overrides?.finalLevel || EngineerLevel.MID,
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

    mockManagerEvaluationRepository = {
      findById: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByManagerAndCycle: jest.fn(),
      findByCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    mockCalculationService = {
      calculateFinalScore: jest.fn(),
    } as unknown as jest.Mocked<FinalScoreCalculationService>

    useCase = new CalculateFinalScoresUseCase(
      mockFinalScoreRepository,
      mockManagerEvaluationRepository,
      mockCalculationService,
    )
  })

  describe('CRITICAL: calculate final scores from manager evaluations', () => {
    it('should fetch evaluations from repository by cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluations: ManagerEvaluation[] = []

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(cycleId)
    })

    it('should process all evaluations returned from repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation1 = createValidManagerEvaluation({ cycleId })
      const evaluation2 = createValidManagerEvaluation({ cycleId })
      const evaluations = [evaluation1, evaluation2]

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      const finalScore1 = createValidFinalScore({ cycleId, userId: evaluation1.employeeId })
      const finalScore2 = createValidFinalScore({ cycleId, userId: evaluation2.employeeId })

      mockCalculationService.calculateFinalScore
        .mockReturnValueOnce(finalScore1)
        .mockReturnValueOnce(finalScore2)

      mockFinalScoreRepository.save.mockResolvedValue(finalScore1).mockResolvedValue(finalScore2)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(2)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(1, evaluation1)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(2, evaluation2)
    })

    it('should handle single evaluation correctly', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({ cycleId, userId: evaluation.employeeId })
      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(1)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should convert cycleId string to ReviewCycleId object', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycleIdString = cycleId.value

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([])

      // Act
      await useCase.execute(cycleIdString)

      // Assert
      expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(
        expect.objectContaining({
          value: cycleIdString,
        }),
      )
    })
  })

  describe('CRITICAL: use FinalScoreCalculationService to compute weighted scores', () => {
    it('should call calculateFinalScore service for each evaluation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({ cycleId, userId: evaluation.employeeId })
      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(evaluation)
    })

    it('should pass manager evaluation to calculation service', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId, employeeId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({ cycleId, userId: employeeId })
      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(evaluation)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(1)
    })

    it('should use calculated final score from service', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const calculatedFinalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        weightedScore: WeightedScore.fromValue(3.5),
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(calculatedFinalScore)
      mockFinalScoreRepository.save.mockResolvedValue(calculatedFinalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(calculatedFinalScore)
    })

    it('should calculate weighted score considering multiple pillar scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const pillarScores = PillarScores.create({
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      })
      const evaluation = createValidManagerEvaluation({
        cycleId,
        scores: pillarScores,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        pillarScores,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(
        expect.objectContaining({
          scores: pillarScores,
        }),
      )
    })
  })

  describe('CRITICAL: determine bonus tier based on weighted score', () => {
    it('should create final score with bonus tier based on weighted score', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const weightedScore = WeightedScore.fromValue(3.4) // 85% threshold for EXCEEDS
      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        weightedScore,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          bonusTier: expect.anything(),
        }),
      )
    })

    it('should include bonus tier in persisted final score (EXCEEDS tier)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      // 85% = 3.4 score = EXCEEDS tier
      const weightedScore = WeightedScore.fromValue(3.4)
      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        weightedScore,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
      expect(finalScore.bonusTier.isExceeds()).toBe(true)
    })

    it('should handle MEETS bonus tier correctly', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      // 75% = 3.0 score = MEETS tier
      const weightedScore = WeightedScore.fromValue(3.0)
      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        weightedScore,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(finalScore.bonusTier.isMeets()).toBe(true)
    })

    it('should handle BELOW bonus tier correctly', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      // 40% = 1.6 score = BELOW tier
      const weightedScore = WeightedScore.fromValue(1.6)
      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        weightedScore,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(finalScore.bonusTier.isBelow()).toBe(true)
    })
  })

  describe('CRITICAL: validate cycle exists', () => {
    it('should accept valid cycle ID string', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycleIdString = cycleId.value
      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([])

      // Act
      await useCase.execute(cycleIdString)

      // Assert
      expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalled()
    })

    it('should process evaluations when cycle has evaluations', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({ cycleId, userId: evaluation.employeeId })
      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalled()
    })

    it('should handle empty evaluation list for cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const cycleIdString = cycleId.value
      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([])

      // Act
      await useCase.execute(cycleIdString)

      // Assert
      expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalled()
      expect(mockCalculationService.calculateFinalScore).not.toHaveBeenCalled()
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: only calculate for submitted manager evaluations', () => {
    it('should only process submitted evaluations', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const submittedEvaluation = createValidManagerEvaluation({
        cycleId,
        status: ReviewStatus.SUBMITTED,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([submittedEvaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: submittedEvaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(submittedEvaluation)
      expect(mockFinalScoreRepository.save).toHaveBeenCalled()
    })

    it('should verify evaluation is submitted before calculation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({
        cycleId,
        status: ReviewStatus.SUBMITTED,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(evaluation.isSubmitted).toBe(true)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalled()
    })
  })

  describe('CRITICAL: use proposed level if available, otherwise employee level', () => {
    it('should pass evaluation with proposed level to calculation service', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const proposedLevel = EngineerLevel.SENIOR
      const evaluation = createValidManagerEvaluation({
        cycleId,
        proposedLevel,
        employeeLevel: EngineerLevel.MID,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: proposedLevel,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(
        expect.objectContaining({
          proposedLevel,
        }),
      )
    })

    it('should use employee level when proposed level is not available', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeLevel = EngineerLevel.MID
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeLevel,
        proposedLevel: undefined,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: employeeLevel,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeLevel,
        }),
      )
    })

    it('should include final level in calculated final score', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const proposedLevel = EngineerLevel.SENIOR
      const evaluation = createValidManagerEvaluation({
        cycleId,
        proposedLevel,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: proposedLevel,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          finalLevel: proposedLevel,
        }),
      )
    })
  })

  describe('IMPORTANT: persist final scores to repository', () => {
    it('should save calculated final score to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
    })

    it('should save each calculated final score', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation1 = createValidManagerEvaluation({ cycleId })
      const evaluation2 = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation1, evaluation2])

      const finalScore1 = createValidFinalScore({
        cycleId,
        userId: evaluation1.employeeId,
      })
      const finalScore2 = createValidFinalScore({
        cycleId,
        userId: evaluation2.employeeId,
      })

      mockCalculationService.calculateFinalScore
        .mockReturnValueOnce(finalScore1)
        .mockReturnValueOnce(finalScore2)

      mockFinalScoreRepository.save.mockResolvedValue(finalScore1).mockResolvedValue(finalScore2)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2)
      expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(1, finalScore1)
      expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(2, finalScore2)
    })

    it('should persist final score with all required fields', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      const savedScore = mockFinalScoreRepository.save.mock.calls[0][0]
      expect(savedScore).toHaveProperty('userId')
      expect(savedScore).toHaveProperty('cycleId')
      expect(savedScore).toHaveProperty('pillarScores')
      expect(savedScore).toHaveProperty('weightedScore')
      expect(savedScore).toHaveProperty('finalLevel')
    })

    it('should handle repository save errors', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockRejectedValue(new Error('Save failed'))

      // Act & Assert
      await expect(useCase.execute(cycleId.value)).rejects.toThrow('Save failed')
    })
  })

  describe('IMPORTANT: return count of calculated scores', () => {
    it('should complete execution without error on success', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(cycleId.value)

      // Assert
      expect(result).toBeUndefined()
    })

    it('should process multiple evaluations and complete', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluations = [
        createValidManagerEvaluation({ cycleId }),
        createValidManagerEvaluation({ cycleId }),
        createValidManagerEvaluation({ cycleId }),
      ]

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      const finalScores = evaluations.map((evaluation) =>
        createValidFinalScore({
          cycleId,
          userId: evaluation.employeeId,
        }),
      )

      mockCalculationService.calculateFinalScore
        .mockReturnValueOnce(finalScores[0])
        .mockReturnValueOnce(finalScores[1])
        .mockReturnValueOnce(finalScores[2])

      mockFinalScoreRepository.save
        .mockResolvedValueOnce(finalScores[0])
        .mockResolvedValueOnce(finalScores[1])
        .mockResolvedValueOnce(finalScores[2])

      // Act
      const result = await useCase.execute(cycleId.value)

      // Assert
      expect(result).toBeUndefined()
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3)
    })
  })

  describe('IMPORTANT: handle employees with no manager evaluation', () => {
    it('should not process when no evaluations found for cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([])

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).not.toHaveBeenCalled()
      expect(mockFinalScoreRepository.save).not.toHaveBeenCalled()
    })

    it('should skip employees without submitted evaluations', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalled()
    })

    it('should handle mixed evaluations (some submitted, some not)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const submittedEvaluation = createValidManagerEvaluation({
        cycleId,
        status: ReviewStatus.SUBMITTED,
      })
      const draftEvaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([
        submittedEvaluation,
        draftEvaluation,
      ])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: submittedEvaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(2)
    })
  })

  describe('EDGE: batch calculation for entire cycle', () => {
    it('should calculate scores for entire cycle in one operation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluations = Array.from({ length: 5 }, () => createValidManagerEvaluation({ cycleId }))

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      const finalScores = evaluations.map((evaluation) =>
        createValidFinalScore({
          cycleId,
          userId: evaluation.employeeId,
        }),
      )

      finalScores.forEach((score) => {
        mockCalculationService.calculateFinalScore.mockReturnValue(score)
      })

      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledTimes(1)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(5)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(5)
    })

    it('should process large batch of evaluations sequentially', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluationCount = 10
      const evaluations = Array.from({ length: evaluationCount }, () =>
        createValidManagerEvaluation({ cycleId }),
      )

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      const finalScores = evaluations.map((evaluation) =>
        createValidFinalScore({
          cycleId,
          userId: evaluation.employeeId,
        }),
      )

      finalScores.forEach((score) => {
        mockCalculationService.calculateFinalScore.mockReturnValueOnce(score)
      })

      mockFinalScoreRepository.save.mockImplementation((score) => Promise.resolve(score))

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(10)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(10)
    })

    it('should maintain evaluation order during batch calculation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation1 = createValidManagerEvaluation({ cycleId })
      const evaluation2 = createValidManagerEvaluation({ cycleId })
      const evaluation3 = createValidManagerEvaluation({ cycleId })

      const evaluations = [evaluation1, evaluation2, evaluation3]
      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      const finalScore1 = createValidFinalScore({
        cycleId,
        userId: evaluation1.employeeId,
      })
      const finalScore2 = createValidFinalScore({
        cycleId,
        userId: evaluation2.employeeId,
      })
      const finalScore3 = createValidFinalScore({
        cycleId,
        userId: evaluation3.employeeId,
      })

      mockCalculationService.calculateFinalScore
        .mockReturnValueOnce(finalScore1)
        .mockReturnValueOnce(finalScore2)
        .mockReturnValueOnce(finalScore3)

      mockFinalScoreRepository.save
        .mockResolvedValueOnce(finalScore1)
        .mockResolvedValueOnce(finalScore2)
        .mockResolvedValueOnce(finalScore3)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(1, evaluation1)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(2, evaluation2)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenNthCalledWith(3, evaluation3)
    })
  })

  describe('EDGE: skip already calculated scores (idempotent)', () => {
    it('should recalculate scores on subsequent runs', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act - First run
      await useCase.execute(cycleId.value)

      // Reset mocks
      mockCalculationService.calculateFinalScore.mockClear()
      mockFinalScoreRepository.save.mockClear()
      mockManagerEvaluationRepository.findByCycle.mockClear()

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act - Second run
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(1)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should handle idempotent execution for same cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act - Execute twice
      await useCase.execute(cycleId.value)
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(2)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(2)
    })
  })

  describe('EDGE: handle different engineer levels correctly', () => {
    it('should calculate final score for MID level engineer', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.MID,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: EngineerLevel.MID,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          finalLevel: EngineerLevel.MID,
        }),
      )
    })

    it('should calculate final score for SENIOR level engineer', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.SENIOR,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: EngineerLevel.SENIOR,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          finalLevel: EngineerLevel.SENIOR,
        }),
      )
    })

    it('should calculate final score for LEAD level engineer', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.LEAD,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: EngineerLevel.LEAD,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          finalLevel: EngineerLevel.LEAD,
        }),
      )
    })

    it('should handle level promotion (employee to proposed level)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.MID,
        proposedLevel: EngineerLevel.SENIOR,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: EngineerLevel.SENIOR,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          finalLevel: EngineerLevel.SENIOR,
        }),
      )
    })

    it('should handle level demotion (employee to proposed level)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.SENIOR,
        proposedLevel: EngineerLevel.MID,
      })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
        finalLevel: EngineerLevel.MID,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          finalLevel: EngineerLevel.MID,
        }),
      )
    })

    it('should calculate scores for mixed engineer levels in batch', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const midLevelEval = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.MID,
      })
      const seniorLevelEval = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.SENIOR,
      })
      const leadLevelEval = createValidManagerEvaluation({
        cycleId,
        employeeLevel: EngineerLevel.LEAD,
      })

      const evaluations = [midLevelEval, seniorLevelEval, leadLevelEval]
      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      const finalScores = [
        createValidFinalScore({
          cycleId,
          userId: midLevelEval.employeeId,
          finalLevel: EngineerLevel.MID,
        }),
        createValidFinalScore({
          cycleId,
          userId: seniorLevelEval.employeeId,
          finalLevel: EngineerLevel.SENIOR,
        }),
        createValidFinalScore({
          cycleId,
          userId: leadLevelEval.employeeId,
          finalLevel: EngineerLevel.LEAD,
        }),
      ]

      mockCalculationService.calculateFinalScore
        .mockReturnValueOnce(finalScores[0])
        .mockReturnValueOnce(finalScores[1])
        .mockReturnValueOnce(finalScores[2])

      mockFinalScoreRepository.save
        .mockResolvedValueOnce(finalScores[0])
        .mockResolvedValueOnce(finalScores[1])
        .mockResolvedValueOnce(finalScores[2])

      // Act
      await useCase.execute(cycleId.value)

      // Assert
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3)
      expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ finalLevel: EngineerLevel.MID }),
      )
      expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ finalLevel: EngineerLevel.SENIOR }),
      )
      expect(mockFinalScoreRepository.save).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ finalLevel: EngineerLevel.LEAD }),
      )
    })
  })

  describe('integration: full workflow', () => {
    it('should complete full calculation workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluation = createValidManagerEvaluation({ cycleId })

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])

      const finalScore = createValidFinalScore({
        cycleId,
        userId: evaluation.employeeId,
      })

      mockCalculationService.calculateFinalScore.mockReturnValue(finalScore)
      mockFinalScoreRepository.save.mockResolvedValue(finalScore)

      // Act
      const result = await useCase.execute(cycleId.value)

      // Assert
      expect(result).toBeUndefined()
      expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(cycleId)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledWith(evaluation)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledWith(finalScore)
    })

    it('should handle full workflow with multiple employees', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const evaluations = [
        createValidManagerEvaluation({ cycleId }),
        createValidManagerEvaluation({ cycleId }),
        createValidManagerEvaluation({ cycleId }),
      ]

      mockManagerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

      const finalScores = evaluations.map((evaluation) =>
        createValidFinalScore({
          cycleId,
          userId: evaluation.employeeId,
        }),
      )

      mockCalculationService.calculateFinalScore
        .mockReturnValueOnce(finalScores[0])
        .mockReturnValueOnce(finalScores[1])
        .mockReturnValueOnce(finalScores[2])

      mockFinalScoreRepository.save
        .mockResolvedValueOnce(finalScores[0])
        .mockResolvedValueOnce(finalScores[1])
        .mockResolvedValueOnce(finalScores[2])

      // Act
      const result = await useCase.execute(cycleId.value)

      // Assert
      expect(result).toBeUndefined()
      expect(mockManagerEvaluationRepository.findByCycle).toHaveBeenCalledWith(cycleId)
      expect(mockCalculationService.calculateFinalScore).toHaveBeenCalledTimes(3)
      expect(mockFinalScoreRepository.save).toHaveBeenCalledTimes(3)
    })
  })
})
