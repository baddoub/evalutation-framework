import { Test, TestingModule } from '@nestjs/testing'
import { CreateCalibrationSessionUseCase } from '../../../../../../src/performance-reviews/application/use-cases/calibration/create-calibration-session.use-case'
import { ICalibrationSessionRepository } from '../../../../../../src/performance-reviews/domain/repositories/calibration-session.repository.interface'
import { IReviewCycleRepository } from '../../../../../../src/performance-reviews/domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../../../../src/performance-reviews/domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { CycleDeadlines } from '../../../../../../src/performance-reviews/domain/value-objects/cycle-deadlines.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('CreateCalibrationSessionUseCase', () => {
  let useCase: CreateCalibrationSessionUseCase
  let sessionRepo: jest.Mocked<ICalibrationSessionRepository>
  let cycleRepo: jest.Mocked<IReviewCycleRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCalibrationSessionUseCase,
        { provide: 'ICalibrationSessionRepository', useValue: { save: jest.fn(), findById: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IReviewCycleRepository', useValue: { findById: jest.fn(), findByYear: jest.fn(), findActive: jest.fn(), save: jest.fn(), delete: jest.fn() } },
      ],
    }).compile()

    useCase = module.get(CreateCalibrationSessionUseCase)
    sessionRepo = module.get('ICalibrationSessionRepository')
    cycleRepo = module.get('IReviewCycleRepository')
  })

  it('should create calibration session successfully', async () => {
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

    const session = {
      id: 'session-id',
      cycleId,
      name: 'Engineering Calibration',
      facilitatorId: UserId.generate(),
      participantIds: [UserId.generate(), UserId.generate()],
      scheduledAt: new Date('2025-04-10'),
      status: 'SCHEDULED' as const,
      department: 'Engineering',
      createdAt: new Date(),
    }

    cycleRepo.findById.mockResolvedValue(cycle)
    sessionRepo.save.mockResolvedValue(session)

    const result = await useCase.execute({
      cycleId,
      name: 'Engineering Calibration',
      facilitatorId: session.facilitatorId,
      participantIds: session.participantIds,
      scheduledAt: session.scheduledAt,
      department: 'Engineering',
    })

    expect(result.status).toBe('SCHEDULED')
    expect(sessionRepo.save).toHaveBeenCalled()
  })

  it('should throw error if cycle not found', async () => {
    cycleRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute({
      cycleId: ReviewCycleId.generate(),
      name: 'Test',
      facilitatorId: UserId.generate(),
      participantIds: [UserId.generate()],
      scheduledAt: new Date(),
      department: 'Engineering',
    })).rejects.toThrow(ReviewNotFoundException)
  })
})
