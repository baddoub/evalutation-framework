import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { LockCalibrationUseCase } from './lock-calibration.use-case'
import type { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface'
import type { CalibrationSession } from '../../../domain/repositories/calibration-session.repository.interface'
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'

describe('LockCalibrationUseCase', () => {
  let useCase: LockCalibrationUseCase
  let calibrationSessionRepo: jest.Mocked<ICalibrationSessionRepository>

  const validSessionId = '550e8400-e29b-41d4-a716-446655440000'
  const validCycleId = '660e8400-e29b-41d4-a716-446655440001'
  const validUserId = '770e8400-e29b-41d4-a716-446655440002'
  const validFacilitatorId = '880e8400-e29b-41d4-a716-446655440003'

  beforeEach(async () => {
    const mockCalibrationSessionRepo = {
      findById: jest.fn(),
      findByCycle: jest.fn(),
      findByDepartment: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockCalibrationUseCase,
        {
          provide: 'ICalibrationSessionRepository',
          useValue: mockCalibrationSessionRepo,
        },
      ],
    }).compile()

    useCase = module.get<LockCalibrationUseCase>(LockCalibrationUseCase)
    calibrationSessionRepo = module.get('ICalibrationSessionRepository')
  })

  const createMockSession = (
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' = 'IN_PROGRESS',
  ): CalibrationSession => ({
    id: validSessionId,
    cycleId: ReviewCycleId.fromString(validCycleId),
    name: 'Engineering Calibration Q1 2025',
    department: 'Engineering',
    facilitatorId: UserId.fromString(validFacilitatorId),
    participantIds: [validUserId, validFacilitatorId],
    scheduledAt: new Date('2025-04-15T10:00:00Z'),
    status,
    notes: 'Initial calibration notes',
  })

  describe('Happy Path - Locking Calibration', () => {
    it('should successfully lock a calibration session', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      const completedDate = new Date('2025-04-16T10:00:00Z')
      const lockedSession = {
        ...session,
        status: 'COMPLETED' as const,
        completedAt: completedDate,
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockResolvedValue(lockedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(validSessionId)
      expect(result.status).toBe('COMPLETED')
      expect(result.lockedAt).toBeInstanceOf(Date)
      expect(result.lockedBy).toBe(validFacilitatorId)
    })

    it('should change session status from IN_PROGRESS to COMPLETED', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      expect(session.status).toBe('IN_PROGRESS')

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.status).toBe('COMPLETED')
      expect(calibrationSessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      )
    })

    it('should set completedAt timestamp when locking', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      const beforeTime = new Date()

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      await useCase.execute({ sessionId, lockedBy })

      const afterTime = new Date()

      // Assert
      const saveCall = calibrationSessionRepo.save.mock.calls[0][0]
      expect(saveCall.completedAt).toBeDefined()
      expect(saveCall.completedAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(saveCall.completedAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should save the locked session to repository', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(calibrationSessionRepo.save).toHaveBeenCalledTimes(1)
      expect(calibrationSessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: validSessionId,
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      )
    })

    it('should return correct output DTO structure', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('cycleId')
      expect(result).toHaveProperty('department')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('notes')
      expect(result).toHaveProperty('lockedAt')
      expect(result).toHaveProperty('lockedBy')
      expect(result).toHaveProperty('participants')
      expect(result).toHaveProperty('evaluations')
      expect(result).toHaveProperty('createdAt')
    })

    it('should preserve session data during lock', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.id).toBe(session.id)
      expect(result.cycleId).toBe(session.cycleId.value)
      expect(result.department).toBe(session.department)
      expect(result.notes).toBe(session.notes)
    })

    it('should map participants correctly in output', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.participants).toHaveLength(2)
      expect(result.participants[0]).toHaveProperty('userId')
      expect(result.participants[0]).toHaveProperty('userName')
      expect(result.participants[0]).toHaveProperty('role')
      expect(result.participants[0].userId).toBe(validUserId)
    })

    it('should return empty evaluations array', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.evaluations).toEqual([])
    })

    it('should use scheduledAt as createdAt in output', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.createdAt).toEqual(session.scheduledAt)
    })
  })

  describe('Error Handling - Session Not Found', () => {
    it('should throw error when calibration session is not found', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ sessionId, lockedBy })).rejects.toThrow(
        'Calibration session not found',
      )
    })

    it('should not save when session is not found', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute({ sessionId, lockedBy })).rejects.toThrow()
      expect(calibrationSessionRepo.save).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases - Already Locked Session', () => {
    it('should lock a session that is already COMPLETED', async () => {
      // Arrange
      const session = createMockSession('COMPLETED')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      session.completedAt = new Date('2025-04-15T12:00:00Z')

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.status).toBe('COMPLETED')
      expect(result.lockedAt).toBeInstanceOf(Date)
    })

    it('should update completedAt even if session was already COMPLETED', async () => {
      // Arrange
      const session = createMockSession('COMPLETED')
      const oldCompletedAt = new Date('2025-04-15T12:00:00Z')
      session.completedAt = oldCompletedAt

      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      await useCase.execute({ sessionId, lockedBy })

      // Assert
      const saveCall = calibrationSessionRepo.save.mock.calls[0][0]
      expect(saveCall.completedAt).not.toEqual(oldCompletedAt)
      expect(saveCall.completedAt!.getTime()).toBeGreaterThan(oldCompletedAt.getTime())
    })
  })

  describe('Edge Cases - SCHEDULED Status', () => {
    it('should lock a session with SCHEDULED status', async () => {
      // Arrange
      const session = createMockSession('SCHEDULED')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.status).toBe('COMPLETED')
      expect(result.lockedAt).toBeInstanceOf(Date)
    })
  })

  describe('Edge Cases - Optional Fields', () => {
    it('should handle session without department', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      delete session.department

      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.department).toBe('')
    })

    it('should handle session without notes', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      delete session.notes

      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.notes).toBe('')
    })

    it('should handle session with empty participant list', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      session.participantIds = []

      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.participants).toEqual([])
    })
  })

  describe('Repository Integration', () => {
    it('should call repository methods in correct order', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      const callOrder: string[] = []

      calibrationSessionRepo.findById.mockImplementation(async () => {
        callOrder.push('findById')
        return session
      })

      calibrationSessionRepo.save.mockImplementation(async (savedSession) => {
        callOrder.push('save')
        return savedSession
      })

      // Act
      await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(callOrder).toEqual(['findById', 'save'])
    })

    it('should call findById with correct session ID', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(calibrationSessionRepo.findById).toHaveBeenCalledTimes(1)
      expect(calibrationSessionRepo.findById).toHaveBeenCalledWith(validSessionId)
    })

    it('should only call findById and save once per execution', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(calibrationSessionRepo.findById).toHaveBeenCalledTimes(1)
      expect(calibrationSessionRepo.save).toHaveBeenCalledTimes(1)
      expect(calibrationSessionRepo.findByCycle).not.toHaveBeenCalled()
      expect(calibrationSessionRepo.findByDepartment).not.toHaveBeenCalled()
    })

    it('should handle repository save returning updated session', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      const completedDate = new Date('2025-04-16T10:00:00Z')

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (sessionToSave) => ({
        ...sessionToSave,
        completedAt: completedDate,
      }))

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.status).toBe('COMPLETED')
      expect(result.lockedAt).toEqual(completedDate)
    })
  })

  describe('Input Validation', () => {
    it('should accept valid CalibrationSessionId value object', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(calibrationSessionRepo.findById).toHaveBeenCalledWith(sessionId.value)
    })

    it('should accept valid UserId value object for lockedBy', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act & Assert
      await expect(useCase.execute({ sessionId, lockedBy })).resolves.toBeDefined()
    })
  })

  describe('Output DTO Mapping', () => {
    it('should map lockedAt from completedAt field', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      const completedDate = new Date('2025-04-16T14:30:00Z')

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => ({
        ...savedSession,
        completedAt: completedDate,
      }))

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.lockedAt).toEqual(completedDate)
    })

    it('should map lockedBy from facilitatorId', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.lockedBy).toBe(session.facilitatorId.value)
    })

    it('should map cycleId as string value', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.cycleId).toBe(validCycleId)
      expect(typeof result.cycleId).toBe('string')
    })
  })

  describe('Business Logic - State Transitions', () => {
    it('should transition from SCHEDULED to COMPLETED', async () => {
      // Arrange
      const session = createMockSession('SCHEDULED')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      expect(session.status).toBe('SCHEDULED')

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.status).toBe('COMPLETED')
    })

    it('should transition from IN_PROGRESS to COMPLETED', async () => {
      // Arrange
      const session = createMockSession('IN_PROGRESS')
      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      expect(session.status).toBe('IN_PROGRESS')

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.status).toBe('COMPLETED')
    })

    it('should allow re-locking an already COMPLETED session', async () => {
      // Arrange
      const session = createMockSession('COMPLETED')
      session.completedAt = new Date('2025-04-15T10:00:00Z')

      const sessionId = CalibrationSessionId.create(validSessionId)
      const lockedBy = UserId.fromString(validUserId)

      calibrationSessionRepo.findById.mockResolvedValue(session)
      calibrationSessionRepo.save.mockImplementation(async (savedSession) => savedSession)

      // Act
      const result = await useCase.execute({ sessionId, lockedBy })

      // Assert
      expect(result.status).toBe('COMPLETED')
      expect(calibrationSessionRepo.save).toHaveBeenCalled()
    })
  })
})
