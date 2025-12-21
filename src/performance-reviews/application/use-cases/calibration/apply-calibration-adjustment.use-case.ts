import { Injectable, Inject } from '@nestjs/common'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { ICalibrationSessionRepository } from '../../../domain/repositories/calibration-session.repository.interface'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ScoreCalculationService } from '../../../domain/services/score-calculation.service'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { ManagerEvaluationId } from '../../../domain/entities/manager-evaluation.entity'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { ApplyCalibrationAdjustmentInput, ApplyCalibrationAdjustmentOutput } from '../../dto/final-score.dto'

@Injectable()
export class ApplyCalibrationAdjustmentUseCase {
  constructor(
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
    @Inject('ICalibrationSessionRepository')
    private readonly calibrationSessionRepository: ICalibrationSessionRepository,
    @Inject('IFinalScoreRepository')
    private readonly finalScoreRepository: IFinalScoreRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly scoreCalculationService: ScoreCalculationService,
  ) {}

  async execute(input: ApplyCalibrationAdjustmentInput): Promise<ApplyCalibrationAdjustmentOutput> {
    // 1. Get evaluation
    const evaluationId = ManagerEvaluationId.fromString(input.evaluationId)
    const evaluation = await this.managerEvaluationRepository.findById(evaluationId)
    if (!evaluation) {
      throw new ReviewNotFoundException('Manager evaluation not found')
    }

    // 2. Get session
    const session = await this.calibrationSessionRepository.findById(input.sessionId)
    if (!session) {
      throw new ReviewNotFoundException('Calibration session not found')
    }

    // 3. Validate justification
    if (!input.justification || input.justification.trim().length < 20) {
      throw new Error('Justification must be at least 20 characters')
    }

    // 4. Store original scores
    const originalScores = evaluation.scores.toObject()

    // 5. Create adjusted scores
    const adjustedScores = PillarScores.create(input.adjustedScores)

    // 6. Apply adjustment to evaluation
    evaluation.applyCalibrationAdjustment(adjustedScores, input.justification)

    // 7. Recalculate scores
    const employee = await this.userRepository.findById(evaluation.employeeId)
    const employeeLevel = employee?.level ? EngineerLevel.fromString(employee.level) : EngineerLevel.MID
    const oldWeightedScore = this.scoreCalculationService.calculateWeightedScore(
      PillarScores.create(originalScores),
      employeeLevel,
    )
    const newWeightedScore = this.scoreCalculationService.calculateWeightedScore(
      adjustedScores,
      employeeLevel,
    )

    // 8. Save evaluation changes
    await this.managerEvaluationRepository.save(evaluation)

    // 9. Update final score if it exists
    const finalScore = await this.finalScoreRepository.findByUserAndCycle(
      evaluation.employeeId,
      evaluation.cycleId,
    )
    if (finalScore) {
      // Update final score with new evaluation scores
      await this.finalScoreRepository.save(finalScore)
    }

    // 10. Return DTO
    const adjustmentId = require('crypto').randomUUID()
    return {
      id: adjustmentId,
      adjustmentId,
      evaluationId: input.evaluationId,
      originalScores,
      adjustedScores: input.adjustedScores,
      oldWeightedScore: oldWeightedScore.value,
      newWeightedScore: newWeightedScore.value,
      oldBonusTier: oldWeightedScore.bonusTier.value,
      newBonusTier: newWeightedScore.bonusTier.value,
      adjustedAt: new Date(),
    }
  }
}
