import { Test, TestingModule } from '@nestjs/testing'
import { ReviewCyclesController } from '../../../../../src/performance-reviews/presentation/controllers/review-cycles.controller'
import { CreateReviewCycleUseCase } from '../../../../../src/performance-reviews/application/use-cases/review-cycles/create-review-cycle.use-case'
import { ActivateReviewCycleUseCase } from '../../../../../src/performance-reviews/application/use-cases/review-cycles/activate-review-cycle.use-case'
import { GetReviewCycleUseCase } from '../../../../../src/performance-reviews/application/use-cases/review-cycles/get-review-cycle.use-case'
import { CreateReviewCycleRequestDto, ReviewCycleResponseDto } from '../../../../../src/performance-reviews/presentation/dto/review-cycle.dto'

describe('ReviewCyclesController', () => {
  let controller: ReviewCyclesController
  let createReviewCycleUseCase: jest.Mocked<CreateReviewCycleUseCase>
  let activateReviewCycleUseCase: jest.Mocked<ActivateReviewCycleUseCase>
  let getReviewCycleUseCase: jest.Mocked<GetReviewCycleUseCase>

  beforeEach(async () => {
    const mockCreateUseCase = {
      execute: jest.fn(),
    }

    const mockActivateUseCase = {
      execute: jest.fn(),
    }

    const mockGetUseCase = {
      execute: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewCyclesController],
      providers: [
        { provide: CreateReviewCycleUseCase, useValue: mockCreateUseCase },
        { provide: ActivateReviewCycleUseCase, useValue: mockActivateUseCase },
        { provide: GetReviewCycleUseCase, useValue: mockGetUseCase },
      ],
    }).compile()

    controller = module.get<ReviewCyclesController>(ReviewCyclesController)
    createReviewCycleUseCase = module.get(CreateReviewCycleUseCase)
    activateReviewCycleUseCase = module.get(ActivateReviewCycleUseCase)
    getReviewCycleUseCase = module.get(GetReviewCycleUseCase)
  })

  describe('createReviewCycle', () => {
    it('should create a new review cycle successfully', async () => {
      // Arrange
      const dto: CreateReviewCycleRequestDto = {
        name: '2025 Annual Review',
        year: 2025,
        selfReviewDeadline: '2025-02-28T23:59:59Z',
        peerFeedbackDeadline: '2025-03-15T23:59:59Z',
        managerEvalDeadline: '2025-03-31T23:59:59Z',
        calibrationDeadline: '2025-04-15T23:59:59Z',
        feedbackDeliveryDeadline: '2025-04-30T23:59:59Z',
      }

      const mockResult = {
        id: 'cycle-id-123',
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
        createdAt: new Date('2025-01-01T00:00:00Z'),
      }

      createReviewCycleUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const result = await controller.createReviewCycle(dto)

      // Assert
      expect(createReviewCycleUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        year: dto.year,
        deadlines: {
          selfReview: new Date(dto.selfReviewDeadline),
          peerFeedback: new Date(dto.peerFeedbackDeadline),
          managerEvaluation: new Date(dto.managerEvalDeadline),
          calibration: new Date(dto.calibrationDeadline),
          feedbackDelivery: new Date(dto.feedbackDeliveryDeadline),
        },
      })

      expect(result).toEqual({
        id: 'cycle-id-123',
        name: '2025 Annual Review',
        year: 2025,
        status: 'DRAFT',
        selfReviewDeadline: '2025-02-28T23:59:59.000Z',
        peerFeedbackDeadline: '2025-03-15T23:59:59.000Z',
        managerEvalDeadline: '2025-03-31T23:59:59.000Z',
        calibrationDeadline: '2025-04-15T23:59:59.000Z',
        feedbackDeliveryDeadline: '2025-04-30T23:59:59.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      })
    })

    it('should throw an error when use case fails', async () => {
      // Arrange
      const dto: CreateReviewCycleRequestDto = {
        name: '2025 Annual Review',
        year: 2025,
        selfReviewDeadline: '2025-02-28T23:59:59Z',
        peerFeedbackDeadline: '2025-03-15T23:59:59Z',
        managerEvalDeadline: '2025-03-31T23:59:59Z',
        calibrationDeadline: '2025-04-15T23:59:59Z',
        feedbackDeliveryDeadline: '2025-04-30T23:59:59Z',
      }

      createReviewCycleUseCase.execute.mockRejectedValue(new Error('Invalid deadlines'))

      // Act & Assert
      await expect(controller.createReviewCycle(dto)).rejects.toThrow('Invalid deadlines')
    })
  })

  describe('getReviewCycle', () => {
    it('should retrieve a review cycle by ID', async () => {
      // Arrange
      const cycleId = 'cycle-id-123'
      const mockResult = {
        id: cycleId,
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

      getReviewCycleUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const result = await controller.getReviewCycle(cycleId)

      // Assert
      expect(getReviewCycleUseCase.execute).toHaveBeenCalledWith(cycleId)
      expect(result.id).toBe(cycleId)
      expect(result.name).toBe('2025 Annual Review')
      expect(result.status).toBe('ACTIVE')
    })

    it('should throw an error when cycle not found', async () => {
      // Arrange
      const cycleId = 'non-existent-id'
      getReviewCycleUseCase.execute.mockRejectedValue(new Error('Review cycle not found'))

      // Act & Assert
      await expect(controller.getReviewCycle(cycleId)).rejects.toThrow('Review cycle not found')
    })
  })

  describe('activateReviewCycle', () => {
    it('should activate a review cycle successfully', async () => {
      // Arrange
      const cycleId = 'cycle-id-123'
      const mockActivateResult = {
        status: 'ACTIVE',
        activatedAt: new Date('2025-02-01T00:00:00Z'),
      }

      const mockGetResult = {
        id: cycleId,
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

      activateReviewCycleUseCase.execute.mockResolvedValue(mockActivateResult)
      getReviewCycleUseCase.execute.mockResolvedValue(mockGetResult)

      // Act
      const result = await controller.activateReviewCycle(cycleId)

      // Assert
      expect(activateReviewCycleUseCase.execute).toHaveBeenCalledWith(cycleId)
      expect(getReviewCycleUseCase.execute).toHaveBeenCalledWith(cycleId)
      expect(result.status).toBe('ACTIVE')
      expect(result.updatedAt).toBe('2025-02-01T00:00:00.000Z')
    })

    it('should throw an error when activating an already active cycle', async () => {
      // Arrange
      const cycleId = 'cycle-id-123'
      activateReviewCycleUseCase.execute.mockRejectedValue(
        new Error('Cycle is already active'),
      )

      // Act & Assert
      await expect(controller.activateReviewCycle(cycleId)).rejects.toThrow(
        'Cycle is already active',
      )
    })
  })
})
