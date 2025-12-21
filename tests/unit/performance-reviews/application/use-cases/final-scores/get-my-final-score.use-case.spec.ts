import { Test, TestingModule } from '@nestjs/testing'
import { GetMyFinalScoreUseCase } from '../../../../../../src/performance-reviews/application/use-cases/final-scores/get-my-final-score.use-case'
import { IFinalScoreRepository } from '../../../../../../src/performance-reviews/domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../../../src/auth/domain/repositories/user.repository.interface'
import { FinalScore } from '../../../../../../src/performance-reviews/domain/entities/final-score.entity'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { User } from '../../../../../../src/auth/domain/entities/user.entity'
import { Email } from '../../../../../../src/auth/domain/value-objects/email.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('GetMyFinalScoreUseCase', () => {
  let useCase: GetMyFinalScoreUseCase
  let finalScoreRepo: jest.Mocked<IFinalScoreRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>
  let userRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyFinalScoreUseCase,
        { provide: 'IFinalScoreRepository', useValue: { findByUserAndCycle: jest.fn(), save: jest.fn(), findById: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IReviewCycleRepository', useValue: { findById: jest.fn(), findByYear: jest.fn(), findActive: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: 'IUserRepository', useValue: { findById: jest.fn(), findByManagerId: jest.fn(), findByEmail: jest.fn(), findByKeycloakId: jest.fn(), save: jest.fn(), delete: jest.fn() } },
      ],
    }).compile()

    useCase = module.get(GetMyFinalScoreUseCase)
    finalScoreRepo = module.get('IFinalScoreRepository')
    cycleRepo = module.get('IReviewCycleRepository')
    userRepo = module.get('IUserRepository')
  })

  it('should return final score successfully', async () => {
    const userId = UserId.generate()
    const cycleId = ReviewCycleId.generate()

    const cycle = ReviewCycle.create({
      name: '2025 Annual Review',
      year: 2025,
      deadlines: CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      }),
      startDate: new Date('2025-02-01'),
    })

    const user = User.register({ email: Email.fromString('user@test.com'), keycloakId: 'k1', name: 'Test User', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId: UserId.generate() })

    const finalScore = FinalScore.create({
      cycleId,
      userId,
      pillarScores: PillarScores.create({ projectImpact: 3, direction: 3, engineeringExcellence: 4, operationalOwnership: 3, peopleImpact: 3 }),
      peerAverageScores: PillarScores.create({ projectImpact: 3, direction: 3, engineeringExcellence: 3, operationalOwnership: 3, peopleImpact: 3 }),
      peerFeedbackCount: 4,
      level: user.level!,
    })

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findById.mockResolvedValue(user)
    finalScoreRepo.findByUserAndCycle.mockResolvedValue(finalScore)

    const result = await useCase.execute({ userId, cycleId })

    expect(result.employee.name).toBe('Test User')
    expect(result.cycle.name).toBe('2025 Annual Review')
    expect(result.bonusTier).toBeDefined()
    expect(result.isLocked).toBe(false)
  })

  it('should throw error if cycle not found', async () => {
    cycleRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute({ userId: UserId.generate(), cycleId: ReviewCycleId.generate() })).rejects.toThrow(ReviewNotFoundException)
  })

  it('should throw error if final score not found', async () => {
    const userId = UserId.generate()
    const cycleId = ReviewCycleId.generate()

    const cycle = ReviewCycle.create({
      name: '2025 Annual Review',
      year: 2025,
      deadlines: CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-03-31'),
        calibration: new Date('2025-04-15'),
        feedbackDelivery: new Date('2025-04-30'),
      }),
      startDate: new Date('2025-02-01'),
    })

    const user = User.register({ email: Email.fromString('user@test.com'), keycloakId: 'k1', name: 'Test User', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId: UserId.generate() })

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findById.mockResolvedValue(user)
    finalScoreRepo.findByUserAndCycle.mockResolvedValue(null)

    await expect(useCase.execute({ userId, cycleId })).rejects.toThrow(ReviewNotFoundException)
  })
})
