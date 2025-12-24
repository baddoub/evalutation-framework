import { ApproveScoreAdjustmentUseCase } from './approve-score-adjustment.use-case'
import type {
  IScoreAdjustmentRequestRepository,
  ScoreAdjustmentRequest,
} from '../../../domain/repositories/score-adjustment-request.repository.interface'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'

describe('ApproveScoreAdjustmentUseCase', () => {
  let useCase: ApproveScoreAdjustmentUseCase
  let mockAdjustmentRequestRepository: jest.Mocked<IScoreAdjustmentRequestRepository>

  const createValidScoreAdjustmentRequest = (
    overrides?: Partial<{
      id: string
      cycleId: ReviewCycleId
      employeeId: UserId
      requesterId: UserId
      approverId: UserId
      reason: string
      status: 'PENDING' | 'APPROVED' | 'REJECTED'
      proposedScores: PillarScores
      requestedAt: Date
      reviewedAt: Date
      rejectionReason: string
    }>,
  ): ScoreAdjustmentRequest => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const employeeId = overrides?.employeeId || UserId.generate()
    const requesterId = overrides?.requesterId || UserId.generate()

    return {
      id: overrides?.id || 'request-123',
      cycleId,
      employeeId,
      requesterId,
      approverId: overrides?.approverId,
      reason: overrides?.reason || 'Performance exceeds expectations',
      status: overrides?.status || 'PENDING',
      proposedScores:
        overrides?.proposedScores ||
        PillarScores.create({
          projectImpact: 4,
          direction: 3,
          engineeringExcellence: 4,
          operationalOwnership: 3,
          peopleImpact: 3,
        }),
      requestedAt: overrides?.requestedAt || new Date('2025-03-15'),
      reviewedAt: overrides?.reviewedAt,
      rejectionReason: overrides?.rejectionReason,
      approve(_approver: string, _notes?: string): void {
        if (this.status !== 'PENDING') {
          throw new Error('Can only approve pending requests')
        }
        this.status = 'APPROVED'
        this.approverId = UserId.generate()
        this.reviewedAt = new Date()
      },
      reject(_approver: string, _notes?: string): void {
        if (this.status !== 'PENDING') {
          throw new Error('Can only reject pending requests')
        }
        this.status = 'REJECTED'
        this.approverId = UserId.generate()
        this.reviewedAt = new Date()
        if (_notes) {
          this.rejectionReason = _notes
        }
      },
    }
  }

  beforeEach(() => {
    mockAdjustmentRequestRepository = {
      findById: jest.fn(),
      findPending: jest.fn(),
      findByEmployee: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new ApproveScoreAdjustmentUseCase(mockAdjustmentRequestRepository)
  })

  describe('CRITICAL: approve score adjustment request', () => {
    it('should approve pending score adjustment request successfully', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: 'Approved after review of performance data',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(request.id)
      expect(result.status).toBe('APPROVED')
      expect(result.reviewedBy).toBeDefined()
      expect(typeof result.reviewedBy).toBe('string')
      expect(result.reviewedAt).toBeInstanceOf(Date)
    })

    it('should call approve method on request entity when approved', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const approveSpy = jest.spyOn(request, 'approve')

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: 'Performance justifies adjustment',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(approveSpy).toHaveBeenCalledWith(input.reviewedBy, input.reviewNotes)
      expect(approveSpy).toHaveBeenCalledTimes(1)
    })

    it('should save approved request to repository', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockAdjustmentRequestRepository.save).toHaveBeenCalledWith(request)
      expect(mockAdjustmentRequestRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should approve request with review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: 'Detailed review notes explaining approval decision',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should approve request without review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })
  })

  describe('CRITICAL: reject score adjustment request', () => {
    it('should reject pending score adjustment request successfully', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
        reviewNotes: 'Insufficient evidence for score adjustment',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(request.id)
      expect(result.status).toBe('REJECTED')
      expect(result.reviewedBy).toBeDefined()
      expect(typeof result.reviewedBy).toBe('string')
      expect(result.reviewedAt).toBeInstanceOf(Date)
    })

    it('should call reject method on request entity when rejected', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const rejectSpy = jest.spyOn(request, 'reject')

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
        reviewNotes: 'Does not meet criteria for adjustment',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(rejectSpy).toHaveBeenCalledWith(input.reviewedBy, input.reviewNotes)
      expect(rejectSpy).toHaveBeenCalledTimes(1)
    })

    it('should save rejected request to repository', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
        reviewNotes: 'Rejection reason',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockAdjustmentRequestRepository.save).toHaveBeenCalledWith(request)
      expect(mockAdjustmentRequestRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should reject request with review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
        reviewNotes: 'Detailed explanation for rejection',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('REJECTED')
    })

    it('should reject request without review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('REJECTED')
    })
  })

  describe('CRITICAL: validation - request exists', () => {
    it('should throw error if request does not exist', async () => {
      // Arrange
      const input = {
        requestId: 'non-existent-request',
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Score adjustment request not found')
    })

    it('should not proceed to approve if request does not exist', async () => {
      // Arrange
      const input = {
        requestId: 'non-existent-request',
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockAdjustmentRequestRepository.save).not.toHaveBeenCalled()
    })

    it('should not proceed to reject if request does not exist', async () => {
      // Arrange
      const input = {
        requestId: 'non-existent-request',
        reviewedBy: 'manager-123',
        approved: false,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockAdjustmentRequestRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: return output with required fields', () => {
    it('should return output with all required fields for approval', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: 'Approved',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('reviewedAt')
      expect(result).toHaveProperty('reviewedBy')
      expect(typeof result.id).toBe('string')
      expect(typeof result.status).toBe('string')
      expect(result.reviewedAt).toBeInstanceOf(Date)
      expect(typeof result.reviewedBy).toBe('string')
    })

    it('should return output with all required fields for rejection', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
        reviewNotes: 'Rejected',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('reviewedAt')
      expect(result).toHaveProperty('reviewedBy')
    })

    it('should return correct status in output', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe('APPROVED')
    })

    it('should return request ID in output', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(request.id)
    })

    it('should return reviewedBy in output', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const reviewedBy = 'manager-123'
      const input = {
        requestId: request.id,
        reviewedBy,
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.reviewedBy).toBeDefined()
      expect(typeof result.reviewedBy).toBe('string')
    })
  })

  describe('EDGE: approve vs reject decision', () => {
    it('should call approve when approved is true', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const approveSpy = jest.spyOn(request, 'approve')
      const rejectSpy = jest.spyOn(request, 'reject')

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(approveSpy).toHaveBeenCalled()
      expect(rejectSpy).not.toHaveBeenCalled()
    })

    it('should call reject when approved is false', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const approveSpy = jest.spyOn(request, 'approve')
      const rejectSpy = jest.spyOn(request, 'reject')

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(rejectSpy).toHaveBeenCalled()
      expect(approveSpy).not.toHaveBeenCalled()
    })

    it('should not call both approve and reject', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const approveSpy = jest.spyOn(request, 'approve')
      const rejectSpy = jest.spyOn(request, 'reject')

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      const totalCalls = approveSpy.mock.calls.length + rejectSpy.mock.calls.length
      expect(totalCalls).toBe(1)
    })
  })

  describe('EDGE: different reviewers', () => {
    it('should accept different reviewer IDs', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const reviewerId1 = 'manager-123'

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result1 = await useCase.execute({
        requestId: request.id,
        reviewedBy: reviewerId1,
        approved: true,
      })

      // Assert
      expect(result1.reviewedBy).toBeDefined()
      expect(typeof result1.reviewedBy).toBe('string')
    })

    it('should handle UUID format reviewer IDs', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const reviewerId = '550e8400-e29b-41d4-a716-446655440000'

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute({
        requestId: request.id,
        reviewedBy: reviewerId,
        approved: true,
      })

      // Assert
      expect(result.reviewedBy).toBeDefined()
      expect(typeof result.reviewedBy).toBe('string')
    })

    it('should handle string-based reviewer IDs', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const reviewerId = 'reviewer-abc-123'

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute({
        requestId: request.id,
        reviewedBy: reviewerId,
        approved: true,
      })

      // Assert
      expect(result.reviewedBy).toBeDefined()
      expect(typeof result.reviewedBy).toBe('string')
    })
  })

  describe('EDGE: review notes variations', () => {
    it('should handle empty string review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: '',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should handle undefined review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: undefined,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
    })

    it('should handle very long review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const longNotes = 'A'.repeat(1000)
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: longNotes,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
    })

    it('should handle special characters in review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: 'Notes with special chars: @#$%^&*()_+-={}[]|\\:";\'<>?,./~`',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
    })

    it('should handle multiline review notes', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: 'Line 1\nLine 2\nLine 3',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe('EDGE: different proposed scores', () => {
    it('should approve request with all maximum scores (4)', async () => {
      // Arrange
      const proposedScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const request = createValidScoreAdjustmentRequest({ proposedScores })

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should approve request with all minimum scores (0)', async () => {
      // Arrange
      const proposedScores = PillarScores.create({
        projectImpact: 0,
        direction: 0,
        engineeringExcellence: 0,
        operationalOwnership: 0,
        peopleImpact: 0,
      })
      const request = createValidScoreAdjustmentRequest({ proposedScores })

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should approve request with mixed scores', async () => {
      // Arrange
      const proposedScores = PillarScores.create({
        projectImpact: 1,
        direction: 2,
        engineeringExcellence: 3,
        operationalOwnership: 4,
        peopleImpact: 0,
      })
      const request = createValidScoreAdjustmentRequest({ proposedScores })

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should reject request with maximum scores', async () => {
      // Arrange
      const proposedScores = PillarScores.create({
        projectImpact: 4,
        direction: 4,
        engineeringExcellence: 4,
        operationalOwnership: 4,
        peopleImpact: 4,
      })
      const request = createValidScoreAdjustmentRequest({ proposedScores })

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
        reviewNotes: 'Scores too high based on evidence',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('REJECTED')
    })
  })

  describe('EDGE: repository interactions', () => {
    it('should fetch request from repository by ID', async () => {
      // Arrange
      const requestId = 'request-123'
      const request = createValidScoreAdjustmentRequest({ id: requestId })
      const input = {
        requestId,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockAdjustmentRequestRepository.findById).toHaveBeenCalledWith(requestId)
      expect(mockAdjustmentRequestRepository.findById).toHaveBeenCalledTimes(1)
    })

    it('should save request only once', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockAdjustmentRequestRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should handle repository save errors', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Database error')
    })

    it('should handle repository find errors', async () => {
      // Arrange
      const input = {
        requestId: 'request-123',
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      )

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Database connection failed')
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full approval workflow', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const requesterId = UserId.generate()

      const request = createValidScoreAdjustmentRequest({
        cycleId,
        employeeId,
        requesterId,
      })

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
        reviewNotes: 'Comprehensive review completed. Performance data supports adjustment.',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockAdjustmentRequestRepository.findById).toHaveBeenCalledWith(input.requestId)
      expect(mockAdjustmentRequestRepository.save).toHaveBeenCalledWith(request)
      expect(result).toBeDefined()
      expect(result.id).toBe(request.id)
      expect(result.status).toBe('APPROVED')
      expect(result.reviewedBy).toBeDefined()
      expect(typeof result.reviewedBy).toBe('string')
      expect(result.reviewedAt).toBeInstanceOf(Date)
    })

    it('should complete full rejection workflow', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const employeeId = UserId.generate()
      const requesterId = UserId.generate()

      const request = createValidScoreAdjustmentRequest({
        cycleId,
        employeeId,
        requesterId,
      })

      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
        reviewNotes: 'After careful review, the evidence does not support this adjustment.',
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockAdjustmentRequestRepository.findById).toHaveBeenCalledWith(input.requestId)
      expect(mockAdjustmentRequestRepository.save).toHaveBeenCalledWith(request)
      expect(result).toBeDefined()
      expect(result.id).toBe(request.id)
      expect(result.status).toBe('REJECTED')
      expect(result.reviewedBy).toBeDefined()
      expect(typeof result.reviewedBy).toBe('string')
      expect(result.reviewedAt).toBeInstanceOf(Date)
    })

    it('should handle workflow with minimal input (approval)', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: true,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('APPROVED')
    })

    it('should handle workflow with minimal input (rejection)', async () => {
      // Arrange
      const request = createValidScoreAdjustmentRequest()
      const input = {
        requestId: request.id,
        reviewedBy: 'manager-123',
        approved: false,
      }

      mockAdjustmentRequestRepository.findById.mockResolvedValue(request)
      mockAdjustmentRequestRepository.save.mockResolvedValue(request)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('REJECTED')
    })
  })
})
