import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { GetCalibrationSessionUseCase } from './get-calibration-session.use-case'
import type {
  ICalibrationSessionRepository,
  CalibrationSession,
} from '../../../domain/repositories/calibration-session.repository.interface'
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'

describe('GetCalibrationSessionUseCase', () => {
  let useCase: GetCalibrationSessionUseCase
  let calibrationSessionRepo: jest.Mocked<ICalibrationSessionRepository>

  const validSessionId = '550e8400-e29b-41d4-a716-446655440000'
  const validCycleId = '550e8400-e29b-41d4-a716-446655440001'
  const validUserId = '550e8400-e29b-41d4-a716-446655440002'
  const validParticipantId = '550e8400-e29b-41d4-a716-446655440003'

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
        GetCalibrationSessionUseCase,
        { provide: 'ICalibrationSessionRepository', useValue: mockCalibrationSessionRepo },
      ],
    }).compile()

    useCase = module.get<GetCalibrationSessionUseCase>(GetCalibrationSessionUseCase)
    calibrationSessionRepo = module.get('ICalibrationSessionRepository')
  })

  describe('execute', () => {
    it('should successfully retrieve a calibration session by ID', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Engineering Department Calibration',
        department: 'Engineering',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [validParticipantId],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
        notes: 'Initial calibration session',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result!.id).toBe(validSessionId)
      expect(result!.cycleId).toBe(validCycleId)
      expect(result!.department).toBe('Engineering')
      expect(result!.status).toBe('SCHEDULED')
    })

    it('should return null when calibration session is not found', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      calibrationSessionRepo.findById.mockResolvedValue(null)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result).toBeNull()
    })

    it('should call repository findById with correct session ID', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      await useCase.execute(sessionId)

      // Assert
      expect(calibrationSessionRepo.findById).toHaveBeenCalledTimes(1)
      expect(calibrationSessionRepo.findById).toHaveBeenCalledWith(validSessionId)
    })

    it('should return DTO with all required fields', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Engineering Calibration',
        department: 'Engineering',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [validParticipantId],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
        notes: 'Test notes',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('cycleId')
      expect(result).toHaveProperty('department')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('notes')
      expect(result).toHaveProperty('participants')
      expect(result).toHaveProperty('evaluations')
      expect(result).toHaveProperty('createdAt')
    })

    it('should handle session with undefined department', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.department).toBe('')
    })

    it('should handle session with undefined notes', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.notes).toBe('')
    })

    it('should return SCHEDULED status for scheduled session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.status).toBe('SCHEDULED')
    })

    it('should return IN_PROGRESS status for in-progress session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'IN_PROGRESS',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.status).toBe('IN_PROGRESS')
    })

    it('should return COMPLETED status for completed session with completedAt date', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const completedAt = new Date('2025-04-15')
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        completedAt,
        status: 'COMPLETED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.status).toBe('COMPLETED')
      expect(result!.lockedAt).toEqual(completedAt)
    })

    it('should handle undefined completedAt for non-completed session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.lockedAt).toBeUndefined()
    })

    it('should map facilitatorId to lockedBy field', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.lockedBy).toBe(validUserId)
    })

    it('should map scheduledAt to createdAt field', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const scheduledAt = new Date('2025-04-01T10:00:00Z')
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt,
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.createdAt).toEqual(scheduledAt)
    })

    it('should map participant IDs to participants array with empty userName and role', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const participant1 = '550e8400-e29b-41d4-a716-446655440010'
      const participant2 = '550e8400-e29b-41d4-a716-446655440011'
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [participant1, participant2],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.participants).toHaveLength(2)
      expect(result!.participants[0]).toEqual({
        userId: participant1,
        userName: '',
        role: '',
      })
      expect(result!.participants[1]).toEqual({
        userId: participant2,
        userName: '',
        role: '',
      })
    })

    it('should handle empty participants array', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.participants).toEqual([])
    })

    it('should return empty evaluations array (TODO implementation)', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.evaluations).toEqual([])
    })

    it('should handle session with multiple participants', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const participantIds = [
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011',
        '550e8400-e29b-41d4-a716-446655440012',
        '550e8400-e29b-41d4-a716-446655440013',
        '550e8400-e29b-41d4-a716-446655440014',
      ]
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds,
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.participants).toHaveLength(5)
      participantIds.forEach((participantId, index) => {
        expect(result!.participants[index].userId).toBe(participantId)
      })
    })

    it('should handle different department names', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const departments = ['Engineering', 'Product', 'Sales', 'Marketing']

      for (const department of departments) {
        const session: CalibrationSession = {
          id: validSessionId,
          cycleId: ReviewCycleId.create(validCycleId),
          name: `${department} Calibration`,
          department,
          facilitatorId: UserId.fromString(validUserId),
          participantIds: [],
          scheduledAt: new Date('2025-04-01'),
          status: 'SCHEDULED',
        }

        calibrationSessionRepo.findById.mockResolvedValue(session)

        // Act
        const result = await useCase.execute(sessionId)

        // Assert
        expect(result!.department).toBe(department)
      }
    })

    it('should only call repository once per execution', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      await useCase.execute(sessionId)

      // Assert
      expect(calibrationSessionRepo.findById).toHaveBeenCalledTimes(1)
      expect(calibrationSessionRepo.findByCycle).not.toHaveBeenCalled()
      expect(calibrationSessionRepo.findByDepartment).not.toHaveBeenCalled()
    })

    it('should handle session with notes containing special characters', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const specialNotes = 'Notes with "quotes" and \'apostrophes\' & symbols'
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
        notes: specialNotes,
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.notes).toBe(specialNotes)
    })

    it('should handle session with very long notes', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const longNotes = 'word '.repeat(1000)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
        notes: longNotes,
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.notes).toBe(longNotes)
    })

    it('should throw CalibrationSessionId error for empty session ID', () => {
      // Arrange & Act & Assert
      expect(() => CalibrationSessionId.fromString('')).toThrow(
        'CalibrationSessionId cannot be empty',
      )
    })

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const error = new Error('Database connection failed')
      calibrationSessionRepo.findById.mockRejectedValue(error)

      // Act & Assert
      await expect(useCase.execute(sessionId)).rejects.toThrow('Database connection failed')
    })

    it('should propagate repository errors without modification', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const originalError = new Error('Original error message')
      calibrationSessionRepo.findById.mockRejectedValue(originalError)

      // Act & Assert
      await expect(useCase.execute(sessionId)).rejects.toBe(originalError)
    })

    it('should handle timeout errors from repository', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const timeoutError = new Error('Repository timeout')
      calibrationSessionRepo.findById.mockRejectedValue(timeoutError)

      // Act & Assert
      await expect(useCase.execute(sessionId)).rejects.toThrow('Repository timeout')
    })

    it('should handle session with different cycleIds correctly', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const cycleId1 = '550e8400-e29b-41d4-a716-446655440020'
      const cycleId2 = '550e8400-e29b-41d4-a716-446655440021'

      const session1: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(cycleId1),
        name: 'Test Session 1',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session1)

      // Act
      const result1 = await useCase.execute(sessionId)

      // Assert
      expect(result1!.cycleId).toBe(cycleId1)

      // Arrange for second test
      const session2: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(cycleId2),
        name: 'Test Session 2',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session2)

      // Act
      const result2 = await useCase.execute(sessionId)

      // Assert
      expect(result2!.cycleId).toBe(cycleId2)
    })

    it('should maintain data integrity across retrieval', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const scheduledAt = new Date('2025-04-01T10:00:00Z')
      const completedAt = new Date('2025-04-15T10:00:00Z')
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Engineering Calibration',
        department: 'Engineering',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [validParticipantId],
        scheduledAt,
        completedAt,
        status: 'COMPLETED',
        notes: 'Comprehensive notes',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(result!.id).toBe(session.id)
      expect(result!.cycleId).toBe(session.cycleId.value)
      expect(result!.department).toBe(session.department)
      expect(result!.status).toBe(session.status)
      expect(result!.notes).toBe(session.notes)
      expect(result!.lockedAt).toEqual(session.completedAt)
      expect(result!.lockedBy).toBe(session.facilitatorId.value)
      expect(result!.createdAt).toEqual(session.scheduledAt)
    })

    it('should handle multiple sequential calls with different session IDs', async () => {
      // Arrange
      const sessionId1 = CalibrationSessionId.create('550e8400-e29b-41d4-a716-446655440100')
      const sessionId2 = CalibrationSessionId.create('550e8400-e29b-41d4-a716-446655440101')

      const session1: CalibrationSession = {
        id: sessionId1.value,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Session 1',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-01'),
        status: 'SCHEDULED',
      }

      const session2: CalibrationSession = {
        id: sessionId2.value,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Session 2',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [],
        scheduledAt: new Date('2025-04-02'),
        status: 'IN_PROGRESS',
      }

      calibrationSessionRepo.findById.mockResolvedValueOnce(session1)
      calibrationSessionRepo.findById.mockResolvedValueOnce(session2)

      // Act
      const result1 = await useCase.execute(sessionId1)
      const result2 = await useCase.execute(sessionId2)

      // Assert
      expect(result1!.id).toBe(sessionId1.value)
      expect(result2!.id).toBe(sessionId2.value)
      expect(result1!.status).toBe('SCHEDULED')
      expect(result2!.status).toBe('IN_PROGRESS')
    })

    it('should handle session name with various formats', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const sessionNames = [
        'Q1 Engineering Calibration',
        '2025 Performance Review - Engineering',
        'Engineering Department - Mid-Year Review',
        'Calibration Session #123',
      ]

      for (const name of sessionNames) {
        const session: CalibrationSession = {
          id: validSessionId,
          cycleId: ReviewCycleId.create(validCycleId),
          name,
          facilitatorId: UserId.fromString(validUserId),
          participantIds: [],
          scheduledAt: new Date('2025-04-01'),
          status: 'SCHEDULED',
        }

        calibrationSessionRepo.findById.mockResolvedValue(session)

        // Act
        const result = await useCase.execute(sessionId)

        // Assert - the name is not returned in the DTO, but we verify the session was retrieved
        expect(result).toBeDefined()
        expect(result!.id).toBe(validSessionId)
      }
    })

    it('should return DTO matching GetCalibrationSessionOutput interface', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create(validSessionId)
      const session: CalibrationSession = {
        id: validSessionId,
        cycleId: ReviewCycleId.create(validCycleId),
        name: 'Test Session',
        department: 'Engineering',
        facilitatorId: UserId.fromString(validUserId),
        participantIds: [validParticipantId],
        scheduledAt: new Date('2025-04-01'),
        completedAt: new Date('2025-04-15'),
        status: 'COMPLETED',
        notes: 'Test notes',
      }

      calibrationSessionRepo.findById.mockResolvedValue(session)

      // Act
      const result = await useCase.execute(sessionId)

      // Assert
      expect(typeof result!.id).toBe('string')
      expect(typeof result!.cycleId).toBe('string')
      expect(typeof result!.department).toBe('string')
      expect(typeof result!.status).toBe('string')
      expect(typeof result!.notes).toBe('string')
      expect(result!.lockedAt instanceof Date).toBe(true)
      expect(typeof result!.lockedBy).toBe('string')
      expect(Array.isArray(result!.participants)).toBe(true)
      expect(Array.isArray(result!.evaluations)).toBe(true)
      expect(result!.createdAt instanceof Date).toBe(true)
    })
  })
})
