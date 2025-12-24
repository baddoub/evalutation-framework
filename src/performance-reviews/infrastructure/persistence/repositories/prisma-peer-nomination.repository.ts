import { Injectable } from '@nestjs/common'
import {
  IPeerNominationRepository,
  PeerNomination,
} from '../../../domain/repositories/peer-nomination.repository.interface'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { PeerNomination as PrismaPeerNomination } from '@prisma/client'

/**
 * PrismaPeerNominationRepository
 *
 * Responsibilities:
 * - Implement IPeerNominationRepository using Prisma ORM
 * - Handle all PeerNomination persistence operations
 * - No soft delete for nominations (hard delete only)
 *
 * SOLID Principles:
 * - SRP: Only responsible for PeerNomination persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaPeerNominationRepository implements IPeerNominationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find peer nomination by ID
   * @param id - Nomination ID
   * @returns PeerNomination or null if not found
   */
  async findById(id: string): Promise<PeerNomination | null> {
    const prismaNomination = await this.prisma.peerNomination.findUnique({
      where: { id },
    })

    return prismaNomination ? this.toDomain(prismaNomination) : null
  }

  /**
   * Find all nominations made by a nominator in a cycle
   * @param nominatorId - UserId of nominator
   * @param cycleId - ReviewCycleId
   * @returns Array of PeerNomination
   */
  async findByNominatorAndCycle(
    nominatorId: UserId,
    cycleId: ReviewCycleId,
  ): Promise<PeerNomination[]> {
    const prismaNominations = await this.prisma.peerNomination.findMany({
      where: {
        nominatorId: nominatorId.value,
        cycleId: cycleId.value,
      },
      orderBy: { nominatedAt: 'desc' },
    })

    return prismaNominations.map((nom) => this.toDomain(nom))
  }

  /**
   * Find all nominations received by a nominee in a cycle
   * @param nomineeId - UserId of nominee
   * @param cycleId - ReviewCycleId
   * @returns Array of PeerNomination
   */
  async findByNomineeAndCycle(
    nomineeId: UserId,
    cycleId: ReviewCycleId,
  ): Promise<PeerNomination[]> {
    const prismaNominations = await this.prisma.peerNomination.findMany({
      where: {
        nomineeId: nomineeId.value,
        cycleId: cycleId.value,
      },
      orderBy: { nominatedAt: 'desc' },
    })

    return prismaNominations.map((nom) => this.toDomain(nom))
  }

  /**
   * Save (create or update) a peer nomination
   * @param nomination - PeerNomination to save
   * @returns Saved PeerNomination
   */
  async save(nomination: PeerNomination): Promise<PeerNomination> {
    const saved = await this.prisma.peerNomination.upsert({
      where: { id: nomination.id },
      create: {
        id: nomination.id,
        cycleId: nomination.cycleId.value,
        nominatorId: nomination.nominatorId.value,
        nomineeId: nomination.nomineeId.value,
        status: nomination.status,
        declineReason: nomination.declineReason ?? null,
        nominatedAt: nomination.nominatedAt,
        respondedAt: nomination.respondedAt ?? null,
      },
      update: {
        status: nomination.status,
        declineReason: nomination.declineReason ?? null,
        respondedAt: nomination.respondedAt ?? null,
      },
    })

    return this.toDomain(saved)
  }

  /**
   * Delete a peer nomination (hard delete)
   * @param id - Nomination ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.peerNomination.delete({
      where: { id },
    })
  }

  /**
   * Convert Prisma PeerNomination to domain PeerNomination
   * @param prisma - Prisma PeerNomination
   * @returns Domain PeerNomination
   */
  private toDomain(prisma: PrismaPeerNomination): PeerNomination {
    return {
      id: prisma.id,
      cycleId: ReviewCycleId.fromString(prisma.cycleId),
      nominatorId: UserId.fromString(prisma.nominatorId),
      nomineeId: UserId.fromString(prisma.nomineeId),
      status: prisma.status as 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'OVERRIDDEN_BY_MANAGER',
      declineReason: prisma.declineReason ?? undefined,
      nominatedAt: prisma.nominatedAt,
      respondedAt: prisma.respondedAt ?? undefined,
    }
  }
}
