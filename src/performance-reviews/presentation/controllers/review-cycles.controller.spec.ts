import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { ReviewCyclesController } from './review-cycles.controller'
import { CreateReviewCycleUseCase } from '../../application/use-cases/review-cycles/create-review-cycle.use-case'
import { StartReviewCycleUseCase } from '../../application/use-cases/review-cycles/start-review-cycle.use-case'
import { GetActiveCycleUseCase } from '../../application/use-cases/review-cycles/get-active-cycle.use-case'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'

describe('ReviewCyclesController', () => {
  let controller: ReviewCyclesController
  let createReviewCycleUseCase: jest.Mocked<CreateReviewCycleUseCase>
  let startReviewCycleUseCase: jest.Mocked<StartReviewCycleUseCase>
  let getActiveCycleUseCase: jest.Mocked<GetActiveCycleUseCase>

  beforeEach(async () => {
    const mockCreateUseCase = {
      execute: jest.fn(),
    }

    const mockStartUseCase = {
      execute: jest.fn(),
    }

    const mockGetActiveUseCase = {
      execute: jest.fn(),
    }

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
    const mockReviewAuthGuard = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewCyclesController],
      providers: [
        { provide: CreateReviewCycleUseCase, useValue: mockCreateUseCase },
        { provide: StartReviewCycleUseCase, useValue: mockStartUseCase },
        { provide: GetActiveCycleUseCase, useValue: mockGetActiveUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ReviewAuthorizationGuard)
      .useValue(mockReviewAuthGuard)
      .compile()

    controller = module.get<ReviewCyclesController>(ReviewCyclesController)
    createReviewCycleUseCase = module.get(CreateReviewCycleUseCase)
    startReviewCycleUseCase = module.get(StartReviewCycleUseCase)
    getActiveCycleUseCase = module.get(GetActiveCycleUseCase)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('listReviewCycles', () => {
    it('should return paginated list of review cycles', async () => {
      const result = await controller.listReviewCycles()

      expect(result).toEqual({
        cycles: [],
        total: 0,
        limit: 20,
        offset: 0,
      })
    })

    it('should accept query parameters for filtering', async () => {
      const result = await controller.listReviewCycles(10, 20)

      expect(result).toEqual({
        cycles: [],
        total: 0,
        limit: 10,
        offset: 20,
      })
    })
  })

  describe('createReviewCycle', () => {
    it('should create a new review cycle successfully', async () => {
      const dto = {
        name: '2025 Annual Review',
        year: 2025,
        startDate: '2025-02-01T00:00:00Z',
        deadlines: {
          selfReview: '2025-02-28T23:59:59Z',
          peerFeedback: '2025-03-15T23:59:59Z',
          managerEval: '2025-03-31T23:59:59Z',
          calibration: '2025-04-15T23:59:59Z',
          feedbackDelivery: '2025-04-30T23:59:59Z',
        },
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '2025 Annual Review',
        year: 2025,
        status: 'DRAFT',
        deadlines: {
          selfReview: new Date('2025-02-28T23:59:59Z'),
          peerFeedback: new Date('2025-03-15T23:59:59Z'),
          managerEvaluation: new Date('2025-03-31T23:59:59Z'),
          calibration: new Date('2025-04-15T23:59:59Z'),
          feedbackDelivery: new Date('2025-04-30T23:59:59Z'),
        },
        startDate: new Date('2025-02-01T00:00:00Z'),
        createdAt: new Date('2025-01-01T00:00:00Z'),
      }

      createReviewCycleUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.createReviewCycle(dto)

      expect(createReviewCycleUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        year: dto.year,
        deadlines: {
          selfReview: new Date(dto.deadlines.selfReview),
          peerFeedback: new Date(dto.deadlines.peerFeedback),
          managerEvaluation: new Date(dto.deadlines.managerEval),
          calibration: new Date(dto.deadlines.calibration),
          feedbackDelivery: new Date(dto.deadlines.feedbackDelivery),
        },
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.name).toBe('2025 Annual Review')
      expect(result.status).toBe('DRAFT')
    })

    it('should throw an error when use case fails', async () => {
      const dto = {
        name: '2025 Annual Review',
        year: 2025,
        startDate: '2025-02-01T00:00:00Z',
        deadlines: {
          selfReview: '2025-02-28T23:59:59Z',
          peerFeedback: '2025-03-15T23:59:59Z',
          managerEval: '2025-03-31T23:59:59Z',
          calibration: '2025-04-15T23:59:59Z',
          feedbackDelivery: '2025-04-30T23:59:59Z',
        },
      }

      createReviewCycleUseCase.execute.mockRejectedValue(new Error('Invalid deadlines'))

      await expect(controller.createReviewCycle(dto)).rejects.toThrow('Invalid deadlines')
    })
  })

  describe('getActiveReviewCycle', () => {
    it('should retrieve the active review cycle', async () => {
      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '2025 Annual Review',
        year: 2025,
        status: 'ACTIVE',
        deadlines: {
          selfReview: new Date('2025-02-28T23:59:59Z'),
          peerFeedback: new Date('2025-03-15T23:59:59Z'),
          managerEvaluation: new Date('2025-03-31T23:59:59Z'),
          calibration: new Date('2025-04-15T23:59:59Z'),
          feedbackDelivery: new Date('2025-04-30T23:59:59Z'),
        },
        startDate: new Date('2025-02-01T00:00:00Z'),
      }

      getActiveCycleUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getActiveReviewCycle()

      expect(getActiveCycleUseCase.execute).toHaveBeenCalled()
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.name).toBe('2025 Annual Review')
      expect(result.status).toBe('ACTIVE')
      expect(result.startDate).toBe('2025-02-01T00:00:00.000Z')
    })

    it('should throw an error when no active cycle exists', async () => {
      getActiveCycleUseCase.execute.mockResolvedValue(null)

      await expect(controller.getActiveReviewCycle()).rejects.toThrow('No active review cycle')
    })
  })

  describe('startReviewCycle', () => {
    it('should start a review cycle successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const mockResult = {
        id: cycleId,
        status: 'ACTIVE',
        startedAt: new Date('2025-02-01T00:00:00Z'),
      }

      startReviewCycleUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.startReviewCycle(cycleId)

      expect(startReviewCycleUseCase.execute).toHaveBeenCalledWith({
        cycleId,
      })
      expect(result).toEqual({
        id: cycleId,
        status: 'ACTIVE',
        startedAt: '2025-02-01T00:00:00.000Z',
      })
    })

    it('should throw an error when cycle not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655449999'
      startReviewCycleUseCase.execute.mockRejectedValue(new Error('Review cycle not found'))

      await expect(controller.startReviewCycle(cycleId)).rejects.toThrow('Review cycle not found')
    })

    it('should throw an error when cycle is already started', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      startReviewCycleUseCase.execute.mockRejectedValue(new Error('Cycle is already active'))

      await expect(controller.startReviewCycle(cycleId)).rejects.toThrow('Cycle is already active')
    })
  })
})
