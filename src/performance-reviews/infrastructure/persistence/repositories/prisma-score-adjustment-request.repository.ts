import { Injectable } from '@nestjs/common'
import {
  IScoreAdjustmentRequestRepository,
  ScoreAdjustmentRequest,
} from '../../../domain/repositories/score-adjustment-request.repository.interface'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PillarScores } from '../../../domain/value-objects/pillar-scores.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { ScoreAdjustmentRequest as PrismaScoreAdjustmentRequest } from '@prisma/client'

/**
 * PrismaScoreAdjustmentRequestRepository
 *
 * Responsibilities:
 * - Implement IScoreAdjustmentRequestRepository using Prisma ORM
 * - Handle all ScoreAdjustmentRequest persistence operations
 * - No soft delete for requests (hard delete only)
 *
 * SOLID Principles:
 * - SRP: Only responsible for ScoreAdjustmentRequest persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaScoreAdjustmentRequestRepository implements IScoreAdjustmentRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find score adjustment request by ID
   * @param id - Request ID
   * @returns ScoreAdjustmentRequest or null if not found
   */
  async findById(id: string): Promise<ScoreAdjustmentRequest | null> {
    const prismaRequest = await this.prisma.scoreAdjustmentRequest.findUnique({
      where: { id },
    })

    return prismaRequest ? this.toDomain(prismaRequest) : null
  }

  /**
   * Find all pending score adjustment requests
   * @returns Array of pending ScoreAdjustmentRequest
   */
  async findPending(): Promise<ScoreAdjustmentRequest[]> {
    const prismaRequests = await this.prisma.scoreAdjustmentRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { requestedAt: 'desc' },
    })

    return prismaRequests.map((request) => this.toDomain(request))
  }

  /**
   * Find all score adjustment requests for an employee in a cycle
   * @param employeeId - UserId of employee
   * @param cycleId - ReviewCycleId
   * @returns Array of ScoreAdjustmentRequest
   */
  async findByEmployee(
    employeeId: UserId,
    cycleId: ReviewCycleId,
  ): Promise<ScoreAdjustmentRequest[]> {
    const prismaRequests = await this.prisma.scoreAdjustmentRequest.findMany({
      where: {
        employeeId: employeeId.value,
        cycleId: cycleId.value,
      },
      orderBy: { requestedAt: 'desc' },
    })

    return prismaRequests.map((request) => this.toDomain(request))
  }

  /**
   * Save (create or update) a score adjustment request
   * @param request - ScoreAdjustmentRequest to save
   * @returns Saved ScoreAdjustmentRequest
   */
  async save(request: ScoreAdjustmentRequest): Promise<ScoreAdjustmentRequest> {
    const saved = await this.prisma.scoreAdjustmentRequest.upsert({
      where: { id: request.id },
      create: {
        id: request.id,
        cycleId: request.cycleId.value,
        employeeId: request.employeeId.value,
        requesterId: request.requesterId.value,
        approverId: request.approverId?.value ?? null,
        reason: request.reason,
        status: request.status,
        proposedProjectImpact: request.proposedScores.projectImpact.value,
        proposedDirection: request.proposedScores.direction.value,
        proposedEngineeringExcellence: request.proposedScores.engineeringExcellence.value,
        proposedOperationalOwnership: request.proposedScores.operationalOwnership.value,
        proposedPeopleImpact: request.proposedScores.peopleImpact.value,
        requestedAt: request.requestedAt,
        reviewedAt: request.reviewedAt ?? null,
        rejectionReason: request.rejectionReason ?? null,
      },
      update: {
        approverId: request.approverId?.value ?? null,
        status: request.status,
        reviewedAt: request.reviewedAt ?? null,
        rejectionReason: request.rejectionReason ?? null,
      },
    })

    return this.toDomain(saved)
  }

  /**
   * Delete a score adjustment request (hard delete)
   * @param id - Request ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.scoreAdjustmentRequest.delete({
      where: { id },
    })
  }

  /**
   * Convert Prisma ScoreAdjustmentRequest to domain ScoreAdjustmentRequest
   * @param prisma - Prisma ScoreAdjustmentRequest
   * @returns Domain ScoreAdjustmentRequest
   */
  private toDomain(prisma: PrismaScoreAdjustmentRequest): ScoreAdjustmentRequest {
    const proposedScores = PillarScores.create({
      projectImpact: prisma.proposedProjectImpact,
      direction: prisma.proposedDirection,
      engineeringExcellence: prisma.proposedEngineeringExcellence,
      operationalOwnership: prisma.proposedOperationalOwnership,
      peopleImpact: prisma.proposedPeopleImpact,
    })

    const request: ScoreAdjustmentRequest = {
      id: prisma.id,
      cycleId: ReviewCycleId.fromString(prisma.cycleId),
      employeeId: UserId.fromString(prisma.employeeId),
      requesterId: UserId.fromString(prisma.requesterId),
      approverId: prisma.approverId ? UserId.fromString(prisma.approverId) : undefined,
      reason: prisma.reason,
      status: prisma.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      proposedScores,
      requestedAt: prisma.requestedAt,
      reviewedAt: prisma.reviewedAt ?? undefined,
      rejectionReason: prisma.rejectionReason ?? undefined,
      approve(reviewedBy: string, _reviewNotes?: string): void {
        request.status = 'APPROVED'
        request.approverId = UserId.fromString(reviewedBy)
        request.reviewedAt = new Date()
        request.rejectionReason = undefined
      },
      reject(reviewedBy: string, reviewNotes?: string): void {
        request.status = 'REJECTED'
        request.approverId = UserId.fromString(reviewedBy)
        request.reviewedAt = new Date()
        request.rejectionReason = reviewNotes
      },
    }

    return request
  }
}
