import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { FinalScoresController } from './final-scores.controller'
import { GetMyFinalScoreUseCase } from '../../application/use-cases/final-scores/get-my-final-score.use-case'
import { GetTeamFinalScoresUseCase } from '../../application/use-cases/final-scores/get-team-final-scores.use-case'
import { MarkFeedbackDeliveredUseCase } from '../../application/use-cases/final-scores/mark-feedback-delivered.use-case'
import type { CurrentUserData } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'

describe('FinalScoresController', () => {
  let controller: FinalScoresController
  let getMyFinalScoreUseCase: jest.Mocked<GetMyFinalScoreUseCase>
  let getTeamFinalScoresUseCase: jest.Mocked<GetTeamFinalScoresUseCase>
  let markFeedbackDeliveredUseCase: jest.Mocked<MarkFeedbackDeliveredUseCase>

  const mockUser: CurrentUserData = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'USER',
    level: 'SENIOR',
    department: 'Engineering',
  }

  const mockManagerUser: CurrentUserData = {
    userId: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@example.com',
    name: 'Manager Smith',
    role: 'MANAGER',
    level: 'LEAD',
    department: 'Engineering',
  }

  beforeEach(async () => {
    const mockGetMyScoreUseCase = {
      execute: jest.fn(),
    }

    const mockGetTeamScoresUseCase = {
      execute: jest.fn(),
    }

    const mockMarkDeliveredUseCase = {
      execute: jest.fn(),
    }

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
    const mockReviewAuthGuard = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinalScoresController],
      providers: [
        { provide: GetMyFinalScoreUseCase, useValue: mockGetMyScoreUseCase },
        { provide: GetTeamFinalScoresUseCase, useValue: mockGetTeamScoresUseCase },
        { provide: MarkFeedbackDeliveredUseCase, useValue: mockMarkDeliveredUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ReviewAuthorizationGuard)
      .useValue(mockReviewAuthGuard)
      .compile()

    controller = module.get<FinalScoresController>(FinalScoresController)
    getMyFinalScoreUseCase = module.get(GetMyFinalScoreUseCase)
    getTeamFinalScoresUseCase = module.get(GetTeamFinalScoresUseCase)
    markFeedbackDeliveredUseCase = module.get(MarkFeedbackDeliveredUseCase)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getMyFinalScore', () => {
    it('should retrieve final score successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        employee: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'John Doe',
          level: 'SENIOR',
        },
        cycle: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: '2025 Annual Review',
          year: 2025,
        },
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        peerFeedbackSummary: {
          averageScores: {
            projectImpact: 3.8,
            direction: 3.4,
            engineeringExcellence: 4.0,
            operationalOwnership: 3.6,
            peopleImpact: 3.8,
          },
          count: 5,
        },
        weightedScore: 3.7,
        percentageScore: 92.5,
        bonusTier: 'EXCEEDS',
        isLocked: true,
        feedbackDelivered: false,
        feedbackDeliveredAt: undefined,
      }

      getMyFinalScoreUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getMyFinalScore(cycleId, mockUser)

      expect(getMyFinalScoreUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        userId: expect.any(Object),
      })
      expect(result.employee.name).toBe('John Doe')
      expect(result.weightedScore).toBe(3.7)
      expect(result.bonusTier).toBe('EXCEEDS')
      expect(result.isLocked).toBe(true)
      expect(result.feedbackDeliveredAt).toBeNull()
    })

    it('should include feedback delivered timestamp when delivered', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        employee: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'John Doe',
          level: 'SENIOR',
        },
        cycle: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: '2025 Annual Review',
          year: 2025,
        },
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        peerFeedbackSummary: {
          averageScores: {
            projectImpact: 3.8,
            direction: 3.4,
            engineeringExcellence: 4.0,
            operationalOwnership: 3.6,
            peopleImpact: 3.8,
          },
          count: 5,
        },
        weightedScore: 3.7,
        percentageScore: 92.5,
        bonusTier: 'EXCEEDS',
        isLocked: true,
        feedbackDelivered: true,
        feedbackDeliveredAt: new Date('2025-04-28T10:00:00Z'),
      }

      getMyFinalScoreUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getMyFinalScore(cycleId, mockUser)

      expect(result.feedbackDelivered).toBe(true)
      expect(result.feedbackDeliveredAt).toBe('2025-04-28T10:00:00.000Z')
    })

    it('should throw error when final score not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      getMyFinalScoreUseCase.execute.mockRejectedValue(new Error('Final score not found'))

      await expect(controller.getMyFinalScore(cycleId, mockUser)).rejects.toThrow(
        'Final score not found',
      )
    })

    it('should throw error when scores not locked yet', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      getMyFinalScoreUseCase.execute.mockRejectedValue(
        new Error('Final scores have not been locked yet'),
      )

      await expect(controller.getMyFinalScore(cycleId, mockUser)).rejects.toThrow(
        'Final scores have not been locked yet',
      )
    })
  })

  describe('getTeamFinalScores', () => {
    it('should retrieve team final scores successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        teamScores: [
          {
            employeeId: '550e8400-e29b-41d4-a716-446655440003',
            employeeName: 'Alice Johnson',
            level: 'SENIOR',
            weightedScore: 3.8,
            percentageScore: 95.0,
            bonusTier: 'EXCEEDS',
            feedbackDelivered: true,
          },
          {
            employeeId: '550e8400-e29b-41d4-a716-446655440004',
            employeeName: 'Bob Smith',
            level: 'MID',
            weightedScore: 3.2,
            percentageScore: 80.0,
            bonusTier: 'MEETS',
            feedbackDelivered: false,
          },
        ],
      }

      getTeamFinalScoresUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getTeamFinalScores(cycleId, mockManagerUser)

      expect(getTeamFinalScoresUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        managerId: expect.any(Object),
      })
      expect(result.teamScores).toHaveLength(2)
      expect(result.teamScores[0].employeeName).toBe('Alice Johnson')
      expect(result.teamScores[0].feedbackDelivered).toBe(true)
      expect(result.teamScores[1].feedbackDelivered).toBe(false)
    })

    it('should return empty list when no team members', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        teamScores: [],
      }

      getTeamFinalScoresUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getTeamFinalScores(cycleId, mockManagerUser)

      expect(result.teamScores).toHaveLength(0)
    })

    it('should throw error when cycle not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655449999'

      getTeamFinalScoresUseCase.execute.mockRejectedValue(new Error('Review cycle not found'))

      await expect(controller.getTeamFinalScores(cycleId, mockManagerUser)).rejects.toThrow(
        'Review cycle not found',
      )
    })

    it('should throw error when scores not locked', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      getTeamFinalScoresUseCase.execute.mockRejectedValue(
        new Error('Final scores have not been locked yet'),
      )

      await expect(controller.getTeamFinalScores(cycleId, mockManagerUser)).rejects.toThrow(
        'Final scores have not been locked yet',
      )
    })
  })

  describe('markFeedbackDelivered', () => {
    it('should mark feedback as delivered successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'

      const mockResult = {
        employeeId: '550e8400-e29b-41d4-a716-446655440003',
        feedbackDelivered: true,
        feedbackDeliveredAt: new Date('2025-04-28T14:30:00Z'),
      }

      markFeedbackDeliveredUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.markFeedbackDelivered(cycleId, employeeId, mockManagerUser)

      expect(markFeedbackDeliveredUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        employeeId: expect.any(Object),
        managerId: expect.any(Object),
      })
      expect(result.employeeId).toBe(employeeId)
      expect(result.feedbackDelivered).toBe(true)
      expect(result.feedbackDeliveredAt).toBe('2025-04-28T14:30:00.000Z')
    })

    it('should throw error when employee not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655449999'

      markFeedbackDeliveredUseCase.execute.mockRejectedValue(new Error('Employee not found'))

      await expect(
        controller.markFeedbackDelivered(cycleId, employeeId, mockManagerUser),
      ).rejects.toThrow('Employee not found')
    })

    it('should throw error when not employee manager', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'

      markFeedbackDeliveredUseCase.execute.mockRejectedValue(
        new Error('Not authorized to mark feedback for this employee'),
      )

      await expect(
        controller.markFeedbackDelivered(cycleId, employeeId, mockManagerUser),
      ).rejects.toThrow('Not authorized to mark feedback for this employee')
    })

    it('should throw error when feedback already delivered', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'

      markFeedbackDeliveredUseCase.execute.mockRejectedValue(
        new Error('Feedback already marked as delivered'),
      )

      await expect(
        controller.markFeedbackDelivered(cycleId, employeeId, mockManagerUser),
      ).rejects.toThrow('Feedback already marked as delivered')
    })

    it('should throw error when scores not locked', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const employeeId = '550e8400-e29b-41d4-a716-446655440003'

      markFeedbackDeliveredUseCase.execute.mockRejectedValue(
        new Error('Cannot mark feedback delivered before scores are locked'),
      )

      await expect(
        controller.markFeedbackDelivered(cycleId, employeeId, mockManagerUser),
      ).rejects.toThrow('Cannot mark feedback delivered before scores are locked')
    })
  })
})
