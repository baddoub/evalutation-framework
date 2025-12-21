import { Test, TestingModule } from '@nestjs/testing'
import { ApplyCalibrationAdjustmentUseCase } from '../../../../../../src/performance-reviews/application/use-cases/calibration/apply-calibration-adjustment.use-case'
import { IManagerEvaluationRepository } from '../../../../../../src/performance-reviews/domain/repositories/manager-evaluation.repository.interface'
import { ICalibrationSessionRepository } from '../../../../../../src/performance-reviews/domain/repositories/calibration-session.repository.interface'
import { IFinalScoreRepository } from '../../../../../../src/performance-reviews/domain/repositories/final-score.repository.interface'
import { IUserRepository } from '../../../../../../src/auth/domain/repositories/user.repository.interface'
import { ScoreCalculationService } from '../../../../../../src/performance-reviews/domain/services/score-calculation.service'
import { ManagerEvaluation } from '../../../../../../src/performance-reviews/domain/entities/manager-evaluation.entity'
import { ReviewCycleId } from '../../../../../../src/performance-reviews/domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../../../src/auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../../../../src/performance-reviews/domain/value-objects/pillar-scores.vo'
import { User } from '../../../../../../src/auth/domain/entities/user.entity'
import { Email } from '../../../../../../src/auth/domain/value-objects/email.vo'
import { ReviewNotFoundException } from '../../../../../../src/performance-reviews/domain/exceptions/review-not-found.exception'

describe('ApplyCalibrationAdjustmentUseCase', () => {
  let useCase: ApplyCalibrationAdjustmentUseCase
  let managerEvalRepo: jest.Mocked<IManagerEvaluationRepository>
  let sessionRepo: jest.Mocked<ICalibrationSessionRepository>
  let finalScoreRepo: jest.Mocked<IFinalScoreRepository>
  let userRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplyCalibrationAdjustmentUseCase,
        { provide: 'IManagerEvaluationRepository', useValue: { findById: jest.fn(), save: jest.fn(), findByEmployeeAndCycle: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'ICalibrationSessionRepository', useValue: { findById: jest.fn(), save: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IFinalScoreRepository', useValue: { findByUserAndCycle: jest.fn(), save: jest.fn(), findById: jest.fn(), findByCycle: jest.fn(), delete: jest.fn() } },
        { provide: 'IUserRepository', useValue: { findById: jest.fn(), findByManagerId: jest.fn(), findByEmail: jest.fn(), findByKeycloakId: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        ScoreCalculationService,
      ],
    }).compile()

    useCase = module.get(ApplyCalibrationAdjustmentUseCase)
    managerEvalRepo = module.get('IManagerEvaluationRepository')
    sessionRepo = module.get('ICalibrationSessionRepository')
    finalScoreRepo = module.get('IFinalScoreRepository')
    userRepo = module.get('IUserRepository')
  })

  it('should apply calibration adjustment successfully', async () => {
    const evaluation = ManagerEvaluation.create({
      cycleId: ReviewCycleId.generate(),
      employeeId: UserId.generate(),
      managerId: UserId.generate(),
      scores: PillarScores.create({ projectImpact: 3, direction: 3, engineeringExcellence: 3, operationalOwnership: 3, peopleImpact: 3 }),
      narrative: 'Test',
      strengths: 'Test',
      growthAreas: 'Test',
      developmentPlan: 'Test',
    })

    const employee = User.register({ email: Email.fromString('emp@test.com'), keycloakId: 'k1', name: 'Employee', level: 'Senior', department: 'Engineering', jobTitle: 'Engineer', managerId: UserId.generate() })
    const session = { id: 'session-id', cycleId: evaluation.cycleId, name: 'Session', facilitatorId: UserId.generate(), participantIds: [], scheduledAt: new Date(), status: 'SCHEDULED' as const, department: 'Engineering', createdAt: new Date() }

    managerEvalRepo.findById.mockResolvedValue(evaluation)
    sessionRepo.findById.mockResolvedValue(session)
    userRepo.findById.mockResolvedValue(employee)
    finalScoreRepo.findByUserAndCycle.mockResolvedValue(null)
    managerEvalRepo.save.mockResolvedValue(evaluation)

    const result = await useCase.execute({
      evaluationId: evaluation.id.value,
      sessionId: 'session-id',
      adjustedScores: { projectImpact: 4, direction: 4, engineeringExcellence: 4, operationalOwnership: 4, peopleImpact: 4 },
      justification: 'Adjusted based on peer comparison and performance data',
    })

    expect(result.newWeightedScore).toBeGreaterThan(result.oldWeightedScore)
    expect(managerEvalRepo.save).toHaveBeenCalled()
  })

  it('should throw error if justification too short', async () => {
    await expect(useCase.execute({
      evaluationId: 'eval-id',
      sessionId: 'session-id',
      adjustedScores: { projectImpact: 4, direction: 4, engineeringExcellence: 4, operationalOwnership: 4, peopleImpact: 4 },
      justification: 'Too short',
    })).rejects.toThrow('Justification must be at least 20 characters')
  })
})
