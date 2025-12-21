import { Injectable, Inject } from '@nestjs/common'
import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface'
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { GetTeamReviewsInput, GetTeamReviewsOutput } from '../../dto/manager-evaluation.dto'

/**
 * GetTeamReviewsUseCase
 *
 * Retrieves review status for all direct reports:
 * 1. Validate cycle exists
 * 2. Find all direct reports (users with this managerId)
 * 3. Get review status for each report
 * 4. Return team reviews summary DTO
 */
@Injectable()
export class GetTeamReviewsUseCase {
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
  ) {}

  async execute(input: GetTeamReviewsInput): Promise<GetTeamReviewsOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Find all direct reports
    const directReports = await this.userRepository.findByManagerId(input.managerId.value)

    // 3. Get review status for each report
    const reviews = await Promise.all(
      directReports.map(async (employee) => {
        // Get self-review
        const selfReview = await this.selfReviewRepository.findByUserAndCycle(
          employee.id,
          input.cycleId,
        )

        // Get peer feedback
        const peerFeedback = await this.peerFeedbackRepository.findByRevieweeAndCycle(
          employee.id,
          input.cycleId,
        )

        // Get manager evaluation
        const managerEval = await this.managerEvaluationRepository.findByEmployeeAndCycle(
          employee.id,
          input.cycleId,
        )

        return {
          employeeId: employee.id.value,
          employeeName: employee.name,
          employeeLevel: employee.level || 'Unknown',
          selfReviewStatus: selfReview?.status.value || 'NOT_STARTED',
          peerFeedbackCount: peerFeedback.length,
          peerFeedbackStatus: peerFeedback.length >= 3 ? 'COMPLETE' : 'PENDING',
          managerEvalStatus: managerEval?.status.value || 'NOT_STARTED',
          hasSubmittedEvaluation: managerEval?.isSubmitted || false,
        }
      }),
    )

    return {
      reviews,
      total: reviews.length,
    }
  }
}
