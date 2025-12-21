import { Injectable, Inject } from '@nestjs/common';
import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface';
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { GetCalibrationSessionOutput } from './get-calibration-session.use-case';

export interface RecordCalibrationNoteInput {
  sessionId: CalibrationSessionId;
  notes: string;
  recordedBy: UserId;
}

@Injectable()
export class RecordCalibrationNoteUseCase {
  constructor(
    @Inject('ICalibrationSessionRepository')
    private readonly calibrationSessionRepository: ICalibrationSessionRepository,
  ) {}

  async execute(input: RecordCalibrationNoteInput): Promise<GetCalibrationSessionOutput> {
    const session = await this.calibrationSessionRepository.findById(
      input.sessionId.value,
    );

    if (!session) {
      throw new Error('Calibration session not found');
    }

    // Update session notes
    const updatedSession = {
      ...session,
      notes: input.notes,
    };

    const saved = await this.calibrationSessionRepository.save(updatedSession);

    return {
      id: saved.id,
      cycleId: saved.cycleId.value,
      department: saved.department || '',
      status: saved.status,
      notes: saved.notes || '',
      lockedAt: saved.completedAt,
      lockedBy: saved.facilitatorId.value,
      participants: saved.participantIds.map((participantId) => ({
        userId: participantId,
        userName: '',
        role: '',
      })),
      evaluations: [],
      createdAt: saved.scheduledAt,
    };
  }
}
