import { Injectable } from '@nestjs/common'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { ReviewCycle } from '../../../domain/entities/review-cycle.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { ReviewCycleMapper } from '../mappers/review-cycle.mapper'

/**
 * PrismaReviewCycleRepository
 *
 * Responsibilities:
 * - Implement IReviewCycleRepository using Prisma ORM
 * - Handle all ReviewCycle persistence operations
 * - Implement soft delete pattern
 *
 * SOLID Principles:
 * - SRP: Only responsible for ReviewCycle persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaReviewCycleRepository implements IReviewCycleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find review cycle by ID
   * @param id - ReviewCycleId
   * @returns ReviewCycle entity or null if not found
   */
  async findById(id: ReviewCycleId): Promise<ReviewCycle | null> {
    const prismaReviewCycle = await this.prisma.reviewCycle.findUnique({
      where: { id: id.value, deletedAt: null },
    })

    return prismaReviewCycle ? ReviewCycleMapper.toDomain(prismaReviewCycle) : null
  }

  /**
   * Find all review cycles for a specific year
   * @param year - Year to filter by
   * @returns Array of ReviewCycle entities
   */
  async findByYear(year: number): Promise<ReviewCycle[]> {
    const prismaReviewCycles = await this.prisma.reviewCycle.findMany({
      where: { year, deletedAt: null },
      orderBy: { startDate: 'desc' },
    })

    return prismaReviewCycles.map((cycle) => ReviewCycleMapper.toDomain(cycle))
  }

  /**
   * Find the currently active review cycle
   * @returns Active ReviewCycle entity or null if none active
   */
  async findActive(): Promise<ReviewCycle | null> {
    const prismaReviewCycle = await this.prisma.reviewCycle.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
    })

    return prismaReviewCycle ? ReviewCycleMapper.toDomain(prismaReviewCycle) : null
  }

  /**
   * Save (create or update) a review cycle
   * @param cycle - ReviewCycle entity to save
   * @returns Saved ReviewCycle entity
   */
  async save(cycle: ReviewCycle): Promise<ReviewCycle> {
    const prismaData = ReviewCycleMapper.toPrisma(cycle)

    const saved = await this.prisma.reviewCycle.upsert({
      where: { id: cycle.id.value },
      create: prismaData,
      update: prismaData,
    })

    return ReviewCycleMapper.toDomain(saved)
  }

  /**
   * Soft delete a review cycle
   * @param id - ReviewCycleId to delete
   */
  async delete(id: ReviewCycleId): Promise<void> {
    await this.prisma.reviewCycle.update({
      where: { id: id.value },
      data: { deletedAt: new Date() },
    })
  }
}
