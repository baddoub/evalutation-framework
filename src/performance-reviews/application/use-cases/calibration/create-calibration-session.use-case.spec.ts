import { CreateCalibrationSessionUseCase } from './create-calibration-session.use-case'
import type {
  ICalibrationSessionRepository,
  CalibrationSession,
} from '../../../domain/repositories/calibration-session.repository.interface'
import type { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import type {
  CreateCalibrationSessionInput,
  CreateCalibrationSessionOutput,
} from '../../dto/final-score.dto'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'

describe('CreateCalibrationSessionUseCase', () => {
  let useCase: CreateCalibrationSessionUseCase
  let mockCalibrationSessionRepository: jest.Mocked<ICalibrationSessionRepository>
  let mockReviewCycleRepository: jest.Mocked<IReviewCycleRepository>

  const createValidCycle = (): ReviewCycle => {
    const deadlines = CycleDeadlines.create({
      selfReview: new Date('2025-12-31'),
      peerFeedback: new Date('2026-01-15'),
      managerEvaluation: new Date('2026-01-31'),
      calibration: new Date('2026-02-28'),
      feedbackDelivery: new Date('2026-03-31'),
    })

    return ReviewCycle.create({
      name: 'Performance Review 2025',
      year: 2025,
      deadlines,
      startDate: new Date('2025-01-01'),
    })
  }

  beforeEach(() => {
    mockCalibrationSessionRepository = {
      findById: jest.fn(),
      findByCycle: jest.fn(),
      findByDepartment: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    mockReviewCycleRepository = {
      findById: jest.fn(),
      findByYear: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new CreateCalibrationSessionUseCase(
      mockCalibrationSessionRepository,
      mockReviewCycleRepository,
    )
  })

  describe('CRITICAL: happy path - successfully creates calibration session', () => {
    it('should create calibration session with all required fields', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(savedSession.id)
      expect(result.name).toBe(input.name)
      expect(result.status).toBe('SCHEDULED')
      expect(result.scheduledAt).toEqual(input.scheduledAt)
      expect(result.participantCount).toBe(3)
    })

    it('should create calibration session without department', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Cross-Department Calibration',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-456',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(savedSession.id)
      expect(result.name).toBe(input.name)
      expect(result.status).toBe('SCHEDULED')
    })

    it('should create calibration session with single participant', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Individual Calibration Review',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Product',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-789',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.participantCount).toBe(1)
    })

    it('should create calibration session with multiple participants', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
        UserId.generate(),
      ]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Large Team Calibration',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-abc',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.participantCount).toBe(5)
    })
  })

  describe('CRITICAL: cycle validation', () => {
    it('should validate that review cycle exists', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockReviewCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(result).toBeDefined()
    })

    it('should throw ReviewNotFoundException when cycle does not exist', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      mockReviewCycleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ReviewNotFoundException)
      await expect(useCase.execute(input)).rejects.toThrow(
        `Review cycle with ID ${cycleId.value} not found`,
      )
    })

    it('should not save session when cycle validation fails', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      mockReviewCycleRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockCalibrationSessionRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('CRITICAL: all required fields present in output DTO', () => {
    it('should return all required fields in DTO', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert - Check all required fields
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('scheduledAt')
      expect(result).toHaveProperty('participantCount')
    })

    it('should return correct types for all fields', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert - Check types
      expect(typeof result.id).toBe('string')
      expect(typeof result.name).toBe('string')
      expect(typeof result.status).toBe('string')
      expect(result.scheduledAt).toBeInstanceOf(Date)
      expect(typeof result.participantCount).toBe('number')
    })

    it('should conform to CreateCalibrationSessionOutput interface', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert - Type-safe check
      const output: CreateCalibrationSessionOutput = result
      expect(output).toBeDefined()
    })
  })

  describe('IMPORTANT: session creation with all properties', () => {
    it('should create session with correct name', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.name).toBe('Engineering Calibration Q1 2025')
    })

    it('should create session with SCHEDULED status by default', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe('SCHEDULED')
    })

    it('should create session with correct scheduled date', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]
      const scheduledDate = new Date('2026-02-15T14:00:00Z')

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: scheduledDate,
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.scheduledAt).toEqual(scheduledDate)
    })

    it('should generate unique ID for session', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
      expect(result.id.length).toBeGreaterThan(0)
    })

    it('should map participant IDs correctly', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participant1 = UserId.generate()
      const participant2 = UserId.generate()
      const participant3 = UserId.generate()
      const participantIds = [participant1, participant2, participant3]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      let capturedSession: CalibrationSession | undefined

      mockCalibrationSessionRepository.save.mockImplementation(async (session) => {
        capturedSession = session
        return {
          ...session,
          id: 'session-123',
        }
      })

      // Act
      await useCase.execute(input)

      // Assert
      expect(capturedSession).toBeDefined()
      expect(capturedSession!.participantIds).toHaveLength(3)
      expect(capturedSession!.participantIds).toEqual([
        participant1.value,
        participant2.value,
        participant3.value,
      ])
    })
  })

  describe('IMPORTANT: repository save operation', () => {
    it('should call repository save with created session', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledTimes(1)
      const savedSessionArg = mockCalibrationSessionRepository.save.mock.calls[0][0]
      expect(savedSessionArg.name).toBe(input.name)
      expect(savedSessionArg.status).toBe('SCHEDULED')
      expect(savedSessionArg.cycleId).toBe(cycleId)
      expect(savedSessionArg.facilitatorId).toBe(facilitatorId)
    })

    it('should return saved session data in DTO', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(savedSession.id)
      expect(result.name).toBe(savedSession.name)
      expect(result.status).toBe(savedSession.status)
      expect(result.scheduledAt).toEqual(savedSession.scheduledAt)
      expect(result.participantCount).toBe(savedSession.participantIds.length)
    })
  })

  describe('IMPORTANT: DTO structure validation', () => {
    it('should map session ID to string in DTO', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(savedSession.id)
      expect(typeof result.id).toBe('string')
    })

    it('should map status to string in DTO', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.status).toBe('SCHEDULED')
      expect(typeof result.status).toBe('string')
    })

    it('should calculate participant count correctly', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.participantCount).toBe(3)
    })

    it('should preserve scheduledAt date object in DTO', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]
      const scheduledDate = new Date('2026-02-15T14:00:00Z')

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: scheduledDate,
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.scheduledAt).toBeInstanceOf(Date)
      expect(result.scheduledAt).toEqual(scheduledDate)
    })
  })

  describe('EDGE: different session configurations', () => {
    it('should handle sessions scheduled in different time zones', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]
      const scheduledDate = new Date('2026-02-15T22:00:00Z') // Late UTC time

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Late Evening Calibration',
        facilitatorId,
        participantIds,
        scheduledAt: scheduledDate,
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.scheduledAt).toEqual(scheduledDate)
    })

    it('should handle sessions for different departments', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing']

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      for (const department of departments) {
        const input: CreateCalibrationSessionInput = {
          cycleId,
          name: `${department} Calibration`,
          facilitatorId,
          participantIds,
          scheduledAt: new Date('2026-02-15T14:00:00Z'),
          department,
        }

        const savedSession: CalibrationSession = {
          id: `session-${department}`,
          cycleId: input.cycleId,
          name: input.name,
          facilitatorId: input.facilitatorId,
          participantIds: input.participantIds.map((id) => id.value),
          scheduledAt: input.scheduledAt,
          status: 'SCHEDULED',
          department: input.department,
        }

        mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

        const result = await useCase.execute(input)

        expect(result).toBeDefined()
        expect(result.name).toBe(`${department} Calibration`)
      }
    })

    it('should handle long session names', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]
      const longName =
        'Q1 2025 Engineering Department Cross-Functional Calibration Session for Senior and Staff Engineers'

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: longName,
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe(longName)
    })

    it('should handle empty participant list (edge case)', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds: UserId[] = []

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Placeholder Calibration Session',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: [],
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.participantCount).toBe(0)
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full creation workflow successfully', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate(), UserId.generate()]

      const input: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Q1 2025',
        facilitatorId,
        participantIds,
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession: CalibrationSession = {
        id: 'session-123',
        cycleId: input.cycleId,
        name: input.name,
        facilitatorId: input.facilitatorId,
        participantIds: input.participantIds.map((id) => id.value),
        scheduledAt: input.scheduledAt,
        status: 'SCHEDULED',
        department: input.department,
      }

      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert - Full workflow validation
      expect(mockReviewCycleRepository.findById).toHaveBeenCalledWith(cycleId)
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledTimes(1)
      expect(result.id).toBe(savedSession.id)
      expect(result.name).toBe(input.name)
      expect(result.status).toBe('SCHEDULED')
      expect(result.scheduledAt).toEqual(input.scheduledAt)
      expect(result.participantCount).toBe(3)
    })

    it('should handle multiple sessions for the same cycle', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitator1 = UserId.generate()
      const facilitator2 = UserId.generate()

      const input1: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Engineering Calibration Session',
        facilitatorId: facilitator1,
        participantIds: [UserId.generate(), UserId.generate()],
        scheduledAt: new Date('2026-02-15T14:00:00Z'),
        department: 'Engineering',
      }

      const input2: CreateCalibrationSessionInput = {
        cycleId,
        name: 'Product Calibration Session',
        facilitatorId: facilitator2,
        participantIds: [UserId.generate(), UserId.generate()],
        scheduledAt: new Date('2026-02-16T14:00:00Z'),
        department: 'Product',
      }

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      const savedSession1: CalibrationSession = {
        id: 'session-1',
        cycleId: input1.cycleId,
        name: input1.name,
        facilitatorId: input1.facilitatorId,
        participantIds: input1.participantIds.map((id) => id.value),
        scheduledAt: input1.scheduledAt,
        status: 'SCHEDULED',
        department: input1.department,
      }

      const savedSession2: CalibrationSession = {
        id: 'session-2',
        cycleId: input2.cycleId,
        name: input2.name,
        facilitatorId: input2.facilitatorId,
        participantIds: input2.participantIds.map((id) => id.value),
        scheduledAt: input2.scheduledAt,
        status: 'SCHEDULED',
        department: input2.department,
      }

      mockCalibrationSessionRepository.save
        .mockResolvedValueOnce(savedSession1)
        .mockResolvedValueOnce(savedSession2)

      // Act
      const result1 = await useCase.execute(input1)
      const result2 = await useCase.execute(input2)

      // Assert
      expect(result1.id).not.toBe(result2.id)
      expect(result1.name).toBe('Engineering Calibration Session')
      expect(result2.name).toBe('Product Calibration Session')
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledTimes(2)
    })

    it('should handle sessions scheduled at different times', async () => {
      // Arrange
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = [UserId.generate(), UserId.generate()]

      const dates = [
        new Date('2026-02-15T09:00:00Z'),
        new Date('2026-02-15T14:00:00Z'),
        new Date('2026-02-15T16:30:00Z'),
      ]

      const cycle = createValidCycle()
      mockReviewCycleRepository.findById.mockResolvedValue(cycle)

      // Act & Assert
      for (let i = 0; i < dates.length; i++) {
        const input: CreateCalibrationSessionInput = {
          cycleId,
          name: `Session ${i + 1}`,
          facilitatorId,
          participantIds,
          scheduledAt: dates[i],
          department: 'Engineering',
        }

        const savedSession: CalibrationSession = {
          id: `session-${i}`,
          cycleId: input.cycleId,
          name: input.name,
          facilitatorId: input.facilitatorId,
          participantIds: input.participantIds.map((id) => id.value),
          scheduledAt: input.scheduledAt,
          status: 'SCHEDULED',
          department: input.department,
        }

        mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

        const result = await useCase.execute(input)

        expect(result.scheduledAt).toEqual(dates[i])
      }
    })
  })
})
