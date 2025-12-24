import { Injectable, Inject } from '@nestjs/common'
import { IScoreAdjustmentRequestRepository } from '../../../domain/repositories/score-adjustment-request.repository.interface'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { ReviewScoreAdjustmentInput, ReviewScoreAdjustmentOutput } from '../../dto/final-score.dto'

@Injectable()
export class ReviewScoreAdjustmentUseCase {
  constructor(
    @Inject('IScoreAdjustmentRequestRepository')
    private readonly scoreAdjustmentRequestRepository: IScoreAdjustmentRequestRepository,
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
  ) {}

  async execute(input: ReviewScoreAdjustmentInput): Promise<ReviewScoreAdjustmentOutput> {
    // 1. Get score adjustment request
    const request = await this.scoreAdjustmentRequestRepository.findById(input.requestId)
    if (!request) {
      throw new ReviewNotFoundException('Score adjustment request not found')
    }

    // 2. Validate status
    if (request.status !== 'PENDING') {
      throw new Error('Score adjustment request has already been reviewed')
    }

    // 3. Update request status
    const reviewedAt = new Date()
    request.status = input.action
    request.approverId = input.approverId
    request.reviewedAt = reviewedAt

    if (input.action === 'REJECTED') {
      if (!input.rejectionReason) {
        throw new Error('Rejection reason is required when rejecting a request')
      }
      request.rejectionReason = input.rejectionReason
    }

    // 4. If approved, update final score
    if (input.action === 'APPROVED') {
      const finalScore = await this.finalScoreRepository.findByUserAndCycle(
        request.employeeId,
        request.cycleId,
      )
      if (finalScore) {
        // Update manager evaluation scores first
        const managerEval = await this.managerEvaluationRepository.findByEmployeeAndCycle(
          request.employeeId,
          request.cycleId,
        )
        if (managerEval) {
          const newScores = PillarScores.create(request.proposedScores.toPlainObject())
          managerEval.applyCalibrationAdjustment(
            newScores,
            `Score adjustment approved: ${request.reason}`,
          )
          await this.managerEvaluationRepository.save(managerEval)
        }

        // Final score will be recalculated automatically
        await this.finalScoreRepository.save(finalScore)
      }
    }

    // 5. Save updated request
    const updatedRequest = await this.scoreAdjustmentRequestRepository.save(request)

    // 6. Return DTO
    return {
      id: updatedRequest.id,
      status: updatedRequest.status,
      reviewedAt,
      approvedBy: input.approverId.value,
    }
  }
}
