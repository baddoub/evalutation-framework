import { Injectable, Inject } from '@nestjs/common'
import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface'
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { PeerFeedbackAggregationService } from '../../../domain/services/peer-feedback-aggregation.service'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { UnauthorizedReviewAccessException } from '../../../domain/exceptions/unauthorized-review-access.exception'
import { GetEmployeeReviewInput, GetEmployeeReviewOutput } from '../../dto/manager-evaluation.dto'

@Injectable()
export class GetEmployeeReviewUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('ISelfReviewRepository')
    private readonly selfReviewRepository: ISelfReviewRepository,
    @Inject('IPeerFeedbackRepository')
    private readonly peerFeedbackRepository: IPeerFeedbackRepository,
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
    private readonly aggregationService: PeerFeedbackAggregationService,
  ) {}

  async execute(input: GetEmployeeReviewInput): Promise<GetEmployeeReviewOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Get employee
    const employee = await this.userRepository.findById(input.employeeId)
    if (!employee) {
      throw new ReviewNotFoundException('Employee not found')
    }

    // 3. Authorize access
    const manager = await this.userRepository.findById(input.managerId)
    if (!manager) {
      throw new UnauthorizedReviewAccessException('Manager not found')
    }

    if (employee.managerId !== input.managerId.value) {
      throw new UnauthorizedReviewAccessException(
        'You can only view reviews of your direct reports',
      )
    }

    // 4. Get self-review
    const selfReview = await this.selfReviewRepository.findByUserAndCycle(
      input.employeeId,
      input.cycleId,
    )

    // 5. Get peer feedback
    const peerFeedback = await this.peerFeedbackRepository.findByRevieweeAndCycle(
      input.employeeId,
      input.cycleId,
    )

    // 6. Get manager evaluation
    const managerEval = await this.managerEvaluationRepository.findByEmployeeAndCycle(
      input.employeeId,
      input.cycleId,
    )

    // 7. Build response
    const selfScores = selfReview?.scores.toObject() || {
      projectImpact: 0,
      direction: 0,
      engineeringExcellence: 0,
      operationalOwnership: 0,
      peopleImpact: 0,
    }

    // Aggregate peer feedback
    let aggregatedPeerScores = {
      projectImpact: 0,
      direction: 0,
      engineeringExcellence: 0,
      operationalOwnership: 0,
      peopleImpact: 0,
    }

    if (peerFeedback.length > 0) {
      const avgScores = this.aggregationService.aggregatePeerScores(peerFeedback).toObject()
      aggregatedPeerScores = avgScores
    }

    // Build attributed feedback array (manager sees reviewer names)
    const attributedFeedback = await Promise.all(
      peerFeedback.map(async (fb) => {
        const reviewer = await this.userRepository.findById(fb.reviewerId)
        const scores = fb.scores.toObject()
        return {
          reviewerId: fb.reviewerId.value,
          reviewerName: reviewer?.name || 'Unknown',
          scores,
          strengths: fb.strengths,
          growthAreas: fb.growthAreas,
          generalComments: fb.generalComments,
        }
      }),
    )

    const managerEvalData = managerEval
      ? {
          id: managerEval.id.value,
          status: managerEval.status.value,
          scores: managerEval.scores.toObject(),
          narrative: managerEval.narrative,
          strengths: managerEval.strengths,
          growthAreas: managerEval.growthAreas,
          developmentPlan: managerEval.developmentPlan,
        }
      : undefined

    return {
      employee: {
        id: employee.id.value,
        name: employee.name,
        email: employee.email.value,
        level: employee.level || 'Unknown',
        department: employee.department || 'Unknown',
      },
      selfReview: {
        scores: selfScores,
        narrative: selfReview?.narrative.text || '',
        submittedAt: selfReview?.submittedAt,
      },
      peerFeedback: {
        count: peerFeedback.length,
        aggregatedScores: aggregatedPeerScores,
        attributedFeedback,
      },
      managerEvaluation: managerEvalData,
    }
  }
}
