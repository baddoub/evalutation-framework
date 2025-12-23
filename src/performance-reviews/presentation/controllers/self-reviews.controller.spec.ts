import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { SelfReviewsController } from './self-reviews.controller'
import { GetMySelfReviewUseCase } from '../../application/use-cases/self-reviews/get-my-self-review.use-case'
import { UpdateSelfReviewUseCase } from '../../application/use-cases/self-reviews/update-self-review.use-case'
import { SubmitSelfReviewUseCase } from '../../application/use-cases/self-reviews/submit-self-review.use-case'
import type { CurrentUserData } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'

describe('SelfReviewsController', () => {
  let controller: SelfReviewsController
  let getMySelfReviewUseCase: jest.Mocked<GetMySelfReviewUseCase>
  let updateSelfReviewUseCase: jest.Mocked<UpdateSelfReviewUseCase>
  let submitSelfReviewUseCase: jest.Mocked<SubmitSelfReviewUseCase>

  const mockUser: CurrentUserData = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
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

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
    const mockReviewAuthGuard = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SelfReviewsController],
      providers: [
        { provide: GetMySelfReviewUseCase, useValue: mockGetUseCase },
        { provide: UpdateSelfReviewUseCase, useValue: mockUpdateUseCase },
        { provide: SubmitSelfReviewUseCase, useValue: mockSubmitUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ReviewAuthorizationGuard)
      .useValue(mockReviewAuthGuard)
      .compile()

    controller = module.get<SelfReviewsController>(SelfReviewsController)
    getMySelfReviewUseCase = module.get(GetMySelfReviewUseCase)
    updateSelfReviewUseCase = module.get(UpdateSelfReviewUseCase)
    submitSelfReviewUseCase = module.get(SubmitSelfReviewUseCase)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getMySelfReview', () => {
    it('should retrieve the current user self-review for a cycle', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440100',
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        scores: {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'This year I focused on improving system architecture...',
        status: 'DRAFT',
        submittedAt: undefined,
        wordCount: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      getMySelfReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getMySelfReview(cycleId, mockUser)

      expect(getMySelfReviewUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        userId: expect.any(Object),
      })
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440100')
      expect(result.scores.projectImpact).toBe(3)
      expect(result.status).toBe('DRAFT')
      expect(result.submittedAt).toBeUndefined()
      expect(result.wordCount).toBe(8)
    })

    it('should calculate word count for narrative', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const narrative = 'This is a test narrative with ten words in total.'
      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440100',
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        scores: {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative,
        status: 'DRAFT',
        submittedAt: undefined,
        wordCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      getMySelfReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getMySelfReview(cycleId, mockUser)

      expect(result.wordCount).toBe(10)
    })

    it('should throw an error when self-review not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      getMySelfReviewUseCase.execute.mockRejectedValue(new Error('Self-review not found'))

      await expect(controller.getMySelfReview(cycleId, mockUser)).rejects.toThrow(
        'Self-review not found',
      )
    })
  })

  describe('updateMySelfReview', () => {
    it('should update self-review scores and narrative', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative with more details...',
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440100',
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative with more details...',
        status: 'DRAFT',
        submittedAt: undefined,
        wordCount: 6,
        updatedAt: new Date(),
      }

      updateSelfReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.updateMySelfReview(cycleId, mockUser, dto)

      expect(updateSelfReviewUseCase.execute).toHaveBeenCalled()
      expect(result.scores.projectImpact).toBe(4)
      expect(result.scores.direction).toBe(3)
      expect(result.narrative).toBe('Updated narrative with more details...')
    })

    it('should allow partial score updates', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        scores: {
          projectImpact: 4,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Original narrative...',
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440100',
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        scores: {
          projectImpact: 4,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'Original narrative...',
        status: 'DRAFT',
        submittedAt: undefined,
        wordCount: 2,
        updatedAt: new Date(),
      }

      updateSelfReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.updateMySelfReview(cycleId, mockUser, dto)

      expect(result.scores.projectImpact).toBe(4)
      expect(result.scores.direction).toBe(2)
    })

    it('should allow narrative-only updates', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        scores: {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'New narrative text',
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440100',
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        scores: {
          projectImpact: 3,
          direction: 2,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 2,
        },
        narrative: 'New narrative text',
        wordCount: 3,
        status: 'DRAFT',
        submittedAt: undefined,
        updatedAt: new Date(),
      }

      updateSelfReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.updateMySelfReview(cycleId, mockUser, dto)

      expect(result.narrative).toBe('New narrative text')
    })

    it('should throw error when deadline has passed', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        },
        narrative: 'Updated narrative',
      }

      updateSelfReviewUseCase.execute.mockRejectedValue(
        new Error('Self-review deadline has passed'),
      )

      await expect(controller.updateMySelfReview(cycleId, mockUser, dto)).rejects.toThrow(
        'Self-review deadline has passed',
      )
    })
  })

  describe('submitMySelfReview', () => {
    it('should submit self-review successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440100',
        status: 'SUBMITTED',
        submittedAt: new Date('2025-02-15T10:30:00Z'),
      }

      submitSelfReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.submitMySelfReview(cycleId, mockUser)

      expect(submitSelfReviewUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        userId: expect.any(Object),
      })
      expect(result.status).toBe('SUBMITTED')
      expect(result.submittedAt).toBe('2025-02-15T10:30:00.000Z')
    })

    it('should throw an error when deadline has passed', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      submitSelfReviewUseCase.execute.mockRejectedValue(
        new Error('Self-review deadline has passed'),
      )

      await expect(controller.submitMySelfReview(cycleId, mockUser)).rejects.toThrow(
        'Self-review deadline has passed',
      )
    })

    it('should throw an error when self-review is incomplete', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      submitSelfReviewUseCase.execute.mockRejectedValue(
        new Error('Cannot submit incomplete self-review'),
      )

      await expect(controller.submitMySelfReview(cycleId, mockUser)).rejects.toThrow(
        'Cannot submit incomplete self-review',
      )
    })

    it('should throw an error when narrative exceeds word limit', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      submitSelfReviewUseCase.execute.mockRejectedValue(
        new Error('Narrative exceeds 1000 word limit'),
      )

      await expect(controller.submitMySelfReview(cycleId, mockUser)).rejects.toThrow(
        'Narrative exceeds 1000 word limit',
      )
    })
  })
})
