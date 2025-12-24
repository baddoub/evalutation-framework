import { Injectable, Inject } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { FinalScoreCalculationService } from '../../../domain/services/final-score-calculation.service'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'

@Injectable()
export class CalculateFinalScoresUseCase {
  constructor(
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
    private readonly calculationService: FinalScoreCalculationService,
  ) {}

  async execute(cycleId: string): Promise<void> {
    const evaluations = await this.managerEvaluationRepository.findByCycle(
      ReviewCycleId.create(cycleId),
    )

    for (const evaluation of evaluations) {
      const finalScore = this.calculationService.calculateFinalScore(evaluation)
      await this.finalScoreRepository.save(finalScore)
    }
  }
}
