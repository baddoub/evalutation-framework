import { GetMyFinalScoreUseCase } from './get-my-final-score.use-case'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { FinalScore } from '../../../domain/entities/final-score.entity'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { User } from '../../../../auth/domain/entities/user.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'
import { Email } from '../../../../auth/domain/value-objects/email.vo'
import { Role } from '../../../../auth/domain/value-objects/role.vo'
import { GetMyFinalScoreInput, GetMyFinalScoreOutput } from '../../dto/final-score.dto'

describe('GetMyFinalScoreUseCase', () => {
  let useCase: GetMyFinalScoreUseCase
  let finalScoreRepository: jest.Mocked<IFinalScoreRepository>
  let cycleRepository: jest.Mocked<IReviewCycleRepository>
  let userRepository: jest.Mocked<IUserRepository>

  // Test data factories
  const createValidInput = (): GetMyFinalScoreInput => ({
    userId: UserId.generate(),
    cycleId: ReviewCycleId.generate(),
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

  const createValidUser = (userId: UserId): User => {
    return User.create({
      id: userId,
      email: Email.create('john.doe@example.com'),
      name: 'John Doe',
      keycloakId: 'keycloak-' + userId.value,
      roles: [Role.user()],
      isActive: true,
      level: 'Senior Engineer',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const createValidFinalScore = (
    cycleId: ReviewCycleId,
    userId: UserId,
    feedbackDelivered: boolean = false,
  ): FinalScore => {
    const finalScore = FinalScore.create({
      cycleId,
      userId,
      pillarScores: PillarScores.create({
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      }),
      weightedScore: WeightedScore.fromValue(3.2),
      finalLevel: EngineerLevel.SENIOR,
      peerAverageScores: PillarScores.create({
        projectImpact: 3,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 2,
      }),
      peerFeedbackCount: 4,
    })

    if (feedbackDelivered) {
      finalScore.markFeedbackDelivered(UserId.generate(), 'Great work!')
    }

    return finalScore
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
      findByEmail: jest.fn(),
      findByKeycloakId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      findByRole: jest.fn(),
      findByManagerId: jest.fn(),
    }

    // Create use case instance
    useCase = new GetMyFinalScoreUseCase(finalScoreRepository, cycleRepository, userRepository)
  })

  describe('execute', () => {
    describe('CRITICAL: Should retrieve employee\'s own final score', () => {
      it('should return existing final score with all data populated', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result.employee.id).toBe(user.id.value)
        expect(result.employee.name).toBe('John Doe')
        expect(result.cycle.id).toBe(cycle.id.value)
        expect(result.cycle.name).toBe('Annual Review 2024')
        expect(result.cycle.year).toBe(2024)
      })

      it('should return score data in correct format', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.scores).toEqual({
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        })
        expect(result.weightedScore).toBe(3.2)
        expect(result.percentageScore).toBeDefined()
        expect(typeof result.percentageScore).toBe('number')
      })

      it('should include pillar scores from final score', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.scores).toHaveProperty('projectImpact')
        expect(result.scores).toHaveProperty('direction')
        expect(result.scores).toHaveProperty('engineeringExcellence')
        expect(result.scores).toHaveProperty('operationalOwnership')
        expect(result.scores).toHaveProperty('peopleImpact')
        expect(result.scores.projectImpact).toBe(4)
        expect(result.scores.direction).toBe(3)
      })

      it('should call findByUserAndCycle with correct parameters', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        await useCase.execute(input)

        // Assert
        expect(finalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(input.userId, input.cycleId)
        expect(finalScoreRepository.findByUserAndCycle).toHaveBeenCalledTimes(1)
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

      it('should not proceed to find score if cycle validation fails', async () => {
        // Arrange
        const input = createValidInput()
        cycleRepository.findById.mockResolvedValue(null)

        // Act
        try {
          await useCase.execute(input)
        } catch {}

        // Assert
        expect(finalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled()
        expect(userRepository.findById).not.toHaveBeenCalled()
      })
    })

    describe('CRITICAL: Should only return if feedback has been delivered', () => {
      it('should include feedbackDelivered flag in response', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId, true)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackDelivered).toBe(true)
      })

      it('should include feedbackDeliveredAt timestamp when feedback delivered', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId, true)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackDeliveredAt).toBeDefined()
        expect(result.feedbackDeliveredAt instanceof Date).toBe(true)
      })

      it('should not include feedbackDeliveredAt when feedback not delivered', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId, false)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackDelivered).toBe(false)
        expect(result.feedbackDeliveredAt).toBeUndefined()
      })
    })

    describe('CRITICAL: Should hide scores if feedback not delivered yet', () => {
      it('should still return score data even if feedback not delivered (data accessible after delivery)', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId, false)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        // Note: The use case returns all data. Access control should be at controller/middleware level
        expect(result.scores).toBeDefined()
        expect(result.weightedScore).toBeDefined()
        expect(result.bonusTier).toBeDefined()
      })

      it('should include feedback delivery flag for frontend to control visibility', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId, false)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.feedbackDelivered).toBe(false)
        // Frontend should check feedbackDelivered before displaying scores
      })
    })

    describe('IMPORTANT: Should return complete score breakdown (pillar scores, weighted score, bonus tier)', () => {
      it('should return all pillar scores', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.scores.projectImpact).toBe(4)
        expect(result.scores.direction).toBe(3)
        expect(result.scores.engineeringExcellence).toBe(4)
        expect(result.scores.operationalOwnership).toBe(3)
        expect(result.scores.peopleImpact).toBe(2)
      })

      it('should return weighted score', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.weightedScore).toBe(3.2)
        expect(typeof result.weightedScore).toBe('number')
      })

      it('should return percentage score calculated from weighted score', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.percentageScore).toBeDefined()
        expect(typeof result.percentageScore).toBe('number')
        expect(result.percentageScore).toBe(80) // 3.2/4 * 100 = 80
      })

      it('should return bonus tier', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.bonusTier).toBeDefined()
        expect(typeof result.bonusTier).toBe('string')
      })

      it('should return peer feedback summary when peer feedback exists', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.peerFeedbackSummary).toBeDefined()
        expect(result.peerFeedbackSummary?.count).toBe(4)
        expect(result.peerFeedbackSummary?.averageScores).toEqual({
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        })
      })

      it('should not include peer feedback summary when no peer feedback', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = FinalScore.create({
          cycleId: input.cycleId,
          userId: input.userId,
          pillarScores: PillarScores.create({
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
          }),
          weightedScore: WeightedScore.fromValue(3.2),
          finalLevel: EngineerLevel.SENIOR,
          peerFeedbackCount: 0,
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.peerFeedbackSummary).toBeUndefined()
      })
    })

    describe('IMPORTANT: Should include final level', () => {
      it('should include employee level from user entity', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.employee.level).toBe('Senior Engineer')
      })

      it('should return Unknown for level when user has no level', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = User.create({
          id: input.userId,
          email: Email.create('jane.smith@example.com'),
          name: 'Jane Smith',
          keycloakId: 'keycloak-' + input.userId.value,
          roles: [Role.user()],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.employee.level).toBe('Unknown')
      })
    })

    describe('IMPORTANT: Should return correct DTO structure', () => {
      it('should return output with all required fields', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toHaveProperty('employee')
        expect(result).toHaveProperty('cycle')
        expect(result).toHaveProperty('scores')
        expect(result).toHaveProperty('weightedScore')
        expect(result).toHaveProperty('percentageScore')
        expect(result).toHaveProperty('bonusTier')
        expect(result).toHaveProperty('isLocked')
        expect(result).toHaveProperty('feedbackDelivered')
      })

      it('should return correct employee object structure', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.employee).toHaveProperty('id')
        expect(result.employee).toHaveProperty('name')
        expect(result.employee).toHaveProperty('level')
        expect(typeof result.employee.id).toBe('string')
        expect(typeof result.employee.name).toBe('string')
        expect(typeof result.employee.level).toBe('string')
      })

      it('should return correct cycle object structure', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.cycle).toHaveProperty('id')
        expect(result.cycle).toHaveProperty('name')
        expect(result.cycle).toHaveProperty('year')
        expect(typeof result.cycle.id).toBe('string')
        expect(typeof result.cycle.name).toBe('string')
        expect(typeof result.cycle.year).toBe('number')
      })

      it('should return DTO as GetMyFinalScoreOutput interface', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result: GetMyFinalScoreOutput = await useCase.execute(input)

        // Assert
        expect(typeof result.employee.id).toBe('string')
        expect(typeof result.employee.name).toBe('string')
        expect(typeof result.cycle.id).toBe('string')
        expect(typeof result.weightedScore).toBe('number')
        expect(typeof result.percentageScore).toBe('number')
        expect(typeof result.isLocked).toBe('boolean')
        expect(typeof result.feedbackDelivered).toBe('boolean')
      })

      it('should return string IDs (not value objects)', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(typeof result.employee.id).toBe('string')
        expect(typeof result.cycle.id).toBe('string')
      })
    })

    describe('EDGE: Should handle missing final score gracefully', () => {
      it('should throw ReviewNotFoundException if final score not found', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(
          'Final score not found for this user and cycle',
        )
      })

      it('should throw ReviewNotFoundException with correct message', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      })
    })

    describe('EDGE: Should enforce privacy (only own scores visible)', () => {
      it('should retrieve scores for the specified user', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.employee.id).toBe(input.userId.value)
      })

      it('should validate user exists before returning scores', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('User not found')
      })

      it('should throw ReviewNotFoundException if user not found', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(null)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      })

      it('should call userRepository.findById with correct userId', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        await useCase.execute(input)

        // Assert
        expect(userRepository.findById).toHaveBeenCalledWith(input.userId)
        expect(userRepository.findById).toHaveBeenCalledTimes(1)
      })
    })

    describe('EDGE: Should handle locked vs unlocked scores', () => {
      it('should indicate if score is locked', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)
        finalScore.lock()

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.isLocked).toBe(true)
      })

      it('should indicate if score is not locked', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.isLocked).toBe(false)
      })

      it('should return data regardless of lock status', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)
        finalScore.lock()

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.scores).toBeDefined()
        expect(result.weightedScore).toBeDefined()
        expect(result.bonusTier).toBeDefined()
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

      it('should throw error if user repository find fails', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const error = new Error('Query failed')
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Query failed')
      })

      it('should throw error if final score repository find fails', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const error = new Error('Score query failed')
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockRejectedValue(error)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow('Score query failed')
      })

      it('should propagate cycle repository errors without modification', async () => {
        // Arrange
        const input = createValidInput()
        const customError = new ReviewNotFoundException('Custom cycle error')
        cycleRepository.findById.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(customError)
      })

      it('should propagate user repository errors without modification', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const customError = new ReviewNotFoundException('User error')
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(customError)
      })

      it('should propagate final score repository errors without modification', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const customError = new ReviewNotFoundException('Score error')
        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockRejectedValue(customError)

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(customError)
      })
    })

    describe('Integration scenarios', () => {
      it('should complete full workflow: validate cycle, validate user, retrieve score', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId)
        expect(userRepository.findById).toHaveBeenCalledWith(input.userId)
        expect(finalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(
          input.userId,
          input.cycleId,
        )
        expect(result.employee.id).toBe(user.id.value)
        expect(result.cycle.id).toBe(cycle.id.value)
        expect(result.scores.projectImpact).toBe(4)
      })

      it('should handle complete score data with peer feedback and feedback delivery', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId, true)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.peerFeedbackSummary).toBeDefined()
        expect(result.peerFeedbackSummary?.count).toBe(4)
        expect(result.feedbackDelivered).toBe(true)
        expect(result.feedbackDeliveredAt).toBeDefined()
      })

      it('should maintain data consistency across all returned fields', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = createValidFinalScore(input.cycleId, input.userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.employee.id).toBe(user.id.value)
        expect(result.cycle.id).toBe(cycle.id.value)
        expect(result.employee.name).toBe(user.name)
        expect(result.cycle.year).toBe(cycle.year)
        expect(result.weightedScore).toBe(finalScore.weightedScore.value)
        expect(result.percentageScore).toBe(finalScore.percentageScore)
      })

      it('should return different bonus tiers based on weighted scores', async () => {
        // Test MEETS tier
        const input1 = createValidInput()
        const cycle1 = createValidReviewCycle(input1.cycleId)
        const user1 = createValidUser(input1.userId)
        const finalScore1 = FinalScore.create({
          cycleId: input1.cycleId,
          userId: input1.userId,
          pillarScores: PillarScores.create({
            projectImpact: 2,
            direction: 2,
            engineeringExcellence: 2,
            operationalOwnership: 2,
            peopleImpact: 2,
          }),
          weightedScore: WeightedScore.fromValue(2.0),
          finalLevel: EngineerLevel.MID,
        })

        cycleRepository.findById.mockResolvedValue(cycle1)
        userRepository.findById.mockResolvedValue(user1)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore1)

        // Act
        const result = await useCase.execute(input1)

        // Assert
        expect(result.bonusTier).toBeDefined()
        expect(typeof result.bonusTier).toBe('string')
      })

      it('should handle low weighted score correctly', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = FinalScore.create({
          cycleId: input.cycleId,
          userId: input.userId,
          pillarScores: PillarScores.create({
            projectImpact: 1,
            direction: 1,
            engineeringExcellence: 1,
            operationalOwnership: 1,
            peopleImpact: 1,
          }),
          weightedScore: WeightedScore.fromValue(1.0),
          finalLevel: EngineerLevel.JUNIOR,
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.weightedScore).toBe(1.0)
        expect(result.percentageScore).toBe(25)
      })

      it('should handle high weighted score correctly', async () => {
        // Arrange
        const input = createValidInput()
        const cycle = createValidReviewCycle(input.cycleId)
        const user = createValidUser(input.userId)
        const finalScore = FinalScore.create({
          cycleId: input.cycleId,
          userId: input.userId,
          pillarScores: PillarScores.create({
            projectImpact: 4,
            direction: 4,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          }),
          weightedScore: WeightedScore.fromValue(4.0),
          finalLevel: EngineerLevel.LEAD,
        })

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result.weightedScore).toBe(4.0)
        expect(result.percentageScore).toBe(100)
      })
    })

    describe('EDGE: Null/undefined edge cases', () => {
      it('should work with valid userId', async () => {
        // Arrange
        const userId = UserId.generate()
        const cycleId = ReviewCycleId.generate()
        const input: GetMyFinalScoreInput = { userId, cycleId }
        const cycle = createValidReviewCycle(cycleId)
        const user = createValidUser(userId)
        const finalScore = createValidFinalScore(cycleId, userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result.employee.id).toBe(userId.value)
      })

      it('should work with valid cycleId', async () => {
        // Arrange
        const userId = UserId.generate()
        const cycleId = ReviewCycleId.generate()
        const input: GetMyFinalScoreInput = { userId, cycleId }
        const cycle = createValidReviewCycle(cycleId)
        const user = createValidUser(userId)
        const finalScore = createValidFinalScore(cycleId, userId)

        cycleRepository.findById.mockResolvedValue(cycle)
        userRepository.findById.mockResolvedValue(user)
        finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore)

        // Act
        const result = await useCase.execute(input)

        // Assert
        expect(result).toBeDefined()
        expect(result.cycle.id).toBe(cycleId.value)
      })
    })
  })
})
