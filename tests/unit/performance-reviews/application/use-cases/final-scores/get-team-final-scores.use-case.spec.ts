import { Test, TestingModule } from '@nestjs/testing'
import { GetTeamFinalScoresUseCase } from '../../../../../../src/performance-reviews/application/use-cases/final-scores/get-team-final-scores.use-case'
import { IFinalScoreRepository } from '../../../../../../src/performance-reviews/domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../../../src/auth/domain/repositories/user.repository.interface'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { User } from '../../../../../../src/auth/domain/entities/user.entity'
import { Email } from '../../../../../../src/auth/domain/value-objects/email.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('GetTeamFinalScoresUseCase', () => {
  let useCase: GetTeamFinalScoresUseCase
  let finalScoreRepo: jest.Mocked<IFinalScoreRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>
  let userRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTeamFinalScoresUseCase,
        { provide: 'IFinalScoreRepository', useValue: { findByUserAndCycle: jest.fn(), save: jest.fn(), findById: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IReviewCycleRepository', useValue: { findById: jest.fn(), findByYear: jest.fn(), findActive: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: 'IUserRepository', useValue: { findById: jest.fn(), findByManagerId: jest.fn(), findByEmail: jest.fn(), findByKeycloakId: jest.fn(), save: jest.fn(), delete: jest.fn() } },
      ],
    }).compile()

    useCase = module.get(GetTeamFinalScoresUseCase)
    finalScoreRepo = module.get('IFinalScoreRepository')
    cycleRepo = module.get('IReviewCycleRepository')
    userRepo = module.get('IUserRepository')
  })

  it('should return team final scores successfully', async () => {
    const managerId = UserId.generate()
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

    const employees = [
      User.register({ email: Email.fromString('emp1@test.com'), keycloakId: 'k1', name: 'Employee 1', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId }),
      User.register({ email: Email.fromString('emp2@test.com'), keycloakId: 'k2', name: 'Employee 2', level: 'Mid', department: 'Engineering', jobTitle: 'Engineer', managerId }),
    ]

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findByManagerId.mockResolvedValue(employees)
    finalScoreRepo.findByUserAndCycle.mockResolvedValue(null)

    const result = await useCase.execute({ managerId, cycleId })

    expect(result.teamScores).toHaveLength(2)
    expect(result.teamScores[0].employeeName).toBe('Employee 1')
  })

  it('should throw error if cycle not found', async () => {
    cycleRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute({ managerId: UserId.generate(), cycleId: ReviewCycleId.generate() })).rejects.toThrow(ReviewNotFoundException)
  })
})
