import { Injectable, Inject } from '@nestjs/common'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { Narrative } from '../../../domain/value-objects/narrative.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'
import { ManagerEvaluationId } from '../../../domain/value-objects/manager-evaluation-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'

export interface UpdateManagerEvaluationInput {
  evaluationId?: string
  cycleId?: ReviewCycleId
  employeeId?: UserId
  managerId?: UserId
  scores?: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  performanceNarrative?: string
  growthAreas?: string
  proposedLevel?: string
  managerComments?: string
}

export interface UpdateManagerEvaluationOutput {
  id: string
  cycleId: string
  employeeId: string
  managerId: string
  scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }
  managerComments?: string
  status: string
  submittedAt?: Date
  updatedAt: Date
}

@Injectable()
export class UpdateManagerEvaluationUseCase {
  constructor(
    @Inject('IManagerEvaluationRepository')
    private readonly managerEvaluationRepository: IManagerEvaluationRepository,
  ) {}

  async execute(input: UpdateManagerEvaluationInput): Promise<UpdateManagerEvaluationOutput> {
    let evaluation

    if (input.evaluationId) {
      evaluation = await this.managerEvaluationRepository.findById(
        ManagerEvaluationId.fromString(input.evaluationId),
      )
    } else if (input.cycleId && input.employeeId) {
      evaluation = await this.managerEvaluationRepository.findByEmployeeAndCycle(
        input.employeeId,
        input.cycleId,
      )
    }

    if (!evaluation) {
      throw new Error('Manager evaluation not found')
    }

    if (input.scores) {
      const scores = PillarScores.create(input.scores)
      evaluation.updateScores(scores)
    }

    if (input.performanceNarrative) {
      evaluation.updatePerformanceNarrative(Narrative.create(input.performanceNarrative))
    }

    if (input.growthAreas) {
      evaluation.updateGrowthAreas(Narrative.create(input.growthAreas))
    }

    if (input.proposedLevel) {
      evaluation.updateProposedLevel(EngineerLevel.create(input.proposedLevel))
    }

    if (input.managerComments) {
      evaluation.updatePerformanceNarrative(Narrative.create(input.managerComments))
    }

    const savedEvaluation = await this.managerEvaluationRepository.save(evaluation)

    return {
      id: savedEvaluation.id.value,
      cycleId: savedEvaluation.cycleId.value,
      employeeId: savedEvaluation.employeeId.value,
      managerId: savedEvaluation.managerId.value,
      scores: savedEvaluation.scores.toObject(),
      managerComments: savedEvaluation.narrative,
      status: savedEvaluation.status.value,
      submittedAt: savedEvaluation.submittedAt,
      updatedAt: savedEvaluation.updatedAt,
    }
  }
}
