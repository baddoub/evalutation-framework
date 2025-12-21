import { Test, TestingModule } from '@nestjs/testing'
import { SubmitManagerEvaluationUseCase } from '../../../../../../src/performance-reviews/application/use-cases/manager-evaluations/submit-manager-evaluation.use-case'
import { IManagerEvaluationRepository } from '../../../../../../src/performance-reviews/domain/repositories/manager-evaluation.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../../../src/auth/domain/repositories/user.repository.interface'
import { ManagerEvaluation } from '../../../../../../src/performance-reviews/domain/entities/manager-evaluation.entity'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { User } from '../../../../../../src/auth/domain/entities/user.entity'
import { Email } from '../../../../../../src/auth/domain/value-objects/email.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('SubmitManagerEvaluationUseCase', () => {
  let useCase: SubmitManagerEvaluationUseCase
  let managerEvalRepo: jest.Mocked<IManagerEvaluationRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>
  let userRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitManagerEvaluationUseCase,
        { provide: 'IManagerEvaluationRepository', useValue: { findByEmployeeAndCycle: jest.fn(), save: jest.fn(), findById: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IReviewCycleRepository', useValue: { findById: jest.fn(), findByYear: jest.fn(), findActive: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: 'IUserRepository', useValue: { findById: jest.fn(), findByManagerId: jest.fn(), findByEmail: jest.fn(), findByKeycloakId: jest.fn(), save: jest.fn(), delete: jest.fn() } },
      ],
    }).compile()

    useCase = module.get(SubmitManagerEvaluationUseCase)
    managerEvalRepo = module.get('IManagerEvaluationRepository')
    cycleRepo = module.get('IReviewCycleRepository')
    userRepo = module.get('IUserRepository')
  })

  it('should submit manager evaluation successfully', async () => {
    const managerId = UserId.generate()
    const employeeId = UserId.generate()
    const cycleId = ReviewCycleId.generate()

    const cycle = ReviewCycle.create({
      name: '2025 Annual Review',
      year: 2025,
      deadlines: CycleDeadlines.create({
        selfReview: new Date('2025-02-28'),
        peerFeedback: new Date('2025-03-15'),
        managerEvaluation: new Date('2025-12-31'),
        calibration: new Date('2026-01-15'),
        feedbackDelivery: new Date('2026-01-31'),
      }),
      startDate: new Date('2025-02-01'),
    })

    const employee = User.register({ email: Email.fromString('emp@test.com'), keycloakId: 'k1', name: 'Employee', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId })

    const evaluation = ManagerEvaluation.create({
      cycleId,
      employeeId,
      managerId,
      scores: expect.anything(),
      narrative: 'Test narrative',
      strengths: 'Strong skills',
      growthAreas: 'Leadership',
      developmentPlan: 'Training plan',
    })

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findById.mockResolvedValue(employee)
    managerEvalRepo.findByEmployeeAndCycle.mockResolvedValue(null)
    managerEvalRepo.save.mockResolvedValue(evaluation)

    const result = await useCase.execute({
      managerId,
      employeeId,
      cycleId,
      scores: { projectImpact: 3, direction: 3, engineeringExcellence: 4, operationalOwnership: 3, peopleImpact: 3 },
      narrative: 'Test narrative',
      strengths: 'Strong skills',
      growthAreas: 'Leadership',
      developmentPlan: 'Training plan',
    })

    expect(result.status).toBe('SUBMITTED')
    expect(managerEvalRepo.save).toHaveBeenCalled()
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
        managerEvaluation: new Date('2025-12-31'),
        calibration: new Date('2026-01-15'),
        feedbackDelivery: new Date('2026-01-31'),
      }),
      startDate: new Date('2025-02-01'),
    })

    const employee = User.register({ email: Email.fromString('emp@test.com'), keycloakId: 'k1', name: 'Employee', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId: otherManagerId })

    cycleRepo.findById.mockResolvedValue(cycle)
    userRepo.findById.mockResolvedValue(employee)

    await expect(useCase.execute({
      managerId,
      employeeId,
      cycleId,
      scores: { projectImpact: 3, direction: 3, engineeringExcellence: 4, operationalOwnership: 3, peopleImpact: 3 },
      narrative: 'Test',
      strengths: 'Test',
      growthAreas: 'Test',
      developmentPlan: 'Test',
    })).rejects.toThrow('You can only evaluate your direct reports')
  })
})
