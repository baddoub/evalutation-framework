import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { ScoreAdjustmentsController } from './score-adjustments.controller'
import { RequestScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/request-score-adjustment.use-case'
import { ReviewScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/review-score-adjustment.use-case'
import type { ReviewScoreAdjustmentDto } from '../dto/requests/review-score-adjustment.dto'
import { AdjustmentAction } from '../dto/requests/review-score-adjustment.dto'
import type { CurrentUserData } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'

describe('ScoreAdjustmentsController', () => {
  let controller: ScoreAdjustmentsController
  let requestScoreAdjustmentUseCase: jest.Mocked<RequestScoreAdjustmentUseCase>
  let reviewScoreAdjustmentUseCase: jest.Mocked<ReviewScoreAdjustmentUseCase>

  const mockManagerUser: CurrentUserData = {
    userId: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@example.com',
    name: 'Manager Smith',
    role: 'MANAGER',
    level: 'LEAD',
    department: 'Engineering',
  }

  const mockHRUser: CurrentUserData = {
    userId: '550e8400-e29b-41d4-a716-446655440003',
    email: 'hr@example.com',
    name: 'HR Admin',
    role: 'HR_ADMIN',
    level: 'MANAGER',
    department: 'HR',
  }

  beforeEach(async () => {
    const mockRequestUseCase = {
      execute: jest.fn(),
    }

    const mockReviewUseCase = {
      execute: jest.fn(),
    }

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
    const mockReviewAuthGuard = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoreAdjustmentsController],
      providers: [
        { provide: RequestScoreAdjustmentUseCase, useValue: mockRequestUseCase },
        { provide: ReviewScoreAdjustmentUseCase, useValue: mockReviewUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ReviewAuthorizationGuard)
      .useValue(mockReviewAuthGuard)
      .compile()

    controller = module.get<ScoreAdjustmentsController>(ScoreAdjustmentsController)
    requestScoreAdjustmentUseCase = module.get(RequestScoreAdjustmentUseCase)
    reviewScoreAdjustmentUseCase = module.get(ReviewScoreAdjustmentUseCase)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('requestScoreAdjustment', () => {
    it('should request score adjustment successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        reason: 'Employee had exceptional performance not reflected in initial scores',
        proposedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440050',
        employeeId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'PENDING',
        reason: dto.reason,
        requestedAt: new Date('2025-04-25T10:00:00Z'),
      }

      requestScoreAdjustmentUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.requestScoreAdjustment(
        cycleId,
        employeeId,
        dto,
        mockManagerUser,
      )

      expect(requestScoreAdjustmentUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        employeeId: expect.any(Object),
        managerId: expect.any(Object),
        reason: dto.reason,
        proposedScores: dto.proposedScores,
      })
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440050')
      expect(result.employeeId).toBe(employeeId)
      expect(result.status).toBe('PENDING')
    })

    it('should throw error when scores not locked yet', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        reason: 'Test reason',
        proposedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
      }

      requestScoreAdjustmentUseCase.execute.mockRejectedValue(
        new Error('Cannot request adjustment before scores are locked'),
      )

      await expect(
        controller.requestScoreAdjustment(cycleId, employeeId, dto, mockManagerUser),
      ).rejects.toThrow('Cannot request adjustment before scores are locked')
    })

    it('should throw error when employee not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655449999'
      const dto = {
        reason: 'Test reason',
        proposedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
      }

      requestScoreAdjustmentUseCase.execute.mockRejectedValue(new Error('Employee not found'))

      await expect(
        controller.requestScoreAdjustment(cycleId, employeeId, dto, mockManagerUser),
      ).rejects.toThrow('Employee not found')
    })

    it('should throw error when not employee manager', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        reason: 'Test reason',
        proposedScores: {
          projectImpact: 4,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
      }

      requestScoreAdjustmentUseCase.execute.mockRejectedValue(
        new Error('Not authorized to request adjustment for this employee'),
      )

      await expect(
        controller.requestScoreAdjustment(cycleId, employeeId, dto, mockManagerUser),
      ).rejects.toThrow('Not authorized to request adjustment for this employee')
    })

    it('should throw error when invalid scores provided', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        reason: 'Test reason',
        proposedScores: {
          projectImpact: 5,
          direction: 4,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
      }

      requestScoreAdjustmentUseCase.execute.mockRejectedValue(
        new Error('Invalid pillar score: must be between 0 and 4'),
      )

      await expect(
        controller.requestScoreAdjustment(cycleId, employeeId, dto, mockManagerUser),
      ).rejects.toThrow('Invalid pillar score: must be between 0 and 4')
    })
  })

  describe('getPendingAdjustmentRequests', () => {
    it('should return pending adjustment requests', async () => {
      const result = await controller.getPendingAdjustmentRequests()

      expect(result).toEqual({
        requests: [],
      })
    })
  })

  describe('reviewScoreAdjustment', () => {
    it('should approve score adjustment request successfully', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440050'
      const dto: ReviewScoreAdjustmentDto = {
        action: AdjustmentAction.APPROVED,
      }

      const mockResult = {
        id: requestId,
        status: 'APPROVED',
        reviewedAt: new Date('2025-04-26T15:00:00Z'),
        approvedBy: '550e8400-e29b-41d4-a716-446655440003',
      }

      reviewScoreAdjustmentUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.reviewScoreAdjustment(requestId, dto, mockHRUser)

      expect(reviewScoreAdjustmentUseCase.execute).toHaveBeenCalledWith({
        requestId,
        action: dto.action,
        approverId: expect.any(Object),
      })
      expect(result.id).toBe(requestId)
      expect(result.status).toBe('APPROVED')
      expect(result.approvedBy).toBe('550e8400-e29b-41d4-a716-446655440003')
    })

    it('should reject score adjustment request successfully', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440050'
      const dto: ReviewScoreAdjustmentDto = {
        action: AdjustmentAction.REJECTED,
        rejectionReason: 'Insufficient justification for adjustment',
      }

      const mockResult = {
        id: requestId,
        status: 'REJECTED',
        reviewedAt: new Date('2025-04-26T15:00:00Z'),
        approvedBy: '550e8400-e29b-41d4-a716-446655440003',
      }

      reviewScoreAdjustmentUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.reviewScoreAdjustment(requestId, dto, mockHRUser)

      expect(reviewScoreAdjustmentUseCase.execute).toHaveBeenCalledWith({
        requestId,
        action: dto.action,
        approverId: expect.any(Object),
        rejectionReason: dto.rejectionReason,
      })
      expect(result.id).toBe(requestId)
      expect(result.status).toBe('REJECTED')
    })

    it('should throw error when request not found', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655449999'
      const dto: ReviewScoreAdjustmentDto = {
        action: AdjustmentAction.APPROVED,
      }

      reviewScoreAdjustmentUseCase.execute.mockRejectedValue(
        new Error('Adjustment request not found'),
      )

      await expect(controller.reviewScoreAdjustment(requestId, dto, mockHRUser)).rejects.toThrow(
        'Adjustment request not found',
      )
    })

    it('should throw error when request already reviewed', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440050'
      const dto: ReviewScoreAdjustmentDto = {
        action: AdjustmentAction.APPROVED,
      }

      reviewScoreAdjustmentUseCase.execute.mockRejectedValue(new Error('Request already reviewed'))

      await expect(controller.reviewScoreAdjustment(requestId, dto, mockHRUser)).rejects.toThrow(
        'Request already reviewed',
      )
    })

    it('should throw error when rejection reason missing for reject action', async () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440050'
      const dto: ReviewScoreAdjustmentDto = {
        action: AdjustmentAction.REJECTED,
        rejectionReason: 'Insufficient justification',
      }

      reviewScoreAdjustmentUseCase.execute.mockRejectedValue(
        new Error('Rejection reason is required when rejecting'),
      )

      await expect(controller.reviewScoreAdjustment(requestId, dto, mockHRUser)).rejects.toThrow(
        'Rejection reason is required when rejecting',
      )
    })
  })
})
