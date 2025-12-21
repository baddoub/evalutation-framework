import { Test, TestingModule } from '@nestjs/testing'
import { GetCalibrationDashboardUseCase } from '../../../../../../src/performance-reviews/application/use-cases/calibration/get-calibration-dashboard.use-case'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { IManagerEvaluationRepository } from '../../../../../../src/performance-reviews/domain/repositories/manager-evaluation.repository.interface'
import { IUserRepository } from '../../../../../../src/auth/domain/repositories/user.repository.interface'
import { ScoreCalculationService } from '../../../../../../src/performance-reviews/domain/services/score-calculation.service'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('GetCalibrationDashboardUseCase', () => {
  let useCase: GetCalibrationDashboardUseCase
  let cycleRepo: jest.Mocked<IReviewCycleRepository>
  let managerEvalRepo: jest.Mocked<IManagerEvaluationRepository>
  let userRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCalibrationDashboardUseCase,
        { provide: 'IReviewCycleRepository', useValue: { findById: jest.fn(), findByYear: jest.fn(), findActive: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: 'IManagerEvaluationRepository', useValue: { findByCycle: jest.fn(), findByEmployeeAndCycle: jest.fn(), save: jest.fn(), findById: jest.fn(), delete: jest.fn() } },
        { provide: 'IUserRepository', useValue: { findById: jest.fn(), findByManagerId: jest.fn(), findByEmail: jest.fn(), findByKeycloakId: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        ScoreCalculationService,
      ],
    }).compile()

    useCase = module.get(GetCalibrationDashboardUseCase)
    cycleRepo = module.get('IReviewCycleRepository')
    managerEvalRepo = module.get('IManagerEvaluationRepository')
    userRepo = module.get('IUserRepository')
  })

  it('should return calibration dashboard successfully', async () => {
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

    cycleRepo.findById.mockResolvedValue(cycle)
    managerEvalRepo.findByCycle.mockResolvedValue([])
    const result = await useCase.execute({ cycleId })

    expect(result.summary).toBeDefined()
    expect(result.evaluations).toBeDefined()
  })

  it('should throw error if cycle not found', async () => {
    cycleRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute({ cycleId: ReviewCycleId.generate() })).rejects.toThrow(ReviewNotFoundException)
  })
})
