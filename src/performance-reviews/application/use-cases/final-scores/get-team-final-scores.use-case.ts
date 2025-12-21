import { Injectable, Inject } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { GetTeamFinalScoresInput, GetTeamFinalScoresOutput } from '../../dto/final-score.dto'

@Injectable()
export class GetTeamFinalScoresUseCase {
  constructor(
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetTeamFinalScoresInput): Promise<GetTeamFinalScoresOutput> {
    // 1. Validate cycle
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Get all direct reports
    const directReports = await this.userRepository.findByManagerId(input.managerId.value)

    // 3. Get final scores for each direct report
    const teamScores = await Promise.all(
      directReports.map(async (employee) => {
        const finalScore = await this.finalScoreRepository.findByUserAndCycle(
          employee.id,
          input.cycleId,
        )

        if (!finalScore) {
          return {
            employeeId: employee.id.value,
            employeeName: employee.name,
            level: employee.level || 'Unknown',
            weightedScore: 0,
            percentageScore: 0,
            bonusTier: 'BELOW',
            feedbackDelivered: false,
          }
        }

        return {
          employeeId: employee.id.value,
          employeeName: employee.name,
          level: employee.level || 'Unknown',
          weightedScore: finalScore.weightedScore.value,
          percentageScore: finalScore.percentageScore,
          bonusTier: finalScore.bonusTier.value,
          feedbackDelivered: finalScore.feedbackDelivered,
        }
      }),
    )

    return {
      teamScores,
    }
  }
}
