import { Injectable } from '@nestjs/common'
import {
  ICalibrationSessionRepository,
  CalibrationSession,
} from '../../../domain/repositories/calibration-session.repository.interface'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { CalibrationSession as PrismaCalibrationSession } from '@prisma/client'

/**
 * PrismaCalibrationSessionRepository
 *
 * Responsibilities:
 * - Implement ICalibrationSessionRepository using Prisma ORM
 * - Handle all CalibrationSession persistence operations
 * - No soft delete for sessions (hard delete only)
 *
 * SOLID Principles:
 * - SRP: Only responsible for CalibrationSession persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaCalibrationSessionRepository implements ICalibrationSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find calibration session by ID
   * @param id - Session ID
   * @returns CalibrationSession or null if not found
   */
  async findById(id: string): Promise<CalibrationSession | null> {
    const prismaSession = await this.prisma.calibrationSession.findUnique({
      where: { id },
    })

    return prismaSession ? this.toDomain(prismaSession) : null
  }

  /**
   * Find all calibration sessions for a cycle
   * @param cycleId - ReviewCycleId
   * @returns Array of CalibrationSession
   */
  async findByCycle(cycleId: ReviewCycleId): Promise<CalibrationSession[]> {
    const prismaSessions = await this.prisma.calibrationSession.findMany({
      where: { cycleId: cycleId.value },
      orderBy: { scheduledAt: 'desc' },
    })

    return prismaSessions.map((session) => this.toDomain(session))
  }

  /**
   * Find all calibration sessions by department in a cycle
   * @param cycleId - ReviewCycleId
   * @param department - Department name
   * @returns Array of CalibrationSession
   */
  async findByDepartment(
    cycleId: ReviewCycleId,
    department: string,
  ): Promise<CalibrationSession[]> {
    const prismaSessions = await this.prisma.calibrationSession.findMany({
      where: {
        cycleId: cycleId.value,
        department,
      },
      orderBy: { scheduledAt: 'desc' },
    })

    return prismaSessions.map((session) => this.toDomain(session))
  }

  /**
   * Save (create or update) a calibration session
   * @param session - CalibrationSession to save
   * @returns Saved CalibrationSession
   */
  async save(session: CalibrationSession): Promise<CalibrationSession> {
    const saved = await this.prisma.calibrationSession.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        cycleId: session.cycleId.value,
        name: session.name,
        department: session.department ?? null,
        facilitatorId: session.facilitatorId.value,
        participantIds: session.participantIds,
        scheduledAt: session.scheduledAt,
        completedAt: session.completedAt ?? null,
        status: session.status,
        notes: session.notes ?? null,
      },
      update: {
        name: session.name,
        department: session.department ?? null,
        participantIds: session.participantIds,
        scheduledAt: session.scheduledAt,
        completedAt: session.completedAt ?? null,
        status: session.status,
        notes: session.notes ?? null,
      },
    })

    return this.toDomain(saved)
  }

  /**
   * Delete a calibration session (hard delete)
   * @param id - Session ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.calibrationSession.delete({
      where: { id },
    })
  }

  /**
   * Convert Prisma CalibrationSession to domain CalibrationSession
   * @param prisma - Prisma CalibrationSession
   * @returns Domain CalibrationSession
   */
  private toDomain(prisma: PrismaCalibrationSession): CalibrationSession {
    return {
      id: prisma.id,
      cycleId: ReviewCycleId.fromString(prisma.cycleId),
      name: prisma.name,
      department: prisma.department ?? undefined,
      facilitatorId: UserId.fromString(prisma.facilitatorId),
      participantIds: prisma.participantIds,
      scheduledAt: prisma.scheduledAt,
      completedAt: prisma.completedAt ?? undefined,
      status: prisma.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED',
      notes: prisma.notes ?? undefined,
    }
  }
}
