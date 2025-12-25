import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { PeerFeedbackController } from './peer-feedback.controller'
import { NominatePeersUseCase } from '../../application/use-cases/peer-feedback/nominate-peers.use-case'
import { SubmitPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/submit-peer-feedback.use-case'
import { GetAggregatedPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/get-aggregated-peer-feedback.use-case'
import type { CurrentUserData } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import type { IUserRepository } from '../../../auth/domain/repositories/user.repository.interface'

describe('PeerFeedbackController', () => {
  let controller: PeerFeedbackController
  let nominatePeersUseCase: jest.Mocked<NominatePeersUseCase>
  let submitPeerFeedbackUseCase: jest.Mocked<SubmitPeerFeedbackUseCase>
  let getAggregatedPeerFeedbackUseCase: jest.Mocked<GetAggregatedPeerFeedbackUseCase>

  const mockUser: CurrentUserData = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'USER',
    level: 'SENIOR',
    department: 'Engineering',
  }

  beforeEach(async () => {
    const mockNominateUseCase = {
      execute: jest.fn(),
    }

    const mockSubmitUseCase = {
      execute: jest.fn(),
    }

    const mockGetAggregatedUseCase = {
      execute: jest.fn(),
    }

    const mockUserRepository: Partial<IUserRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    }

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }
    const mockReviewAuthGuard = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeerFeedbackController],
      providers: [
        { provide: NominatePeersUseCase, useValue: mockNominateUseCase },
        { provide: SubmitPeerFeedbackUseCase, useValue: mockSubmitUseCase },
        { provide: GetAggregatedPeerFeedbackUseCase, useValue: mockGetAggregatedUseCase },
        { provide: 'IUserRepository', useValue: mockUserRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(ReviewAuthorizationGuard)
      .useValue(mockReviewAuthGuard)
      .compile()

    controller = module.get<PeerFeedbackController>(PeerFeedbackController)
    nominatePeersUseCase = module.get(NominatePeersUseCase)
    submitPeerFeedbackUseCase = module.get(SubmitPeerFeedbackUseCase)
    getAggregatedPeerFeedbackUseCase = module.get(GetAggregatedPeerFeedbackUseCase)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('nominatePeers', () => {
    it('should nominate peers successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        nomineeIds: [
          '550e8400-e29b-41d4-a716-446655440010',
          '550e8400-e29b-41d4-a716-446655440011',
          '550e8400-e29b-41d4-a716-446655440012',
        ],
      }

      const mockResult = {
        nominations: [
          {
            id: '550e8400-e29b-41d4-a716-446655440020',
            nomineeId: '550e8400-e29b-41d4-a716-446655440010',
            nomineeName: 'Alice Smith',
            status: 'PENDING',
            nominatedAt: new Date('2025-02-01T10:00:00Z'),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440021',
            nomineeId: '550e8400-e29b-41d4-a716-446655440011',
            nomineeName: 'Bob Johnson',
            status: 'PENDING',
            nominatedAt: new Date('2025-02-01T10:00:00Z'),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440022',
            nomineeId: '550e8400-e29b-41d4-a716-446655440012',
            nomineeName: 'Carol Williams',
            status: 'PENDING',
            nominatedAt: new Date('2025-02-01T10:00:00Z'),
          },
        ],
      }

      nominatePeersUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.nominatePeers(cycleId, mockUser, dto)

      expect(nominatePeersUseCase.execute).toHaveBeenCalledWith({
        cycleId: expect.any(Object),
        nominatorId: expect.any(Object),
        nomineeIds: expect.arrayContaining([expect.any(Object)]),
      })
      expect(result.nominations).toHaveLength(3)
      expect(result.nominations[0].nomineeId).toBe('550e8400-e29b-41d4-a716-446655440010')
    })

    it('should throw error when deadline passed', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        nomineeIds: ['550e8400-e29b-41d4-a716-446655440010'],
      }

      nominatePeersUseCase.execute.mockRejectedValue(new Error('Nomination deadline has passed'))

      await expect(controller.nominatePeers(cycleId, mockUser, dto)).rejects.toThrow(
        'Nomination deadline has passed',
      )
    })

    it('should throw error when nominating too many peers', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        nomineeIds: Array(11).fill('550e8400-e29b-41d4-a716-446655440010'),
      }

      nominatePeersUseCase.execute.mockRejectedValue(
        new Error('Cannot nominate more than 10 peers'),
      )

      await expect(controller.nominatePeers(cycleId, mockUser, dto)).rejects.toThrow(
        'Cannot nominate more than 10 peers',
      )
    })
  })

  describe('getPeerFeedbackRequests', () => {
    it('should return peer feedback requests', async () => {
      const result = await controller.getPeerFeedbackRequests()

      expect(result).toEqual({
        requests: [],
        total: 0,
      })
    })
  })

  describe('submitPeerFeedback', () => {
    it('should submit peer feedback successfully', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        revieweeId: '550e8400-e29b-41d4-a716-446655440030',
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        strengths: 'Great technical skills and collaboration',
        growthAreas: 'Could improve on documentation',
        generalComments: 'Overall excellent performance',
      }

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440031',
        revieweeId: '550e8400-e29b-41d4-a716-446655440030',
        submittedAt: new Date('2025-03-10T14:30:00Z'),
        isAnonymized: true,
      }

      submitPeerFeedbackUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.submitPeerFeedback(cycleId, mockUser, dto)

      expect(submitPeerFeedbackUseCase.execute).toHaveBeenCalledWith({
        revieweeId: expect.any(Object),
        reviewerId: expect.any(Object),
        cycleId: expect.any(Object),
        scores: dto.scores,
        strengths: dto.strengths,
        growthAreas: dto.growthAreas,
        generalComments: dto.generalComments,
      })
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440031')
      expect(result.revieweeId).toBe('550e8400-e29b-41d4-a716-446655440030')
      expect(result.isAnonymized).toBe(true)
    })

    it('should throw error when reviewee not found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        revieweeId: '550e8400-e29b-41d4-a716-446655449999',
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        strengths: 'Test',
        growthAreas: 'Test',
        generalComments: 'Test',
      }

      submitPeerFeedbackUseCase.execute.mockRejectedValue(new Error('Reviewee not found'))

      await expect(controller.submitPeerFeedback(cycleId, mockUser, dto)).rejects.toThrow(
        'Reviewee not found',
      )
    })

    it('should throw error when deadline passed', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        revieweeId: '550e8400-e29b-41d4-a716-446655440030',
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        strengths: 'Test',
        growthAreas: 'Test',
        generalComments: 'Test',
      }

      submitPeerFeedbackUseCase.execute.mockRejectedValue(
        new Error('Peer feedback deadline has passed'),
      )

      await expect(controller.submitPeerFeedback(cycleId, mockUser, dto)).rejects.toThrow(
        'Peer feedback deadline has passed',
      )
    })

    it('should throw error when already submitted', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'
      const dto = {
        revieweeId: '550e8400-e29b-41d4-a716-446655440030',
        scores: {
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 4,
        },
        strengths: 'Test',
        growthAreas: 'Test',
        generalComments: 'Test',
      }

      submitPeerFeedbackUseCase.execute.mockRejectedValue(
        new Error('Feedback already submitted for this reviewee'),
      )

      await expect(controller.submitPeerFeedback(cycleId, mockUser, dto)).rejects.toThrow(
        'Feedback already submitted for this reviewee',
      )
    })
  })

  describe('getAggregatedPeerFeedback', () => {
    it('should retrieve aggregated peer feedback', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        employeeId: '550e8400-e29b-41d4-a716-446655440001',
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        aggregatedScores: {
          projectImpact: 3.5,
          direction: 3.2,
          engineeringExcellence: 3.8,
          operationalOwnership: 3.4,
          peopleImpact: 3.6,
        },
        feedbackCount: 5,
        anonymizedComments: [
          {
            pillar: 'leadership',
            comment: 'Great technical leadership',
          },
          {
            pillar: 'problem-solving',
            comment: 'Excellent problem solving',
          },
        ],
      }

      getAggregatedPeerFeedbackUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getAggregatedPeerFeedback(cycleId, mockUser)

      expect(getAggregatedPeerFeedbackUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        cycleId,
      )
      expect(result.aggregatedScores.projectImpact).toBe(3.5)
      expect(result.feedbackCount).toBe(5)
      expect(result.anonymizedComments).toHaveLength(2)
      expect(result.anonymizedComments[0].pillar).toBe('leadership')
      expect(result.anonymizedComments[0].comment).toBe('Great technical leadership')
    })

    it('should throw error when no feedback found', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      getAggregatedPeerFeedbackUseCase.execute.mockRejectedValue(
        new Error('No peer feedback found'),
      )

      await expect(controller.getAggregatedPeerFeedback(cycleId, mockUser)).rejects.toThrow(
        'No peer feedback found',
      )
    })

    it('should return comments as-is when they are undefined', async () => {
      const cycleId = '550e8400-e29b-41d4-a716-446655440000'

      const mockResult = {
        employeeId: '550e8400-e29b-41d4-a716-446655440001',
        cycleId: '550e8400-e29b-41d4-a716-446655440000',
        aggregatedScores: {
          projectImpact: 3.5,
          direction: 3.2,
          engineeringExcellence: 3.8,
          operationalOwnership: 3.4,
          peopleImpact: 3.6,
        },
        feedbackCount: 2,
        anonymizedComments: [
          {
            pillar: 'unknown',
            comment: '',
          },
        ],
      }

      getAggregatedPeerFeedbackUseCase.execute.mockResolvedValue(mockResult)

      const result = await controller.getAggregatedPeerFeedback(cycleId, mockUser)

      expect(getAggregatedPeerFeedbackUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        cycleId,
      )
      expect(result.anonymizedComments[0].pillar).toBe('unknown')
      expect(result.anonymizedComments[0].comment).toBe('')
    })
  })
})
