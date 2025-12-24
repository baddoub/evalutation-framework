import { Injectable, Inject } from '@nestjs/common'
import {
  IScoreAdjustmentRequestRepository,
  ScoreAdjustmentRequest,
} from '../../../domain/repositories/score-adjustment-request.repository.interface'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import {
  RequestScoreAdjustmentInput,
  RequestScoreAdjustmentOutput,
} from '../../dto/final-score.dto'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'

@Injectable()
export class RequestScoreAdjustmentUseCase {
  constructor(
    @Inject('IScoreAdjustmentRequestRepository')
    private readonly scoreAdjustmentRequestRepository: IScoreAdjustmentRequestRepository,
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RequestScoreAdjustmentInput): Promise<RequestScoreAdjustmentOutput> {
    // 1. Validate cycle
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Validate final scores are locked
    const finalScore = await this.finalScoreRepository.findByUserAndCycle(
      input.employeeId,
      input.cycleId,
    )
    if (!finalScore) {
      throw new ReviewNotFoundException('Final score not found')
    }

    if (!finalScore.isLocked) {
      throw new Error('Cannot request score adjustment until final scores are locked')
    }

    // 3. Verify manager-employee relationship
    const employee = await this.userRepository.findById(input.employeeId)
    if (!employee) {
      throw new ReviewNotFoundException('Employee not found')
    }

    if (employee.managerId !== input.managerId.value) {
      throw new Error('You can only request adjustments for your direct reports')
    }

    // 4. Create adjustment request
    const request: ScoreAdjustmentRequest = {
      id: require('crypto').randomUUID(),
      cycleId: input.cycleId,
      employeeId: input.employeeId,
      requesterId: input.managerId,
      reason: input.reason,
      status: 'PENDING',
      proposedScores: PillarScores.create({
        projectImpact: input.proposedScores.projectImpact,
        direction: input.proposedScores.direction,
        engineeringExcellence: input.proposedScores.engineeringExcellence,
        operationalOwnership: input.proposedScores.operationalOwnership,
        peopleImpact: input.proposedScores.peopleImpact,
      }),
      requestedAt: new Date(),
      approve: () => {},
      reject: () => {},
    }

    // 5. Save request
    const savedRequest = await this.scoreAdjustmentRequestRepository.save(request)

    // 6. Return DTO
    return {
      id: savedRequest.id,
      employeeId: savedRequest.employeeId.value,
      status: savedRequest.status,
      reason: savedRequest.reason,
      requestedAt: savedRequest.requestedAt,
    }
  }
}
