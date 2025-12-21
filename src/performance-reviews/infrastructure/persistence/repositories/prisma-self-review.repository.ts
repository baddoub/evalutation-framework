import { Injectable } from '@nestjs/common'
import { ISelfReviewRepository } from '../../../domain/repositories/self-review.repository.interface'
import { SelfReview } from '../../../domain/entities/self-review.entity'
import { SelfReviewId } from '../../../domain/value-objects/self-review-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { SelfReviewMapper } from '../mappers/self-review.mapper'

/**
 * PrismaSelfReviewRepository
 *
 * Responsibilities:
 * - Implement ISelfReviewRepository using Prisma ORM
 * - Handle all SelfReview persistence operations
 * - Implement soft delete pattern
 *
 * SOLID Principles:
 * - SRP: Only responsible for SelfReview persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaSelfReviewRepository implements ISelfReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find self review by ID
   * @param id - SelfReviewId
   * @returns SelfReview entity or null if not found
   */
  async findById(id: SelfReviewId): Promise<SelfReview | null> {
    const prismaSelfReview = await this.prisma.selfReview.findUnique({
      where: { id: id.value, deletedAt: null },
    })

    return prismaSelfReview ? SelfReviewMapper.toDomain(prismaSelfReview) : null
  }

  /**
   * Find self review by user and cycle
   * @param userId - UserId
   * @param cycleId - ReviewCycleId
   * @returns SelfReview entity or null if not found
   */
  async findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<SelfReview | null> {
    const prismaSelfReview = await this.prisma.selfReview.findUnique({
      where: {
        cycleId_userId: {
          cycleId: cycleId.value,
          userId: userId.value,
        },
        deletedAt: null,
      },
    })

    return prismaSelfReview ? SelfReviewMapper.toDomain(prismaSelfReview) : null
  }

  /**
   * Find all self reviews for a cycle
   * @param cycleId - ReviewCycleId
   * @returns Array of SelfReview entities
   */
  async findByCycle(cycleId: ReviewCycleId): Promise<SelfReview[]> {
    const prismaSelfReviews = await this.prisma.selfReview.findMany({
      where: { cycleId: cycleId.value, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    return prismaSelfReviews.map((review) => SelfReviewMapper.toDomain(review))
  }

  /**
   * Save (create or update) a self review
   * @param review - SelfReview entity to save
   * @returns Saved SelfReview entity
   */
  async save(review: SelfReview): Promise<SelfReview> {
    const prismaData = SelfReviewMapper.toPrisma(review)

    const saved = await this.prisma.selfReview.upsert({
      where: { id: review.id.value },
      create: prismaData,
      update: prismaData,
    })

    return SelfReviewMapper.toDomain(saved)
  }

  /**
   * Soft delete a self review
   * @param id - SelfReviewId to delete
   */
  async delete(id: SelfReviewId): Promise<void> {
    await this.prisma.selfReview.update({
      where: { id: id.value },
      data: { deletedAt: new Date() },
    })
  }
}
