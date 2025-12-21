import { Test, TestingModule } from '@nestjs/testing'
import { MarkFeedbackDeliveredUseCase } from '../../../../../../src/performance-reviews/application/use-cases/final-scores/mark-feedback-delivered.use-case'
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

describe('MarkFeedbackDeliveredUseCase', () => {
  let useCase: MarkFeedbackDeliveredUseCase
  let finalScoreRepo: jest.Mocked<IFinalScoreRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>
  let userRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkFeedbackDeliveredUseCase,
        { provide: 'IFinalScoreRepository', useValue: { findByUserAndCycle: jest.fn(), save: jest.fn(), findById: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IReviewCycleRepository', useValue: { findById: jest.fn(), findByYear: jest.fn(), findActive: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: 'IUserRepository', useValue: { findById: jest.fn(), findByManagerId: jest.fn(), findByEmail: jest.fn(), findByKeycloakId: jest.fn(), save: jest.fn(), delete: jest.fn() } },
      ],
    }).compile()

    useCase = module.get(MarkFeedbackDeliveredUseCase)
    finalScoreRepo = module.get('IFinalScoreRepository')
    cycleRepo = module.get('IReviewCycleRepository')
    userRepo = module.get('IUserRepository')
  })

  it('should mark feedback as delivered successfully', async () => {
    const managerId = UserId.generate()
    const employeeId = UserId.generate()
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

    const employee = User.register({ email: Email.fromString('emp@test.com'), keycloakId: 'k1', name: 'Employee', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId })

    const finalScore = FinalScore.create({
      cycleId,
      userId: employeeId,
      pillarScores: PillarScores.create({ projectImpact: 3, direction: 3, engineeringExcellence: 4, operationalOwnership: 3, peopleImpact: 3 }),
      peerAverageScores: PillarScores.create({ projectImpact: 3, direction: 3, engineeringExcellence: 3, operationalOwnership: 3, peopleImpact: 3 }),
      peerFeedbackCount: 4,
      level: employee.level!,
    })

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findById.mockResolvedValue(employee)
    finalScoreRepo.findByUserAndCycle.mockResolvedValue(finalScore)
    finalScoreRepo.save.mockResolvedValue(finalScore)

    const result = await useCase.execute({ managerId, employeeId, cycleId })

    expect(result.feedbackDelivered).toBe(true)
    expect(result.feedbackDeliveredAt).toBeDefined()
    expect(finalScoreRepo.save).toHaveBeenCalled()
  })

  it('should throw error if not direct report', async () => {
    const managerId = UserId.generate()
    const employeeId = UserId.generate()
    const otherManagerId = UserId.generate()
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

    const employee = User.register({ email: Email.fromString('emp@test.com'), keycloakId: 'k1', name: 'Employee', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId: otherManagerId })

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findById.mockResolvedValue(employee)

    await expect(useCase.execute({ managerId, employeeId, cycleId })).rejects.toThrow('You can only mark feedback delivered for your direct reports')
  })

  it('should throw error if final score not found', async () => {
    const managerId = UserId.generate()
    const employeeId = UserId.generate()
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

    const employee = User.register({ email: Email.fromString('emp@test.com'), keycloakId: 'k1', name: 'Employee', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId })

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findById.mockResolvedValue(employee)
    finalScoreRepo.findByUserAndCycle.mockResolvedValue(null)

    await expect(useCase.execute({ managerId, employeeId, cycleId })).rejects.toThrow(ReviewNotFoundException)
  })
})
