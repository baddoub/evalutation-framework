import { ReviewCycle as PrismaReviewCycle } from '@prisma/client'
import { ReviewCycle, CycleStatus } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { CycleDeadlines } from '../../../domain/value-objects/cycle-deadlines.vo'

/**
 * ReviewCycleMapper
 *
 * Responsibilities:
 * - Convert between ReviewCycle domain entity and Prisma ReviewCycle model
 * - Bidirectional mapping (toDomain, toPrisma)
 *
 * SOLID Principles:
 * - SRP: Only responsible for ReviewCycle entity ↔ Prisma model conversion
 * - Infrastructure Layer: Uses Prisma types
 */
export class ReviewCycleMapper {
  /**
   * Convert Prisma ReviewCycle to domain ReviewCycle entity
   * @param prisma - Prisma ReviewCycle model
   * @returns ReviewCycle domain entity
   */
  static toDomain(prisma: PrismaReviewCycle): ReviewCycle {
    const deadlines = CycleDeadlines.create({
      selfReview: prisma.selfReviewDeadline,
      peerFeedback: prisma.peerFeedbackDeadline,
      managerEvaluation: prisma.managerEvalDeadline,
      calibration: prisma.calibrationDeadline,
      feedbackDelivery: prisma.feedbackDeliveryDeadline,
    })

    const cycle = ReviewCycle.create({
      id: ReviewCycleId.fromString(prisma.id),
      name: prisma.name,
      year: prisma.year,
      deadlines,
      startDate: prisma.startDate,
    })

    // Restore state
    const cycleWithState = cycle as any
    cycleWithState._status = CycleStatus.fromString(prisma.status)
    cycleWithState._endDate = prisma.endDate ?? undefined

    return cycleWithState
  }

  /**
   * Convert domain ReviewCycle entity to Prisma ReviewCycle data
   * @param domain - ReviewCycle domain entity
   * @returns Prisma ReviewCycle data (without timestamps)
   */
  static toPrisma(domain: ReviewCycle): Omit<PrismaReviewCycle, 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      id: domain.id.value,
      name: domain.name,
      year: domain.year,
      status: domain.status.value,
      selfReviewDeadline: domain.deadlines.selfReview,
      peerFeedbackDeadline: domain.deadlines.peerFeedback,
      managerEvalDeadline: domain.deadlines.managerEvaluation,
      calibrationDeadline: domain.deadlines.calibration,
      feedbackDeliveryDeadline: domain.deadlines.feedbackDelivery,
      startDate: domain.startDate,
      endDate: domain.endDate ?? null,
    }
  }
}
