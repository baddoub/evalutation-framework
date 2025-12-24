import { Injectable } from '@nestjs/common'
import { ManagerEvaluation } from '../entities/manager-evaluation.entity'
import { FinalScore } from '../entities/final-score.entity'
import { ScoreCalculationService } from './score-calculation.service'
import { EngineerLevel } from '../value-objects/engineer-level.vo'

/**
 * FinalScoreCalculationService
 *
 * Responsibilities:
 * - Calculate final scores from manager evaluations
 * - Determine bonus tiers
 * - Finalize employee levels
 */
@Injectable()
export class FinalScoreCalculationService {
  constructor(private readonly scoreCalculationService: ScoreCalculationService) {}

  calculateFinalScore(evaluation: ManagerEvaluation): FinalScore {
    // Determine final level (use proposed level if available, otherwise employee's current level, or default to MID)
    const finalLevel = evaluation.proposedLevel || evaluation.employeeLevel || EngineerLevel.MID

    // Calculate weighted score based on calibrated scores and level
    const weightedScore = this.scoreCalculationService.calculateWeightedScore(
      evaluation.scores,
      finalLevel,
    )

    // Create FinalScore entity
    return FinalScore.create({
      userId: evaluation.employeeId,
      cycleId: evaluation.cycleId,
      pillarScores: evaluation.scores,
      weightedScore,
      finalLevel,
    })
  }
}
