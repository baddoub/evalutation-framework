import { PeerFeedback as PrismaPeerFeedback } from '@prisma/client'
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity'
import { PeerFeedbackId } from '../../../domain/value-objects/peer-feedback-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'

/**
 * PeerFeedbackMapper
 *
 * Responsibilities:
 * - Convert between PeerFeedback domain entity and Prisma PeerFeedback model
 * - Bidirectional mapping (toDomain, toPrisma)
 * - Map individual pillar score fields to PillarScores value object
 *
 * SOLID Principles:
 * - SRP: Only responsible for PeerFeedback entity ↔ Prisma model conversion
 * - Infrastructure Layer: Uses Prisma types
 */
export class PeerFeedbackMapper {
  /**
   * Convert Prisma PeerFeedback to domain PeerFeedback entity
   * @param prisma - Prisma PeerFeedback model
   * @returns PeerFeedback domain entity
   */
  static toDomain(prisma: PrismaPeerFeedback): PeerFeedback {
    const scores = PillarScores.create({
      projectImpact: prisma.projectImpactScore,
      direction: prisma.directionScore,
      engineeringExcellence: prisma.engineeringExcellenceScore,
      operationalOwnership: prisma.operationalOwnershipScore,
      peopleImpact: prisma.peopleImpactScore,
    })

    const feedback = PeerFeedback.create({
      id: PeerFeedbackId.fromString(prisma.id),
      cycleId: ReviewCycleId.fromString(prisma.cycleId),
      revieweeId: UserId.fromString(prisma.revieweeId),
      reviewerId: UserId.fromString(prisma.reviewerId),
      scores,
      strengths: prisma.strengths ?? undefined,
      growthAreas: prisma.growthAreas ?? undefined,
      generalComments: prisma.generalComments ?? undefined,
    })

    // Restore submitted timestamp
    const feedbackWithState = feedback as any
    feedbackWithState._submittedAt = prisma.submittedAt

    return feedbackWithState
  }

  /**
   * Convert domain PeerFeedback entity to Prisma PeerFeedback data
   * @param domain - PeerFeedback domain entity
   * @returns Prisma PeerFeedback data (without timestamps)
   */
  static toPrisma(domain: PeerFeedback): Omit<PrismaPeerFeedback, 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      id: domain.id.value,
      cycleId: domain.cycleId.value,
      revieweeId: domain.revieweeId.value,
      reviewerId: domain.reviewerId.value,
      projectImpactScore: domain.scores.projectImpact.value,
      directionScore: domain.scores.direction.value,
      engineeringExcellenceScore: domain.scores.engineeringExcellence.value,
      operationalOwnershipScore: domain.scores.operationalOwnership.value,
      peopleImpactScore: domain.scores.peopleImpact.value,
      strengths: domain.strengths ?? null,
      growthAreas: domain.growthAreas ?? null,
      generalComments: domain.generalComments ?? null,
      submittedAt: domain.submittedAt ?? new Date(),
    }
  }
}
