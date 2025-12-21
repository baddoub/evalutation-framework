import { Injectable, Inject } from '@nestjs/common'
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { IPeerNominationRepository } from '../../../domain/repositories/peer-nomination.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { SubmitPeerFeedbackInput, SubmitPeerFeedbackOutput } from '../../dto/peer-feedback.dto'

/**
 * SubmitPeerFeedbackUseCase
 *
 * Submits peer feedback for a reviewee:
 * 1. Validate cycle exists and deadline not passed
 * 2. Validate nomination exists and accepted
 * 3. Create PeerFeedback entity with scores and comments
 * 4. Persist feedback
 * 5. Return submitted feedback DTO
 */
@Injectable()
export class SubmitPeerFeedbackUseCase {
  constructor(
    @Inject('IPeerFeedbackRepository')
    private readonly peerFeedbackRepository: IPeerFeedbackRepository,
    @Inject('IPeerNominationRepository')
    private readonly peerNominationRepository: IPeerNominationRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
  ) {}

  async execute(input: SubmitPeerFeedbackInput): Promise<SubmitPeerFeedbackOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Check deadline
    if (cycle.hasDeadlinePassed('peerFeedback')) {
      throw new Error('Peer feedback deadline has passed')
    }

    // 3. Validate nomination exists
    const nominations = await this.peerNominationRepository.findByNominatorAndCycle(
      input.revieweeId,
      input.cycleId,
    )
    const nomination = nominations.find((nom) => nom.nomineeId.equals(input.reviewerId))

    if (!nomination) {
      throw new Error('No peer nomination found for this reviewer and reviewee')
    }

    if (nomination.status !== 'PENDING' && nomination.status !== 'ACCEPTED') {
      throw new Error('Peer nomination is not active')
    }

    // 4. Check if feedback already submitted
    const existingFeedback = await this.peerFeedbackRepository.findByReviewerAndCycle(
      input.reviewerId,
      input.cycleId,
    )
    const alreadySubmitted = existingFeedback.some((fb) => fb.revieweeId.equals(input.revieweeId))
    if (alreadySubmitted) {
      throw new Error('Peer feedback already submitted for this reviewee')
    }

    // 5. Create PeerFeedback entity
    const scores = PillarScores.create(input.scores)
    const feedback = PeerFeedback.create({
      cycleId: input.cycleId,
      revieweeId: input.revieweeId,
      reviewerId: input.reviewerId,
      scores,
      strengths: input.strengths,
      growthAreas: input.growthAreas,
      generalComments: input.generalComments,
    })

    // 6. Persist feedback
    const savedFeedback = await this.peerFeedbackRepository.save(feedback)

    // 7. Return DTO
    return {
      id: savedFeedback.id.value,
      revieweeId: savedFeedback.revieweeId.value,
      submittedAt: savedFeedback.submittedAt!,
      isAnonymized: savedFeedback.isAnonymized,
    }
  }
}
