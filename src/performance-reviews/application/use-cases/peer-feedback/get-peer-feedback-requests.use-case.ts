import { Injectable, Inject } from '@nestjs/common'
import { IPeerNominationRepository } from '../../../domain/repositories/peer-nomination.repository.interface'
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import {
  GetPeerFeedbackRequestsInput,
  GetPeerFeedbackRequestsOutput,
  PeerFeedbackRequestDto,
} from '../../dto/peer-feedback.dto'

/**
 * GetPeerFeedbackRequestsUseCase
 *
 * Retrieves peer feedback requests for a reviewer:
 * 1. Validate cycle exists
 * 2. Find all nominations where user is the nominee
 * 3. Check which nominations have feedback already submitted
 * 4. Return list of pending feedback requests with nominator details
 */
@Injectable()
export class GetPeerFeedbackRequestsUseCase {
  constructor(
    @Inject('IPeerNominationRepository')
    private readonly peerNominationRepository: IPeerNominationRepository,
    @Inject('IPeerFeedbackRepository')
    private readonly peerFeedbackRepository: IPeerFeedbackRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetPeerFeedbackRequestsInput): Promise<GetPeerFeedbackRequestsOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Find all nominations where the user is the nominee (i.e., they need to provide feedback)
    const nominations = await this.peerNominationRepository.findByNomineeAndCycle(
      input.reviewerId,
      input.cycleId,
    )

    // 3. Get feedback already submitted by this reviewer
    const submittedFeedback = await this.peerFeedbackRepository.findByReviewerAndCycle(
      input.reviewerId,
      input.cycleId,
    )
    const submittedForNominators = new Set(submittedFeedback.map((f) => f.revieweeId.value))

    // 4. Build the requests list with nominator details
    const requests: PeerFeedbackRequestDto[] = await Promise.all(
      nominations.map(async (nomination) => {
        const nominator = await this.userRepository.findById(nomination.nominatorId)
        const feedbackSubmitted = submittedForNominators.has(nomination.nominatorId.value)

        return {
          nominationId: nomination.id,
          nominatorId: nomination.nominatorId.value,
          nominatorName: nominator?.name || 'Unknown',
          nominatorEmail: nominator?.email.value || '',
          status: nomination.status,
          nominatedAt: nomination.nominatedAt,
          feedbackSubmitted,
        }
      }),
    )

    return {
      requests,
      total: requests.length,
    }
  }
}
