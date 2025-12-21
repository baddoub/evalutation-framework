import { Injectable } from '@nestjs/common'
import { IPeerFeedbackRepository } from '../../../domain/repositories/peer-feedback.repository.interface'
import { PeerFeedback } from '../../../domain/entities/peer-feedback.entity'
import { PeerFeedbackId } from '../../../domain/value-objects/peer-feedback-id.vo'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { PeerFeedbackMapper } from '../mappers/peer-feedback.mapper'

/**
 * PrismaPeerFeedbackRepository
 *
 * Responsibilities:
 * - Implement IPeerFeedbackRepository using Prisma ORM
 * - Handle all PeerFeedback persistence operations
 * - Implement soft delete pattern
 *
 * SOLID Principles:
 * - SRP: Only responsible for PeerFeedback persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaPeerFeedbackRepository implements IPeerFeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find peer feedback by ID
   * @param id - PeerFeedbackId
   * @returns PeerFeedback entity or null if not found
   */
  async findById(id: PeerFeedbackId): Promise<PeerFeedback | null> {
    const prismaFeedback = await this.prisma.peerFeedback.findUnique({
      where: { id: id.value, deletedAt: null },
    })

    return prismaFeedback ? PeerFeedbackMapper.toDomain(prismaFeedback) : null
  }

  /**
   * Find all peer feedback for a reviewee in a cycle
   * @param revieweeId - UserId of reviewee
   * @param cycleId - ReviewCycleId
   * @returns Array of PeerFeedback entities
   */
  async findByRevieweeAndCycle(revieweeId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]> {
    const prismaFeedbacks = await this.prisma.peerFeedback.findMany({
      where: {
        revieweeId: revieweeId.value,
        cycleId: cycleId.value,
        deletedAt: null,
      },
      orderBy: { submittedAt: 'desc' },
    })

    return prismaFeedbacks.map((feedback) => PeerFeedbackMapper.toDomain(feedback))
  }

  /**
   * Find all peer feedback for an employee in a cycle (alias for findByRevieweeAndCycle)
   * @param employeeId - UserId of employee
   * @param cycleId - ReviewCycleId
   * @returns Array of PeerFeedback entities
   */
  async findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]> {
    return this.findByRevieweeAndCycle(employeeId, cycleId);
  }

  /**
   * Find all peer feedback given by a reviewer in a cycle
   * @param reviewerId - UserId of reviewer
   * @param cycleId - ReviewCycleId
   * @returns Array of PeerFeedback entities
   */
  async findByReviewerAndCycle(reviewerId: UserId, cycleId: ReviewCycleId): Promise<PeerFeedback[]> {
    const prismaFeedbacks = await this.prisma.peerFeedback.findMany({
      where: {
        reviewerId: reviewerId.value,
        cycleId: cycleId.value,
        deletedAt: null,
      },
      orderBy: { submittedAt: 'desc' },
    })

    return prismaFeedbacks.map((feedback) => PeerFeedbackMapper.toDomain(feedback))
  }

  /**
   * Save (create or update) peer feedback
   * @param feedback - PeerFeedback entity to save
   * @returns Saved PeerFeedback entity
   */
  async save(feedback: PeerFeedback): Promise<PeerFeedback> {
    const prismaData = PeerFeedbackMapper.toPrisma(feedback)

    const saved = await this.prisma.peerFeedback.upsert({
      where: { id: feedback.id.value },
      create: prismaData,
      update: prismaData,
    })

    return PeerFeedbackMapper.toDomain(saved)
  }

  /**
   * Soft delete peer feedback
   * @param id - PeerFeedbackId to delete
   */
  async delete(id: PeerFeedbackId): Promise<void> {
    await this.prisma.peerFeedback.update({
      where: { id: id.value },
      data: { deletedAt: new Date() },
    })
  }
}
