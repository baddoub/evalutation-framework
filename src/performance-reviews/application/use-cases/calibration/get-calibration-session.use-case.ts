import { Injectable, Inject } from '@nestjs/common'
import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface'
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo'

export interface GetCalibrationSessionOutput {
  id: string
  cycleId: string
  department: string
  status: string
  notes: string
  lockedAt?: Date
  lockedBy?: string
  participants: Array<{
    userId: string
    userName: string
    role: string
  }>
  evaluations: Array<{
    evaluationId: string
    employeeId: string
    employeeName: string
    currentLevel: string
    proposedLevel: string
    scores: {
      projectImpact: number
      direction: number
      engineeringExcellence: number
      operationalOwnership: number
      peopleImpact: number
    }
  }>
  createdAt: Date
}

@Injectable()
export class GetCalibrationSessionUseCase {
  constructor(
    @Inject('ICalibrationSessionRepository')
    private readonly calibrationSessionRepository: ICalibrationSessionRepository,
  ) {}

  async execute(sessionId: CalibrationSessionId): Promise<GetCalibrationSessionOutput | null> {
    const session = await this.calibrationSessionRepository.findById(sessionId.value)

    if (!session) {
      return null
    }

    return {
      id: session.id,
      cycleId: session.cycleId.value,
      department: session.department || '',
      status: session.status,
      notes: session.notes || '',
      lockedAt: session.completedAt,
      lockedBy: session.facilitatorId.value,
      participants: session.participantIds.map((participantId) => ({
        userId: participantId,
        userName: '', // TODO: Fetch from user repository
        role: '', // TODO: Determine role
      })),
      evaluations: [], // TODO: Fetch evaluations for this session
      createdAt: session.scheduledAt,
    }
  }
}
