import { ManagerEvaluation as PrismaManagerEvaluation } from '@prisma/client'
import { ManagerEvaluation, ManagerEvaluationId } from '../../../domain/entities/manager-evaluation.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { ReviewStatus } from '../../../domain/value-objects/review-status.vo'

/**
 * ManagerEvaluationMapper
 *
 * Responsibilities:
 * - Convert between ManagerEvaluation domain entity and Prisma ManagerEvaluation model
 * - Bidirectional mapping (toDomain, toPrisma)
 * - Map individual pillar score fields to PillarScores value object
 *
 * SOLID Principles:
 * - SRP: Only responsible for ManagerEvaluation entity ↔ Prisma model conversion
 * - Infrastructure Layer: Uses Prisma types
 */
export class ManagerEvaluationMapper {
  /**
   * Convert Prisma ManagerEvaluation to domain ManagerEvaluation entity
   * @param prisma - Prisma ManagerEvaluation model
   * @returns ManagerEvaluation domain entity
   */
  static toDomain(prisma: PrismaManagerEvaluation): ManagerEvaluation {
    const scores = PillarScores.create({
      projectImpact: prisma.projectImpactScore,
      direction: prisma.directionScore,
      engineeringExcellence: prisma.engineeringExcellenceScore,
      operationalOwnership: prisma.operationalOwnershipScore,
      peopleImpact: prisma.peopleImpactScore,
    })

    const evaluation = ManagerEvaluation.create({
      id: ManagerEvaluationId.fromString(prisma.id),
      cycleId: ReviewCycleId.fromString(prisma.cycleId),
      employeeId: UserId.fromString(prisma.employeeId),
      managerId: UserId.fromString(prisma.managerId),
      scores,
      narrative: prisma.narrative,
      strengths: prisma.strengths,
      growthAreas: prisma.growthAreas,
      developmentPlan: prisma.developmentPlan,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })

    // Restore state
    const evaluationWithState = evaluation as any
    evaluationWithState._status = ReviewStatus.fromString(prisma.status)
    evaluationWithState._submittedAt = prisma.submittedAt ?? undefined
    evaluationWithState._calibratedAt = prisma.calibratedAt ?? undefined

    return evaluationWithState
  }

  /**
   * Convert domain ManagerEvaluation entity to Prisma ManagerEvaluation data
   * @param domain - ManagerEvaluation domain entity
   * @returns Prisma ManagerEvaluation data (without timestamps)
   */
  static toPrisma(domain: ManagerEvaluation): Omit<PrismaManagerEvaluation, 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      id: domain.id.value,
      cycleId: domain.cycleId.value,
      employeeId: domain.employeeId.value,
      managerId: domain.managerId.value,
      projectImpactScore: domain.scores.projectImpact.value,
      directionScore: domain.scores.direction.value,
      engineeringExcellenceScore: domain.scores.engineeringExcellence.value,
      operationalOwnershipScore: domain.scores.operationalOwnership.value,
      peopleImpactScore: domain.scores.peopleImpact.value,
      narrative: domain.narrative,
      strengths: domain.strengths,
      growthAreas: domain.growthAreas,
      developmentPlan: domain.developmentPlan,
      status: domain.status.value,
      submittedAt: domain.submittedAt ?? null,
      calibratedAt: domain.calibratedAt ?? null,
    }
  }
}
