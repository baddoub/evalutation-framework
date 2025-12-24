import { Injectable, Inject } from '@nestjs/common'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import {
  SubmitManagerEvaluationInput,
  SubmitManagerEvaluationOutput,
} from '../../dto/manager-evaluation.dto'

@Injectable()
export class SubmitManagerEvaluationUseCase {
  constructor(
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: SubmitManagerEvaluationInput): Promise<SubmitManagerEvaluationOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Check deadline
    if (cycle.hasDeadlinePassed('managerEvaluation')) {
      throw new Error('Manager evaluation deadline has passed')
    }

    // 3. Verify manager-employee relationship
    const employee = await this.userRepository.findById(input.employeeId)
    if (!employee) {
      throw new ReviewNotFoundException('Employee not found')
    }

    if (employee.managerId !== input.managerId.value) {
      throw new Error('You can only evaluate your direct reports')
    }

    // 4. Find or create evaluation
    let evaluation = await this.managerEvaluationRepository.findByEmployeeAndCycle(
      input.employeeId,
      input.cycleId,
    )

    const scores = PillarScores.create(input.scores)

    if (!evaluation) {
      // Create new evaluation
      evaluation = ManagerEvaluation.create({
        cycleId: input.cycleId,
        employeeId: input.employeeId,
        managerId: input.managerId,
        scores,
        narrative: input.narrative,
        strengths: input.strengths,
        growthAreas: input.growthAreas,
        developmentPlan: input.developmentPlan,
      })
    } else {
      // Update existing evaluation
      evaluation.updateScores(scores)
    }

    // 5. Submit evaluation
    evaluation.submit()

    // 6. Persist
    const savedEvaluation = await this.managerEvaluationRepository.save(evaluation)

    // 7. Return DTO
    const savedScores = savedEvaluation.scores.toObject()
    return {
      id: savedEvaluation.id.value,
      employeeId: savedEvaluation.employeeId.value,
      status: savedEvaluation.status.value,
      scores: savedScores,
      submittedAt: savedEvaluation.submittedAt!,
    }
  }
}
