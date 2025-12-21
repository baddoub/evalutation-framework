import { Test, TestingModule } from '@nestjs/testing'
import { LockFinalScoresUseCase } from '../../../../../../src/performance-reviews/application/use-cases/calibration/lock-final-scores.use-case'
import { IFinalScoreRepository } from '../../../../../../src/performance-reviews/domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('LockFinalScoresUseCase', () => {
  let useCase: LockFinalScoresUseCase
  let finalScoreRepo: jest.Mocked<IFinalScoreRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockFinalScoresUseCase,
        { provide: 'IFinalScoreRepository', useValue: { findByCycle: jest.fn(), save: jest.fn(), findById: jest.fn(), findByUserAndCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IReviewCycleRepository', useValue: { findById: jest.fn(), findByYear: jest.fn(), findActive: jest.fn(), save: jest.fn(), delete: jest.fn() } },
      ],
    }).compile()

    useCase = module.get(LockFinalScoresUseCase)
    finalScoreRepo = module.get('IFinalScoreRepository')
    cycleRepo = module.get('IReviewCycleRepository')
  })

  it('should lock final scores successfully', async () => {
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
    finalScoreRepo.findByCycle.mockResolvedValue([])

    const result = await useCase.execute({ cycleId })

    expect(result.cycleId).toBe(cycleId.value)
    expect(result.totalScoresLocked).toBeDefined()
  })

  it('should throw error if cycle not found', async () => {
    cycleRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute({ cycleId: ReviewCycleId.generate() })).rejects.toThrow(ReviewNotFoundException)
  })
})
