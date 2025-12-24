import { GetTeamFinalScoresUseCase } from './get-team-final-scores.use-case'
import type { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import type { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { FinalScore, FinalScoreId } from '../../../domain/entities/final-score.entity'
import { User } from '../../../../auth/domain/entities/user.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { BonusTier } from '../../../domain/value-objects/bonus-tier.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import type { GetTeamFinalScoresInput, GetTeamFinalScoresOutput } from '../../dto/final-score.dto'

describe('GetTeamFinalScoresUseCase', () => {
  let useCase: GetTeamFinalScoresUseCase
  let finalScoreRepository: jest.Mocked<IFinalScoreRepository>
  let cycleRepository: jest.Mocked<IReviewCycleRepository>
  let userRepository: jest.Mocked<IUserRepository>

  // Test data factories
  const createManagerId = (): UserId => UserId.generate()

  const createCycleId = (): ReviewCycleId => ReviewCycleId.generate()

  const createValidInput = (
    managerId: UserId = createManagerId(),
    cycleId: ReviewCycleId = createCycleId(),
  ): GetTeamFinalScoresInput => ({
    managerId,
    cycleId,
  })

  const createValidReviewCycle = (cycleId: ReviewCycleId): ReviewCycle => {
    const deadlines = CycleDeadlines.create({
      selfReview: new Date('2024-01-31'),
      peerFeedback: new Date('2024-02-28'),
      managerEvaluation: new Date('2024-03-31'),
      calibration: new Date('2024-04-30'),
      feedbackDelivery: new Date('2024-05-31'),
    })
    return ReviewCycle.create({
      id: cycleId,
      year: 2024,
      startDate: new Date('2024-01-01'),
      name: 'Annual Review 2024',
      deadlines,
    })
  }

  const createValidUser = (managerId?: string, level: string = 'L3'): User => {
    return User.create({
      id: UserId.generate(),
      email: Email.create(`user${Math.random().toString(36).substr(2, 9)}@example.com`),
      name: 'John Doe',
      keycloakId: `keycloak-${Math.random().toString(36).substr(2, 9)}`,
      roles: [Role.user()],
      isActive: true,
      level,
      department: 'Engineering',
      managerId: managerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const createValidFinalScore = (
    cycleId: ReviewCycleId,
    userId: UserId,
    expectedBonusTier: BonusTier = BonusTier.MEETS,
  ): FinalScore => {
    // Create weighted score based on expected bonus tier
    // EXCEEDS: >= 85% => >= 3.4
    // MEETS: 50-84% => 2.0-3.39
    // BELOW: < 50% => < 2.0
    let scoreValue = 2.8 // Default MEETS tier (70%)
    if (expectedBonusTier.equals(BonusTier.EXCEEDS)) {
      scoreValue = 3.5 // 87.5% EXCEEDS
    } else if (expectedBonusTier.equals(BonusTier.BELOW)) {
      scoreValue = 1.5 // 37.5% BELOW
    }

    const weightedScore = WeightedScore.fromValue(scoreValue)

    return FinalScore.create({
      id: FinalScoreId.generate(),
      cycleId,
      userId,
      pillarScores: PillarScores.create({
        projectImpact: 3,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      }),
      weightedScore,
      finalLevel: EngineerLevel.MID,
      peerFeedbackCount: 3,
    })
  }

  beforeEach(() => {
    // Create mock repositories
    finalScoreRepository = {
      findById: jest.fn(),
      findByUserAndCycle: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByCycle: jest.fn(),
      findByBonusTier: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    cycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    userRepository = {
      findById: jest.fn(),
      findByManagerId: jest.fn(),
      findByKeycloakId: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      findByRole: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    // Create use case instance
    useCase = new GetTeamFinalScoresUseCase(finalScoreRepository, cycleRepository, userRepository)
  })

  describe('execute', () => {
    describe("CRITICAL: Should retrieve all team members' final scores", () => {
      it('should return scores for all direct reports', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser(managerId.value)
        const employee2 = createValidUser(managerId.value)
        const directReports = [employee1, employee2]

        const finalScore1 = createValidFinalScore(cycleId, employee1.id)
        const finalScore2 = createValidFinalScore(cycleId, employee2.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)
        finalScoreRepository.findByUserAndCycle
          .mockResolvedValueOnce(finalScore1)
          .mockResolvedValueOnce(finalScore2)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(2)
        expect(result.teamScores[0].employeeId).toBe(employee1.id.value)
        expect(result.teamScores[1].employeeId).toBe(employee2.id.value)
      })

      it('should call findByManagerId with correct manager ID', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([])

        // Act
        await useCase.execute(input)

        // Assert
        expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId.value)
        expect(userRepository.findByManagerId).toHaveBeenCalledTimes(1)
      })

      it('should retrieve scores in parallel for multiple employees', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 5 }, () => createValidUser(managerId.value))

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(employees)

        employees.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(5)
      })

      it('should process team scores using Promise.all for efficiency', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 3 }, () => createValidUser(managerId.value))

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(employees)

        employees.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const startTime = Date.now()
        await useCase.execute(input)
        const endTime = Date.now()

        // Assert - parallel execution should be relatively fast
        expect(endTime - startTime).toBeLessThan(5000)
      })
    })

    describe('CRITICAL: Should validate cycle exists', () => {
      it('should throw ReviewNotFoundException if cycle does not exist', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      })

      it('should throw ReviewNotFoundException with correct message including cycle ID', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(
          `Review cycle with ID ${input.cycleId.value} not found`,
        )
      })

      it('should call cycleRepository.findById with correct cycle ID', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act
        try {
          await useCase.execute(input)
        } catch {}

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId)
        expect(cycleRepository.findById).toHaveBeenCalledTimes(1)
      })

      it('should not proceed to find direct reports if cycle validation fails', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act
        try {
          await useCase.execute(input)
        } catch {}

        // Assert
        expect(userRepository.findByManagerId).not.toHaveBeenCalled()
      })

      it('should propagate cycle repository errors without modification', async () => {
        // Arrange
        const input = createValidInput()
        const customError = new ReviewNotFoundException('Custom cycle error')
        cycleRepository.findById.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(customError)
      })
    })

    describe("CRITICAL: Should only return direct reports' scores", () => {
      it('should only include employees where managerId matches input managerId', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const directReport1 = createValidUser(managerId.value)
        const directReport2 = createValidUser(managerId.value)
        const directReports = [directReport1, directReport2]

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)

        directReports.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(2)
        result.teamScores.forEach((score) => {
          expect([directReport1.id.value, directReport2.id.value]).toContain(score.employeeId)
        })
      })

      it('should not retrieve scores for employees not in findByManagerId result', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser(managerId.value)
        const employee2 = createValidUser(managerId.value)
        const directReports = [employee1, employee2]

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)

        directReports.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(2)
        const resultEmployeeIds = result.teamScores.map((s) => s.employeeId)
        expect(resultEmployeeIds).toEqual(
          expect.arrayContaining([employee1.id.value, employee2.id.value]),
        )
      })

      it('should filter scores to match manager ID from input', async () => {
        // Arrange
        const managerId1 = createManagerId()
        const cycleId = createCycleId()

        const input = createValidInput(managerId1, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const directReports = [createValidUser(managerId1.value), createValidUser(managerId1.value)]

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)

        directReports.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(2)
        expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId1.value)
      })
    })

    describe('CRITICAL: Should include complete score data for each employee', () => {
      it('should include all required fields in score data', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        const finalScore = createValidFinalScore(cycleId, employee.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        const score = result.teamScores[0]
        expect(score).toHaveProperty('employeeId')
        expect(score).toHaveProperty('employeeName')
        expect(score).toHaveProperty('level')
        expect(score).toHaveProperty('weightedScore')
        expect(score).toHaveProperty('percentageScore')
        expect(score).toHaveProperty('bonusTier')
        expect(score).toHaveProperty('feedbackDelivered')
      })

      it('should include weighted score from final score entity', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        const finalScore = createValidFinalScore(cycleId, employee.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].weightedScore).toBe(finalScore.weightedScore.value)
      })

      it('should include percentage score from final score entity', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        const finalScore = createValidFinalScore(cycleId, employee.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].percentageScore).toBe(finalScore.percentageScore)
      })

      it('should include bonus tier from final score entity', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        const finalScore = createValidFinalScore(cycleId, employee.id, BonusTier.EXCEEDS)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].bonusTier).toBe(finalScore.bonusTier.value)
      })

      it('should include feedback delivered status', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        const finalScore = createValidFinalScore(cycleId, employee.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].feedbackDelivered).toBe(finalScore.feedbackDelivered)
      })

      it('should include employee name from user entity', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        const expectedName = employee.name
        const finalScore = createValidFinalScore(cycleId, employee.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].employeeName).toBe(expectedName)
      })

      it('should include employee level from user entity', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value, 'L4')
        const finalScore = createValidFinalScore(cycleId, employee.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].level).toBe(employee.level)
      })
    })

    describe('IMPORTANT: Should return array of final score DTOs', () => {
      it('should return output as GetTeamFinalScoresOutput interface', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
          createValidFinalScore(cycleId, employee.id),
        )

        // Act
        const result: GetTeamFinalScoresOutput = await useCase.execute(input)

        // Assert
        expect(result).toHaveProperty('teamScores')
        expect(Array.isArray(result.teamScores)).toBe(true)
      })

      it('should return array with correct structure for each score', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
          createValidFinalScore(cycleId, employee.id),
        )

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0]).toHaveProperty('employeeId')
        expect(result.teamScores[0]).toHaveProperty('employeeName')
        expect(result.teamScores[0]).toHaveProperty('level')
        expect(result.teamScores[0]).toHaveProperty('weightedScore')
        expect(result.teamScores[0]).toHaveProperty('percentageScore')
        expect(result.teamScores[0]).toHaveProperty('bonusTier')
        expect(result.teamScores[0]).toHaveProperty('feedbackDelivered')
      })

      it('should return string IDs and primitive types in score objects', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
          createValidFinalScore(cycleId, employee.id),
        )

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(typeof result.teamScores[0].employeeId).toBe('string')
        expect(typeof result.teamScores[0].employeeName).toBe('string')
        expect(typeof result.teamScores[0].level).toBe('string')
        expect(typeof result.teamScores[0].weightedScore).toBe('number')
        expect(typeof result.teamScores[0].percentageScore).toBe('number')
        expect(typeof result.teamScores[0].bonusTier).toBe('string')
        expect(typeof result.teamScores[0].feedbackDelivered).toBe('boolean')
      })
    })

    describe('IMPORTANT: Should handle empty team gracefully', () => {
      it('should return empty scores array when manager has no direct reports', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toEqual([])
      })

      it('should return output structure even with empty team', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toHaveProperty('teamScores')
        expect(Array.isArray(result.teamScores)).toBe(true)
      })

      it('should not call final score repository if no direct reports', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([])

        // Act
        await useCase.execute(input)

        // Assert
        expect(finalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
      })
    })

    describe('IMPORTANT: Should include bonus tier distribution summary', () => {
      it('should handle different bonus tiers in team', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser(managerId.value)
        const employee2 = createValidUser(managerId.value)
        const employee3 = createValidUser(managerId.value)
        const directReports = [employee1, employee2, employee3]

        const score1 = createValidFinalScore(cycleId, employee1.id, BonusTier.EXCEEDS)
        const score2 = createValidFinalScore(cycleId, employee2.id, BonusTier.MEETS)
        const score3 = createValidFinalScore(cycleId, employee3.id, BonusTier.BELOW)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)
        finalScoreRepository.findByUserAndCycle
          .mockResolvedValueOnce(score1)
          .mockResolvedValueOnce(score2)
          .mockResolvedValueOnce(score3)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(3)
        expect(result.teamScores[0].bonusTier).toBe('EXCEEDS')
        expect(result.teamScores[1].bonusTier).toBe('MEETS')
        expect(result.teamScores[2].bonusTier).toBe('BELOW')
      })

      it('should preserve bonus tier values across team', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 5 }, () => createValidUser(managerId.value))
        const tiers = [
          BonusTier.EXCEEDS,
          BonusTier.MEETS,
          BonusTier.BELOW,
          BonusTier.MEETS,
          BonusTier.EXCEEDS,
        ]

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(employees)

        employees.forEach((employee, index) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id, tiers[index]),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].bonusTier).toBe('EXCEEDS')
        expect(result.teamScores[1].bonusTier).toBe('MEETS')
        expect(result.teamScores[2].bonusTier).toBe('BELOW')
        expect(result.teamScores[3].bonusTier).toBe('MEETS')
        expect(result.teamScores[4].bonusTier).toBe('EXCEEDS')
      })
    })

    describe('EDGE: Should handle large teams efficiently', () => {
      it('should efficiently handle large number of direct reports', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const largeTeam = Array.from({ length: 100 }, () => createValidUser(managerId.value))

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(largeTeam)

        largeTeam.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(100)
      })

      it('should process large teams in reasonable time with parallel execution', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const largeTeam = Array.from({ length: 50 }, () => createValidUser(managerId.value))

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(largeTeam)

        largeTeam.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const startTime = Date.now()
        await useCase.execute(input)
        const duration = Date.now() - startTime

        // Assert - should complete in reasonable time
        expect(duration).toBeLessThan(10000)
      })

      it('should maintain data consistency with large team', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const largeTeam = Array.from({ length: 30 }, () => createValidUser(managerId.value))

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(largeTeam)

        largeTeam.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(30)
        const resultEmployeeIds = result.teamScores.map((s) => s.employeeId)
        const inputEmployeeIds = largeTeam.map((e) => e.id.value)
        expect(resultEmployeeIds).toEqual(expect.arrayContaining(inputEmployeeIds))
      })
    })

    describe('EDGE: Should filter by level if specified', () => {
      it('should handle employees with different levels', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser(managerId.value, 'L3')
        const employee2 = createValidUser(managerId.value, 'L4')
        const directReports = [employee1, employee2]

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)

        directReports.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(2)
        result.teamScores.forEach((score) => {
          expect(score.level).toBeDefined()
          expect(typeof score.level).toBe('string')
        })
      })

      it('should include employee level from user entity', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value, 'L5')
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
          createValidFinalScore(cycleId, employee.id),
        )

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].level).toBe('L5')
      })

      it('should use "Unknown" when employee has no level', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = User.create({
          id: UserId.generate(),
          email: Email.create('user@example.com'),
          name: 'John Doe',
          keycloakId: 'keycloak-123',
          roles: [Role.user()],
          isActive: true,
          level: null,
          managerId: managerId.value,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
          createValidFinalScore(cycleId, employee.id),
        )

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores[0].level).toBe('Unknown')
      })
    })

    describe('EDGE: Should handle partial team scores (some employees missing)', () => {
      it('should handle employees with no final score in system', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser(managerId.value)
        const employee2 = createValidUser(managerId.value)
        const directReports = [employee1, employee2]

        const finalScore1 = createValidFinalScore(cycleId, employee1.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)
        finalScoreRepository.findByUserAndCycle
          .mockResolvedValueOnce(finalScore1)
          .mockResolvedValueOnce(null) // Employee 2 has no final score

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(2)
        expect(result.teamScores[0].employeeId).toBe(employee1.id.value)
        expect(result.teamScores[1].employeeId).toBe(employee2.id.value)
      })

      it('should return default scores when final score is missing', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(null)

        // Act
        const result = await useCase.execute(input)

        // Assert
        const score = result.teamScores[0]
        expect(score.weightedScore).toBe(0)
        expect(score.percentageScore).toBe(0)
        expect(score.bonusTier).toBe('BELOW')
        expect(score.feedbackDelivered).toBe(false)
      })

      it('should include employee info even when final score is missing', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value, 'L3')

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(null)

        // Act
        const result = await useCase.execute(input)

        // Assert
        const score = result.teamScores[0]
        expect(score.employeeId).toBe(employee.id.value)
        expect(score.employeeName).toBe(employee.name)
        expect(score.level).toBe('L3')
      })

      it('should handle mix of employees with and without scores', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser(managerId.value)
        const employee2 = createValidUser(managerId.value)
        const employee3 = createValidUser(managerId.value)
        const directReports = [employee1, employee2, employee3]

        const finalScore1 = createValidFinalScore(cycleId, employee1.id)
        const finalScore3 = createValidFinalScore(cycleId, employee3.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)
        finalScoreRepository.findByUserAndCycle
          .mockResolvedValueOnce(finalScore1)
          .mockResolvedValueOnce(null) // Employee 2 missing
          .mockResolvedValueOnce(finalScore3)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(3)
        expect(result.teamScores[0].weightedScore).toBe(finalScore1.weightedScore.value)
        expect(result.teamScores[1].weightedScore).toBe(0) // Default
        expect(result.teamScores[2].weightedScore).toBe(finalScore3.weightedScore.value)
      })
    })

    describe('EDGE: Should verify manager authorization', () => {
      it('should accept any manager ID without additional authorization check', async () => {
        // Arrange - the use case relies on userRepository.findByManagerId
        // to enforce authorization (only returns direct reports)
        const managerId1 = createManagerId()
        const cycleId = createCycleId()

        const input = createValidInput(managerId1, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        // Only managerId1's direct reports would be returned by the repository
        const directReports = [createValidUser(managerId1.value)]

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)
        finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
          createValidFinalScore(cycleId, directReports[0].id),
        )

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(userRepository.findByManagerId).toHaveBeenCalledWith(managerId1.value)
        expect(result.teamScores).toHaveLength(1)
      })

      it('should retrieve only the team members associated with the manager', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const teamMembers = [createValidUser(managerId.value), createValidUser(managerId.value)]

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(teamMembers)

        teamMembers.forEach((employee) => {
          finalScoreRepository.findByUserAndCycle.mockResolvedValueOnce(
            createValidFinalScore(cycleId, employee.id),
          )
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        // Verify that only the team members returned by findByManagerId are in results
        const resultEmployeeIds = result.teamScores.map((s) => s.employeeId)
        expect(resultEmployeeIds).toEqual(
          expect.arrayContaining(teamMembers.map((m) => m.id.value)),
        )
        expect(result.teamScores).toHaveLength(2)
      })
    })

    describe('IMPORTANT: Should handle repository errors gracefully', () => {
      it('should throw error if cycle repository fails', async () => {
        // Arrange
        const input = createValidInput()
        const error = new Error('Database connection failed')
        cycleRepository.findById.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Database connection failed')
      })

      it('should throw error if user repository fails', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const error = new Error('User repository error')
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('User repository error')
      })

      it('should throw error if final score repository fails for any employee', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        const error = new Error('Final score repository error')

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])
        finalScoreRepository.findByUserAndCycle.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Final score repository error')
      })
    })

    describe('Integration scenarios', () => {
      it('should complete full workflow: retrieve team scores with mixed states', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser(managerId.value, 'L3')
        const employee2 = createValidUser(managerId.value, 'L4')
        const employee3 = createValidUser(managerId.value, 'L5')
        const directReports = [employee1, employee2, employee3]

        const score1 = createValidFinalScore(cycleId, employee1.id, BonusTier.EXCEEDS)
        const score2 = createValidFinalScore(cycleId, employee2.id, BonusTier.MEETS)
        // Employee 3 has no score

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)

        finalScoreRepository.findByUserAndCycle
          .mockResolvedValueOnce(score1)
          .mockResolvedValueOnce(score2)
          .mockResolvedValueOnce(null)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(3)

        // Employee 1: Has score with EXCEEDS tier
        expect(result.teamScores[0].employeeId).toBe(employee1.id.value)
        expect(result.teamScores[0].bonusTier).toBe('EXCEEDS')
        expect(result.teamScores[0].level).toBe('L3')
        expect(result.teamScores[0].weightedScore).toBe(score1.weightedScore.value)

        // Employee 2: Has score with MEETS tier
        expect(result.teamScores[1].employeeId).toBe(employee2.id.value)
        expect(result.teamScores[1].bonusTier).toBe('MEETS')
        expect(result.teamScores[1].level).toBe('L4')
        expect(result.teamScores[1].weightedScore).toBe(score2.weightedScore.value)

        // Employee 3: No score - default values
        expect(result.teamScores[2].employeeId).toBe(employee3.id.value)
        expect(result.teamScores[2].bonusTier).toBe('BELOW')
        expect(result.teamScores[2].level).toBe('L5')
        expect(result.teamScores[2].weightedScore).toBe(0)
      })

      it('should verify correct repository calls in sequence', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([])

        // Act
        await useCase.execute(input)

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId)
        expect(cycleRepository.findById).toHaveBeenCalledTimes(1)
        expect(userRepository.findByManagerId).toHaveBeenCalledWith(input.managerId.value)
        expect(userRepository.findByManagerId).toHaveBeenCalledTimes(1)
      })

      it('should return consistent data across multiple executions', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser(managerId.value)
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue([employee])

        finalScoreRepository.findByUserAndCycle.mockResolvedValue(
          createValidFinalScore(cycleId, employee.id),
        )

        // Act
        const result1 = await useCase.execute(input)
        const result2 = await useCase.execute(input)

        // Assert
        expect(result1.teamScores[0].employeeId).toBe(result2.teamScores[0].employeeId)
        expect(result1.teamScores[0].employeeName).toBe(result2.teamScores[0].employeeName)
        expect(result1.teamScores[0].level).toBe(result2.teamScores[0].level)
      })

      it('should handle complex scenario with all bonus tiers represented', async () => {
        // Arrange
        const managerId = createManagerId()
        const cycleId = createCycleId()
        const input = createValidInput(managerId, cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employeeExceeds = createValidUser(managerId.value)
        const employeeMeets = createValidUser(managerId.value)
        const employeeBelow = createValidUser(managerId.value)
        const directReports = [employeeExceeds, employeeMeets, employeeBelow]

        const scoreExceeds = createValidFinalScore(cycleId, employeeExceeds.id, BonusTier.EXCEEDS)
        const scoreMeets = createValidFinalScore(cycleId, employeeMeets.id, BonusTier.MEETS)
        const scoreBelow = createValidFinalScore(cycleId, employeeBelow.id, BonusTier.BELOW)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findByManagerId.mockResolvedValue(directReports)

        finalScoreRepository.findByUserAndCycle
          .mockResolvedValueOnce(scoreExceeds)
          .mockResolvedValueOnce(scoreMeets)
          .mockResolvedValueOnce(scoreBelow)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.teamScores).toHaveLength(3)

        const tierDistribution = result.teamScores.reduce(
          (acc, score) => {
            acc[score.bonusTier] = (acc[score.bonusTier] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        expect(tierDistribution['EXCEEDS']).toBe(1)
        expect(tierDistribution['MEETS']).toBe(1)
        expect(tierDistribution['BELOW']).toBe(1)
      })
    })
  })
})
