import type { SelfReview as PrismaSelfReview } from '@prisma/client'
import { SelfReview } from '../../../domain/entities/self-review.entity'
import { SelfReviewId } from '../../../domain/value-objects/self-review-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { Narrative } from '../../../domain/value-objects/narrative.vo'
import { ReviewStatus } from '../../../domain/value-objects/review-status.vo'

/**
 * SelfReviewMapper
 *
 * Responsibilities:
 * - Convert between SelfReview domain entity and Prisma SelfReview model
 * - Bidirectional mapping (toDomain, toPrisma)
 * - Map individual pillar score fields to PillarScores value object
 *
 * SOLID Principles:
 * - SRP: Only responsible for SelfReview entity ↔ Prisma model conversion
 * - Infrastructure Layer: Uses Prisma types
 */
export class SelfReviewMapper {
  /**
   * Convert Prisma SelfReview to domain SelfReview entity
   * @param prisma - Prisma SelfReview model
   * @returns SelfReview domain entity
   */
  static toDomain(prisma: PrismaSelfReview): SelfReview {
    const scores = PillarScores.create({
      projectImpact: prisma.projectImpactScore,
      direction: prisma.directionScore,
      engineeringExcellence: prisma.engineeringExcellenceScore,
      operationalOwnership: prisma.operationalOwnershipScore,
      peopleImpact: prisma.peopleImpactScore,
    })

    const narrative = Narrative.fromText(prisma.narrative)

    const selfReview = SelfReview.create({
      id: SelfReviewId.fromString(prisma.id),
      cycleId: ReviewCycleId.fromString(prisma.cycleId),
      userId: UserId.fromString(prisma.userId),
      scores,
      narrative,
    })

    // Restore state
    const selfReviewWithState = selfReview as any
    selfReviewWithState._status = ReviewStatus.fromString(prisma.status)
    selfReviewWithState._submittedAt = prisma.submittedAt ?? undefined

    return selfReviewWithState
  }

  /**
   * Convert domain SelfReview entity to Prisma SelfReview data
   * @param domain - SelfReview domain entity
   * @returns Prisma SelfReview data (without timestamps)
   */
  static toPrisma(
    domain: SelfReview,
  ): Omit<PrismaSelfReview, 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      id: domain.id.value,
      cycleId: domain.cycleId.value,
      userId: domain.userId.value,
      projectImpactScore: domain.scores.projectImpact.value,
      directionScore: domain.scores.direction.value,
      engineeringExcellenceScore: domain.scores.engineeringExcellence.value,
      operationalOwnershipScore: domain.scores.operationalOwnership.value,
      peopleImpactScore: domain.scores.peopleImpact.value,
      narrative: domain.narrative.text,
      status: domain.status.value,
      submittedAt: domain.submittedAt ?? null,
    }
  }
}
