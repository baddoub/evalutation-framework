import { Injectable, Inject } from '@nestjs/common'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ScoreCalculationService } from '../../../domain/services/score-calculation.service'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import {
  GetCalibrationDashboardInput,
  GetCalibrationDashboardOutput,
} from '../../dto/final-score.dto'

@Injectable()
export class GetCalibrationDashboardUseCase {
  constructor(
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly scoreCalculationService: ScoreCalculationService,
  ) {}

  async execute(input: GetCalibrationDashboardInput): Promise<GetCalibrationDashboardOutput> {
    // 1. Validate cycle
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Get all manager evaluations
    let evaluations = await this.managerEvaluationRepository.findByCycle(input.cycleId)

    // 3. Filter by department if provided
    if (input.department) {
      const evaluationPromises = evaluations.map(async (evaluation) => {
        const employee = await this.userRepository.findById(evaluation.employeeId)
        return { evaluation, employee }
      })
      const evaluationWithEmployees = await Promise.all(evaluationPromises)
      evaluations = evaluationWithEmployees
        .filter(({ employee }) => employee?.department === input.department)
        .map(({ evaluation }) => evaluation)
    }

    // 4. Calculate statistics
    const byBonusTier = { EXCEEDS: 0, MEETS: 0, BELOW: 0 }
    const byDepartment: Record<string, { EXCEEDS: number; MEETS: number; BELOW: number }> = {}

    const evaluationDetails = await Promise.all(
      evaluations.map(async (evaluation) => {
        const employee = await this.userRepository.findById(evaluation.employeeId)
        const manager = await this.userRepository.findById(evaluation.managerId)

        const employeeLevel = employee?.level
          ? EngineerLevel.fromString(employee.level)
          : EngineerLevel.MID
        const weightedScore = this.scoreCalculationService.calculateWeightedScore(
          evaluation.scores,
          employeeLevel,
        )

        const bonusTier = weightedScore.bonusTier.value

        // Count by tier
        byBonusTier[bonusTier as keyof typeof byBonusTier]++

        // Count by department
        const dept = employee?.department || 'Unknown'
        if (!byDepartment[dept]) {
          byDepartment[dept] = { EXCEEDS: 0, MEETS: 0, BELOW: 0 }
        }
        byDepartment[dept][bonusTier as keyof typeof byBonusTier]++

        const scores = evaluation.scores.toObject()

        return {
          employeeId: employee?.id.value || '',
          employeeName: employee?.name || 'Unknown',
          level: employee?.level || 'Unknown',
          department: dept,
          managerId: manager?.id.value || '',
          managerName: manager?.name || 'Unknown',
          scores,
          weightedScore: weightedScore.value,
          percentageScore: weightedScore.percentage,
          bonusTier,
          calibrationStatus: evaluation.isCalibrated ? 'CALIBRATED' : 'PENDING',
        }
      }),
    )

    return {
      summary: {
        totalEvaluations: evaluations.length,
        byBonusTier,
        byDepartment,
      },
      evaluations: evaluationDetails,
    }
  }
}
