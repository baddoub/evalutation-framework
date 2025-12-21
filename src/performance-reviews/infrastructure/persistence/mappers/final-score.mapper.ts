import { FinalScore as PrismaFinalScore } from '@prisma/client'
import { FinalScore, FinalScoreId } from '../../../domain/entities/final-score.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { WeightedScore } from '../../../domain/value-objects/weighted-score.vo'
import { EngineerLevel } from '../../../domain/value-objects/engineer-level.vo'

/**
 * FinalScoreMapper
 *
 * Responsibilities:
 * - Convert between FinalScore domain entity and Prisma FinalScore model
 * - Bidirectional mapping (toDomain, toPrisma)
 * - Map individual pillar score fields to PillarScores value object
 * - Handle peer average scores (nullable)
 *
 * SOLID Principles:
 * - SRP: Only responsible for FinalScore entity ↔ Prisma model conversion
 * - Infrastructure Layer: Uses Prisma types
 */
export class FinalScoreMapper {
  /**
   * Convert Prisma FinalScore to domain FinalScore entity
   * @param prisma - Prisma FinalScore model
   * @returns FinalScore domain entity
   */
  static toDomain(prisma: PrismaFinalScore): FinalScore {
    const pillarScores = PillarScores.create({
      projectImpact: prisma.projectImpactScore,
      direction: prisma.directionScore,
      engineeringExcellence: prisma.engineeringExcellenceScore,
      operationalOwnership: prisma.operationalOwnershipScore,
      peopleImpact: prisma.peopleImpactScore,
    })

    const weightedScore = WeightedScore.fromValue(prisma.weightedScore)

    // Handle nullable peer average scores
    let peerAverageScores: PillarScores | undefined = undefined
    if (
      prisma.peerAvgProjectImpact !== null &&
      prisma.peerAvgDirection !== null &&
      prisma.peerAvgEngineeringExcellence !== null &&
      prisma.peerAvgOperationalOwnership !== null &&
      prisma.peerAvgPeopleImpact !== null
    ) {
      peerAverageScores = PillarScores.create({
        projectImpact: Math.round(prisma.peerAvgProjectImpact),
        direction: Math.round(prisma.peerAvgDirection),
        engineeringExcellence: Math.round(prisma.peerAvgEngineeringExcellence),
        operationalOwnership: Math.round(prisma.peerAvgOperationalOwnership),
        peopleImpact: Math.round(prisma.peerAvgPeopleImpact),
      })
    }

    const finalScore = FinalScore.create({
      id: FinalScoreId.fromString(prisma.id),
      cycleId: ReviewCycleId.fromString(prisma.cycleId),
      userId: UserId.fromString(prisma.userId),
      pillarScores,
      weightedScore,
      finalLevel: EngineerLevel.fromString(prisma.finalLevel || 'MID'),
      peerAverageScores,
      peerFeedbackCount: prisma.peerFeedbackCount ?? 0,
      calculatedAt: prisma.calculatedAt || prisma.createdAt,
      feedbackNotes: prisma.feedbackNotes ?? undefined,
      deliveredAt: prisma.feedbackDeliveredAt ?? undefined,
      deliveredBy: prisma.deliveredBy ? UserId.fromString(prisma.deliveredBy) : undefined,
    })

    // Restore state
    const finalScoreWithState = finalScore as any
    finalScoreWithState._locked = prisma.locked
    finalScoreWithState._lockedAt = prisma.lockedAt ?? undefined
    finalScoreWithState._feedbackDelivered = prisma.feedbackDelivered
    finalScoreWithState._feedbackDeliveredAt = prisma.feedbackDeliveredAt ?? undefined

    return finalScoreWithState
  }

  /**
   * Convert domain FinalScore entity to Prisma FinalScore data
   * @param domain - FinalScore domain entity
   * @returns Prisma FinalScore data (without timestamps)
   */
  static toPrisma(domain: FinalScore): Omit<PrismaFinalScore, 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      id: domain.id.value,
      cycleId: domain.cycleId.value,
      userId: domain.userId.value,
      projectImpactScore: domain.pillarScores.projectImpact.value,
      directionScore: domain.pillarScores.direction.value,
      engineeringExcellenceScore: domain.pillarScores.engineeringExcellence.value,
      operationalOwnershipScore: domain.pillarScores.operationalOwnership.value,
      peopleImpactScore: domain.pillarScores.peopleImpact.value,
      weightedScore: domain.weightedScore.value,
      percentageScore: domain.percentageScore,
      bonusTier: domain.bonusTier.value,
      finalLevel: domain.finalLevel.value,
      calculatedAt: domain.calculatedAt,
      peerAvgProjectImpact: domain.peerAverageScores?.projectImpact.value ?? null,
      peerAvgDirection: domain.peerAverageScores?.direction.value ?? null,
      peerAvgEngineeringExcellence: domain.peerAverageScores?.engineeringExcellence.value ?? null,
      peerAvgOperationalOwnership: domain.peerAverageScores?.operationalOwnership.value ?? null,
      peerAvgPeopleImpact: domain.peerAverageScores?.peopleImpact.value ?? null,
      peerFeedbackCount: domain.peerFeedbackCount,
      locked: domain.isLocked,
      lockedAt: domain.lockedAt ?? null,
      feedbackDelivered: domain.feedbackDelivered,
      feedbackDeliveredAt: domain.deliveredAt ?? null,
      feedbackNotes: domain.feedbackNotes ?? null,
      deliveredBy: domain.deliveredBy?.value ?? null,
    }
  }
}
