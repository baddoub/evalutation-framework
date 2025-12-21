import { Test, TestingModule } from '@nestjs/testing'
import { SelfReviewsController } from '../../../../../src/performance-reviews/presentation/controllers/self-reviews.controller'
import { GetMySelfReviewUseCase } from '../../../../../src/performance-reviews/application/use-cases/self-reviews/get-my-self-review.use-case'
import { UpdateSelfReviewUseCase } from '../../../../../src/performance-reviews/application/use-cases/self-reviews/update-self-review.use-case'
import { SubmitSelfReviewUseCase } from '../../../../../src/performance-reviews/application/use-cases/self-reviews/submit-self-review.use-case'
import { UpdateSelfReviewRequestDto, SelfReviewResponseDto } from '../../../../../src/performance-reviews/presentation/dto/self-review.dto'
import { CurrentUserData } from '../../../../../src/performance-reviews/presentation/decorators/current-user.decorator'

describe('SelfReviewsController', () => {
  let controller: SelfReviewsController
  let getMySelfReviewUseCase: jest.Mocked<GetMySelfReviewUseCase>
  let updateSelfReviewUseCase: jest.Mocked<UpdateSelfReviewUseCase>
  let submitSelfReviewUseCase: jest.Mocked<SubmitSelfReviewUseCase>

  const mockUser: CurrentUserData = {
    userId: 'user-123',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'USER',
    level: 'SENIOR',
    department: 'Engineering',
  }

  beforeEach(async () => {
    const mockGetUseCase = {
      execute: jest.fn(),
    }

    const mockUpdateUseCase = {
      execute: jest.fn(),
    }

    const mockSubmitUseCase = {
      execute: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SelfReviewsController],
      providers: [
        { provide: GetMySelfReviewUseCase, useValue: mockGetUseCase },
        { provide: UpdateSelfReviewUseCase, useValue: mockUpdateUseCase },
        { provide: SubmitSelfReviewUseCase, useValue: mockSubmitUseCase },
      ],
    }).compile()

    controller = module.get<SelfReviewsController>(SelfReviewsController)
    getMySelfReviewUseCase = module.get(GetMySelfReviewUseCase)
    updateSelfReviewUseCase = module.get(UpdateSelfReviewUseCase)
    submitSelfReviewUseCase = module.get(SubmitSelfReviewUseCase)
  })

  describe('getMySelfReview', () => {
    it('should retrieve the current user self-review for a cycle', async () => {
      // Arrange
      const cycleId = 'cycle-123'
      const mockResult = {
        id: 'review-123',
        cycleId: 'cycle-123',
        userId: 'user-123',
        scores: {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'This year I focused on improving system architecture...',
        status: 'DRAFT',
        submittedAt: null,
      }

      getMySelfReviewUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const result = await controller.getMySelfReview(cycleId, mockUser)

      // Assert
      expect(getMySelfReviewUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        userId: expect.any(Object),
      })
      expect(result.id).toBe('review-123')
      expect(result.projectImpact).toBe(3)
      expect(result.status).toBe('DRAFT')
      expect(result.submittedAt).toBeNull()
    })

    it('should throw an error when self-review not found', async () => {
      // Arrange
      const cycleId = 'cycle-123'
      getMySelfReviewUseCase.execute.mockRejectedValue(new Error('Self-review not found'))

      // Act & Assert
      await expect(controller.getMySelfReview(cycleId, mockUser)).rejects.toThrow(
        'Self-review not found',
      )
    })
  })

  describe('updateSelfReview', () => {
    it('should update self-review scores and narrative', async () => {
      // Arrange
      const cycleId = 'cycle-123'
      const dto: UpdateSelfReviewRequestDto = {
        projectImpact: 4,
        direction: 3,
        engineeringExcellence: 4,
        operationalOwnership: 3,
        peopleImpact: 3,
        narrative: 'Updated narrative with more details...',
      }

      const mockResult = {
        id: 'review-123',
        cycleId: 'cycle-123',
        userId: 'user-123',
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative with more details...',
        status: 'DRAFT',
        submittedAt: null,
      }

      updateSelfReviewUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const result = await controller.updateSelfReview(cycleId, dto, mockUser)

      // Assert
      expect(updateSelfReviewUseCase.execute).toHaveBeenCalled()
      expect(result.projectImpact).toBe(4)
      expect(result.direction).toBe(3)
      expect(result.narrative).toBe('Updated narrative with more details...')
    })

    it('should allow partial updates', async () => {
      // Arrange
      const cycleId = 'cycle-123'
      const dto: UpdateSelfReviewRequestDto = {
        projectImpact: 4,
      }

      const mockResult = {
        id: 'review-123',
        cycleId: 'cycle-123',
        userId: 'user-123',
        scores: {
          projectImpact: 4,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Original narrative...',
        status: 'DRAFT',
        submittedAt: null,
      }

      updateSelfReviewUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const result = await controller.updateSelfReview(cycleId, dto, mockUser)

      // Assert
      expect(result.projectImpact).toBe(4)
      expect(result.direction).toBe(2) // Unchanged
    })
  })

  describe('submitSelfReview', () => {
    it('should submit self-review successfully', async () => {
      // Arrange
      const cycleId = 'cycle-123'
      const mockResult = {
        id: 'review-123',
        cycleId: 'cycle-123',
        userId: 'user-123',
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Final narrative...',
        status: 'SUBMITTED',
        submittedAt: new Date('2025-02-15T10:30:00Z'),
      }

      submitSelfReviewUseCase.execute.mockResolvedValue(mockResult)

      // Act
      const result = await controller.submitSelfReview(cycleId, mockUser)

      // Assert
      expect(submitSelfReviewUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        userId: expect.any(Object),
      })
      expect(result.status).toBe('SUBMITTED')
      expect(result.submittedAt).toBe('2025-02-15T10:30:00.000Z')
    })

    it('should throw an error when deadline has passed', async () => {
      // Arrange
      const cycleId = 'cycle-123'
      submitSelfReviewUseCase.execute.mockRejectedValue(
        new Error('Self-review deadline has passed'),
      )

      // Act & Assert
      await expect(controller.submitSelfReview(cycleId, mockUser)).rejects.toThrow(
        'Self-review deadline has passed',
      )
    })

    it('should throw an error when narrative exceeds word limit', async () => {
      // Arrange
      const cycleId = 'cycle-123'
      submitSelfReviewUseCase.execute.mockRejectedValue(
        new Error('Narrative exceeds 1000 word limit'),
      )

      // Act & Assert
      await expect(controller.submitSelfReview(cycleId, mockUser)).rejects.toThrow(
        'Narrative exceeds 1000 word limit',
      )
    })
  })
})
