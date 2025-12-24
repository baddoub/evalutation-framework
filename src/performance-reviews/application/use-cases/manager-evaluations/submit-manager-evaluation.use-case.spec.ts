import { SubmitManagerEvaluationUseCase } from './submit-manager-evaluation.use-case'
import type { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import type { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ManagerEvaluationAlreadySubmittedException } from '../../../domain/exceptions/manager-evaluation-already-submitted.exception'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { User } from '../../../../auth/domain/entities/user.entity'
import type { ManagerEvaluationId } from '../../../domain/value-objects/manager-evaluation-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewStatus } from '../../../domain/value-objects/review-status.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'
import type { SubmitManagerEvaluationInput } from '../../dto/manager-evaluation.dto'

describe('SubmitManagerEvaluationUseCase', () => {
  let useCase: SubmitManagerEvaluationUseCase
  let mockManagerEvaluationRepository: jest.Mocked<IManagerEvaluationRepository>
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

    return ManagerEvaluation.create({
      id: overrides?.id,
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

    useCase = new SubmitManagerEvaluationUseCase(
      mockManagerEvaluationRepository,
      mockCycleRepository,
      mockUserRepository,
    )
  })

  describe('CRITICAL: successful submission', () => {
    it('should submit new manager evaluation successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe(ReviewStatus.SUBMITTED.value)
      expect(result.submittedAt).toBeInstanceOf(Date)
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalled()
    })

    it('should submit existing evaluation (update then submit)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      const existingEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        narrative: 'Updated performance narrative',
        strengths: 'Updated strengths',
        growthAreas: 'Updated growth areas',
        developmentPlan: 'Updated development plan',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation)

      const updatedEvaluation = createValidManagerEvaluation({
        id: existingEvaluation.id,
        cycleId,
        employeeId,
        managerId,
        scores: PillarScores.create({
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        }),
      })
      updatedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe(ReviewStatus.SUBMITTED.value)
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(existingEvaluation)
    })

    it('should return correct DTO with submitted status', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('employeeId')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('scores')
      expect(result).toHaveProperty('submittedAt')
      expect(typeof result.id).toBe('string')
      expect(typeof result.employeeId).toBe('string')
      expect(typeof result.status).toBe('string')
      expect(result.submittedAt).toBeInstanceOf(Date)
    })

    it('should set submittedAt timestamp', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const beforeSubmit = new Date()
      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)
      const afterSubmit = new Date()

      // Assert
      expect(result.submittedAt).toBeDefined()
      expect(result.submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime())
      expect(result.submittedAt.getTime()).toBeLessThanOrEqual(afterSubmit.getTime())
    })
  })

  describe('CRITICAL: validation - cycle exists', () => {
    it('should throw ReviewNotFoundException if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not proceed to validate employee if cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
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
  })

  describe('CRITICAL: validation - deadline has not passed', () => {
    it('should throw Error if manager evaluation deadline has passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation deadline has passed')
    })

    it('should check deadline using cycle.hasDeadlinePassed method with managerEvaluation parameter', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      const hasDeadlinePassedSpy = jest.spyOn(cycle, 'hasDeadlinePassed')
      hasDeadlinePassedSpy.mockReturnValue(true)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(hasDeadlinePassedSpy).toHaveBeenCalledWith('managerEvaluation')
    })

    it('should not proceed to validate employee if deadline has passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should allow submission when deadline has not passed', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

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

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
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

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
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
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).not.toHaveBeenCalled()
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

      // Employee's manager is differentManagerId, not managerId
      const employee = createValidEmployee({ id: employeeId, managerId: differentManagerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'You can only evaluate your direct reports',
      )
    })

    it('should verify manager-employee relationship with correct manager ID', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalled()
    })

    it('should allow submission when manager-employee relationship is valid', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe(ReviewStatus.SUBMITTED.value)
    })
  })

  describe('CRITICAL: validation - required fields', () => {
    it('should create PillarScores from input scores', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
        scores: PillarScores.create({
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        }),
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.scores.projectImpact).toBe(4)
      expect(result.scores.direction).toBe(4)
      expect(result.scores.engineeringExcellence).toBe(4)
      expect(result.scores.operationalOwnership).toBe(4)
      expect(result.scores.peopleImpact).toBe(3)
    })

    it('should include narrative in evaluation creation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })
      const narrativeText = 'Comprehensive performance narrative'

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: narrativeText,
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalled()
    })

    it('should include strengths and growthAreas in evaluation creation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Excellent problem solver',
        growthAreas: 'Leadership development',
        developmentPlan: 'Mentor junior engineers',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalled()
    })
  })

  describe('IMPORTANT: entity behavior', () => {
    it('should call submit() on entity', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      const submitCalled = jest.fn()
      jest.spyOn(savedEvaluation, 'submit').mockImplementation(submitCalled)
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      await useCase.execute(input)

      // Assert - The use case should submit the evaluation before saving
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalled()
    })

    it('should persist to repository', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should update scores when evaluation exists', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const existingEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative',
        strengths: 'Updated strengths',
        growthAreas: 'Updated growth areas',
        developmentPlan: 'Updated development plan',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation)

      const updatedEvaluation = createValidManagerEvaluation({
        id: existingEvaluation.id,
        cycleId,
        employeeId,
        managerId,
        scores: PillarScores.create({
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        }),
      })
      updatedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(existingEvaluation)
    })
  })

  describe('EDGE: already submitted evaluation', () => {
    it('should handle already submitted evaluation (entity should throw ManagerEvaluationAlreadySubmittedException)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      const review = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      // Submit the review first
      review.submit()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(review)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        ManagerEvaluationAlreadySubmittedException,
      )
    })

    it('should not save when review is already submitted', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      const review = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      review.submit()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(review)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockManagerEvaluationRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('EDGE: create or update based on existence', () => {
    it('should create new evaluation when not found', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
        employeeId,
        cycleId,
      )
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalled()
    })

    it('should update existing evaluation instead of creating new one', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const existingEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative',
        strengths: 'Updated strengths',
        growthAreas: 'Updated growth areas',
        developmentPlan: 'Updated development plan',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation)

      const updatedEvaluation = createValidManagerEvaluation({
        id: existingEvaluation.id,
        cycleId,
        employeeId,
        managerId,
      })
      updatedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledWith(existingEvaluation)
    })
  })

  describe('error precedence', () => {
    it('should validate cycle before checking employee', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(null)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should check deadline before verifying manager relationship', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(true)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Manager evaluation deadline has passed')
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should validate employee before creating evaluation', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).not.toHaveBeenCalled()
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full submission workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Strong overall performance',
        strengths: 'Good technical skills',
        growthAreas: 'Could improve communication',
        developmentPlan: 'Enroll in public speaking course',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

      const savedEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })
      savedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(savedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId)
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
        employeeId,
        cycleId,
      )
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledTimes(1)
      expect(result.status).toBe(ReviewStatus.SUBMITTED.value)
      expect(result.submittedAt).toBeDefined()
    })

    it('should handle full update and submit workflow', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const managerId = UserId.generate()
      const cycle = createValidReviewCycle()
      const employee = createValidEmployee({ id: employeeId, managerId: managerId.value })

      jest.spyOn(cycle, 'hasDeadlinePassed').mockReturnValue(false)

      const existingEvaluation = createValidManagerEvaluation({
        cycleId,
        employeeId,
        managerId,
      })

      const input: SubmitManagerEvaluationInput = {
        employeeId,
        managerId,
        cycleId,
        scores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        },
        narrative: 'Excellent performance overall',
        strengths: 'Outstanding technical skills',
        growthAreas: 'Continue improving communication',
        developmentPlan: 'Lead architecture review',
      }

      mockCycleRepository.findById.mockResolvedValue(cycle)
      mockUserRepository.findById.mockResolvedValue(employee)
      mockManagerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation)

      const updatedEvaluation = createValidManagerEvaluation({
        id: existingEvaluation.id,
        cycleId,
        employeeId,
        managerId,
        scores: PillarScores.create({
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 3,
        }),
      })
      updatedEvaluation.submit()
      mockManagerEvaluationRepository.save.mockResolvedValue(updatedEvaluation)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(employeeId)
      expect(mockManagerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
        employeeId,
        cycleId,
      )
      expect(mockManagerEvaluationRepository.save).toHaveBeenCalledTimes(1)
      expect(result.status).toBe(ReviewStatus.SUBMITTED.value)
      expect(result.scores.projectImpact).toBe(4)
    })
  })
})
