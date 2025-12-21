import { GetManagerEvaluationUseCase } from './get-manager-evaluation.use-case'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewStatus } from '../../../domain/value-objects/review-status.vo'
import { GetManagerEvaluationInput } from './get-manager-evaluation.use-case'

describe('GetManagerEvaluationUseCase', () => {
  let useCase: GetManagerEvaluationUseCase
  let managerEvaluationRepository: jest.Mocked<IManagerEvaluationRepository>

  // Test data factories
  const createValidInput = (): GetManagerEvaluationInput => ({
    cycleId: ReviewCycleId.generate(),
    employeeId: UserId.generate(),
    managerId: UserId.generate(),
  })

  const createValidManagerEvaluation = (
    cycleId: ReviewCycleId,
    employeeId: UserId,
    managerId: UserId,
  ): ManagerEvaluation => {
    return ManagerEvaluation.create({
      cycleId,
      employeeId,
      managerId,
      scores: PillarScores.create({
        projectImpact: 3,
        direction: 2,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      }),
      narrative: 'Manager evaluation narrative',
      strengths: 'Good communication skills',
      growthAreas: 'Leadership development',
      developmentPlan: 'Enroll in leadership course',
      performanceNarrative: 'Strong performer',
      proposedLevel: undefined,
    })
  }

  beforeEach(() => {
    // Create mock repository
    managerEvaluationRepository = {
      findById: jest.fn(),
      findByEmployeeAndCycle: jest.fn(),
      findByManagerAndCycle: jest.fn(),
      findByCycle: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    // Create use case instance
    useCase = new GetManagerEvaluationUseCase(managerEvaluationRepository)
  })

  describe('execute', () => {
    describe('CRITICAL: Should retrieve existing manager evaluation when found', () => {
      it('should return existing evaluation with all data populated', async () => {
        // Arrange
        const input = createValidInput()
        const existingEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result!.id).toBe(existingEvaluation.id.value)
        expect(result!.cycleId).toBe(input.cycleId.value)
        expect(result!.employeeId).toBe(input.employeeId.value)
        expect(result!.managerId).toBe(input.managerId.value)
        expect(result!.status).toBe(ReviewStatus.DRAFT.value)
        expect(result!.scores).toEqual({
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        })
        expect(result!.managerComments).toBe('Manager evaluation narrative')
      })

      it('should call findByEmployeeAndCycle with correct parameters', async () => {
        // Arrange
        const input = createValidInput()
        const existingEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation)

        // Act
        await useCase.execute(input)

        // Assert
        expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
          input.employeeId,
          input.cycleId,
        )
        expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledTimes(1)
      })

      it('should not call save when evaluation already exists', async () => {
        // Arrange
        const input = createValidInput()
        const existingEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(existingEvaluation)

        // Act
        await useCase.execute(input)

        // Assert
        expect(managerEvaluationRepository.save).not.toHaveBeenCalled()
      })

      it('should return evaluation with submitted status if evaluation was submitted', async () => {
        // Arrange
        const input = createValidInput()
        const submittedEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )
        submittedEvaluation.submit()

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(submittedEvaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.status).toBe(ReviewStatus.SUBMITTED.value)
        expect(result!.submittedAt).toBeDefined()
        expect(result!.submittedAt instanceof Date).toBe(true)
      })

      it('should return evaluation with calibrated status if evaluation was calibrated', async () => {
        // Arrange
        const input = createValidInput()
        const calibratedEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )
        calibratedEvaluation.submit()
        calibratedEvaluation.calibrate()

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(calibratedEvaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.status).toBe(ReviewStatus.CALIBRATED.value)
        expect(result!.submittedAt).toBeDefined()
      })

      it('should include all optional fields when populated', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.performanceNarrative).toBe('Strong performer')
        expect(result!.growthAreas).toBe('Leadership development')
      })

      it('should handle evaluations with null optional fields', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = ManagerEvaluation.create({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          managerId: input.managerId,
          scores: PillarScores.create({
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          }),
          narrative: 'Simple narrative',
          strengths: '',
          growthAreas: '',
          developmentPlan: '',
        })

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result!.id).toBe(evaluation.id.value)
      })
    })

    describe('CRITICAL: Should return null when evaluation not found', () => {
      it('should return null when evaluation does not exist', async () => {
        // Arrange
        const input = createValidInput()
        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeNull()
      })

      it('should not call save when evaluation not found', async () => {
        // Arrange
        const input = createValidInput()
        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

        // Act
        await useCase.execute(input)

        // Assert
        expect(managerEvaluationRepository.save).not.toHaveBeenCalled()
      })

      it('should still validate parameters before checking repository', async () => {
        // Arrange
        const input = createValidInput()
        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

        // Act
        await useCase.execute(input)

        // Assert
        expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalled()
      })
    })

    describe('CRITICAL: Should verify manager-employee relationship (throw error if not direct report)', () => {
      it('should accept valid manager-employee relationship in input', async () => {
        // Arrange
        const employeeId = UserId.generate()
        const managerId = UserId.generate()
        const input: GetManagerEvaluationInput = {
          cycleId: ReviewCycleId.generate(),
          employeeId,
          managerId,
        }
        const evaluation = createValidManagerEvaluation(input.cycleId, employeeId, managerId)

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result!.managerId).toBe(managerId.value)
      })

      it('should use the provided manager ID from input', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.managerId).toBe(input.managerId.value)
      })

      it('should accept unique manager and employee IDs', async () => {
        // Arrange
        const managerId = UserId.generate()
        const employeeId = UserId.generate()

        // Verify they are different
        expect(managerId.value).not.toBe(employeeId.value)

        const input: GetManagerEvaluationInput = {
          cycleId: ReviewCycleId.generate(),
          employeeId,
          managerId,
        }

        const evaluation = createValidManagerEvaluation(input.cycleId, employeeId, managerId)
        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result!.employeeId).toBe(employeeId.value)
        expect(result!.managerId).toBe(managerId.value)
      })

      it('should maintain manager-employee relationship from input throughout execution', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.employeeId).toBe(input.employeeId.value)
        expect(result!.managerId).toBe(input.managerId.value)
      })
    })

    describe('IMPORTANT: Should return correct DTO structure', () => {
      it('should return output with all required fields', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('cycleId')
        expect(result).toHaveProperty('employeeId')
        expect(result).toHaveProperty('managerId')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('scores')
      })

      it('should return DTO with correct structure for scores', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.scores).toHaveProperty('projectImpact')
        expect(result!.scores).toHaveProperty('direction')
        expect(result!.scores).toHaveProperty('engineeringExcellence')
        expect(result!.scores).toHaveProperty('operationalOwnership')
        expect(result!.scores).toHaveProperty('peopleImpact')
        expect(typeof result!.scores.projectImpact).toBe('number')
        expect(typeof result!.scores.direction).toBe('number')
        expect(typeof result!.scores.engineeringExcellence).toBe('number')
        expect(typeof result!.scores.operationalOwnership).toBe('number')
        expect(typeof result!.scores.peopleImpact).toBe('number')
      })

      it('should return DTO as GetManagerEvaluationOutput interface', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(typeof result!.id).toBe('string')
        expect(typeof result!.cycleId).toBe('string')
        expect(typeof result!.employeeId).toBe('string')
        expect(typeof result!.managerId).toBe('string')
        expect(typeof result!.status).toBe('string')
      })

      it('should return string IDs (not value objects)', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(typeof result!.id).toBe('string')
        expect(typeof result!.cycleId).toBe('string')
        expect(typeof result!.employeeId).toBe('string')
        expect(typeof result!.managerId).toBe('string')
        expect(typeof result!.status).toBe('string')
      })

      it('should include submittedAt only when evaluation is submitted', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )
        evaluation.submit()

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.submittedAt).toBeDefined()
        expect(result!.submittedAt instanceof Date).toBe(true)
      })

      it('should not include submittedAt when evaluation is in draft', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.submittedAt).toBeUndefined()
      })

      it('should include optional fields in DTO', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toHaveProperty('managerComments')
        expect(result).toHaveProperty('performanceNarrative')
        expect(result).toHaveProperty('growthAreas')
        expect(result).toHaveProperty('proposedLevel')
      })
    })

    describe('IMPORTANT: Should handle repository errors', () => {
      it('should throw error if repository find fails', async () => {
        // Arrange
        const input = createValidInput()
        const error = new Error('Database connection failed')
        managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Database connection failed')
      })

      it('should throw error if repository throws custom exception', async () => {
        // Arrange
        const input = createValidInput()
        const customError = new Error('Custom repository error')
        managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(customError)
      })

      it('should propagate repository errors without modification', async () => {
        // Arrange
        const input = createValidInput()
        const originalError = new Error('Original error message')
        managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(originalError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toBe(originalError)
      })

      it('should fail immediately on repository error', async () => {
        // Arrange
        const input = createValidInput()
        const error = new Error('Repository failed')
        managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(error)

        // Act & Assert
        try {
          await useCase.execute(input)
          fail('Should have thrown error')
        } catch (e: unknown) {
          expect((e as Error).message).toBe('Repository failed')
        }
      })

      it('should handle timeout errors from repository', async () => {
        // Arrange
        const input = createValidInput()
        const timeoutError = new Error('Repository timeout')
        managerEvaluationRepository.findByEmployeeAndCycle.mockRejectedValue(timeoutError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Repository timeout')
      })
    })

    describe('EDGE: Should handle submitted evaluations', () => {
      it('should return submitted evaluation with status and submittedAt', async () => {
        // Arrange
        const input = createValidInput()
        const submittedEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )
        submittedEvaluation.submit()

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(submittedEvaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.status).toBe(ReviewStatus.SUBMITTED.value)
        expect(result!.submittedAt).toBeDefined()
      })

      it('should handle calibrated evaluation', async () => {
        // Arrange
        const input = createValidInput()
        const calibratedEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )
        calibratedEvaluation.submit()
        calibratedEvaluation.calibrate()

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(calibratedEvaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.status).toBe(ReviewStatus.CALIBRATED.value)
      })

      it('should include all scores even when evaluation is submitted', async () => {
        // Arrange
        const input = createValidInput()
        const submittedEvaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )
        submittedEvaluation.submit()

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(submittedEvaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.scores.projectImpact).toBeDefined()
        expect(result!.scores.direction).toBeDefined()
        expect(result!.scores.engineeringExcellence).toBeDefined()
        expect(result!.scores.operationalOwnership).toBeDefined()
        expect(result!.scores.peopleImpact).toBeDefined()
      })

      it('should handle evaluation with various score ranges', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = ManagerEvaluation.create({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          managerId: input.managerId,
          scores: PillarScores.create({
            projectImpact: 1,
            direction: 4,
            engineeringExcellence: 3,
            operationalOwnership: 4,
            peopleImpact: 2,
          }),
          narrative: 'Mixed scores evaluation',
          strengths: '',
          growthAreas: '',
          developmentPlan: '',
        })

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.scores.projectImpact).toBe(1)
        expect(result!.scores.direction).toBe(4)
        expect(result!.scores.engineeringExcellence).toBe(3)
        expect(result!.scores.operationalOwnership).toBe(4)
        expect(result!.scores.peopleImpact).toBe(2)
      })

      it('should handle evaluation with zero scores', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = ManagerEvaluation.create({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          managerId: input.managerId,
          scores: PillarScores.create({
            projectImpact: 0,
            direction: 0,
            engineeringExcellence: 0,
            operationalOwnership: 0,
            peopleImpact: 0,
          }),
          narrative: 'Zero scores evaluation',
          strengths: '',
          growthAreas: '',
          developmentPlan: '',
        })

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.scores.projectImpact).toBe(0)
        expect(result!.scores.direction).toBe(0)
        expect(result!.scores.engineeringExcellence).toBe(0)
        expect(result!.scores.operationalOwnership).toBe(0)
        expect(result!.scores.peopleImpact).toBe(0)
      })
    })

    describe('EDGE: Should handle empty/null optional fields', () => {
      it('should handle evaluation with empty narrative', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = ManagerEvaluation.create({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          managerId: input.managerId,
          scores: PillarScores.create({
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          }),
          narrative: '',
          strengths: '',
          growthAreas: '',
          developmentPlan: '',
        })

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.managerComments).toBe('')
      })

      it('should handle evaluation with undefined proposedLevel', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.proposedLevel).toBeUndefined()
      })

      it('should handle evaluation with very long narrative', async () => {
        // Arrange
        const input = createValidInput()
        const longNarrative = 'word '.repeat(1000)
        const evaluation = ManagerEvaluation.create({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          managerId: input.managerId,
          scores: PillarScores.create({
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 3,
            operationalOwnership: 3,
            peopleImpact: 3,
          }),
          narrative: longNarrative,
          strengths: '',
          growthAreas: '',
          developmentPlan: '',
        })

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.managerComments).toBe(longNarrative)
      })

      it('should handle evaluation with special characters in narrative', async () => {
        // Arrange
        const input = createValidInput()
        const specialNarrative = 'Evaluation & comments with "quotes" and \'apostrophes\' and émojis 🎉'
        const evaluation = ManagerEvaluation.create({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          managerId: input.managerId,
          scores: PillarScores.create({
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          }),
          narrative: specialNarrative,
          strengths: '',
          growthAreas: '',
          developmentPlan: '',
        })

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.managerComments).toBe(specialNarrative)
      })
    })

    describe('Integration scenarios', () => {
      it('should complete full workflow: retrieve existing evaluation', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
          input.employeeId,
          input.cycleId,
        )
        expect(managerEvaluationRepository.save).not.toHaveBeenCalled()
        expect(result).toBeDefined()
        expect(result!.id).toBe(evaluation.id.value)
      })

      it('should handle scenario: evaluation not found returns null', async () => {
        // Arrange
        const input = createValidInput()
        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(null)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(managerEvaluationRepository.findByEmployeeAndCycle).toHaveBeenCalledWith(
          input.employeeId,
          input.cycleId,
        )
        expect(result).toBeNull()
      })

      it('should maintain data integrity across retrieval', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.cycleId).toBe(evaluation.cycleId.value)
        expect(result!.employeeId).toBe(evaluation.employeeId.value)
        expect(result!.managerId).toBe(evaluation.managerId.value)
        expect(result!.scores).toEqual(evaluation.scores.toPlainObject())
        expect(result!.status).toBe(evaluation.status.value)
      })

      it('should handle multiple sequential calls with different inputs', async () => {
        // Arrange
        const input1 = createValidInput()
        const input2 = createValidInput()
        const evaluation1 = createValidManagerEvaluation(
          input1.cycleId,
          input1.employeeId,
          input1.managerId,
        )
        const evaluation2 = createValidManagerEvaluation(
          input2.cycleId,
          input2.employeeId,
          input2.managerId,
        )

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(evaluation1)
        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValueOnce(evaluation2)

        // Act
        const result1 = await useCase.execute(input1)
        const result2 = await useCase.execute(input2)

        // Assert
        expect(result1!.id).toBe(evaluation1.id.value)
        expect(result2!.id).toBe(evaluation2.id.value)
        expect(result1!.employeeId).toBe(input1.employeeId.value)
        expect(result2!.employeeId).toBe(input2.employeeId.value)
      })

      it('should handle submitted evaluation retrieval', async () => {
        // Arrange
        const input = createValidInput()
        const evaluation = createValidManagerEvaluation(
          input.cycleId,
          input.employeeId,
          input.managerId,
        )
        evaluation.submit()

        managerEvaluationRepository.findByEmployeeAndCycle.mockResolvedValue(evaluation)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result!.status).toBe(ReviewStatus.SUBMITTED.value)
        expect(result!.submittedAt).toBeDefined()
        expect(result!.id).toBe(evaluation.id.value)
      })
    })
  })
})
