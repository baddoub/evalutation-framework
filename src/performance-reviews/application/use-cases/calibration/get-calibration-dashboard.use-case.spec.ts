import { GetCalibrationDashboardUseCase } from './get-calibration-dashboard.use-case'
import type { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import type { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ScoreCalculationService } from '../../../domain/services/score-calculation.service'
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity'
import { User } from '../../../../auth/domain/entities/user.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import type { GetCalibrationDashboardInput } from '../../dto/final-score.dto'

describe('GetCalibrationDashboardUseCase', () => {
  let useCase: GetCalibrationDashboardUseCase
  let cycleRepository: jest.Mocked<IReviewCycleRepository>
  let managerEvaluationRepository: jest.Mocked<IManagerEvaluationRepository>
  let userRepository: jest.Mocked<IUserRepository>
  let scoreCalculationService: ScoreCalculationService

  // Test data factories
  const createCycleId = (): ReviewCycleId => ReviewCycleId.generate()

  const createValidInput = (
    cycleId: ReviewCycleId = createCycleId(),
    department?: string,
  ): GetCalibrationDashboardInput => ({
    cycleId,
    department,
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

  const createValidUser = (
    department: string = 'Engineering',
    level: string = 'MID',
    name: string = 'John Doe',
  ): User => {
    return User.create({
      id: UserId.generate(),
      email: Email.create(`user${Math.random().toString(36).substr(2, 9)}@example.com`),
      name,
      keycloakId: `keycloak-${Math.random().toString(36).substr(2, 9)}`,
      roles: [Role.user()],
      isActive: true,
      level,
      department,
      managerId: UserId.generate().value,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const createValidManagerEvaluation = (
    cycleId: ReviewCycleId,
    employeeId: UserId,
    managerId: UserId,
    scores?: {
      projectImpact: number
      direction: number
      engineeringExcellence: number
      operationalOwnership: number
      peopleImpact: number
    },
    isCalibrated: boolean = false,
  ): ManagerEvaluation => {
    const defaultScores = {
      projectImpact: 3,
      direction: 3,
      engineeringExcellence: 3,
      operationalOwnership: 3,
      peopleImpact: 3,
    }
    const evaluation = ManagerEvaluation.create({
      cycleId,
      employeeId,
      managerId,
      scores: PillarScores.create(scores || defaultScores),
      narrative: 'Manager evaluation narrative',
      strengths: 'Strong technical skills',
      growthAreas: 'Leadership development',
      developmentPlan: 'Consider mentoring opportunities',
    })

    if (isCalibrated) {
      evaluation.submit()
      evaluation.calibrate()
    }

    return evaluation
  }

  beforeEach(() => {
    // Create mock repositories
    cycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    managerEvaluationRepository = {
      findById: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByManagerAndCycle: jest.fn(),
      findByCycle: jest.fn(),
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

    scoreCalculationService = new ScoreCalculationService()

    // Create use case instance
    useCase = new GetCalibrationDashboardUseCase(
      cycleRepository,
      managerEvaluationRepository,
      userRepository,
      scoreCalculationService,
    )
  })

  describe('execute', () => {
    describe('CRITICAL: Should retrieve calibration dashboard data', () => {
      it('should return calibration dashboard with summary and evaluations', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser('Engineering', 'MID')
        const employee2 = createValidUser('Engineering', 'SENIOR')
        const manager = createValidUser('Engineering', 'LEAD', 'Manager Name')

        const evaluation1 = createValidManagerEvaluation(cycleId, employee1.id, manager.id)
        const evaluation2 = createValidManagerEvaluation(cycleId, employee2.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation1, evaluation2])
        userRepository.findById
          .mockResolvedValueOnce(employee1)
          .mockResolvedValueOnce(manager)
          .mockResolvedValueOnce(employee2)
          .mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toHaveProperty('summary')
        expect(result).toHaveProperty('evaluations')
        expect(result.summary.totalEvaluations).toBe(2)
        expect(result.evaluations).toHaveLength(2)
      })

      it('should call findByCycle with correct cycle ID', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([])

        // Act
        await useCase.execute(input)

        // Assert
        expect(managerEvaluationRepository.findByCycle).toHaveBeenCalledWith(cycleId)
        expect(managerEvaluationRepository.findByCycle).toHaveBeenCalledTimes(1)
      })

      it('should process evaluations in parallel for efficiency', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 5 }, () => createValidUser())
        const manager = createValidUser()
        const evaluations = employees.map((emp) =>
          createValidManagerEvaluation(cycleId, emp.id, manager.id),
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

        employees.forEach((emp) => {
          userRepository.findById.mockResolvedValueOnce(emp).mockResolvedValueOnce(manager)
        })

        // Act
        const startTime = Date.now()
        const result = await useCase.execute(input)
        const endTime = Date.now()

        // Assert
        expect(result.evaluations).toHaveLength(5)
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

      it('should not proceed to find evaluations if cycle validation fails', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act
        try {
          await useCase.execute(input)
        } catch {}

        // Assert
        expect(managerEvaluationRepository.findByCycle).not.toHaveBeenCalled()
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

    describe('CRITICAL: Should calculate bonus tier statistics correctly', () => {
      it('should count evaluations by bonus tier correctly', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser('Engineering', 'MID')
        const employee2 = createValidUser('Engineering', 'MID')
        const employee3 = createValidUser('Engineering', 'MID')
        const manager = createValidUser()

        // Scores that will result in EXCEEDS tier (>= 3.4)
        const exceedsScores = {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        }

        // Scores that will result in MEETS tier (2.0 - 3.39)
        const meetsScores = {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 2,
        }

        // Scores that will result in BELOW tier (< 2.0)
        const belowScores = {
          projectImpact: 1,
          direction: 1,
          engineeringExcellence: 2,
          operationalOwnership: 1,
          peopleImpact: 1,
        }

        const evaluation1 = createValidManagerEvaluation(
          cycleId,
          employee1.id,
          manager.id,
          exceedsScores,
        )
        const evaluation2 = createValidManagerEvaluation(
          cycleId,
          employee2.id,
          manager.id,
          meetsScores,
        )
        const evaluation3 = createValidManagerEvaluation(
          cycleId,
          employee3.id,
          manager.id,
          belowScores,
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([
          evaluation1,
          evaluation2,
          evaluation3,
        ])

        userRepository.findById
          .mockResolvedValueOnce(employee1)
          .mockResolvedValueOnce(manager)
          .mockResolvedValueOnce(employee2)
          .mockResolvedValueOnce(manager)
          .mockResolvedValueOnce(employee3)
          .mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.byBonusTier.EXCEEDS).toBe(1)
        expect(result.summary.byBonusTier.MEETS).toBe(1)
        expect(result.summary.byBonusTier.BELOW).toBe(1)
      })

      it('should handle all evaluations in MEETS tier', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 3 }, () => createValidUser('Engineering', 'MID'))
        const manager = createValidUser()

        const meetsScores = {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 2,
        }

        const evaluations = employees.map((emp) =>
          createValidManagerEvaluation(cycleId, emp.id, manager.id, meetsScores),
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

        employees.forEach((emp) => {
          userRepository.findById.mockResolvedValueOnce(emp).mockResolvedValueOnce(manager)
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.byBonusTier.EXCEEDS).toBe(0)
        expect(result.summary.byBonusTier.MEETS).toBe(3)
        expect(result.summary.byBonusTier.BELOW).toBe(0)
      })

      it('should initialize all bonus tier counts to zero', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.byBonusTier.EXCEEDS).toBe(0)
        expect(result.summary.byBonusTier.MEETS).toBe(0)
        expect(result.summary.byBonusTier.BELOW).toBe(0)
      })
    })

    describe('CRITICAL: Should calculate department statistics correctly', () => {
      it('should count evaluations by department', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const engEmployee1 = createValidUser('Engineering', 'MID')
        const engEmployee2 = createValidUser('Engineering', 'MID')
        const productEmployee = createValidUser('Product', 'MID')
        const manager = createValidUser()

        const evaluation1 = createValidManagerEvaluation(cycleId, engEmployee1.id, manager.id)
        const evaluation2 = createValidManagerEvaluation(cycleId, engEmployee2.id, manager.id)
        const evaluation3 = createValidManagerEvaluation(cycleId, productEmployee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([
          evaluation1,
          evaluation2,
          evaluation3,
        ])

        // Create a map for efficient lookup
        const userMap = new Map()
        userMap.set(engEmployee1.id.value, engEmployee1)
        userMap.set(engEmployee2.id.value, engEmployee2)
        userMap.set(productEmployee.id.value, productEmployee)
        userMap.set(manager.id.value, manager)

        userRepository.findById.mockImplementation(async (id) => {
          return userMap.get(id.value) || null
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.byDepartment['Engineering']).toBeDefined()
        expect(result.summary.byDepartment['Product']).toBeDefined()
        expect(
          result.summary.byDepartment['Engineering'].EXCEEDS +
            result.summary.byDepartment['Engineering'].MEETS +
            result.summary.byDepartment['Engineering'].BELOW,
        ).toBe(2)
        expect(
          result.summary.byDepartment['Product'].EXCEEDS +
            result.summary.byDepartment['Product'].MEETS +
            result.summary.byDepartment['Product'].BELOW,
        ).toBe(1)
      })

      it('should handle employees without department as "Unknown"', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = User.create({
          id: UserId.generate(),
          email: Email.create('user@example.com'),
          name: 'John Doe',
          keycloakId: 'keycloak-123',
          roles: [Role.user()],
          isActive: true,
          level: 'MID',
          department: null,
          managerId: UserId.generate().value,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        const manager = createValidUser()

        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.byDepartment['Unknown']).toBeDefined()
      })

      it('should count bonus tiers per department correctly', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const engEmployee1 = createValidUser('Engineering', 'MID')
        const engEmployee2 = createValidUser('Engineering', 'MID')
        const manager = createValidUser()

        const exceedsScores = {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        }

        const belowScores = {
          projectImpact: 1,
          direction: 1,
          engineeringExcellence: 2,
          operationalOwnership: 1,
          peopleImpact: 1,
        }

        const evaluation1 = createValidManagerEvaluation(
          cycleId,
          engEmployee1.id,
          manager.id,
          exceedsScores,
        )
        const evaluation2 = createValidManagerEvaluation(
          cycleId,
          engEmployee2.id,
          manager.id,
          belowScores,
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation1, evaluation2])

        userRepository.findById
          .mockResolvedValueOnce(engEmployee1)
          .mockResolvedValueOnce(manager)
          .mockResolvedValueOnce(engEmployee2)
          .mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.byDepartment['Engineering'].EXCEEDS).toBe(1)
        expect(result.summary.byDepartment['Engineering'].MEETS).toBe(0)
        expect(result.summary.byDepartment['Engineering'].BELOW).toBe(1)
      })
    })

    describe('CRITICAL: Should include complete evaluation data for each employee', () => {
      it('should include all required fields in evaluation data', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser()
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        const evalData = result.evaluations[0]
        expect(evalData).toHaveProperty('employeeId')
        expect(evalData).toHaveProperty('employeeName')
        expect(evalData).toHaveProperty('level')
        expect(evalData).toHaveProperty('department')
        expect(evalData).toHaveProperty('managerId')
        expect(evalData).toHaveProperty('managerName')
        expect(evalData).toHaveProperty('scores')
        expect(evalData).toHaveProperty('weightedScore')
        expect(evalData).toHaveProperty('percentageScore')
        expect(evalData).toHaveProperty('bonusTier')
        expect(evalData).toHaveProperty('calibrationStatus')
      })

      it('should include correct employee data', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser('Engineering', 'SENIOR', 'Jane Smith')
        const manager = createValidUser('Engineering', 'LEAD', 'Bob Manager')
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].employeeId).toBe(employee.id.value)
        expect(result.evaluations[0].employeeName).toBe('Jane Smith')
        expect(result.evaluations[0].level).toBe('SENIOR')
        expect(result.evaluations[0].department).toBe('Engineering')
      })

      it('should include correct manager data', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser()
        const manager = createValidUser('Product', 'MANAGER', 'Alice Manager')
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].managerId).toBe(manager.id.value)
        expect(result.evaluations[0].managerName).toBe('Alice Manager')
      })

      it('should include pillar scores', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser('Engineering', 'MID')
        const manager = createValidUser()

        const customScores = {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 2,
          peopleImpact: 3,
        }

        const evaluation = createValidManagerEvaluation(
          cycleId,
          employee.id,
          manager.id,
          customScores,
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].scores.projectImpact).toBe(4)
        expect(result.evaluations[0].scores.direction).toBe(3)
        expect(result.evaluations[0].scores.engineeringExcellence).toBe(4)
        expect(result.evaluations[0].scores.operationalOwnership).toBe(2)
        expect(result.evaluations[0].scores.peopleImpact).toBe(3)
      })

      it('should ensure all pillar scores are between 0 and 4', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser('Engineering', 'MID')
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        const { scores } = result.evaluations[0]
        expect(scores.projectImpact).toBeGreaterThanOrEqual(0)
        expect(scores.projectImpact).toBeLessThanOrEqual(4)
        expect(scores.direction).toBeGreaterThanOrEqual(0)
        expect(scores.direction).toBeLessThanOrEqual(4)
        expect(scores.engineeringExcellence).toBeGreaterThanOrEqual(0)
        expect(scores.engineeringExcellence).toBeLessThanOrEqual(4)
        expect(scores.operationalOwnership).toBeGreaterThanOrEqual(0)
        expect(scores.operationalOwnership).toBeLessThanOrEqual(4)
        expect(scores.peopleImpact).toBeGreaterThanOrEqual(0)
        expect(scores.peopleImpact).toBeLessThanOrEqual(4)
      })

      it('should include weighted score and percentage', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser('Engineering', 'MID')
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].weightedScore).toBeDefined()
        expect(result.evaluations[0].percentageScore).toBeDefined()
        expect(typeof result.evaluations[0].weightedScore).toBe('number')
        expect(typeof result.evaluations[0].percentageScore).toBe('number')
      })

      it('should include calibration status', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee1 = createValidUser()
        const employee2 = createValidUser()
        const manager = createValidUser()

        const evaluation1 = createValidManagerEvaluation(
          cycleId,
          employee1.id,
          manager.id,
          undefined,
          true,
        )
        const evaluation2 = createValidManagerEvaluation(
          cycleId,
          employee2.id,
          manager.id,
          undefined,
          false,
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation1, evaluation2])
        userRepository.findById
          .mockResolvedValueOnce(employee1)
          .mockResolvedValueOnce(manager)
          .mockResolvedValueOnce(employee2)
          .mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].calibrationStatus).toBe('CALIBRATED')
        expect(result.evaluations[1].calibrationStatus).toBe('PENDING')
      })
    })

    describe('IMPORTANT: Should filter by department when provided', () => {
      it('should filter evaluations by department when department is specified', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId, 'Engineering')
        const cycle = createValidReviewCycle(cycleId)

        const engEmployee1 = createValidUser('Engineering', 'MID')
        const engEmployee2 = createValidUser('Engineering', 'MID')
        const productEmployee = createValidUser('Product', 'MID')
        const manager = createValidUser()

        const evaluation1 = createValidManagerEvaluation(cycleId, engEmployee1.id, manager.id)
        const evaluation2 = createValidManagerEvaluation(cycleId, engEmployee2.id, manager.id)
        const evaluation3 = createValidManagerEvaluation(cycleId, productEmployee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([
          evaluation1,
          evaluation2,
          evaluation3,
        ])

        // First fetch for filtering, then fetch for evaluation details
        userRepository.findById
          .mockResolvedValueOnce(engEmployee1) // filtering
          .mockResolvedValueOnce(engEmployee2) // filtering
          .mockResolvedValueOnce(productEmployee) // filtering
          .mockResolvedValueOnce(engEmployee1) // evaluation details
          .mockResolvedValueOnce(manager) // evaluation details
          .mockResolvedValueOnce(engEmployee2) // evaluation details
          .mockResolvedValueOnce(manager) // evaluation details

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations).toHaveLength(2)
        result.evaluations.forEach((evalData) => {
          expect(evalData.department).toBe('Engineering')
        })
      })

      it('should return all evaluations when department is not specified', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const engEmployee = createValidUser('Engineering', 'MID')
        const productEmployee = createValidUser('Product', 'MID')
        const manager = createValidUser()

        const evaluation1 = createValidManagerEvaluation(cycleId, engEmployee.id, manager.id)
        const evaluation2 = createValidManagerEvaluation(cycleId, productEmployee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation1, evaluation2])

        userRepository.findById
          .mockResolvedValueOnce(engEmployee)
          .mockResolvedValueOnce(manager)
          .mockResolvedValueOnce(productEmployee)
          .mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations).toHaveLength(2)
      })

      it('should return empty array when filtering by non-existent department', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId, 'NonExistentDepartment')
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser('Engineering', 'MID')
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations).toHaveLength(0)
      })

      it('should only include statistics for filtered department', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId, 'Engineering')
        const cycle = createValidReviewCycle(cycleId)

        const engEmployee1 = createValidUser('Engineering', 'MID')
        const engEmployee2 = createValidUser('Engineering', 'MID')
        const productEmployee = createValidUser('Product', 'MID')
        const manager = createValidUser()

        const evaluation1 = createValidManagerEvaluation(cycleId, engEmployee1.id, manager.id)
        const evaluation2 = createValidManagerEvaluation(cycleId, engEmployee2.id, manager.id)
        const evaluation3 = createValidManagerEvaluation(cycleId, productEmployee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([
          evaluation1,
          evaluation2,
          evaluation3,
        ])

        // First fetch for filtering, then fetch for evaluation details
        userRepository.findById
          .mockResolvedValueOnce(engEmployee1) // filtering
          .mockResolvedValueOnce(engEmployee2) // filtering
          .mockResolvedValueOnce(productEmployee) // filtering
          .mockResolvedValueOnce(engEmployee1) // evaluation details
          .mockResolvedValueOnce(manager) // evaluation details
          .mockResolvedValueOnce(engEmployee2) // evaluation details
          .mockResolvedValueOnce(manager) // evaluation details

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.totalEvaluations).toBe(2)
      })
    })

    describe('IMPORTANT: Should handle empty evaluations gracefully', () => {
      it('should return empty evaluations array when no evaluations exist', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations).toEqual([])
        expect(result.summary.totalEvaluations).toBe(0)
      })

      it('should return zero statistics when no evaluations exist', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.byBonusTier.EXCEEDS).toBe(0)
        expect(result.summary.byBonusTier.MEETS).toBe(0)
        expect(result.summary.byBonusTier.BELOW).toBe(0)
        expect(Object.keys(result.summary.byDepartment)).toHaveLength(0)
      })

      it('should return output structure even with no evaluations', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([])

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toHaveProperty('summary')
        expect(result).toHaveProperty('evaluations')
        expect(result.summary).toHaveProperty('totalEvaluations')
        expect(result.summary).toHaveProperty('byBonusTier')
        expect(result.summary).toHaveProperty('byDepartment')
      })
    })

    describe('EDGE: Should handle missing employee or manager data', () => {
      it('should use default values when employee is not found', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employeeId = UserId.generate()
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employeeId, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].employeeId).toBe('')
        expect(result.evaluations[0].employeeName).toBe('Unknown')
        expect(result.evaluations[0].level).toBe('Unknown')
        expect(result.evaluations[0].department).toBe('Unknown')
      })

      it('should use default values when manager is not found', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser()
        const managerId = UserId.generate()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, managerId)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(null)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].managerId).toBe('')
        expect(result.evaluations[0].managerName).toBe('Unknown')
      })

      it('should use default level when employee level is null', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = User.create({
          id: UserId.generate(),
          email: Email.create('user@example.com'),
          name: 'John Doe',
          keycloakId: 'keycloak-123',
          roles: [Role.user()],
          isActive: true,
          level: null,
          department: 'Engineering',
          managerId: UserId.generate().value,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValueOnce(employee).mockResolvedValueOnce(manager)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations[0].level).toBe('Unknown')
      })
    })

    describe('EDGE: Should handle large number of evaluations efficiently', () => {
      it('should efficiently handle large number of evaluations', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 100 }, () => createValidUser())
        const manager = createValidUser()
        const evaluations = employees.map((emp) =>
          createValidManagerEvaluation(cycleId, emp.id, manager.id),
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

        employees.forEach((emp) => {
          userRepository.findById.mockResolvedValueOnce(emp).mockResolvedValueOnce(manager)
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations).toHaveLength(100)
        expect(result.summary.totalEvaluations).toBe(100)
      })

      it('should process large evaluations in reasonable time with parallel execution', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 50 }, () => createValidUser())
        const manager = createValidUser()
        const evaluations = employees.map((emp) =>
          createValidManagerEvaluation(cycleId, emp.id, manager.id),
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

        employees.forEach((emp) => {
          userRepository.findById.mockResolvedValueOnce(emp).mockResolvedValueOnce(manager)
        })

        // Act
        const startTime = Date.now()
        await useCase.execute(input)
        const duration = Date.now() - startTime

        // Assert
        expect(duration).toBeLessThan(10000)
      })

      it('should maintain data consistency with large evaluations', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employees = Array.from({ length: 30 }, () => createValidUser('Engineering', 'MID'))
        const manager = createValidUser()
        const evaluations = employees.map((emp) =>
          createValidManagerEvaluation(cycleId, emp.id, manager.id),
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue(evaluations)

        // Create a map for efficient lookup
        const userMap = new Map()
        employees.forEach((emp) => {
          userMap.set(emp.id.value, emp)
        })
        userMap.set(manager.id.value, manager)

        userRepository.findById.mockImplementation(async (id) => {
          return userMap.get(id.value) || null
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.evaluations).toHaveLength(30)
        const resultEmployeeIds = result.evaluations.map((e) => e.employeeId)
        const inputEmployeeIds = employees.map((e) => e.id.value)
        expect(resultEmployeeIds.sort()).toEqual(inputEmployeeIds.sort())
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

      it('should throw error if manager evaluation repository fails', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const error = new Error('Manager evaluation repository error')
        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation repository error')
      })

      it('should throw error if user repository fails for any employee', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser()
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)
        const error = new Error('User repository error')

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('User repository error')
      })
    })

    describe('Integration scenarios', () => {
      it('should complete full workflow with mixed evaluations and departments', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const engEmployee1 = createValidUser('Engineering', 'MID', 'Alice')
        const engEmployee2 = createValidUser('Engineering', 'SENIOR', 'Bob')
        const productEmployee = createValidUser('Product', 'MID', 'Charlie')
        const manager1 = createValidUser('Engineering', 'LEAD', 'Manager One')
        const manager2 = createValidUser('Product', 'LEAD', 'Manager Two')

        const exceedsScores = {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        }

        const meetsScores = {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 3,
          operationalOwnership: 3,
          peopleImpact: 2,
        }

        const belowScores = {
          projectImpact: 1,
          direction: 1,
          engineeringExcellence: 2,
          operationalOwnership: 1,
          peopleImpact: 1,
        }

        const evaluation1 = createValidManagerEvaluation(
          cycleId,
          engEmployee1.id,
          manager1.id,
          exceedsScores,
          true,
        )
        const evaluation2 = createValidManagerEvaluation(
          cycleId,
          engEmployee2.id,
          manager1.id,
          meetsScores,
          false,
        )
        const evaluation3 = createValidManagerEvaluation(
          cycleId,
          productEmployee.id,
          manager2.id,
          belowScores,
          false,
        )

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([
          evaluation1,
          evaluation2,
          evaluation3,
        ])

        // Create a map for efficient lookup
        const userMap = new Map()
        userMap.set(engEmployee1.id.value, engEmployee1)
        userMap.set(engEmployee2.id.value, engEmployee2)
        userMap.set(productEmployee.id.value, productEmployee)
        userMap.set(manager1.id.value, manager1)
        userMap.set(manager2.id.value, manager2)

        userRepository.findById.mockImplementation(async (id) => {
          return userMap.get(id.value) || null
        })

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.summary.totalEvaluations).toBe(3)
        expect(result.summary.byBonusTier.EXCEEDS).toBe(1)
        expect(result.summary.byBonusTier.MEETS).toBe(1)
        expect(result.summary.byBonusTier.BELOW).toBe(1)

        expect(result.summary.byDepartment['Engineering']).toBeDefined()
        expect(result.summary.byDepartment['Product']).toBeDefined()

        expect(result.evaluations).toHaveLength(3)
        expect(result.evaluations[0].calibrationStatus).toBe('CALIBRATED')
        expect(result.evaluations[1].calibrationStatus).toBe('PENDING')
        expect(result.evaluations[2].calibrationStatus).toBe('PENDING')
      })

      it('should verify correct repository calls in sequence', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([])

        // Act
        await useCase.execute(input)

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId)
        expect(cycleRepository.findById).toHaveBeenCalledTimes(1)
        expect(managerEvaluationRepository.findByCycle).toHaveBeenCalledWith(input.cycleId)
        expect(managerEvaluationRepository.findByCycle).toHaveBeenCalledTimes(1)
      })

      it('should return consistent data across multiple executions', async () => {
        // Arrange
        const cycleId = createCycleId()
        const input = createValidInput(cycleId)
        const cycle = createValidReviewCycle(cycleId)

        const employee = createValidUser()
        const manager = createValidUser()
        const evaluation = createValidManagerEvaluation(cycleId, employee.id, manager.id)

        cycleRepository.findById.mockResolvedValue(cycle)
        managerEvaluationRepository.findByCycle.mockResolvedValue([evaluation])
        userRepository.findById.mockResolvedValue(employee).mockResolvedValue(manager)

        // Act
        const result1 = await useCase.execute(input)
        const result2 = await useCase.execute(input)

        // Assert
        expect(result1.summary.totalEvaluations).toBe(result2.summary.totalEvaluations)
        expect(result1.evaluations[0].employeeId).toBe(result2.evaluations[0].employeeId)
        expect(result1.evaluations[0].weightedScore).toBe(result2.evaluations[0].weightedScore)
      })
    })
  })
})
