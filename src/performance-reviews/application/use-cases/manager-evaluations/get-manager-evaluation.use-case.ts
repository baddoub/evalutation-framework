import { Injectable, Inject } from '@nestjs/common'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'

export interface GetManagerEvaluationInput {
  cycleId: ReviewCycleId
  employeeId: UserId
  managerId: UserId
}

export interface GetManagerEvaluationOutput {
  id: string
  employeeId: string
  managerId: string
  cycleId: string
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  managerComments?: string
  performanceNarrative?: string
  growthAreas?: string
  proposedLevel?: string
  submittedAt?: Date
  status: string
}

@Injectable()
export class GetManagerEvaluationUseCase {
  constructor(
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
  ) {}

  async execute(
    input: GetManagerEvaluationInput,
  ): Promise<GetManagerEvaluationOutput | null> {
    const evaluation = await this.managerEvaluationRepository.findByEmployeeAndCycle(
      input.employeeId,
      input.cycleId,
    )

    if (!evaluation) {
      return null
    }

    return {
      id: evaluation.id.value,
      employeeId: evaluation.employeeId.value,
      managerId: evaluation.managerId.value,
      cycleId: evaluation.cycleId.value,
      scores: evaluation.scores.toPlainObject(),
      managerComments: evaluation.narrative,
      performanceNarrative: evaluation.performanceNarrative,
      growthAreas: evaluation.growthAreas,
      proposedLevel: evaluation.proposedLevel?.value,
      submittedAt: evaluation.submittedAt,
      status: evaluation.status.value,
    }
  }
}
