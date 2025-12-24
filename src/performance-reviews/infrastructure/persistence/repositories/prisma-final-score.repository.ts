import { Injectable } from '@nestjs/common'
import { IFinalScoreRepository } from '../../../domain/repositories/final-score.repository.interface'
import { FinalScore, FinalScoreId } from '../../../domain/entities/final-score.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { BonusTier } from '../../../domain/value-objects/bonus-tier.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { FinalScoreMapper } from '../mappers/final-score.mapper'

/**
 * PrismaFinalScoreRepository
 *
 * Responsibilities:
 * - Implement IFinalScoreRepository using Prisma ORM
 * - Handle all FinalScore persistence operations
 * - Implement soft delete pattern
 *
 * SOLID Principles:
 * - SRP: Only responsible for FinalScore persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaFinalScoreRepository implements IFinalScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find final score by ID
   * @param id - FinalScoreId
   * @returns FinalScore entity or null if not found
   */
  async findById(id: FinalScoreId): Promise<FinalScore | null> {
    const prismaScore = await this.prisma.finalScore.findUnique({
      where: { id: id.value, deletedAt: null },
    })

    return prismaScore ? FinalScoreMapper.toDomain(prismaScore) : null
  }

  /**
   * Find final score by user and cycle
   * @param userId - UserId
   * @param cycleId - ReviewCycleId
   * @returns FinalScore entity or null if not found
   */
  async findByUserAndCycle(userId: UserId, cycleId: ReviewCycleId): Promise<FinalScore | null> {
    const prismaScore = await this.prisma.finalScore.findUnique({
      where: {
        cycleId_userId: {
          cycleId: cycleId.value,
          userId: userId.value,
        },
        deletedAt: null,
      },
    })

    return prismaScore ? FinalScoreMapper.toDomain(prismaScore) : null
  }

  /**
   * Find final score by employee and cycle (alias for findByUserAndCycle)
   * @param employeeId - UserId
   * @param cycleId - ReviewCycleId
   * @returns FinalScore entity or null if not found
   */
  async findByEmployeeAndCycle(
    employeeId: UserId,
    cycleId: ReviewCycleId,
  ): Promise<FinalScore | null> {
    return this.findByUserAndCycle(employeeId, cycleId)
  }

  /**
   * Find all final scores for a cycle
   * @param cycleId - ReviewCycleId
   * @returns Array of FinalScore entities
   */
  async findByCycle(cycleId: ReviewCycleId): Promise<FinalScore[]> {
    const prismaScores = await this.prisma.finalScore.findMany({
      where: { cycleId: cycleId.value, deletedAt: null },
      orderBy: { weightedScore: 'desc' },
    })

    return prismaScores.map((score) => FinalScoreMapper.toDomain(score))
  }

  /**
   * Find all final scores by bonus tier in a cycle
   * @param cycleId - ReviewCycleId
   * @param tier - BonusTier
   * @returns Array of FinalScore entities
   */
  async findByBonusTier(cycleId: ReviewCycleId, tier: BonusTier): Promise<FinalScore[]> {
    const prismaScores = await this.prisma.finalScore.findMany({
      where: {
        cycleId: cycleId.value,
        bonusTier: tier.value,
        deletedAt: null,
      },
      orderBy: { weightedScore: 'desc' },
    })

    return prismaScores.map((score) => FinalScoreMapper.toDomain(score))
  }

  /**
   * Save (create or update) a final score
   * @param score - FinalScore entity to save
   * @returns Saved FinalScore entity
   */
  async save(score: FinalScore): Promise<FinalScore> {
    const prismaData = FinalScoreMapper.toPrisma(score)

    const saved = await this.prisma.finalScore.upsert({
      where: { id: score.id.value },
      create: prismaData,
      update: prismaData,
    })

    return FinalScoreMapper.toDomain(saved)
  }

  /**
   * Soft delete a final score
   * @param id - FinalScoreId to delete
   */
  async delete(id: FinalScoreId): Promise<void> {
    await this.prisma.finalScore.update({
      where: { id: id.value },
      data: { deletedAt: new Date() },
    })
  }
}
