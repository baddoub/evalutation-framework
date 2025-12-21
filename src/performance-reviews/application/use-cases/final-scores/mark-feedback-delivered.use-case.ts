import { Injectable, Inject } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { MarkFeedbackDeliveredInput, MarkFeedbackDeliveredOutput } from '../../dto/final-score.dto'

@Injectable()
export class MarkFeedbackDeliveredUseCase {
  constructor(
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: MarkFeedbackDeliveredInput): Promise<MarkFeedbackDeliveredOutput> {
    // 1. Validate cycle
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Verify manager-employee relationship
    const employee = await this.userRepository.findById(input.employeeId)
    if (!employee) {
      throw new ReviewNotFoundException('Employee not found')
    }

    if (employee.managerId !== input.managerId.value) {
      throw new Error('You can only mark feedback delivered for your direct reports')
    }

    // 3. Get final score
    const finalScore = await this.finalScoreRepository.findByUserAndCycle(
      input.employeeId,
      input.cycleId,
    )
    if (!finalScore) {
      throw new ReviewNotFoundException('Final score not found')
    }

    // 4. Mark feedback as delivered
    finalScore.markFeedbackDelivered(input.managerId, input.feedbackNotes)

    // 5. Save
    const updatedScore = await this.finalScoreRepository.save(finalScore)

    // 6. Return DTO
    return {
      employeeId: updatedScore.userId.value,
      feedbackDelivered: updatedScore.feedbackDelivered,
      feedbackDeliveredAt: updatedScore.feedbackDeliveredAt!,
    }
  }
}
