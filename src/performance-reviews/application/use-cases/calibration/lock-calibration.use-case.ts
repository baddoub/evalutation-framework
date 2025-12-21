import { Injectable, Inject } from '@nestjs/common';
import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface';
import { CalibrationSessionId } from '../../../domain/value-objects/calibration-session-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { GetCalibrationSessionOutput } from './get-calibration-session.use-case';

export interface LockCalibrationInput {
  sessionId: CalibrationSessionId;
  lockedBy: UserId;
}

@Injectable()
export class LockCalibrationUseCase {
  constructor(
    @Inject('ICalibrationSessionRepository')
    private readonly calibrationSessionRepository: ICalibrationSessionRepository,
  ) {}

  async execute(input: LockCalibrationInput): Promise<GetCalibrationSessionOutput> {
    const session = await this.calibrationSessionRepository.findById(input.sessionId.value);

    if (!session) {
      throw new Error('Calibration session not found');
    }

    // Lock the session by updating its status and completion timestamp
    const lockedSession = {
      ...session,
      status: 'COMPLETED' as const,
      completedAt: new Date(),
    };

    const saved = await this.calibrationSessionRepository.save(lockedSession);

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
