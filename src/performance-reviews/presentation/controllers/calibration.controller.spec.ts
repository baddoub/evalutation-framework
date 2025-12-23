import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { CalibrationController } from './calibration.controller'
import { GetCalibrationDashboardUseCase } from '../../application/use-cases/calibration/get-calibration-dashboard.use-case'
import { CreateCalibrationSessionUseCase } from '../../application/use-cases/calibration/create-calibration-session.use-case'
import { ApplyCalibrationAdjustmentUseCase } from '../../application/use-cases/calibration/apply-calibration-adjustment.use-case'
import { LockFinalScoresUseCase } from '../../application/use-cases/calibration/lock-final-scores.use-case'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'

describe('CalibrationController', () => {
  let controller: CalibrationController
  let getCalibrationDashboardUseCase: jest.Mocked<GetCalibrationDashboardUseCase>
  let createCalibrationSessionUseCase: jest.Mocked<CreateCalibrationSessionUseCase>
  let applyCalibrationAdjustmentUseCase: jest.Mocked<ApplyCalibrationAdjustmentUseCase>
  let lockFinalScoresUseCase: jest.Mocked<LockFinalScoresUseCase>

  beforeEach(async () => {
    const mockGetDashboardUseCase = {
      execute: jest.fn(),
    }

    const mockCreateSessionUseCase = {
      execute: jest.fn(),
    }

    const mockApplyAdjustmentUseCase = {
      execute: jest.fn(),
    }

    const mockLockScoresUseCase = {
      execute: jest.fn(),
    }

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
    const mockReviewAuthGuard = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalibrationController],
      providers: [
        { provide: GetCalibrationDashboardUseCase, useValue: mockGetDashboardUseCase },
        { provide: CreateCalibrationSessionUseCase, useValue: mockCreateSessionUseCase },
        { provide: ApplyCalibrationAdjustmentUseCase, useValue: mockApplyAdjustmentUseCase },
        { provide: LockFinalScoresUseCase, useValue: mockLockScoresUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ReviewAuthorizationGuard)
      .useValue(mockReviewAuthGuard)
      .compile()

    controller = module.get<CalibrationController>(CalibrationController)
    getCalibrationDashboardUseCase = module.get(GetCalibrationDashboardUseCase)
    createCalibrationSessionUseCase = module.get(CreateCalibrationSessionUseCase)
    applyCalibrationAdjustmentUseCase = module.get(ApplyCalibrationAdjustmentUseCase)
    lockFinalScoresUseCase = module.get(LockFinalScoresUseCase)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getCalibrationDashboard', () => {
    it('should retrieve calibration dashboard successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        summary: {
          totalEvaluations: 50,
          byBonusTier: {
            EXCEEDS: 15,
            MEETS: 30,
            BELOW: 5,
          },
          byDepartment: {
            Engineering: {
              EXCEEDS: 10,
              MEETS: 18,
              BELOW: 2,
            },
            Product: {
              EXCEEDS: 3,
              MEETS: 6,
              BELOW: 1,
            },
            Design: {
              EXCEEDS: 2,
              MEETS: 6,
              BELOW: 2,
            },
          },
        },
        evaluations: [
          {
            employeeId: '550e8400-e29b-41d4-a716-446655440003',
            employeeName: 'John Doe',
            level: 'SENIOR',
            department: 'Engineering',
            managerId: '550e8400-e29b-41d4-a716-446655440002',
            managerName: 'Manager Smith',
            scores: {
              projectImpact: 4,
              direction: 3,
              engineeringExcellence: 4,
              operationalOwnership: 3,
              peopleImpact: 4,
            },
            weightedScore: 3.7,
            percentageScore: 92.5,
            bonusTier: 'EXCEEDS',
            calibrationStatus: 'PENDING',
          },
        ],
      }

      getCalibrationDashboardUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getCalibrationDashboard(cycleId)

      expect(getCalibrationDashboardUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        department: undefined,
      })
      expect(result.summary.totalEvaluations).toBe(50)
      expect(result.evaluations).toHaveLength(1)
    })

    it('should filter by department when provided', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const department = 'Engineering'

      const mockResult = {
        summary: {
          totalEvaluations: 30,
          byBonusTier: {
            EXCEEDS: 10,
            MEETS: 18,
            BELOW: 2,
          },
          byDepartment: {
            Engineering: {
              EXCEEDS: 10,
              MEETS: 18,
              BELOW: 2,
            },
          },
        },
        evaluations: [],
      }

      getCalibrationDashboardUseCase.execute.mockResolvedValue(mockResult)

      await controller.getCalibrationDashboard(cycleId, department)

      expect(getCalibrationDashboardUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        department: 'Engineering',
      })
    })

    it('should throw error when cycle not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655449999'

      getCalibrationDashboardUseCase.execute.mockRejectedValue(new Error('Review cycle not found'))

      await expect(controller.getCalibrationDashboard(cycleId)).rejects.toThrow(
        'Review cycle not found',
      )
    })
  })

  describe('createCalibrationSession', () => {
    it('should create calibration session successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        name: 'Engineering Calibration',
        department: 'Engineering',
        facilitatorId: '550e8400-e29b-41d4-a716-446655440010',
        participantIds: [
          '550e8400-e29b-41d4-a716-446655440011',
          '550e8400-e29b-41d4-a716-446655440012',
          '550e8400-e29b-41d4-a716-446655440013',
        ],
        scheduledAt: '2025-04-10T14:00:00Z',
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440020',
        name: 'Engineering Calibration',
        status: 'SCHEDULED',
        scheduledAt: new Date('2025-04-10T14:00:00Z'),
        participantCount: 3,
      }

      createCalibrationSessionUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.createCalibrationSession(cycleId, dto)

      expect(createCalibrationSessionUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        name: dto.name,
        department: dto.department,
        facilitatorId: expect.any(Object),
        participantIds: expect.arrayContaining([expect.any(Object)]),
        scheduledAt: new Date(dto.scheduledAt),
      })
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440020')
      expect(result.participantCount).toBe(3)
    })

    it('should throw error when validation fails', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        name: '',
        department: 'Engineering',
        facilitatorId: '550e8400-e29b-41d4-a716-446655440010',
        participantIds: [],
        scheduledAt: '2025-04-10T14:00:00Z',
      }

      createCalibrationSessionUseCase.execute.mockRejectedValue(new Error('Invalid session data'))

      await expect(controller.createCalibrationSession(cycleId, dto)).rejects.toThrow(
        'Invalid session data',
      )
    })
  })

  describe('applyCalibrationAdjustment', () => {
    it('should apply calibration adjustment successfully', async () => {
      const sessionId = '550e8400-e29b-41d4-a716-446655440020'
      const dto = {
        evaluationId: '550e8400-e29b-41d4-a716-446655440030',
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        justification: 'Calibration committee agreed to adjust upward based on peer feedback',
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440030',
        adjustmentId: '550e8400-e29b-41d4-a716-446655440031',
        evaluationId: '550e8400-e29b-41d4-a716-446655440030',
        originalScores: {
          projectImpact: 3,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        oldWeightedScore: 3.2,
        newWeightedScore: 4.0,
        oldBonusTier: 'MEETS',
        newBonusTier: 'EXCEEDS',
        adjustedAt: new Date(),
      }

      applyCalibrationAdjustmentUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.applyCalibrationAdjustment(sessionId, dto)

      expect(applyCalibrationAdjustmentUseCase.execute).toHaveBeenCalledWith({
        sessionId,
        evaluationId: dto.evaluationId,
        adjustedScores: dto.adjustedScores,
        justification: dto.justification,
      })
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440031')
      expect(result.oldBonusTier).toBe('MEETS')
      expect(result.newBonusTier).toBe('EXCEEDS')
    })

    it('should throw error when session not found', async () => {
      const sessionId = '550e8400-e29b-41d4-a716-446655449999'
      const dto = {
        evaluationId: '550e8400-e29b-41d4-a716-446655440030',
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        justification: 'Test',
      }

      applyCalibrationAdjustmentUseCase.execute.mockRejectedValue(
        new Error('Calibration session not found'),
      )

      await expect(controller.applyCalibrationAdjustment(sessionId, dto)).rejects.toThrow(
        'Calibration session not found',
      )
    })

    it('should throw error when evaluation not found', async () => {
      const sessionId = '550e8400-e29b-41d4-a716-446655440020'
      const dto = {
        evaluationId: '550e8400-e29b-41d4-a716-446655449999',
        adjustedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        justification: 'Test',
      }

      applyCalibrationAdjustmentUseCase.execute.mockRejectedValue(new Error('Evaluation not found'))

      await expect(controller.applyCalibrationAdjustment(sessionId, dto)).rejects.toThrow(
        'Evaluation not found',
      )
    })

    it('should throw error when invalid scores provided', async () => {
      const sessionId = '550e8400-e29b-41d4-a716-446655440020'
      const dto = {
        evaluationId: '550e8400-e29b-41d4-a716-446655440030',
        adjustedScores: {
          projectImpact: 5,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        justification: 'Test',
      }

      applyCalibrationAdjustmentUseCase.execute.mockRejectedValue(
        new Error('Invalid pillar score: must be between 0 and 4'),
      )

      await expect(controller.applyCalibrationAdjustment(sessionId, dto)).rejects.toThrow(
        'Invalid pillar score: must be between 0 and 4',
      )
    })
  })

  describe('lockFinalScores', () => {
    it('should lock final scores successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        totalScoresLocked: 50,
        lockedAt: new Date('2025-04-20T12:00:00Z'),
      }

      lockFinalScoresUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.lockFinalScores(cycleId)

      expect(lockFinalScoresUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
      })
      expect(result.totalScoresLocked).toBe(50)
      expect(result.cycleId).toBe(cycleId)
    })

    it('should throw error when cycle not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655449999'

      lockFinalScoresUseCase.execute.mockRejectedValue(new Error('Review cycle not found'))

      await expect(controller.lockFinalScores(cycleId)).rejects.toThrow('Review cycle not found')
    })

    it('should throw error when scores already locked', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      lockFinalScoresUseCase.execute.mockRejectedValue(new Error('Final scores already locked'))

      await expect(controller.lockFinalScores(cycleId)).rejects.toThrow(
        'Final scores already locked',
      )
    })

    it('should throw error when calibration not complete', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      lockFinalScoresUseCase.execute.mockRejectedValue(
        new Error('Calibration must be complete before locking scores'),
      )

      await expect(controller.lockFinalScores(cycleId)).rejects.toThrow(
        'Calibration must be complete before locking scores',
      )
    })
  })
})
