import { Injectable, Inject } from '@nestjs/common'
import { ICalibrationSessionRepository, CalibrationSession } from '../../../domain/repositories/calibration-session.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { CreateCalibrationSessionInput, CreateCalibrationSessionOutput } from '../../dto/final-score.dto'

@Injectable()
export class CreateCalibrationSessionUseCase {
  constructor(
    @Inject('ICalibrationSessionRepository')
    private readonly calibrationSessionRepository: ICalibrationSessionRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: CreateCalibrationSessionInput): Promise<CreateCalibrationSessionOutput> {
    // 1. Validate cycle
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Create session
    const session: CalibrationSession = {
      id: require('crypto').randomUUID(),
      cycleId: input.cycleId,
      name: input.name,
      facilitatorId: input.facilitatorId,
      participantIds: input.participantIds.map(id => id.value),
      scheduledAt: input.scheduledAt,
      status: 'SCHEDULED',
      department: input.department,
    }

    // 3. Persist
    const savedSession = await this.calibrationSessionRepository.save(session)

    // 4. Return DTO
    return {
      id: savedSession.id,
      name: savedSession.name,
      status: savedSession.status,
      scheduledAt: savedSession.scheduledAt,
      participantCount: savedSession.participantIds.length,
    }
  }
}
