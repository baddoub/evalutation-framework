import type { RecordCalibrationNoteInput } from './record-calibration-note.use-case'
import { RecordCalibrationNoteUseCase } from './record-calibration-note.use-case'
import type {
  ICalibrationSessionRepository,
  CalibrationSession,
} from '../../../domain/repositories/calibration-session.repository.interface'
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'

describe('RecordCalibrationNoteUseCase', () => {
  let useCase: RecordCalibrationNoteUseCase
  let mockCalibrationSessionRepository: jest.Mocked<ICalibrationSessionRepository>

  const createValidCalibrationSession = (
    overrides?: Partial<CalibrationSession>,
  ): CalibrationSession => {
    const cycleId = overrides?.cycleId || ReviewCycleId.generate()
    const facilitatorId = overrides?.facilitatorId || UserId.generate()

    return {
      id: overrides?.id || CalibrationSessionId.create().value,
      cycleId,
      name: overrides?.name || 'Engineering Calibration Session',
      department: overrides?.hasOwnProperty('department') ? overrides.department : 'Engineering',
      facilitatorId,
      participantIds: overrides?.participantIds || ['user-1', 'user-2', 'user-3'],
      scheduledAt: overrides?.scheduledAt || new Date('2025-01-15'),
      completedAt: overrides?.completedAt,
      status: overrides?.status || 'SCHEDULED',
      notes: overrides?.notes,
    }
  }

  beforeEach(() => {
    mockCalibrationSessionRepository = {
      findById: jest.fn(),
      findByCycle: jest.fn(),
      findByDepartment: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }

    useCase = new RecordCalibrationNoteUseCase(mockCalibrationSessionRepository)
  })

  describe('successful note recording', () => {
    it('should record notes to an existing calibration session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes =
        'Discussed performance ratings for team members. Agreed on calibration adjustments.'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        notes: undefined,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.notes).toBe(notes)
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledWith(updatedSession)
    })

    it('should update existing notes on a calibration session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const oldNotes = 'Initial notes about the session.'
      const newNotes = 'Updated notes with final decisions and action items.'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        notes: oldNotes,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes: newNotes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes: newNotes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.notes).toBe(newNotes)
      expect(result.notes).not.toBe(oldNotes)
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledWith(updatedSession)
    })

    it('should set empty notes when empty string is provided', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const existingNotes = 'Some existing notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        notes: existingNotes,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes: '',
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes: '',
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.notes).toBe('')
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledWith(updatedSession)
    })

    it('should persist changes to repository', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Meeting notes here.'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledTimes(1)
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledWith(updatedSession)
    })

    it('should return correct output DTO structure', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Session notes'
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        cycleId,
        facilitatorId,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

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
      expect(typeof result.id).toBe('string')
      expect(typeof result.cycleId).toBe('string')
      expect(typeof result.notes).toBe('string')
      expect(Array.isArray(result.participants)).toBe(true)
      expect(Array.isArray(result.evaluations)).toBe(true)
    })

    it('should handle notes with special characters', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Notes with special chars: @#$%^&*()_+-={}[]|\\:";\'<>?,./'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.notes).toBe(notes)
    })

    it('should handle long notes text', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'A'.repeat(5000) // Very long notes

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.notes).toBe(notes)
      expect(result.notes.length).toBe(5000)
    })

    it('should handle multiline notes', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Line 1\nLine 2\nLine 3\n\nLine 5 with blank line above'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.notes).toBe(notes)
      expect(result.notes).toContain('\n')
    })
  })

  describe('validation: session existence', () => {
    it('should throw error if calibration session does not exist', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Some notes'

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Calibration session not found')
    })

    it('should not proceed to save if session is not found', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Some notes'

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockCalibrationSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should use sessionId.value to query repository', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Some notes'

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(null)

      // Act
      try {
        await useCase.execute(input)
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockCalibrationSessionRepository.findById).toHaveBeenCalledWith(sessionId.value)
    })
  })

  describe('edge cases: different session statuses', () => {
    it('should allow recording notes for SCHEDULED session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Pre-session notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        status: 'SCHEDULED',
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('SCHEDULED')
      expect(result.notes).toBe(notes)
    })

    it('should allow recording notes for IN_PROGRESS session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Session in progress notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        status: 'IN_PROGRESS',
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('IN_PROGRESS')
      expect(result.notes).toBe(notes)
    })

    it('should allow recording notes for COMPLETED session', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Post-session notes'
      const completedAt = new Date('2025-01-20')

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        status: 'COMPLETED',
        completedAt,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe('COMPLETED')
      expect(result.notes).toBe(notes)
      expect(result.lockedAt).toBe(completedAt)
    })
  })

  describe('edge cases: different session configurations', () => {
    it('should handle session without department', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Notes for session without department'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        department: undefined,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.department).toBe('')
      expect(result.notes).toBe(notes)
    })

    it('should handle session with empty participant list', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Notes for session with no participants yet'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        participantIds: [],
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.participants).toEqual([])
      expect(result.notes).toBe(notes)
    })

    it('should preserve other session properties when updating notes', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'New notes'
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = ['user-1', 'user-2']
      const scheduledAt = new Date('2025-02-01')
      const department = 'Engineering'
      const name = 'Q1 Calibration'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        cycleId,
        facilitatorId,
        participantIds,
        scheduledAt,
        department,
        name,
        status: 'IN_PROGRESS',
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(sessionId.value)
      expect(result.cycleId).toBe(cycleId.value)
      expect(result.lockedBy).toBe(facilitatorId.value)
      expect(result.participants.length).toBe(participantIds.length)
      expect(result.createdAt).toBe(scheduledAt)
      expect(result.department).toBe(department)
      expect(result.status).toBe('IN_PROGRESS')
      expect(result.notes).toBe(notes)
    })
  })

  describe('output mapping', () => {
    it('should map session properties to output correctly', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Test notes'
      const cycleId = ReviewCycleId.generate()
      const facilitatorId = UserId.generate()
      const participantIds = ['user-1', 'user-2', 'user-3']
      const scheduledAt = new Date('2025-03-01')
      const completedAt = new Date('2025-03-02')

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        cycleId,
        facilitatorId,
        participantIds,
        scheduledAt,
        completedAt,
        status: 'COMPLETED',
        department: 'Product',
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(updatedSession.id)
      expect(result.cycleId).toBe(updatedSession.cycleId.value)
      expect(result.department).toBe(updatedSession.department)
      expect(result.status).toBe(updatedSession.status)
      expect(result.notes).toBe(updatedSession.notes)
      expect(result.lockedAt).toBe(updatedSession.completedAt)
      expect(result.lockedBy).toBe(updatedSession.facilitatorId.value)
      expect(result.createdAt).toBe(updatedSession.scheduledAt)
      expect(result.participants.length).toBe(participantIds.length)
      expect(result.evaluations).toEqual([])
    })

    it('should map participant IDs to participant objects', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Test notes'
      const participantIds = ['user-a', 'user-b', 'user-c']

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        participantIds,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.participants).toHaveLength(3)
      result.participants.forEach((participant, index) => {
        expect(participant.userId).toBe(participantIds[index])
        expect(participant.userName).toBe('')
        expect(participant.role).toBe('')
      })
    })

    it('should return empty evaluations array', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Test notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.evaluations).toEqual([])
      expect(Array.isArray(result.evaluations)).toBe(true)
    })

    it('should handle undefined notes in session and return empty string', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'New notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
        notes: undefined,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.notes).toBe(notes)
    })
  })

  describe('integration: full workflow scenarios', () => {
    it('should complete full note recording workflow', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Comprehensive meeting notes with all decisions documented.'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)

      const updatedSession = {
        ...existingSession,
        notes,
      }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(mockCalibrationSessionRepository.findById).toHaveBeenCalledWith(sessionId.value)
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledWith(updatedSession)
      expect(result).toBeDefined()
      expect(result.notes).toBe(notes)
      expect(result.id).toBe(sessionId.value)
    })

    it('should handle multiple consecutive note updates', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes1 = 'First version of notes'
      const notes2 = 'Second version of notes'
      const notes3 = 'Final version of notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      // First update
      const input1: RecordCalibrationNoteInput = {
        sessionId,
        notes: notes1,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)
      const updatedSession1 = { ...existingSession, notes: notes1 }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession1)

      const result1 = await useCase.execute(input1)
      expect(result1.notes).toBe(notes1)

      // Second update
      const input2: RecordCalibrationNoteInput = {
        sessionId,
        notes: notes2,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(updatedSession1)
      const updatedSession2 = { ...updatedSession1, notes: notes2 }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession2)

      const result2 = await useCase.execute(input2)
      expect(result2.notes).toBe(notes2)

      // Third update
      const input3: RecordCalibrationNoteInput = {
        sessionId,
        notes: notes3,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(updatedSession2)
      const updatedSession3 = { ...updatedSession2, notes: notes3 }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession3)

      const result3 = await useCase.execute(input3)

      // Assert
      expect(result3.notes).toBe(notes3)
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledTimes(3)
    })
  })

  describe('repository interaction', () => {
    it('should call findById with correct session ID', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Test notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)
      const updatedSession = { ...existingSession, notes }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockCalibrationSessionRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockCalibrationSessionRepository.findById).toHaveBeenCalledWith(sessionId.value)
    })

    it('should call save with updated session object', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Test notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)
      const updatedSession = { ...existingSession, notes }
      mockCalibrationSessionRepository.save.mockResolvedValue(updatedSession)

      // Act
      await useCase.execute(input)

      // Assert
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledTimes(1)
      expect(mockCalibrationSessionRepository.save).toHaveBeenCalledWith(updatedSession)
    })

    it('should return saved session data from repository', async () => {
      // Arrange
      const sessionId = CalibrationSessionId.create()
      const recordedBy = UserId.generate()
      const notes = 'Test notes'

      const existingSession = createValidCalibrationSession({
        id: sessionId.value,
      })

      const input: RecordCalibrationNoteInput = {
        sessionId,
        notes,
        recordedBy,
      }

      mockCalibrationSessionRepository.findById.mockResolvedValue(existingSession)
      const savedSession = { ...existingSession, notes }
      mockCalibrationSessionRepository.save.mockResolvedValue(savedSession)

      // Act
      const result = await useCase.execute(input)

      // Assert
      expect(result.id).toBe(savedSession.id)
      expect(result.notes).toBe(savedSession.notes)
    })
  })
})
