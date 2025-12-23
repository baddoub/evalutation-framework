import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { ManagerEvaluationsController } from './manager-evaluations.controller'
import { GetTeamReviewsUseCase } from '../../application/use-cases/manager-evaluations/get-team-reviews.use-case'
import { GetEmployeeReviewUseCase } from '../../application/use-cases/manager-evaluations/get-employee-review.use-case'
import { SubmitManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/submit-manager-evaluation.use-case'
import type { CurrentUserData } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'

describe('ManagerEvaluationsController', () => {
  let controller: ManagerEvaluationsController
  let getTeamReviewsUseCase: jest.Mocked<GetTeamReviewsUseCase>
  let getEmployeeReviewUseCase: jest.Mocked<GetEmployeeReviewUseCase>
  let submitManagerEvaluationUseCase: jest.Mocked<SubmitManagerEvaluationUseCase>

  const mockManagerUser: CurrentUserData = {
    userId: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@example.com',
    name: 'Manager Smith',
    role: 'MANAGER',
    level: 'LEAD',
    department: 'Engineering',
  }

  beforeEach(async () => {
    const mockGetTeamUseCase = {
      execute: jest.fn(),
    }

    const mockGetEmployeeUseCase = {
      execute: jest.fn(),
    }

    const mockSubmitUseCase = {
      execute: jest.fn(),
    }

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
    const mockReviewAuthGuard = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagerEvaluationsController],
      providers: [
        { provide: GetTeamReviewsUseCase, useValue: mockGetTeamUseCase },
        { provide: GetEmployeeReviewUseCase, useValue: mockGetEmployeeUseCase },
        { provide: SubmitManagerEvaluationUseCase, useValue: mockSubmitUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ReviewAuthorizationGuard)
      .useValue(mockReviewAuthGuard)
      .compile()

    controller = module.get<ManagerEvaluationsController>(ManagerEvaluationsController)
    getTeamReviewsUseCase = module.get(GetTeamReviewsUseCase)
    getEmployeeReviewUseCase = module.get(GetEmployeeReviewUseCase)
    submitManagerEvaluationUseCase = module.get(SubmitManagerEvaluationUseCase)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getTeamReviews', () => {
    it('should retrieve team reviews successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        reviews: [
          {
            employeeId: '550e8400-e29b-41d4-a716-446655440003',
            employeeName: 'John Doe',
            employeeLevel: 'SENIOR',
            selfReviewStatus: 'SUBMITTED',
            peerFeedbackCount: 5,
            peerFeedbackStatus: 'COMPLETED',
            managerEvalStatus: 'PENDING',
            hasSubmittedEvaluation: false,
          },
          {
            employeeId: '550e8400-e29b-41d4-a716-446655440004',
            employeeName: 'Jane Smith',
            employeeLevel: 'MID',
            selfReviewStatus: 'DRAFT',
            peerFeedbackCount: 3,
            peerFeedbackStatus: 'IN_PROGRESS',
            managerEvalStatus: 'PENDING',
            hasSubmittedEvaluation: false,
          },
        ],
        total: 2,
      }

      getTeamReviewsUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getTeamReviews(cycleId, mockManagerUser)

      expect(getTeamReviewsUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        managerId: expect.any(Object),
      })
      expect(result.reviews).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.reviews[0].employeeName).toBe('John Doe')
    })

    it('should return empty list when no team members', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        reviews: [],
        total: 0,
      }

      getTeamReviewsUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getTeamReviews(cycleId, mockManagerUser)

      expect(result.reviews).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should throw error when cycle not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655449999'

      getTeamReviewsUseCase.execute.mockRejectedValue(new Error('Review cycle not found'))

      await expect(controller.getTeamReviews(cycleId, mockManagerUser)).rejects.toThrow(
        'Review cycle not found',
      )
    })
  })

  describe('getEmployeeReview', () => {
    it('should retrieve employee review details successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'

      const mockResult = {
        employee: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'John Doe',
          email: 'john.doe@example.com',
          level: 'SENIOR',
          department: 'Engineering',
        },
        selfReview: {
          scores: {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 4,
          },
          narrative: 'This year I focused on...',
          submittedAt: new Date('2025-02-20T10:00:00Z'),
        },
        peerFeedback: {
          count: 5,
          aggregatedScores: {
            projectImpact: 3.8,
            direction: 3.4,
            engineeringExcellence: 4.0,
            operationalOwnership: 3.6,
            peopleImpact: 3.8,
          },
          attributedFeedback: [
            {
              reviewerId: '550e8400-e29b-41d4-a716-446655440010',
              reviewerName: 'Peer 1',
              scores: {
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 4,
              },
              strengths: 'Great technical skills',
              growthAreas: 'Communication',
            },
          ],
        },
      }

      getEmployeeReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getEmployeeReview(cycleId, employeeId, mockManagerUser)

      expect(getEmployeeReviewUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        employeeId: expect.any(Object),
        managerId: expect.any(Object),
      })
      expect(result.employee.name).toBe('John Doe')
      expect(result.selfReview).toBeDefined()
      if (result.selfReview) {
        expect(result.selfReview.scores.projectImpact).toBe(4)
      }
      expect(result.peerFeedback.count).toBe(5)
      expect(result.managerEvaluation).toBeNull()
    })

    it('should include manager evaluation if already submitted', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'

      const mockResult = {
        employee: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'John Doe',
          email: 'john.doe@example.com',
          level: 'SENIOR',
          department: 'Engineering',
        },
        selfReview: {
          scores: {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 4,
          },
          narrative: 'This year I focused on...',
          submittedAt: new Date('2025-02-20T10:00:00Z'),
        },
        peerFeedback: {
          count: 5,
          aggregatedScores: {
            projectImpact: 3.8,
            direction: 3.4,
            engineeringExcellence: 4.0,
            operationalOwnership: 3.6,
            peopleImpact: 3.8,
          },
          attributedFeedback: [],
        },
        managerEvaluation: {
          id: '550e8400-e29b-41d4-a716-446655440060',
          status: 'SUBMITTED',
          scores: {
            projectImpact: 4,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 4,
            peopleImpact: 4,
          },
          narrative: 'Excellent performance this year...',
        },
      }

      getEmployeeReviewUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getEmployeeReview(cycleId, employeeId, mockManagerUser)

      expect(result.managerEvaluation).toBeDefined()
      if (result.managerEvaluation) {
        expect(result.managerEvaluation.id).toBe('550e8400-e29b-41d4-a716-446655440060')
        expect(result.managerEvaluation.status).toBe('SUBMITTED')
      }
    })

    it('should throw error when employee not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655449999'

      getEmployeeReviewUseCase.execute.mockRejectedValue(new Error('Employee not found'))

      await expect(
        controller.getEmployeeReview(cycleId, employeeId, mockManagerUser),
      ).rejects.toThrow('Employee not found')
    })

    it('should throw error when not employee manager', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'

      getEmployeeReviewUseCase.execute.mockRejectedValue(
        new Error('Not authorized to view this employee review'),
      )

      await expect(
        controller.getEmployeeReview(cycleId, employeeId, mockManagerUser),
      ).rejects.toThrow('Not authorized to view this employee review')
    })
  })

  describe('submitManagerEvaluation', () => {
    it('should submit manager evaluation successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        narrative: 'Excellent performance this year...',
        strengths: 'Strong technical leadership',
        growthAreas: 'Strategic thinking',
        developmentPlan: 'Focus on architecture skills',
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440060',
        employeeId: '550e8400-e29b-41d4-a716-446655440003',
        status: 'SUBMITTED',
        scores: dto.scores,
        submittedAt: new Date('2025-03-25T15:00:00Z'),
      }

      submitManagerEvaluationUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.submitManagerEvaluation(
        cycleId,
        employeeId,
        mockManagerUser,
        dto,
      )

      expect(submitManagerEvaluationUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        employeeId: expect.any(Object),
        managerId: expect.any(Object),
        scores: dto.scores,
        narrative: dto.narrative,
        strengths: dto.strengths,
        growthAreas: dto.growthAreas,
        developmentPlan: dto.developmentPlan,
      })
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440060')
      expect(result.status).toBe('SUBMITTED')
      expect(result.scores).toEqual(dto.scores)
    })

    it('should throw error when deadline passed', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        narrative: 'Test',
        strengths: 'Test',
        growthAreas: 'Test',
        developmentPlan: 'Test',
      }

      submitManagerEvaluationUseCase.execute.mockRejectedValue(
        new Error('Manager evaluation deadline has passed'),
      )

      await expect(
        controller.submitManagerEvaluation(cycleId, employeeId, mockManagerUser, dto),
      ).rejects.toThrow('Manager evaluation deadline has passed')
    })

    it('should throw error when not employee manager', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        narrative: 'Test',
        strengths: 'Test',
        growthAreas: 'Test',
        developmentPlan: 'Test',
      }

      submitManagerEvaluationUseCase.execute.mockRejectedValue(
        new Error('Not authorized to evaluate this employee'),
      )

      await expect(
        controller.submitManagerEvaluation(cycleId, employeeId, mockManagerUser, dto),
      ).rejects.toThrow('Not authorized to evaluate this employee')
    })

    it('should throw error when validation fails', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'
      const dto = {
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 4,
          peopleImpact: 4,
        },
        narrative: 'Test',
        strengths: 'Test',
        growthAreas: 'Test',
        developmentPlan: 'Test',
      }

      submitManagerEvaluationUseCase.execute.mockRejectedValue(new Error('Invalid scores provided'))

      await expect(
        controller.submitManagerEvaluation(cycleId, employeeId, mockManagerUser, dto),
      ).rejects.toThrow('Invalid scores provided')
    })
  })
})
